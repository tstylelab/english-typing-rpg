import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { QUESTIONS } = load('src/data/questions.ts');
const url = process.env.BALANCE_TEST_URL || 'http://127.0.0.1:5178';
assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname));
const server=await chromium.launchServer({channel:'chrome',headless:true,args:['--mute-audio']});
const browser=await chromium.connect(server.wsEndpoint());
async function bounded(promise) {
  let timer;
  try { return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('cleanup timeout')),10000);})]); }
  finally {clearTimeout(timer);}
}
try {
  const courses=process.env.BALANCE_TEST_COURSES?.split(',') || ['Eiken5','Eiken4','Eiken3','EikenPre2','Eiken2','EikenPre1Part1','EikenPre1Part2','Eiken1Part1','Eiken1Part2'];
  for(const course of courses) for(const input of ['text-only','voice-only']) {
    const context=await browser.newContext();
    const page=await context.newPage();
    page.setDefaultTimeout(12000);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const text=course==='Eiken5' ? 'It is warm today.' : QUESTIONS[course][3].find(q=>/^[\x20-\x7E]+$/.test(q.text) && q.text.length>=30 && q.text[1]!=='z').text;
    const damage=Math.floor(200-600/Math.max(20,course==='Eiken5'?20:text.length)+1e-9);
    await page.addInitScript(({qs,input,text,course})=>{
      speechSynthesis.speak=()=>{};
      window.balanceTestNow=1000000;
      Date.now=()=>window.balanceTestNow;
      localStorage.setItem('etyping_external_keyboard_mode','true');
      localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:course,level:3,resumeMode:'challenge',resumeInputMode:input}));
      localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(qs.map(q=>[
        `${course}:3:${q.text}:${q.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:q.text!==text,updatedAt:0},
      ]))));
    },{qs:QUESTIONS[course][3],input,text,course});
    await page.goto(url);
    await page.getByText('600',{exact:true}).first().waitFor();
    await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();
    await page.locator('.battle-screen').waitFor();
    await page.getByText('600 / 600',{exact:true}).waitFor();
    for(let i=0;i<3;i++) {
      await page.keyboard.type(text[0]);
      await page.keyboard.type('zzz');
      await page.evaluate(length=>{window.balanceTestNow+=length*2000;},text.length);
      await page.keyboard.type(text.slice(1));
      await page.getByText(`${600-damage*(i+1)} / 600`,{exact:true}).waitFor();
      await page.locator('.battle-previous-study').waitFor();
    }
    assert.deepEqual(errors,[]);
    console.log(`PASS ${course} ${input}: ${text.length} chars, 3 typos, ${damage} damage per slow answer; remaining ${600-3*damage}.`);
    await bounded(context.close());
  }
} finally {
  try {await bounded(browser.close());}
  finally {try {await bounded(server.close());} catch {await server.kill();}}
}
