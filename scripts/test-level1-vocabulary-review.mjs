import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { load } from './lib/load-typescript-data.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getQuestionExample } = load('src/data/questionExamples.ts');
const { getQuestionSynonyms, getQuestionSynonymLabels, getQuestionSynonymHeading } = load('src/data/questionSynonyms.ts');
const { getTranslationBattlePrompt } = load('src/data/translationBattlePrompts.ts');
const { getVocabularyUsageNote } = load('src/data/vocabularyUsageNotes.ts');
const { getLevel1VocabularyReview } = load('src/data/level1VocabularyReview.ts');
const entries = JSON.parse(fs.readFileSync('src/data/level1VocabularyReview.json', 'utf8'));
assert.equal(hash(QUESTIONS), '8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1',
  'All saved questions, translations, examples and ordering remain unchanged');
assert.equal(entries.length, 453);
assert.equal(entries.filter(e => e.expressions).length, 445);
assert.equal(entries.filter(e => e.usageNote).length, 14);
assert.equal(new Set(entries.map(e => JSON.stringify([e.course, e.text, e.translation, e.exampleEn]))).size, entries.length);
const rendered = [];
for (const [course, levels] of Object.entries(QUESTIONS)) for (const [level, questions] of Object.entries(levels)) {
  for (const [index, question] of questions.entries()) {
    const before = JSON.stringify(question), clone = JSON.parse(before), n = Number(level);
    const display = q => ({
      course, level: n, index, question: plain(q), meaning: getQuestionMeaning(q, course),
      example: getQuestionExample(course, n, q), synonyms: plain(getQuestionSynonyms(course, n, q)),
      labels: plain(getQuestionSynonymLabels(course, n, q)), heading: getQuestionSynonymHeading(course, n, q),
      prompt: plain(getTranslationBattlePrompt(q, course, n) ?? null), note: getVocabularyUsageNote(course, n, q) ?? null,
    });
    const current = display(question);
    assert.deepEqual(display(clone), current, 'Imported legacy copies resolve the same display');
    assert.equal(JSON.stringify(question), before, 'Display lookup does not mutate the saved question');
    rendered.push(current);
  }
}
assert.equal(rendered.length, 7650);
// Calculated before implementation from the frozen released display plus the
// user-approved 498 proposals, including all unchanged questions and levels.
assert.equal(hash(rendered), '87927cbda28a641331602ed51a3e5cf7fad14c18d0071309c0c471e60e019b87',
  'Exactly the approved meanings, examples, related labels, prompts and notes');
for (const e of entries) {
  const matches = QUESTIONS[e.course][1].filter(q => q.text === e.text && q.translation === e.translation && (q.exampleEn ?? '') === e.exampleEn);
  assert.equal(matches.length, 1, 'Unique original course and sense');
  for (const level of [2, 3]) assert.equal(getLevel1VocabularyReview(e.course, level, e), undefined);
  assert.equal(getLevel1VocabularyReview('Eiken5', 1, e), undefined);
  assert.equal(getLevel1VocabularyReview(e.course, 1, { ...e, translation: e.translation + ' edited' }), undefined);
  assert.equal(getLevel1VocabularyReview(e.course, 1, { ...e, exampleEn: e.exampleEn + ' edited' }), undefined);
}
console.log('PASS: all 7,650 original/imported questions match the independently frozen approved display; 498 approved questions, 445 related-label changes, 14 notes; original identities and all other levels retained.');
