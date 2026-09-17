import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
try {
 const page = await browser.newPage();
 const errors = []; page.on('pageerror', e => errors.push(e.message));
 await page.addInitScript(() => { speechSynthesis.speak = () => {}; });
 await page.goto('http://127.0.0.1:5178');
 await page.getByRole('button', { name: '単語リスト', exact: true }).click();
 await page.getByRole('button', { name: '英検準1級①', exact: true }).click();
 const row = page.locator('.question-list-row').first();
 for (const width of [1366, 390, 320]) {
   await page.setViewportSize({ width, height: 900 });
   await row.scrollIntoViewIfNeeded();
   await page.waitForTimeout(250);
   const box = await row.boundingBox();
   assert.ok(box.height < (width > 767 ? 180 : 300), `Compact row at ${width}: ${box.height}`);
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
   assert.equal(await row.evaluate(e => e.scrollWidth > e.clientWidth), false);
   assert.ok(await row.getByText('例文', { exact: true }).isVisible());
   if (process.env.WORD_LIST_SCREENSHOT_DIR && width !== 320) await page.screenshot({ path: `${process.env.WORD_LIST_SCREENSHOT_DIR}/word-list-${width}.png` });
   console.log(`PASS width ${width}: row height ${box.height}px`);
 }
 await row.getByRole('checkbox').check();
 assert.ok(await row.getByText('選択中', { exact: true }).isVisible());
 await row.getByRole('button', { name: '覚えた', exact: true }).click();
 assert.ok(await row.getByText('手動優先', { exact: true }).isVisible());
 assert.ok(await row.getByText(/自動判定:/).isVisible());
 await row.getByRole('button', { name: 'あとで復習', exact: true }).click();
 assert.ok(await row.getByRole('button', { name: '復習から外す', exact: true }).isVisible());
 await row.getByRole('button', { name: '除外する', exact: true }).click();
 assert.ok(await row.getByText('除外中', { exact: true }).isVisible());
 await row.getByRole('button', { name: '除外を解除', exact: true }).click();
 assert.deepEqual(errors, []);
 console.log('PASS selection, learning state, automatic state, review mark, exclusion');
} finally { await browser.close(); }
