import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { loadBattleTuning } from './lib/load-battle-tuning.mjs';
import { trackTestBrowser } from './lib/test-browser-cleanup.mjs';

const source=readFileSync('src/App.tsx','utf8');
const file=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=['getUniqueKey','matchesDefeatedMonster','hasClearedBothMonsterBookModes'];
const declarations=file.statements.filter(s=>ts.isVariableStatement(s)&&s.declarationList.declarations.some(d=>names.includes(d.name.getText(file)))).map(s=>s.getText(file)).join('\n');
const model={};vm.runInNewContext(ts.transpileModule(declarations+'\nglobalThis.both=hasClearedBothMonsterBookModes;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,model);
const tuning=loadBattleTuning(source);
const combinations=[['guide','voice-text'],['guide','voice-only'],['guide','text-only'],['challenge','voice-text'],['challenge','voice-only'],['challenge','text-only']];
let cases=0;
for(const course of tuning.courses)for(const level of [1,2,3])for(const zone of ['training','battle'])for(let bits=0;bits<64;bits++){
  const id='test-monster';
  const keys=combinations.flatMap(([mode,input],i)=>bits&(1<<i)?[`${course}:${level}:${mode}:${input}:${id}`]:[]);
  // Neither other scopes nor repeated wins of the same mode may create the second star.
  keys.push(...keys,`Other:${level}:challenge:voice-only:${id}`,`${course}:99:challenge:text-only:${id}`,`${course}:${level}:weakness:voice-text:${id}`);
  const expected=zone==='training'?!!(bits&1)&&!!(bits&8):!!(bits&16)&&!!(bits&32);
  assert.equal(model.both(keys,course,level,zone,id),expected);
  assert.equal(model.both(keys,course,level,zone,'another-monster'),false);
  cases++;
}
console.log(`PASS ${cases} mode combinations: both zones, all courses/levels, duplicate wins and isolated scopes`);

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});
const cleanup=await trackTestBrowser(browser);
try{
  const context=await browser.newContext({viewport:{width:1366,height:900}});
  const page=await context.newPage();page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const guide=tuning.roster[1].guide.map(m=>m.id);
  const battle=tuning.roster[1].challenge.map(m=>m.id);
  const k=(id,mode,input,course='Eiken5',level=1)=>`${course}:${level}:${mode}:${input}:${id}`;
  const keys=[
    k(guide[0],'guide','voice-text'),k(guide[1],'challenge','voice-text'),
    k(guide[2],'guide','voice-text'),k(guide[2],'challenge','voice-text'),
    k(guide[3],'guide','voice-text'),k(guide[3],'guide','voice-text'),
    k(guide[4],'guide','voice-text'),k(guide[4],'challenge','voice-text','Eiken4'),k(guide[4],'challenge','voice-text','Eiken5',2),
    k(battle[0],'challenge','voice-only'),k(battle[1],'challenge','text-only'),
    k(battle[2],'challenge','voice-only'),k(battle[2],'challenge','text-only'),
    k(battle[3],'challenge','text-only'),k(battle[3],'challenge','text-only'),
    k(battle[4],'challenge','voice-only'),k(battle[4],'challenge','text-only','Eiken4'),k(battle[4],'challenge','text-only','Eiken5',2),
    ...battle.slice(-4).flatMap(id=>[k(id,'challenge','voice-only'),k(id,'challenge','text-only')]),
  ];
  await page.addInitScript(keys=>{
    speechSynthesis.speak=()=>{};
    localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'Eiken5',level:1}));
    localStorage.setItem('etyping_defeated_monsters',JSON.stringify(keys));
  },keys);
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:5178');
  await page.getByRole('button',{name:'図鑑',exact:true}).click();
  const grids=page.locator('.monster-book-grid');
  const card=(zone,index)=>grids.nth(zone).locator(':scope > div').nth(index);
  for(const zone of [0,1]){
    for(const index of [0,1,3,4])assert.equal(await card(zone,index).locator('[data-monster-book-stars="1"]').count(),1);
    assert.equal(await card(zone,2).locator('[data-monster-book-stars="2"]').count(),1);
    assert.equal(await card(zone,5).locator('[data-monster-book-stars]').count(),0);
    assert.equal(await card(zone,2).locator('[data-monster-book-stars] > svg').count(),2);
    const sizes=await card(zone,2).locator('[data-monster-book-stars] > svg').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));
    assert.deepEqual(sizes,[16,24]);
  }
  for(let index=19;index<23;index++)assert.equal(await card(1,index).locator('[data-monster-book-stars="2"]').count(),1,'Final and hidden bosses also get the second star');
  const saved=await page.evaluate(()=>localStorage.getItem('etyping_defeated_monsters'));
  for(const width of [1366,390,320]){
    await page.setViewportSize({width,height:900});
    await card(0,2).scrollIntoViewIfNeeded();
    const stars=card(0,2).locator('[data-monster-book-stars]');
    assert.ok(await stars.isVisible());
    const box=await card(0,2).boundingBox(),badge=await stars.boundingBox();
    assert.ok(badge.x>=box.x&&badge.x+badge.width<=box.x+box.width&&badge.y>=box.y);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await stars.evaluate(el=>el.textContent),'','No visible achievement text added');
    if(process.env.STAR_SCREENSHOT_DIR)await card(0,2).screenshot({path:`${process.env.STAR_SCREENSHOT_DIR}/monster-book-stars-${width}.png`});
  }
  // Existing enlargement remains operable and gains no achievement labels.
  await card(0,2).getByRole('button').click();
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.getByRole('dialog').locator('[data-monster-book-stars]').count(),0);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(await page.evaluate(()=>localStorage.getItem('etyping_defeated_monsters')),saved,'Viewing stars must not modify progress');
  assert.deepEqual(errors,[]);
  console.log('PASS saved progress renders 1/2 stars in both zones and all boss stages; no visible labels; 1366/390/320px; preview and progress preserved');
}finally{await cleanup();}
