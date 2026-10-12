import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5178';
const sentence = 'This is a picture taken by my father.';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const configs = [
  { label: 'Windows Chrome, USB OFF', external: false },
  { label: 'Windows Chrome, USB ON', external: true },
  { label: 'Android tablet emulation, USB ON', external: true, android: true },
  { label: 'Android phone emulation, text input', external: false, android: true, phone: true },
];

async function setInput(input, value, options = {}) {
  await input.evaluate((el, { value, options }) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', ...options }));
  }, { value, options });
}
async function key(page, type, key, code, extra = {}) {
  await page.evaluate(({ type, key, code, extra }) => {
    window.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true, ...extra }));
  }, { type, key, code, extra });
}
async function checkInputRecovery(page, input, answer) {
  // Soft-keyboard input does not travel through the physical keydown handler.
  await setInput(input, answer.slice(0, 4).toLowerCase());
  assert.equal(await input.inputValue(), answer.slice(0, 4), 'Lowercase input accepts a capitalized answer');
  await setInput(input, answer.slice(0, 8).toUpperCase());
  assert.equal(await input.inputValue(), answer.slice(0, 8), 'Uppercase input accepts lowercase letters');
  await setInput(input, '');

  const letter = answer[0].toLowerCase();
  const code = `Key${letter.toUpperCase()}`;
  await key(page, 'keydown', letter, code); // Deliberately lose the release.
  assert.equal(await input.inputValue(), answer[0]);
  await setInput(input, '');
  await key(page, 'keydown', letter, code, { repeat: false });
  assert.equal(await input.inputValue(), answer[0], 'Fresh press recovers without a prior keyup');
  await key(page, 'keyup', letter, code, { ctrlKey: true });
  assert.equal(await input.inputValue(), answer[0], 'Modified release never adds input');
  await setInput(input, '');
  await key(page, 'keydown', letter, code, { ctrlKey: true });
  assert.equal(await input.inputValue(), '', 'Ctrl shortcut is not typing');

  // A repeat from the old key must not fill another letter after state changes.
  await key(page, 'keydown', letter, code);
  await setInput(input, '');
  await key(page, 'keydown', letter, code, { repeat: true });
  assert.equal(await input.inputValue(), '', 'Held key remains suppressed');
  await key(page, 'keyup', letter, '');
  assert.equal(await input.inputValue(), '', 'IME changing keyup code does not replay the press');

  // Explicitly non-composing input after a missing compositionend must recover.
  await input.dispatchEvent('compositionstart', { data: '' });
  await setInput(input, 'あ', { isComposing: true });
  assert.equal(await input.inputValue(), '', 'Unfinished Japanese composition is not an answer');
  await setInput(input, letter, { isComposing: false });
  assert.equal(await input.inputValue(), answer[0], 'Cancelled IME cannot keep blocking ASCII input');
  await setInput(input, '');
  await input.dispatchEvent('compositionstart', { data: '' });
  await input.evaluate((el, letter) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, letter);
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: letter }));
  }, letter);
  await page.waitForTimeout(30);
  assert.equal(await input.inputValue(), answer[0], 'Committed IME ASCII uses the same case rule');
  await setInput(input, '');
  await input.dispatchEvent('compositionstart', { data: '' });
  await key(page, 'keydown', 'Process', code, { isComposing: true });
  await key(page, 'keyup', 'Process', code, { isComposing: true });
  assert.equal(await input.inputValue(), answer[0], 'Japanese IME physical key accepted exactly once');
  await page.evaluate(() => { window.dispatchEvent(new Event('blur')); window.dispatchEvent(new Event('focus')); });
  await setInput(input, '');

  await setInput(input, 'zz');
  assert.equal(await input.inputValue(), '', 'Wrong spelling is still rejected');
  await setInput(input, answer.slice(0, -1).toLowerCase());
  assert.equal(await input.inputValue(), answer.slice(0, -1), 'Long sentence remains typable');
}

try {
  for (const config of configs) {
    const context = await browser.newContext({
      viewport: config.phone ? { width: 393, height: 851 } : { width: 1366, height: 768 },
      ...(config.android ? { userAgent: `Mozilla/5.0 (Linux; Android 14; ${config.phone ? 'Pixel 9a' : 'Pixel Tablet'}) AppleWebKit/537.36 Chrome/140.0.0.0 ${config.phone ? 'Mobile ' : ''}Safari/537.36`, hasTouch: true } : {}),
    });
    await context.addInitScript(({ config, questions, sentence }) => {
      speechSynthesis.speak = () => {};
      localStorage.setItem('etyping_external_keyboard_mode', String(config.external));
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken3', level: 3, resumeMode: 'challenge', resumeInputMode: 'voice-only' }));
      if (!sessionStorage.getItem('inputTestVersus')) {
        localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map(q => [`Eiken3:3:${q.text}:${q.translation}`, { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: q.text !== sentence, updatedAt: 0 }]))));
      }
      localStorage.setItem('etyping_versus_setup', JSON.stringify({ names: ['Input test'], scoreMultipliers: [1], courseSelections: [{ difficulty: 'Eiken3', level: 3 }], promptSelection: 'spelling' }));
    }, { config, questions: QUESTIONS.Eiken3[3], sentence });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseURL);
    if (config.phone) {
      await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
      await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
      await page.getByRole('button', { name: /Listening Battle/ }).click();
    } else {
      await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
    }
    const input = page.locator('.battle-input');
    await input.waitFor();
    // Listening mode replaces the current character with a cursor underscore.
    assert.ok((await page.locator('.battle-question-text').textContent()).replaceAll('\u00a0', ' ').trim().endsWith(sentence.slice(1)));
    await checkInputRecovery(page, input, sentence);
    await page.getByRole('button', { name: '音声をもう一度再生', exact: true }).click();
    await setInput(input, sentence.toLowerCase());
    await page.waitForFunction(() => document.querySelector('.battle-input')?.value === '');
    console.log('PASS normal Grade 3 Level 3 recovery, case, replay and question transition:', config.label);

    await page.evaluate(() => {
      sessionStorage.setItem('inputTestVersus', 'true');
      // This is an isolated test context: also remove the profile snapshot,
      // which would otherwise rehydrate the normal test's one-question filter.
      localStorage.clear();
    });
    await page.goto(baseURL);
    await page.getByRole('button', { name: /英語タイピングバトル（1〜5人）/ }).click();
    await page.getByRole('button', { name: /バトルをはじめる/ }).first().click();
    await page.getByRole('button', { name: 'スタート', exact: true }).click();
    const versusInput = page.locator('input[type="text"]');
    await versusInput.waitFor();
    const answer = await page.locator('p.break-words').innerText();
    await checkInputRecovery(page, versusInput, answer);
    await setInput(versusInput, answer.toLowerCase());
    await page.getByText(/^2 \/ .* 問$/).waitFor();
    console.log('PASS versus recovery, case and question transition:', config.label);
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally {
  await browser.close();
}
