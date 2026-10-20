import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'C:/Users/tsuyoshi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const dialogues=JSON.parse(fs.readFileSync('src/monsterDialogues.json','utf8'));
const base=process.env.TYPING_RPG_TEST_URL||'http://127.0.0.1:5196/';
const out=process.env.TYPING_RPG_TEST_OUT||'node_modules/.tmp/bilingual-dialogues-intermediate-20261020';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const close=await trackTestBrowser(browser);
const cases=[['Eiken5',1,1366,false],['Eiken4',1,390,false],['Eiken3',1,1366,false],['EikenPre2',1,390,false],['Eiken3',2,820,false],['EikenPre2',2,320,false],['Eiken3',3,390,false],['EikenPre2',3,1366,false],['Eiken3',1,1366,true],['EikenPre2',1,820,true]].filter(([course,level])=>(!process.env.TYPING_RPG_TEST_COURSE||course===process.env.TYPING_RPG_TEST_COURSE)&&(!process.env.TYPING_RPG_TEST_LEVEL||level===Number(process.env.TYPING_RPG_TEST_LEVEL))),report=[];
try{for(const [course,level,width,guide]of cases){
 const qs=QUESTIONS[course][level],q=qs.find(q=>/^[\x20-\x7e]+$/.test(q.text));assert.ok(q);
 const ctx=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({course,level,qs,q,guide})=>{
  speechSynthesis.speak=()=>{};Math.random=()=>0;
  if(localStorage.getItem('bilingual-fixture'))return;localStorage.setItem('bilingual-fixture','true');
  localStorage.setItem('etyping_external_keyboard_mode','true');localStorage.setItem('etyping_max_keystrokes','1');
  localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:course,level,resumeMode:guide?'guide':'challenge',resumeInputMode:'text-only'}));
  const statuses=Object.fromEntries(qs.map(v=>[`${course}:${level}:${v.text}:${v.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:v.text!==q.text,updatedAt:0}]));
  statuses['Eiken3:1:fixture:保持']={practiceLevel:3,listeningLevel:2,battleLevel:2,manualOverrideLevel:3,excluded:false,updatedAt:1};
  localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(statuses));
  localStorage.setItem('etyping_defeated_monsters',JSON.stringify(['Eiken3:2:guide:voice-text:m2_1','Eiken4:3:challenge:voice-only:c3_1']));
  localStorage.setItem('etyping_marked_question_keys_by_scope',JSON.stringify({'Eiken3:1':['Eiken3:1:fixture:保持']}));
  const d=new Date(),date=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');localStorage.setItem('etyping_daily_progress',JSON.stringify({date,questionCount:40}));
 },{course,level,qs,q,guide});
 await page.goto(base+'?silentCheck=1');await page.locator('.adventure-primary').click();await page.locator('.battle-input').waitFor();await page.locator('[data-monster-reveal]').waitFor({state:'detached'});
 const name=(await page.locator('.battle-hp-name').innerText()).trim();const row=Object.entries(dialogues).find(([key,d])=>key.startsWith(course+':')&&d.name===name);assert.ok(row,name);const [identity,d]=row;
 const speech=page.locator('.battle-dialogue [data-dialogue-question]');assert.equal((await speech.innerText()).trim(),d.entrance);
 const before=await page.evaluate(()=>({defeats:JSON.parse(localStorage.getItem('etyping_defeated_monsters')),marked:JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope')),statuses:JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))}));
 const number=await speech.getAttribute('data-dialogue-question');await page.getByRole('button',{name:'この問題をスキップ',exact:true}).click();await page.waitForFunction(n=>document.querySelector('[data-dialogue-question]')?.getAttribute('data-dialogue-question')!==n,number);
 let english=(await speech.innerText()).trim();assert.ok(d.battle.includes(english));
 if(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(english)){const n=await speech.getAttribute('data-dialogue-question');await page.getByRole('button',{name:'この問題をスキップ',exact:true}).click();await page.waitForFunction(n=>document.querySelector('[data-dialogue-question]')?.getAttribute('data-dialogue-question')!==n,n);english=(await speech.innerText()).trim();}
 assert.ok(d.battle.includes(english));assert.ok(!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(english));const englishQuestion=await speech.getAttribute('data-dialogue-question');
 await page.locator('.battle-input').focus();await page.keyboard.type(q.text[0].toLowerCase()==='z'?'x':'z');await page.keyboard.type(q.text[0].toLowerCase()==='z'?'x':'z');assert.equal((await speech.innerText()).trim(),english);assert.equal(await speech.getAttribute('data-dialogue-question'),englishQuestion);
 const layout=await page.evaluate(()=>{const b=document.querySelector('.battle-dialogue'),r=b.getBoundingClientRect(),c=document.querySelector('.battle-card').getBoundingClientRect();return {overflow:b.scrollWidth>b.clientWidth+1,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,inBounds:r.left>=0&&r.right<=innerWidth+1,noOverlap:c.top>=r.bottom-1||c.left>=r.right-1};});assert.deepEqual(layout,{overflow:false,pageOverflow:false,inBounds:true,noOverlap:true});
 await page.screenshot({path:`${out}/${course}-${level}-${guide?'guide':'battle'}-${width}.png`});
 const seen=new Set([d.entrance,english]);let answers=0;
 for(let i=0;i<12&&!(await page.locator('[data-result-question]').count());i++){
  await page.locator('.battle-input').waitFor();const n=await speech.getAttribute('data-dialogue-question');const line=(await speech.innerText()).trim();seen.add(line);assert.ok([d.entrance,...d.battle,...d.aside,...d.pressure,d.defeat].includes(line));
  await page.locator('.battle-input').focus();await page.keyboard.type(q.text,{delay:8});answers++;
  try{await page.waitForFunction(n=>{const el=document.querySelector('[data-dialogue-question]');return !!document.querySelector('[data-result-question]')||(!!el&&el.getAttribute('data-dialogue-question')!==n);},n);}catch(error){
   await page.screenshot({path:`${out}/failure-${course}-${level}.png`});
   console.log('Input diagnostic',JSON.stringify({course,level,guide,iteration:i,target:q.text,number:n,state:await page.evaluate(()=>({input:document.querySelector('.battle-input')?.value,question:document.querySelector('[data-dialogue-question]')?.getAttribute('data-dialogue-question'),active:document.activeElement?.outerHTML,body:document.body.innerText.slice(-3500)}))}));throw error;
  }
 }
 await page.locator('[data-result-question]').first().waitFor();
 const after=await page.evaluate(()=>({defeats:JSON.parse(localStorage.getItem('etyping_defeated_monsters')),marked:JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope')),statuses:JSON.parse(localStorage.getItem('etyping_manual_question_statuses')),daily:JSON.parse(localStorage.getItem('etyping_daily_progress'))}));
 for(const id of before.defeats)assert.ok(after.defeats.includes(id));assert.deepEqual(after.marked,before.marked);assert.deepEqual(after.statuses['Eiken3:1:fixture:保持'],before.statuses['Eiken3:1:fixture:保持']);assert.equal(after.daily.questionCount,40+answers);
 await page.reload();await page.locator('.adventure-primary').waitFor();const saved=await page.evaluate(()=>({defeats:JSON.parse(localStorage.getItem('etyping_defeated_monsters')),marked:JSON.parse(localStorage.getItem('etyping_marked_question_keys_by_scope')),daily:JSON.parse(localStorage.getItem('etyping_daily_progress'))}));assert.deepEqual(saved.defeats,after.defeats);assert.deepEqual(saved.marked,before.marked);assert.deepEqual(saved.daily,after.daily);assert.deepEqual(errors,[]);
 report.push({course,level,width,guide,identity,english,seen:[...seen],answers,recordsRetained:true,layout});console.log('PASS actual bilingual battle',course,level,width,guide?'guide':'challenge');await ctx.close();
}fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');}finally{await close();}
process.exit(0);
