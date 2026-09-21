import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { speechSynthesis.speak = () => {}; });
  await page.goto('http://127.0.0.1:5178/');
  await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
  await page.getByRole('button', { name: /^英検準2級/ }).click();
  await page.getByRole('button', { name: /^Level 3/ }).click();
  for (const width of [1366, 820, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.getByRole('button', { name: /^決定/ }).click();
  await page.getByRole('button', { name: /Basic Training/ }).click();
  await page.locator('.battle-question-text').waitFor();
  const answer = (await page.locator('.battle-question-text').textContent()).replaceAll('\u00a0', ' ').trim();
  assert.ok(answer.length > 0);
  await page.locator('.battle-input').fill(answer);
  await page.waitForTimeout(1000);
  for (let i = 0; i < 10 && await page.locator('.battle-screen').count(); i++) {
    await page.getByRole('button', { name: 'この問題をスキップ', exact: true }).click();
    await page.waitForTimeout(150);
  }
  await page.locator('.result-today').waitFor();
  assert.ok((await page.locator('body').innerText()).includes('文法'));
  for (const width of [1366, 820, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.screenshot({ path: 'node_modules/.tmp/pre2-result.png' });
  await page.getByRole('button', { name: 'ホームへ', exact: true }).click();
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_last_selected_course')));
  assert.equal(saved.difficulty, 'EikenPre2');
  assert.equal(saved.level, 3);
  await page.getByRole('button', { name: /英語タイピングバトル/ }).click();
  assert.ok(await page.locator('option[value="EikenPre2"]').count());
  await page.getByLabel('プレイヤー1の教材', { exact: true }).selectOption('EikenPre2');
  await page.getByLabel('プレイヤー1のLevel', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: /バトルをはじめる/ }).click();
  await page.getByRole('button', { name: 'スタート', exact: true }).click();
  await page.waitForTimeout(200);
  assert.ok((await page.locator('body').innerText()).includes('プレイヤー1'));
  for (const level of [1, 2, 3]) {
    for (const [mode, inputMode] of [['guide', 'voice-text'], ['challenge', 'voice-text'], ['challenge', 'voice-only'], ['challenge', 'text-only']]) {
      await page.evaluate(({ level, mode, inputMode }) => {
        localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'EikenPre2', level, resumeMode: mode, resumeInputMode: inputMode }));
      }, { level, mode, inputMode });
      await page.reload();
      await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
      await page.locator('.battle-status-row').waitFor();
      await page.getByRole('button', { name: 'この問題をスキップ', exact: true }).click();
      await page.waitForTimeout(100);
      await page.getByRole('button', { name: 'トップに戻る', exact: true }).click();
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS Pre-2 selection, sentence battle, grammar result, responsive layout, reload, versus start and all 12 level/mode routes');
} finally { await browser.close(); }
