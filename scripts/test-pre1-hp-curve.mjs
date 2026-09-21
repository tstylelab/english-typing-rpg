import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const region = app.slice(app.indexOf('const DEFAULT_BATTLE_QUESTION_LIMIT'), app.indexOf('const getBattleStageIndices'));
const ctx = { DIFFICULTY_HP_MULTIPLIERS: { Eiken5: 1, Eiken4: 1, EikenPre1Part1: 1.35, EikenPre1Part2: 1.35 }, getBattleDamageMultiplier: () => 1 };
vm.runInNewContext(ts.transpile(region + '\nglobalThis.tune=getBattleTuning;', { target: ts.ScriptTarget.ES2022 }), ctx);
const expected = [500,600,700,800,900,980,1050,1120,1180,1240,1300,1360,1420,1480,1540,1600,1660,1720,1780];
const previous = [420,580,740,900,1040,1200,1260,1267,1273,1280,1287,1293,1300,1307,1313,1320,1327,1333,1340];
for (const course of ['EikenPre1Part1','EikenPre1Part2']) {
for (const input of ['voice-only','text-only']) {
  expected.forEach((hp, i) => {
    const result = ctx.tune(course,1,'challenge',input,i,previous[i],0);
    assert.equal(result.monsterHp,hp);
    assert.equal(result.maxQuestions,10);
    for (const difficulty of ['Eiken5','Eiken4']) {
      assert.equal(ctx.tune(difficulty,1,'challenge',input,i,previous[i],0).monsterHp,Math.round(previous[i]*ctx.DIFFICULTY_HP_MULTIPLIERS[difficulty]));
    }
    for (const level of [2,3]) assert.equal(ctx.tune(course,level,'challenge',input,i,2000,0).monsterHp,2700);
  });
  [3618,5427,7236,9045].forEach((hp,i) => assert.equal(ctx.tune(course,1,'challenge',input,19+i,1340,i+1).monsterHp,hp));
}
for (const mode of ['guide','challenge']) {
  expected.forEach((_,i) => assert.equal(ctx.tune(course,1,mode,'voice-text',i,230,0).monsterHp,311));
}
}
console.log('PASS: all 19 HP values, both battle modes, unchanged bosses, training, other grades and levels.');
