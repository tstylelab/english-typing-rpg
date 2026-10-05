import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.MONSTER_PREVIEW_TEST_URL || 'http://127.0.0.1:5178';
const output = process.env.MONSTER_PREVIEW_TEST_OUTPUT || 'design/monster-samples/preview-check';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const closeTestBrowser = await trackTestBrowser(browser);
const report = [];
try {
  const courseLevels = (process.env.MONSTER_PREVIEW_TEST_CASES || 'Eiken5:1,Eiken5:2,Eiken5:3,Eiken4:1,Eiken4:2,Eiken4:3,Eiken3:1,Eiken3:2,Eiken3:3')
    .split(',').map(value => { const [course, level] = value.split(':'); return { course, level: Number(level) }; });
  const scenarios = [
    ...courseLevels.flatMap(({ course, level }) => [1366, 390].map(width => ({ course, level, width, height: 800, dpr: 1 }))),
    ...[1366, 390].map(width => ({ course: 'EikenPre2', level: 1, width, height: 800, dpr: 1 })),
    { course: 'Eiken5', level: 1, width: 1920, height: 1080, dpr: 2 },
    { course: 'Eiken5', level: 1, width: 390, height: 640, dpr: 3, reducedMotion: 'reduce' },
    { course: 'Eiken5', level: 1, width: 844, height: 390, dpr: 1 },
  ];
  for (const { course, level, width, height, dpr, reducedMotion = 'no-preference' } of scenarios) {
      const hasArt = ['Eiken5', 'Eiken4', 'Eiken3'].includes(course);
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, reducedMotion, hasTouch: width < 1024 });
      const page = await context.newPage();
      const errors = [];
      const artRequests = [];
      page.setDefaultTimeout(12000);
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.url().includes('/monsters/')) artRequests.push(request.url()); });
      await page.addInitScript(({ course, level }) => {
        speechSynthesis.speak = () => {};
        localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: course, level, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
        localStorage.setItem('etyping_defeated_monsters', JSON.stringify([`${course}:${level}:guide:voice-text:m${level}_1`, `${course}:${level}:guide:voice-text:m${level}_2`, `${course}:${level}:challenge:text-only:c${level}_1`]));
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
        if (hasArt) {
          const image = dialog.locator('img');
          await image.evaluate(img => img.decode());
          assert.ok(await image.evaluate(img => img.naturalWidth === 1024 && img.complete));
          assert.ok((await image.getAttribute('src')).includes(`/${course.toLowerCase()}-level${level}/1024/`), 'Preview artwork must belong to the selected course');
          assert.ok(artBounds.width * dpr <= 1024 + 1, 'Rendered physical pixels must not exceed the source resolution');
        } else assert.equal(await dialog.locator('.monster-preview-art svg[viewBox]').count(), 1);
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
        assert.equal(await dialog.getByRole('navigation').count(), 0, 'Single-monster top preview must not show gallery controls');
        const topHeading = await dialog.getByRole('heading').textContent();
        await page.keyboard.press('ArrowRight');
        assert.equal(await dialog.getByRole('heading').textContent(), topHeading);
        assert.equal(previewUrls().size, before + (hasArt ? 1 : 0), 'Only the opened monster should fetch high-resolution art');
        assert.equal(await page.locator('.battle-input').count(), 0, 'Preview must not start a battle');
        await page.screenshot({ path: `${output}/top-${course}-L${level}-${width}.png` });
        await page.keyboard.press('Escape');
        await page.locator('dialog').waitFor({ state: 'detached' });
        assert.ok(await trigger.evaluate(el => el === document.activeElement), 'Focus restored to the clicked monster');
      }
      await page.getByRole('button', { name: '図鑑', exact: true }).click();
      await page.getByRole('button', { name: { Eiken5: '英検5級', Eiken4: '英検4級', Eiken3: '英検3級', EikenPre2: '英検準2級' }[course], exact: true }).click();
      if (level !== 1) await page.getByRole('button', { name: `レベル ${level}`, exact: true }).click();
      const triggers = page.locator('button[title="クリック・タップで拡大"]');
      assert.equal(await triggers.count(), 43);
      const requestsBeforeCollectionPreview = artRequests.length;
      const known = triggers.first();
      const beforeKnown = previewUrls().size;
      await known.click();
      await checkDialog();
      assert.equal(previewUrls().size, beforeKnown + (hasArt ? 1 : 0));
      await page.screenshot({ path: `${output}/collection-${course}-L${level}-${width}.png` });
      await dialog.getByRole('button', { name: '拡大表示を閉じる', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
      assert.ok(await known.evaluate(el => el === document.activeElement));
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      await known.click();
      await checkDialog();
      assert.equal(previewUrls().size, beforeKnown + (hasArt ? 1 : 0), 'Reopening must reuse the same high-resolution asset');
      await page.keyboard.press('Escape');
      await page.locator('dialog').waitFor({ state: 'detached' });
      const locked = page.getByRole('button', { name: '未撃破のモンスターを拡大表示', exact: true }).first();
      const beforeLocked = previewUrls().size;
      await locked.click();
      await checkDialog(true);
      assert.equal(previewUrls().size, beforeLocked + (hasArt ? 1 : 0));
      await page.mouse.click(3, 3);
      await page.locator('dialog').waitFor({ state: 'detached' });
      const labels = await triggers.evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')));
      const monsterIds = await triggers.locator('img[data-monster-art]').evaluateAll(images => images.map(img => img.dataset.monsterArt));
      const visited = new Set();
      async function checkGallery(expectedIndex) {
        assert.equal(await dialog.locator('nav [aria-live]').textContent(), `${expectedIndex + 1} / 43`);
        assert.equal(await dialog.getByRole('button', { name: '前のモンスター', exact: true }).isDisabled(), expectedIndex === 0);
        assert.equal(await dialog.getByRole('button', { name: '次のモンスター', exact: true }).isDisabled(), expectedIndex === 42);
        const isLocked = labels[expectedIndex] === '未撃破のモンスターを拡大表示';
        assert.equal(await dialog.locator('[data-monster-preview]').getAttribute('data-monster-preview'), isLocked ? 'locked' : 'unlocked');
        assert.equal(await dialog.getByRole('heading').textContent(), isLocked ? '???' : labels[expectedIndex].replace('を拡大表示', ''));
        if (hasArt) {
          const currentImage = dialog.locator('.monster-preview-art img');
          await currentImage.evaluate(img => img.decode());
          assert.equal(await currentImage.getAttribute('data-monster-art'), monsterIds[expectedIndex]);
          visited.add(monsterIds[expectedIndex]);
        }
        assert.equal(await page.locator('dialog').count(), 1, 'Switching must reuse a single open dialog');
        assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
      }
      const beforeNavigation = previewUrls();
      await known.click();
      await checkDialog();
      await checkGallery(0);
      await page.keyboard.press('ArrowLeft');
      await checkGallery(0);
      await page.keyboard.press('ArrowRight');
      await checkGallery(1);
      await dialog.getByRole('button', { name: '次のモンスター', exact: true }).click();
      await checkGallery(2); // locked after two known monsters
      await dialog.getByRole('button', { name: '前のモンスター', exact: true }).click();
      await checkGallery(1);
      if (width < 1024) {
        const cdp = await context.newCDPSession(page);
        async function swipe(dx, dy = 0) {
          const area = await dialog.locator('[data-monster-preview]').boundingBox();
          const x = area.x + area.width / 2 - dx / 2;
          const y = area.y + area.height / 2 - dy / 2;
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
          for (let step = 1; step <= 4; step++) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * step / 4, y: y + dy * step / 4 }] });
          }
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        }
        await swipe(-90);
        await checkGallery(2);
        await swipe(90);
        await checkGallery(1);
        await swipe(8); // a tap / short motion must not switch
        await checkGallery(1);
        await swipe(10, 80); // vertical scrolling must not switch
        await checkGallery(1);
        await cdp.detach();
      }
      await page.screenshot({ path: `${output}/navigation-${course}-L${level}-${width}.png` });
      await page.keyboard.press('Escape');
      await page.locator('dialog').waitFor({ state: 'detached' });
      await triggers.nth(19).click();
      await checkGallery(19);
      await page.keyboard.press('ArrowRight');
      await checkGallery(20); // training -> danger in the displayed order
      await page.keyboard.press('Escape');
      await page.locator('dialog').waitFor({ state: 'detached' });
      const last = triggers.last();
      await last.click();
      await checkGallery(42);
      await page.keyboard.press('ArrowRight');
      await checkGallery(42);
      await page.keyboard.press('ArrowLeft');
      await checkGallery(41);
      await dialog.getByRole('button', { name: '拡大表示を閉じる', exact: true }).click();
      await page.locator('dialog').waitFor({ state: 'detached' });
      assert.ok(await last.evaluate(el => el === document.activeElement));
      for (const src of previewUrls()) {
        if (!beforeNavigation.has(src)) assert.ok(visited.has(src.split('/').pop().replace('.webp', '')), 'Gallery must not load unopened high-resolution images');
      }
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      assert.equal(await page.evaluate(() => localStorage.getItem('etyping_defeated_monsters')), defeatedBefore);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
      assert.deepEqual(errors, []);
      if (!hasArt) assert.equal(artRequests.length, requestsBeforeCollectionPreview);
      report.push({ course, level, width, height, dpr, reducedMotion, measuredArtWidths, highResolutionAssetsRequested: previewUrls().size, title: width >= 1024, collectionTriggers: 43, galleryButtons: true, galleryKeyboard: true, galleryTouch: width < 1024, boundaries: true, trainingToDanger: true, lockedPreserved: true, closeButton: true, escape: true, backdrop: true, focusRestored: true, defeatedRecordsPreserved: true, errors });
      console.log(`PASS ${course} Level ${level}, ${width}x${height}, DPR ${dpr}`);
      await page.goto('about:blank');
      await context.close();
  }
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
} finally {
  await closeTestBrowser();
}
process.exit(0);
