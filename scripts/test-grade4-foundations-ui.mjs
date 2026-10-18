import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const r=JSON.parse(fs.readFileSync('docs/grade4-level3-foundations-2026-10-19/review.json','utf8'));
const qs=QUESTIONS.Eiken4[3],base=process.env.TEST_URL||'http://127.0.0.1:5196';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const out='node_modules/.tmp/grade4-foundations-integration';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const cleanup=await trackTestBrowser(browser);
try{
 const ctx=await browser.newContext({viewport:{width:1366,height:900}}),page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/docs/grade4-level3-foundations-2026-10-19/index.html');
 await page.locator('article').first().waitFor();assert.equal(await page.locator('article').count(),24);
 for(const row of r.active.filter(e=>e.origin==='add')){
  const el=page.locator('article').filter({has:page.getByText(row.question.text,{exact:true})});
  assert.equal(await el.locator('.ja').innerText(),row.meaning);assert.ok((await el.locator('.hint').innerText()).includes(row.formNote));
 }
 await page.getByRole('button',{name:'通常出題233問',exact:true}).click();assert.equal(await page.locator('article').count(),233);
 await page.getByRole('button',{name:'表現条件の修正13問',exact:true}).click();assert.equal(await page.locator('article').count(),13);
 await page.getByRole('searchbox').fill('dictionary');assert.equal(await page.locator('article').count(),1);
 await page.getByRole('checkbox').check();assert.equal(await page.locator('article .en').evaluate(el=>getComputedStyle(el).visibility),'hidden');
 await page.reload();assert.equal(await page.getByRole('checkbox').isChecked(),true);assert.equal(await page.locator('article').count(),1);
 await page.getByRole('searchbox').fill('');await page.getByRole('checkbox').uncheck();await page.getByRole('button',{name:'追加24問',exact:true}).click();
 for(const width of [1366,820,390,320]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if([1366,390].includes(width))await page.screenshot({path:out+'/review-'+width+'.png',fullPage:true});}
 assert.deepEqual(errors,[]);await ctx.close();console.log('PASS review: 24 additions / 13 revised / 233 all; exact Japanese/hints; search, hiding/reload; four viewport widths.');
 for(const [width,text] of [[1366,'This bag is too heavy for me.'],[820,'I will call you after I finish my homework.'],[390,'May I use your dictionary?'],[320,'I forgot to bring my homework today.']]){
  const q=qs.find(q=>q.text===text);assert.ok(q);
  const ctx=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce'}),page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({qs,q})=>{
   speechSynthesis.speak=()=>{};Math.random=()=>0;
   localStorage.setItem('etyping_external_keyboard_mode','true');localStorage.setItem('etyping_max_keystrokes','1');
   localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'Eiken4',level:3,resumeMode:'challenge',resumeInputMode:'text-only'}));
   const statuses=Object.fromEntries(qs.map(v=>['Eiken4:3:'+v.text+':'+v.translation,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:v.text!==q.text,updatedAt:0}]));
   statuses['Eiken5:1:banana:バナナ']={practiceLevel:3,listeningLevel:3,battleLevel:3,manualOverrideLevel:3,excluded:false,updatedAt:0};
   localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(statuses));
   localStorage.setItem('etyping_defeated_monsters',JSON.stringify(['Eiken4:3:challenge:text-only:c3_1','Eiken4:3:challenge:text-only:c3_2','Eiken5:1:challenge:voice-only:c1_2']));
   const d=new Date(),today=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
   localStorage.setItem('etyping_daily_progress',JSON.stringify({date:today,questionCount:40}));
  },{qs,q});
  await page.goto(base);await page.locator('.adventure-primary').click();await page.locator('.battle-input').waitFor();await page.locator('[data-monster-reveal]').waitFor({state:'detached'});await page.setViewportSize({width,height:900});
  assert.equal((await page.locator('.battle-translation').innerText()).trim(),getQuestionMeaning(q,'Eiken4'));
  const prompt=getTranslationBattlePrompt(q,'Eiken4',3);assert.ok((await page.locator('.battle-translation-form').innerText()).includes(prompt.formNote));
  if(text.startsWith('May I')){
   const s=await page.locator('.battle-vocabulary-synonyms').innerText();assert.match(s,/Can I/);assert.match(s,/Could I/);assert.match(await page.locator('.battle-translation-form').innerText(),/別表現も自然/);
  }
  const visible=await page.locator('.battle-question-text [data-character-index]').evaluateAll(chars=>chars.filter(el=>getComputedStyle(el).opacity!=='0').map(el=>el.textContent).join(''));assert.equal(visible,'_');
  assert.equal(await page.locator('.battle-screen').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  const before=await page.evaluate(()=>({statuses:JSON.parse(localStorage.getItem('etyping_manual_question_statuses')),defeats:JSON.parse(localStorage.getItem('etyping_defeated_monsters'))}));
  await page.screenshot({path:out+'/battle-'+width+'.png',fullPage:true});
  await page.keyboard.type(text,{delay:20});const key='Eiken4:3:'+q.text+':'+q.translation;
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key].battleLevel===2,key);
  const after=await page.evaluate(()=>({statuses:JSON.parse(localStorage.getItem('etyping_manual_question_statuses')),defeats:JSON.parse(localStorage.getItem('etyping_defeated_monsters')),daily:JSON.parse(localStorage.getItem('etyping_daily_progress'))}));
  for(const k of Object.keys(before.statuses))if(k!==key)assert.deepEqual(after.statuses[k],before.statuses[k]);assert.deepEqual(after.defeats,before.defeats);assert.equal(after.daily.questionCount,41);
  if(width===1366||width===320){
   for(let i=0;i<10&&!(await page.locator('[data-result-question]').count());i++){
    await page.waitForTimeout(900);if(await page.locator('[data-result-question]').count())break;await page.locator('.battle-input').waitFor();await page.keyboard.type(text,{delay:15});
   }
   await page.locator('[data-result-question]').first().waitFor();
   await page.locator('.result-grammar-note summary').first().click();
   assert.match(await page.locator('.result-grammar-note').first().innerText(),width===1366?/too/:/忘れた行為の内容/);
   await page.locator('.result-entry-grammar .grammar-guide-link').first().click();
   const id=width===1366?'too':'to-noun';const card=page.locator('.grammar-guide [data-grammar-card="'+id+'"]');await card.waitFor({state:'visible'});
   assert.equal(await page.locator('.grammar-guide [data-grammar-card]').count(),34);
   if(id==='to-noun'){await card.locator('summary').filter({hasText:'もうひとつヒント'}).click();assert.match(await card.innerText(),/forget to bring/);}
   await card.locator('.grammar-guide-save').click();
   await page.locator('.grammar-guide').getByRole('button',{name:'結果へ戻る',exact:true}).click();
   await page.screenshot({path:out+'/result-'+width+'.png',fullPage:true});
   const total=await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_daily_progress')).questionCount);await page.reload();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_daily_progress')).questionCount),total);
   assert.ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('etyping_defeated_monsters')))).includes(before.defeats[0]));
   await page.goto(base+'/?guide=eiken4');
   await page.locator('.grammar-guide').getByRole('button',{name:'保存したカード 1',exact:true}).click();
   assert.equal(await page.locator('.grammar-guide [data-grammar-card="'+id+'"]').count(),1);
  }
  assert.deepEqual(errors,[]);await ctx.close();console.log('PASS UI',width,text,'prompt, concealed answer, saved identity, other records/defeats and daily count; result/guide/reload where tested.');
 }
}finally{await cleanup();}
process.exit(0);
