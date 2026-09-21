import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const corrections = JSON.parse(readFileSync(new URL('../src/data/pre1MeaningCorrections.json', import.meta.url), 'utf8'));
const url = process.env.MEANING_TEST_URL || 'http://127.0.0.1:5178';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const q = corrections.find(q => q.text === 'demonstrate');
  await page.addInitScript(q => {
    speechSynthesis.speak = () => {};
    // Seed once, so reloading also tests normal persistence. No real user browser data.
    if (!localStorage.getItem('meaning-test-seeded')) {
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify({
        [`EikenPre1Part1:1:${q.text}:${q.translation}`]: {
          practiceLevel: 3, listeningLevel: 3, battleLevel: 3, manualOverrideLevel: 3,
          excluded: false, updatedAt: 1,
        },
      }));
      localStorage.setItem('meaning-test-seeded', 'true');
    }
  }, q);
  await page.goto(url);
  const openList = async () => {
    await page.getByRole('button', { name: '単語リスト', exact: true }).click();
    await page.getByRole('button', { name: '英検準1級①', exact: true }).click();
    const more = page.getByRole('button', { name: 'さらに表示', exact: true });
    while (await more.count()) await more.click();
  };
  await openList();
  for (const width of [1366, 820, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const word of ['demonstrate', 'shift', 'conventional', 'overall', 'notably', 'publicity']) {
      const row = page.locator('.question-list-row').filter({ has: page.getByText(word, { exact: true }) });
      await row.scrollIntoViewIfNeeded();
      const meaning = row.locator('.word-list-meaning');
      await page.waitForTimeout(100);
      const displayed = await meaning.innerText();
      assert.ok(displayed.includes(corrections.find(q => q.text === word).meaning), `${word}: ${displayed}`);
      const box = await meaning.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1, `${word}: clipped at ${width}`);
      assert.equal(await row.evaluate(e => e.scrollWidth > e.clientWidth), false);
    }
    console.log(`PASS: six reported words at ${width}px`);
  }
  const row = page.locator('.question-list-row').filter({ has: page.getByText('demonstrate', { exact: true }) });
  await row.scrollIntoViewIfNeeded();
  await row.getByText('手動優先', { exact: true }).waitFor({ state: 'visible' });
  assert.ok(await row.getByText('覚えた', { exact: true }).count());
  await page.reload();
  await openList();
  await row.scrollIntoViewIfNeeded();
  await row.getByText('手動優先', { exact: true }).waitFor({ state: 'visible' });
  assert.deepEqual(errors, []);
  console.log('PASS: legacy saved learning state retained after reload; no browser errors.');
} finally { await browser.close(); }
