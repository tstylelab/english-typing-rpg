import assert from 'node:assert/strict';
import { load } from './lib/load-typescript-data.mjs';

const { getNextLongTextStudyState: advance, getAutomaticLearningLevel: level,
  getRecallMistakeAllowance, getLongTextRecallOutcome, getBattleLearningOutcome } = load('src/learningProgress.ts');
const { selectLongTextLearningQuestion: pick, spaceLongTextQuestions: space,
  createLearningQuestionBalance: balance } = load('src/learningQuestionBalance.ts');
const initial = () => ({ listeningLevel: 1, battleLevel: 1, manualOverrideLevel: null });

for (const size of [1, 2, 3, 4, 100]) {
  let state = advance(initial(), 'battle', 'success', size);
  assert.equal(level(state), 2);
  assert.equal(state.longTextSpacingRemaining, Math.min(3, size - 1));
  if (size > 1) assert.equal(level(advance(state, 'battle', 'success', size)), 2);
  state = { ...state, longTextSpacingRemaining: 0 };
  state = advance(state, 'battle', 'success', size);
  assert.equal(level(state), 3);
  assert.equal(level(advance(state, 'battle', 'struggle', size)), 3);
  const twice = advance(advance(state, 'battle', 'struggle', size), 'battle', 'struggle', size);
  assert.equal(level(twice), 2);
  assert.equal(level(advance(twice, 'battle', 'success', size)), 3);
}
const listening = advance(initial(), 'listening', 'success', 100);
assert.equal(level(listening), 2);
assert.equal(level(advance(listening, 'listening', 'success', 100)), 2);
assert.equal(level(advance(listening, 'battle', 'success', 100)), 3);
assert.equal(advance(listening, 'battle', 'neutral', 100), listening);
for (const manual of [1, 2]) {
  const saved = { ...initial(), listeningLevel: 2, battleLevel: 3, manualOverrideLevel: manual, excluded: false, longTextSuccessCount: 2, longTextSpacingRemaining: 5 };
  assert.equal(advance(saved, 'battle', 'neutral', 100), saved);
  const next = advance(saved, 'battle', 'success', 100);
  assert.equal(next.manualOverrideLevel, null);
  assert.equal(level(next), manual + 1, 'Manual review must start from its displayed level');
  assert.equal(next.excluded, false);
  assert.equal(saved.manualOverrideLevel, manual, 'No mutation of saved input');
}
assert.equal(advance({ ...initial(), manualOverrideLevel: 3 }, 'battle', 'success', 1).manualOverrideLevel, 3);
assert.equal(getRecallMistakeAllowance(20), 5);
assert.equal(getLongTextRecallOutcome('a'.repeat(20), 5), 'success');
assert.equal(getLongTextRecallOutcome('a'.repeat(20), 6), 'struggle');
for (let letters = 0; letters <= 300; letters++) {
  const previous = Math.max(2, Math.ceil(letters * 0.20));
  const proposed = Math.max(4, Math.ceil(letters * 0.30));
  const allowed = getRecallMistakeAllowance(letters);
  assert.equal(allowed, Math.ceil((previous + proposed) / 2));
  assert.equal(getLongTextRecallOutcome('a'.repeat(letters), allowed), 'success');
  assert.equal(getLongTextRecallOutcome('a'.repeat(letters), allowed + 1), 'struggle');
}
assert.equal(getBattleLearningOutcome(1, 1, 100), 'struggle', 'Level 1 is unchanged');
// An old five-question countdown must also adapt when only one item remains.
assert.equal(level(advance({ ...initial(), battleLevel: 2, longTextSpacingRemaining: 5 }, 'battle', 'success', 1)), 3);

// Simulate complete courses with a worst-case default chooser, mixed existing progress,
// the real countdown and the recent-question filter. All items must finish in bounded time.
for (const size of [1, 2, 3, 7, 100, 723]) {
  for (const source of ['battle', 'listening']) {
    const questions = Array.from({ length: size }, (_, id) => ({ id: String(id), status: initial() }));
    if (size > 3) questions[0].status.battleLevel = 3;
    const target = source === 'battle' ? 3 : 2;
    const state = balance(); const recent = []; const attempts = new Map();
    let count = 0;
    while (questions.some(q => level(q.status) < target) && count < size * 6 + 10) {
      const eligible = space(questions, recent, q => q.id, 3);
      const q = pick({ state, playableQuestions: questions, eligibleQuestions: eligible,
        getKey: q => q.id, getLevel: q => level(q.status), targetLevel: target,
        isReady: q => !q.status.longTextSpacingRemaining, random: () => 0,
        chooseDefault: () => eligible[0] });
      assert.ok(eligible.includes(q));
      if (size > 3) assert.ok(!recent.slice(-3).includes(q.id));
      for (const other of questions) if (other !== q) other.status.longTextSpacingRemaining = Math.max(0, Math.min(3, other.status.longTextSpacingRemaining ?? 0) - 1);
      q.status = advance(q.status, source, getLongTextRecallOutcome('remember this phrase', 2), size);
      recent.push(q.id); attempts.set(q.id, (attempts.get(q.id) ?? 0) + 1); count++;
    }
    assert.ok(questions.every(q => level(q.status) >= target), `${source} size ${size} did not finish in ${count} answers`);
    console.log(`PASS ${source}: ${size} questions finish in ${count} answers with light corrections`);
  }
}
// Excluded/curriculum-locked items cannot enter the selector; default reviews aren't
// consumed on forced progress slots. Listening doesn't repeatedly force caution items.
let calls = 0; const state = balance(); const q = { id: 'allowed' };
for (let i = 0; i < 10; i++) assert.equal(pick({ state, playableQuestions: [q], eligibleQuestions: [q],
  getKey: q => q.id, getLevel: () => 1, isReady: () => false, targetLevel: 3,
  chooseDefault: () => { calls++; return q; } }), q);
assert.equal(calls, 2);
calls = 0;
pick({ state: balance(), playableQuestions: [q], eligibleQuestions: [q], getKey: q => q.id,
  getLevel: () => 2, isReady: () => true, targetLevel: 2, chooseDefault: () => { calls++; return q; } });
assert.equal(calls, 1);
console.log('PASS: progression, manual review, hint neutrality, existing data, two-excess demotion, finite selection and listening cap.');
