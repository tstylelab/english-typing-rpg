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
// The approved phrase review changes only these raw/label pairs, verified by
// test-grade2-phrase-synonyms. Retain the original frozen snapshot for all else.
const priorPhraseSynonyms = {
  'in person': ['face to face'], 'on schedule': ['on time'], 'in detail': ['thoroughly'],
  'pass away': ['die'], 'manage to': [], 'be capable of': ['be able to'],
};
const followup = {
  jewelry: { meaning: '宝飾品（指輪・ネックレスなど）', note: null, previousMeaning: '身につける装身具' },
  tip: { meaning: '助言・こつ／先端／チップ（謝礼）', note: null, previousMeaning: '助言・こつ／先端／チップ（心付け）' },
  monitor: { meaning: '監視する・経過を観察する／モニター・画面', note: null, previousMeaning: '監視する／モニター・画面' },
};
let followupChecked = 0;
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
    // Check the three approved follow-up changes explicitly, then restore only
    // those fields for comparison with the independently frozen full snapshot.
    const change = course === 'Eiken2' && n === 1 ? followup[question.text] : undefined;
    if (change) {
      assert.equal(current.meaning, change.meaning);
      assert.equal(current.note, change.note);
      followupChecked++;
      rendered.push({ ...current, meaning: change.previousMeaning, note: null });
    } else if (course === 'Eiken2' && n === 2 && Object.hasOwn(priorPhraseSynonyms, question.text)) {
      rendered.push({ ...current, synonyms: priorPhraseSynonyms[question.text], labels: priorPhraseSynonyms[question.text] });
    } else rendered.push(current);
  }
}
assert.equal(rendered.length, 7650);
assert.equal(followupChecked, 3);
// Calculated before implementation from the frozen released display plus the
// user-approved 498 proposals, including all unchanged questions and levels.
assert.equal(hash(rendered), '87927cbda28a641331602ed51a3e5cf7fad14c18d0071309c0c471e60e019b87',
  'Exactly the approved display outside the three explicitly checked follow-up fields');
for (const e of entries) {
  const matches = QUESTIONS[e.course][1].filter(q => q.text === e.text && q.translation === e.translation && (q.exampleEn ?? '') === e.exampleEn);
  assert.equal(matches.length, 1, 'Unique original course and sense');
  for (const level of [2, 3]) assert.equal(getLevel1VocabularyReview(e.course, level, e), undefined);
  assert.equal(getLevel1VocabularyReview('Eiken5', 1, e), undefined);
  assert.equal(getLevel1VocabularyReview(e.course, 1, { ...e, translation: e.translation + ' edited' }), undefined);
  assert.equal(getLevel1VocabularyReview(e.course, 1, { ...e, exampleEn: e.exampleEn + ' edited' }), undefined);
}
console.log('PASS: all 7,650 original/imported questions retain their identities; jewelry/tip/monitor follow-up checked explicitly; all remaining display fields match the independently frozen approved snapshot.');
