import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { load } from './lib/load-typescript-data.mjs';
const { QUESTIONS } = load('src/data/questions.ts');
const { grade5GrammarCards, grade5GrammarSections, getGrade5GrammarCard } = load('src/data/grade5GrammarGuide.ts');
const { grade5GrammarAssignments } = load('src/data/grade5GrammarAssignments.ts');
const questions = QUESTIONS.Eiken5[3];
const old = JSON.parse(execFileSync('git', ['show','9ac5d02:src/data/questionSets/eiken/grade5.json'], {encoding:'utf8'}));
const json = value => JSON.parse(JSON.stringify(value));
assert.deepEqual(json(questions.slice(0,200)), old.levels['3'], 'Original questions and progress identities preserved');
for (const level of [1,2]) assert.deepEqual(json(QUESTIONS.Eiken5[level]), old.levels[String(level)]);
assert.equal(questions.length, 223);
assert.equal(grade5GrammarCards.length, 25);
assert.equal(Object.keys(grade5GrammarAssignments).length, questions.length);
assert.equal(new Set(questions.map(q=>q.text.toLowerCase())).size, questions.length);
for (const q of questions.slice(200)) {
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
]) assert.equal(getGrade5GrammarCard('Eiken5', 3, {text}).id, id);
console.log('PASS: 223 exact links, 25 cards, 23 unique supplements; original 200 questions and Levels 1/2 unchanged; saved-result compatibility and course/level isolation');
