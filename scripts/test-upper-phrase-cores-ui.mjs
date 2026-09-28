import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { upperPhraseLegacy, migrateScopedPhraseCore } = load('src/data/phraseCoreMigration.ts');
const fixtures = { Eiken3:'be interested in science', EikenPre2:'put off the meeting', Eiken2:'prefer tea to coffee', Eiken1Part1:'capitalize on an opportunity', Eiken1Part2:'go through with the plan' };
const server=await chromium.launchServer({channel:'chrome',headless:true,args:['--mute-audio']});
const browser=await chromium.connect(server.wsEndpoint());
const bounded=async p=>{let timer;try{return await Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('cleanup timeout')),7000);})]);}finally{clearTimeout(timer);}};
let passed=false;
try {
  for(const [course,text] of Object.entries(fixtures)) {
    const original=upperPhraseLegacy[course].find(q=>q.text===text);
    const core=migrateScopedPhraseCore(course,2,original);
    const context=await browser.newContext({viewport:{width:course==='Eiken2'?390:1366,height:900}});
    const page=await context.newPage();page.setDefaultTimeout(12000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(({course,text,questions})=>{
      speechSynthesis.speak=()=>{};Math.random=()=>0;
      localStorage.setItem('etyping_external_keyboard_mode','true');
      localStorage.setItem('etyping_daily_progress',JSON.stringify({date:new Date().toISOString().slice(0,10),questionCount:1}));
      localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:course,level:2,resumeMode:'challenge',resumeInputMode:'text-only'}));
      localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(questions.map(q=>[`${course}:2:${q.text}:${q.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:q.text!==text,updatedAt:1}]))));
    },{course,text,questions:upperPhraseLegacy[course]});
    await page.goto(process.env.TEST_URL||'http://127.0.0.1:5178');
    const start=page.getByRole('button',{name:'この敵に挑む',exact:true});
    if(await start.isVisible()) await start.click();
    else await page.getByRole('button',{name:/前回の続きから/}).click();
    await page.locator('.battle-screen').waitFor();
    assert.equal((await page.locator('.battle-translation').innerText()).trim(),core.translation);
    await page.keyboard.type(core.text,{delay:15});
    await page.waitForFunction(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses')||'{}')[key]?.battleLevel===2,`${course}:2:${core.text}:${core.translation}`);
    await page.waitForTimeout(1100);
    for(let i=0;i<8 && await page.locator('.battle-screen').isVisible();i++) {
      await page.getByRole('button',{name:'この問題をスキップ',exact:true}).click();
      await page.waitForTimeout(250);
    }
    await page.locator('.result-today').waitFor();
    const body=await page.locator('body').innerText();
    assert.ok(body.includes(core.text));assert.ok(body.includes(original.exampleEn),'Original example on result');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.deepEqual(errors,[]);
    console.log(`PASS ${course}: legacy save -> ${core.text}, typed answer, progress, original example and layout`);
    await bounded(context.close());
  }
  passed=true;
} finally {
  try{await bounded(browser.close());}catch{ /* Windows cleanup can time out. */ }
  try{await bounded(server.close());}catch{try{await bounded(server.kill());}catch{ /* Owned muted test browser only. */ }}
}
if(passed)process.exit(0);
