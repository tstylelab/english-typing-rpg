import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getConversationProgressKey } = load('src/data/conversationCurriculum.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
const baseURL = process.env.TEST_URL || 'http://127.0.0.1:5210/';
const cases = [1, 2, 3, 4, 5].flatMap(level => [390, 820].flatMap(width =>
  ['voice-only', 'voice-text'].map(inputMode => ({ course: 'Conversation', level, width, inputMode, mode: 'challenge' }))));
cases.push(...[1, 2, 3, 4, 5].map(level => ({ course: 'Conversation', level, width: 820, inputMode: 'voice-text', mode: 'guide' })));
cases.push(...[1,2,3,4,5].map(level => ({ course: 'Conversation', level, width:390, inputMode:'text-only', mode:'challenge' })));
cases.push({ course: 'Eiken5', level: 1, width: 820, inputMode: 'voice-only', mode: 'challenge' });
const words = page => page.evaluate(() => window.speechLog.map(u => u.text));
let done = 0;
try {
  for (const config of (process.env.TEST_SMOKE === '1' ? cases.filter(c => c.course !== 'Conversation' || (c.width === 390 && c.inputMode === 'voice-only') || (c.level === 4 && c.mode === 'guide') || (c.level === 5 && c.inputMode === 'text-only')) : cases)) {
    const { course, level, width, inputMode, mode } = config;
    const questions = QUESTIONS[course][level].map(q => ({...q, progressKey: course === 'Conversation' ? getConversationProgressKey(q) : `${course}:${level}:${q.text}:${q.translation}`, displayMeaning: getQuestionMeaning(q,course)}));
    const candidates = questions.slice(0, 2);
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1180 },
      ...(width === 390 ? { hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 9a) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36' } : {}) });
    try {
      await context.addInitScript(({ config, questions, candidates }) => {
        window.speechLog = [];
        window.speechCurrent = null;
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
          paused: false, speaking: false, pending: false, getVoices: () => [],
          addEventListener() {}, removeEventListener() {}, resume() {},
          cancel() { window.speechCurrent = null; },
          speak(u) { window.speechLog.push(u); window.speechCurrent = u; },
        } });
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {
          constructor(text) { this.text = text; }
        } });
        window.finishSpeech = () => { const u = window.speechCurrent; window.speechCurrent = null; u?.onend?.(); };
        Math.random = () => 0;
        window.reviewNow = 1000000; Date.now = () => window.reviewNow;
        if (sessionStorage.getItem('conversation-listening-fixture')) return;
        sessionStorage.setItem('conversation-listening-fixture', '1');
        localStorage.setItem('etyping_external_keyboard_mode', 'true');
        localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: config.course, level: config.level, resumeMode: config.mode, resumeInputMode: config.inputMode }));
        const scope = config.course + ':' + config.level;
        const statuses = Object.fromEntries(questions.map(q => [q.progressKey,
          { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: !candidates.some(c => c.text === q.text), updatedAt: 123 }]));
        localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(statuses));
        const oldScope = candidates[1].progressKey.split(':').slice(0,2).join(':');
        const marks = { [oldScope]: [candidates[1].progressKey] };
        const defeated = ['Eiken5:1:challenge:voice-only:c1_2'];
        localStorage.setItem('etyping_marked_question_keys_by_scope', JSON.stringify(marks));
        localStorage.setItem('etyping_defeated_monsters', JSON.stringify(defeated));
        localStorage.setItem('etyping_player_profiles', JSON.stringify([
          { id: 'conversation-audio-check', name: '音声の独立検証', updatedAt: 123, data: { manualQuestionStatuses: statuses, markedQuestionKeysByScope: marks, selectedQuestionKeysByScope: marks, reviewHistoryKeysByScope: marks, defeatedMonsterIds: defeated } },
          { id: 'other-player', name: '保持確認', updatedAt: 123, data: { defeatedMonsterIds: defeated, maxKeystrokes: 999 } },
        ]));
        localStorage.setItem('etyping_active_player_id', 'conversation-audio-check');
      }, { config, questions, candidates });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(baseURL);
      await page.getByRole('button', { name: '教材を選ぶ', exact: true }).first().click();
      await page.getByRole('button', { name: '学習方法を選ぶ', exact: true }).click();
      if (course === 'Conversation') {
        assert.equal(await page.getByText('即答バトル', { exact: true }).count(), 0);
        await page.getByText('流れた英語を入力。相手・場面と和訳も見られます。', { exact: true }).waitFor();
      }
      const title = mode === 'guide' ? '会話の型練習' : inputMode === 'voice-only' ? '音声バトル' : inputMode === 'voice-text' ? 'リスニング練習' : '場面バトル';
      await page.locator('.journey-mode-start').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).click();
      const input = page.locator('.battle-input'); await input.waitFor();
      const otherBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_player_profiles')).find(p => p.id === 'other-player').data);
      if (inputMode === 'text-only') {
        assert.deepEqual(await words(page), [], 'Scene battle does not automatically speak the answer');
        const scene = await page.locator('.battle-translation').innerText();
        assert.ok(candidates.some(q => scene.includes(q.promptEn || q.sceneJa) && scene.includes(q.displayMeaning)), 'Scene battle retains the partner and intended Japanese reply');
      } else if (mode === 'guide') {
        await page.waitForFunction(() => window.speechLog.length > 0);
        const log = await words(page);
        const current = candidates.find(q => (q.promptEn || q.text) === log.at(-1));
        assert.ok(current, 'Guided practice starts with the partner line');
        if (current.promptEn) await page.evaluate(() => window.finishSpeech());
        assert.equal((await words(page)).at(-1), current.text, 'The model reply follows the partner');
      } else {
        await page.waitForFunction(() => window.speechLog.length > 0);
        const heard = (await words(page)).at(-1);
        const current = candidates.find(q => q.text === heard);
        assert.ok(current, 'Listening automatically plays an eligible answer, not its partner line');
        if (course === 'Conversation' && inputMode === 'voice-only') {
          await page.getByText('会話の英語を聞いて、そのまま入力しよう', { exact: true }).waitFor();
          assert.equal(await page.getByText(current.translation, { exact: true }).count(), 0);
        }
        await page.getByRole('button', { name: '音声をもう一度再生', exact: true }).click();
        assert.equal((await words(page)).at(-1), heard, 'Replay matches the original audio');
        await page.keyboard.press('ControlRight');
        assert.equal((await words(page)).at(-1), heard, 'Keyboard replay matches the answer');
        const before = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope')));
        await input.fill(current.text[0]);
        await page.evaluate(() => window.reviewNow += 10000);
        await page.keyboard.type(current.text.slice(1));
        await page.locator('.battle-previous-study').filter({ hasText: current.text }).waitFor();
        const nextAudio = (await words(page)).at(-1);
        assert.ok(candidates.some(q => q.text === nextAudio), 'The next question also plays its graded answer');
        assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope'))), before, 'Existing review marks survive an answer');
        await page.waitForFunction(before => JSON.stringify(JSON.parse(localStorage.getItem('etyping_player_profiles')).find(p => p.id === 'conversation-audio-check').data.markedQuestionKeysByScope) === JSON.stringify(before), before);
        await page.reload();
        await page.getByRole('button', { name: '教材を選ぶ', exact: true }).first().waitFor();
        await page.waitForFunction(before => JSON.stringify(JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope'))) === JSON.stringify(before), before);
        assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope'))), before, 'Review marks survive reload');
      }
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_player_profiles')).find(p => p.id === 'other-player').data), otherBefore, 'The other player is preserved');
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_defeated_monsters'))), ['Eiken5:1:challenge:voice-only:c1_2'], 'Previous defeated IDs are retained');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      done++; console.log('PASS', done, course, level, width, mode, inputMode);
    } finally { await context.close(); }
  }
} finally { await cleanup(); }
console.log(`PASS: ${done} isolated browser cases; playback, replay, accepted input, reload and mobile layout; no screenshots or reports saved.`);
process.exit(0);
