import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const url = process.env.TEST_BASE_URL || 'http://127.0.0.1:5189';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
const output = 'node_modules/.tmp/focused-battle';
mkdirSync(output, { recursive: true });
const questions = JSON.parse(JSON.stringify(QUESTIONS.Eiken3[3]));
const key = q => `Eiken3:3:${q.text}:${q.translation}`;
const unseen = questions.slice(-4, -1);
const learning = [...unseen, questions[1]];
const result = page => page.locator('[data-focused-battle-actions]');
const skip = page => page.getByRole('button', { name: 'この問題をスキップ', exact: true }).click();
async function finishBySkipping(page) {
  for (let i = 0; i < 45 && await page.locator('.battle-screen').count(); i++) await skip(page);
  await result(page).waitFor();
}
async function startNormal(page) {
  await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
  await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
  await page.getByRole('button', { name: /Basic Training/ }).click();
  await page.locator('.battle-screen').waitFor();
}
try {
  for (const width of [1366, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ questions }) => {
      speechSynthesis.speak = () => {};
      if (localStorage.getItem('focus-test-seeded')) return;
      localStorage.setItem('focus-test-seeded', 'true');
      localStorage.setItem('etyping_external_keyboard_mode', 'true');
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken3', level: 3, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
      const manualQuestionStatuses = Object.fromEntries(questions.map((q, i) => [
        `Eiken3:3:${q.text}:${q.translation}`,
        { practiceLevel: 1, listeningLevel: 1, battleLevel: i === 1 || i >= questions.length - 4 ? 1 : 3, manualOverrideLevel: null, excluded: i === questions.length - 1, updatedAt: 100, ...(i === 1 ? { presentedAt: 10 } : {}) },
      ]));
      // A second player proves presentation tracking is isolated per profile.
      localStorage.setItem('etyping_player_profiles', JSON.stringify([
        { id: 'focus-player', name: 'テスト', createdAt: 1, updatedAt: 1, data: { manualQuestionStatuses } },
        { id: 'other-player', name: '別のプレイヤー', createdAt: 1, updatedAt: 1, data: { manualQuestionStatuses: {} } },
      ]));
      localStorage.setItem('etyping_active_player_id', 'focus-player');
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(manualQuestionStatuses));
    }, { questions });
    await page.goto(url);
    await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
    await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
    await page.locator('[data-focus-kind="unseen"]').click();
    await page.getByRole('dialog', { name: '未出題だけで始める' }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await page.locator('.battle-screen').count(), 0, 'Cancel must not start a battle');
    await page.locator('[data-focus-kind="learning"]').click();
    await page.getByRole('dialog', { name: '学習中だけで始める' }).waitFor();
    await page.mouse.click(5, 5);
    assert.equal(await page.getByRole('dialog').count(), 0, 'Outside click cancels mode choice');
    await page.screenshot({ path: `${output}/mode-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.getByRole('button', { name: /Basic Training/ }).click();
    assert.equal(await page.locator('[data-focused-battle-label]').count(), 0, 'Canceled choices do not affect normal starts');
    await finishBySkipping(page);
    assert.match(await page.locator('[data-focus-kind="unseen"]').innerText(), /3問/);
    assert.match(await page.locator('[data-focus-kind="learning"]').innerText(), /4問/);
    const defeatsBefore = await page.evaluate(() => localStorage.getItem('etyping_defeated_monsters'));
    await page.locator('[data-focus-kind="unseen"]').click();
    assert.match(await page.locator('[data-focused-battle-label]').innerText(), /未出題だけ.*今回だけ/);
    await finishBySkipping(page);
    assert.deepEqual((await page.locator('[data-result-question]').allTextContents()).map(text => unseen.find(q => text.includes(q.text))?.text).sort(), unseen.map(q => q.text).sort(), 'Every unseen target once; no review intrusion');
    assert.ok(await page.getByText('対象を一巡しました', { exact: true }).isVisible());
    assert.equal(await page.evaluate(() => localStorage.getItem('etyping_defeated_monsters')), defeatsBefore, 'Skipping a small pool must not award a defeat');
    assert.equal(await page.locator('[data-focus-kind="unseen"]').isDisabled(), true);
    const statuses = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_manual_question_statuses')));
    for (const q of unseen) assert.ok(statuses[key(q)].presentedAt > 0);
    const compactHeight = (await result(page).boundingBox()).height;
    assert.ok(compactHeight <= 70, `Compact controls use ${compactHeight}px at width ${width}`);
    console.log(`Filter controls: ${compactHeight}px at width ${width}`);
    await result(page).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/result-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.locator('[data-focus-kind="learning"]').click();
    await finishBySkipping(page);
    assert.deepEqual((await page.locator('[data-result-question]').allTextContents()).map(text => learning.find(q => text.includes(q.text))?.text).sort(), learning.map(q => q.text).sort(), 'Learning includes new and seen, excludes caution/mastered/excluded');
    await page.getByRole('button', { name: 'コース選択へ戻る', exact: true }).click();
    for (const modeName of ['Basic Training', 'Listening Training', 'Listening Battle', 'Translation Battle']) {
      assert.equal(await page.locator('[data-focus-kind="unseen"]').isDisabled(), true);
      await page.locator('[data-focus-kind="learning"]').click();
      const dialog = page.getByRole('dialog', { name: '学習中だけで始める' });
      await dialog.getByRole('button', { name: new RegExp(modeName) }).click();
      assert.match(await page.locator('[data-focused-battle-label]').innerText(), /学習中だけ.*今回だけ/);
      assert.equal(await page.getByRole('dialog').count(), 0);
      await finishBySkipping(page);
      assert.equal(await page.locator('[data-result-question]').count(), 4, `${modeName} uses only the selected pool`);
      await page.getByRole('button', { name: 'コース選択へ戻る', exact: true }).click();
    }
    await page.getByRole('button', { name: /Listening Battle/ }).click();
    assert.equal(await page.locator('[data-focused-battle-label]').count(), 0, 'Mode navigation resets the one-shot pool');
    await page.reload();
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_manual_question_statuses')));
    for (const q of unseen) assert.equal(restored[key(q)].presentedAt, statuses[key(q)].presentedAt, 'Reload restores presentation history');
    const profiles = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_player_profiles')));
    assert.equal(Object.keys(profiles.find(p => p.id === 'other-player').data.manualQuestionStatuses).length, 0);
    // Export uses the same normalized profile data as player switching/import.
    await page.getByRole('button', { name: '設定', exact: true }).first().click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '学習データを書き出す', exact: true }).click()]);
    const backup = JSON.parse(readFileSync(await download.path(), 'utf8'));
    for (const q of unseen) assert.equal(backup.player.data.manualQuestionStatuses[key(q)].presentedAt, statuses[key(q)].presentedAt);
    assert.equal('focusedBattle' in backup.player.data, false, 'The temporary pool is never exported');
    const imported = { ...backup, player: { ...backup.player, id: 'import-player', name: '読み込み確認' } };
    await page.locator('input[type="file"]').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
    await page.getByText('学習データを読み込みました: 読み込み確認', { exact: true }).waitFor();
    const importedStatuses = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_manual_question_statuses')));
    for (const q of unseen) assert.equal(importedStatuses[key(q)].presentedAt, statuses[key(q)].presentedAt);
    if (width === 390) {
      const single = JSON.parse(JSON.stringify(backup));
      single.player.id = 'single-player'; single.player.name = '1問確認';
      for (const [statusKey, status] of Object.entries(single.player.data.manualQuestionStatuses)) {
        status.battleLevel = statusKey === key(questions[1]) ? 1 : 3;
        status.manualOverrideLevel = null;
      }
      await page.locator('input[type="file"]').setInputFiles({ name: 'single.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(single)) });
      await page.getByText('学習データを読み込みました: 1問確認', { exact: true }).waitFor();
      await page.reload(); await startNormal(page); await finishBySkipping(page);
      assert.match(await page.locator('[data-focus-kind="learning"]').innerText(), /1問/);
      await page.locator('[data-focus-kind="learning"]').click(); await skip(page);
      await page.getByText('対象を一巡しました', { exact: true }).waitFor();
      assert.equal(await page.locator('[data-result-question]').count(), 1, 'Single-item pool stops without repeating or falling back');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: unseen/learning pools, no repeats/review mixing, neutral exhaustion, no false defeat, normal reset, history reload/player isolation/export/import, layout`);
    await context.close();
  }
  // Exercise actual Battle Zone damage, the question limit, retry, and next monster.
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ questions }) => {
    window.testSpoken = '';
    speechSynthesis.speak = utterance => { window.testSpoken = utterance.text; };
    localStorage.setItem('etyping_external_keyboard_mode', 'true');
    localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken3', level: 3 }));
    localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map((q, i) => [
      `Eiken3:3:${q.text}:${q.translation}`,
      { practiceLevel: 1, listeningLevel: 1, battleLevel: i >= questions.length - 40 ? 1 : 3, manualOverrideLevel: null, excluded: false, updatedAt: 0 },
    ]))));
  }, { questions });
  await page.goto(url);
  await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
  await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
  await page.getByRole('button', { name: /Listening Battle/ }).click();
  const originalHp = await page.locator('.battle-hp').innerText();
  await finishBySkipping(page);
  await page.locator('[data-focus-kind="unseen"]').click();
  assert.equal(await page.locator('.battle-hp').innerText(), originalHp, 'Filtering must not change HP');
  await finishBySkipping(page);
  assert.equal(await page.getByText('対象を一巡しました', { exact: true }).count(), 0, 'Large pools stop at the normal question limit');
  const texts = await page.locator('[data-result-question]').allTextContents();
  assert.equal(new Set(texts).size, texts.length, 'No duplicates even with queued reviews');
  await page.getByRole('button', { name: /もう一度挑戦する/ }).click();
  assert.equal(await page.locator('[data-focused-battle-label]').count(), 0, 'Retry is a normal battle');
  await finishBySkipping(page);
  await page.locator('[data-focus-kind="learning"]').click();
  for (let i = 0; i < 12 && await page.locator('.battle-screen').count(); i++) {
    await page.waitForFunction(() => window.testSpoken.length > 0);
    const answer = await page.evaluate(() => window.testSpoken);
    assert.ok(questions.some(q => q.text === answer), `Unexpected speech: ${answer}`);
    await page.evaluate(() => { window.testSpoken = ''; });
    await page.keyboard.type(answer);
    await page.waitForTimeout(950);
  }
  await result(page).waitFor();
  assert.ok(await page.getByText('CLEAR!', { exact: true }).isVisible(), 'Real HP defeat still clears normally');
  const completed = await page.locator('[data-result-question]').allTextContents();
  assert.ok(completed.every(text => questions.slice(-40).some(q => text.includes(q.text))), 'Successful answers stay within the learning pool');
  await page.getByRole('button', { name: /つぎのモンスターへ/ }).click();
  assert.equal(await page.locator('[data-focused-battle-label]').count(), 0, 'Next monster is a normal battle');
  assert.deepEqual(errors, []);
  console.log('PASS Battle Zone: unchanged HP, normal question limit, retry/next reset, real defeat and pool isolation with successful answers');
  await context.close();
} finally { await cleanup(); }
