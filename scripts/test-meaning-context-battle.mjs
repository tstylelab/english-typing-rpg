import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { load } from './lib/load-typescript-data.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const url = process.env.MEANING_TEST_URL || 'http://127.0.0.1:5178';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
try {
  for (const [difficulty, level, word] of [
    ['Eiken4', 2, 'get up'], ['Eiken3', 1, 'bake'],
    ['EikenPre2', 1, 'roast'], ['Eiken2', 1, 'recover'], ['Eiken2', 1, 'rely'],
    ['Eiken5', 2, 'get up'], ['EikenPre1Part1', 1, 'enact'],
    ['EikenPre1Part2', 1, 'thaw'], ['Eiken1Part1', 1, 'abolish'], ['Eiken1Part2', 1, 'erupt'],
  ]) {
    const questions = QUESTIONS[difficulty][level];
    const target = questions.find(q => q.text === word);
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ difficulty, level, word, questions }) => {
      speechSynthesis.speak = () => {};
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty, level, resumeMode: 'guide', resumeInputMode: 'voice-text' }));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map(q => [
        `${difficulty}:${level}:${q.text}:${q.translation}`,
        { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: q.text !== word, updatedAt: 0 },
      ]))));
    }, { difficulty, level, word, questions });
    await page.goto(url);
    await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
    await page.locator('.battle-screen').waitFor();
    await page.getByText(getQuestionMeaning(target, difficulty), { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`PASS battle: ${difficulty} ${word} -> ${getQuestionMeaning(target, difficulty)}`);
    await page.close();
  }
} finally { await browser.close(); }
