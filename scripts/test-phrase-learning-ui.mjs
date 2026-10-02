import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const url=process.env.TEST_BASE_URL || 'http://127.0.0.1:5178';
const server=await chromium.launchServer({channel:'chrome',headless:true,args:['--mute-audio']});
const browser=await chromium.connect(server.wsEndpoint());
let passed=false;
const bounded=async p=>{let timer;try{return await Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('cleanup timeout')),7000);})]);}finally{clearTimeout(timer);}};
try {
  for(const single of [true,false]) {
    const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(12000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const allowed=single?['be interested in']:['want to','need to','look for','wait for','listen to','be interested in','have to'];
    await page.addInitScript(({questions,allowed})=>{
      speechSynthesis.speak=()=>{};Math.random=()=>0;
      window.testNow=1000000;Date.now=()=>window.testNow;
      localStorage.setItem('etyping_external_keyboard_mode','true');
      localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'Eiken4',level:2,resumeMode:'challenge',resumeInputMode:'text-only'}));
      localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(questions.map(q=>[`Eiken4:2:${q.text}:${q.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:!allowed.includes(q.text),updatedAt:0}]))));
    },{questions:QUESTIONS.Eiken4[2],allowed});
    await page.goto(url);await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();
    const sequence=[];
    for(let i=0;i<(single?4:8);i++) {
      if(await page.getByRole('button',{name:/つぎのモンスターへ/}).first().isVisible()) await page.getByRole('button',{name:/つぎのモンスターへ/}).first().click();
      if(await page.getByRole('button',{name:/もう一度挑戦する/}).first().isVisible()) await page.getByRole('button',{name:/もう一度挑戦する/}).first().click();
      await page.locator('.battle-screen').waitFor();
      const meaning=(await page.locator('.battle-translation').innerText()).trim();
      const q=QUESTIONS.Eiken4[2].find(q=>getQuestionMeaning(q,'Eiken4')===meaning);assert.ok(q,meaning);
      if(!single) assert.ok(!sequence.slice(-6).includes(q.text),`Early repeat: ${q.text}`);
      sequence.push(q.text);
      await page.keyboard.type(q.text[0]);
      if(single) await page.keyboard.type('zz');
      await page.evaluate(({n,single})=>{window.testNow+=n*(single?500:2000);},{n:q.text.length,single});
      if(single && i===0) {
        // Five attempts at a missing space remain raw mistakes, but must not
        // block recall progress or enter the urgent review queue.
        const space=q.text.indexOf(' ');
        await page.keyboard.type(q.text.slice(1,space));
        await page.keyboard.type('xxxxx');
        await page.keyboard.type(q.text.slice(space));
      } else {
        await page.keyboard.type(q.text.slice(1));
      }
      await page.waitForFunction(({text,previous})=>{
        const records=JSON.parse(localStorage.getItem('etyping_manual_question_statuses')||'{}');
        const entry=Object.entries(records).find(([k])=>k.startsWith('Eiken4:2:'+text+':'))?.[1];
        return entry?.longTextSuccessCount>0 && entry.updatedAt>previous;
      },{text:q.text,previous:1000000});
      const status=await page.evaluate(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key],`Eiken4:2:${q.text}:${q.translation}`);
      assert.equal(status.battleLevel,single||i<7?2:3);
      const queue=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_review_queue')||'[]'));
      assert.ok(!queue.some(e=>e.question.text===q.text),'Small mistakes must not enter urgent review');
      // Allow the battle transition and its focus effect to finish without audio.
      await page.waitForTimeout(1100);
    }
    if(single) {
      assert.ok((await page.locator('body').innerText()).includes('science'));
      const weak=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_weak_questions')||'[]'));
      assert.ok(!weak.some(q=>q.text==='be interested in'),'Battle end must not re-add small-error questions');
      const stats=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_weak_question_stats')||'{}'));
      assert.ok(stats['be interested in'].missCount>0,'Small mistakes remain in historical stats');
    }
    assert.deepEqual(errors,[]);
    console.log('PASS',single?'2 typos promote to caution; immediate repeat cannot master; example preserved':'7 distinct phrases across monsters; second spaced success masters',sequence.join(' / '));
    await bounded(context.close());
  }
  passed=true;
} finally {
  try {await bounded(browser.close());} catch { /* Windows browser cleanup can time out. */ }
  try {await bounded(server.close());} catch {try {await bounded(server.kill());} catch { /* Separate muted test browser only. */ }}
}
if(passed) process.exit(0);
