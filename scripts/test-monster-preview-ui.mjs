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
  const scenarios = [
    ...['Eiken5', 'Eiken4'].flatMap(course => [1366, 390].map(width => ({ course, level: course === 'Eiken5' ? 1 : 3, width, height: 800, dpr: 1 }))),
    { course: 'Eiken5', level: 1, width: 1920, height: 1080, dpr: 2 },
    { course: 'Eiken5', level: 1, width: 390, height: 640, dpr: 3, reducedMotion: 'reduce' },
    { course: 'Eiken5', level: 1, width: 844, height: 390, dpr: 1 },
  ];
  for (const { course, level, width, height, dpr, reducedMotion = 'no-preference' } of scenarios) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, reducedMotion });
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
      const previewUrls = () => new Set(artRequests.filter(src => src.includes('/1024/')));
      const measuredArtWidths = [];
      async function checkDialog(locked = false) {
        await dialog.waitFor();
        await dialog.evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
        assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
        const bounds = await dialog.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
        assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= height + 1);
        assert.ok(bounds.width < width && bounds.height < height, 'Preview must leave screen margins');
        assert.equal(await dialog.evaluate(el => getComputedStyle(el).transform), 'none', 'Opening animation must not retain a transform');
        const artBounds = await dialog.locator('.monster-preview-art').boundingBox();
        measuredArtWidths.push(Math.round(artBounds.width));
        if (width >= 1024) assert.ok(artBounds.width > 320, 'Desktop preview should be larger than its previous 320px size');
        if (reducedMotion === 'reduce') assert.equal(await dialog.evaluate(el => getComputedStyle(el).animationName), 'none');
        if (course === 'Eiken5') {
          const image = dialog.locator('img');
          await image.evaluate(img => img.decode());
          assert.ok(await image.evaluate(img => img.naturalWidth === 1024 && img.complete));
          assert.ok(artBounds.width * dpr <= 1024 + 1, 'Rendered physical pixels must not exceed the source resolution');
        } else assert.equal(await dialog.locator('svg[viewBox]').count(), 2); // avatar and close icon
        assert.equal(await dialog.locator('[data-monster-preview]').getAttribute('data-monster-preview'), locked ? 'locked' : 'unlocked');
        if (locked) {
          assert.equal(await dialog.getByRole('heading').textContent(), '???');
          assert.equal(await dialog.locator('[data-monster-preview] > div').evaluate(el => getComputedStyle(el).opacity), '0.3');
        }
        await dialog.locator('[data-monster-preview]').click();
        assert.ok(await dialog.isVisible(), 'Clicking the image must keep the dialog open');
      }
      assert.equal(previewUrls().size, 0, 'High-resolution art must not be fetched before a preview is opened');
      if (width >= 1024) {
        const trigger = page.locator('button[title="クリック・タップで拡大"]').first();
        const before = previewUrls().size;
        await trigger.click();
        await checkDialog();
        assert.equal(previewUrls().size, before + (course === 'Eiken5' ? 1 : 0), 'Only the opened monster should fetch high-resolution art');
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
      const beforeKnown = previewUrls().size;
      await known.click();
      await checkDialog();
      assert.equal(previewUrls().size, beforeKnown + (course === 'Eiken5' ? 1 : 0));
      await page.screenshot({ path: `${output}/collection-${course}-${width}.png` });
      await dialog.getByRole('button', { name: '拡大表示を閉じる', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
      assert.ok(await known.evaluate(el => el === document.activeElement));
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      await known.click();
      await checkDialog();
      assert.equal(previewUrls().size, beforeKnown + (course === 'Eiken5' ? 1 : 0), 'Reopening must reuse the same high-resolution asset');
      await page.keyboard.press('Escape');
      await page.locator('dialog').waitFor({ state: 'detached' });
      const locked = page.getByRole('button', { name: '未撃破のモンスターを拡大表示', exact: true }).first();
      const beforeLocked = previewUrls().size;
      await locked.click();
      await checkDialog(true);
      assert.equal(previewUrls().size, beforeLocked + (course === 'Eiken5' ? 1 : 0));
      await page.mouse.click(3, 3);
      await page.locator('dialog').waitFor({ state: 'detached' });
      assert.equal(await page.evaluate(() => localStorage.getItem('etyping_defeated_monsters')), defeatedBefore);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
      assert.deepEqual(errors, []);
      if (course !== 'Eiken5') assert.equal(artRequests.length, requestsBeforeCollectionPreview);
      report.push({ course, level, width, height, dpr, reducedMotion, measuredArtWidths, highResolutionAssetsRequested: previewUrls().size, title: width >= 1024, collectionTriggers: 43, lockedPreserved: true, closeButton: true, escape: true, backdrop: true, focusRestored: true, defeatedRecordsPreserved: true, errors });
      console.log(`PASS ${course} Level ${level}, ${width}x${height}, DPR ${dpr}`);
      await context.close();
  }
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
