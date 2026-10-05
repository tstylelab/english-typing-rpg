import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadBattleTuning } from './lib/load-battle-tuning.mjs';

const source = readFileSync('src/App.tsx','utf8').replace(/\r\n/g,'\n');
const baseline = execFileSync('git',['show','001078b:src/App.tsx'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
const current = loadBattleTuning(source), previous = loadBattleTuning(baseline);
const courses = current.courses;
let eased = 0, unchanged = 0;
for (const course of courses) for (const level of [1,2,3])
for (const mode of ['guide','challenge','weakness']) for (const input of ['voice-text','voice-only','text-only'])
for (let index=0; index<23; index++) for (const base of [1,230,1340,4900]) {
  const args=[course,level,mode,input,index,base,index<19?0:index-18];
  const before=previous.tune(...args), after=current.tune(...args);
  if (course.startsWith('Eiken') && level===2) {
    assert.equal(after.monsterHp,Math.max(1,Math.round(before.monsterHp*0.88)),JSON.stringify(args));
    assert.equal(after.maxQuestions,before.maxQuestions);
    assert.equal(after.damageMultiplier,before.damageMultiplier);
    eased++;
  } else {
    assert.equal(JSON.stringify(after),JSON.stringify(before),JSON.stringify(args));
    unchanged++;
  }
}
const damageBody = app => app.slice(app.indexOf('const handleCorrectAnswer ='), app.indexOf('const handleBattleInputValue',app.indexOf('const handleCorrectAnswer =')));
assert.ok(damageBody(source).length>1000);
assert.equal(damageBody(source),damageBody(baseline),'Correct-answer, miss and learning processing must stay unchanged');
assert.equal(JSON.stringify(current.roster),JSON.stringify(previous.roster),'IDs, roster and base HP must stay unchanged');
for(const use of ['const battleTuning = getBattleTuning(', 'return getBattleTuning(bookDifficulty, bookLevel', 'const nextBattleHp = nextBattleMonster']) assert.ok(source.includes(use));
const hpFor=(model,course,list,mode,input,index)=>{
  const monster=list[index];
  return model.tune(course,2,mode,input,index,monster.baseHp,model.boss(mode,input,index,list.length)).monsterHp;
};
const rows=courses.filter(course=>course.startsWith('Eiken')).map(course=>{
  const list=current.roster[2].challenge;
  return {course,training:current.roster[2].guide.map((monster,index)=>({id:monster.id,before:hpFor(previous,course,current.roster[2].guide,'guide','voice-text',index),after:hpFor(current,course,current.roster[2].guide,'guide','voice-text',index)})),
    battle:list.map((monster,index)=>({id:monster.id,before:hpFor(previous,course,list,'challenge','text-only',index),after:hpFor(current,course,list,'challenge','text-only',index)}))};
});
const report={baseline:'001078b',reductionPercent:12,scope:'All Eiken Level 2 modes and boss stages',easedCases:eased,unchangedCases:unchanged,rows};
if(process.argv.includes('--write-report')) writeFileSync('docs/level2-hp-easing-2026-10-05.json',JSON.stringify(report,null,2)+'\n');
console.log(`PASS: ${eased} eased HP cases including all bosses, ${unchanged} unchanged cases; unchanged answer processing, questions, damage multipliers and roster.`);
console.log(`Reported ${rows.length} courses with ${rows.reduce((n,r)=>n+r.training.length+r.battle.length,0)} displayed enemies, including final and hidden bosses.`);
