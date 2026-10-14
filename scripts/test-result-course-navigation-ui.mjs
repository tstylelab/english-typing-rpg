import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const url = process.env.RESULT_TEST_URL || 'http://127.0.0.1:5178';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const closeBrowser = await trackTestBrowser(browser);
const errors = [];
mkdirSync('node_modules/.tmp/result-course', { recursive: true });

try {
  for (const scenario of [
    { difficulty: 'Eiken5', label: '英検5級', level: 1, width: 390, win: true },
    { difficulty: 'Eiken4', label: '英検4級', level: 2, width: 1366 },
    { difficulty: 'Eiken3', label: '英検3級', level: 3, width: 1366 },
    { difficulty: 'Conversation', label: '英会話 はじめて', level: 1, width: 390 },
    { difficulty: 'EikenPre1Part1', label: '英検準1級①', level: 3, width: 820 },
  ]) {
    const { difficulty, label, level, width, win } = scenario;
    const questions = QUESTIONS[difficulty][level];
    const answer = questions[0].text;
    const contentLabel = difficulty === 'Conversation' ? '会話表現' : { 1: '単語', 2: '熟語・表現', 3: '文章問題' }[level];
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ difficulty, level, questions, answer }) => {
      if (!/^https?:$/.test(location.protocol) || localStorage.getItem('result-test-seeded')) return;
      localStorage.setItem('result-test-seeded', '1');
      speechSynthesis.speak = () => {};
      const data = { manualQuestionStatuses: Object.fromEntries(questions.map(q => [`${difficulty}:${level}:${q.text}:${q.translation}`, { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: q.text !== answer, updatedAt: 0 }])) };
      localStorage.setItem('etyping_player_profiles', JSON.stringify([{ id: 'result-player', name: 'Result Test', updatedAt: Date.now(), data }]));
      localStorage.setItem('etyping_active_player_id', 'result-player');
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty, level, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
      localStorage.setItem('etyping_external_keyboard_mode', 'true');
    }, { difficulty, level, questions, answer });
    await page.goto(url);
    // Leave a stale filter/tools selection to verify the result shortcut resets it.
    await page.getByRole('button', { name: '問題リスト', exact: true }).click();
    await page.getByRole('button', { name: '苦手だけ', exact: true }).click();
    await page.getByRole('button', { name: /選択・自動再生ツール/ }).click();
    await page.getByRole('button', { name: '← タイトルへ', exact: true }).click();
    await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
    await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
    assert.ok(await page.getByRole('heading', { name: `${label} Level ${level} ${contentLabel}`, exact: true }).isVisible());
    assert.ok(await page.getByText('全1問・習得0問', { exact: true }).isVisible());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: `node_modules/.tmp/result-course/${difficulty}-${width}-mode.png` });
    await page.getByRole('button', { name: difficulty === 'Conversation' ? /Scene Battle/ : /Translation Battle/ }).click();
    await page.locator('.battle-input').waitFor();
    for (let i = 0; i < 60 && await page.locator('.battle-input').count(); i++) {
      if (win) await page.locator('.battle-input').fill(answer);
      else await page.getByRole('button', { name: 'この問題をスキップ', exact: true }).click();
      await page.waitForTimeout(180);
    }
    await page.locator('[data-result-course]').waitFor();
    assert.equal((await page.locator('[data-result-course]').innerText()).replace(/\s+/g, ' '), `${label} · Level ${level}・${contentLabel}`);
    if (win) assert.equal(await page.getByText('CLEAR!', { exact: true }).count(), 1);
    else assert.equal(await page.getByText('おしい！', { exact: true }).count(), 1);
    const summary = page.locator('aside section').filter({ hasText: '学習の積み上げ' });
    assert.ok((await summary.innerText()).includes('1問'));
    assert.ok(!(await summary.innerText()).includes('1語'));
    const shortcut = page.getByRole('button', { name: 'この教材の問題リストを開く', exact: true });
    const geometry = await shortcut.boundingBox();
    assert.ok(geometry.x >= 0 && geometry.x + geometry.width <= width + 1 && geometry.height >= 44);
    assert.ok(geometry.y >= 0 && geometry.y + geometry.height <= 900, 'Shortcut is visible before scrolling through battle results');
    const courseBox = await page.locator('[data-result-course]').boundingBox();
    assert.ok(courseBox.y >= 0 && courseBox.y + courseBox.height <= 900, 'Played course is visible on entry');
    assert.equal(await page.locator('aside button').evaluateAll(buttons => buttons.some(button => button === document.activeElement)), true, 'Primary action keeps keyboard focus without scrolling');
    assert.equal(await page.locator('main').evaluate(el => el.scrollWidth > el.clientWidth), false);
    await page.screenshot({ path: `node_modules/.tmp/result-course/${difficulty}-${width}.png` });
    await shortcut.click();
    await page.getByRole('heading', { name: '問題リスト', exact: true }).waitFor();
    await page.getByText(`${label} - Level ${level}・${contentLabel} (${questions.length}問)`, { exact: true }).waitFor();
    assert.match(await page.getByRole('button', { name: 'すべて', exact: true }).getAttribute('class'), /bg-blue-600/);
    assert.match(await page.getByRole('button', { name: /選択・自動再生ツール/ }).innerText(), /開く ▼/);
    console.log(`PASS ${label} Level ${level}, ${win ? 'win' : 'loss'}, ${width}px: course label, compact shortcut, matching word list, stale filter reset`);
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally { await closeBrowser(); }
// End only this runner after its dedicated test browser has closed.
process.exit(0);
