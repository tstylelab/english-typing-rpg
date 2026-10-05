import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const url = process.env.MONSTER_REVEAL_TEST_URL || 'http://127.0.0.1:5178';
const output = process.env.MONSTER_REVEAL_TEST_OUTPUT || 'design/monster-samples/reveal-ui';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const closeBrowser = await trackTestBrowser(browser);
const reports = [];
const battleIds = JSON.parse(readFileSync('docs/monster-redesign/eiken3-level1.json', 'utf8')).assets.filter(x => x.monsterId.startsWith('c')).map(x => x.monsterId);
try {
  for (const scenario of [
    { width: 1366, dpr: 1 }, { width: 390, dpr: 1 },
    { width: 390, dpr: 3 }, { width: 1366, dpr: 1, reduced: true },
    { width: 1366, dpr: 1, slow: true }, { width: 1366, dpr: 1, broken: true },
    { width: 390, dpr: 1, course: 'Conversation' },
    { width: 1366, dpr: 1, boss: true },
  ].filter(s => !process.env.MONSTER_REVEAL_TEST_ONLY || (process.env.MONSTER_REVEAL_TEST_ONLY === 'boss' ? s.boss : s.course === process.env.MONSTER_REVEAL_TEST_ONLY))) {
    const { width, dpr, reduced = false, slow = false, broken = false, boss = false, course = 'Eiken3' } = scenario;
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: dpr, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [], requests = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', r => { if (r.url().includes('/monsters/')) requests.add(r.url()); });
    if (slow || broken) await page.route('**/monsters/**', async route => {
      if (broken) return route.abort();
      await new Promise(resolve => setTimeout(resolve, 700));
      await route.continue();
    });
    const questions = QUESTIONS[course][1];
    const answer = questions.find(q => /^[\x20-\x7E]+$/.test(q.text)).text;
    await page.addInitScript(({ course, questions, answer, boss, battleIds }) => {
      speechSynthesis.speak = () => {};
      localStorage.setItem('etyping_external_keyboard_mode', 'true');
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: course, level: 1, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
      if (boss) localStorage.setItem('etyping_defeated_monsters', JSON.stringify(battleIds.slice(0, 19).map(id => `${course}:1:challenge:text-only:${id}`)));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map(q => [`${course}:1:${q.text}:${q.translation}`, { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: q.text !== answer, updatedAt: 0 }]))));
      // Record real animation geometry without changing its timing.
      window.revealObservations = [];
      document.addEventListener('animationstart', e => {
        const node = e.target;
        if (!(node instanceof HTMLElement) || !node.dataset.monsterReveal) return;
        const image = node.querySelector('img');
        const style = getComputedStyle(node);
        window.revealObservations.push({ kind: node.dataset.monsterReveal, duration: style.animationDuration, width: node.offsetWidth, sourcePixels: image?.naturalWidth, pointerEvents: style.pointerEvents, filter: style.filter });
      }, true);
    }, { course, questions, answer, boss, battleIds });
    await page.goto(url);
    await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
    await page.getByRole('button', { name: '決定', exact: true }).click();
    await page.getByRole('button', { name: course === 'Conversation' ? /Scene Battle/ : /Translation Battle/ }).click();
    await page.locator('.battle-input').waitFor();
    if (boss) {
      await page.getByText('WARNING', { exact: true }).waitFor();
      await page.getByText('WARNING', { exact: true }).waitFor({ state: 'hidden' });
      await page.waitForFunction(() => window.revealObservations.some(x => x.kind === 'entry'));
      await page.waitForTimeout(650);
      assert.equal(await page.locator('[data-monster-reveal]').count(), 0);
      assert.equal((await page.evaluate(() => window.revealObservations)).filter(x => x.kind === 'entry').length, 1);
      await page.getByRole('button', { name: 'トップに戻る', exact: true }).click();
      assert.equal(await page.locator('[data-monster-reveal]').count(), 0);
      assert.deepEqual(errors, []);
      reports.push({ ...scenario, bossWarningPreserved: true, oneEntryAfterWarning: true });
      writeFileSync(`${output}/report.json`, JSON.stringify(reports, null, 2));
      console.log('PASS reveal boss warning');
      await page.goto('about:blank');
      await context.close();
      continue;
    }
    if (!reduced && !broken && !(dpr === 3)) {
      await page.waitForFunction(() => window.revealObservations.some(x => x.kind === 'entry'));
      await page.evaluate(() => {
        const animation = document.querySelector('[data-monster-reveal]')?.getAnimations()[0];
        if (animation) { animation.pause(); animation.currentTime = 100; }
      });
      await page.screenshot({ path: `${output}/entry-${course}-${width}-${slow ? 'slow' : 'normal'}.png` });
      await page.evaluate(() => document.querySelector('[data-monster-reveal]')?.getAnimations()[0]?.play());
    }
    // Typing remains enabled while the entrance is running or loading.
    await page.keyboard.type(answer.slice(0, 1));
    assert.equal(await page.locator('.battle-input').inputValue(), answer.slice(0, 1));
    await page.keyboard.type(answer.slice(1));
    await page.waitForFunction(() => !document.querySelector('.battle-input') || document.querySelector('.battle-input').value === '');
    for (let n = 0; n < 25 && await page.locator('.battle-input').isVisible(); n++) {
      await page.keyboard.type(answer);
      await page.waitForFunction(() => !document.querySelector('.battle-input') || document.querySelector('.battle-input').value === '');
    }
    await page.getByText('CLEAR!', { exact: true }).first().waitFor();
    if (!reduced && !broken) await page.waitForFunction(() => window.revealObservations.some(x => x.kind === 'defeat'));
    if (!reduced && !broken) {
      await page.evaluate(() => {
        const animation = document.querySelector('[data-monster-reveal="defeat"]')?.getAnimations()[0];
        if (animation) { animation.pause(); animation.currentTime = 150; }
      });
      await page.screenshot({ path: `${output}/defeat-${course}-${width}-${dpr}-${slow ? 'slow' : 'normal'}.png` });
      await page.evaluate(() => document.querySelector('[data-monster-reveal="defeat"]')?.getAnimations()[0]?.play());
    }
    const observations = await page.evaluate(() => window.revealObservations);
    for (const item of observations) {
      assert.equal(item.duration, '0.5s');
      assert.equal(item.pointerEvents, 'none');
      assert.equal(item.filter, 'none');
      if (item.sourcePixels) assert.ok(item.width * dpr <= item.sourcePixels + 1, 'Raster upscaled');
    }
    if (reduced || broken) assert.deepEqual(observations, []);
    assert.ok([...requests].every(r => !r.includes('/1024/')), 'Unexpected high-res request');
    const defeated = await page.evaluate(() => localStorage.getItem('etyping_defeated_monsters'));
    assert.ok(defeated.includes(`${course}:1:challenge:text-only:c1_1`));
    // Immediately leave victory, then leave the next entrance: no stale portal.
    await page.getByRole('button', { name: /つぎのモンスターへ/ }).click();
    await page.locator('.battle-input').waitFor();
    await page.getByRole('button', { name: 'トップに戻る', exact: true }).click();
    assert.equal(await page.locator('[data-monster-reveal]').count(), 0);
    await page.waitForTimeout(750);
    assert.equal(await page.locator('[data-monster-reveal]').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    reports.push({ ...scenario, observations, imageRequests: [...requests], victoryRecorded: true, rapidExitClean: true });
    writeFileSync(`${output}/report.json`, JSON.stringify(reports, null, 2));
    console.log(`PASS reveal ${JSON.stringify(scenario)}`);
    await page.goto('about:blank');
    await context.close();
  }
  writeFileSync(`${output}/report.json`, JSON.stringify(reports, null, 2));
} finally { await closeBrowser(); }
// closeBrowser verifies that our dedicated Chrome has exited, or throws.
// Windows can retain an automation pipe after that acknowledgement timeout.
process.exit(0);
