import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const url = process.env.BACKUP_TEST_URL || 'http://127.0.0.1:5178';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const closeBrowser = await trackTestBrowser(browser);
const errors = [];
const questions = QUESTIONS.Eiken5[1];
const answer = questions.find(q => /^[a-z]+$/.test(q.text)).text;
const dialog = page => page.getByRole('dialog', { name: 'そろそろデータを書き出しませんか？' });
async function setup({ count = 200, width = 1366, ack = '', reduced = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference', acceptDownloads: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ count, ack, questions, answer }) => {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    speechSynthesis.speak = () => {};
    if (localStorage.getItem('backup-test-seeded')) return;
    localStorage.setItem('backup-test-seeded', '1');
    const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
    const data = { dailyProgress: { date, questionCount: count }, dailyActivityHistory: { [date]: { answered: count, skipped: 0 } }, manualQuestionStatuses: Object.fromEntries(questions.map(q => [`Eiken5:1:${q.text}:${q.translation}`, { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: q.text !== answer, updatedAt: 0 }])) };
    localStorage.setItem('etyping_player_profiles', JSON.stringify([{ id: 'backup-player', name: 'Backup Test', updatedAt: Date.now(), data }]));
    localStorage.setItem('etyping_active_player_id', 'backup-player');
    localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken5', level: 1, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
    localStorage.setItem('etyping_external_keyboard_mode', 'true');
    if (ack) localStorage.setItem('etyping_backup_reminder:backup-player', ack === 'today' ? date : ack);
  }, { count, ack, questions, answer });
  await page.goto(url);
  return { page, context };
}
async function start(page) {
  await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
  await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
  await page.getByRole('button', { name: /Translation Battle/ }).click();
  await page.locator('.battle-input').waitFor();
  assert.equal(await dialog(page).count(), 0, 'No interruption while playing');
}
async function finish(page, { win = false, answerOnce = true } = {}) {
  if (answerOnce) { await page.locator('.battle-input').fill(answer); await page.waitForTimeout(450); }
  for (let n = 0; n < 40 && await page.locator('.battle-input').count(); n++) {
    if (win) await page.locator('.battle-input').fill(answer);
    else await page.getByRole('button', { name: 'この問題をスキップ', exact: true }).click();
    await page.waitForTimeout(180);
  }
  await page.locator('.result-today').waitFor();
}
try {
  // Strict boundary and skips are excluded from the answered count.
  for (const scenario of [{ count: 199 }, { count: 200, answerOnce: false }, { count: 220, ack: 'today' }]) {
    const { page, context } = await setup(scenario);
    await start(page); await finish(page, scenario);
    await page.waitForTimeout(2500);
    assert.equal(await dialog(page).count(), 0);
    await context.close();
  }
  console.log('PASS 200 boundary, skip exclusion, prior acknowledgement');

  const { page, context } = await setup({ width: 390 });
  await start(page); await finish(page);
  await dialog(page).waitFor();
  assert.match(await dialog(page).innerText(), /201問/);
  const box = await dialog(page).boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 900);
  assert.equal(await page.getByRole('button', { name: '今日はあとで', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.getByRole('button', { name: 'データを書き出す', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Escape');
  await dialog(page).waitFor({ state: 'detached' });
  const ack = await page.evaluate(() => localStorage.getItem('etyping_backup_reminder:backup-player'));
  assert.match(ack, /^\d{4}-\d{2}-\d{2}$/);
  await page.getByRole('button', { name: 'ホームへ', exact: true }).click();
  await page.reload();
  await start(page); await finish(page);
  await page.waitForTimeout(2500);
  assert.equal(await dialog(page).count(), 0, 'Dismiss survives reload and repeated results');
  await context.close();
  console.log('PASS mobile geometry, focus trap, Escape, persistent daily dismissal');

  const next = await setup({ ack: '2000-01-01', reduced: false });
  await start(next.page); await finish(next.page, { win: true });
  await next.page.locator('[data-monster-reveal="defeat"].is-playing').waitFor();
  await next.page.evaluate(() => {
    for (const node of document.querySelectorAll('[data-monster-reveal="defeat"], [data-monster-reveal-backdrop="defeat"]')) {
      for (const animation of node.getAnimations({ subtree: true })) animation.pause();
    }
  });
  await next.page.waitForTimeout(2500);
  assert.equal(await dialog(next.page).count(), 0, 'A late CLEAR must not be covered by the prompt');
  await next.page.evaluate(() => {
    for (const node of document.querySelectorAll('[data-monster-reveal="defeat"], [data-monster-reveal-backdrop="defeat"]')) {
      for (const animation of node.getAnimations({ subtree: true })) animation.play();
    }
  });
  await dialog(next.page).waitFor();
  assert.equal(await next.page.locator('[data-monster-reveal="defeat"]').count(), 0, 'CLEAR must finish first');
  mkdirSync('node_modules/.tmp/backup-reminder', { recursive: true });
  await next.page.screenshot({ path: 'node_modules/.tmp/backup-reminder/desktop.png' });
  await next.page.evaluate(() => { window.originalCreateObjectURL = URL.createObjectURL; URL.createObjectURL = () => { throw new Error('Simulated download failure'); }; });
  await next.page.getByRole('button', { name: 'データを書き出す', exact: true }).click();
  await next.page.getByRole('alert').waitFor();
  assert.equal(await dialog(next.page).count(), 1, 'Failure must not dismiss reminder');
  assert.equal(await next.page.evaluate(() => localStorage.getItem('etyping_backup_reminder:backup-player')), '2000-01-01');
  await next.page.evaluate(() => { URL.createObjectURL = window.originalCreateObjectURL; });
  const pending = next.page.waitForEvent('download');
  await next.page.getByRole('button', { name: 'データを書き出す', exact: true }).click();
  const download = await pending;
  const payload = JSON.parse(readFileSync(await download.path(), 'utf8'));
  assert.equal(payload.formatVersion, 3);
  assert.equal(payload.player.id, 'backup-player');
  assert.ok(payload.player.data.dailyActivityHistory[ack].answered > 200);
  assert.ok(payload.player.data.defeatedMonsterIds.length > 0, 'Export includes just-earned victory');
  assert.ok(payload.player.data.manualQuestionStatuses && payload.player.data.autoPlaySettings);
  await dialog(next.page).waitFor({ state: 'detached' });
  await next.context.close();
  console.log('PASS next day, victory sequencing, failure retry, actual compatible JSON download');

  const cancelled = await setup({ count: 230 });
  await start(cancelled.page); await finish(cancelled.page);
  await cancelled.page.getByRole('button', { name: 'ホームへ', exact: true }).click();
  await cancelled.page.waitForTimeout(2500);
  assert.equal(await dialog(cancelled.page).count(), 0, 'Leaving result cancels pending popup');
  await cancelled.context.close();
  const separate = await setup({ count: 240, ack: 'today' });
  await separate.page.evaluate(() => {
    const profiles = JSON.parse(localStorage.getItem('etyping_player_profiles'));
    profiles.push({ ...profiles[0], id: 'other-player', name: 'Other Player' });
    localStorage.setItem('etyping_player_profiles', JSON.stringify(profiles));
    localStorage.setItem('etyping_active_player_id', 'other-player');
  });
  await separate.page.reload();
  await start(separate.page); await finish(separate.page);
  await dialog(separate.page).waitFor();
  await separate.page.getByRole('button', { name: '今日はあとで', exact: true }).click();
  await separate.context.close();
  console.log('PASS separate players on shared device');

  const manual = await setup({ count: 240 });
  await manual.page.getByRole('button', { name: '設定', exact: true }).click();
  const manualDownload = manual.page.waitForEvent('download');
  await manual.page.getByRole('button', { name: '学習データを書き出す', exact: true }).click();
  assert.equal(await (await manualDownload).failure(), null);
  await manual.page.reload();
  await start(manual.page); await finish(manual.page);
  await manual.page.waitForTimeout(2500);
  assert.equal(await dialog(manual.page).count(), 0, 'Settings export also suppresses reminder for today');
  await manual.context.close();
  console.log('PASS prior manual export');
  assert.deepEqual(errors, []);
  console.log('PASS cancellation, no runtime errors');
} finally { await closeBrowser(); }
// Cleanup verifies that our dedicated Chrome has exited. Its automation pipe
// can retain Node handles after that acknowledgement; end only this test runner.
process.exit(0);
