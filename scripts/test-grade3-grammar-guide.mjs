import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
const { QUESTIONS } = load('src/data/questions.ts');
const { grammarGuides, getGrammarCard, getGrammarGuideCourse } = load('src/data/grammarGuides.ts');
const { grade3GrammarAssignments: assignments } = load('src/data/grade3GrammarAssignments.ts');
const { grammarBookmarkKey, readGrammarBookmarks, toggleGrammarBookmark } = load('src/grammarBookmarks.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const questions = QUESTIONS.Eiken3[3];
const { cards, sections } = grammarGuides.Eiken3;
// Guide work must not alter published question identities, translations or order in any level.
for (const file of ['grade3.ts','grade3Vocabulary.ts','grade3Phrases.ts','grade3Sentences.ts']) {
  const path = 'src/data/questionSets/eiken/' + file;
  const baseline = execFileSync('git', ['show', '01da84e:' + path], { encoding: 'utf8' });
  assert.equal(readFileSync(path, 'utf8').replace(/\r\n/g, '\n'), baseline.replace(/\r\n/g, '\n'), path + ' must be unchanged');
}
assert.equal(questions.length, 168);
assert.equal(cards.length, 38);
assert.equal(new Set(cards.map(c => c.id)).size, cards.length);
assert.deepEqual(Object.keys(assignments).sort(), plain(questions.map(q => q.text)).sort(), 'No missing or stale links');
for (const q of questions) {
  const card = getGrammarCard('Eiken3', 3, q);
  assert.ok(card, q.text);
  assert.equal(card.id, assignments[q.text]);
  assert.equal(getGrammarCard('Eiken3', 1, q), undefined);
  assert.equal(getGrammarCard('Eiken3', 2, q), undefined);
  assert.equal(getGrammarCard('Eiken2', 3, q), undefined);
}
for (const card of cards) {
  assert.ok(sections[card.section]);
  for (const field of ['title','subtitle','term','pattern','tip','more']) assert.ok(card[field]?.trim(), card.id + ': ' + field);
  assert.equal(card.examples.length, 2);
  assert.ok(Object.values(assignments).includes(card.id), 'No unlinked card: ' + card.id);
  for (const pair of [...card.examples, ...(card.chunks || []), ...(card.compare || [])])
    assert.ok(pair.length === 2 && pair.every(text => text.trim()), card.id);
}
// Deliberately tricky sentences: don't classify solely by the first keyword.
for (const [text, id] of [
  ['He stopped talking.', 'stop-remember'], ['He stopped to talk.', 'stop-remember'],
  ['She has been busy since Monday.', 'perfect-duration'], ['She has been waiting since noon.', 'perfect-progressive'],
  ['Have you ever been to Canada?', 'perfect-experience'], ['Has she arrived yet?', 'perfect-result'],
  ['This machine can be used by anyone.', 'passive-modal'], ['Paper is made from wood.', 'passive-materials'],
  ['This is the camera that I bought.', 'relative-object'], ['The cake she made was delicious.', 'relative-object'],
  ['The boy who is running is my brother.', 'relative-subject'], ['The girl playing tennis is my sister.', 'participle-ing'],
  ['I read a book written in English.', 'participle-past'], ['Do you know where she lives?', 'indirect-question'],
  ['I know who made this cake.', 'indirect-question'], ['I do not know where to go.', 'wh-to'],
  ['I prefer reading to watching TV.', 'gerund'], ['I asked him not to run.', 'person-to'],
  ['I was so tired that I went to bed early.', 'so-that'], ['I think that reading is important.', 'that-clause'],
  ['I would like to visit Canada to see my friend.', 'to-purpose'],
]) assert.equal(getGrammarCard('Eiken3', 3, { text })?.id, id, text);
assert.equal(getGrammarCard('Eiken3', 3, { text: 'An unknown sentence.' }), undefined);
assert.equal(getGrammarGuideCourse('eiken3'), 'Eiken3');
assert.equal(getGrammarGuideCourse('Eiken3'), 'Eiken3');
assert.equal(getGrammarGuideCourse('eikenpre2'), undefined);

const data = new Map();
const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
toggleGrammarBookmark(storage, 'student', 'questions', 'Eiken4');
toggleGrammarBookmark(storage, 'student', 'questions', 'Eiken3');
toggleGrammarBookmark(storage, 'student', 'perfect-duration', 'Eiken3');
assert.deepEqual(plain(readGrammarBookmarks(storage, 'student', 'Eiken3')), ['questions', 'perfect-duration']);
toggleGrammarBookmark(storage, 'student', 'questions', 'Eiken3');
assert.deepEqual(plain(readGrammarBookmarks(storage, 'student', 'Eiken3')), ['perfect-duration']);
assert.deepEqual(plain(readGrammarBookmarks(storage, 'student', 'Eiken4')), ['questions']);
assert.deepEqual(plain(readGrammarBookmarks(storage, 'other', 'Eiken3')), []);
assert.throws(() => toggleGrammarBookmark(storage, 'student', 'past-be', 'Eiken3'));
const key = grammarBookmarkKey('student', 'Eiken3');
data.set(key, '{broken');
assert.throws(() => toggleGrammarBookmark(storage, 'student', 'questions', 'Eiken3'));
assert.equal(data.get(key), '{broken');
console.log('PASS: Grade 3 all 168 links, 38 cards, semantic distinctions, unchanged questions, bookmark course/player isolation and unreadable-save preservation');
