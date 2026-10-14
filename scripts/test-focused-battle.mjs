import assert from 'node:assert/strict';
import { load } from './lib/load-typescript-data.mjs';
const { selectFocusedQuestions, hasQuestionHistory } = load('src/focusedBattle.ts');
const fresh = { practiceLevel: 1, listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null, excluded: false };
const questions = [
  { id: 'new', status: fresh, level: 1 },
  { id: 'seen', status: { ...fresh, presentedAt: 100 }, level: 1 },
  { id: 'legacy-success', status: { ...fresh, battleLevel: 3, manualOverrideLevel: 1 }, level: 1 },
  { id: 'caution', status: { ...fresh, listeningLevel: 2 }, level: 2 },
  { id: 'mastered', status: { ...fresh, battleLevel: 3 }, level: 3 },
  { id: 'excluded', status: { ...fresh, excluded: true }, level: 1 },
  { id: 'legacy-review', status: fresh, level: 1 },
];
const select = (kind, pool = questions) => Array.from(selectFocusedQuestions(pool, kind, q => q.status, q => q.level, q => q.id === 'legacy-review'), q => q.id);
assert.deepEqual(select('unseen'), ['new']);
assert.deepEqual(select('learning'), ['new', 'seen', 'legacy-success', 'legacy-review']);
assert.deepEqual(select('unseen', []), []);
assert.deepEqual(select('learning', [questions[4]]), []);
assert.equal(hasQuestionHistory({ ...fresh, updatedAt: 500 }), false, 'Manual edits alone do not prove an encounter');
assert.equal(hasQuestionHistory({ ...fresh, longTextPreviousExcess: true }), true, 'A legacy struggle is also an encounter');
assert.equal(hasQuestionHistory({ ...fresh, longTextLastSuccessAt: 100 }), true);
assert.equal(hasQuestionHistory({ ...fresh, longTextSuccessCount: 1 }), true);
console.log('PASS focused pools: unseen/learning distinction, exclusions, legacy evidence, empty pools');
