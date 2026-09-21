import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const corrections = JSON.parse(readFileSync(new URL('../src/data/grade4MeaningCorrections.json', import.meta.url), 'utf8'));
const url = process.env.MEANING_TEST_URL || 'http://127.0.0.1:5178';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(rows => {
    speechSynthesis.speak = () => {};
    if (!localStorage.getItem('meaning-test-seeded')) {
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(rows.map(q => [
        `Eiken4:${q.level}:${q.text}:${q.translation}`,
        { practiceLevel: 3, listeningLevel: 3, battleLevel: 3, manualOverrideLevel: 3, excluded: false, updatedAt: 1 },
      ]))));
      localStorage.setItem('meaning-test-seeded', 'true');
    }
  }, corrections);
  await page.goto(url);
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    // Reload exercises persistence too, in an isolated browser profile.
    await page.reload();
    await page.getByRole('button', { name: '単語リスト', exact: true }).click();
    {
      await page.getByRole('button', { name: '英検4級', exact: true }).click();
      for (const level of [1, 2, 3]) {
        await page.getByRole('button', { name: `Level ${level}`, exact: true }).click();
        const group = corrections.filter(q => q.level === level);
        while (await page.getByRole('button', { name: /さらに表示/ }).count()) {
          await page.getByRole('button', { name: /さらに表示/ }).click();
        }
        const allText = await page.locator('.question-list-row').allTextContents();
        for (const q of group) assert.ok(allText.some(text => text.includes(q.text) && text.includes(q.meaning)), q.text);
        for (const q of [group[0], group.reduce((a, b) => a.meaning.length > b.meaning.length ? a : b)]) {
          const row = page.locator('.question-list-row').filter({ has: page.getByText(q.text, { exact: true }) });
          await row.scrollIntoViewIfNeeded();
          await row.getByText('手動優先', { exact: true }).waitFor({ state: 'visible' });
          const box = await row.locator('.word-list-meaning').boundingBox();
          assert.ok(box.x >= 0 && box.x + box.width <= width + 1, `clipped: ${q.text} / ${width}`);
          assert.equal(await row.evaluate(e => e.scrollWidth > e.clientWidth), false);
        }
        console.log(`PASS: Grade 4, Level ${level}, ${group.length} corrections, ${width}px, saved state retained`);
      }
    }
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
