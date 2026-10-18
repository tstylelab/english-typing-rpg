import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {load} from './lib/load-typescript-data.mjs';
const json = value=>JSON.parse(JSON.stringify(value));
const {QUESTIONS}=load('src/data/questions.ts');
const {legacyGrade4Sentences}=load('src/data/questionSets/eiken/grade4.ts');
const {grade4GrammarCards:cards,grade4GrammarSections:sections,getGrade4GrammarCard}=load('src/data/grade4GrammarGuide.ts');
const {grade4GrammarAssignments:assignments}=load('src/data/grade4GrammarAssignments.ts');
const {getGrammarCard,getGrammarGuideCourse}=load('src/data/grammarGuides.ts');
const {getQuestionGrammarPoint}=load('src/data/questionGrammarPoints.ts');
const baseline=JSON.parse(execFileSync('git',['show','1cdee3d:src/data/questionSets/eiken/grade4.json'],{encoding:'utf8'}));
const current=load('src/data/questionSets/eiken/grade4.json');
const questions=QUESTIONS.Eiken4[3];
assert.deepEqual(json(current.levels['1']),baseline.levels['1']);
assert.deepEqual(json(current.levels['2']),baseline.levels['2']);
assert.deepEqual(json(legacyGrade4Sentences.slice(0,200)),baseline.levels['3'],'Original published source retained');
for(const q of legacyGrade4Sentences)assert.deepEqual(json(questions.find(v=>v.text===q.text)),json(q),'All published identities retained');
assert.equal(questions.length,233);
assert.equal(cards.length,34);
assert.equal(new Set(cards.map(c=>c.title)).size,cards.length);
assert.equal(cards.find(c=>c.id==='must').title,'must・have to');
assert.equal(cards.find(c=>c.id==='must').subtitle,'義務・禁止・必要なし');
// Every navigation heading names concrete English expressions, not only a Japanese grammar label.
const englishExamples = ['I am','what','my / mine','am / is / are','was','played','was / were','will','be going to','There is','can','Can I','Can you','Would you like','must','should','Don’t','than','the most','as','want to','to buy','happy to','reading','something','because','think','give','tell','how to','It is','It takes','Here you are.'];
cards.forEach((card,index)=>assert.ok(card.title.includes(englishExamples[index]??'too'),card.id+' shows English expressions'));
assert.equal(Object.keys(assignments).length,233);
assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
assert.equal(new Set(questions.map(q=>q.text.toLowerCase())).size,233);
for (const q of questions) {
  assert.ok(getGrade4GrammarCard('Eiken4',3,q),q.text);
  assert.equal(getGrammarCard('Eiken4',3,q)?.id,assignments[q.text]);
  assert.equal(getGrade4GrammarCard('EikenPre2',3,q),undefined);
  assert.equal(getGrammarCard('Eiken4',2,q),undefined);
  assert.equal(getGrade4GrammarCard('Eiken5',3,q),undefined);
}
for (const c of cards) {
  assert.ok(sections[c.section]);
  for (const field of ['title','subtitle','term','pattern','tip','more']) assert.ok(c[field]?.trim(),c.id+' '+field);
  assert.equal(c.examples.length,2);
  assert.ok(c.examples.every(pair=>pair.length===2 && pair.every(v=>v.trim())));
  assert.ok(questions.some(q=>assignments[q.text]===c.id),'Active practice for '+c.id);
  for (const pair of [...(c.compare||[]),...(c.chunks||[])]) assert.ok(pair.length===2 && pair.every(v=>v.trim()));
}
const expectedAdditions=[["Ken is as tall as Tom.","as"],["This bag is not as heavy as yours.","as"],["I stayed home because I was sick.","connectors"],["If it rains, I will stay home.","connectors"],["Wash your hands before you eat.","connectors"],["She was not busy yesterday.","past-be"],["I was not sleeping then.","past-progressive"],["I will not go out tonight.","future-will"],["We are not going to swim today.","future-going"]];
assert.deepEqual(json(legacyGrade4Sentences.slice(200).map(q=>[q.text,assignments[q.text]])),expectedAdditions);
for (const q of legacyGrade4Sentences.slice(200)) {
  assert.match(q.text,/^[\x20-\x7e]+$/);
  assert.ok(q.text.length<=35,q.text);
  assert.equal(questions.filter(v=>v.translation===q.translation).length,1,'Unique prompt: '+q.translation);
  const inline=getQuestionGrammarPoint('Eiken4',3,q);
  assert.ok(inline?.note && inline.pattern);
}
assert.equal(getQuestionGrammarPoint('Eiken4',3,legacyGrade4Sentences[200]).label,'同等比較');
assert.equal(getQuestionGrammarPoint('Eiken4',3,legacyGrade4Sentences[203]).label,'条件をつなぐ');
for (const [text,id] of [
  ['Can I help you?','offer'],['May I use your dictionary?','permission'],['Could you open the door?','requests'],
  ['I was reading when you called me.','past-progressive'],['Reading books is fun for me.','gerund'],
  ['It is important to eat breakfast.','it-to'],['I want something cold to drink.','something'],
  ['He stopped at a store to buy some water.','to-purpose'],['I am glad to hear that.','to-reason'],
  ['I want to buy some flowers.','to-noun'],['My teacher told me to study harder.','tell-to'],
  ['Who helped you at the station?','questions'],['You must not use your phone here.','must'],
]) assert.equal(getGrammarCard('Eiken4',3,{text}).id,id,text);
assert.equal(getGrammarCard('Eiken4',3,{text:'An unknown sentence.'}),undefined);
assert.equal(getGrammarGuideCourse('eiken4'),'Eiken4');
assert.equal(getGrammarGuideCourse('Eiken5'),'Eiken5');
assert.equal(getGrammarGuideCourse('eikenpre2'),'EikenPre2');
assert.equal(getGrammarGuideCourse(null),undefined);
console.log('PASS: 233 exact Grade 4 links, 34 cards; all original 209 identities and Levels 1/2 preserved; semantic distinctions and course isolation');
