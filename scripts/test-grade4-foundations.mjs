import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
const json=x=>JSON.parse(JSON.stringify(x));
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const r=JSON.parse(fs.readFileSync('docs/grade4-level3-foundations-2026-10-19/review.json','utf8'));
const {QUESTIONS}=load('src/data/questions.ts');
const {legacyGrade4Sentences:old,grade4Foundations:entries,getGrade4FoundationLimit:limit}=load('src/data/questionSets/eiken/grade4.ts');
const {grade4GrammarCards:cards,getGrade4GrammarCard:getCard}=load('src/data/grade4GrammarGuide.ts');
const {getQuestionMeaning:meaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt:prompt}=load('src/data/translationBattlePrompts.ts');
const {getQuestionGrammarPoint:point}=load('src/data/questionGrammarPoints.ts');
const qs=QUESTIONS.Eiken4[3];
assert.equal(sha({...QUESTIONS,Eiken4:{...QUESTIONS.Eiken4,3:old}}),r.sourceQuestionsSha256,'All other courses/levels exact');
assert.deepEqual(r.counts,{before:209,retained:209,removed:0,added:24,active:233,promptChanges:13});
assert.equal(qs.length,233);assert.equal(new Set(qs.map(q=>q.text.toLowerCase())).size,233);
for(const q of old)assert.deepEqual(json(qs.find(v=>v.text===q.text)),json(q),'Original stored identity unchanged');
const allPrompts=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json','utf8'));
const prior=JSON.parse(execFileSync('git',['show',r.baselineCommit+':src/data/translationBattlePrompts.json'],{encoding:'utf8',maxBuffer:8000000}));
assert.equal(sha(prior),r.sourcePromptsSha256);
const changed=new Set(r.changed.map(e=>e.question.text));
for(const e of prior){if(e.course==='Eiken4'&&e.level===3&&changed.has(e.text))continue;assert.deepEqual(allPrompts.find(v=>v.course===e.course&&v.level===e.level&&v.text===e.text&&v.translation===e.translation),e,'Unrelated prompt preserved: '+e.text);}
for(const row of r.active){
 const q=qs.find(q=>q.text===row.question.text);assert.deepEqual(json(q),row.question);
 assert.equal(meaning(json(q),'Eiken4'),row.meaning);assert.equal(getCard('Eiken4',3,q)?.id,row.card);
 assert.ok(point('Eiken4',3,{text:q.text}),'Saved reviews recover grammar without stored annotation');
 if(row.origin==='add'){
  assert.equal(prompt(q,'Eiken4',3).formNote,row.formNote);assert.ok(row.formNote);
  assert.ok(!/[a-z]|頭文字|\d+文字/i.test(row.formNote),'No answer spellings or letter counts');
  assert.equal(prompt({...q,translation:'wrong identity'},'Eiken4',3),undefined);
  assert.deepEqual(json(point('Eiken4',3,{text:q.text})),q.grammarPoint);
  assert.ok(q.text.length<=45);assert.match(q.text,/^[\x20-\x7e]+$/);
 }
}
for(const row of r.changed){assert.equal(prompt(row.question,'Eiken4',3).formNote,row.after.formNote);assert.equal(meaning(row.question,'Eiken4'),row.before?.meaning??row.after.meaning);assert.match(row.after.formNote,/別表現/);}
assert.deepEqual([0,6,7,13,14,50].map(limit),[142,142,183,183,233,233]);
for(const text of ['She was not busy yesterday.','I did not play tennis yesterday.','My bag is heavier than yours.','Ken is as tall as Tom.','You should not eat too much.'])assert.ok(entries.slice(0,limit(0)).some(e=>e.question.text===text),'Available from stage 1: '+text);
for(const text of ['I went to the library to study.','I will call you after I finish my homework.','This bag is too heavy for me.'])assert.ok(entries.slice(0,limit(7)).some(e=>e.question.text===text),'Available in second band');
assert.equal(entries.filter(e=>e.card==='to-purpose').length,4);
assert.equal(qs.filter(q=>q.text.includes('did not')).length,5);
assert.equal(qs.filter(q=>q.text.includes('because')).length,3);
assert.equal(qs.filter(q=>q.text.startsWith('If ')).length,3);
assert.equal(qs.filter(q=>/\bafter (I|she)\b/.test(q.text)).length,2);
assert.equal(cards.length,34);assert.equal(new Set(cards.map(c=>c.id)).size,34);
for(const c of cards){assert.ok(qs.some(q=>getCard('Eiken4',3,q)?.id===c.id));for(const f of ['title','term','pattern','tip','more'])assert.ok(c[f]?.trim());assert.equal(c.examples.length,2);}
assert.match(point('Eiken4',3,{text:'I forgot to bring my homework today.'}).note,/目的ではなく/);
assert.equal(getCard('Eiken5',3,qs[0]),undefined);
const normalize=s=>s.replaceAll('\r\n','\n');
const actual=normalize(fs.readFileSync('src/App.tsx','utf8')).replace("import { getGrade4FoundationLimit } from './data/questionSets/eiken/grade4';\n",'').replace('? getGrade4FoundationLimit(stageIndex)','? (stageIndex < 7 ? 20 : stageIndex < 14 ? 75 : Infinity)');
assert.equal(actual,normalize(execFileSync('git',['show',r.baselineCommit+':src/App.tsx'],{encoding:'utf8',maxBuffer:8000000})),'Only grade4 guide curriculum expression changed');
for(const f of ['src/data/questionSets/eiken/grade4.json','src/learningProgress.ts','src/longTextBattleBalance.ts','src/monsterProfiles.json','src/monsterProfiles.ts','src/data/questionMeaning.ts','src/data/translationBattlePrompts.ts'])assert.equal(normalize(fs.readFileSync(f,'utf8')),normalize(execFileSync('git',['show',r.baselineCommit+':'+f],{encoding:'utf8',maxBuffer:8000000})),f+' unchanged');
console.log('PASS: 209 original identities; 24 additions/233 active; 13 explicit practice constraints; 34 grammar links; 142/183/233 guide pools; unrelated prompts/courses, save code, damage/scoring unchanged.');
