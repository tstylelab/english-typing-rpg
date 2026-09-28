import assert from 'node:assert/strict';
import {load} from './lib/load-typescript-data.mjs';
const {grammarGuides}=load('src/data/grammarGuides.ts');
const {buildGrammarQuestion,GRAMMAR_AI_DESTINATIONS}=load('src/grammarAiPrompt.ts');
for (const {cards,grade} of Object.values(grammarGuides)) {
  for (const card of cards) {
    const text=buildGrammarQuestion(grade,card);
    for (const expected of [`英検${grade}`,card.title,card.pattern,card.tip,card.more,...card.examples.flat()])
      assert.ok(text.includes(expected),card.id+': '+expected);
    assert.ok(text.includes('確認問題を1問') && text.includes('答えはまだ書かず'));
    assert.ok(text.includes(`英検${grade}に挑戦する学習者`));
    assert.ok(text.includes('年齢や学年は決めつけない'));
    assert.ok(!text.includes('小学生にも分かる'));
    assert.ok(text.length<3000,'Bounded single-card prompt: '+card.id);
    assert.ok(!text.includes('ゲームで出た文'));
    assert.ok(buildGrammarQuestion(grade,card,'Example from result.').includes('ゲームで出た文：Example from result.'));
  }
}
assert.deepEqual(Object.values(GRAMMAR_AI_DESTINATIONS),['https://chatgpt.com/','https://gemini.google.com/app']);
// Future guides use their supplied grade, without silently inheriting a younger audience.
for (const grade of ['3級','準2級','2級','準1級','1級']) {
  const text=buildGrammarQuestion(grade,grammarGuides.Eiken4.cards[0]);
  assert.ok(text.startsWith(`英検${grade}を学んでいます。`));
  assert.ok(text.includes(`英検${grade}に挑戦する学習者`));
  assert.ok(!text.includes('英検4級') && !text.includes('小学生'));
}
console.log('PASS: 65 single-card prompts, grade/examples/compare context, short explanation and interactive check; no history dependency');
