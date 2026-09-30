import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const server=await chromium.launchServer({channel:'chrome',headless:true,args:['--mute-audio']});
const browser=await chromium.connect(server.wsEndpoint());
const bounded=async p=>{let t;try{return await Promise.race([p,new Promise((_,r)=>{t=setTimeout(()=>r(new Error('cleanup timeout')),7000);})]);}finally{clearTimeout(t);}};
let passed=false;
try {
  for(const level of [1,2,3]) {
    const results=[];
    for(const mode of ['none','button','keyboard','repeat','voice-none','voice-hint']) {
      const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(12000);
      const q=QUESTIONS.Eiken4[level][0];const key=`Eiken4:${level}:${q.text}:${q.translation}`;
      await page.addInitScript(({questions,level,q,mode})=>{
        speechSynthesis.speak=()=>{};Math.random=()=>0;window.testNow=1000000;Date.now=()=>window.testNow;
        localStorage.setItem('etyping_external_keyboard_mode','true');
        localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'Eiken4',level,resumeMode:'challenge',resumeInputMode:mode.startsWith('voice')?'voice-only':'text-only'}));
        localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(questions.map(v=>[`Eiken4:${level}:${v.text}:${v.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:v.text!==q.text,updatedAt:0}]))));
      },{questions:QUESTIONS.Eiken4[level],level,q,mode});
      await page.goto('http://127.0.0.1:5178');await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();
      const hp=async()=>Number((await page.locator('.battle-screen').innerText()).match(/(\d+) \/ (\d+)/)[1]);
      const initial=await hp();
      if(mode==='button'||mode==='repeat'||mode==='voice-hint') await page.locator('.battle-replay').click();
      if(mode==='keyboard'||mode==='repeat') await page.keyboard.press('ControlRight');
      if(mode==='repeat') await page.locator('.battle-replay').click();
      const assisted=mode!=='none'&&!mode.startsWith('voice');
      if(assisted) assert.match(await page.locator('.battle-replay').innerText(),/使用中/);
      else assert.ok(!(await page.locator('.battle-replay').innerText()).includes('使用中'));
      await page.keyboard.type(q.text[0]);
      await page.evaluate(n=>{window.testNow+=n;},!assisted?q.text.length*2000:100);
      await page.keyboard.type(q.text.slice(1));
      await page.waitForFunction(initial=>{const m=document.querySelector('.battle-screen')?.innerText.match(/(\d+) \/ (\d+)/);return m&&Number(m[1])<initial;},initial);
      results.push(initial-await hp());
      const status=await page.evaluate(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key],key);
      assert.equal(status.battleLevel,assisted?1:2);
      assert.ok(!(await page.locator('.battle-replay').innerText()).includes('使用中'),'Reset for next question');
      if(assisted) {
        await page.waitForTimeout(1100);
        const before=await hp();
        await page.keyboard.type(q.text[0]);
        await page.evaluate(n=>{window.testNow+=n;},q.text.length*2000);
        await page.keyboard.type(q.text.slice(1));
        await page.waitForFunction(before=>{const m=document.querySelector('.battle-screen')?.innerText.match(/(\d+) \/ (\d+)/);return m&&Number(m[1])<before;},before);
        assert.equal(before-await hp(),results[0],'Next unaided answer has full damage');
      }
      await bounded(context.close());
    }
    assert.equal(results[1],Math.floor(results[0]/2));
    assert.equal(results[2],results[1]);assert.equal(results[3],results[1]);
    assert.equal(results[4],results[5],'Listening replay is not penalized');
    console.log('PASS Level',level,'slow unaided / fast button / fast Ctrl / repeated:',results);
  }
  passed=true;
} finally {
  try {await bounded(browser.close());} catch {console.warn('Browser disconnect timed out');}
  try {await bounded(server.close());} catch {
    try {await bounded(server.kill());} catch {console.warn('Test browser cleanup timed out after assertions');}
  }
}
if(passed)process.exit(0);
