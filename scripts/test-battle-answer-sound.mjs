import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {load} from './lib/load-typescript-data.mjs';
const {getBattleAnswerSound}=load('src/battleAnswerSound.ts');
const {getRecallMistakeAllowance,getEnglishLetterCount}=load('src/learningProgress.ts');
const {QUESTIONS}=load('src/data/questions.ts');
const base={longText:true,text:'Thank you for inviting me today.',charsPerSec:2.4,speedMultiplier:1.14,misses:3,assisted:false,defeated:false};
assert.equal(getBattleAnswerSound(base),'critical');
assert.equal(getBattleAnswerSound({...base,charsPerSec:2.399}),'attack');
assert.equal(getBattleAnswerSound({...base,misses:100,formattingMisses:97}),'critical');
assert.equal(getBattleAnswerSound({...base,assisted:true}),'attack');
assert.equal(getBattleAnswerSound({...base,defeated:true}),null);
let cases=0;
for(const [course,levels] of Object.entries(QUESTIONS).filter(([c])=>c.startsWith('Eiken'))) {
  for(const level of [2,3]) for(const q of levels[level]) {
    const allowed=getRecallMistakeAllowance(getEnglishLetterCount(q.text));
    for(const speed of [0.5,2.399,2.4,4,20]) {
      const input={...base,text:q.text,misses:allowed,charsPerSec:speed,speedMultiplier:1.3};
      assert.equal(getBattleAnswerSound(input),speed>=2.4?'critical':'attack',`${course}/${level}/${q.text}`);
      assert.equal(getBattleAnswerSound({...input,misses:allowed+1}),'attack');
      assert.equal(getBattleAnswerSound({...input,assisted:true}),'attack');
      assert.equal(getBattleAnswerSound({...input,defeated:true}),null);
      cases++;
    }
  }
}
for(const multiplier of [1,1.3,1.8,2,3]) for(const misses of [0,1,3]) {
  assert.equal(getBattleAnswerSound({...base,longText:false,speedMultiplier:multiplier,misses}),multiplier>=2&&misses===0?'critical':'attack');
}
const app=fs.readFileSync('src/App.tsx','utf8');
const before=execFileSync('git',['show','HEAD:src/App.tsx'],{encoding:'utf8'});
const damageBody=source=>source.slice(source.indexOf('  const handleCorrectAnswer ='),source.indexOf('    const willDefeatMonster',source.indexOf('  const handleCorrectAnswer =')));
assert.equal(damageBody(app).replace(/\r\n/g,'\n'),damageBody(before).replace(/\r\n/g,'\n'),'Damage/score code is unchanged');
// Execute the actual UI sound routing with silent spies (no audio devices).
const routing=app.slice(app.indexOf('    const willDefeatMonster',app.indexOf('  const handleCorrectAnswer =')),app.indexOf('    setMonsterShake(true);',app.indexOf('  const handleCorrectAnswer =')));
for(const level of [1,2,3]) for(const assisted of [false,true]) for(const defeated of [false,true]) {
  const calls=[];
  vm.runInNewContext(ts.transpile(routing,{target:ts.ScriptTarget.ES2022}),{
    getBattleAnswerSound,EIKEN_DIFFICULTIES:['Eiken4'],gameState:{selectedDifficulty:'Eiken4',selectedLevel:level,currentQuestion:{text:base.text},missCount:1,formattingMissCount:0,monsterHp:defeated?100:1000},
    finalDamage:100,charsPerSec:4,speedMultiplier:1.3,audioHintUsedRef:{current:assisted},
    soundEngine:{playCritical:()=>calls.push('critical'),playAttack:()=>calls.push('attack')},
  });
  assert.deepEqual(calls,defeated?[]:[level!==1&&!assisted?'critical':'attack']);
}
console.log(`PASS: ${cases} long-text speed/typo/hint/defeat cases, Level 1 legacy conditions, actual sound dispatch, unchanged damage calculation.`);
