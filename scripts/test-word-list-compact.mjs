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
 for (const width of [1366, 1180, 1024, 820, 768, 640, 390, 320]) {
   await page.setViewportSize({ width, height: 900 });
   await row.scrollIntoViewIfNeeded();
   await page.waitForTimeout(250);
   const box = await row.boundingBox();
   assert.ok(box.height < (width > 767 ? 180 : 300), `Compact row at ${width}: ${box.height}`);
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
   assert.equal(await row.evaluate(e => e.scrollWidth > e.clientWidth), false);
   const meaning = await row.locator('.word-list-meaning').boundingBox();
   assert.ok(meaning.x >= box.x && meaning.x + meaning.width <= box.x + box.width + 1, `Meaning stays inside card at ${width}`);
   assert.ok(await row.getByText('例文', { exact: true }).isVisible());
   if (process.env.WORD_LIST_SCREENSHOT_DIR && width !== 320) await page.screenshot({ path: `${process.env.WORD_LIST_SCREENSHOT_DIR}/word-list-${width}.png` });
   console.log(`PASS width ${width}: row height ${box.height}px`);
 }
 // Resize while scrolled down, including cards previously skipped by content-visibility.
 const distant = page.locator('.question-list-row').nth(14);
 for (const width of [1500, 1180, 900, 768, 390, 1500]) {
   await page.setViewportSize({width, height:800});
   await distant.scrollIntoViewIfNeeded();
   await page.waitForTimeout(200);
   const clipping = await distant.evaluate(e => {
     const r = e.getBoundingClientRect();
     const meaning = e.querySelector('.word-list-meaning').getBoundingClientRect();
     const ancestors = []; for (let p = e.parentElement; p; p=p.parentElement) {
       if (['hidden','auto','scroll','clip'].includes(getComputedStyle(p).overflowX)) ancestors.push(p.getBoundingClientRect().right);
     }
     return meaning.right > Math.min(innerWidth, ...ancestors) + 1 || r.right > innerWidth + 1;
   });
   assert.equal(clipping, false, `No clipped translation after resize at ${width}`);
 }
 await row.scrollIntoViewIfNeeded();
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
