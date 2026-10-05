import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.COURSE_SELECT_TEST_URL || 'http://127.0.0.1:5178';
const output = process.env.COURSE_SELECT_TEST_OUTPUT || 'design/course-select-layout-local';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const closeTestBrowser = await trackTestBrowser(browser);
const report = [];
async function visibleAction(page, height) {
  const button = page.getByRole('button', { name: 'この教材で始める', exact: true });
  const box = await button.boundingBox();
  assert.ok(box && box.y >= 0 && box.y + box.height <= height, 'Start action must be visible without scrolling');
  assert.ok(box.height >= 44, 'Keep a touch-sized target');
  assert.ok(await button.evaluate(element => {
    const r = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  }), 'Start action must not be covered');
  return box;
}
try {
  for (const [width, height] of [[1660, 938], [1366, 768], [1024, 768], [768, 1024], [390, 844], [320, 568], [844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1024 });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (!['http:', 'https:'].includes(location.protocol)) return;
      speechSynthesis.speak = () => {};
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken4', level: 2, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
    });
    await page.goto(url);
    await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
    await page.locator('.course-grade-button').first().waitFor();
    const initialAction = await visibleAction(page, height);
    assert.equal(await page.locator('.course-grade-button').count(), 9);
    const gradeHeights = await page.locator('.course-grade-button').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    assert.ok(Math.max(...gradeHeights) < 100, 'Grade choices should use much less than the old 112px minimum');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal page overflow');
    if (width >= 1024) {
      const level = await page.locator('.course-level-button').last().boundingBox();
      assert.ok(level.y + level.height < initialAction.y, 'All PC choices should fit above the action without scrolling');
    }
    await page.screenshot({ path: `${output}/course-${width}x${height}.png`, fullPage: false });
    await page.locator('.course-grade-button').filter({ hasText: '英検1級②' }).click();
    await page.locator('.course-level-button').filter({ hasText: 'Level 3' }).click();
    await visibleAction(page, height);
    await page.locator('.course-select-action').getByText('英検1級② Level 3', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
    await page.getByRole('button', { name: /Translation Battle/ }).waitFor();
    assert.equal(await page.locator('.course-select-action').count(), 0, 'Action only belongs to the selection page');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_last_selected_course')));
    assert.equal(saved.difficulty, 'Eiken1Part2');
    assert.equal(saved.level, 3);
    await page.getByRole('button', { name: '教材を変える', exact: true }).click();
    await page.getByRole('button', { name: /^英会話/ }).click();
    assert.equal(await page.locator('.course-grade-button').count(), 1);
    await page.locator('.course-level-button').filter({ hasText: 'Level 2' }).click();
    await visibleAction(page, height);
    await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
    await page.getByRole('button', { name: /会話の型/ }).waitFor();
    assert.deepEqual(errors, []);
    report.push({ width, height, initialAction, gradeHeights, noHorizontalOverflow: true, selectionPersisted: true, conversation: true, errors: [...errors] });
    await page.goto('about:blank');
    await context.close();
    console.log(`PASS course select ${width}x${height}`);
  }
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
} finally { await closeTestBrowser(); }
