import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const cleanup=await trackTestBrowser(browser);
const base=process.env.TEST_URL||'http://127.0.0.1:5196';
const out='node_modules/.tmp/sequential-prompt-review';fs.mkdirSync(out,{recursive:true});
const cases=[
 [390,'Eiken5',1,'chopstick'],[820,'Eiken4',1,'between'],[390,'Eiken3',1,'shell'],
 [390,'EikenPre2',1,'rent'],[1366,'Eiken2',1,'poetry'],
 [390,'EikenPre1Part1',1,'outstanding'],[390,'EikenPre1Part2',1,'legal'],
 [390,'Eiken1Part1',1,'conviction'],[390,'Eiken1Part2',1,'reside'],
 [1366,'Eiken2',2,'be willing to'],[390,'Eiken2',2,'make sure that'],
 [320,'Eiken5',2,'put on'],[820,'Eiken4',2,'remember to'],[390,'Eiken3',2,'a couple of'],
 [390,'EikenPre1Part1',2,'check off'],[390,'EikenPre1Part2',2,'result from'],
 [390,'Eiken1Part1',2,'chime in'],[390,'Eiken1Part2',2,'let on'],
 [390,'Eiken5',3,'She is watching TV.'],[390,'Eiken3',3,'The boy who is running is my brother.'],
 [390,'EikenPre2',3,'Would you mind closing the door?'],[390,'Eiken2',3,'The book that you recommended was useful.'],
 [390,'EikenPre1Part1',3,"I hadn't thought of it that way."],
 [390,'EikenPre1Part2',3,'What brought you to that conclusion?'],
 [390,'Eiken1Part1',3,'The new rules led to a sharp drop in pollution.'],
 [390,'Eiken1Part2',3,'The study which examined rural hospitals revealed a shortage.']
];
try{
 for(const [width,course,level,text] of cases.filter(c=>!process.env.TEST_LEVEL1_ONLY||c[2]===1)){
  const qs=QUESTIONS[course][level],q=qs.find(q=>q.text===text);assert.ok(q);
  const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({qs,q,course,level})=>{
   speechSynthesis.speak=()=>{};Math.random=()=>0;
   localStorage.setItem('etyping_external_keyboard_mode','true');localStorage.setItem('etyping_max_keystrokes','1');
   localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:course,level,resumeMode:'challenge',resumeInputMode:'text-only'}));
   localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(qs.map(v=>[course+':'+level+':'+v.text+':'+v.translation,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:v.text!==q.text,updatedAt:0}]))));
  },{qs,q,course,level});
  await page.goto(base);await page.locator('.adventure-primary').click();await page.locator('.battle-input').waitFor();await page.setViewportSize({width,height:900});await page.locator('[data-monster-reveal]').waitFor({state:'detached'});
  assert.equal((await page.locator('.battle-translation').innerText()).trim(),getQuestionMeaning(q,course));
  const p=getTranslationBattlePrompt(q,course,level);
  for(const [key,selector] of [['alternatives','.battle-vocabulary-synonyms'],['contrasts','.battle-translation-contrasts']]){
   if(p[key].length){const content=await page.locator(selector).innerText();for(const item of p[key])assert.ok(content.includes(item.text+'（'+item.note+'）'));}
  }
  if(p.formNote)assert.ok((await page.locator('.battle-translation-form').innerText()).includes(p.formNote));
  assert.equal(await page.locator('.battle-answer-cue').count(),0);
  const visible=await page.locator('.battle-question-text [data-character-index]').evaluateAll(chars=>chars.filter(el=>getComputedStyle(el).opacity!=='0').map(el=>el.textContent).join(''));assert.equal(visible,'_');
  assert.equal(await page.locator('.battle-screen').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  await page.screenshot({path:out+'/'+course+'-'+level+'-'+width+'-'+text.replace(/[^a-z0-9]+/gi,'-')+'.png',fullPage:true});
  if(text==='rent'){
   const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses')));
   await page.keyboard.type(text,{delay:120});
   const key=course+':'+level+':'+q.text+':'+q.translation;
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key].battleLevel===2,key);
   const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses')));
   for(const k of Object.keys(before))if(k!==key)assert.deepEqual(after[k],before[k]);
   console.log('PASS answer persists under original key; other '+(qs.length-1)+' records unchanged.');
  }
  assert.deepEqual(errors,[]);await context.close();console.log('PASS battle UI',course,level,text,width);
 }
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/docs/translation-prompt-reviews-2026-10-18/index.html?course=Eiken2&level=2');
 await page.locator('article').first().waitFor();assert.equal(await page.locator('article').count(),93);
 await page.locator('#search').fill('be willing to');assert.equal(await page.locator('article').count(),1);assert.ok((await page.locator('article').innerText()).includes('いとわない'));
 await page.locator('#search').fill('');await page.locator('#all').check();assert.equal(await page.locator('article').count(),203);
 await page.locator('#all').uncheck();await page.locator('#scope').selectOption('Eiken1Part2-L3.json');await page.waitForFunction(()=>document.querySelector('#summary').textContent.includes('英検1級②'));
 await page.reload();await page.locator('article').first().waitFor();assert.equal(await page.locator('#scope').inputValue(),'Eiken1Part2-L3.json');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:out+'/review-mobile.png',fullPage:true});assert.deepEqual(errors,[]);await context.close();console.log('PASS review UI: filtering, 203 rows, course switching, URL/reload and mobile overflow.');
}finally{await cleanup();}
process.exit(0);
