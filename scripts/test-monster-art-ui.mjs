import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const url = process.env.MONSTER_ART_TEST_URL || 'http://127.0.0.1:5178';
const output = process.env.MONSTER_ART_TEST_OUTPUT || 'design/monster-samples/ui-check';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const closeTestBrowser = await trackTestBrowser(browser);
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
  return { context, page, errors, artRequests, targetText };
}
async function loaded(locator) {
  await locator.waitFor();
  await locator.evaluate(image => image.decode());
  assert.ok(await locator.evaluate(image => image.complete && image.naturalWidth > 0));
}
async function closeTestContext(page, context) {
  // Release this test page's audio and animation resources before closing Chrome.
  await page.goto('about:blank');
  await bounded(context.close());
}
try {
  const cases = (process.env.MONSTER_ART_TEST_CASES || 'Eiken5:1,Eiken5:2,Eiken5:3,Eiken4:1,Eiken4:2,Eiken4:3,Eiken3:1,Eiken3:2,Eiken3:3')
    .split(',').map(value => { const [course, level] = value.split(':'); return { course, level: Number(level) }; });
  for (const { course, level } of cases) {
  for (const width of [1366, 390]) {
    const { context, page, errors, artRequests, targetText } = await openCourse(course, level, width);
    if (width >= 1024) {
      await loaded(page.locator(`[data-monster-art="c${level}_1"]`).first());
      await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
    } else {
      await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
      await page.getByRole('button', { name: '決定', exact: true }).click();
      await page.getByRole('button', { name: /Translation Battle/ }).click();
    }
    await page.locator('.battle-input').waitFor();
    await loaded(page.locator(`.battle-avatar [data-monster-art="c${level}_1"]`));
    await page.waitForTimeout(250);
    assert.ok(artRequests.size <= 3, `Battle downloaded ${artRequests.size} art URLs`);
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const started = Date.now();
    await page.keyboard.type(targetText.slice(0, 2));
    assert.equal(await page.locator('.battle-input').inputValue(), targetText.slice(0, 2));
    const inputMs = Date.now() - started;
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Horizontal overflow');
    await page.screenshot({ path: `${output}/battle-${course}-level${level}-${width}.png`, fullPage: true });
    report.push({ course, level, width, battleArtRequests: [...artRequests], twoCharactersCpu4xMs: inputMs });
    await page.keyboard.type(targetText.slice(2));
    await page.waitForFunction(() => !document.querySelector('.battle-input') || document.querySelector('.battle-input').value === '');
    for (let answer = 0; answer < 20 && await page.locator('.battle-input').isVisible(); answer++) {
      // This isolated test enables one known question; its first character may
      // be hidden as an underscore in a translation battle.
      await page.keyboard.type(targetText);
      await page.waitForFunction(() => !document.querySelector('.battle-input') || document.querySelector('.battle-input').value === '');
    }
    await page.getByText('CLEAR!', { exact: true }).first().waitFor();
    await loaded(page.locator(`[data-monster-art="c${level}_1"]`).first());
    await page.screenshot({ path: `${output}/victory-${course}-level${level}-${width}.png`, fullPage: true });
    console.log(`PASS victory ${course} Level ${level} ${width}`);
    await page.getByRole('button', { name: /つぎのモンスターへ/ }).click();
    await loaded(page.locator(`.battle-avatar [data-monster-art="c${level}_2"]`));
    report.push({ course, level, width, victoryArt: `c${level}_1`, nextBattleArt: `c${level}_2` });
    await page.getByRole('button', { name: 'トップに戻る', exact: true }).click();
    if (process.env.MONSTER_ART_SKIP_COLLECTION === '1') {
      assert.deepEqual(errors, []);
      await closeTestContext(page, context);
      continue;
    }
    artRequests.clear();
    await page.getByRole('button', { name: '図鑑', exact: true }).click();
    await page.getByRole('button', { name: { Eiken5: '英検5級', Eiken4: '英検4級', Eiken3: '英検3級' }[course], exact: true }).click();
    if (level !== 1) await page.getByRole('button', { name: `レベル ${level}`, exact: true }).click();
    const images = page.locator('[data-monster-art]');
    assert.equal(await images.count(), 43);
    assert.equal(await images.evaluateAll(list => list.filter(image => image.loading === 'lazy').length), 43);
    await page.waitForTimeout(500);
    const folder = `${course.toLowerCase()}-level${level}`;
    const initialRequests = [...artRequests].filter(src => src.includes(`/${folder}/`)).length;
    assert.ok(initialRequests < 43, `Collection initially fetched all ${initialRequests}`);
    for (let i = 0; i < 43; i++) {
      await images.nth(i).scrollIntoViewIfNeeded();
      await loaded(images.nth(i));
    }
    assert.equal(new Set(await images.evaluateAll(list => list.map(image => image.dataset.monsterArt))).size, 43);
    assert.ok(await images.evaluateAll((list, folder) => list.every(image => image.src.includes(`/${folder}/`)), folder), 'Artwork must belong to the selected course');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await page.screenshot({ path: `${output}/collection-${course}-level${level}-${width}.png`, fullPage: true });
    report.push({ course, level, width, collectionInitialRequests: initialRequests, collectionLoaded: 43 });
    console.log(`PASS collection ${course} Level ${level} ${width}: ${initialRequests} initial requests, 43 images loaded`);
    assert.deepEqual(errors, []);
    await closeTestContext(page, context);
  }
  {
    const { context, page, errors, targetText } = await openCourse(course, level);
    await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
    await page.getByRole('button', { name: '決定', exact: true }).click();
    await page.getByRole('button', { name: /Basic Training/ }).click();
    await loaded(page.locator(`.battle-avatar [data-monster-art="m${level}_1"]`));
    await page.keyboard.type(targetText.slice(0, 2));
    assert.equal(await page.locator('.battle-input').inputValue(), targetText.slice(0, 2));
    assert.deepEqual(errors, []);
    report.push({ course, level, trainingArt: `m${level}_1`, typing: targetText.slice(0, 2) });
    console.log(`PASS training ${course} Level ${level}`);
    await closeTestContext(page, context);
  }
  }
  for (const [course, level] of [['EikenPre2', 1]]) {
    const { context, page, errors, artRequests } = await openCourse(course, level);
    assert.equal(await page.locator('[data-monster-art]').count(), 0);
    await page.getByRole('button', { name: 'この敵に挑む', exact: true }).click();
    await page.locator('.battle-screen').waitFor();
    assert.equal(await page.locator('.battle-avatar svg').count(), 1);
    assert.equal(artRequests.size, 0);
    assert.deepEqual(errors, []);
    report.push({ course, level, retainsSvg: true });
    console.log(`PASS scope ${course} ${level}`);
    await closeTestContext(page, context);
  }
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error('UI validation failed:', error);
  throw error;
} finally {
  for (const context of browser.contexts()) {
    for (const page of context.pages()) await page.goto('about:blank').catch(() => {});
  }
  await closeTestBrowser();
}
// All assertions and cleanup completed; do not keep the automation pipe alive.
process.exit(0);
