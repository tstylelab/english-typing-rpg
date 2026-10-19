import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'C:/Users/tsuyoshi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const {getGrammarCard}=load('src/data/grammarGuides.ts');
const base=process.env.TEST_URL||'http://127.0.0.1:5196';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const out='node_modules/.tmp/grade1-expansion-ui';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const cleanup=await trackTestBrowser(browser);
try{
 for(const [course,width,text]of [['Eiken1Part1',1366,'The researchers may have overlooked an important variable.'],['Eiken1Part2',390,'We will share the data provided that privacy is protected.']]){
  if(process.env.TEST_COURSE&&process.env.TEST_COURSE!==course)continue;
  const qs=QUESTIONS[course][3],q=qs.find(q=>q.text===text),old=qs[0],count=course.endsWith('1')?37:41;assert.ok(q);
  const ctx=await browser.newContext({viewport:{width:1366,height:950},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({course,qs,q,old})=>{
   speechSynthesis.speak=()=>{};Math.random=()=>0;
   if(localStorage.getItem('grade1-expansion-seeded'))return;localStorage.setItem('grade1-expansion-seeded','true');
   localStorage.setItem('etyping_external_keyboard_mode',course.endsWith('1')?'true':'false');localStorage.setItem('etyping_max_keystrokes','1');
   localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:course,level:3,resumeMode:'challenge',resumeInputMode:'text-only'}));
   const key=v=>course+':3:'+v.text+':'+v.translation;
   const statuses=Object.fromEntries(qs.map(v=>[key(v),{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:v.text!==q.text,updatedAt:0}]));
   statuses[key(old)]={practiceLevel:3,listeningLevel:2,battleLevel:3,manualOverrideLevel:3,excluded:true,updatedAt:1};
   statuses['Eiken5:1:banana:バナナ']={practiceLevel:3,listeningLevel:3,battleLevel:3,manualOverrideLevel:3,excluded:false,updatedAt:1};
   localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(statuses));
   localStorage.setItem('etyping_defeated_monsters',JSON.stringify([course+':3:challenge:text-only:c3_1',course+':3:challenge:text-only:c3_2','Eiken5:1:challenge:voice-only:c1_2']));
   localStorage.setItem('etyping_marked_question_keys_by_scope',JSON.stringify({[course+':3']:[key(old)]}));
   const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
   localStorage.setItem('etyping_daily_progress',JSON.stringify({date:today,questionCount:40}));
  },{course,qs,q,old});
  await page.goto(base);await page.locator('.adventure-primary').click();await page.locator('.battle-input').waitFor();await page.locator('[data-monster-reveal]').waitFor({state:'detached'});await page.setViewportSize({width,height:950});
  assert.equal((await page.locator('.battle-translation').innerText()).trim(),getQuestionMeaning(q,course));
  const prompt=getTranslationBattlePrompt(q,course,3);assert.ok((await page.locator('.battle-translation-form').innerText()).includes(prompt.formNote));
  assert.ok((await page.locator('.battle-vocabulary-synonyms').innerText()).includes(prompt.alternatives[0].text));
  const visible=await page.locator('.battle-question-text [data-character-index]').evaluateAll(chars=>chars.filter(el=>getComputedStyle(el).opacity!=='0').map(el=>el.textContent).join(''));assert.equal(visible,'_');
  assert.equal(await page.locator('.battle-screen').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  const before=await page.evaluate(()=>({statuses:JSON.parse(localStorage.getItem('etyping_manual_question_statuses')),defeats:JSON.parse(localStorage.getItem('etyping_defeated_monsters'))}));
  await page.screenshot({path:out+'/battle-'+width+'.png',fullPage:true});
  await page.keyboard.type(text,{delay:15});const key=course+':3:'+q.text+':'+q.translation;
  try{await page.waitForFunction(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key].battleLevel===2,key);}catch(e){await page.screenshot({path:out+'/failure-'+width+'.png',fullPage:true});console.log(await page.evaluate(key=>({input:document.querySelector('.battle-input')?.value,focus:document.activeElement?.outerHTML,meaning:document.querySelector('.battle-translation')?.textContent,status:JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key]}),key));throw e;}
  const after=await page.evaluate(()=>({statuses:JSON.parse(localStorage.getItem('etyping_manual_question_statuses')),defeats:JSON.parse(localStorage.getItem('etyping_defeated_monsters')),daily:JSON.parse(localStorage.getItem('etyping_daily_progress'))}));
  for(const k of Object.keys(before.statuses))if(k!==key)assert.deepEqual(after.statuses[k],before.statuses[k]);assert.deepEqual(after.defeats,before.defeats);assert.equal(after.daily.questionCount,41);
  for(let i=0;i<8&&!(await page.locator('[data-result-question]').count());i++){
   await page.waitForTimeout(900);if(await page.locator('[data-result-question]').count())break;await page.locator('.battle-input').waitFor();await page.keyboard.type(text,{delay:15});
  }
  await page.locator('[data-result-question]').first().waitFor();await page.locator('.result-grammar-note summary').first().click();assert.ok((await page.locator('.result-grammar-note').first().innerText()).includes(q.grammarPoint.note));
  await page.locator('.result-entry-grammar .grammar-guide-link').first().click();
  const id=getGrammarCard(course,3,q).id,card=page.locator('.grammar-guide [data-grammar-card="'+id+'"]');await card.waitFor({state:'visible'});assert.equal(await page.locator('.grammar-guide [data-grammar-card]').count(),count);
  await card.locator('.grammar-guide-save').click();await page.locator('.grammar-guide').getByRole('button',{name:'結果へ戻る',exact:true}).click();await page.screenshot({path:out+'/result-'+width+'.png',fullPage:true});
  const mark=course+':3:'+old.text+':'+old.translation;
  await page.waitForFunction(({course,mark,key})=>JSON.parse(localStorage.getItem('etyping_player_profiles')||'[]').some(p=>p.data.markedQuestionKeysByScope?.[course+':3']?.includes(mark)&&p.data.manualQuestionStatuses?.[key]?.battleLevel>=2),{course,mark,key});
  const total=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_daily_progress')).questionCount);
  await page.reload();await page.locator('.adventure-primary').waitFor();
  const saved=await page.evaluate(()=>({statuses:JSON.parse(localStorage.getItem('etyping_manual_question_statuses')),marked:JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope')),daily:JSON.parse(localStorage.getItem('etyping_daily_progress'))}));
  assert.ok(saved.marked[course+':3'].includes(mark));assert.deepEqual(saved.statuses[mark],before.statuses[mark]);assert.equal(saved.daily.questionCount,total);
  await page.goto(base+'/?guide='+course.toLowerCase());await page.locator('.grammar-guide').getByRole('button',{name:'保存したカード 1',exact:true}).click();assert.equal(await page.locator('[data-grammar-card="'+id+'"]').count(),1);
  assert.deepEqual(errors,[]);await ctx.close();console.log('PASS UI',course,width,'Japanese/alternatives, concealed answer, result annotation/guide/bookmark, saved old/new status, review mark, defeats and daily count.');
 }
}finally{await cleanup();}
process.exit(0);
