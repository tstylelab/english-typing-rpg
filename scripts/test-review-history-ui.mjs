import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const common = QUESTIONS.Eiken5[1].find(q => QUESTIONS.Eiken4[1].some(other => other.text === q.text));
const items = [common, QUESTIONS.Eiken4[1].find(q => q.text === common.text)];
const keys = items.map((q, i) => `Eiken${i === 0 ? 5 : 4}:1:${q.text}:${q.translation}`);
const historyKey = 'etyping_review_history_keys_by_scope';
const markedKey = 'etyping_marked_question_keys_by_scope';
const output = 'node_modules/.tmp/review-history'; mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
const url = process.env.TEST_URL || 'http://127.0.0.1:5190';
const stored = (page, key) => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), key);
const showHistory = async page => {
  await page.getByRole('group', { name: '問題リストの絞り込み', exact: true }).getByRole('button', { name: 'あとで復習', exact: true }).click();
  await page.getByRole('group', { name: 'あとで復習の表示', exact: true }).getByRole('button', { name: /^解除履歴/ }).click();
};
try {
  for (const width of [1366, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ keys, markedKey }) => {
      window.spoken = [];
      speechSynthesis.speak = u => window.spoken.push(u);
      speechSynthesis.cancel = () => {};
      if (sessionStorage.getItem('history-seeded')) return;
      sessionStorage.setItem('history-seeded', '1');
      localStorage.setItem(markedKey, JSON.stringify({ 'Eiken5:1': [keys[0]], 'Eiken4:1': [keys[1]] }));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify({ [keys[0]]: { practiceLevel: 2, listeningLevel: 3, battleLevel: 3, manualOverrideLevel: null, excluded: false, updatedAt: 123456 } }));
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken5', level: 1 }));
      localStorage.setItem('etyping_auto_play_settings', JSON.stringify({ source: 'marked', playbackScope: 'all', playText: true, playTranslation: true, playExample: true, repeat: true, shuffle: false }));
    }, { keys, markedKey });
    await page.goto(url);
    // Old saves have no history; do not manufacture removed entries.
    await page.getByRole('button', { name: '問題リスト', exact: true }).click();
    await showHistory(page);
    assert.equal(await page.locator('.question-list-row').count(), 0);
    await page.getByRole('button', { name: '← タイトルへ', exact: true }).click();
    await page.getByRole('button', { name: '連続再生', exact: true }).click();
    const learningBefore = await stored(page, 'etyping_manual_question_statuses');
    const remove = page.getByRole('button', { name: '復習から外して次へ', exact: true });
    await remove.click();
    assert.deepEqual((await stored(page, historyKey))['Eiken5:1'], [keys[0]]);
    assert.deepEqual((await stored(page, markedKey))['Eiken4:1'], [keys[1]], 'Same word in another grade is separate');
    await remove.click();
    assert.deepEqual((await stored(page, historyKey))['Eiken4:1'], [keys[1]]);
    await showHistory(page);
    const row = page.locator('.question-list-row');
    assert.equal(await row.count(), 1);
    await row.getByRole('button', { name: 'あとで復習に戻す', exact: true }).click();
    assert.deepEqual((await stored(page, historyKey))['Eiken5:1'], []);
    await page.getByRole('group', { name: 'あとで復習の表示', exact: true }).getByRole('button', { name: /^復習中/ }).click();
    assert.equal(await page.getByRole('button', { name: '履歴から消す', exact: true }).count(), 0);
    await row.getByRole('button', { name: '復習から外す', exact: true }).click();
    await showHistory(page);
    assert.deepEqual((await stored(page, historyKey))['Eiken5:1'], [keys[0]], 'Repeated registration/removal stays a single entry');
    await row.getByRole('button', { name: '履歴から消す', exact: true }).click();
    assert.equal(await row.count(), 0);
    await page.getByRole('button', { name: '元に戻す', exact: true }).click();
    assert.equal(await row.count(), 1);
    await page.locator('[data-review-history-controls]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/history-list-${width}.png` });
    await page.getByRole('button', { name: 'このLevelの履歴を再生', exact: true }).click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検5級 · Level 1');
    // Editing the list during history playback must not leave a stale repeat queue.
    await row.getByRole('button', { name: 'あとで復習に戻す', exact: true }).click();
    assert.equal(await page.locator('[data-autoplay-course]').count(), 0);
    await page.getByRole('group', { name: 'あとで復習の表示', exact: true }).getByRole('button', { name: /^復習中/ }).click();
    await row.getByRole('button', { name: '復習から外す', exact: true }).click();
    await showHistory(page);
    await page.getByRole('button', { name: /全級の解除履歴を再生 2問/ }).click();
    const now = page.locator('[data-autoplay-now-playing]');
    assert.equal(await now.getByRole('button', { name: '履歴から消す', exact: true }).count(), 0, 'Never show history deletion in the player');
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検5級 · Level 1');
    await now.getByRole('button', { name: '次の問題 →', exact: true }).click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検4級 · Level 1');
    await now.getByRole('button', { name: 'あとで復習に戻して次へ', exact: true }).click();
    assert.deepEqual((await stored(page, markedKey))['Eiken4:1'], [keys[1]]);
    assert.deepEqual((await stored(page, historyKey))['Eiken4:1'], []);
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検5級 · Level 1');
    // Selected-grade playback uses the history source and never pulls active reviews.
    await page.getByRole('button', { name: '設定を変える', exact: true }).click();
    await page.getByRole('group', { name: '連続再生の対象範囲', exact: true }).getByRole('button', { name: '級を選ぶ', exact: true }).click();
    await page.getByRole('group', { name: '再生する級', exact: true }).getByRole('checkbox', { name: /英検5級/ }).check();
    await page.getByRole('button', { name: 'この設定で連続再生を開始', exact: true }).click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検5級 · Level 1');
    await page.reload();
    await page.getByRole('button', { name: '連続再生', exact: true }).click();
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検5級 · Level 1', 'History source and selected grades persist');
    await page.getByRole('button', { name: '停止', exact: true }).click();
    await showHistory(page);
    await row.getByRole('button', { name: '履歴から消す', exact: true }).click();
    // Delete persists across reload, with the underlying learning state untouched.
    await page.reload(); await page.getByRole('button', { name: '問題リスト', exact: true }).click(); await showHistory(page);
    assert.equal(await row.count(), 0);
    assert.deepEqual(await stored(page, 'etyping_manual_question_statuses'), learningBefore);
    assert.equal(await page.getByRole('button', { name: '元に戻す', exact: true }).count(), 0);
    // Normal list still contains the problem and allows fresh registration.
    await page.getByRole('group', { name: '問題リストの絞り込み', exact: true }).getByRole('button', { name: 'すべて', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: '履歴から消す', exact: true }).count(), 0);
    const originalRow = page.locator('.question-list-row').filter({ has: page.locator('.word-list-term').getByText(common.text, { exact: true }) });
    await originalRow.getByRole('button', { name: 'あとで復習', exact: true }).click();
    await originalRow.getByRole('button', { name: '復習から外す', exact: true }).click();
    assert.deepEqual((await stored(page, historyKey))['Eiken5:1'], [keys[0]]);
    if (width === 1366) {
      await page.getByRole('button', { name: '← タイトルへ', exact: true }).click();
      await page.getByRole('button', { name: '設定', exact: true }).click();
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: '学習データを書き出す', exact: true }).click();
      const download = await downloadEvent; const data = JSON.parse(readFileSync(await download.path(), 'utf8'));
      assert.deepEqual(data.player.data.reviewHistoryKeysByScope['Eiken5:1'], [keys[0]]);
      const firstId = data.player.id;
      await page.getByPlaceholder('新しいプレイヤー名').fill('History second player');
      await page.getByRole('button', { name: '新規作成', exact: true }).click();
      assert.deepEqual(await stored(page, historyKey), {}, 'New player starts empty');
      await page.getByRole('button', { name: '切り替える', exact: true }).filter({ visible: true }).all().then(async buttons => {
        for (const button of buttons) if (await button.isEnabled()) { await button.click(); break; }
      });
      assert.equal(await page.evaluate(() => localStorage.getItem('etyping_active_player_id')), firstId);
      assert.deepEqual((await stored(page, historyKey))['Eiken5:1'], [keys[0]], 'Switching back retains history');
      await page.getByRole('button', { name: '履歴をリセット', exact: true }).click();
      await page.getByRole('button', { name: 'Yes', exact: true }).click();
      assert.deepEqual(await stored(page, historyKey), {});
      await page.locator('input[type=file]').setInputFiles({ name: 'restore.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
      await page.waitForFunction(({ historyKey, key }) => JSON.parse(localStorage.getItem(historyKey) || '{}')['Eiken5:1']?.includes(key), { historyKey, key: keys[0] });
      assert.deepEqual((await stored(page, markedKey))['Eiken4:1'], [keys[1]]);
      // Importing older data without the new field remains supported.
      delete data.player.data.reviewHistoryKeysByScope;
      data.player.id = 'legacy-import'; data.player.name = 'Legacy import';
      await page.locator('input[type=file]').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
      await page.waitForFunction(() => localStorage.getItem('etyping_active_player_id') === 'legacy-import');
      assert.deepEqual(await stored(page, historyKey), {});
      console.log('PASS player isolation, JSON export/import, reset, legacy import');
    }
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    console.log(`PASS ${width}px: remove/restore/delete/undo/reload, scoped history playback, same word in two grades, no learning changes`);
    await context.close();
  }
} finally { await cleanup(); }
