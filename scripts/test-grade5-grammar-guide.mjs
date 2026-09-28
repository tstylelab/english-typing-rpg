import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { load } from './lib/load-typescript-data.mjs';
const { QUESTIONS } = load('src/data/questions.ts');
const { grade5GrammarCards, grade5GrammarSections, getGrade5GrammarCard } = load('src/data/grade5GrammarGuide.ts');
const { grade5GrammarAssignments } = load('src/data/grade5GrammarAssignments.ts');
const questions = QUESTIONS.Eiken5[3];
const old = JSON.parse(execFileSync('git', ['show','9ac5d02:src/data/questionSets/eiken/grade5.json'], {encoding:'utf8'}));
const json = value => JSON.parse(JSON.stringify(value));
const retired = new Set([
  "Is she your sister?",
  "There is an apple.",
  "I want to be a teacher.",
  "Do you like this song?",
  "Where is your school?",
  "When is your test?",
  "Whose book is this?",
  "Please open your book.",
  "Please sit here.",
  "Look at this picture.",
  "Listen to this song.",
  "Let's have lunch now.",
  "It is sunny this morning.",
  "I like music very much.",
  "We are good friends.",
  "You are very welcome.",
  "The egg is white.",
  "We are students.",
  "They are teachers.",
  "This is not a dog."
]);
assert.equal(retired.size, 20);
assert.ok(questions.every(q=>!retired.has(q.text)), 'Approved redundant questions removed from active pool');
const originalRetained = old.levels['3'].filter(q=>!retired.has(q.text));
assert.equal(originalRetained.length, 184);
assert.deepEqual(json(questions.slice(0,184)), originalRetained, 'Retained original questions and progress identities preserved');
for (const level of [1,2]) assert.deepEqual(json(QUESTIONS.Eiken5[level]), old.levels[String(level)]);
const published = JSON.parse(execFileSync('git', ['show','902de4c:src/data/questionSets/eiken/grade5.json'], {encoding:'utf8'}));
const publishedRetained = published.levels['3'].filter(q=>!retired.has(q.text));
assert.equal(publishedRetained.length, 206);
assert.deepEqual(json(questions.slice(0,206)), publishedRetained, 'Retained published text, translation and order preserved');
assert.equal(questions.length, 221);
assert.equal(grade5GrammarCards.length, 32);
assert.deepEqual(json(grade5GrammarCards.slice(0,6).map(c=>c.id)), ['subjects','word-types','be','word-order','demonstratives','contractions']);
assert.equal(Object.keys(grade5GrammarAssignments).length, questions.length + retired.size);
assert.deepEqual(Object.keys(grade5GrammarAssignments).filter(text=>!questions.some(q=>q.text===text)).sort(), [...retired].sort());
for (const text of retired) assert.ok(getGrade5GrammarCard('Eiken5', 3, {text}), 'Retired result links still resolve: '+text);
assert.equal(new Set(questions.map(q=>q.text.toLowerCase())).size, questions.length);
for (const q of questions.filter(q=>!old.levels['3'].some(original=>original.text===q.text))) {
  assert.match(q.text, /^[\x20-\x7e]+$/);
  assert.ok(q.text.length<=40 && q.translation.length<=35, q.text);
  assert.equal(questions.filter(other=>other.translation===q.translation).length,1,q.translation);
}
assert.equal(new Set(grade5GrammarCards.map(c => c.id)).size, grade5GrammarCards.length);
for (const card of grade5GrammarCards) {
  assert.ok(grade5GrammarSections[card.section]);
  for (const field of ['title','term','pattern','tip','more']) assert.ok(card[field]?.trim(), `${card.id} ${field}`);
  assert.equal(card.examples.length, 2);
  for (const row of card.compare || []) assert.ok(row.length===2 && row.every(value=>value.trim()));
  for (const row of card.chunks || []) assert.ok(row.length===2 && row.every(value=>value.trim()));
  assert.ok(questions.some(q => getGrade5GrammarCard('Eiken5', 3, q)?.id === card.id));
}
for (const q of questions) {
  assert.ok(getGrade5GrammarCard('Eiken5', 3, q), q.text);
  // Old results retaining only text still resolve; unrelated courses never do.
  assert.ok(getGrade5GrammarCard('Eiken5', 3, {text:q.text}));
  assert.equal(getGrade5GrammarCard('Eiken4', 3, q), undefined);
  assert.equal(getGrade5GrammarCard('Eiken5', 2, q), undefined);
}
assert.equal(getGrade5GrammarCard('Eiken5', 3, {text:'A new sentence.'}), undefined);
for (const [text, id] of [
  ['Can I use this pen?','permission'], ['Can you swim?','can'],
  ['Are you watching TV?','progressive'], ['Are you hungry?','be-question'],
  ['Did you go shopping?','past'], ['Does she like dogs?','do-question'],
  ['I am happy to see you.','to'], ['I am sorry I am late.','greetings'],
  ['There is no milk.','there'], ['How many books do you have?','quantity'],
  ['This bag is mine.','pronouns'], ['This is an egg.','articles'],
  ["She doesn't play tennis.",'negative'], ['They are not reading.','progressive'],
  ['I always walk to school.','modifiers'], ['Do you want tea or coffee?','conjunctions'],
  ['My birthday is in July.','place'], ["This is Tom's bag.",'noun'],
  ['I have a book.','word-types'], ['I like music.','word-order'],
  ['This is a pen.','demonstratives'], ['That is a bird.','demonstratives'],
  ['These are books.','demonstratives'], ["I'm a student.",'contractions'],
  ['We are students.','subjects'], ['We are friends.','subjects'], ['They are happy.','subjects'], ['Yes, I am.','short-answers'],
  ["No, I can't.",'short-answers'], ["I don't have any pencils.",'amounts'],
  ["It is three o'clock.",'weather'], ['I am ten years old.','wh'],
]) assert.equal(getGrade5GrammarCard('Eiken5', 3, {text}).id, id);
console.log('PASS: 221 active questions, 32 cards, 20 legacy result links; retained published identities and Levels 1/2 unchanged; beginner prerequisite order and course/level isolation');
