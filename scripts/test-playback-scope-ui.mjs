import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const grades = ['Eiken5', 'Eiken4', 'Eiken3'];
const items = grades.map((difficulty, i) => ({ difficulty, level: i + 1, question: QUESTIONS[difficulty][i + 1][0] }));
const excluded = { difficulty: 'Eiken4', level: 2, question: QUESTIONS.Eiken4[2][1] };
const key = item => `${item.difficulty}:${item.level}:${item.question.text}:${item.question.translation}`;
const all = Object.entries(QUESTIONS).flatMap(([difficulty, levels]) => Object.entries(levels).flatMap(([level, questions]) => questions.map(question => ({ difficulty, level: Number(level), question }))));
const labels = { all: 'すべての問題', weak: '苦手語だけ', marked: 'あとで復習', selected: '自分で選んだ語', learning: '学習中だけ', caution: 'もう少しだけ', mastered: '覚えただけ' };
const weakTexts = new Set(items.map(item => item.question.text));
function expected(source, scope) {
  return all.filter(item => {
    if (key(item) === key(excluded)) return false;
    if (scope === 'current' && (item.difficulty !== 'Eiken5' || item.level !== 1)) return false;
    if (scope === 'selected' && !['Eiken4', 'Eiken3'].includes(item.difficulty)) return false;
    if (source === 'all') return true;
    if (source === 'weak') return weakTexts.has(item.question.text);
    if (source === 'marked' || source === 'selected') return items.some(i => key(i) === key(item));
    if (source === 'caution') return key(item) === key(items[1]);
    if (source === 'mastered') return key(item) === key(items[2]);
    return key(item) !== key(items[1]) && key(item) !== key(items[2]);
  });
}
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
mkdirSync('node_modules/.tmp/playback-scope', { recursive: true });
try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(({ items, excluded }) => {
      window.spoken = []; speechSynthesis.speak = u => window.spoken.push(u.text); speechSynthesis.cancel = () => {};
      if (sessionStorage.getItem('scope-seeded')) return;
      sessionStorage.setItem('scope-seeded', '1');
      const key = item => `${item.difficulty}:${item.level}:${item.question.text}:${item.question.translation}`;
      const keys = {};
      for (const item of [...items, excluded]) (keys[`${item.difficulty}:${item.level}`] ??= []).push(key(item));
      localStorage.setItem('etyping_marked_question_keys_by_scope', JSON.stringify(keys));
      localStorage.setItem('etyping_selected_question_keys_by_scope', JSON.stringify(keys));
      localStorage.setItem('etyping_weak_questions', JSON.stringify(items.map(i => i.question)));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify({
        [key(excluded)]: { excluded: true },
        [key(items[1])]: { manualOverrideLevel: 2 },
        [key(items[2])]: { battleLevel: 3 },
      }));
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken5', level: 1 }));
      // Migrate the just-released marked-only settings without losing grade choices.
      localStorage.setItem('etyping_auto_play_settings', JSON.stringify({ source: 'marked', markedScope: 'selected', markedDifficulties: ['Eiken4', 'Eiken3'], playText: true, playTranslation: false, playExample: false }));
    }, { items, excluded });
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5189');
    await page.getByRole('button', { name: '連続再生の設定', exact: true }).click();
    const scopeControls = page.getByRole('group', { name: '連続再生の対象範囲', exact: true });
    assert.equal(await scopeControls.getByRole('button', { name: '級を選ぶ', exact: true }).getAttribute('aria-pressed'), 'true');
    const choose = page.getByRole('group', { name: '再生する級', exact: true });
    assert.ok(await choose.getByRole('checkbox', { name: /英検4級/ }).isChecked());
    const start = page.getByRole('button', { name: 'この設定で連続再生を開始', exact: true });
    const stop = page.getByRole('button', { name: '停止', exact: true });
    for (const [scope, button] of [['current', 'このLevel'], ['all', 'すべての級・Level'], ['selected', '級を選ぶ']]) {
      await scopeControls.getByRole('button', { name: button, exact: true }).click();
      for (const [source, label] of Object.entries(labels)) {
        const target = expected(source, scope);
        const sourceButton = page.getByRole('button', { name: new RegExp(`^${label} \\d+語`) });
        assert.match(await sourceButton.innerText(), new RegExp(`\\b${target.length}語`), `${source}/${scope} count`);
        await sourceButton.click();
        if (!target.length) { assert.ok(await start.isDisabled()); continue; }
        await start.click();
        assert.equal(await page.evaluate(() => window.spoken.at(-1)), target[0].question.text, `${source}/${scope} first item`);
        if (source === 'selected' || source === 'marked') {
          for (const item of target.slice(1)) {
            await page.getByRole('button', { name: '次の用語 →', exact: true }).click();
            assert.equal(await page.evaluate(() => window.spoken.at(-1)), item.question.text);
            assert.match(await page.locator('[data-autoplay-course]').innerText(), new RegExp(`Level ${item.level}`));
          }
        }
        await stop.click();
      }
    }
    await page.getByRole('button', { name: /^自分で選んだ語 \d+語/ }).click();
    await page.reload();
    await page.getByRole('button', { name: '連続再生', exact: true }).click();
    assert.equal(await page.evaluate(() => window.spoken.at(-1)), items[1].question.text, 'Title reuses multi-grade selected words');
    await stop.click();
    await choose.getByRole('checkbox', { name: /英検4級/ }).uncheck();
    await choose.getByRole('checkbox', { name: /英検3級/ }).uncheck();
    for (const label of Object.values(labels)) {
      await page.getByRole('button', { name: new RegExp(`^${label} 0語`) }).click();
      assert.ok(await start.isDisabled(), `${label}: empty grade selection never falls back`);
    }
    await scopeControls.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `node_modules/.tmp/playback-scope/scope-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: 7 sources x 3 scopes, counts/playback, exclusions, selected words across levels, old-settings migration, title playback, empty scopes`);
    await context.close();
  }
} finally { await cleanup(); }
