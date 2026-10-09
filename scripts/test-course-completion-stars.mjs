import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import {loadBattleTuning} from './lib/load-battle-tuning.mjs';
import {trackTestBrowser} from './lib/test-browser-cleanup.mjs';
const source=readFileSync('src/App.tsx','utf8');
const file=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const tuning=loadBattleTuning(source);
const names=['getUniqueKey','isEndlessChallengeInputMode','getBattleStageIndices','NORMAL_TARGET_COUNT','HARD_TARGET_COUNT','HIDDEN_BOSS_COUNT','hasClearedBattleLevel'];
const declarations=file.statements.filter(s=>ts.isVariableStatement(s)&&s.declarationList.declarations.some(d=>names.includes(d.name.getText(file)))).map(s=>s.getText(file)).join('\n');
const model={MONSTERS:tuning.roster};
vm.runInNewContext(ts.transpileModule(declarations+'\nglobalThis.complete=hasClearedBattleLevel;globalThis.indices=getBattleStageIndices;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,model);
const keysFor=(course,level)=>['voice-only','text-only'].flatMap(input=>model.indices(tuning.roster[level].challenge,20,'challenge',input).map(index=>`${course}:${level}:challenge:${input}:${tuning.roster[level].challenge[index].id}`));
let missingChecks=0;
for(const course of tuning.courses)for(const level of [1,2,3]){
  const keys=keysFor(course,level);
  assert.equal(model.complete(new Set(keys),course,level),true);
  assert.equal(model.complete(new Set(),course,level),false);
  for(const omitted of keys){
    const incomplete=keys.filter(k=>k!==omitted);
    incomplete.push(omitted.replace(`${course}:`, 'Other:'),omitted.replace(`:${level}:`,':99:'),omitted.replace(':challenge:',':weakness:'),...incomplete);
    assert.equal(model.complete(new Set(incomplete),course,level),false,`Missing encounter must prevent completion: ${omitted}`);
    missingChecks++;
  }
  assert.equal(model.complete(new Set(keys.filter(k=>k.includes(':voice-only:'))),course,level),false);
}
console.log(`PASS all courses/levels, ${missingChecks} individual missing wins including final/hidden bosses, isolated scopes, duplicates and single mode`);
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio']});const cleanup=await trackTestBrowser(browser);
const output='node_modules/.tmp/course-completion';mkdirSync(output,{recursive:true});
const completeKeys=[...[1,2,3].flatMap(level=>keysFor('Eiken5',level)),...keysFor('Eiken4',1),...keysFor('Eiken4',2).filter(k=>k.includes(':voice-only:')),...keysFor('Eiken4',3).slice(0,-1)];
try{
 for(const width of [1366,390,320]){
  let baseline;
  for(const full of [false,true]){
   const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(keys=>{
    speechSynthesis.speak=()=>{};
    localStorage.setItem('etyping_last_selected_course',JSON.stringify({difficulty:'Eiken5',level:1}));
    localStorage.setItem('etyping_defeated_monsters',JSON.stringify(keys));
   },full?completeKeys:[]);
   await page.goto(process.env.TEST_URL||'http://127.0.0.1:5178');await page.getByRole('button',{name:'教材を選ぶ',exact:true}).click();
   const grades=page.locator('.course-grade-button'),levels=page.locator('.course-level-button');
   const heights=await grades.evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
   const levelHeights=await levels.evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
   if(!full){baseline={heights,levelHeights};assert.equal(await page.locator('[data-course-completion-star]').count(),0);}
   else{
    assert.deepEqual(heights,baseline.heights,'Grade stars must not increase button height');assert.deepEqual(levelHeights,baseline.levelHeights,'Level stars must not increase button height');
    assert.equal(await grades.nth(0).locator('[data-course-completion-star]').count(),1);assert.equal(await grades.nth(1).locator('[data-course-completion-star]').count(),0);
    assert.equal(await levels.locator('[data-course-completion-star]').count(),3);
    const collisions=await page.locator('[data-course-completion-star]').evaluateAll(stars=>stars.some(star=>{
      const badge=star.getBoundingClientRect(),button=star.closest('button');
      return [...button.querySelectorAll('p,svg')].filter(el=>!star.contains(el)).some(el=>{const r=el.getBoundingClientRect();return badge.left<r.right&&badge.right>r.left&&badge.top<r.bottom&&badge.bottom>r.top;});
    }));assert.equal(collisions,false,'Completion star must not overlap text or selected check');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:`${output}/complete-${width}.png`,fullPage:true});
    const saved=await page.evaluate(()=>localStorage.getItem('etyping_defeated_monsters'));
    await grades.nth(1).click();assert.equal(await levels.nth(0).locator('[data-course-completion-star]').count(),1);assert.equal(await levels.nth(1).locator('[data-course-completion-star]').count(),0);assert.equal(await levels.nth(2).locator('[data-course-completion-star]').count(),0);
    await levels.nth(2).click();assert.equal(await grades.nth(1).locator('[data-course-completion-star]').count(),0);
    assert.equal(await page.evaluate(()=>localStorage.getItem('etyping_defeated_monsters')),saved,'Viewing stars must not modify defeats');
    await page.getByRole('button',{name:'この教材で始める',exact:true}).click();await page.getByText('Translation Battle / 和訳バトル',{exact:true}).waitFor();
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(`PASS ${width}px: saved progress, all/partial grades and levels, single-mode and missing hidden boss, height unchanged, no overlaps, next screen`);
 }
}finally{await cleanup();}
process.exit(0);
