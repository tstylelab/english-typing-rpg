import assert from 'node:assert/strict';
import {load} from './lib/load-typescript-data.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getPhraseAnswerCue}=load('src/data/grade4PhrasePrompts.ts');
const {getQuestionSynonyms}=load('src/data/questionSynonyms.ts');
const phrases=QUESTIONS.Eiken4[2];
assert.equal(phrases.length,149);
for(const q of phrases) {
  const before=JSON.stringify(q);
  const cue=getPhraseAnswerCue(q.text,'Eiken4',2);
  assert.ok(cue.endsWith(`（${q.text.trim().split(/\s+/).length}語）`));
  assert.equal(getPhraseAnswerCue(q.text,'Eiken4',1),undefined);
  assert.equal(getPhraseAnswerCue(q.text,'Eiken4',3),undefined);
  assert.equal(getPhraseAnswerCue(q.text,'Eiken3',2),undefined);
  getQuestionMeaning(q,'Eiken4');
  assert.equal(JSON.stringify(q),before,'Saved identity must not change');
}
for(const text of ['on foot','go around','talk with','talk to','speak to','like to','start to','around the corner']) {
  const q=phrases.find(q=>q.text===text);
  assert.ok(q);
  const meaning=getQuestionMeaning(q,'Eiken4');
  assert.notEqual(meaning,q.translation,text);
  assert.ok(!/[a-z]/i.test(meaning),meaning);
  console.log(text,'→',meaning,'/',getPhraseAnswerCue(text,'Eiken4',2));
}
const like=phrases.find(q=>q.text==='like to');
assert.ok(getQuestionSynonyms('Eiken4',2,like).includes('enjoy + -ing'));
assert.ok(!getQuestionSynonyms('Eiken5',2,like).includes('enjoy to'));
console.log('PASS: 149 cues, 8 meanings, synonym grammar, scope and immutable identities');
for(const q of phrases) {
  assert.ok(!/(?:を使う|で始める|の後に)/.test(getQuestionMeaning(q,'Eiken4')),q.text);
}
assert.notEqual(getPhraseAnswerCue('go back','Eiken4',2),getPhraseAnswerCue('get back','Eiken4',2));
assert.equal(getPhraseAnswerCue('take A to B','Eiken4',2),'t… A t… B（4語）');
const checks={
  'kind of':['somewhat','a little'],'after work':['after finishing work'],
  'post office':[],'come home':['return home'],'go home':['return home'],
  'get up':['get out of bed'],'wake up':['stop sleeping'],
  'listen to':['pay attention to'],'in front of':[],
  'for free':['free of charge'],'have a good time':['enjoy oneself'],
};
for(const [text,expected] of Object.entries(checks)) {
  const q=phrases.find(q=>q.text===text);
  assert.deepEqual(Array.from(getQuestionSynonyms('Eiken4',2,q)),expected);
}
console.log('PASS: all 149 meanings audited; no answer-spelling notes; 11 scoped synonym corrections');
