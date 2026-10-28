import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getTranslationBattlePrompt } = load('src/data/translationBattlePrompts.ts');
const { getQuestionSynonymLabels, getQuestionSynonymHeading } = load('src/data/questionSynonyms.ts');
const { getGrade2VocabularyUsageNote } = load('src/data/grade2VocabularyUsageNotes.ts');
const url = process.env.VOCABULARY_TEST_URL || 'http://127.0.0.1:5196';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname)
  || (process.env.VOCABULARY_PUBLIC_SMOKE === 'true' && new URL(url).origin === 'https://en-typing.tsg-gt.com'));
const out = process.env.VOCABULARY_TEST_OUTPUT;
if (out) fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser), report = [];
const usageNotesOnly = process.env.VOCABULARY_TEST_USAGE_NOTES === 'true';
const cases = (usageNotesOnly ? [
  ['label', 820, 1180], ['digest', 1280, 800], ['identity', 390, 844],
  ['navy', 820, 1180], ['organ', 820, 1180], ['initial', 820, 1180],
  ['range', 820, 1180], ['source', 320, 844], ['drug', 820, 1180],
  ['appeal', 1280, 800], ['classic', 820, 1180], ['foundation', 820, 1180],
  ['production', 390, 844], ['senior', 820, 1180], ['original', 820, 1180],
  ['container', 390, 844], ['fix', 390, 844, 'Eiken3'],
  ['digest', 820, 1180, 'Eiken2', 'voice-text'],
] : [
  ['correctly', 820, 1180], ['interfere', 820, 1180], ['process', 1280, 800],
  ['roommate', 390, 844], ['examine', 820, 1180], ['privacy', 320, 844],
  ['panel', 820, 1180], ['procedure', 390, 844], ['determine', 1280, 800],
  ['current', 820, 1180], ['respond', 820, 1180], ['container', 390, 844],
  ['fix', 390, 844, 'Eiken3'], ['correctly', 820, 1180, 'Eiken2', 'voice-text'],
]).filter(([text]) => !process.env.VOCABULARY_TEST_WORD || text === process.env.VOCABULARY_TEST_WORD);
try {
  for (const [text, width, height, course = 'Eiken2', inputMode = 'text-only'] of cases) {
    const qs = QUESTIONS[course][1], q = qs.find(q => q.text === text);
    assert.ok(q, text);
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ qs, q, course, inputMode }) => {
      speechSynthesis.speak = () => {}; Math.random = () => 0;
      window.vocabularyTestNow = 1000000; Date.now = () => window.vocabularyTestNow;
      if (localStorage.getItem('vocabulary-display-test-seeded')) return;
      localStorage.setItem('vocabulary-display-test-seeded', 'true');
      localStorage.setItem('etyping_external_keyboard_mode', 'true');
      localStorage.setItem('etyping_max_keystrokes', '1');
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: course, level: 1, resumeMode: 'challenge', resumeInputMode: inputMode }));
      const statuses = Object.fromEntries(qs.map(v => [`${course}:1:${v.text}:${v.translation}`, {
        practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: v.text !== q.text, updatedAt: 123,
      }]));
      statuses['Eiken5:1:banana:バナナ'] = { practiceLevel: 3, listeningLevel: 3, battleLevel: 3, manualOverrideLevel: 3, excluded: false, updatedAt: 123 };
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(statuses));
      localStorage.setItem('etyping_defeated_monsters', JSON.stringify(['Eiken5:1:challenge:voice-only:c1_2']));
      localStorage.setItem('etyping_marked_question_keys_by_scope', JSON.stringify({ 'Eiken5:1': ['Eiken5:1:banana:バナナ'] }));
      localStorage.setItem('etyping_player_profiles', JSON.stringify([
        { id: 'vocabulary-test-player', name: '表示検証', updatedAt: 123, data: {
          manualQuestionStatuses: statuses, maxKeystrokes: 1,
          defeatedMonsterIds: ['Eiken5:1:challenge:voice-only:c1_2'],
          markedQuestionKeysByScope: { 'Eiken5:1': ['Eiken5:1:banana:バナナ'] },
        } },
        { id: 'other-vocabulary-player', name: '別の検証プレイヤー', updatedAt: 123,
          data: { manualQuestionStatuses: { 'Eiken5:1:banana:バナナ': statuses['Eiken5:1:banana:バナナ'] } } },
      ]));
      localStorage.setItem('etyping_active_player_id', 'vocabulary-test-player');
    }, { qs, q, course, inputMode });
    await page.goto(url); await page.locator('.adventure-primary').click();
    const input = page.locator('.battle-input'); await input.waitFor({ state: 'attached' });
    await page.locator('[data-monster-reveal]').waitFor({ state: 'detached' });
    const usageNote = getGrade2VocabularyUsageNote(course, 1, q);
    assert.equal(await page.locator('[data-vocabulary-usage-note]').count(), 0, 'No answer-revealing note before the first answer');
    assert.equal((await page.locator('.battle-translation').innerText()).trim(), getQuestionMeaning(q, course));
    const expressions = inputMode === 'text-only' ? getTranslationBattlePrompt(q, course, 1)?.alternatives ?? [] : [];
    const hints = page.locator('.battle-vocabulary-synonyms');
    assert.equal(await hints.count(), expressions.length ? 1 : 0);
    if (expressions.length) for (const expression of expressions) assert.ok((await hints.innerText()).includes(`${expression.text}（${expression.note}）`));
    const record = () => page.evaluate(() => ({
      statuses: JSON.parse(localStorage.getItem('etyping_manual_question_statuses')),
      defeats: JSON.parse(localStorage.getItem('etyping_defeated_monsters')),
      marks: JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope')),
      otherPlayer: JSON.parse(localStorage.getItem('etyping_player_profiles')).find(player => player.id === 'other-vocabulary-player').data,
    }));
    const before = await record(), legacyKey = `${course}:1:${q.text}:${q.translation}`;
    assert.ok(before.statuses[legacyKey]);
    let alternateRejected = null;
    if (text === 'examine') {
      await input.fill('inspect');
      await page.waitForFunction(() => document.querySelector('.battle-input').value === '');
      alternateRejected = true;
    }
    await input.fill(q.text[0]); await page.evaluate(() => { window.vocabularyTestNow += 10000; });
    await page.keyboard.type(q.text.slice(1));
    const card = page.locator('[data-previous-review]').locator('..'); await card.waitFor();
    const feedback = card.locator('[data-vocabulary-usage-note]');
    assert.equal(await feedback.count(), usageNote ? 1 : 0);
    if (usageNote) assert.ok((await feedback.innerText()).includes(usageNote), 'Complete bridge after answering');
    assert.equal(await page.locator('.battle-question-panel [data-vocabulary-usage-note]').count(), 0, 'Supplement stays out of the current prompt');
    assert.ok((await card.innerText()).includes(q.text));
    const labels = getQuestionSynonymLabels(course, 1, q);
    for (const label of labels) assert.ok((await card.innerText()).includes(label), text + ': full sense note');
    if (labels.length) assert.ok((await card.innerText()).includes(getQuestionSynonymHeading(course, 1, q)));
    for (const removed of ['room-sharing companion', 'receptacle', 'galvanize']) assert.ok(!(await card.innerText()).includes(removed));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, text + ': no horizontal overflow');
    const panel = await page.locator('.battle-question-panel').boundingBox();
    if (width >= 800) assert.ok(panel && panel.y + panel.height <= height, text + ': tablet input remains on screen');
    const after = await record();
    assert.deepEqual(after.statuses['Eiken5:1:banana:バナナ'], before.statuses['Eiken5:1:banana:バナナ']);
    assert.deepEqual(after.marks, before.marks); assert.deepEqual(after.defeats, before.defeats);
    assert.deepEqual(after.otherPlayer, before.otherPlayer);
    assert.deepEqual(Object.keys(after.statuses).sort(), Object.keys(before.statuses).sort(), 'No new keys made from display meanings');
    assert.equal(after.statuses[legacyKey][inputMode === 'voice-text' ? 'listeningLevel' : 'battleLevel'], alternateRejected ? 1 : 2,
      'Normal learning still advances under its original identity');
    if (inputMode === 'voice-text') assert.equal(after.statuses[legacyKey].battleLevel, 1, 'Listening does not grant battle mastery');
    if (out) await page.screenshot({ path: path.join(out, `${course}-${text}-${inputMode}-${width}.png`), fullPage: true });
    let resultChecked = false;
    if (['correctly', 'process', 'determine', 'container', 'label', 'digest', 'identity'].includes(text) && inputMode === 'text-only') {
      for (let i = 0; i < 35 && await input.count(); i++) {
        await page.evaluate(() => { window.vocabularyTestNow += 1000; });
        await page.getByRole('button', { name: 'この問題をスキップ', exact: true }).click();
        await page.waitForTimeout(100);
      }
      const details = page.locator('[data-result-question]').first();
      await details.waitFor();
      for (const label of labels) assert.ok((await details.innerText()).includes(label));
      assert.ok((await details.innerText()).includes(getQuestionMeaning(q, course)));
      assert.equal(await details.locator('[data-vocabulary-usage-note]').count(), usageNote ? 1 : 0);
      if (usageNote) assert.ok((await details.innerText()).includes(usageNote));
      const note = details.locator('[data-result-synonyms]').first();
      if (labels.length) assert.equal(await note.evaluate(element => getComputedStyle(element).textOverflow), 'clip', 'Do not truncate sense notes in results');
      if (out) await page.screenshot({ path: path.join(out, `result-${text}-${width}.png`), fullPage: true });
      resultChecked = true;
    }
    await page.reload();
    await page.getByRole('button', { name: '問題リスト', exact: true }).first().click();
    await page.getByPlaceholder('英語・日本語で検索', { exact: true }).waitFor();
    const reloaded = await record();
    assert.deepEqual(reloaded.statuses['Eiken5:1:banana:バナナ'], before.statuses['Eiken5:1:banana:バナナ']);
    assert.deepEqual(reloaded.marks, before.marks); assert.deepEqual(reloaded.defeats, before.defeats);
    assert.deepEqual(reloaded.otherPlayer, before.otherPlayer);
    assert.ok(reloaded.statuses[legacyKey]);
    await page.getByPlaceholder('英語・日本語で検索', { exact: true }).fill(q.text);
    const row = page.getByRole('article', { name: q.text, exact: true }); await row.waitFor();
    await row.scrollIntoViewIfNeeded();
    await page.waitForFunction(({ text, meaning }) => [...document.querySelectorAll('.library-row')]
      .some(element => element.getAttribute('aria-label') === text && element.innerText.includes(meaning)),
    { text: q.text, meaning: getQuestionMeaning(q, course) });
    assert.ok((await row.innerText()).includes(getQuestionMeaning(q, course)));
    for (const label of labels) assert.ok((await row.innerText()).includes(label));
    assert.equal(await row.locator('[data-vocabulary-usage-note]').count(), usageNote ? 1 : 0);
    if (usageNote) {
      assert.ok((await row.innerText()).includes(usageNote));
      // Neither recall direction may expose an answer through the new note.
      for (const [mode, button] of [['english', '和訳を見る'], ['meaning', '英語を見る']]) {
        await page.locator('.library-recall-mode select').selectOption(mode);
        const recallRow = page.locator('.library-row').filter({ has: page.getByRole('heading', { name: q.text, exact: true, includeHidden: true }) }).first();
        await recallRow.waitFor();
        assert.equal(await recallRow.locator('[data-vocabulary-usage-note]').count(), 0);
        await recallRow.getByRole('button', { name: button, exact: true }).click();
        assert.ok((await recallRow.locator('[data-vocabulary-usage-note]').innerText()).includes(usageNote));
      }
    }
    assert.deepEqual(errors, []);
    report.push({ course, text, width, height, inputMode, resultChecked, alternateRejected, usageNoteChecked: !!usageNote, savedIdentityRetained: true, otherRecordsRetained: true });
    console.log('PASS UI', course, text, width, inputMode);
    await context.close();
  }
} finally {
  if (out) fs.writeFileSync(path.join(out, 'ui-verification.json'), JSON.stringify({ url, cases: report, complete: report.length === cases.length }, null, 2));
  await cleanup();
}
// Playwright can retain an idle transport after the dedicated Chrome has exited.
process.exit(0);
