import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
const { QUESTIONS } = load('src/data/questions.ts');
const { grammarGuides, getGrammarCard, getGrammarGuideCourse } = load('src/data/grammarGuides.ts');
const { getPre2GrammarCard } = load('src/data/pre2GrammarGuide.ts');
const { pre2GrammarAssignments: assignments } = load('src/data/pre2GrammarAssignments.ts');
const { readGrammarBookmarks, toggleGrammarBookmark, grammarBookmarkKey } = load('src/grammarBookmarks.ts');
const { buildGrammarQuestion } = load('src/grammarAiPrompt.ts');
const questions = QUESTIONS.EikenPre2[3];
const { cards, sections } = grammarGuides.EikenPre2;
for (const file of ['src/data/questionSets/eiken/pre2.ts','src/data/questionSets/eiken/pre2Sentences.ts','src/data/questionSets/eiken/pre2Vocabulary.ts','src/data/questionSets/eiken/pre2Phrases.ts','src/data/pre2Balance.ts','src/App.tsx']) {
  // Autoplay/history changes were committed separately after the original material baseline.
  const baseline = file === 'src/App.tsx' ? '14d0826' : '4c6731c';
  assert.equal(readFileSync(file,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n'), 'Published material/gameplay unchanged: '+file);
}
assert.equal(questions.length,173);
assert.equal(cards.length,65);
assert.equal(sections.length,4);
assert.deepEqual(Object.keys(assignments).sort(),Array.from(questions,q=>q.text).sort());
assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
for (const q of questions) {
  assert.ok(getGrammarCard('EikenPre2',3,q),q.text);
  assert.equal(getGrammarCard('EikenPre2',3,q).id,assignments[q.text]);
  for (const level of [1,2]) assert.equal(getGrammarCard('EikenPre2',level,q),undefined);
  for (const course of ['Eiken3','Eiken2','EikenPre1Part1']) assert.equal(getPre2GrammarCard(course,3,q),undefined);
}
for (const card of cards) {
  assert.ok(sections[card.section]);
  for (const key of ['title','subtitle','term','pattern','tip','more']) assert.ok(card[key]?.trim(),card.id+': '+key);
  assert.equal(card.examples.length,2);
  assert.ok(Object.values(assignments).includes(card.id),'Unlinked card: '+card.id);
  for (const pair of [...card.examples,...(card.compare||[]),...(card.chunks||[])]) assert.ok(pair.length===2&&pair.every(v=>v.trim()));
}
// Reviewed exceptions: do not fall back to the broad source grammar labels.
for (const [text,id] of [
  ['Would you mind waiting outside?','mind'],
  ['Is it OK if I sit here?','permission'],
  ["I'd like to know if the room is free.",'indirect-if'],
  ['If I have time tomorrow, I will help you.','condition'],
  ['If I had more time, I would travel abroad.','unreal'],
  ['I am used to getting up early.','used-to'],
  ['I saw him crossing the street.','perception'],
  ['The movie made me feel happy.','let-make'],
  ['The train had left when we arrived.','past-perfect'],
  ['This is the town where I grew up.','where-when'],
  ['This is the camera that I bought yesterday.','relative'],
  ['The broken window must be replaced.','participle'],
  ['The room is being cleaned now.','passive'],
  ['It is important to respect different opinions.','it-to'],
  ['I do not think that all homework is unnecessary.','negative-opinion'],
  ['I spoke slowly so that everyone could understand.','purpose-result'],
  ['The bag was so heavy that I could not lift it.','purpose-result'],
  ['He did nothing but complain.','nothing'],
  ['See to it that the door is locked.','ensure'],
  ['I took him for his brother.','take-for'],
  ['A short walk will do you good.','help-good'],
  ['He talks as if he knew everything.','wish-asif'],
]) assert.equal(getGrammarCard('EikenPre2',3,{text})?.id,id,text);
assert.equal(getGrammarCard('EikenPre2',3,{text:'Unknown question.'}),undefined);
assert.equal(getGrammarGuideCourse('eikenpre2'),'EikenPre2');
assert.equal(getGrammarGuideCourse('EikenPre2'),'EikenPre2');
assert.equal(getGrammarGuideCourse('eikenpre1part1'),'EikenPre1Part1');
const data=new Map();
const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
toggleGrammarBookmark(storage,'one','perfect-duration','Eiken3');
toggleGrammarBookmark(storage,'one','perfect-duration','EikenPre2');
toggleGrammarBookmark(storage,'one','used-to','EikenPre2');
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'one','EikenPre2')),['perfect-duration','used-to']);
toggleGrammarBookmark(storage,'one','perfect-duration','EikenPre2');
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'one','Eiken3')),['perfect-duration']);
assert.deepEqual(Array.from(readGrammarBookmarks(storage,'other','EikenPre2')),[]);
data.set(grammarBookmarkKey('one','EikenPre2'),'{broken');
assert.throws(()=>toggleGrammarBookmark(storage,'one','used-to','EikenPre2'));
assert.equal(data.get(grammarBookmarkKey('one','EikenPre2')),'{broken');
const text='I am used to getting up early.';
const prompt=buildGrammarQuestion('準2級',getGrammarCard('EikenPre2',3,{text}),text);
assert.ok(prompt.includes('英検準2級に挑戦する学習者')&&prompt.includes('ゲームで出た文：'+text));
assert.ok(!prompt.includes('英検2級に挑戦する'));
console.log(`PASS: Pre-2 ${questions.length} exact links, ${cards.length} cards, reviewed distinctions, unchanged curriculum/gameplay, bookmark isolation and AI context`);
