import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getTranslationBattlePrompt } = load('src/data/translationBattlePrompts.ts');
const questions = QUESTIONS.Eiken3[1];
const url = process.env.GRADE3_PROMPT_TEST_URL || 'http://127.0.0.1:5178';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const closeBrowser = await trackTestBrowser(browser);
const errors = [];
mkdirSync('node_modules/.tmp/grade3-prompts-ui', { recursive: true });
const status = { practiceLevel: 3, listeningLevel: 3, battleLevel: 3, manualOverrideLevel: null, excluded: false, updatedAt: 1 };
async function setup(width, word, inputMode = 'text-only') {
  const context = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ questions, word, status, inputMode }) => {
    if (!/^https?:$/.test(location.protocol) || localStorage.getItem('grade3-prompt-seeded')) return;
    localStorage.setItem('grade3-prompt-seeded', '1');
    speechSynthesis.speak = () => {};
    const data = { manualQuestionStatuses: Object.fromEntries(questions.map(q => [`Eiken3:1:${q.text}:${q.translation}`, { ...status, excluded: q.text !== word }])) };
    localStorage.setItem('etyping_player_profiles', JSON.stringify([{ id: 'grade3-prompt-player', name: 'Grade 3 Test', updatedAt: Date.now(), data }]));
    localStorage.setItem('etyping_active_player_id', 'grade3-prompt-player');
    localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: 'Eiken3', level: 1, resumeMode: 'challenge', resumeInputMode: inputMode }));
    localStorage.setItem('etyping_external_keyboard_mode', 'true');
  }, { questions, word, status, inputMode });
  await page.goto(url);
  return { page, context };
}
async function start(page, inputMode = 'text-only') {
  await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
  await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
  await page.getByRole('button', { name: inputMode === 'text-only' ? /Translation Battle/ : /Listening Training/ }).click();
  await page.locator('.battle-input').waitFor();
}

try {
  for (const width of [1366, 390]) {
    const { page, context } = await setup(width, 'fix');
    await page.getByRole('button', { name: '単語リスト', exact: true }).click();
    // Inspect every row in the actual UI, including the remaining render batches.
    while (await page.getByRole('button', { name: 'さらに表示', exact: true }).count()) await page.getByRole('button', { name: 'さらに表示', exact: true }).click();
    const displayed = await page.locator('.question-list-row').evaluateAll(rows => rows.map(row => ({ text: row.querySelector('.word-list-term').textContent, meaning: row.querySelector('.word-list-meaning').textContent.trim() })));
    assert.equal(displayed.length, 514);
    displayed.forEach((row, i) => {
      assert.equal(row.text, questions[i].text);
      assert.equal(row.meaning, getQuestionMeaning(questions[i], 'Eiken3'));
    });
    for (const word of ['fix', 'smart', 'native', 'especially', 'international']) {
      const sample = page.locator('.question-list-row').filter({ has: page.getByText(word, { exact: true }) });
      await sample.scrollIntoViewIfNeeded();
      assert.equal(await sample.evaluate(row => row.scrollWidth > row.clientWidth), false, `Visible row overflow: ${word}`);
    }
    await page.reload();
    await page.getByRole('button', { name: '単語リスト', exact: true }).click();
    const row = page.locator('.question-list-row').filter({ has: page.getByText('fix', { exact: true }) });
    await row.scrollIntoViewIfNeeded();
    assert.match(await row.innerText(), /覚えた/);
    assert.ok(!(await row.innerText()).includes('除外中'), 'Old learning and exclusions survive reload');
    console.log(`PASS ${width}px: all 514 meanings rendered, no horizontal overflow, existing learning key preserved`);
    await context.close();
  }

  for (const [width, word] of [[1366, 'fix'], [1366, 'repair'], [1366, 'smart'], [390, 'clever'], [390, 'afraid'], [390, 'scared'], [390, 'everybody'], [390, 'junior high school']]) {
    const { page, context } = await setup(width, word);
    const q = questions.find(q => q.text === word);
    await start(page);
    await page.getByText(getQuestionMeaning(q, 'Eiken3'), { exact: true }).waitFor();
    assert.equal(await page.locator('.battle-answer-cue').count(),0);
    const prompt=getTranslationBattlePrompt(q,'Eiken3',1);
    if(prompt?.alternatives.length){const panel=page.locator('.battle-vocabulary-synonyms');for(const t of prompt.alternatives)assert.ok((await panel.innerText()).includes(t.text+'（'+t.note+'）'));assert.equal(await panel.evaluate(el=>el.scrollWidth>el.clientWidth),false);}
    const visibleCharacters = await page.locator('.battle-question-text [data-character-index]').evaluateAll(chars => chars.filter(el => getComputedStyle(el).opacity !== '0').map(el => el.textContent).join(''));
    assert.equal(visibleCharacters, '_', 'Only the input cursor is visible before typing; answer characters remain transparent');
    if (word === 'fix') await page.screenshot({ path: 'node_modules/.tmp/grade3-prompts-ui/desktop-battle.png' });
    if (word === 'everybody') await page.screenshot({ path: 'node_modules/.tmp/grade3-prompts-ui/mobile-battle.png' });
    await page.locator('.battle-input').fill(word);
    await page.waitForFunction(() => document.querySelector('.result-today') || document.querySelector('.battle-input')?.value === '', undefined, { timeout: 5000 });
    assert.ok(await page.locator('.result-today').count() || await page.locator('.battle-input').inputValue() === '', 'Requested spelling is accepted');
    console.log(`PASS ${width}px translation battle: ${word}, revised meaning and requested form, answer hidden, typing accepted`);
    await context.close();
  }
  const listening = await setup(390, 'fan', 'voice-text');
  await start(listening.page, 'voice-text');
  await listening.page.getByText(getQuestionMeaning(questions.find(q => q.text === 'fan'), 'Eiken3'), { exact: true }).waitFor();
  assert.equal(await listening.page.locator('.battle-answer-cue').count(), 0, 'No spelling cue outside translation battle');
  await listening.context.close();
  assert.deepEqual(errors, []);
  console.log('PASS listening scope, no runtime errors');
} finally { await closeBrowser(); }
process.exit(0);
