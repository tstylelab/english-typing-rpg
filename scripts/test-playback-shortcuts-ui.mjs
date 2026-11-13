import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const common = QUESTIONS.Eiken5[1].find(q => QUESTIONS.Eiken4[1].some(other => other.text === q.text));
const items = [
  { course: 'Eiken5', level: 1, label: '英検5級', question: common },
  { course: 'Eiken4', level: 1, label: '英検4級', question: QUESTIONS.Eiken4[1].find(q => q.text === common.text) },
  { course: 'Eiken3', level: 2, label: '英検3級', question: QUESTIONS.Eiken3[2][0] },
  { course: 'Eiken3', level: 3, label: '英検3級', question: QUESTIONS.Eiken3[3][0] },
];
const key = item => `${item.course}:${item.level}:${item.question.text}:${item.question.translation}`;
const marks = Object.fromEntries(items.map(item => [`${item.course}:${item.level}`, [key(item)]]));
const url = process.env.TEST_URL || 'http://127.0.0.1:5217/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
try {
  for (const width of [1366, 820, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    try {
      await context.addInitScript(({ marks, shuffle }) => {
        window.utterances = [];
        Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
          getVoices: () => [], cancel() {}, resume() {}, addEventListener() {}, removeEventListener() {},
          speak(u) { window.utterances.push(u); u.onstart?.(); },
        } });
        Math.random = () => 0.75;
        if (sessionStorage.getItem('keyboard-fixture')) return;
        sessionStorage.setItem('keyboard-fixture', '1');
        const data = {
          markedQuestionKeysByScope: marks,
          manualQuestionStatuses: { 'Eiken2:1:determine:（事実などを）突き止める': { practiceLevel: 3, listeningLevel: 3, battleLevel: 3, excluded: false, updatedAt: 123 } },
          defeatedMonsterIds: ['Eiken5:1:guide:voice-text:m1_1'],
          finalBossClearCounts: { 'Eiken2:2:challenge:text-only': 5 },
          bestScores: { Eiken2_2_challenge: 12345 },
          battleResumePositions: { 'Eiken2:2:challenge:text-only': 'c2_1' },
          autoPlaySettings: { source: 'marked', playbackScope: 'all', playText: true, playTranslation: true, playExample: true, itemGapSeconds: 0, questionGapSeconds: 0, repeat: true, shuffle },
        };
        localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken3', level: 2 }));
        localStorage.setItem('etyping_player_profiles', JSON.stringify([
          { id: 'keyboard-test', name: '検証', updatedAt: 123, data },
          { id: 'other', name: '別プレイヤー', updatedAt: 123, data: { finalBossClearCounts: { 'Eiken2:2:challenge:text-only': 17 }, markedQuestionKeysByScope: marks, maxKeystrokes: 999 } },
        ]));
        localStorage.setItem('etyping_active_player_id', 'keyboard-test');
      }, { marks, shuffle: width === 820 });
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(15000);
      await page.goto(url);
      await page.locator('.adventure-destination.is-listening').click();
      const panel = page.locator('[data-autoplay-now-playing]');
      const stop = page.getByRole('button', { name: '停止', exact: true });
      await stop.waitFor(); await stop.isEnabled();
      const spoken = () => page.evaluate(() => window.utterances.length);
      const current = async () => ({
        course: await page.locator('[data-autoplay-course]').innerText(),
        text: await panel.locator('[data-reading-part="text"] .text-base').innerText(),
      });
      const storedMarks = () => page.evaluate(() => JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope')));
      const protectedSnapshot = () => page.evaluate(() => ({
        data: Object.fromEntries(['manual_question_statuses', 'defeated_monsters', 'best_scores', 'battle_resume_positions', 'final_boss_clear_counts', 'weak_questions', 'weak_question_stats', 'daily_progress'].map(name => [name, localStorage.getItem(`etyping_${name}`)])),
        other: JSON.parse(localStorage.getItem('etyping_player_profiles')).find(p => p.id === 'other'),
      }));
      const beforeProtected = await protectedSnapshot();
      const first = await current();
      const firstItem = items.find(item => first.course === `${item.label} · Level ${item.level}` && first.text === item.question.text);
      assert.ok(firstItem);
      const blur = () => page.evaluate(() => document.activeElement?.blur());
      await blur();
      let count = await spoken();
      await page.keyboard.press('ArrowRight');
      assert.equal(await spoken(), count + 1, 'One key moves a whole question, not just one spoken part');
      const second = await current(); assert.notDeepEqual(second, first);
      await page.keyboard.press('ArrowLeft'); assert.deepEqual(await current(), first);
      await page.keyboard.press('ArrowLeft'); assert.deepEqual(await current(), first, 'Previous at the first item replays that item');
      count = await spoken();
      await page.keyboard.press('Alt+ArrowRight'); await page.keyboard.press('Control+ArrowRight');
      await page.keyboard.press('Shift+ArrowRight');
      assert.equal(await spoken(), count, 'Modified browser/selection keys are not intercepted');

      // Remove while the translation is being spoken; all parts and repeats must disappear.
      await page.evaluate(() => window.utterances.at(-1).onend?.(new Event('end')));
      await page.waitForFunction(() => document.querySelector('[data-reading-part="translation"]')?.getAttribute('data-active') === 'true');
      await page.keyboard.press('Shift+Enter');
      assert.deepEqual(await current(), second);
      const afterFirstRemoval = await storedMarks();
      assert.deepEqual(afterFirstRemoval[`${firstItem.course}:${firstItem.level}`], []);
      for (const item of items.filter(item => item !== firstItem)) assert.deepEqual(afterFirstRemoval[`${item.course}:${item.level}`], [key(item)], 'Only the current course/Level bookmark is removed');
      const history = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_review_history_keys_by_scope')));
      assert.ok(history[`${firstItem.course}:${firstItem.level}`].includes(key(firstItem)), 'Removal remains reversible through existing history');
      count = await spoken();
      await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', shiftKey: true, repeat: true, bubbles: true, cancelable: true })));
      assert.deepEqual(await storedMarks(), afterFirstRemoval, 'Holding the removal key must not remove another question');
      assert.equal(await spoken(), count);

      const previous = panel.getByRole('button', { name: '← 前の問題', exact: true });
      await previous.focus(); await page.keyboard.press('Space');
      assert.equal(await stop.isEnabled(), true, 'Space on another button preserves its native action');
      assert.deepEqual(await current(), second);
      await stop.focus(); await page.keyboard.press('Space');
      assert.equal(await stop.isDisabled(), true);
      const stoppedAt = await current(); count = await spoken();
      await blur(); await page.keyboard.press('ArrowRight');
      assert.equal(await spoken(), count, 'Navigation remains disabled while stopped, like the buttons');
      const resume = page.getByRole('button', { name: '続きから再生', exact: true });
      await resume.focus(); await page.keyboard.press('Space');
      assert.equal(await spoken(), count + 1, 'Focused resume button invokes exactly one resume');
      assert.deepEqual(await current(), stoppedAt, 'Space resumes the retained shuffled queue/current question');
      await blur(); await page.keyboard.press('Escape');
      assert.equal(await stop.isDisabled(), true);
      await page.keyboard.press('Space'); assert.equal(await stop.isEnabled(), true);

      // A native settings dialog and its inputs retain their own keys, including Escape.
      await page.getByRole('button', { name: '設定を変える', exact: true }).click();
      const dialog = page.getByRole('dialog'); await dialog.waitFor();
      const interval = dialog.locator('input[type="number"]').first(); await interval.focus();
      count = await spoken();
      for (const key of ['ArrowLeft', 'ArrowRight', 'Shift+Enter', 'Space']) await page.keyboard.press(key);
      assert.equal(await spoken(), count); assert.deepEqual(await storedMarks(), afterFirstRemoval);
      await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
      assert.equal(await stop.isEnabled(), true, 'Escape closes settings without stopping playback');
      // Check plain inputs, contenteditable, IME and already-handled keyboard events too.
      await page.evaluate(() => {
        const input = document.createElement('input'); input.id = 'shortcut-input-fixture'; document.body.append(input); input.focus();
      });
      count = await spoken();
      for (const key of ['ArrowLeft', 'ArrowRight', 'Shift+Enter', 'Space']) await page.keyboard.press(key);
      assert.equal(await spoken(), count); assert.deepEqual(await storedMarks(), afterFirstRemoval);
      await page.evaluate(() => {
        document.querySelector('#shortcut-input-fixture').remove();
        const editor = document.createElement('div'); editor.id = 'shortcut-editor-fixture'; editor.contentEditable = 'true'; document.body.append(editor); editor.focus();
      });
      await page.keyboard.press('Shift+Enter'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Space');
      assert.equal(await spoken(), count); assert.deepEqual(await storedMarks(), afterFirstRemoval);
      await page.evaluate(() => {
        document.querySelector('#shortcut-editor-fixture').remove();
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', isComposing: true, bubbles: true, cancelable: true }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, keyCode: 229, bubbles: true, cancelable: true }));
        const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }); handled.preventDefault(); window.dispatchEvent(handled);
      });
      assert.equal(await spoken(), count); assert.deepEqual(await storedMarks(), afterFirstRemoval);

      for (let index = 0; index < items.length - 1; index++) { await blur(); await page.keyboard.press('Shift+Enter'); }
      assert.equal(await page.locator('[data-autoplay-course]').count(), 0);
      count = await spoken(); await page.keyboard.press('Space');
      assert.equal(await spoken(), count, 'Empty review cannot be restarted by Space');
      assert.ok(Object.values(await storedMarks()).every(list => list.length === 0));
      assert.deepEqual(await protectedSnapshot(), beforeProtected, 'Review actions do not change mastery, battles, scores or another player');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.reload();
      assert.ok(Object.values(await storedMarks()).every(list => list.length === 0), 'Removals persist after reload');

      // Outside marked-only playback, Shift+Enter must not remove or restore an unmarked word.
      await page.locator('.adventure-destination.is-listening').click();
      await page.getByRole('button', { name: '設定を変える', exact: true }).click();
      await dialog.getByRole('button', { name: 'このLevel', exact: true }).click();
      await dialog.getByRole('button', { name: /^すべての問題/ }).click();
      await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
      await page.getByRole('button', { name: 'この設定で再生する', exact: true }).click();
      await stop.waitFor(); await blur(); count = await spoken();
      const unmarked = await current(); await page.keyboard.press('Shift+Enter');
      assert.deepEqual(await current(), unmarked); assert.equal(await spoken(), count);
      assert.ok(Object.values(await storedMarks()).every(list => list.length === 0));
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'ホーム', exact: true }).first().click();
      count = await spoken(); await blur(); await page.keyboard.press('Space'); await page.keyboard.press('Shift+Enter'); await page.keyboard.press('ArrowRight');
      assert.equal(await spoken(), count, 'No playback shortcuts leak onto another screen');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: previous/next, Space/Escape stop, exact resume, scoped removal/history, repeat guard, modal/input/IME isolation, native button Space, empty/unmarked cases, reload and learner preservation${width === 820 ? ', shuffle' : ''}`);
    } finally { await context.close(); }
  }
} finally { await cleanup(); }
