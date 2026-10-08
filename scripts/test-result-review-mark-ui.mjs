import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const url = process.env.RESULT_REVIEW_TEST_URL || 'http://127.0.0.1:5178';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const closeBrowser = await trackTestBrowser(browser);
const errors = [];
mkdirSync('node_modules/.tmp/result-review', { recursive: true });
const key = (difficulty, level, q) => `${difficulty}:${level}:${q.text}:${q.translation}`;

try {
  for (const scenario of [
    { difficulty: 'EikenPre1Part1', level: 1, width: 1366, win: true, preMarked: true },
    { difficulty: 'Eiken4', level: 2, width: 820, win: false },
    { difficulty: 'Eiken5', level: 3, width: 390, win: true },
  ]) {
    const { difficulty, level, width, win, preMarked = false } = scenario;
    const questions = QUESTIONS[difficulty][level];
    const q = questions[0];
    const scope = `${difficulty}:${level}`;
    const questionKey = key(difficulty, level, q);
    const otherLevel = level === 3 ? 1 : 3;
    const otherScope = `${difficulty}:${otherLevel}`;
    const otherKey = key(difficulty, otherLevel, QUESTIONS[difficulty][otherLevel][0]);
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ difficulty, level, questions, q, scope, questionKey, otherScope, otherKey, preMarked }) => {
      if (!/^https?:$/.test(location.protocol) || localStorage.getItem('result-review-seeded')) return;
      localStorage.setItem('result-review-seeded', '1');
      speechSynthesis.speak = () => {};
      const data = {
        manualQuestionStatuses: Object.fromEntries(questions.map(question => [`${difficulty}:${level}:${question.text}:${question.translation}`, { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: question.text !== q.text, updatedAt: 0 }])),
        markedQuestionKeysByScope: { [scope]: preMarked ? [questionKey] : [], [otherScope]: [otherKey] },
      };
      localStorage.setItem('etyping_player_profiles', JSON.stringify([
        { id: 'result-review-player', name: 'Result Review Test', updatedAt: Date.now(), data },
        { id: 'other-player', name: 'Other Player', updatedAt: 1, data: { markedQuestionKeysByScope: { [scope]: [] } } },
      ]));
      localStorage.setItem('etyping_active_player_id', 'result-review-player');
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty, level, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
      localStorage.setItem('etyping_external_keyboard_mode', 'true');
    }, { difficulty, level, questions, q, scope, questionKey, otherScope, otherKey, preMarked });
    await page.goto(url);
    await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
    await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
    await page.getByRole('button', { name: /Translation Battle/ }).click();
    await page.locator('.battle-input').waitFor();
    if (win) await page.locator('.battle-input').fill('!'); // Include a corrected answer in the result.
    for (let i = 0; i < 60 && await page.locator('.battle-input').count(); i++) {
      if (win) await page.locator('.battle-input').fill(q.text);
      else await page.getByRole('button', { name: 'この問題をスキップ', exact: true }).click();
      await page.waitForTimeout(180);
    }
    const rows = page.locator('[data-result-question]');
    await rows.first().waitFor();
    assert.ok(await rows.count() > 0);
    const buttons = rows.locator('button[aria-pressed]');
    assert.equal(await buttons.count(), await rows.count());
    const assertPressed = async pressed => assert.ok((await buttons.evaluateAll(els => els.map(el => el.getAttribute('aria-pressed')))).every(value => value === String(pressed)), 'Repeated questions share the same review state');
    await assertPressed(preMarked);
    if (win) assert.ok(await rows.locator('[data-result-status]').filter({ hasText: 'ミス' }).count());
    else assert.equal(await rows.first().locator('[data-result-status]').innerText(), 'スキップ');
    const statusBox = await rows.first().locator('[data-result-status]').boundingBox();
    const buttonBox = await buttons.first().boundingBox();
    assert.ok(buttonBox.y >= statusBox.y + statusBox.height, 'Review button sits below the result label');
    assert.ok(buttonBox.height >= 32 && buttonBox.width < 120, 'Compact button keeps a usable touch target');
    assert.equal(await page.locator('main').evaluate(el => el.scrollWidth > el.clientWidth), false);
    if (width === 1366) assert.ok((await rows.first().boundingBox()).height < 112, 'Short vocabulary rows remain compact');
    await buttons.first().click();
    await assertPressed(!preMarked);
    await buttons.first().click();
    await assertPressed(preMarked);
    if (!preMarked) {
      await buttons.first().focus();
      await buttons.first().press('Space');
      await assertPressed(true);
    }
    await page.waitForFunction(({ scope, questionKey }) => JSON.parse(localStorage.getItem('etyping_player_profiles') || '[]').find(p => p.id === 'result-review-player')?.data.markedQuestionKeysByScope?.[scope]?.includes(questionKey), { scope, questionKey });
    const marks = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope')));
    assert.deepEqual(marks[scope], [questionKey], 'Only one saved key for repeated result rows');
    assert.deepEqual(marks[otherScope], [otherKey], 'Other levels keep their existing marks');
    const otherPlayer = await page.evaluate(() => JSON.parse(localStorage.getItem('etyping_player_profiles')).find(p => p.id === 'other-player'));
    assert.deepEqual(otherPlayer.data.markedQuestionKeysByScope, { [scope]: [] }, 'Other players are unchanged');
    await page.screenshot({ path: `node_modules/.tmp/result-review/${difficulty}-${width}.png` });
    await page.reload();
    await page.getByRole('button', { name: '単語リスト', exact: true }).click();
    await page.getByRole('button', { name: 'あとで復習', exact: true }).first().click(); // Filter precedes row actions.
    const markedRows = page.locator('.question-list-row');
    assert.equal(await markedRows.count(), 1);
    assert.equal(await markedRows.locator('.word-list-term').innerText(), q.text, 'Result mark survives reload and appears in the existing review list');
    console.log(`PASS ${difficulty} L${level} ${width}px: result button, toggle, duplicate rows, persisted review list, scope/player isolation`);
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally { await closeBrowser(); }
process.exit(0);
