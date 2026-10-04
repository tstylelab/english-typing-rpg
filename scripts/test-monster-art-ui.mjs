import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const url = process.env.MONSTER_ART_TEST_URL || 'http://127.0.0.1:5178';
const output = process.env.MONSTER_ART_TEST_OUTPUT || 'design/monster-samples/ui-check';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
async function bounded(promise) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('cleanup timeout')), 10000); })]); }
  finally { clearTimeout(timer); }
}
const report = [];
async function openCourse(course, level, width = 1366) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  const artRequests = new Set();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/monsters/')) artRequests.add(request.url()); });
  const questions = QUESTIONS[course][level];
  const targetText = questions.find(q => q.text === 'apple')?.text || questions.find(q => /^[\x20-\x7E]+$/.test(q.text)).text;
  await page.addInitScript(({ course, level, questions, targetText }) => {
    speechSynthesis.speak = () => {};
    localStorage.setItem('etyping_external_keyboard_mode', 'true');
    localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: course, level, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
    localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map(q => [
      `${course}:${level}:${q.text}:${q.translation}`, { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: q.text !== targetText, updatedAt: 0 },
    ]))));
  }, { course, level, questions, targetText });
  await page.goto(url);
  await page.getByRole('button', { name: '教材を選ぶ', exact: true }).waitFor();
  return { context, page, errors, artRequests };
}
async function loaded(locator) {
  await locator.waitFor();
  await locator.evaluate(image => image.decode());
  assert.ok(await locator.evaluate(image => image.complete && image.naturalWidth > 0));
}
try {
  for (const width of [1366, 390]) {
    const { context, page, errors, artRequests } = await openCourse('Eiken5', 1, width);
    if (width >= 1024) {
      await loaded(page.locator('[data-monster-art="c1_1"]').first());
      await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
    } else {
      await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
      await page.getByRole('button', { name: '決定', exact: true }).click();
      await page.getByRole('button', { name: /Translation Battle/ }).click();
    }
    await page.locator('.battle-input').waitFor();
    await loaded(page.locator('.battle-avatar [data-monster-art="c1_1"]'));
    await page.waitForTimeout(250);
    assert.ok(artRequests.size <= 3, `Battle downloaded ${artRequests.size} art URLs`);
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const started = Date.now();
    await page.keyboard.type('ap');
    assert.equal(await page.locator('.battle-input').inputValue(), 'ap');
    const inputMs = Date.now() - started;
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Horizontal overflow');
    await page.screenshot({ path: `${output}/battle-${width}.png`, fullPage: true });
    report.push({ course: 'Eiken5', level: 1, width, battleArtRequests: [...artRequests], twoCharactersCpu4xMs: inputMs });
    await page.keyboard.type('ple');
    await page.waitForFunction(() => !document.querySelector('.battle-input') || document.querySelector('.battle-input').value === '');
    for (let answer = 0; answer < 20 && await page.locator('.battle-input').isVisible(); answer++) {
      const text = (await page.locator('.battle-question-text').textContent()).replaceAll('\u00a0', ' ');
      await page.keyboard.type(text);
      await page.waitForFunction(() => !document.querySelector('.battle-input') || document.querySelector('.battle-input').value === '');
    }
    await page.getByText('CLEAR!', { exact: true }).first().waitFor();
    await loaded(page.locator('[data-monster-art="c1_1"]').first());
    await page.screenshot({ path: `${output}/victory-${width}.png`, fullPage: true });
    console.log(`PASS victory ${width}`);
    await page.getByRole('button', { name: /つぎのモンスターへ/ }).click();
    await loaded(page.locator('.battle-avatar [data-monster-art="c1_2"]'));
    report.push({ width, victoryArt: 'c1_1', nextBattleArt: 'c1_2' });
    await page.getByRole('button', { name: 'トップに戻る', exact: true }).click();
    if (process.env.MONSTER_ART_SKIP_COLLECTION === '1') {
      assert.deepEqual(errors, []);
      await bounded(context.close());
      continue;
    }
    artRequests.clear();
    await page.getByRole('button', { name: '図鑑', exact: true }).click();
    const images = page.locator('[data-monster-art]');
    assert.equal(await images.count(), 43);
    assert.equal(await images.evaluateAll(list => list.filter(image => image.loading === 'lazy').length), 43);
    await page.waitForTimeout(500);
    const initialRequests = artRequests.size;
    assert.ok(initialRequests < 43, `Collection initially fetched all ${initialRequests}`);
    for (let i = 0; i < 43; i++) {
      await images.nth(i).scrollIntoViewIfNeeded();
      await loaded(images.nth(i));
    }
    assert.equal(new Set(await images.evaluateAll(list => list.map(image => image.dataset.monsterArt))).size, 43);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await page.screenshot({ path: `${output}/collection-${width}.png`, fullPage: true });
    report.push({ width, collectionInitialRequests: initialRequests, collectionLoaded: 43 });
    console.log(`PASS collection ${width}: ${initialRequests} initial requests, 43 images loaded`);
    assert.deepEqual(errors, []);
    await bounded(context.close());
  }
  {
    const { context, page, errors } = await openCourse('Eiken5', 1);
    await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
    await page.getByRole('button', { name: '決定', exact: true }).click();
    await page.getByRole('button', { name: /Basic Training/ }).click();
    await loaded(page.locator('.battle-avatar [data-monster-art="m1_1"]'));
    await page.keyboard.type('ap');
    assert.equal(await page.locator('.battle-input').inputValue(), 'ap');
    assert.deepEqual(errors, []);
    report.push({ trainingArt: 'm1_1', typing: 'ap' });
    console.log('PASS training');
    await bounded(context.close());
  }
  for (const [course, level] of [['Eiken4', 1], ['Eiken5', 2]]) {
    const { context, page, errors, artRequests } = await openCourse(course, level);
    assert.equal(await page.locator('[data-monster-art]').count(), 0);
    await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
    await page.locator('.battle-screen').waitFor();
    assert.equal(await page.locator('.battle-avatar svg').count(), 1);
    assert.equal(artRequests.size, 0);
    assert.deepEqual(errors, []);
    report.push({ course, level, retainsSvg: true });
    console.log(`PASS scope ${course} ${level}`);
    await bounded(context.close());
  }
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await bounded(browser.close());
}
