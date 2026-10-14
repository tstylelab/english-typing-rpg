import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const common = QUESTIONS.Eiken5[1].find(q => QUESTIONS.Eiken4[1].some(other => other.text === q.text));
const items = [
  { difficulty: 'Eiken5', level: 1, question: common, label: '英検5級' },
  { difficulty: 'Eiken4', level: 1, question: QUESTIONS.Eiken4[1].find(q => q.text === common.text), label: '英検4級' },
  { difficulty: 'Eiken3', level: 2, question: QUESTIONS.Eiken3[2][0], label: '英検3級' },
  { difficulty: 'Eiken3', level: 3, question: QUESTIONS.Eiken3[3][0], label: '英検3級' },
];
const key = item => `${item.difficulty}:${item.level}:${item.question.text}:${item.question.translation}`;
const marked = Object.fromEntries(items.map(item => [`${item.difficulty}:${item.level}`, [key(item)]]));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
const output = 'node_modules/.tmp/autoplay-review-removal'; mkdirSync(output, { recursive: true });
try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(marked => {
      window.utterances = [];
      speechSynthesis.speak = u => window.utterances.push(u);
      speechSynthesis.cancel = () => {};
      if (sessionStorage.getItem('removal-seeded')) return;
      sessionStorage.setItem('removal-seeded', '1');
      localStorage.setItem('etyping_marked_question_keys_by_scope', JSON.stringify(marked));
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken3', level: 2 }));
      localStorage.setItem('etyping_auto_play_settings', JSON.stringify({ source: 'marked', playbackScope: 'all', playText: true, playTranslation: true, playExample: true, itemGapSeconds: 0, questionGapSeconds: 0, repeat: true, shuffle: false }));
    }, marked);
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5189');
    await page.getByRole('button', { name: '連続再生の設定', exact: true }).click();
    const savedLearning = await page.evaluate(() => localStorage.getItem('etyping_manual_question_statuses'));
    await page.getByRole('button', { name: /全級のあとで復習を再生 4問/ }).click();
    const panel = page.locator('[data-autoplay-now-playing]');
    const remove = panel.getByRole('button', { name: '復習から外して次へ', exact: true });
    const next = panel.getByRole('button', { name: '次の問題 →', exact: true });
    const previous = panel.getByRole('button', { name: '← 前の問題', exact: true });
    await remove.scrollIntoViewIfNeeded();
    await panel.screenshot({ path: `${output}/controls-${width}.png` });
    // Remove during translation, not just at the beginning of the question.
    await page.evaluate(() => window.utterances.at(-1).onend?.(new Event('end')));
    await page.waitForFunction(() => window.utterances.length === 2);
    await remove.click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検4級 · Level 1');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope')));
    assert.deepEqual(saved['Eiken5:1'], []);
    assert.deepEqual(saved['Eiken4:1'], [key(items[1])], 'Same English in another grade stays bookmarked');
    await previous.click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検4級 · Level 1');
    await remove.click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検3級 · Level 2');
    await next.click(); await next.click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検3級 · Level 2', 'Repeat skips both removed grades');
    await remove.click(); await remove.click();
    assert.equal(await page.locator('[data-autoplay-course]').count(), 0);
    assert.ok(await page.getByRole('button', { name: 'この設定で連続再生を開始', exact: true }).isDisabled());
    assert.equal(await page.evaluate(() => localStorage.getItem('etyping_manual_question_statuses')), savedLearning, 'Removing a bookmark does not change learning status');
    await page.reload();
    await page.getByRole('button', { name: '連続再生の設定', exact: true }).click();
    assert.ok(await page.getByRole('button', { name: /全級のあとで復習を再生 0問/ }).isDisabled(), 'Removal persists after reload');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: current review removal, originating grade, previous/repeat, empty stop, persistence and learning status preserved`);
    await context.close();
  }
} finally { await cleanup(); }
