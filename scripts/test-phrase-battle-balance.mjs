import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';

const app = fs.readFileSync('src/App.tsx', 'utf8');
const baseline = execFileSync('git', ['show', '964c7f9:src/App.tsx'], { encoding: 'utf8' });
function evaluate(source) {
  const file = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = ['DIFFICULTY_HP_MULTIPLIERS', 'GUIDE_DAMAGE_MULTIPLIER', 'LISTENING_TRAINING_DAMAGE_MULTIPLIER', 'getBattleDamageMultiplier'];
  const declarations = file.statements.filter(s => ts.isVariableStatement(s) && s.declarationList.declarations.some(d => names.includes(d.name.getText(file)))).map(s => s.getText(file)).join('\n');
  const region = source.slice(source.indexOf('const DEFAULT_BATTLE_QUESTION_LIMIT'), source.indexOf('const getBattleStageIndices'));
  const context = { ...load('src/data/grade3Balance.ts'), ...load('src/data/pre2Balance.ts'), ...load('src/data/grade2Balance.ts') };
  vm.runInNewContext(ts.transpile(declarations + '\n' + region + '\nglobalThis.tune=getBattleTuning;', { target: ts.ScriptTarget.ES2022 }), context);
  return context.tune;
}
const current = evaluate(app), previous = evaluate(baseline);
const courses = ['Eiken5','Eiken4','Eiken3','EikenPre2','Eiken2','EikenPre1Part1','EikenPre1Part2','Eiken1Part1','Eiken1Part2','Conversation'];
let scoped = 0, unchanged = 0;
for (const course of courses) for (const level of [1,2,3]) for (const mode of ['guide','challenge','weakness']) for (const input of ['voice-text','voice-only','text-only']) for (let index=0; index<23; index++) {
  const boss = index<19 ? 0 : index-18;
  for (const base of [230,1340,2960,4900]) {
    const args = [course,level,mode,input,index,base,boss];
    const before = previous(...args), after = current(...args);
    if (course.startsWith('Eiken') && course!=='Eiken5' && level===2 && mode!=='weakness') {
      assert.equal(after.maxQuestions, [8,16,24,32,40][boss]);
      const proportionalHp = Math.max(1,Math.round(before.monsterHp*after.maxQuestions/before.maxQuestions));
      assert.equal(after.monsterHp, Math.max(1,Math.round(proportionalHp*0.88)), JSON.stringify(args));
      assert.equal(after.damageMultiplier,before.damageMultiplier);
      scoped++;
    } else if (course.startsWith('Eiken') && level===2) {
      assert.equal(after.monsterHp, Math.max(1,Math.round(before.monsterHp*0.88)), JSON.stringify(args));
      assert.equal(after.maxQuestions,before.maxQuestions);
      assert.equal(after.damageMultiplier,before.damageMultiplier);
      scoped++;
    } else {
      assert.equal(JSON.stringify(after),JSON.stringify(before),JSON.stringify(args));
      unchanged++;
    }
  }
}
// The battle start, next-enemy preview and bestiary share this same tuning function.
assert.ok(app.includes('const battleTuning = getBattleTuning('));
assert.ok(app.includes('return getBattleTuning(bookDifficulty, bookLevel'));
console.log(`PASS: ${scoped} Level 2 HP/limit cases; ${unchanged} unchanged cases (Levels 1/3 and Conversation).`);
