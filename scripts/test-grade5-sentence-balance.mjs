import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';
const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const before = execFileSync('git', ['show', '24d178f:src/App.tsx'], { encoding: 'utf8' });
const { QUESTIONS } = load('src/data/questions.ts');
function evaluate(source) {
  const file = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = ['DIFFICULTY_HP_MULTIPLIERS', 'GUIDE_DAMAGE_MULTIPLIER', 'LISTENING_TRAINING_DAMAGE_MULTIPLIER', 'getBattleDamageMultiplier', 'getSpeedMultiplier', 'getEikenLongTextGuideSpeedMultiplier', 'getEikenLongTextGuideDamageMultiplier', 'getPerfectClearDamageFloor'];
  const selected = file.statements.filter(s => ts.isVariableStatement(s) && s.declarationList.declarations.some(d => names.includes(d.name.getText(file)))).map(s => s.getText(file)).join('\n');
  const region = source.slice(source.indexOf('const DEFAULT_BATTLE_QUESTION_LIMIT'), source.indexOf('const getBattleStageIndices'));
  const damage = source.slice(source.indexOf('    const now = Date.now();', source.indexOf('const handleCorrectAnswer')), source.indexOf('    const willDefeatMonster', source.indexOf('const handleCorrectAnswer')));
  const ctx = { ...load('src/data/grade3Balance.ts'), ...load('src/data/pre2Balance.ts'), ...load('src/data/grade2Balance.ts'), Date: { now: () => 1000000 } };
  vm.runInNewContext(ts.transpile(selected + '\n' + region + '\nglobalThis.tune=getBattleTuning;globalThis.damage=(gameState,finalInput)=>{' + damage + ';return finalDamage;};', { target: ts.ScriptTarget.ES2022 }), ctx);
  return ctx;
}
const current = evaluate(app), previous = evaluate(before);
const hp = [600,650,700,730,760,790,820,850,880,900,920,930,940,950,960,970,980,990,1000,1650,2000,2350,2680];
const state = (course, level, mode, input, stage, length, speed, misses, maxHp) => ({ selectedDifficulty: course, selectedLevel: level, mode, inputMode: input, bossStage: stage, missCount: misses, startTime: 1000000 - length / speed * 1000, maxMonsterHp: maxHp, maxQuestions: stage ? [0,10,12,14,16][stage] : 6 });
let checks = 0;
for (const input of ['text-only', 'voice-only']) for (let i=0;i<23;i++) {
  const boss = i < 19 ? 0 : i - 18;
  const tuning = current.tune('Eiken5',3,'challenge',input,i,4900,boss);
  assert.equal(tuning.monsterHp,hp[i]);
  assert.equal(tuning.maxQuestions,boss ? [0,10,12,14,16][boss] : 6);
  for (const q of QUESTIONS.Eiken5[3]) for (const speed of [.25,.5,1,2,3,4,8]) for (const misses of [0,1,2,3,4,5,20]) {
    const s = state('Eiken5',3,'challenge',input,boss,q.text.length,speed,misses,hp[i]);
    const actual = current.damage(s,q.text);
    const expected = Math.floor(Math.max(40,200-10*misses)*(1+Math.min(.3,Math.max(0,(speed-1)*.1)))+1e-9);
    assert.equal(actual,expected);
    if (misses<=3) assert.ok(actual*tuning.maxQuestions>=hp[i]);
    checks++;
  }
}
// Same actual damage body and HP tuning on every out-of-scope course/level/mode.
let regression = 0;
for (const course of Object.keys(QUESTIONS)) for (const level of [1,2,3]) for (const mode of ['guide','challenge','weakness']) for (const input of ['voice-text','voice-only','text-only']) {
  if(course==='Eiken5' && level===3 && mode==='challenge' && input!=='voice-text') continue;
  for(let i=0;i<23;i++) {
    const boss=i<19?0:i-18;
    assert.equal(JSON.stringify(current.tune(course,level,mode,input,i,4900,boss)),JSON.stringify(previous.tune(course,level,mode,input,i,4900,boss)));
    for(const misses of [0,1,3,8]) for(const speed of [.5,2,4]) {
      const s=state(course,level,mode,input,boss,20,speed,misses,3000);
      assert.equal(current.damage(s,'a'.repeat(20)),previous.damage(s,'a'.repeat(20)),JSON.stringify(s));
      regression++;
    }
  }
}
assert.ok(app.includes('return getBattleTuning(bookDifficulty, bookLevel'));
assert.ok(app.includes('const nextBattleHp = nextBattleMonster\n      ? getBattleTuning(') || app.includes('const nextBattleHp = nextBattleMonster\r\n      ? getBattleTuning('));
assert.equal(170*6,1020);
assert.ok(170*5<hp[18]);
console.log(`PASS ${checks} scoped damage cases; ${regression} out-of-scope damage cases; all 23 HP/limits and preview routing.`);
