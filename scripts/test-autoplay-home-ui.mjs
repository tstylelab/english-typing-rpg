import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionExample } = load('src/data/questionExamples.ts');
const question = QUESTIONS.Eiken5[1][0];
const example = getQuestionExample('Eiken5', 1, question);
assert.ok(question);
assert.ok(example);
const questionKey = `Eiken5:1:${question.text}:${question.translation}`;
const settings = { source: 'marked', playbackScope: 'all', playText: true, playTranslation: true, playExample: true, repeat: true, shuffle: false, playbackRatePercent: 75 };
const output = 'node_modules/.tmp/autoplay-home';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
try {
  for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ settings, questionKey }) => {
      window.spoken = [];
      speechSynthesis.speak = utterance => window.spoken.push(utterance);
      speechSynthesis.cancel = () => {};
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken3', level: 3 }));
      localStorage.setItem('etyping_marked_question_keys_by_scope', JSON.stringify({ 'Eiken5:1': [questionKey] }));
      localStorage.setItem('etyping_auto_play_settings', JSON.stringify(settings));
    }, { settings, questionKey });
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5190');
    await page.getByRole('button', { name: '連続再生', exact: true }).click();
    await page.waitForFunction(() => {
      const player = document.querySelector('[data-autoplay-player]');
      return window.spoken.length && player && Math.abs(player.getBoundingClientRect().top - 12) < 2;
    });
    const start = page.getByRole('button', { name: 'この設定で連続再生を開始', exact: true });
    const panel = page.locator('[data-autoplay-now-playing]');
    // No test scrolling: the home action itself must make the controls/content visible.
    for (const [name, locator] of [['Start', start], ['Stop', page.getByRole('button', { name: '停止', exact: true })], ['English', panel.getByText(question.text, { exact: true })], ['Japanese', panel.getByText(question.translation, { exact: true })], ['Example', panel.getByText(example, { exact: true })]]) {
      const box = await locator.boundingBox();
      assert.ok(box && box.y >= 0 && box.y + box.height <= viewport.height, `${viewport.width}px: ${name} visible without scrolling: ${JSON.stringify(box)}`);
    }
    assert.equal(await page.locator('[data-autoplay-course]').innerText(), '英検5級 · Level 1', 'Saved cross-grade scope is used instead of the home course');
    assert.equal(await page.evaluate(() => window.spoken[0].text), question.text);
    assert.equal(await page.evaluate(() => window.spoken[0].rate), 0.75);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_auto_play_settings')));
    for (const [name, value] of Object.entries(settings)) assert.deepEqual(saved[name], value, `${name} is preserved`);
    await page.screenshot({ path: `${output}/home-playing-${viewport.width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.getByRole('button', { name: '停止', exact: true }).click();
    assert.ok(await start.isEnabled());
    await start.click();
    assert.equal(await page.evaluate(() => window.spoken.length), 2, 'Restart still works');
    await page.getByRole('button', { name: '設定を変える', exact: true }).click();
    const heading = await page.getByRole('heading', { name: '連続再生の設定', exact: true }).boundingBox();
    assert.ok(heading.y >= 0 && heading.y < viewport.height, 'Settings remain easy to reach');
    await page.reload();
    await page.getByRole('button', { name: '連続再生の設定', exact: true }).click();
    await page.waitForFunction(() => {
      const title = [...document.querySelectorAll('h3')].find(el => el.textContent === '連続再生の設定');
      return title && title.getBoundingClientRect().top >= 0 && title.getBoundingClientRect().top < innerHeight;
    });
    assert.equal(await page.evaluate(() => window.spoken.length), 0, 'Settings button does not start playback');
    assert.deepEqual(errors, []);
    console.log(`PASS ${viewport.width}px: home starts saved settings, start/stop and English/Japanese/example in view, settings navigation, no overflow`);
    await context.close();
  }
  const emptyContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const emptyPage = await emptyContext.newPage();
  await emptyPage.addInitScript(settings => {
    window.spoken = [];
    speechSynthesis.speak = utterance => window.spoken.push(utterance);
    speechSynthesis.cancel = () => {};
    localStorage.setItem('etyping_auto_play_settings', JSON.stringify(settings));
  }, settings);
  await emptyPage.goto(process.env.TEST_URL || 'http://127.0.0.1:5190');
  await emptyPage.getByRole('button', { name: '連続再生', exact: true }).click();
  await emptyPage.waitForFunction(() => Math.abs(document.querySelector('[data-autoplay-player]')?.getBoundingClientRect().top - 12) < 2);
  const emptyMessage = emptyPage.getByText('再生できる問題がありません。「設定を変える」から対象を選んでください。', { exact: true });
  const messageBox = await emptyMessage.boundingBox();
  assert.ok(messageBox.y >= 0 && messageBox.y + messageBox.height <= 844, 'Empty saved group explains what to do in the player');
  assert.ok(await emptyPage.getByRole('button', { name: 'この設定で連続再生を開始', exact: true }).isDisabled());
  assert.equal(await emptyPage.evaluate(() => window.spoken.length), 0, 'Empty saved group does not fall back to other questions');
  console.log('PASS empty review group: visible explanation and settings link, no unrelated playback');
  await emptyContext.close();
} finally { await cleanup(); }
