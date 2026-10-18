import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getQuestionGrammarPoint}=load('src/data/questionGrammarPoints.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const qs=QUESTIONS.EikenPre2[3],base=process.env.TEST_URL||'http://127.0.0.1:5196';
const out='node_modules/.tmp/pre2-grammar-integration';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const cleanup=await trackTestBrowser(browser);
try{
 for(const [width,text] of [[1366,'I remember locking the door.'],[390,'Our computers are being checked now.'],[820,'I wrote it down so that I would not forget it.'],[320,'The train had left when we arrived.']]){
  const q=qs.find(q=>q.text===text);assert.ok(q);
  const ctx=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'}),page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({qs,q})=>{
   speechSynthesis.speak=()=>{};Math.random=()=>0;
   localStorage.setItem('etyping_external_keyboard_mode','true');localStorage.setItem('etyping_max_keystrokes','1');
   localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'EikenPre2',level:3,resumeMode:'challenge',resumeInputMode:'text-only'}));
   const statuses=Object.fromEntries(qs.map(v=>['EikenPre2:3:'+v.text+':'+v.translation,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:v.text!==q.text,updatedAt:0}]));
   statuses['Eiken5:1:banana:バナナ']={practiceLevel:3,listeningLevel:3,battleLevel:3,manualOverrideLevel:3,excluded:false,updatedAt:0};
   statuses['EikenPre2:3:No way!:まさか！・絶対に嫌だ！']={practiceLevel:3,listeningLevel:3,battleLevel:3,manualOverrideLevel:3,excluded:true,updatedAt:0};
   localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(statuses));
   localStorage.setItem('etyping_defeated_monsters',JSON.stringify(['EikenPre2:3:challenge:text-only:c3_1','EikenPre2:3:challenge:text-only:c3_2','Eiken5:1:challenge:voice-only:c1_2']));
   const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
   localStorage.setItem('etyping_daily_progress',JSON.stringify({date:today,questionCount:40}));
  },{qs,q});
  await page.goto(base);await page.locator('.adventure-primary').click();await page.locator('.battle-input').waitFor();await page.locator('[data-monster-reveal]').waitFor({state:'detached'});await page.setViewportSize({width,height:900});
  assert.equal((await page.locator('.battle-translation').innerText()).trim(),getQuestionMeaning(q,'EikenPre2'));
  const p=getTranslationBattlePrompt(q,'EikenPre2',3);if(p?.formNote)assert.ok((await page.locator('.battle-translation-form').innerText()).includes(p.formNote));
  const visible=await page.locator('.battle-question-text [data-character-index]').evaluateAll(chars=>chars.filter(el=>getComputedStyle(el).opacity!=='0').map(el=>el.textContent).join(''));assert.equal(visible,'_');
  assert.equal(await page.locator('.battle-screen').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  const before=await page.evaluate(()=>({statuses:JSON.parse(localStorage.getItem('etyping_manual_question_statuses')),defeats:JSON.parse(localStorage.getItem('etyping_defeated_monsters'))}));
  await page.screenshot({path:out+'/'+width+'.png',fullPage:true});
  await page.keyboard.type(text,{delay:25});const key='EikenPre2:3:'+q.text+':'+q.translation;
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key].battleLevel===2,key);
  const after=await page.evaluate(()=>({statuses:JSON.parse(localStorage.getItem('etyping_manual_question_statuses')),defeats:JSON.parse(localStorage.getItem('etyping_defeated_monsters')),daily:JSON.parse(localStorage.getItem('etyping_daily_progress'))}));
  for(const k of Object.keys(before.statuses))if(k!==key)assert.deepEqual(after.statuses[k],before.statuses[k]);assert.deepEqual(after.defeats,before.defeats);assert.equal(after.daily.questionCount,41);
  if(width===1366){
   for(let i=0;i<9&&!(await page.locator('[data-result-question]').count());i++){
    await page.waitForTimeout(900);if(await page.locator('[data-result-question]').count())break;await page.locator('.battle-input').waitFor();await page.keyboard.type(text,{delay:25});
   }
   await page.locator('[data-result-question]').first().waitFor();const point=getQuestionGrammarPoint('EikenPre2',3,q);
   await page.locator('.result-grammar-note summary').first().click();assert.ok((await page.locator('.result-grammar-note').first().innerText()).includes(point.note));
   assert.ok((await page.locator('.result-entry-grammar').first().innerText()).includes('stop・remember'));
   await page.locator('.result-entry-grammar .grammar-guide-link').first().click();
   await page.locator('.grammar-guide [data-grammar-card="stop-remember"]').waitFor({state:'visible'});
   await page.locator('.grammar-guide').getByRole('button',{name:'結果へ戻る',exact:true}).click();
   await page.screenshot({path:out+'/result.png',fullPage:true});
   const total=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_daily_progress')).questionCount);await page.reload();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_daily_progress')).questionCount),total);
   assert.ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_defeated_monsters')))).includes(before.defeats[0]));
  }
  assert.deepEqual(errors,[]);await ctx.close();console.log('PASS UI',width,text,'correct hint, hidden target, original/new key update, other 159 records/defeats retained, daily count.');
 }
}finally{await cleanup();}
process.exit(0);
