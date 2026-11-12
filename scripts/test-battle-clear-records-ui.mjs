import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { loadBattleTuning } from './lib/load-battle-tuning.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getConversationProgressKey } = load('src/data/conversationCurriculum.ts');
const model = loadBattleTuning(readFileSync('src/App.tsx', 'utf8'));
const cases = [
  { course: 'Eiken2', level: 2, input: 'text-only', width: 820, initial: 2, step: 22, win: true },
  { course: 'Eiken2', level: 2, input: 'voice-only', width: 390, initial: 4, step: 22, win: true },
  { course: 'Eiken5', level: 1, input: 'text-only', width: 1366, initial: 0, step: 22, win: true },
  { course: 'Conversation', level: 5, input: 'text-only', width: 820, initial: 9, step: 22, win: true },
  { course: 'Eiken2', level: 2, input: 'text-only', width: 390, initial: 5, step: 21, win: true },
  { course: 'Eiken2', level: 2, input: 'text-only', width: 820, initial: 5, step: 22, win: false },
];
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
const url = process.env.TEST_URL || 'http://127.0.0.1:5216/';
const openModes = async page => {
  await page.getByRole('button', { name: '教材を選ぶ', exact: true }).first().click();
  await page.getByRole('button', { name: '学習方法を選ぶ', exact: true }).click();
};
let checked = 0;
try {
  for (const config of process.env.TEST_CASE === undefined ? cases : [cases[Number(process.env.TEST_CASE)]]) {
    const { course, level, input, width, initial, step, win } = config;
    const scope = `${course}:${level}:challenge:${input}`;
    const qs = QUESTIONS[course][level];
    const question = [...qs].sort((a, b) => a.text.length - b.text.length)[0];
    const qKey = q => course === 'Conversation' ? getConversationProgressKey(q) : `${course}:${level}:${q.text}:${q.translation}`;
    const statuses = Object.fromEntries(qs.map(q => [qKey(q), { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, excluded: q !== question, updatedAt: 123 }]));
    const roster = model.roster[level].challenge;
    assert.equal(roster.length, 23);
    // Pre-existing complete saves must keep all stars/IDs when replaying.
    const defeats = roster.map(m => `${course}:${level}:challenge:${input}:${m.id}`);
    const sentinel = 'Eiken4:1:unrelated:既存記録';
    const otherData = { maxKeystrokes: 999, defeatedMonsterIds: ['Eiken5:1:guide:voice-text:m1_1'], finalBossClearCounts: { 'Eiken2:2:challenge:text-only': 17 } };
    const data = { manualQuestionStatuses: { ...statuses, [sentinel]: { practiceLevel: 3, listeningLevel: 3, battleLevel: 3, excluded: false, updatedAt: 123 } },
      defeatedMonsterIds: defeats, bestScores: { Eiken4_1_challenge: 12345 },
      markedQuestionKeysByScope: { [`${course}:${level}`]: [qKey(question)] },
      battleResumePositions: { [scope]: roster[step].id },
      finalBossClearCounts: initial ? { [scope]: initial } : undefined };
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : width === 820 ? 1180 : 900 } });
    try {
      await context.addInitScript(({ config, data, otherData }) => {
        const speech = { getVoices: () => [], cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {}, speak() {} };
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class { constructor(text) { this.text = text; } } });
        Math.random = () => 0;
        if (sessionStorage.getItem('clear-record-fixture')) return;
        sessionStorage.setItem('clear-record-fixture', '1');
        localStorage.setItem('etyping_external_keyboard_mode', 'true');
        localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: config.course, level: config.level, resumeMode: 'challenge', resumeInputMode: config.input }));
        localStorage.setItem('etyping_player_profiles', JSON.stringify([{ id: 'clear-test', name: '検証', updatedAt: 123, data }, { id: 'other', name: '別プレイヤー', updatedAt: 123, data: otherData }]));
        localStorage.setItem('etyping_active_player_id', 'clear-test');
      }, { config, data, otherData });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      page.setDefaultTimeout(15000);
      await page.goto(url);
      await openModes(page);
      const title = course === 'Conversation' ? '場面バトル' : input === 'voice-only' ? '音声バトル' : '和訳バトル';
      const card = page.locator('.journey-mode-card').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
      assert.equal(await page.locator('.journey-zone-training [data-final-boss-record]').count(), 0);
      assert.equal(await card.locator('[data-final-boss-record]').getAttribute('data-final-boss-record'), String(initial));
      assert.ok((await card.innerText()).includes('記録開始後'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      const snapshot = await page.evaluate(sentinel => ({
        other: JSON.parse(localStorage.getItem('etyping_player_profiles')).find(p => p.id === 'other'),
        status: JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[sentinel],
        marks: localStorage.getItem('etyping_marked_question_keys_by_scope'),
        wins: localStorage.getItem('etyping_defeated_monsters'),
      }), sentinel);
      await card.locator('.journey-mode-start').click();
      const inputBox = page.locator('.battle-input'); await inputBox.waitFor();
      assert.equal(await page.locator('[data-final-boss-record]').count(), 0, 'No permanent battle input space consumed');
      const beforeBox = await inputBox.boundingBox(); assert.ok(beforeBox.width > 200);
      for (let attempt = 0; attempt < 100 && await inputBox.count(); attempt++) {
        if (win) await inputBox.fill(question.text);
        else await page.getByRole('button', { name: /スキップ/, exact: false }).click();
        await page.waitForTimeout(65);
        if (await page.locator('.result-board').count()) break;
      }
      await page.locator('.result-board').waitFor();
      const expected = initial + (win && step === 22 ? 1 : 0);
      const readCounts = () => page.evaluate(() => JSON.parse(localStorage.getItem('etyping_final_boss_clear_counts')));
      assert.equal((await readCounts())[scope] ?? 0, expected);
      if (win && step === 22) {
        const record = page.locator('.final-boss-record-result');
        assert.equal(await record.getAttribute('data-final-boss-record'), String(expected));
        if ([3, 5, 10].includes(expected)) assert.ok((await record.innerText()).includes(`${expected}回撃破達成！`));
        if (process.env.TEST_EMIT_IMAGE) {
          await page.locator('[data-monster-reveal="defeat"]').waitFor({ state: 'detached' });
          await record.scrollIntoViewIfNeeded();
          await page.waitForTimeout(100); // let the result autofocus/scroll settle
          console.log('IMAGE:' + (await page.screenshot({ type: 'jpeg', quality: 60 })).toString('base64'));
        }
        if (width === 390) await page.setViewportSize({ width: 360, height: 800 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      } else assert.equal(await page.locator('.final-boss-record-result').count(), 0, 'Loss and earlier hidden bosses have no final-clear award');
      await page.waitForTimeout(250);
      const after = await page.evaluate(sentinel => ({
        other: JSON.parse(localStorage.getItem('etyping_player_profiles')).find(p => p.id === 'other'),
        status: JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[sentinel],
        marks: localStorage.getItem('etyping_marked_question_keys_by_scope'),
        wins: localStorage.getItem('etyping_defeated_monsters'),
      }), sentinel);
      assert.deepEqual(after, snapshot, 'Unrelated learner, mastery, bookmarks, and lifetime victories preserved');
      await page.reload(); await openModes(page);
      assert.equal((await readCounts())[scope] ?? 0, expected, 'Reload cannot award another clear');
      assert.equal(await card.locator('[data-final-boss-record]').getAttribute('data-final-boss-record'), String(expected));
      if (win && step === 22) {
        await card.locator('.journey-mode-start').click(); await inputBox.waitFor();
        await page.waitForTimeout(200);
        assert.equal((await readCounts())[scope], expected, 'Starting the next replay does not add a count');
        await page.getByRole('button', { name: 'トップに戻る', exact: true }).click();
        await page.locator('#home-player').selectOption('other');
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('etyping_final_boss_clear_counts'))['Eiken2:2:challenge:text-only'] === 17);
        await page.locator('#home-player').selectOption('clear-test');
        await page.waitForFunction(([scope, expected]) => JSON.parse(localStorage.getItem('etyping_final_boss_clear_counts'))[scope] === expected, [scope, expected]);
      }
      assert.deepEqual(errors, []);
      console.log('PASS', ++checked, course, level, input, width, win ? 'win' : 'loss', `${initial}->${expected}`);
    } finally { await context.close(); }
  }
} finally { await cleanup(); }
console.log(`PASS: ${checked} isolated real-battle cases; phone/tablet/desktop, 3/5/10 milestones, legacy completed saves, non-final/loss exclusions, reload, profile switching and old-record preservation.`);
