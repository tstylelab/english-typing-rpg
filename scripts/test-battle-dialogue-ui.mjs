import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const url = process.env.DIALOGUE_TEST_URL || 'http://127.0.0.1:5178';
const output = process.env.DIALOGUE_TEST_OUTPUT || 'design/monster-samples/dialogue-local-20261006';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
const close = await trackTestBrowser(browser);
const report = [];
try {
  for (const [width, height, guide = false] of [[1600,900],[1366,768],[1024,768],[768,1024],[390,844],[320,740],[1366,900,true],[740,480,true]]) {
    const difficulty = guide ? 'Eiken5' : 'Eiken4';
    const questions = QUESTIONS[difficulty][1];
    const answer = questions.find(q => /^[\x20-\x7e]+$/.test(q.text)).text;
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(({difficulty,questions,answer,guide}) => {
      speechSynthesis.speak = () => {};
      localStorage.setItem('etyping_external_keyboard_mode', 'true');
      localStorage.setItem('etyping_last_selected_course', JSON.stringify({difficulty,level:1,resumeMode:guide?'guide':'challenge',resumeInputMode:'text-only'}));
      localStorage.setItem('etyping_manual_question_statuses', JSON.stringify(Object.fromEntries(questions.map(q=>[`${difficulty}:1:${q.text}:${q.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:q.text!==answer,updatedAt:0}]))));
    }, {difficulty,questions,answer,guide});
    await page.goto(url);
    await page.getByRole('button', {name:'教材を選ぶ',exact:true}).click();
    await page.getByRole('button', {name:'この教材で始める',exact:true}).click();
    await page.getByRole('button', {name:guide?/基礎練習/:/Translation Battle/}).click();
    await page.locator('.battle-dialogue').waitFor();
    if (guide) await page.getByRole('button',{name:'次のキーが光る',exact:true}).click();
    await page.waitForTimeout(1200);
    await page.screenshot({path:`${output}/${width}-${height}-${guide?'guide':'battle'}.png`,fullPage:true});
    // Compare layout positions independently of the existing idle bounce.
    await page.locator('.battle-avatar').evaluate(el=>{for(const animation of el.getAnimations()){animation.pause();animation.currentTime=1000;}});
    await page.waitForTimeout(150);
    const original = await page.locator('.battle-dialogue').textContent();
    const measurements = [];
    for (const text of [original, '今日はコンディションが良い。昨日はアップデート待ちで寝不足だった。だが今度は負けないぞ！最後まで相手になってもらう。']) {
      await page.locator('.battle-dialogue').evaluate((el,text)=>{el.textContent=text;},text);
      measurements.push(await page.evaluate(() => {
        const rect = selector => {const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
        const bubble=document.querySelector('.battle-dialogue');
        return {row:rect('.battle-character-row'),bubble:rect('.battle-dialogue'),avatar:rect('.battle-avatar'),card:rect('.battle-card'),font:parseFloat(getComputedStyle(bubble).fontSize),overflow:bubble.scrollWidth> bubble.clientWidth+1,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,guide:!!document.querySelector('.battle-with-keyboard')};
      }));
    }
    for (const m of measurements) {
      assert.equal(m.pageOverflow,false);
      assert.equal(m.overflow,false);
      assert.ok(m.bubble.left>=0 && m.bubble.right<=width,`Bubble must stay inside horizontal bounds: ${JSON.stringify(m)}`);
      assert.ok(m.card.top>=Math.max(m.bubble.bottom,m.avatar.bottom) || m.card.left>=Math.max(m.bubble.right,m.avatar.right),'Dialogue must not overlap input card');
      if (width>=768 && !guide) {
        assert.ok(m.bubble.left>=m.avatar.right,'Wide screen bubble should sit beside the monster');
        assert.ok(Math.abs((m.bubble.top+m.bubble.bottom-m.avatar.top-m.avatar.bottom)/2)<15,`Bubble should be at monster height: ${JSON.stringify(m)}`);
        assert.ok(m.font>=14);
      } else assert.ok(m.bubble.bottom<=m.avatar.top+1,'Narrow/guide layout should stack without overlap');
      assert.equal(m.guide,guide);
    }
    await page.locator('.battle-dialogue').evaluate((el,text)=>{el.textContent=text;},original);
    await page.keyboard.type(answer.slice(0,1));
    if (!guide) assert.equal(await page.locator('.battle-input').inputValue(),answer.slice(0,1));
    await page.getByRole('button',{name:'トップに戻る',exact:true}).click();
    assert.equal(await page.locator('.battle-dialogue').count(),0);
    assert.deepEqual(errors,[]);
    report.push({width,height,guide,original,measurements});
    console.log('PASS dialogue',width,height,guide?'guide':'battle');
    await page.goto('about:blank');
    await context.close();
  }
  writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2));
} finally {await close();}
process.exit(0);
