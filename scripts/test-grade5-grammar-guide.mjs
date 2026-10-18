import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
const r=JSON.parse(fs.readFileSync('docs/grade5-level3-foundations-2026-10-19/review.json','utf8'));
const {QUESTIONS}=load('src/data/questions.ts');
const {legacyGrade5Sentences,grade5Foundations,getGrade5FoundationLimit}=load('src/data/questionSets/eiken/grade5.ts');
const {legacyGrade4Sentences}=load('src/data/questionSets/eiken/grade4.ts');
const {legacyGrade5GrammarAssignments}=load('src/data/grade5GrammarAssignments.ts');
const {grade5GrammarCards:cards,getGrade5GrammarCard:getCard}=load('src/data/grade5GrammarGuide.ts');
const {getQuestionMeaning:meaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt:prompt}=load('src/data/translationBattlePrompts.ts');
const json=x=>JSON.parse(JSON.stringify(x));
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
// The later grade4 revision has its own cross-course/save checks.
const original={...QUESTIONS,Eiken4:{...QUESTIONS.Eiken4,3:legacyGrade4Sentences},Eiken5:{...QUESTIONS.Eiken5,3:legacyGrade5Sentences}};
assert.equal(sha(original),r.sourceQuestionsSha256,'All other courses/levels and every original object are exact');
const active=QUESTIONS.Eiken5[3];assert.equal(active.length,228);assert.equal(legacyGrade5Sentences.length,221);
assert.equal(new Set(active.map(q=>q.text.toLowerCase())).size,228);
assert.deepEqual(r.counts,{before:221,retained:200,reference:21,added:28,active:228});
for(const row of r.existing){
 const q=active.find(q=>q.text===row.text);
 if(row.status==='keep')assert.deepEqual(json(q),json(legacyGrade5Sentences.find(q=>q.text===row.text)),'Keep identities and original Japanese');else assert.equal(q,undefined,'Reference-only questions stay out of normal play');
 assert.ok(getCard('Eiken5',3,{text:row.text}));
 assert.equal(meaning({text:row.text,translation:row.translation},'Eiken5'),row.meaning,'Stored review meanings retained');
}
const oldEntries=JSON.parse(execFileSync('git',['show','386d421:src/data/translationBattlePrompts.json'],{encoding:'utf8',maxBuffer:6000000}));
assert.equal(sha(oldEntries),r.sourcePromptsSha256);
const entries=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json','utf8'));
const outsideLaterGrade4=e=>!(e.course==='Eiken4'&&e.level===3);
const preserved=oldEntries.filter(outsideLaterGrade4),current=entries.filter(outsideLaterGrade4);
assert.deepEqual(current.slice(0,preserved.length),preserved,'Prior corrections outside the separately tested grade4 revision stay exact');assert.equal(current.length-preserved.length,28);
for(const row of r.active){
 const q=active.find(q=>q.text===row.question.text);assert.deepEqual(json(q),row.question);
 assert.equal(meaning(q,'Eiken5'),row.meaning);assert.equal(getCard('Eiken5',3,q)?.id,row.card);
 if(row.origin==='add'){
  const p=prompt(q,'Eiken5',3);assert.equal(p.formNote,row.formNote);assert.ok(p.formNote);assert.ok(!/[a-z]|頭文字|\d+文字/i.test(p.formNote));
  assert.equal(meaning(json(q),'Eiken5'),row.meaning);assert.equal(prompt({...q,translation:'different'},'Eiken5',3),undefined);
  assert.deepEqual(p.alternatives,[]);assert.deepEqual(p.contrasts,[]);
 }
}
assert.equal(new Set(cards.map(c=>c.id)).size,34);
for(const c of cards){for(const f of ['title','term','pattern','tip','more'])assert.ok(c[f]?.trim());assert.equal(c.examples.length,2);}
for(const [text,id] of Object.entries(legacyGrade5GrammarAssignments))assert.equal(getCard('Eiken5',3,{text})?.id,id,'All old card/bookmark IDs including the 20 previously retired items still resolve');
assert.equal(getCard('Eiken4',3,active[0]),undefined);assert.equal(getCard('Eiken5',2,active[0]),undefined);
assert.deepEqual([0,7,14].map(getGrade5FoundationLimit),[115,211,228]);
const early=grade5Foundations.slice(0,getGrade5FoundationLimit(0));
for(const text of ['I am not a teacher.',"She doesn't play tennis.",'Does she like dogs?','Are they in the classroom?'])assert.ok(early.some(e=>e.question.text===text),'Core transformations available from stage 1');
assert.equal(active.filter(q=>/^(Where|What|How).*\bdoes\b/.test(q.text)).length,5);
assert.equal(active.filter(q=>!/^No,/.test(q.text)&&q.text.includes("doesn't")).length,4);
let actual=fs.readFileSync('src/App.tsx','utf8').replaceAll('\r\n','\n').replace("import { getGrade5FoundationLimit } from './data/questionSets/eiken/grade5';\n",'').replace('? getGrade5FoundationLimit(stageIndex)','? (stageIndex < 7 ? 16 : stageIndex < 14 ? 66 : Infinity)').replace("import { getGrade4FoundationLimit } from './data/questionSets/eiken/grade4';\n",'').replace('? getGrade4FoundationLimit(stageIndex)','? (stageIndex < 7 ? 20 : stageIndex < 14 ? 75 : Infinity)');
assert.equal(actual,execFileSync('git',['show','386d421:src/App.tsx'],{encoding:'utf8',maxBuffer:6000000}).replaceAll('\r\n','\n'),'Only the grade5 and later grade4 guide pool expressions change in App');
for(const f of ['src/data/questionSets/eiken/grade5.json','src/learningProgress.ts','src/longTextBattleBalance.ts','src/monsterProfiles.json','src/monsterProfiles.ts'])assert.equal(fs.readFileSync(f,'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show','386d421:'+f],{encoding:'utf8',maxBuffer:6000000}).replaceAll('\r\n','\n'),f);
console.log('PASS: 228 active, 200 original identities, 28 grammar-guided additions, 21 reference-only; all prior prompts/other scopes intact; 34 guides including archived links; 115/211/228 pools; saves/HP/scoring unchanged.');
