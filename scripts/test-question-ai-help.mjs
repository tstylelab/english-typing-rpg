import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { buildQuestionAiPrompt } = load('src/questionAiPrompt.ts');
const { QUESTIONS } = load('src/data/questions.ts');
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const wordPrompt = buildQuestionAiPrompt({ course: '英検4級', level: 1, text: 'start', meaning: '始める', example: 'School starts at eight.' });
assert.ok(wordPrompt.includes('School starts at eight.'));
assert.ok(wordPrompt.includes('意味を例文の場面だけに限定しない'));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const cleanup = await trackTestBrowser(browser);
await mkdir('tmp/question-ai-help', { recursive: true });
try {
  for (const [difficulty, level, width] of [['Eiken3', 3, 1366], ['Eiken4', 2, 390], ['Eiken5', 1, 320]]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const questions = QUESTIONS[difficulty][level];
    await page.addInitScript(({ difficulty, level, questions }) => {
      speechSynthesis.speak = () => {}; Math.random = () => 0;
      localStorage.setItem('etyping_external_keyboard_mode', 'true');
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty, level, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map((q, i) => [
        `${difficulty}:${level}:${q.text}:${q.translation}`, { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: i > 1, updatedAt: 0 },
      ]))));
      window.copied = []; window.opened = []; window.copyMode = 'ok';
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: text => {
        if (window.copyMode === 'fail') return Promise.reject(new Error('denied'));
        if (window.copyMode === 'defer') return new Promise(resolve => { window.finishCopy = resolve; });
        window.copied.push(text); return Promise.resolve();
      } } });
      window.open = (...args) => { window.opened.push(args); return null; };
    }, { difficulty, level, questions });
    await page.goto(process.env.TEST_BASE_URL || 'http://127.0.0.1:5178');
    if (width >= 1024) await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
    else {
      await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
      await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
      await page.getByRole('button', { name: /Translation Battle/ }).click();
    }
    for (let i = 0; i < 55 && !await page.locator('[data-result-question]').count(); i++) {
      const skip = page.getByRole('button', { name: 'この問題をスキップ', exact: true });
      if (await skip.isVisible()) await skip.click();
      await page.waitForTimeout(300);
    }
    const rows = page.locator('[data-result-question]'); await rows.first().waitFor();
    assert.equal(await rows.getByRole('button', { name: /についてAIに相談/ }).count(), await rows.count());
    const row = rows.nth(Math.min(2, await rows.count() - 1));
    const trigger = row.getByRole('button', { name: /についてAIに相談/ });
    await trigger.scrollIntoViewIfNeeded();
    const expectedText = (await trigger.getAttribute('aria-label')).replace(' についてAIに相談', '');
    const beforeScroll = await page.evaluate(() => scrollY);
    const beforeData = await page.evaluate(() => JSON.stringify(localStorage));
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'この問題をAIに相談' });
    await dialog.waitFor();
    assert.ok((await dialog.innerText()).includes(expectedText));
    await dialog.getByRole('button', { name: '相談文をコピー', exact: true }).click();
    await dialog.getByRole('status').waitFor();
    assert.equal((await page.evaluate(() => window.opened)).length, 0);
    const prompt = await page.evaluate(() => window.copied.at(-1));
    assert.ok(prompt.includes(`英語：${expectedText}`));
    assert.ok(prompt.includes(`Level ${level}`));
    if (level < 3) assert.ok(prompt.includes('例文：'));
    for (const [target, url] of [['ChatGPT', 'https://chatgpt.com/'], ['Gemini', 'https://gemini.google.com/app']]) {
      await dialog.getByRole('button', { name: `${target}で相談`, exact: true }).click();
      await dialog.getByRole('link', { name: `${target}を開く（開かない場合）` }).waitFor();
      assert.deepEqual(await page.evaluate(() => window.opened.at(-1)), [url, '_blank', 'noopener,noreferrer']);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    const bounds = await dialog.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
    await page.screenshot({ path: `tmp/question-ai-help/${difficulty}-${width}-dialog.png` });
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
    assert.ok(await trigger.evaluate(el => el === document.activeElement));
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - beforeScroll) < 2, 'Result scroll must be retained');
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), beforeData, 'Consulting does not alter progress');
    await page.screenshot({ path: `tmp/question-ai-help/${difficulty}-${width}-result.png` });
    await trigger.click();
    await page.evaluate(() => { window.copyMode = 'fail'; });
    await dialog.getByRole('button', { name: 'Geminiで相談' }).click();
    await dialog.getByRole('textbox', { name: 'この問題の相談文' }).waitFor();
    assert.equal(await page.evaluate(() => window.opened.length), 2, 'Failed copying must not open a tab');
    assert.ok((await dialog.getByRole('textbox').inputValue()).includes(expectedText));
    await page.evaluate(() => { window.copyMode = 'defer'; });
    await dialog.getByRole('button', { name: 'ChatGPTで相談' }).click();
    await dialog.getByRole('button', { name: '相談を閉じて結果に戻る' }).click();
    await page.evaluate(() => window.finishCopy());
    assert.equal(await page.evaluate(() => window.opened.length), 2, 'Closed dialogs must not open delayed tabs');
    assert.deepEqual(errors, []);
    console.log(`PASS ${difficulty} L${level}, ${width}px: row context, both destinations, fallback, delayed cancellation, scroll/focus, unchanged progress`);
    await context.close();
  }
} finally { await cleanup(); }
