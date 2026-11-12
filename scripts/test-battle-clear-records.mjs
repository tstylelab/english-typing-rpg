import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';

const records = load('src/battleClearRecords.ts');
const json = value => JSON.parse(JSON.stringify(value));
const valid = { 'Eiken2:2:challenge:text-only': 3, 'Conversation:5:challenge:voice-only': 5 };
assert.deepEqual(json(records.normalizeBattleClearCounts({ ...valid,
  'Eiken2:4:challenge:text-only': 1, 'Conversation:6:challenge:voice-only': 1,
  'Eiken2:2:guide:voice-text': 9, 'Eiken2:2:challenge:voice-text': 9,
  'Eiken3:1:challenge:text-only': -1, 'Eiken3:2:challenge:text-only': 1.5,
  'Eiken3:3:challenge:text-only': '2', 'Eiken4:1:challenge:text-only': Infinity,
  'Eiken4:2:challenge:text-only': Number.MAX_SAFE_INTEGER + 1,
})), valid);
for (const invalid of [null, [], 'bad', 2]) assert.deepEqual(json(records.normalizeBattleClearCounts(invalid)), {});
for (const [count, achieved, next] of [[0,undefined,3],[2,undefined,3],[3,3,5],[4,3,5],[5,5,10],[9,5,10],[10,10,undefined],[11,10,undefined]]) {
  assert.deepEqual(json(records.getFinalBossMilestone(count)), json({ achieved, next }));
}

// Execute the actual App victory handler, not a reimplementation of the counter.
const source = readFileSync('src/App.tsx', 'utf8');
const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = new Map();
function visit(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) declarations.set(node.name.text, node);
  ts.forEachChild(node, visit);
}
visit(ast);
const storage = new Map();
const context = {
  ...records, Number, finalBossVictoryRecordedRef: { current: false }, sessionWeakQuestionsRef: { current: null },
  finalBossClearCounts: { 'Eiken5:1:challenge:text-only': 7 },
  gameState: { selectedDifficulty: 'Eiken2', selectedLevel: 2, mode: 'challenge', inputMode: 'text-only', currentMonsterIndex: 22, totalMonstersInStage: 23, bossStage: 4 },
  STORAGE_KEYS: { finalBossClearCounts: 'new-counter-only' },
  localStorage: { setItem: (key, value) => storage.set(key, value) },
  setFinalBossClearCounts: value => { context.finalBossClearCounts = value; },
};
vm.createContext(context);
vm.runInContext(ts.transpileModule(`const ${declarations.get('recordFinalBossVictory').getText(ast)}; globalThis.record = recordFinalBossVictory;`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
assert.equal(context.record(), 1);
assert.equal(context.record(), undefined, 'Duplicate callbacks in one fight must not increment twice');
assert.equal(context.finalBossClearCounts['Eiken5:1:challenge:text-only'], 7);
context.finalBossVictoryRecordedRef.current = false; // real initBattle resets this for every new fight
assert.equal(context.record(), 2, 'Another actual victory increments again');
context.finalBossVictoryRecordedRef.current = false;
context.gameState.inputMode = 'voice-only';
assert.equal(context.record(), 1, 'Listening is counted separately');
context.finalBossVictoryRecordedRef.current = false;
context.gameState.selectedLevel = 1;
assert.equal(context.record(), 1, 'Level is counted separately');
context.finalBossVictoryRecordedRef.current = false;
context.gameState.selectedDifficulty = 'Eiken3';
assert.equal(context.record(), 1, 'Course is counted separately');
const before = JSON.stringify(context.finalBossClearCounts);
const normal = { ...context.gameState };
for (const overrides of [{ bossStage: 0 },{ bossStage: 1 },{ bossStage: 2 },{ bossStage: 3 },{ currentMonsterIndex: 21 },{ mode: 'weakness' },{ mode: 'guide' },{ inputMode: 'voice-text' },{ focusedBattle: { remaining: [] } }]) {
  context.finalBossVictoryRecordedRef.current = false;
  context.gameState = { ...normal, ...overrides };
  assert.equal(context.record(), undefined, JSON.stringify(overrides));
}
context.gameState = normal;
context.sessionWeakQuestionsRef.current = [];
assert.equal(context.record(), undefined, 'Review-only sessions are excluded');
assert.equal(JSON.stringify(context.finalBossClearCounts), before);
assert.deepEqual(json(records.normalizeBattleClearCounts(JSON.parse(storage.get('new-counter-only')))), json(context.finalBossClearCounts));
assert.equal(storage.size, 1, 'Counter handler writes no existing progress key');
const init = declarations.get('initBattle').getText(ast);
assert.match(init, /finalBossVictoryRecordedRef\.current = false/);
assert.match(init, /finalBossClearCount: undefined/);
// The counter may be invoked only after HP reaches zero, never by handleGameEnd/render.
const advance = declarations.get('advanceGame').getText(ast);
const branch = advance.slice(advance.indexOf('if (isMonsterDefeated)'));
assert.match(branch, /saveDefeatedMonster\(monster.id\)/);
assert.match(declarations.get('saveDefeatedMonster').getText(ast), /recordFinalBossVictory\(\)/);
assert.doesNotMatch(declarations.get('handleGameEnd').getText(ast), /recordFinalBossVictory/);
console.log('PASS: actual victory handler; one increment per fight, separate course/level/input, all earlier bosses/training/review excluded, safe normalization and 3/5/10 milestones.');
