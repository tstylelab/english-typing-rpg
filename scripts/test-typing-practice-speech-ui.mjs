import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const cleanup=await trackTestBrowser(browser);
const url=process.env.TEST_URL || 'http://127.0.0.1:5178';
const steps=['f','j','a','s','d','k','l','q','w','e','z','x','c','cat','dog','sun'];
async function setup(width=1366,mode='normal') {
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
 page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({mode})=>{
  window.speechLog=[];window.speechCurrent=null;window.speechLate=[];
  const synth={paused:false,getVoices:()=>[],addEventListener(){},removeEventListener(){},resume(){},
   cancel(){const u=window.speechCurrent;window.speechCurrent=null;if(u){window.speechLate.push(u.onend);u.onerror?.({error:'canceled'});}},
   speak(u){window.speechLog.push(u);window.speechCurrent=u;if(mode==='throw')throw Error('speech failed');}};
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:synth});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:mode==='unsupported'?undefined:class{constructor(text){this.text=text;}}});
  window.finishSpeech=()=>{const u=window.speechCurrent;window.speechCurrent=null;u?.onend?.();};
  window.failSpeech=()=>{const u=window.speechCurrent;window.speechCurrent=null;u?.onerror?.({error:'not-allowed'});};
 },{mode});
 await page.goto(url);
 return {context,page,errors};
}
const words=page=>page.evaluate(()=>window.speechLog.map(u=>u.text));
const letterButton=(page,letter)=>page.getByRole('button',{name:letter.toUpperCase()+'のキー',exact:true});
async function start(page,dialog=false){
 if(dialog){await page.getByRole('button',{name:/タイピングに慣れていない方へ/}).click();await page.getByRole('button',{name:/はじめてキーボードを使う/}).click();}
 else await page.getByRole('button',{name:'はじめてのタイピング練習',exact:true}).click();
 await page.getByRole('textbox',{name:'typing practice input'}).waitFor({state:'attached'});
}
async function cue(page,letter){await page.waitForFunction(letter=>document.querySelector('.guided-keyboard [aria-current="true"]')?.getAttribute('aria-label')===letter+'のキー',letter.toUpperCase());}
try {
 for(const width of [1366,390]) {
  const {context,page,errors}=await setup(width);await start(page,width===390);
  await cue(page,'f');assert.deepEqual(await words(page),['F'],'Speak initial prompt once');
  assert.equal(await page.evaluate(()=>window.speechCurrent?.text),'F','Screen entry must not cancel the first letter');
  await letterButton(page,'f').click();assert.deepEqual(await words(page),['F','F']);
  assert.equal(await letterButton(page,'j').isDisabled(),true);
  await page.keyboard.press('j');assert.deepEqual(await words(page),['F','F'],'Repeated input is ignored while answer is spoken');
  assert.equal(await page.getByRole('textbox',{name:'typing practice input'}).inputValue(),'f');
  await page.evaluate(()=>window.finishSpeech());await cue(page,'j');assert.deepEqual(await words(page),['F','F','J']);
  const count=(await words(page)).length;await letterButton(page,'x').click();assert.equal((await words(page)).at(-1),'X');
  assert.equal((await words(page)).length,count+1,'Wrong answer does not immediately speak the next prompt');
  await page.evaluate(()=>window.finishSpeech());await cue(page,'j');assert.equal((await words(page)).at(-1),'J');
  assert.ok((await page.getByText(/まちがい 1 回/).innerText()).includes('1'));
  await page.keyboard.press('j');assert.equal((await words(page)).at(-1),'J');await page.evaluate(()=>window.finishSpeech());await cue(page,'a');assert.equal((await words(page)).at(-1),'A');
  for(const [index,target]of steps.entries()) {
   if(index<2)continue;
   for(const [i,letter]of [...target].entries()) {
    await cue(page,letter);const before=(await words(page)).length;
    await letterButton(page,letter).click();assert.equal((await words(page)).at(-1),letter.toUpperCase());
    assert.equal((await words(page)).length,before+1);
    assert.equal(await letterButton(page,letter).isDisabled(),true);
    await page.evaluate(()=>window.finishSpeech());
    const next=i+1<target.length?target[i+1]:steps[index+1]?.[0];
    if(next){await cue(page,next);assert.equal((await words(page)).at(-1),next.toUpperCase());}
    else {await page.getByText('練習クリア！',{exact:true}).waitFor();assert.equal((await words(page)).length,before+1,'No phantom prompt after final answer');}
   }
  }
  assert.deepEqual(errors,[]);await context.close();console.log('PASS',width,'prompt → answer → next letter, physical/touch input, mistakes, all 16 steps');
 }
 const exit=await setup();await start(exit.page);await letterButton(exit.page,'f').click();
 const oldEnd=await exit.page.evaluateHandle(()=>window.speechCurrent.onend);
 await exit.page.getByRole('button',{name:'やめる',exact:true}).click();await exit.page.evaluate(end=>end(),oldEnd);
 assert.deepEqual(await words(exit.page),['F','F']);await start(exit.page);await cue(exit.page,'f');
 await exit.page.evaluate(end=>end(),oldEnd);assert.equal(await exit.page.getByRole('textbox',{name:'typing practice input'}).inputValue(),'');
 assert.deepEqual(await words(exit.page),['F','F','F'],'Late completion must not advance a restarted session');assert.deepEqual(exit.errors,[]);await exit.context.close();
 console.log('PASS leave/restart cancels speech and ignores old completion');
 const failed=await setup();await start(failed.page);await letterButton(failed.page,'f').click();
 const duplicate=await failed.page.evaluateHandle(()=>window.speechCurrent.onend);await failed.page.evaluate(()=>window.failSpeech());await cue(failed.page,'j');
 await failed.page.evaluate(end=>{end();end();},duplicate);assert.deepEqual(await words(failed.page),['F','F','J']);
 assert.equal(await letterButton(failed.page,'j').isDisabled(),false);assert.deepEqual(failed.errors,[]);await failed.context.close();console.log('PASS speech error unlocks practice and duplicate callbacks do not skip questions');
 const stalled=await setup();await stalled.page.clock.install();await start(stalled.page);await letterButton(stalled.page,'f').click();
 await stalled.page.clock.fastForward(11000);await cue(stalled.page,'j');assert.equal(await letterButton(stalled.page,'j').isDisabled(),false);assert.deepEqual(stalled.errors,[]);await stalled.context.close();console.log('PASS missing speech event has a bounded fallback');
 for(const mode of ['unsupported','throw']){const x=await setup(390,mode);await start(x.page);await letterButton(x.page,'f').click();await cue(x.page,'j');assert.equal(await letterButton(x.page,'j').isDisabled(),false);assert.deepEqual(x.errors,[]);await x.context.close();console.log('PASS',mode,'speech still allows practice');}
}finally{await cleanup();}
process.exit(0);
