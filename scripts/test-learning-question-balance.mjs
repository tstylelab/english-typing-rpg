import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const moduleSource = readFileSync(new URL('../src/learningQuestionBalance.ts', import.meta.url), 'utf8');
const moduleContext = { exports: {} };
vm.runInNewContext(ts.transpile(moduleSource, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }), moduleContext);
const { createLearningQuestionBalance, selectLearningBalancedQuestion } = moduleContext.exports;
const makeQuestions = (total, mastered) => Array.from({ length: total }, (_, i) => ({ text: String(i), level: i < mastered ? 3 : 2 }));
const run = (questions, count, overrides = {}) => {
  const state = createLearningQuestionBalance();
  const output = [];
  let calls = 0;
  for (let i = 0; i < count; i++) {
    output.push(selectLearningBalancedQuestion({
      state, playableQuestions: questions, eligibleQuestions: questions,
      getKey: q => q.text, getLevel: q => q.level, currentKey: output.at(-1)?.text,
      chooseDefault: () => { calls++; return questions[0]; }, random: () => 0.5,
      ...overrides,
    }));
  }
  return { output, state, calls };
};

// Worst-case random source: it ALWAYS chooses a mastered word.
for (const [total, mastered] of [[100, 80], [500, 495], [500, 499], [5, 4]]) {
  const { output } = run(makeQuestions(total, mastered), 1000);
  for (let i = 0; i < output.length; i += 10) {
    const chunk = output.slice(i, i + 10);
    assert.equal(chunk.filter(q => q.level < 3).length, 3);
    for (const [length, minimum] of [[3, 1], [6, 2], [9, 3]]) {
      assert.ok(chunk.slice(0, length).filter(q => q.level < 3).length >= minimum);
    }
  }
}
for (const [total, mastered] of [[100, 79], [100, 0], [100, 100], [723, 578]]) {
  assert.equal(run(makeQuestions(total, mastered), 100).calls, 100, 'Default picker must be unchanged below 80% or after completion');
}
assert.equal(run(makeQuestions(723, 579), 10).calls, 7);
const rotating = run(makeQuestions(500, 495), 100).output.filter(q => q.level < 3);
for (let i = 0; i < rotating.length; i += 5) assert.equal(new Set(rotating.slice(i, i + 5).map(q => q.text)).size, 5);

const natural = makeQuestions(100, 80);
const naturalResult = run(natural, 10, { chooseDefault: () => natural[80] });
assert.equal(naturalResult.output.every(q => q === natural[80]), true, 'Natural unfinished questions satisfy the guarantee');
const eligible = natural.slice(0, 81);
assert.equal(run(natural, 30, { eligibleQuestions: eligible }).output.every(q => eligible.includes(q)), true);
assert.equal(run(natural, 10, { eligibleQuestions: natural.slice(0, 80) }).calls, 10, 'Do not cross curriculum boundaries');

// Promotions, demotions, exclusions and empty courses are reevaluated each draw.
const dynamic = makeQuestions(5, 4);
const state = createLearningQuestionBalance();
run(dynamic, 3, { state });
dynamic[4].level = 3;
assert.equal(run(dynamic, 10, { state }).calls, 10);
assert.equal(state.position, 0);
dynamic[4].level = 1;
assert.equal(run(dynamic, 10, { state }).calls, 7);
const afterExclusion = dynamic.slice(0, 4);
assert.equal(run(afterExclusion, 10, { state }).calls, 10);
assert.equal(run([], 1, { chooseDefault: () => null }).output[0], null);

// Exercise the actual App adapter to catch review queue consumption, stale React
// learning state, player/mode scope leakage and curriculum regressions.
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const adapter = app.slice(app.indexOf('  const getNextBattleQuestion = ('), app.indexOf('  const handleSkip = ('));
const context = {
  createLearningQuestionBalance, selectLearningBalancedQuestion,
  learningQuestionBalanceRef: { current: {} }, activeReviewEntryRef: { current: null },
  activePlayerId: 'player-a', questions: makeQuestions(500, 495), reviews: [],
  getScopedPlayableQuestions() { return context.questions; },
  getEligibleBattleQuestions(_diff, _level, _stage, _mode, list) { return list; },
  getQuestionStatusKey(diff, level, q) { return `${diff}:${level}:${q.text}`; },
  getManualQuestionStatus(_diff, _level, q) { return q; },
  getEffectiveLearningLevel(q) { return q.level; },
  canServeReviewQuestion() { return true; },
  getDueReviewQuestion() { return context.reviews.shift() ?? null; },
  getPlayableRandomQuestion() { return context.questions[0]; },
};
vm.runInNewContext(ts.transpile(adapter + '\nglobalThis.pick = getNextBattleQuestion;', { target: ts.ScriptTarget.ES2022 }), context);
const pick = (current = null, updated, input = 'text-only') => context.pick('Eiken5', 1, current, 0, 'challenge', input, updated);
pick(); pick();
const review = { question: context.questions[0] };
context.reviews.push(review);
assert.ok(pick().level < 3);
assert.equal(context.reviews.length, 1, 'A forced question must not consume a deferred review');
assert.equal(context.activeReviewEntryRef.current, null);
assert.equal(pick(), review.question);
assert.equal(context.activeReviewEntryRef.current, review);
context.activePlayerId = 'player-b';
assert.equal(pick().level, 3, 'Another player starts a separate quota');
assert.equal(pick(null, undefined, 'voice-only').level, 3, 'Another input mode starts a separate quota');

context.questions = makeQuestions(5, 4);
context.learningQuestionBalanceRef.current = {};
pick(); pick();
assert.equal(pick(context.questions[4], 3).level, 3, 'Just-promoted final word disables guarantee before React renders');
context.questions = makeQuestions(5, 5);
context.learningQuestionBalanceRef.current = {};
pick(context.questions[4], 2); pick(context.questions[4], 2);
assert.equal(pick(context.questions[4], 2), context.questions[4], 'Just-demoted word becomes eligible before React renders');

// Normal retries/new monsters reset the quota, retaining unfinished word rotation.
assert.match(app, /learningBalance\.position = 0;\s+learningBalance\.unfinishedCount = 0;/);
assert.match(app, /gameState\.inputMode,\s+learningChange\?\.to,/);
console.log('PASS: 80% boundary, 3/10 minimum, spacing, rotation, natural/review questions, 1 remaining word, completion, demotion, exclusion, curriculum and player/mode isolation.');
