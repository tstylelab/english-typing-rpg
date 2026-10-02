import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { load } from './lib/load-typescript-data.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const questions = QUESTIONS.Eiken4[3];
const screenshotCases = [
  'Anything else?',
  'Please be kind to animals.',
  'Why not?',
  'We are going to visit Grandma.',
  'My father was cooking dinner at six.',
  "I'd like to see a movie.",
  'You should see a doctor.',
  'It is easy for me to read this book.',
  'I hope you have a nice trip.',
  'I will help you tomorrow.',
  'Let me carry your bag.',
  'Sounds nice.',
  'Can you tell me how to use this?',
  'Thank you for showing me the way.',
];
for (const text of screenshotCases) {
  const question = questions.find(question => question.text === text);
  assert.ok(question, `Missing question: ${text}`);
  assert.notEqual(getQuestionMeaning(question, 'Eiken4'), question.translation, `Missing display correction: ${text}`);
}

const url = process.env.MEANING_TEST_URL || 'http://127.0.0.1:5178';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
try {
  for (const text of [
    'Anything else?', 'Please be kind to animals.', 'Why not?',
    'We are going to visit Grandma.', 'Sounds nice.',
  ]) {
    const question = questions.find(question => question.text === text);
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ questions, text }) => {
      speechSynthesis.speak = () => {};
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({
        difficulty: 'Eiken4', level: 3, resumeMode: 'guide', resumeInputMode: 'voice-text',
      }));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map(question => [
        `Eiken4:3:${question.text}:${question.translation}`,
        { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: question.text !== text, updatedAt: 0 },
      ]))));
    }, { questions, text });
    await page.goto(url);
    await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
    await page.locator('.battle-screen').waitFor();
    await page.getByText(getQuestionMeaning(question, 'Eiken4'), { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`PASS: ${text}`);
    await page.close();
  }
} finally {
  await browser.close();
}
