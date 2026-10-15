import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
const { QUESTIONS } = load('src/data/questions.ts');
const { grammarGuides, getGrammarCard, getGrammarGuideCourse } = load('src/data/grammarGuides.ts');
const { grade2GrammarAssignments: assignments } = load('src/data/grade2GrammarAssignments.ts');
const { readGrammarBookmarks, toggleGrammarBookmark, grammarBookmarkKey } = load('src/grammarBookmarks.ts');
const { buildGrammarQuestion } = load('src/grammarAiPrompt.ts');
const questions = QUESTIONS.Eiken2[3];
const { cards, sections } = grammarGuides.Eiken2;
for (const file of ['grade2.ts','grade2Sentences.ts','grade2Vocabulary.ts','grade2Phrases.ts','grade2Supplement.ts']) {
  const path = 'src/data/questionSets/eiken/' + file;
  assert.equal(readFileSync(path,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','7f1e34b:'+path],{encoding:'utf8'}).replace(/\r\n/g,'\n'), 'Published questions stay unchanged: '+file);
}
assert.equal(questions.length,94);
assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
assert.deepEqual(Object.keys(assignments).sort(),Array.from(questions,q=>q.text).sort());
for (const q of questions) {
  assert.equal(getGrammarCard('Eiken2',3,q)?.id,assignments[q.text],q.text);
  for (const level of [1,2]) assert.equal(getGrammarCard('Eiken2',level,q),undefined);
}
for (const card of cards) {
  assert.ok(sections[card.section]);
  for (const key of ['title','subtitle','term','pattern','tip','more']) assert.ok(card[key]?.trim(), card.id+': '+key);
  assert.equal(card.examples.length,2);
  assert.ok(Object.values(assignments).includes(card.id),'Unused card: '+card.id);
  for (const pair of [...card.examples,...(card.compare||[]),...(card.chunks||[])]) assert.ok(pair.length===2 && pair.every(v=>v.trim()));
}
for (const [text,id] of [
  ['I have two reasons why I think so.','reasons-for-why'],
  ['I have two reasons for this.','reasons-for-why'],
  ['Another reason is that it is easy to use.','reason-content'],
  ['The game was canceled because of the rain.','reason-noun'],
  ['This is because the buses are often late.','reason-because'],
  ['That is why I support the plan.','conclusion'],
  ['I disagree with the idea that tests are unnecessary.','agreement'],
  ['The book that you recommended was useful.','relative-object'],
  ['It is often said that travel broadens the mind.','passive-report'],
  ['Can you tell me how to apply for the program?','wh-to'],
  ['I wonder why she changed her mind.','indirect-question'],
  ['I prefer learning with friends.','gerund'],
  ['In conclusion, the program is worth trying.','worth'],
  ['The most important thing is to keep trying.','infinitive-complement'],
  ['The number of visitors is increasing.','trend-number'],
]) assert.equal(getGrammarCard('Eiken2',3,{text})?.id,id,text);
assert.equal(getGrammarCard('Eiken2',3,{text:'Not a question.'}),undefined);
assert.equal(getGrammarGuideCourse('eiken2'),'Eiken2');
assert.equal(getGrammarGuideCourse('Eiken2'),'Eiken2');
assert.equal(getGrammarGuideCourse('eikenpre1part1'),'EikenPre1Part1');
const data=new Map();
const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
toggleGrammarBookmark(storage,'one','relative-object','Eiken3');
toggleGrammarBookmark(storage,'one','relative-object','Eiken2');
toggleGrammarBookmark(storage,'one','worth','Eiken2');
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'one','Eiken2')),['relative-object','worth']);
toggleGrammarBookmark(storage,'one','relative-object','Eiken2');
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'one','Eiken3')),['relative-object']);
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'other','Eiken2')),[]);
data.set(grammarBookmarkKey('one','Eiken2'),'{broken');
assert.throws(()=>toggleGrammarBookmark(storage,'one','worth','Eiken2'));
assert.equal(data.get(grammarBookmarkKey('one','Eiken2')),'{broken');
const question='The book that you recommended was useful.';
const prompt=buildGrammarQuestion('2級',getGrammarCard('Eiken2',3,{text:question}),question);
assert.ok(prompt.includes('英検2級に挑戦する学習者') && prompt.includes('ゲームで出た文：'+question));
assert.ok(!prompt.includes('英検3級'));
console.log(`PASS: Grade 2 ${questions.length} exact links, ${cards.length} cards, semantic distinctions, original question data unchanged, saved-card isolation and AI context`);
