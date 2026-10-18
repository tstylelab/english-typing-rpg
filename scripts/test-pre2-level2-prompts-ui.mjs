import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const cleanup=await trackTestBrowser(browser);
const out='node_modules/.tmp/pre2-level2-prompt-review';fs.mkdirSync(out,{recursive:true});
try {
 for(const [width,text] of [[1366,'catch up with'],[820,'be tired from'],[390,'no more than'],[320,'after all'],[390,'mean to']]){
  const qs=QUESTIONS.EikenPre2[2],q=qs.find(q=>q.text===text);
  const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({qs,q})=>{
   speechSynthesis.speak=()=>{};Math.random=()=>0;
   localStorage.setItem('etyping_external_keyboard_mode','true');
   localStorage.setItem('etyping_max_keystrokes','1');
   localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'EikenPre2',level:2,resumeMode:'challenge',resumeInputMode:'text-only'}));
   localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(qs.map(v=>['EikenPre2:2:'+v.text+':'+v.translation,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:v.text!==q.text,updatedAt:0}]))));
  },{qs,q});
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:5196/');
  await page.locator('.adventure-primary').click();
  await page.locator('.battle-input').waitFor();
  await page.setViewportSize({width,height:900});
  await page.locator('[data-monster-reveal]').waitFor({state:'detached'});
  assert.equal((await page.locator('.battle-translation').innerText()).trim(),getQuestionMeaning(q,'EikenPre2'));
  const p=getTranslationBattlePrompt(q,'EikenPre2',2);
  for(const [key,selector] of [['alternatives','.battle-vocabulary-synonyms'],['contrasts','.battle-translation-contrasts']]){
   if(p[key].length){const content=await page.locator(selector).innerText();for(const item of p[key])assert.ok(content.includes(item.text+'（'+item.note+'）'));}
  }
  const visible=await page.locator('.battle-question-text [data-character-index]').evaluateAll(chars=>chars.filter(el=>getComputedStyle(el).opacity!=='0').map(el=>el.textContent).join(''));
  assert.equal(visible,'_','Target is not exposed before answering');
  assert.equal(await page.locator('.battle-screen').evaluate(el=>el.scrollWidth>el.clientWidth),false,'No horizontal overflow');
  await page.screenshot({path:out+'/'+width+'-'+text.replaceAll(' ','-')+'.png',fullPage:true});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses')));
  if(text==='mean to'){
   await page.keyboard.type(text,{delay:120});
   const key='EikenPre2:2:'+q.text+':'+q.translation;
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key].battleLevel===2,key);
   const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses')));
   for(const k of Object.keys(before))if(k!==key)assert.deepEqual(after[k],before[k]);
  }
  assert.deepEqual(errors,[]);
  await context.close();console.log('PASS UI',width,text);
 }
} finally {await cleanup();}
process.exit(0);
