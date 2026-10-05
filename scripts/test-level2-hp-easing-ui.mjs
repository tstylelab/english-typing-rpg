import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {loadBattleTuning} from './lib/load-battle-tuning.mjs';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const model=loadBattleTuning(readFileSync('src/App.tsx','utf8'));
const courses=model.courses.filter(course=>course.startsWith('Eiken'));
const labels={Eiken5:'英検5級',Eiken4:'英検4級',Eiken3:'英検3級',EikenPre2:'英検準2級',Eiken2:'英検2級',EikenPre1Part1:'英検準1級①',EikenPre1Part2:'英検準1級②',Eiken1Part1:'英検1級①',Eiken1Part2:'英検1級②'};
const url=process.env.LEVEL2_HP_TEST_URL || 'http://127.0.0.1:5178';
const output=process.env.LEVEL2_HP_TEST_OUTPUT || 'design/level2-hp-local';
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const close=await trackTestBrowser(browser);
const report=[];
const hpFor=(course,mode,input,index)=>{
 const list=model.roster[2][mode];
 return model.tune(course,2,mode,input,index,list[index].baseHp,model.boss(mode,input,index,list.length)).monsterHp;
};
try {
 for(const {course,index} of [...courses.map(course=>({course,index:0})),{course:'Eiken4',index:22}]) {
  const width=index===22?390:1366;
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(12000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const defeated=model.roster[2].challenge.slice(0,index).map(m=>`${course}:2:challenge:text-only:${m.id}`);
  await page.addInitScript(({course,defeated})=>{
   if(!location.protocol.startsWith('http'))return;
   speechSynthesis.speak=()=>{};
   localStorage.setItem('etyping_external_keyboard_mode','true');
   localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:course,level:2,resumeMode:'challenge',resumeInputMode:'text-only'}));
   localStorage.setItem('etyping_defeated_monsters',JSON.stringify(defeated));
  },{course,defeated});
  await page.goto(url);
  await page.getByRole('button',{name:'図鑑',exact:true}).waitFor();
  const stored=await page.evaluate(()=>localStorage.getItem('etyping_defeated_monsters'));
  const expected=hpFor(course,'challenge','text-only',index);
  const topHp=page.getByText('HP',{exact:true}).locator('..').getByText(String(expected),{exact:true});
  await topHp.waitFor({state:'attached'});
  if(width>=1024) await page.getByRole('button',{name:'この敵に挑む',exact:true}).click();
  else {
   await page.getByRole('button',{name:'教材を選ぶ',exact:true}).click();
   await page.getByRole('button',{name:'この教材で始める',exact:true}).click();
   await page.getByRole('button',{name:/Translation Battle/}).click();
  }
  await page.locator('.battle-input').waitFor();
  await page.locator('.battle-hp').getByText(`${expected} / ${expected}`,{exact:true}).waitFor();
  await page.screenshot({path:`${output}/battle-${course}-${index}.png`});
  await page.getByRole('button',{name:'トップに戻る',exact:true}).click();
  await page.getByRole('button',{name:'図鑑',exact:true}).click();
  await page.getByRole('button',{name:labels[course],exact:true}).click();
  await page.getByRole('button',{name:'レベル 2',exact:true}).click();
  const actual=(await page.getByText(/^HP \d+$/).allTextContents()).map(t=>Number(t.slice(3)));
  const expectedBook=[...model.roster[2].guide.map((_,i)=>hpFor(course,'guide','voice-text',i)),...model.roster[2].challenge.map((_,i)=>hpFor(course,'challenge','text-only',i))];
  assert.deepEqual(actual,expectedBook,`${course} all 43 book HP values`);
  assert.equal(await page.evaluate(()=>localStorage.getItem('etyping_defeated_monsters')),stored,'Viewing, starting and leaving must preserve victories');
  assert.deepEqual(errors,[]);
  report.push({course,index,width,battleHp:expected,bookHpChecked:actual.length});
  console.log(`PASS ${course}, stage ${index+1}, HP ${expected}, book 43`);
  await page.goto('about:blank');
  await context.close();
 }
 writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2)+'\n');
}finally{
 for(const c of browser.contexts())for(const p of c.pages())await p.goto('about:blank').catch(()=>{});
 await close();
}
process.exit(0);
