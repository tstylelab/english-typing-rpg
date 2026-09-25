import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { load } from './lib/load-typescript-data.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionSynonyms } = load('src/data/questionSynonyms.ts');
const url = process.env.SYNONYM_TEST_URL || 'http://127.0.0.1:5178';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname));
const cases = [
  ['Eiken5', 2, 'turn on'], ['Eiken4', 2, 'kind of tired'],
  ['Eiken3', 1, 'fix'], ['EikenPre2', 1, 'let'], ['Eiken2', 1, 'ray'],
  ['EikenPre1Part1', 1, 'invest'], ['EikenPre1Part2', 1, 'harbor'],
  ['Eiken1Part1', 1, 'vet'], ['Eiken1Part2', 1, 'vie'],
];
const server = await chromium.launchServer({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const browser = await chromium.connect(server.wsEndpoint());
async function bounded(promise, milliseconds = 10000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Browser cleanup timed out')), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}

async function prepare(difficulty, level, word, width, battle = false) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const qs = QUESTIONS[difficulty][level];
  await page.addInitScript(({ difficulty, level, qs, word, battle }) => {
    speechSynthesis.speak = () => {};
    localStorage.setItem('etyping_external_keyboard_mode', 'true');
    localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty, level, resumeMode: 'guide', resumeInputMode: 'voice-text' }));
    localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(qs.map(q => [
      `${difficulty}:${level}:${q.text}:${q.translation}`,
      { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: battle && q.text !== word, updatedAt: 0 },
    ]))));
  }, { difficulty, level, qs, word, battle });
  await page.goto(url);
  return { context, page, errors, q: qs.find(q => q.text === word) };
}

try {
  for (const [difficulty, level, word] of cases) {
    for (const width of [1366, 390]) {
      const { context, page, errors, q } = await prepare(difficulty, level, word, width);
      try {
        await page.getByRole('button', { name: '単語リスト', exact: true }).click();
        const row = page.locator('.question-list-row').filter({ has: page.getByText(word, { exact: true }) });
        await row.scrollIntoViewIfNeeded();
        const expected = getQuestionSynonyms(difficulty, level, q).join(' / ');
        await row.getByText(`類義/関連: ${expected}`, { exact: true }).waitFor();
        assert.equal(await row.evaluate(el => el.scrollWidth > el.clientWidth + 1), false, `${word}: horizontal overflow`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${word}: page overflow`);
        const box = await row.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
        if (difficulty === 'Eiken3') {
          const omitted = page.locator('.question-list-row').filter({ has: page.getByText('fan', { exact: true }) });
          assert.equal(await omitted.count(), 1);
          assert.equal(await omitted.getByText('類義/関連:', { exact: true }).count(), 0);
          const file = path.join(os.tmpdir(), `synonyms-grade3-${width}.png`);
          await row.screenshot({ path: file });
          console.log(`Screenshot: ${file}`);
        }
        assert.deepEqual(errors, []);
        console.log(`PASS list ${difficulty} L${level} ${word} ${width}px: ${expected}`);
      } finally { await bounded(context.close()); }
    }
  }
  for (const [difficulty, level, word] of cases) {
    const { context, page, errors, q } = await prepare(difficulty, level, word, 1366, true);
    try {
      await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
      await page.locator('.battle-screen').waitFor();
      await page.locator('.battle-input').waitFor({ state: 'attached' });
      await page.keyboard.type(word, { delay: 40 });
      const review = page.locator('.battle-previous-study');
      await review.getByText(getQuestionSynonyms(difficulty, level, q).join(' / '), { exact: true }).waitFor();
      assert.deepEqual(errors, []);
      console.log(`PASS after-answer card: ${difficulty} L${level} ${word}`);
    } finally { await bounded(context.close()); }
  }
  console.log('PASS: all 18 list viewport cases and 9 after-answer cards.');
} finally {
  // This test owns the server. Do not let a Windows browser shutdown hang leave
  // the test runner (or a hidden test browser) alive after the checks finish.
  try { await bounded(browser.close()); }
  finally {
    try { await bounded(server.close()); }
    catch { await server.kill(); }
  }
}
