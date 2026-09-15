// Isolated, muted local-browser test. No real clipboard or external AI requests.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const questions = JSON.parse(readFileSync(new URL('../src/data/questionSets/eiken/grade5.json', import.meta.url), 'utf8')).levels['1'];
const url = process.env.AI_REVIEW_TEST_URL || 'http://127.0.0.1:5178';
if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('Local server only');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(questions => {
    localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map(q => [`Eiken5:1:${q.text}:${q.translation}`, {
      practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: q.text !== 'Wednesday', updatedAt: 0,
    }]))));
    speechSynthesis.speak = () => {};
    navigator.clipboard.writeText = async text => { window.copied = text; };
    window.openCalls = [];
    window.open = (...args) => { window.openCalls.push(args); return null; };
  }, questions);
  await page.goto(url);
  await page.getByRole('button', { name: '教材を選んではじめる', exact: true }).click();
  await page.getByRole('button', { name: '決定', exact: true }).click();
  await page.getByRole('button', { name: /Basic Training/ }).click();
  const input = page.locator('.battle-input');
  const copy = page.getByRole('button', { name: '相談文を作ってコピー', exact: true });
  for (let i = 0; i < 25 && !await copy.count(); i++) {
    await input.waitFor({ state: 'attached' });
    if (i === 0) await input.fill('z');
    await input.fill('Wednesday');
    await page.waitForFunction(() => !document.querySelector('.battle-input') || document.querySelector('.battle-input').value === '');
    await page.waitForTimeout(150);
  }
  await copy.waitFor();
  await copy.focus(); await page.keyboard.press('Enter');
  await page.getByRole('status').filter({ hasText: 'コピーしました' }).waitFor();
  assert.ok((await page.evaluate(() => window.copied)).includes('今回ミスした語1件'));
  assert.equal(await input.count(), 0, 'Enter on consultation must not start next battle');
  for (const name of ['ChatGPT', 'Gemini']) {
    await page.getByRole('button', { name: `コピーして${name}を開く`, exact: true }).click();
  }
  assert.equal(await page.evaluate(() => window.openCalls.length), 2);
  await page.setViewportSize({ width: 390, height: 844 });
  await copy.scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.ok(await copy.isVisible());
  if (process.env.AI_RESULT_SCREENSHOT) await page.screenshot({ path: process.env.AI_RESULT_SCREENSHOT, fullPage: true });
  await page.getByRole('button', { name: '設定', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'AIに学習相談' });
  await dialog.waitFor();
  await dialog.getByRole('combobox').selectOption('week');
  await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
  await copy.click();
  assert.ok((await page.evaluate(() => window.copied)).includes('過去7日間'), 'Settings period shared with inline actions');
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
  await page.getByRole('button', { name: 'コピーしてGeminiを開く', exact: true }).click();
  await page.getByRole('textbox', { name: 'AIへの相談文' }).waitFor();
  assert.equal(await page.evaluate(() => window.openCalls.length), 2);
  assert.deepEqual(errors, []);
  console.log('PASS: real battle result, session evidence, three actions, keyboard, mobile, settings, copy-denied fallback.');
} finally { await browser.close(); }
