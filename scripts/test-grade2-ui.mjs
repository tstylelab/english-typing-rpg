import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { speechSynthesis.speak = () => {}; });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5180/');
  await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
  await page.getByRole('button', { name: /^英検2級/ }).click();
  await page.getByRole('button', { name: /^Level 3/ }).click();
  await page.getByRole('button', { name: /^決定/ }).click();
  await page.getByRole('button', { name: /Basic Training/ }).click();
  await page.locator('.battle-question-text').waitFor();
  for (let i = 0; i < 10 && await page.locator('.battle-screen').count(); i++) {
    await page.getByRole('button', { name: 'この問題をスキップ', exact: true }).click();
    await page.waitForTimeout(100);
  }
  await page.locator('.result-today').waitFor();
  assert.ok((await page.locator('body').innerText()).includes('文法'));
  await page.getByRole('button', { name: 'ホームへ', exact: true }).click();
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_last_selected_course')));
  assert.equal(saved.difficulty, 'Eiken2');
  assert.equal(saved.level, 3);
  await page.getByRole('button', { name: /英語タイピングバトル/ }).click();
  assert.ok(await page.locator('option[value="Eiken2"]').count());
  await page.getByLabel('プレイヤー1の教材', { exact: true }).selectOption('Eiken2');
  for (const level of [1, 2, 3]) {
    for (const [mode, inputMode] of [['guide', 'voice-text'], ['challenge', 'voice-text'], ['challenge', 'voice-only'], ['challenge', 'text-only']]) {
      await page.evaluate(({ level, mode, inputMode }) => {
        localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken2', level, resumeMode: mode, resumeInputMode: inputMode }));
      }, { level, mode, inputMode });
      await page.reload();
      await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
      await page.locator('.battle-status-row').waitFor();
      await page.getByRole('button', { name: 'この問題をスキップ', exact: true }).click();
      await page.getByRole('button', { name: 'トップに戻る', exact: true }).click();
    }
  }
  for (const width of [1366, 820, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  assert.deepEqual(errors, []);
  console.log('Grade 2 UI: select, grammar result, reload, versus option, 12 mode routes and responsive widths passed.');
} finally { await browser.close(); }
