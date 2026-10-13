import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
try {
  for (const [difficulty, level, manual, width] of [['Eiken3', 3, 1, 390], ['Eiken4', 2, 2, 1366]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const questions = QUESTIONS[difficulty][level]; const q = questions[0];
    const key = `${difficulty}:${level}:${q.text}:${q.translation}`;
    await page.addInitScript(({ questions, difficulty, level, manual }) => {
      speechSynthesis.speak = () => {}; Date.now = () => window.testNow;
      window.testNow = 1000000; Math.random = () => 0;
      // Seed once: reload must prove persistence, not restore the test fixture.
      if (localStorage.getItem('mastery-test-seeded')) return;
      localStorage.setItem('mastery-test-seeded', 'true');
      localStorage.setItem('etyping_external_keyboard_mode', 'true');
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty, level, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map((q, i) => [
        `${difficulty}:${level}:${q.text}:${q.translation}`,
        { practiceLevel: 1, listeningLevel: 2, battleLevel: 3, manualOverrideLevel: manual, excluded: i > 0, updatedAt: 0, longTextSuccessCount: 2, longTextSpacingRemaining: 5 },
      ]))));
    }, { questions, difficulty, level, manual });
    await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5178');
    if (width >= 1024) await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
    else {
      await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
      await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
      await page.getByRole('button', { name: /Translation Battle/ }).click();
    }
    const readStatus = () => page.evaluate(key => JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key], key);
    const answer = async (hint = false) => {
      await page.waitForTimeout(1300);
      for (const name of [/つぎのモンスターへ/, /もう一度挑戦する/]) {
        const button = page.getByRole('button', { name }).first();
        if (await button.isVisible()) { await button.click(); break; }
      }
      await page.locator('.battle-screen').waitFor();
      if (hint) await page.locator('.battle-replay').click();
      await page.keyboard.type(q.text[0]);
      const wrong = q.text[1]?.toLowerCase() === 'z' ? 'x' : 'z';
      await page.keyboard.type(wrong.repeat(2));
      await page.evaluate(n => { window.testNow += n * 1000; }, q.text.length);
      await page.keyboard.type(q.text.slice(1));
      await page.waitForTimeout(1000);
    };
    await answer();
    let status = await readStatus();
    assert.equal(status.learningLevel, manual + 1);
    assert.equal(status.manualOverrideLevel, null);
    assert.equal(status.excluded, false);
    if (manual === 1) {
      await answer(true);
      status = await readStatus();
      assert.equal(status.learningLevel, 2, 'Audio hint must not master');
      await answer();
      assert.equal((await readStatus()).learningLevel, 3, 'Next unaided success masters even in a single-item pool');
    }
    // Finish the current battle if necessary to inspect the real result rendering.
    for (let i = 0; i < 12 && await page.locator('.battle-screen').isVisible(); i++) await answer();
    await page.locator('[data-result-question]').first().waitFor();
    assert.ok((await page.locator('[data-result-status]').allTextContents()).some(text => text.includes('学習OK・修正 2回')));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Result must fit the viewport');
    const before = await readStatus(); await page.reload();
    assert.deepEqual(await readStatus(), before, 'Reload must preserve mastery');
    assert.deepEqual(errors, []);
    console.log(`PASS ${difficulty} Level ${level} ${width}px: manual review advances, corrections count as learning success, results fit, saved progress survives reload`);
    await context.close();
  }
} finally { await cleanup(); }
