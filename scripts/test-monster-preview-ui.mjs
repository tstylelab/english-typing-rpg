import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.MONSTER_PREVIEW_TEST_URL || 'http://127.0.0.1:5178';
const output = process.env.MONSTER_PREVIEW_TEST_OUTPUT || 'design/monster-samples/preview-check';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const report = [];
try {
  for (const [course, level] of [['Eiken5', 1], ['Eiken4', 3]]) {
    for (const width of [1366, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await context.newPage();
      const errors = [];
      const artRequests = [];
      page.setDefaultTimeout(12000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.url().includes('/monsters/')) artRequests.push(request.url()); });
      await page.addInitScript(({ course, level }) => {
        speechSynthesis.speak = () => {};
        localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: course, level, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
        localStorage.setItem('etyping_defeated_monsters', JSON.stringify([`${course}:${level}:guide:voice-text:m${level}_1`, `${course}:${level}:challenge:text-only:c${level}_1`]));
      }, { course, level });
      await page.goto(url);
      await page.getByRole('button', { name: '図鑑', exact: true }).waitFor();
      const defeatedBefore = await page.evaluate(() => localStorage.getItem('etyping_defeated_monsters'));
      const dialog = page.getByRole('dialog');
      async function checkDialog(locked = false) {
        await dialog.waitFor();
        assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
        const bounds = await dialog.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
        assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 801);
        if (course === 'Eiken5') {
          const image = dialog.locator('img');
          await image.evaluate(img => img.decode());
          assert.ok(await image.evaluate(img => img.naturalWidth === 384 && img.complete));
        } else assert.equal(await dialog.locator('svg[viewBox]').count(), 2); // avatar and close icon
        assert.equal(await dialog.locator('[data-monster-preview]').getAttribute('data-monster-preview'), locked ? 'locked' : 'unlocked');
        if (locked) {
          assert.equal(await dialog.getByRole('heading').textContent(), '???');
          assert.equal(await dialog.locator('[data-monster-preview] > div').evaluate(el => getComputedStyle(el).opacity), '0.3');
        }
        await dialog.locator('[data-monster-preview]').click();
        assert.ok(await dialog.isVisible(), 'Clicking the image must keep the dialog open');
      }
      if (width >= 1024) {
        const trigger = page.locator('button[title="クリック・タップで拡大"]').first();
        const before = artRequests.length;
        await trigger.click();
        await checkDialog();
        assert.equal(artRequests.length, before, 'Top enlargement should reuse its existing image URL');
        assert.equal(await page.locator('.battle-input').count(), 0, 'Preview must not start a battle');
        await page.screenshot({ path: `${output}/top-${course}-${width}.png` });
        await page.keyboard.press('Escape');
        await page.locator('dialog').waitFor({ state: 'detached' });
        assert.ok(await trigger.evaluate(el => el === document.activeElement), 'Focus restored to the clicked monster');
      }
      await page.getByRole('button', { name: '図鑑', exact: true }).click();
      if (course === 'Eiken4') await page.getByRole('button', { name: '英検4級', exact: true }).click();
      if (level !== 1) await page.getByRole('button', { name: `レベル ${level}`, exact: true }).click();
      const triggers = page.locator('button[title="クリック・タップで拡大"]');
      assert.equal(await triggers.count(), 43);
      const requestsBeforeCollectionPreview = artRequests.length;
      const known = triggers.first();
      await known.click();
      await checkDialog();
      await page.screenshot({ path: `${output}/collection-${course}-${width}.png` });
      await dialog.getByRole('button', { name: '拡大表示を閉じる', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
      assert.ok(await known.evaluate(el => el === document.activeElement));
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      const locked = page.getByRole('button', { name: '未撃破のモンスターを拡大表示', exact: true }).first();
      await locked.click();
      await checkDialog(true);
      await page.mouse.click(3, 3);
      await page.locator('dialog').waitFor({ state: 'detached' });
      assert.equal(await page.evaluate(() => localStorage.getItem('etyping_defeated_monsters')), defeatedBefore);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
      assert.deepEqual(errors, []);
      if (course !== 'Eiken5') assert.equal(artRequests.length, requestsBeforeCollectionPreview);
      report.push({ course, level, width, title: width >= 1024, collectionTriggers: 43, lockedPreserved: true, closeButton: true, escape: width >= 1024, backdrop: true, focusRestored: true, defeatedRecordsPreserved: true, errors });
      console.log(`PASS ${course} Level ${level}, ${width}px`);
      await context.close();
    }
  }
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
