import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {load} from './lib/load-typescript-data.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {QUESTIONS}=load('src/data/questions.ts');
const cases=[{difficulty:'Eiken4',level:3,text:'Who is the girl in the red hat?'},
  {difficulty:'Eiken4',level:2,text:'be interested in'}];
const longWords=Object.entries(QUESTIONS).filter(([key])=>key.startsWith('Eiken')).flatMap(([difficulty,levels])=>(levels[1]||[]).filter(q=>!q.text.includes(' ')).map(q=>({difficulty,level:1,text:q.text})));
cases.push(longWords.sort((a,b)=>b.text.length-a.text.length)[0]);
const server=await chromium.launchServer({channel:'chrome',headless:true,args:['--mute-audio']});
const browser=await chromium.connect(server.wsEndpoint());
const bounded=async p=>{let timer;try{return await Promise.race([p,new Promise((_,r)=>{timer=setTimeout(()=>r(new Error('cleanup timeout')),7000);})]);}finally{clearTimeout(timer);}};
let passed=false;
try{
 for(const {difficulty,level,text} of cases){
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({difficulty,level,text,questions})=>{
   speechSynthesis.speak=()=>{};Math.random=()=>0;
   localStorage.setItem('etyping_external_keyboard_mode','true');
   localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty,level,resumeMode:'challenge',resumeInputMode:'text-only'}));
   localStorage.setItem('etyping_manual_question_statuses',JSON.stringify(Object.fromEntries(questions.map(q=>[`${difficulty}:${level}:${q.text}:${q.translation}`,{practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:q.text!==text,updatedAt:0}]))));
  },{difficulty,level,text,questions:QUESTIONS[difficulty][level]});
  await page.goto(process.env.BATTLE_TEST_URL || 'http://127.0.0.1:5178');
  await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();
  await page.locator('.battle-question-word').first().waitFor();
  const indices=await page.locator('[data-character-index]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.characterIndex)));
  assert.deepEqual(indices,Array.from({length:text.length},(_,i)=>i));
  assert.ok(!(await page.locator('.battle-screen').innerText()).includes('速度ボーナス・習得への加算なし'));
  const space=text.indexOf(' ');
  if(space>=0){
   await page.keyboard.type(text.slice(0,space));
   assert.match(await page.locator(`[data-character-index="${space}"]`).getAttribute('class'),/border-yellow-400/);
   await page.keyboard.press('Space');
   assert.match(await page.locator(`[data-character-index="${space+1}"]`).getAttribute('class'),/border-yellow-400/);
   await page.keyboard.type(text.slice(space+1,-1));
  }else await page.keyboard.type(text.slice(0,-1));
  for(const width of [1366,1024,768,390,320]){
   await page.setViewportSize({width,height:900});
   const metrics=await page.locator('.battle-question-text').evaluate(el=>({
    width:el.clientWidth,scroll:el.scrollWidth,
    words:[...el.querySelectorAll('.battle-question-word')].map(word=>{
     const rect=word.getBoundingClientRect();const letters=[...word.children].map(c=>c.getBoundingClientRect());
     return {left:rect.left,right:rect.right,ys:letters.map(r=>(r.top+r.bottom)/2),outerLeft:el.getBoundingClientRect().left,outerRight:el.getBoundingClientRect().right};
    })
   }));
   assert.ok(metrics.scroll<=metrics.width+1,`${text} fits ${width}`);
   for(const word of metrics.words){
    assert.ok(Math.max(...word.ys)-Math.min(...word.ys)<1,'Characters in each word remain on same line');
    assert.ok(word.left>=word.outerLeft-1 && word.right<=word.outerRight+1,'Whole word inside panel');
   }
   if(level===3 && [1024,390].includes(width) && process.env.SCREENSHOT_DIR) await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/battle-word-wrap-${width}.png`,fullPage:true});
  }
  await page.keyboard.type(text.slice(-1));
  const q=QUESTIONS[difficulty][level].find(q=>q.text===text);
  await page.waitForFunction(text=>document.querySelector('.battle-previous-study')?.textContent?.includes(text),text,{timeout:12000});
  assert.ok(q);assert.deepEqual(errors,[]);
  console.log('PASS',difficulty,level,text,': word wrapping, narrow display, cursor/space input, completed answer, no penalty paragraph');
  await bounded(context.close());
 }
 passed=true;
}finally{
 try{await bounded(browser.close());}catch{console.warn('Browser disconnect timeout');}
 try{await bounded(server.close());}catch{await bounded(server.kill());}
}
if(passed)process.exit(0);
