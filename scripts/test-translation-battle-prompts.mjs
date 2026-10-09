import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
import {getPriorMeaning} from './lib/translation-prompt-baseline.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const {getGrade3VocabularyAnswerCue}=load('src/data/grade3VocabularyPrompts.ts');
const {getPhraseAnswerCue}=load('src/data/grade4PhrasePrompts.ts');
const entries=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json','utf8'));
const id=q=>JSON.stringify([q.text,q.translation,q.exampleEn??'']);
const key=(c,l,q)=>c+':'+l+':'+id(q);
const byKey=new Map(entries.map(e=>[key(e.course,e.level,e),e]));
assert.equal(byKey.size,entries.length,'No overwritten identities');
let checked=0,changed=0;
for(const [course,levels]of Object.entries(QUESTIONS))for(const[level,qs]of Object.entries(levels))for(const q of qs){
 const serialized=JSON.stringify(q),e=byKey.get(key(course,level,q));
 const m=getQuestionMeaning(q,course);
 assert.equal(m,e?.meaning??getPriorMeaning(q,course),key(course,level,q));
 assert.equal(getQuestionMeaning(JSON.parse(serialized),course),m,'Imported question resolves identically');
 assert.equal(JSON.stringify(q),serialized,'Keep saved progress identity intact');
 assert.equal(getGrade3VocabularyAnswerCue(q,course,Number(level)),undefined);
 assert.equal(getPhraseAnswerCue(q.text,course,Number(level)),undefined);
 assert.ok(!/(?:[a-z]…|\d+文字|頭文字|[a-z]+を使う)/i.test(m),'No spelling directives: '+q.text);
 if(e){
  assert.equal(e.previousMeaning,getPriorMeaning(q,course));
  assert.equal(getTranslationBattlePrompt(q,course,Number(level)).text,q.text);
  assert.equal(getTranslationBattlePrompt({...q,translation:'different saved identity'},course,Number(level)),undefined);
  assert.equal(getTranslationBattlePrompt(q,'Conversation',Number(level)),undefined);
  const labels=[...e.alternatives,...e.contrasts];
  assert.equal(new Set(labels.map(x=>x.text.toLowerCase())).size,labels.length,'No conflicting synonym/contrast labels: '+q.text);
  for(const t of labels){assert.notEqual(t.text.toLowerCase(),q.text.toLowerCase());assert.ok(t.note&&t.note.length<=24,q.text);}
  assert.ok(e.alternatives.length <= 2, 'Limit reading load: ' + q.text);
  assert.ok(!/[a-z]/i.test(e.formNote),'Japanese-only grammar guidance: '+q.text);
  assert.equal((m.match(/（/g)??[]).length,(m.match(/）/g)??[]).length,'Balanced brackets: '+q.text);
  if(m!==e.previousMeaning)changed++;
 }
 checked++;
}
assert.equal(createHash('sha256').update(JSON.stringify(QUESTIONS.Eiken3[1])).digest('hex'),'1514b432902ba3931d3cf618afa76ca02bc10f35df8bfcc1e349b86fdecb1552');
for(const e of entries)assert.ok(QUESTIONS[e.course][e.level].some(q=>id(q)===id(e)),'No stale corrections');
const first=QUESTIONS.Eiken3[2].find(q=>q.text==='for the first time');
assert.equal(getQuestionMeaning(first,'Eiken3'),'初めて（その経験・行為の初回に）');
assert.ok(getTranslationBattlePrompt(first,'Eiken3',2).contrasts.some(t=>t.text==='at first'));
for(const[c,t,alias]of [['EikenPre2','due to','because of'],['Eiken2','instead of','in place of'],['Eiken2','deal with','cope with'],['EikenPre1Part1','bank on','count on'],['Eiken1Part2','knuckle down','buckle down']]){
 const q=QUESTIONS[c][2].find(q=>q.text===t);assert.ok(getTranslationBattlePrompt(q,c,2).alternatives.some(x=>x.text===alias));
}

const prompt=(c,l,text)=>{
 const q=QUESTIONS[c][l].find(q=>q.text===text);assert.ok(q,text);
 return getTranslationBattlePrompt(q,c,l);
};
const aliasTexts=(c,l,text)=>prompt(c,l,text)?.alternatives.map(a=>a.text)??[];
assert.deepEqual(aliasTexts('Eiken5',1,'start'),['begin']);
assert.equal(prompt('Eiken5',1,'cup').meaning,'カップ（飲み物用の容器）');
assert.deepEqual(aliasTexts('Eiken3',1,'support'),['help','back']);
assert.deepEqual(aliasTexts('EikenPre2',1,'influence'),['effect']);
assert.deepEqual(aliasTexts('EikenPre1Part2',1,'influence'),['affect'],'Verb influence keeps its verb comparison');
assert.deepEqual(aliasTexts('Eiken1Part2',1,'disdain'),['despise']);
assert.deepEqual(aliasTexts('Eiken3',1,'scene'),[]);
assert.deepEqual(aliasTexts('Eiken3',2,'think of'),['come up with']);
assert.deepEqual(aliasTexts('Eiken4',2,'think of'),['think about','come up with'],'Broader source meaning keeps both senses');
assert.deepEqual(aliasTexts('Eiken4',3,'We need to leave right now.'),[]);
const asleep=prompt('Eiken3',1,'asleep');assert.deepEqual(asleep.contrasts,[]);
assert.equal(asleep.alternatives[0].note,'名詞の前にも置ける');assert.ok(asleep.meaning.includes('動詞の後'));
assert.deepEqual(aliasTexts('Eiken3',1,'familiar'),[]);assert.equal(prompt('Eiken3',1,'familiar').contrasts[0].text,'well-known');
assert.deepEqual(aliasTexts('Eiken5',1,'evening'),[]);
assert.ok(aliasTexts('Eiken4',3,'May I use your dictionary?').includes('Could I'));
assert.ok(aliasTexts('Eiken4',3,'Do you know anyone in London?').includes('anybody'));
assert.ok(prompt('Eiken4',3,'This bag is not as heavy as yours.').meaning.includes('短縮形なし'));
assert.equal(aliasTexts('EikenPre1Part2',3,"I'm not sure what to make of that.")[0],'interpret');
assert.equal(prompt('Eiken3',3,'It is easy for me to swim.').formNote,'仮の主語','Keep useful grammar guidance');
assert.ok(!entries.some(e=>['賛成','まだ','可能性・提案','情報を加える'].includes(e.formNote)));

const app=fs.readFileSync('src/App.tsx','utf8');assert.ok(!app.includes('battle-answer-cue'));assert.ok(app.includes("gameState.inputMode === 'text-only'\n      ? getTranslationBattlePrompt"));
assert.ok(!app.includes('表示した語以外で答えよう'));
console.log('PASS',checked,'questions;',entries.length,'reviewed prompt entries;',changed,'changed meanings; legacy identities, import round trips, course/level scope and no spelling cues.');
