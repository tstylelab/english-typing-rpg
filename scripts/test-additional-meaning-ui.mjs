import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { load } from './lib/load-typescript-data.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const url = process.env.MEANING_TEST_URL || 'http://127.0.0.1:5178';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
try {
  for (const [difficulty, level, word] of [
    ['Eiken5', 2, 'get up'], ['EikenPre1Part1', 1, 'transfer'],
    ['EikenPre1Part2', 1, 'thaw'], ['Eiken1Part1', 1, 'vet'], ['Eiken1Part2', 1, 'oust'],
  ]) {
    for (const width of [1366, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const question = QUESTIONS[difficulty][level].find(q => q.text === word);
      const key = `${difficulty}:${level}:${question.text}:${question.translation}`;
      await page.addInitScript(({ difficulty, level, key }) => {
        speechSynthesis.speak = () => {};
        if (!localStorage.getItem('meaning-test-seeded')) {
          localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty, level, resumeMode: 'guide', resumeInputMode: 'voice-text' }));
          localStorage.setItem('etyping_manual_question_statuses', JSON.stringify({
            [key]: { practiceLevel: 3, listeningLevel: 3, battleLevel: 3, manualOverrideLevel: 3, excluded: false, updatedAt: 1 },
          }));
          localStorage.setItem('meaning-test-seeded', 'true');
        }
      }, { difficulty, level, key });
      await page.goto(url);
      await page.reload();
      await page.getByRole('button', { name: '単語リスト', exact: true }).click();
      const row = page.locator('.question-list-row').filter({ has: page.getByText(word, { exact: true }) });
      await row.scrollIntoViewIfNeeded();
      await row.getByText(getQuestionMeaning(question, difficulty), { exact: true }).waitFor();
      await row.getByText('手動優先', { exact: true }).waitFor();
      const box = await row.locator('.word-list-meaning').boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1, 'clipped meaning');
      assert.equal(await row.evaluate(e => e.scrollWidth > e.clientWidth), false);
      assert.deepEqual(errors, []);
      if (difficulty === 'Eiken1Part1') {
        const file = path.join(os.tmpdir(), `additional-meaning-${width}.png`);
        await row.screenshot({ path: file });
        console.log('Screenshot: ' + file);
      }
      console.log(`PASS list: ${difficulty} ${word}, ${width}px; persisted mastery retained.`);
      await context.close();
    }
  }
} finally { await browser.close(); }
