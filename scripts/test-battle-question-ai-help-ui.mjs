import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { load } from './lib/load-typescript-data.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const {getConversationProgressKey}=load('src/data/conversationCurriculum.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getQuestionExample}=load('src/data/questionExamples.ts');
const {buildQuestionAiPrompt}=load('src/questionAiPrompt.ts');
const {GRAMMAR_AI_DESTINATIONS}=load('src/grammarAiPrompt.ts');
const specs=[['Eiken2',2,'英検2級','text-only'],['Eiken5',1,'英検5級','voice-text'],['Eiken1Part2',3,'英検1級②','text-only'],['Conversation',1,'英会話 はじめて','text-only']];
const configs=specs.flatMap(([course,level,label,inputMode])=>[390,820].map(width=>({course,level,label,inputMode,width})));
configs.push({course:'Eiken2',level:2,label:'英検2級',inputMode:'text-only',width:1366});
const key=(course,level,q)=>course==='Conversation'?getConversationProgressKey(q):`${course}:${level}:${q.text}:${q.translation}`;
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const cleanup=await trackTestBrowser(browser);let checked=0;
try{
 for(const config of configs){
  const {course,level,label,inputMode,width}=config,qs=QUESTIONS[course][level],candidates=qs.slice(0,2);
  const statuses=Object.fromEntries(qs.map(q=>[key(course,level,q),{practiceLevel:1,listeningLevel:1,battleLevel:1,excluded:!candidates.includes(q),updatedAt:123}]));
  const marks={[`${course}:${level}`]:[key(course,level,candidates[1])]};
  const context=await browser.newContext({viewport:{width,height:width===390?844:width===820?1180:900}});
  try{
   await context.addInitScript(({config,statuses,marks})=>{
    window.speechLog=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[],cancel(){},resume(){},addEventListener(){},removeEventListener(){},speak(u){window.speechLog.push(u.text);}}});
    Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:class{constructor(text){this.text=text;}}});
    window.copied=[];window.opened=[];window.copyDenied=false;
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{if(window.copyDenied)throw Error('denied');window.copied.push(text);}}});
    window.open=(...args)=>{window.opened.push(args);return null;};Math.random=()=>0;
    if(sessionStorage.getItem('battle-ai-fixture'))return;sessionStorage.setItem('battle-ai-fixture','1');
    const defeated=['Eiken5:1:challenge:voice-only:c1_1'];
    const data={manualQuestionStatuses:statuses,markedQuestionKeysByScope:marks,defeatedMonsterIds:defeated};
    localStorage.setItem('etyping_external_keyboard_mode','true');
    localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:config.course,level:config.level,resumeMode:'challenge',resumeInputMode:config.inputMode}));
    localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(statuses));localStorage.setItem('etyping_marked_question_keys_by_scope',JSON.stringify(marks));
    localStorage.setItem('etyping_defeated_monsters',JSON.stringify(defeated));
    localStorage.setItem('etyping_player_profiles',JSON.stringify([{id:'battle-ai',name:'検証',updatedAt:123,data},{id:'other-player',name:'保持対象',updatedAt:123,data:{maxKeystrokes:999,defeatedMonsterIds:defeated}}]));
    localStorage.setItem('etyping_active_player_id','battle-ai');
   },{config,statuses,marks});
   const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.TEST_URL||'http://127.0.0.1:5216/');
   await page.getByRole('button',{name:'教材を選ぶ',exact:true}).first().click();await page.getByRole('button',{name:'学習方法を選ぶ',exact:true}).click();
   const title=course==='Conversation'?'場面バトル':inputMode==='voice-text'?'リスニング練習':'和訳バトル';
   await page.locator('.journey-mode-start').filter({has:page.getByRole('heading',{name:title,exact:true})}).click();
   const input=page.locator('.battle-input');await input.waitFor();
   assert.equal(await page.getByRole('button',{name:/についてAIに相談/}).count(),0,'No answer disclosed before the first answer');
   if(inputMode==='text-only')await page.getByRole('button',{name:'音声をもう一度再生',exact:true}).click();
   const heard=await page.evaluate(()=>window.speechLog.at(-1));
   const q=candidates.find(q=>q.text===heard);assert.ok(q,'Fixture answer is known from the isolated speech stub');
   await input.pressSequentially(q.text,{delay:20});
   const previous=page.locator('.battle-previous-study');await previous.waitFor();
   const trigger=previous.getByRole('button',{name:`${q.text} についてAIに相談`,exact:true});await trigger.waitFor();
   if(inputMode==='text-only')await page.getByRole('button',{name:'音声をもう一度再生',exact:true}).click();
   const nextText=await page.evaluate(()=>window.speechLog.at(-1));
   const next=candidates.find(q=>q.text===nextText);assert.ok(next);
   await input.fill(next.text[0]);const typed=await input.inputValue();
   const inputBox=await input.boundingBox();
   const snapshot=()=>page.evaluate(()=>({profiles:localStorage.getItem('etyping_player_profiles'),statuses:localStorage.getItem('etyping_manual_question_statuses'),marks:localStorage.getItem('etyping_marked_question_keys_by_scope'),defeated:localStorage.getItem('etyping_defeated_monsters')}));
   await page.waitForTimeout(200);const before=await snapshot();
   await trigger.click();const dialog=page.getByRole('dialog',{name:'この問題をAIに相談',exact:true});await dialog.waitFor();
   await dialog.getByText(q.text,{exact:true}).waitFor();await dialog.getByText(getQuestionMeaning(q,course),{exact:true}).waitFor();
   const expected=buildQuestionAiPrompt({course:label,level,isConversation:course==='Conversation',text:q.text,meaning:getQuestionMeaning(q,course),example:getQuestionExample(course,level,q)||undefined,exampleJa:q.exampleJa});
   for(const destination of ['ChatGPT','Gemini','Google AIモード']){
    await dialog.getByRole('button',{name:`${destination}で相談`,exact:true}).click();
    await page.waitForFunction(n=>window.opened.length===n,Object.keys(GRAMMAR_AI_DESTINATIONS).indexOf(destination)+1);
    assert.equal(await page.evaluate(()=>window.copied.at(-1)),expected,'The previous question, not the current one, is copied');
    assert.equal(await page.evaluate(()=>window.opened.at(-1)[0]),GRAMMAR_AI_DESTINATIONS[destination]);
   }
   await page.keyboard.press('Enter');await page.keyboard.press('Shift+Enter');
   assert.equal(await input.inputValue(),typed,'Modal keyboard use does not answer or change the current input');
   assert.deepEqual(await snapshot(),before,'Opening/copying/typing in the modal does not change learning, review or other-player records');
   await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
   await page.waitForFunction(()=>{const e=document.activeElement;return e?.matches('.battle-input, .battle-question-panel');});
   assert.equal(await input.inputValue(),typed);const afterBox=await input.boundingBox();assert.equal(afterBox.height,inputBox.height);assert.equal(afterBox.width,inputBox.width,'Dialog adds no permanent size to the battle input');
   await trigger.click();await page.getByRole('dialog',{name:'この問題をAIに相談',exact:true}).waitFor();
   await page.evaluate(()=>window.copyDenied=true);await page.getByRole('button',{name:'相談文をコピー',exact:true}).click();
   const fallback=page.getByRole('textbox',{name:'この問題の相談文',exact:true});await fallback.waitFor();assert.equal(await fallback.inputValue(),expected);
   await page.getByRole('button',{name:'相談を閉じる',exact:true}).click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   assert.deepEqual(await snapshot(),before);
   await input.fill('');await input.pressSequentially(next.text,{delay:20});
   const nextTrigger=previous.getByRole('button',{name:`${next.text} についてAIに相談`,exact:true});await nextTrigger.waitFor();
   await nextTrigger.click();await page.getByRole('dialog',{name:'この問題をAIに相談',exact:true}).getByText(next.text,{exact:true}).waitFor();
   await page.getByRole('button',{name:'相談を閉じる',exact:true}).click();
   assert.deepEqual(errors,[]);console.log('PASS',++checked,course,level,width);
  }finally{await context.close();}
 }
}finally{await cleanup();}
console.log(`PASS: ${checked} isolated battle cases; correct previous-question context, 3 AI links, keyboard isolation, copy fallback, focus/input and record retention.`);
process.exit(0);
