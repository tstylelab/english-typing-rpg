import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadBattleTuning } from './lib/load-battle-tuning.mjs';

// The release immediately before the approved translation-only HP reduction.
const baselineRevision = 'd87b37a';
const source = readFileSync('src/App.tsx', 'utf8').replace(/\r\n/g, '\n');
const baseline = execFileSync('git', ['show', `${baselineRevision}:src/App.tsx`], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
const current = loadBattleTuning(source);
const previous = loadBattleTuning(baseline);
let reduced = 0;
let unchanged = 0;
const expectedHp = hp => Math.max(1, Math.round(hp * 0.92));

for (const course of current.courses) for (const level of [1, 2, 3])
for (const mode of ['guide', 'challenge', 'weakness']) for (const input of ['voice-text', 'voice-only', 'text-only'])
for (let index = 0; index < 23; index++) for (const baseHp of [1, 230, 1340, 4900]) {
  const args = [course, level, mode, input, index, baseHp, index < 19 ? 0 : index - 18];
  const before = previous.tune(...args);
  const after = current.tune(...args);
  const expected = { ...before, monsterHp: input === 'text-only' ? expectedHp(before.monsterHp) : before.monsterHp };
  assert.equal(JSON.stringify(after), JSON.stringify(expected), JSON.stringify(args));
  // Re-entering a stage must not reduce its HP a second time.
  assert.equal(JSON.stringify(current.tune(...args)), JSON.stringify(after));
  if (input === 'text-only') reduced++;
  else unchanged++;
}

assert.equal(JSON.stringify(current.roster), JSON.stringify(previous.roster), 'Monster IDs and base HP must be preserved');
const answerProcessing = app => app.slice(app.indexOf('const handleCorrectAnswer ='), app.indexOf('const handleBattleInputValue', app.indexOf('const handleCorrectAnswer =')));
assert.ok(answerProcessing(source).length > 1000);
assert.equal(answerProcessing(source), answerProcessing(baseline), 'Typing penalties, damage and learning processing must be preserved');
// Battle start, the home-page enemy and the bestiary use the same tuning result.
for (const route of ['const battleTuning = getBattleTuning(', 'return getBattleTuning(bookDifficulty, bookLevel', 'const nextBattleHp = nextBattleMonster\n      ? getBattleTuning(']) {
  assert.ok(source.includes(route), `Missing shared HP route: ${route}`);
}

const rows = [];
for (const course of current.courses) for (const level of [1, 2, 3]) {
  const list = current.roster[level].challenge;
  const stages = list.map((monster, index) => {
    const boss = current.boss('challenge', 'text-only', index, list.length);
    const args = [course, level, 'challenge', 'text-only', index, monster.baseHp, boss];
    const before = previous.tune(...args).monsterHp;
    const after = current.tune(...args).monsterHp;
    assert.equal(after, expectedHp(before));
    return { stage: index + 1, monsterId: monster.id, bossStage: boss, before, after };
  });
  assert.equal(stages.length, 23);
  for (const boss of [0, 1, 2, 3, 4]) assert.ok(stages.some(stage => stage.bossStage === boss));
  const average = key => stages.reduce((sum, stage) => sum + stage[key], 0) / stages.length;
  rows.push({ course, level, averageHpBefore: average('before'), averageHpAfter: average('after'), stages });
}

if (process.argv.includes('--write-report')) {
  writeFileSync('docs/translation-battle-hp-easing-2026-10-08.json', JSON.stringify({
    baselineRevision, reductionPercent: 8, rounding: 'Round to nearest integer, minimum HP 1',
    scope: 'All courses and levels using text-only input, including reviews and all boss stages',
    reducedCases: reduced, unchangedCases: unchanged, rows,
  }, null, 2) + '\n');
}
console.log(`PASS: ${reduced} translation HP cases, ${unchanged} unchanged cases; all ${rows.length * 23} actual translation stages checked; damage, question limits, IDs and repeated starts preserved.`);
