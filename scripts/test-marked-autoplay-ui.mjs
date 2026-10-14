import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionExample } = load('src/data/questionExamples.ts');
const common = QUESTIONS.Eiken5[1].find(q => QUESTIONS.Eiken4[1].some(other => other.text === q.text));
assert.ok(common, 'Fixture includes the same English in different courses');
const items = [
  { difficulty: 'Eiken5', level: 1, question: common, label: '英検5級' },
  { difficulty: 'Eiken4', level: 1, question: QUESTIONS.Eiken4[1].find(q => q.text === common.text), label: '英検4級' },
  { difficulty: 'Eiken3', level: 2, question: QUESTIONS.Eiken3[2][0], label: '英検3級' },
  { difficulty: 'Eiken3', level: 3, question: QUESTIONS.Eiken3[3][0], label: '英検3級' },
];
const excluded = { difficulty: 'Eiken3', level: 2, question: QUESTIONS.Eiken3[2][1] };
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
const output = 'node_modules/.tmp/marked-autoplay'; mkdirSync(output, { recursive: true });
try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ items, excluded }) => {
      window.spoken = []; window.utterances = [];
      speechSynthesis.speak = u => { window.spoken.push(u.text); window.utterances.push(u); };
      speechSynthesis.cancel = () => {};
      if (sessionStorage.getItem('marked-seeded')) return;
      sessionStorage.setItem('marked-seeded', '1');
      const key = item => `${item.difficulty}:${item.level}:${item.question.text}:${item.question.translation}`;
      const marked = {};
      for (const item of [...items, excluded]) (marked[`${item.difficulty}:${item.level}`] ??= []).push(key(item));
      marked['Eiken3:2'].push('obsolete-key');
      localStorage.setItem('etyping_marked_question_keys_by_scope', JSON.stringify(marked));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify({ [key(excluded)]: { excluded: true } }));
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken3', level: 2 }));
      // Legacy saved settings must remain scoped to the current level.
      localStorage.setItem('etyping_auto_play_settings', JSON.stringify({ source: 'marked', playText: true, playTranslation: true, playExample: true, itemGapSeconds: 0, questionGapSeconds: 0, repeat: false, shuffle: false }));
    }, { items, excluded });
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5189');
    await page.getByRole('button', { name: '連続再生の設定', exact: true }).click();
    const scope = page.getByRole('group', { name: 'あとで復習の再生範囲' });
    assert.equal(await scope.getByRole('button', { name: 'このLevel', exact: true }).getAttribute('aria-pressed'), 'true');
    const start = page.getByRole('button', { name: 'この設定で連続再生を開始', exact: true });
    const stop = page.getByRole('button', { name: '停止', exact: true });
    await page.getByRole('button', { name: /全級のあとで復習を再生 4語/ }).click();
    assert.equal(await scope.getByRole('button', { name: 'すべての級・Level', exact: true }).getAttribute('aria-pressed'), 'true');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await page.locator('[data-autoplay-course]').filter({ hasText: `${item.label} · Level ${item.level}` }).waitFor();
      assert.equal(await page.evaluate(() => window.spoken.at(-1)), item.question.text);
      const expected = [item.question.translation, getQuestionExample(item.difficulty, item.level, item.question)].filter(Boolean);
      for (const text of expected) {
        const n = await page.evaluate(() => { const n = window.spoken.length; window.utterances.at(-1).onend?.(new Event('end')); return n; });
        await page.waitForFunction(n => window.spoken.length > n, n);
        assert.equal(await page.evaluate(() => window.spoken.at(-1)), text, 'Meaning/example must belong to the originating course');
      }
      await page.getByRole('button', { name: '次の用語 →', exact: true }).click();
    }
    assert.ok(await start.isEnabled(), 'One complete pass ends without repeating');
    await scope.getByRole('button', { name: '級を選ぶ', exact: true }).click();
    assert.ok(await start.isDisabled(), 'No selected grades never falls back to all');
    const grades = page.getByRole('group', { name: '再生する級', exact: true });
    await grades.getByRole('checkbox', { name: /英検4級/ }).check();
    await grades.getByRole('checkbox', { name: /英検3級/ }).check();
    await start.click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検4級 · Level 1');
    await page.getByRole('button', { name: '次の用語 →', exact: true }).click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検3級 · Level 2');
    await page.getByRole('button', { name: '次の用語 →', exact: true }).click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検3級 · Level 3');
    await grades.getByRole('checkbox', { name: /英検3級/ }).uncheck();
    await page.locator('[data-autoplay-course]').waitFor({ state: 'detached' });
    assert.equal(await page.locator('[data-autoplay-course]').count(), 0, 'Changing scope stops the stale playback queue');
    await start.click(); await stop.click();
    await page.reload();
    await page.getByRole('button', { name: '連続再生', exact: true }).click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検4級 · Level 1', 'Title playback reuses selected grades');
    await stop.click();
    assert.equal(await grades.getByRole('checkbox', { name: /英検4級/ }).isChecked(), true);
    assert.equal(await grades.getByRole('checkbox', { name: /英検3級/ }).isChecked(), false);
    await page.locator('[data-marked-playback-scope]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/scope-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: quick start, all grades/levels, source examples, duplicate text, exclusions, selection/empty/stop, legacy defaults, saved settings and title playback`);
    await context.close();
  }
} finally { await cleanup(); }
