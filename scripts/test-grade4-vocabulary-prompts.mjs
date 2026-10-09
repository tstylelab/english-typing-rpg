import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getGrade4VocabularySynonyms}=load('src/data/grade4VocabularyPrompts.ts');
const entries=JSON.parse(fs.readFileSync('src/data/grade4Level1Prompts.json','utf8'));
const priorSource=fs.readFileSync('src/data/questionMeaning.ts','utf8').replace("import { getGrade4VocabularyMeaning } from './grade4VocabularyPrompts';",'').replace('  ?? getGrade4VocabularyMeaning(question, difficulty)','');
const prior={exports:{}};
vm.runInNewContext(ts.transpileModule(priorSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports:prior.exports,require:name=>load('src/data/'+name.slice(2))});
const before=prior.exports.getQuestionMeaning;
assert.equal(new Set(entries.map(e=>e.text)).size,entries.length);
for(const entry of entries){
 const q=QUESTIONS.Eiken4[1].find(q=>q.text===entry.text);
 assert.ok(q);assert.equal(q.translation,entry.translation);assert.equal(q.exampleEn??'',entry.exampleEn??'');assert.equal(entry.previousMeaning,before(q,'Eiken4'));
 assert.equal(getQuestionMeaning(q,'Eiken4'),entry.meaning);
 assert.ok(!/で始まる|文字数|\d+文字/.test(entry.meaning));
 assert.ok(entry.synonyms.every(s=>s.text!==q.text&&s.note&&s.note.length<=20));
 assert.equal(getGrade4VocabularySynonyms({...q,translation:'different identity'},'Eiken4',1).length,0);
}
let outside=0,changed=0;
for(const [course,levels] of Object.entries(QUESTIONS))for(const [level,qs] of Object.entries(levels))for(const q of qs){
 if(course==='Eiken4'&&level==='1'){if(before(q,course)!==getQuestionMeaning(q,course))changed++;continue;}
 assert.equal(getQuestionMeaning(q,course),before(q,course),course+':'+level+':'+q.text);
 assert.equal(getGrade4VocabularySynonyms(q,course,Number(level)).length,0);outside++;
}
assert.equal(changed,22);assert.equal(entries.length,58);
console.log('PASS 58 identities, 22 changed meanings, 52 synonym sets; other '+outside+' questions unchanged');
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const cleanup=await trackTestBrowser(browser);
const out='node_modules/.tmp/grade4-vocabulary-prompts';fs.mkdirSync(out,{recursive:true});
try{
 for(const [width,text,course,level,inputMode] of [[1366,'begin','Eiken4',1,'text-only'],[390,'begin','Eiken4',1,'text-only'],[320,'thing','Eiken4',1,'text-only'],[390,'plane','Eiken4',1,'text-only'],[390,'college','Eiken4',1,'text-only'],[390,'anything','Eiken4',1,'text-only'],[390,'begin','Eiken4',1,'voice-only'],[390,'on foot','Eiken4',2,'text-only']]){
  const context=await browser.newContext({viewport:{width:1366,height:900}});const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const qs=QUESTIONS[course][level],q=qs.find(q=>q.text===text);assert.ok(q);
  await page.addInitScript(({qs,q,course,level,inputMode})=>{
   speechSynthesis.speak=()=>{};Math.random=()=>0;window.testNow=1000000;Date.now=()=>window.testNow;
   localStorage.setItem('etyping_external_keyboard_mode','true');
   localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:course,level,resumeMode:'challenge',resumeInputMode:inputMode}));
   localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(qs.map(v=>[course+':'+level+':'+v.text+':'+v.translation,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:v.text!==q.text,updatedAt:0}]))));
  },{qs,q,course,level,inputMode});
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:5178');await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();await page.setViewportSize({width,height:900});
  const box=page.locator('.battle-vocabulary-synonyms');
  const expected=getGrade4VocabularySynonyms(q,course,level);
  if(inputMode==='text-only'&&expected.length){
   await box.waitFor();for(const s of expected){assert.ok((await box.innerText()).includes(s.text+'（'+s.note+'）'));}
   assert.ok((await box.innerText()).includes('表示した語以外で答えよう'));
   assert.equal(await box.evaluate(el=>el.scrollWidth>el.clientWidth),false,'Synonym text must fit the panel');
   assert.equal(await page.locator('.battle-screen').evaluate(el=>el.scrollWidth>el.clientWidth),false,'No horizontal overflow');
   if(text==='begin'||text==='thing')await page.locator('[data-monster-reveal]').waitFor({state:'detached'});
   if(text==='begin'||text==='thing')await page.screenshot({path:out+'/'+text+'-'+width+'.png',fullPage:true});
  }else assert.equal(await box.count(),0,'No cues in listening or other levels');
  if(text==='begin'&&inputMode==='text-only'){
   await page.keyboard.type(text[0]);await page.evaluate(()=>{window.testNow+=10000;});await page.keyboard.type(text.slice(1));
   const key=course+':'+level+':'+q.text+':'+q.translation;
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key].battleLevel===2,key);
   const status=await page.evaluate(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key],key);assert.equal(status.battleLevel,2);
  }
  assert.deepEqual(errors,[]);await context.close();console.log('PASS UI',width,text,inputMode,'scoped hints, layout and original answer/progress');
 }
}finally{await cleanup();}
process.exit(0);
