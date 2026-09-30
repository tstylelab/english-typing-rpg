import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getPhraseAnswerCue}=load('src/data/grade4PhrasePrompts.ts');
const server=await chromium.launchServer({channel:'chrome',headless:true,args:['--mute-audio']});
const browser=await chromium.connect(server.wsEndpoint());
const bounded=async p=>{let timer;try{return await Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('cleanup timeout')),7000);})]);}finally{clearTimeout(timer);}};
let passed=false;
try {
  for(const width of [1366,390]) {
    for(const text of ['on foot','go around','talk with','like to','start to','around the corner','get back','go back','take A to B','kind of']) {
      const context=await browser.newContext({viewport:{width:1366,height:900}});
      const page=await context.newPage();
      page.setDefaultTimeout(12000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(({questions,text})=>{
        speechSynthesis.speak=()=>{};Math.random=()=>0;
        localStorage.setItem('etyping_external_keyboard_mode','true');
        localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'Eiken4',level:2,resumeMode:'challenge',resumeInputMode:'text-only'}));
        localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(questions.map(q=>[`Eiken4:2:${q.text}:${q.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:q.text!==text,updatedAt:0}]))));
      },{questions:QUESTIONS.Eiken4[2],text});
      await page.goto('http://127.0.0.1:5178');
      await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();
      await page.setViewportSize({width,height:900});
      await page.locator('.battle-answer-cue').waitFor();
      const q=QUESTIONS.Eiken4[2].find(q=>q.text===text);
      assert.equal((await page.locator('.battle-translation').innerText()).trim(),getQuestionMeaning(q,'Eiken4'));
      assert.ok((await page.locator('.battle-answer-cue').innerText()).includes(getPhraseAnswerCue(text,'Eiken4',2)));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
      if(text==='go around' && process.env.SCREENSHOT_DIR) await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/grade4-phrase-cue-${width}.png`,fullPage:true});
      await page.keyboard.type(text);
      await page.waitForFunction(key=>JSON.parse(localStorage.getItem('etyping_manual_question_statuses'))[key]?.longTextSuccessCount>0,`Eiken4:2:${q.text}:${q.translation}`,{timeout:12000});
      assert.deepEqual(errors,[]);
      console.log('PASS',width,text,'meaning + cue + accepted input + preserved progress key');
      await bounded(context.close());
    }
  }
  passed=true;
} finally {
  try {await bounded(browser.close());} catch { /* Windows cleanup may time out. */ }
  try {await bounded(server.close());} catch {await bounded(server.kill());}
}
if(passed) process.exit(0);
