import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const {QUESTIONS}=load('src/data/questions.ts');const{getQuestionMeaning}=load('src/data/questionMeaning.ts');const{getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const cleanup=await trackTestBrowser(browser);
const out='node_modules/.tmp/translation-prompts-ui';fs.mkdirSync(out,{recursive:true});
const cases=[[1366,'Eiken5',1,'big'],[320,'Eiken5',2,'do the dishes'],[390,'Eiken4',2,'care for'],[390,'Eiken3',1,'fix'],[390,'Eiken3',2,'for the first time'],[390,'Eiken3',3,'It is easy for me to swim.'],[390,'EikenPre2',2,'due to'],[390,'Eiken2',2,'deal with'],[390,'EikenPre1Part1',1,'evaluate'],[390,'EikenPre1Part2',3,"I'm not fully convinced."],[390,'Eiken1Part1',2,'buckle down'],[390,'Eiken1Part2',2,'knuckle down'],[390,'Eiken5',1,'cup'],[390,'Eiken5',1,'start'],[390,'Eiken3',1,'asleep'],[390,'Eiken3',1,'support'],[390,'EikenPre2',1,'influence'],[390,'Eiken4',3,'May I use your dictionary?'],[390,'Eiken4',3,'We need to leave right now.'],[390,'EikenPre1Part2',3,"I'm not sure what to make of that."],[390,'Eiken5',1,'big','voice-only']];
try{for(const[width,course,level,text,mode='text-only']of cases){
 const qs=QUESTIONS[course][level],q=qs.find(q=>q.text===text);assert.ok(q,text);
 const context=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({qs,q,course,level,mode})=>{speechSynthesis.speak=()=>{};Math.random=()=>0;window.testNow=1000000;Date.now=()=>window.testNow;localStorage.setItem('etyping_external_keyboard_mode','true');localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:course,level,resumeMode:'challenge',resumeInputMode:mode}));localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(qs.map(v=>[course+':'+level+':'+v.text+':'+v.translation,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:v.text!==q.text,updatedAt:0}]))));},{qs,q,course,level,mode});
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5178');await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();await page.setViewportSize({width,height:900});await page.locator('.battle-input').waitFor();await page.locator('[data-monster-reveal]').waitFor({state:'detached'});
 assert.equal(await page.locator('.battle-answer-cue').count(),0);
 const p=getTranslationBattlePrompt(q,course,level),syn=page.locator('.battle-vocabulary-synonyms');
 if(mode==='text-only'){
  assert.equal((await page.locator('.battle-translation').innerText()).trim(),getQuestionMeaning(q,course));
  assert.equal(await page.getByText('表示した語以外で答えよう',{exact:true}).count(),0);
  if(p?.alternatives.length){assert.ok((await syn.innerText()).startsWith(level===3?'別表現：':'類義語：'));for(const t of p.alternatives)assert.ok((await syn.innerText()).includes(t.text+'（'+t.note+'）'));assert.equal(await syn.evaluate(el=>el.scrollWidth>el.clientWidth),false);}
  if(p?.contrasts.length)for(const t of p.contrasts)assert.ok((await page.locator('.battle-translation-contrasts').innerText()).includes(t.text+'（'+t.note+'）'));
  if(p?.formNote)assert.ok((await page.locator('.battle-translation-form').innerText()).includes(p.formNote));
  const visible=await page.locator('.battle-question-text [data-character-index]').evaluateAll(chars=>chars.filter(el=>getComputedStyle(el).opacity!=='0').map(el=>el.textContent).join(''));assert.equal(visible,'_','Answer hidden before typing');
  assert.equal(await page.locator('.battle-screen').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  await page.screenshot({path:out+'/'+course+'-'+level+'-'+width+'-'+text.replace(/[^a-z0-9]+/gi,'-')+'.png',fullPage:true});
  if(course==='Eiken5'&&level===1){await page.keyboard.type(text[0]);await page.evaluate(()=>{window.testNow+=10000;});await page.keyboard.type(text.slice(1));const key=course+':'+level+':'+q.text+':'+q.translation;await page.waitForFunction(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key].battleLevel===2,key);}
 }else{assert.equal(await syn.count(),0);assert.equal(await page.locator('.battle-translation-form').count(),0);assert.equal(await page.locator('.battle-translation-contrasts').count(),0);}
 assert.deepEqual(errors,[]);await context.close();console.log('PASS UI',course,level,text,width,mode);
}}finally{await cleanup();}
process.exit(0);
