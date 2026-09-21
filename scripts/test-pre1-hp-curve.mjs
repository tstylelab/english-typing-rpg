import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const region = app.slice(app.indexOf('const DEFAULT_BATTLE_QUESTION_LIMIT'), app.indexOf('const getBattleStageIndices'));
const ctx = { DIFFICULTY_HP_MULTIPLIERS: { Eiken5: 1, Eiken4: 1, EikenPre1Part1: 1.35, EikenPre1Part2: 1.35 }, getBattleDamageMultiplier: () => 1 };
vm.runInNewContext(ts.transpile(region + '\nglobalThis.tune=getBattleTuning;globalThis.miss=getLongTextBattleMissMultiplier;', { target: ts.ScriptTarget.ES2022 }), ctx);
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
  });
  [3618,5427,7236,9045].forEach((hp,i) => assert.equal(ctx.tune(course,1,'challenge',input,19+i,1340,i+1).monsterHp,hp));
  for (const level of [2,3]) {
    const targets = level === 2 ? [800,980,1150,1320,1480,1640,1800] : [1800,2200,2600,3000,3400,3800,4200];
    let last=0;
    for(let i=0;i<19;i++) {
      const tuned=ctx.tune(course,level,'challenge',input,i,2000,0);
      assert.ok(tuned.monsterHp>last);last=tuned.monsterHp;
      assert.equal(tuned.maxQuestions,10);
      if(i%3===0) assert.equal(tuned.monsterHp,targets[i/3]);
      assert.equal(ctx.tune(course,level,'guide','voice-text',i,2000,0).monsterHp,2700);
      assert.equal(ctx.tune(course,level,'challenge','voice-text',i,2000,0).monsterHp,2700);
    }
    for(let boss=1;boss<=4;boss++) {
      const base=level===2?2960:4900;
      const tuned=ctx.tune(course,level,'challenge',input,18+boss,base,boss);
      assert.equal(tuned.monsterHp,Math.round(base*1.35*(boss+1)));
      assert.equal(tuned.maxQuestions,(boss+1)*10);
    }
  }
}
for (const mode of ['guide','challenge']) {
  expected.forEach((_,i) => assert.equal(ctx.tune(course,1,mode,'voice-text',i,230,0).monsterHp,311));
}
}
assert.equal(ctx.miss(2,1,10),0.9);
assert.equal(ctx.miss(3,1,28),27/28);
assert.equal(ctx.miss(2,100,10),0.75);
assert.equal(ctx.miss(3,100,28),0.8);
assert.equal(ctx.miss(1,1,10),0.5);
assert.equal(ctx.miss(3,0,28),1);
assert.ok(app.includes('const missDamageMultiplier = isLengthAdjustedBattle'));
for(const level of [2,3]) for(const input of ['voice-only','text-only']) {
  const targets=level===2?[1000,1220,1430,1650,1870,2080,2300]:[1600,1970,2330,2700,3070,3430,3800];
  let last=0;
  for(let i=0;i<19;i++) {
    const t=ctx.tune('Eiken4',level,'challenge',input,i,2000,0);
    assert.ok(t.monsterHp>last);last=t.monsterHp;
    assert.equal(t.maxQuestions,10);
    if(i%3===0) assert.equal(t.monsterHp,targets[i/3]);
    for(const mode of ['guide','challenge']) assert.equal(ctx.tune('Eiken4',level,mode,'voice-text',i,2000,0).monsterHp,2000);
  }
  for(let boss=1;boss<=4;boss++) {
    const base=level===2?2960:4900;
    const t=ctx.tune('Eiken4',level,'challenge',input,18+boss,base,boss);
    assert.equal(t.monsterHp,base*(boss+1));
    assert.equal(t.maxQuestions,(boss+1)*10);
  }
}
console.log('PASS: both Pre-1 courses, three levels, battle HP curves, unchanged boss HP/counts and training, length-based miss multipliers.');
