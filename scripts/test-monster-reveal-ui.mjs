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
async function captureReveal(page, kind, path) {
  const geometry = await page.evaluate(kind => {
    const node = document.querySelector(`[data-monster-reveal="${kind}"]`);
    if (!node) throw new Error('Missing reveal');
    getComputedStyle(node, '::after').animationName;
    const backdrop = document.querySelector('[data-monster-reveal-backdrop]');
    const animations = [...node.getAnimations({ subtree: true }), ...backdrop.getAnimations()];
    const sample = time => {
      for (const animation of animations) { animation.pause(); animation.currentTime = time; }
      const clear = node.querySelector('.monster-reveal-clear');
      return { transform: getComputedStyle(node).transform, spriteTransform: getComputedStyle(node.querySelector('img, svg')).transform, opacity: getComputedStyle(node).opacity, flash: Number(getComputedStyle(node, '::after').opacity), clearOpacity: clear ? Number(getComputedStyle(clear).opacity) : null };
    };
    const fading = sample(90), early = sample(230), late = sample(650);
    const rect = node.getBoundingClientRect();
    const viewport = window.visualViewport;
    const visibleBounds = { left: viewport?.offsetLeft || 0, top: viewport?.offsetTop || 0, width: viewport?.width || innerWidth, height: viewport?.height || innerHeight };
    const title = node.querySelector('.monster-reveal-clear > span');
    const titleBounds = title?.getBoundingClientRect();
    const clear = title ? { text: title.textContent, bounds: { left: titleBounds.left, top: titleBounds.top, right: titleBounds.right, bottom: titleBounds.bottom } } : null;
    sample(230);
    return { fading, early, late, clear, rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }, visibleBounds, mask: getComputedStyle(node, '::after').maskImage, backdropPointerEvents: getComputedStyle(backdrop).pointerEvents, animations: animations.map(a => a.animationName) };
  }, kind);
  assert.equal(geometry.early.transform, geometry.late.transform, 'Monster moves during central hold');
  assert.equal(geometry.early.opacity, '1');
  assert.equal(geometry.late.opacity, '1');
  assert.notEqual(geometry.early.spriteTransform, geometry.late.spriteTransform, 'Missing brief settle after fade-in');
  assert.equal(geometry.fading.spriteTransform, geometry.late.spriteTransform, 'Shake should stop during the central hold');
  assert.ok(Number(geometry.fading.opacity) > .1 && Number(geometry.fading.opacity) < .9, 'Monster should visibly fade in');
  assert.ok(geometry.early.flash > .5, `Missing white flash: ${JSON.stringify(geometry)}`);
  assert.equal(geometry.late.flash, 0, 'Flash did not fade');
  assert.equal(geometry.mask, 'none', 'Flash should radiate behind the sprite');
  assert.equal(geometry.backdropPointerEvents, 'none');
  const { rect, visibleBounds: v } = geometry;
  const margin = kind === 'defeat' ? 18 : 0;
  assert.ok(rect.left - margin >= v.left - 1 && rect.top - margin >= v.top - 1 && rect.right + margin <= v.left + v.width + 1 && rect.bottom + margin <= v.top + v.height + 1, 'Held monster/panel clipped by the visible viewport');
  assert.ok(Math.abs(rect.left + rect.width / 2 - v.left - v.width / 2) < 1 && Math.abs(rect.top + rect.height / 2 - v.top - v.height / 2) < 1, 'Monster is not centered in the visible area');
  if (kind === 'defeat') {
    assert.equal(geometry.clear?.text, 'CLEAR!');
    assert.equal(geometry.fading.clearOpacity, 0);
    assert.ok(geometry.early.clearOpacity > .7, 'Victory title must appear after fade-in');
    assert.equal(geometry.late.clearOpacity, 1, 'Victory title should remain readable during the hold');
    const title = geometry.clear.bounds;
    assert.ok(title.left >= v.left && title.top >= v.top && title.right <= v.left + v.width && title.bottom <= v.top + v.height, 'Victory title clipped by the visible area');
  } else assert.equal(geometry.clear, null, 'Entry must not show a victory title');
  await page.screenshot({ path });
  await page.evaluate(kind => {
    for (const animation of document.querySelector(`[data-monster-reveal="${kind}"]`)?.getAnimations({ subtree: true }) || []) animation.play();
    for (const animation of document.querySelector('[data-monster-reveal-backdrop]')?.getAnimations() || []) animation.play();
  }, kind);
}
const battleIds = JSON.parse(readFileSync('docs/monster-redesign/eiken3-level1.json', 'utf8')).assets.filter(x => x.monsterId.startsWith('c')).map(x => x.monsterId);
try {
  for (const scenario of [
    { width: 1366, dpr: 1 }, { width: 390, dpr: 1 },
    { width: 1920, height: 1080, dpr: 1 }, { width: 1024, height: 768, dpr: 2 },
    { width: 390, dpr: 3 }, { width: 1366, dpr: 1, reduced: true },
    { width: 1366, dpr: 1, slow: true }, { width: 1366, dpr: 1, broken: true },
    { width: 390, dpr: 1, course: 'Conversation' },
    { width: 1366, dpr: 1, boss: true },
    { width: 390, height: 844, dpr: 3, mobile: true, resize: true },
    { width: 1024, height: 768, dpr: 2, mobile: true, resize: true },
    { width: 390, height: 844, dpr: 3, mobile: true, visual: true },
    { width: 1024, height: 768, dpr: 2, mobile: true, visual: true },
  ].filter(s => !process.env.MONSTER_REVEAL_TEST_ONLY || (process.env.MONSTER_REVEAL_TEST_ONLY === 'clear' ? s.visual || (s.width === 1366 && !s.reduced && !s.slow && !s.broken && !s.boss) || s.course === 'Conversation' : process.env.MONSTER_REVEAL_TEST_ONLY === 'visual' ? s.visual : process.env.MONSTER_REVEAL_TEST_ONLY === 'resize' ? s.resize : process.env.MONSTER_REVEAL_TEST_ONLY === 'boss' ? s.boss : s.course === process.env.MONSTER_REVEAL_TEST_ONLY))) {
    const { width, height = 900, dpr, reduced = false, slow = false, broken = false, boss = false, mobile = false, resize = false, visual = false, course = 'Eiken3' } = scenario;
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, reducedMotion: reduced ? 'reduce' : 'no-preference', isMobile: mobile, hasTouch: mobile });
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
    if (resize || visual) await page.route('**/monsters/**/1024/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 600));
      await route.continue();
    });
    const questions = QUESTIONS[course][1];
    const answer = questions.find(q => /^[\x20-\x7E]+$/.test(q.text)).text;
    await page.addInitScript(({ course, questions, answer, boss, battleIds, mobile, visual, width, height }) => {
      if (visual) {
        // Model keyboard pan/shrink independently of layout dimensions. This
        // is a geometry regression, not an emulation of native Android Gboard.
        const viewport = Object.assign(new EventTarget(), { width, height, offsetLeft: 0, offsetTop: 0, scale: 1 });
        Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
        window.setTestVisualViewport = (changes, events = ['resize', 'scroll']) => {
          Object.assign(viewport, changes);
          for (const event of events) viewport.dispatchEvent(new Event(event));
        };
      }
      speechSynthesis.speak = () => {};
      localStorage.setItem('etyping_external_keyboard_mode', String(!mobile));
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({ difficulty: course, level: 1, resumeMode: 'challenge', resumeInputMode: 'text-only' }));
      if (boss) localStorage.setItem('etyping_defeated_monsters', JSON.stringify(battleIds.slice(0, 19).map(id => `${course}:1:challenge:text-only:${id}`)));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map(q => [`${course}:1:${q.text}:${q.translation}`, { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: q.text !== answer, updatedAt: 0 }]))));
      // Record real animation geometry without changing its timing.
      window.revealObservations = [];
      document.addEventListener('animationstart', e => {
        if (e.pseudoElement) return;
        const node = e.target;
        if (!(node instanceof HTMLElement) || !node.dataset.monsterReveal) return;
        const image = node.querySelector('img');
        const style = getComputedStyle(node);
        window.revealObservations.push({ kind: node.dataset.monsterReveal, duration: style.animationDuration, width: node.getBoundingClientRect().width, viewportWidth: visualViewport?.width || innerWidth, viewportHeight: visualViewport?.height || innerHeight, viewportScale: visualViewport?.scale || 1, sourcePixels: image?.naturalWidth, pointerEvents: style.pointerEvents, filter: style.filter });
      }, true);
    }, { course, questions, answer, boss, battleIds, mobile, visual, width, height });
    await page.goto(url);
    await page.getByRole('button', { name: '教材を選ぶ', exact: true }).click();
    await page.getByRole('button', { name: 'この教材で始める', exact: true }).click();
    await page.getByRole('button', { name: course === 'Conversation' ? /Scene Battle/ : /Translation Battle/ }).click();
    await page.locator('.battle-input').waitFor();
    if (visual) {
      await page.locator('[data-monster-reveal="entry"]').waitFor({ state: 'attached' });
      await page.evaluate(({ width, height }) => window.setTestVisualViewport({ width, height: height * .48, offsetTop: height * .42 }), { width, height });
      assert.equal(await page.evaluate(() => innerHeight), height, 'Keyboard simulation must leave layout height unchanged');
    }
    if (resize) {
      await page.locator('[data-monster-reveal="entry"]').waitFor({ state: 'attached' });
      // Real viewport resize while the high-resolution image is still loading.
      await page.setViewportSize({ width, height: height - 260 });
    }
    if (boss) {
      await page.getByText('WARNING', { exact: true }).waitFor();
      await page.getByText('WARNING', { exact: true }).waitFor({ state: 'hidden' });
      await page.waitForFunction(() => window.revealObservations.some(x => x.kind === 'entry'));
      await page.waitForTimeout(1150);
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
    if (!reduced && !broken) {
      await page.waitForFunction(() => window.revealObservations.some(x => x.kind === 'entry'));
      await captureReveal(page, 'entry', `${output}/entry-${course}-${width}-${visual ? 'visual' : resize ? 'resize' : slow ? 'slow' : 'normal'}.png`);
    }
    // Typing remains enabled while the entrance is running or loading.
    await page.keyboard.type(answer.slice(0, 1));
    assert.equal(await page.locator('.battle-input').inputValue(), answer.slice(0, 1));
    await page.keyboard.type(answer.slice(1));
    await page.waitForFunction(() => !document.querySelector('.battle-input') || document.querySelector('.battle-input').value === '');
    for (let n = 0; n < 50 && await page.locator('.battle-input').isVisible(); n++) {
      // Allow the completed answer's React update to commit before another answer.
      await page.waitForTimeout(50);
      await page.keyboard.type(answer);
      await page.waitForFunction(() => !document.querySelector('.battle-input') || document.querySelector('.battle-input').value === '');
    }
    if (await page.locator('.battle-input').isVisible()) {
      await page.screenshot({ path: `${output}/unfinished-${width}-${dpr}.png` });
      throw new Error(`Battle did not finish: ${await page.locator('body').innerText()}`);
    }
    await page.getByText('CLEAR!', { exact: true }).first().waitFor();
    if (!reduced && !broken) await page.waitForFunction(() => window.revealObservations.some(x => x.kind === 'defeat'));
    if (visual) {
      // Pause the same animation while the keyboard closes, then pans again.
      await page.evaluate(() => {
        for (const node of document.querySelectorAll('[data-monster-reveal], [data-monster-reveal-backdrop]')) for (const animation of node.getAnimations({ subtree: true })) animation.pause();
        window.setTestVisualViewport({ height: innerHeight, offsetTop: 0 });
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await captureReveal(page, 'defeat', `${output}/defeat-${course}-${width}-keyboard-closed.png`);
      await page.evaluate(() => {
        for (const node of document.querySelectorAll('[data-monster-reveal], [data-monster-reveal-backdrop]')) for (const animation of node.getAnimations({ subtree: true })) animation.pause();
        window.setTestVisualViewport({ height: innerHeight * .48, offsetTop: innerHeight * .30 });
      });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.evaluate(() => window.setTestVisualViewport({ offsetTop: innerHeight * .42 }, ['scroll']));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }
    if (resize) {
      // Resize again during playback. The same one-second animation must remain.
      await page.setViewportSize({ width, height });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator('[data-monster-reveal="defeat"].is-playing').count(), 1);
      const measured = await page.locator('[data-monster-reveal="defeat"]').evaluate(el => ({ size: parseFloat(el.style.getPropertyValue('--reveal-size')), pixels: el.querySelector('img').naturalWidth }));
      assert.ok(Math.abs(measured.size - Math.min(width * .9 - 36, height * .84 - 36, measured.pixels / dpr)) < 1, 'Viewport geometry not refreshed');
    }
    if (!reduced && !broken) {
      await captureReveal(page, 'defeat', `${output}/defeat-${course}-${width}-${dpr}-${visual ? 'visual' : resize ? 'resize' : slow ? 'slow' : 'normal'}.png`);
    }
    const observations = await page.evaluate(() => window.revealObservations);
    for (const item of observations) {
      assert.equal(item.duration, '1s');
      assert.equal(item.pointerEvents, 'none');
      assert.equal(item.filter, 'none');
      if (item.sourcePixels) assert.ok(item.width * dpr * item.viewportScale <= item.sourcePixels + 1, 'Raster upscaled');
      const expected = Math.min(item.viewportWidth * .9 - 36, item.viewportHeight * .84 - 36, (item.sourcePixels || Infinity) / (dpr * item.viewportScale));
      assert.ok(item.width >= expected * .97 && item.width <= expected + 1, 'Reveal should fill the available viewport within source resolution');
    }
    if (reduced || broken) assert.deepEqual(observations, []);
    if (resize || visual) {
      assert.equal(observations.filter(item => item.kind === 'entry').length, 1, 'Entry restarted after resize');
      assert.equal(observations.filter(item => item.kind === 'defeat').length, 1, 'Defeat restarted after resize');
    }
    const highRes = [...requests].filter(r => r.includes('/1024/'));
    assert.ok(highRes.every(r => r.endsWith('/c1_1.webp')), 'Only the current encounter should request high-res art');
    if (reduced || course === 'Conversation') assert.deepEqual(highRes, []);
    else assert.equal(highRes.length, 1, 'Entry and defeat should reuse the same high-res URL');
    const defeated = await page.evaluate(() => localStorage.getItem('etyping_defeated_monsters'));
    assert.ok(defeated.includes(`${course}:1:challenge:text-only:c1_1`));
    // Immediately leave victory, then leave the next entrance: no stale portal.
    await page.getByRole('button', { name: /つぎのモンスターへ/ }).click();
    await page.locator('.battle-input').waitFor();
    await page.getByRole('button', { name: 'トップに戻る', exact: true }).click();
    assert.equal(await page.locator('[data-monster-reveal]').count(), 0);
    assert.equal(await page.locator('[data-monster-reveal-backdrop]').count(), 0);
    await page.waitForTimeout(1150);
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
