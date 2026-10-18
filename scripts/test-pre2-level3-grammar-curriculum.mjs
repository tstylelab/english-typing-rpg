import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
import {withHistoricalReviewedQuestions} from './lib/historical-question-snapshot.mjs';
const p=JSON.parse(fs.readFileSync('docs/pre2-level3-grammar-proposal-2026-10-19/proposal.json','utf8'));
const {QUESTIONS}=load('src/data/questions.ts');
const {legacyPre2Sentences,pre2Curriculum,getPre2CurriculumLimit}=load('src/data/questionSets/eiken/pre2.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getQuestionGrammarPoint}=load('src/data/questionGrammarPoints.ts');
const {getGrammarCard,grammarGuides}=load('src/data/grammarGuides.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const {pre2GrammarAssignments,legacyPre2GrammarAssignments}=load('src/data/pre2GrammarAssignments.ts');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(hash(withHistoricalReviewedQuestions(QUESTIONS)),p.sourceQuestionsSha256,'Every other scope and all original Pre-2 identities stay exact');
assert.equal(legacyPre2Sentences.length,173);assert.equal(QUESTIONS.EikenPre2[3].length,158);
const live=QUESTIONS.EikenPre2[3],identity=q=>JSON.stringify([q.text,q.translation,q.exampleEn??'']);
assert.equal(new Set(live.map(identity)).size,158);
assert.equal(new Set(live.map(q=>q.text)).size,158);
const oldPromptEntries=JSON.parse(execFileSync('git',['show','e17b7fa:src/data/translationBattlePrompts.json'],{encoding:'utf8',maxBuffer:6000000}));
const currentPromptEntries=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json','utf8'));
const pk=e=>e.course+':'+e.level+':'+identity(e),currentMap=new Map(currentPromptEntries.map(e=>[pk(e),e]));
for(const e of oldPromptEntries)assert.deepEqual(currentMap.get(pk(e)),e,'Preserve every previous display correction, including archived review questions');
assert.equal(currentPromptEntries.filter(e=>e.course==='EikenPre2'&&e.level===3).length-oldPromptEntries.filter(e=>e.course==='EikenPre2'&&e.level===3).length,65);
for(const draft of p.proposed){
 const q=live.find(q=>q.text===draft.text);assert.ok(q,draft.text);
 if(draft.origin==='keep')assert.equal(q.translation,p.existing.find(e=>e.number===draft.sourceNumber).translation);
 else assert.equal(q.translation,draft.ja);
 assert.equal(getQuestionMeaning(q,'EikenPre2'),draft.ja);
 assert.equal(getQuestionMeaning(JSON.parse(JSON.stringify(q)),'EikenPre2'),draft.ja);
 assert.ok(q.grammarPoint.note.startsWith(draft.focus));
 assert.deepEqual(getQuestionGrammarPoint('EikenPre2',3,{text:q.text}),q.grammarPoint);
 assert.ok(getGrammarCard('EikenPre2',3,q)?.id,draft.text);
 if(draft.origin!=='keep'){
  const prompt=getTranslationBattlePrompt(q,'EikenPre2',3);assert.ok(prompt?.formNote);assert.ok(!/[a-z]/i.test(prompt.formNote));
 }
}
for(const old of p.existing){
 assert.ok(legacyPre2Sentences.some(q=>identity(q)===identity(old)));
 if(old.status==='keep')assert.ok(live.some(q=>identity(q)===identity(old)));
 else assert.ok(!live.some(q=>q.text===old.text),'Removed/revised source stays out of normal play');
 assert.ok(getQuestionGrammarPoint('EikenPre2',3,{text:old.text}));
 assert.ok(getGrammarCard('EikenPre2',3,{text:old.text}),'Historical review card remains readable');
}
const ids=new Set(grammarGuides.EikenPre2.cards.map(c=>c.id));assert.equal(ids.size,grammarGuides.EikenPre2.cards.length);
for(const q of live)assert.ok(ids.has(pre2GrammarAssignments[q.text]));
for(const c of grammarGuides.EikenPre2.cards){for(const key of ['title','term','pattern','tip','more'])assert.ok(c[key]?.trim());assert.equal(c.examples.length,2);}
const oldAssignments=JSON.parse(execFileSync('git',['show','e17b7fa:src/data/pre2GrammarAssignments.ts'],{encoding:'utf8'}).match(/= (\{[\s\S]*\});/)[1]);
assert.deepEqual(JSON.parse(JSON.stringify(legacyPre2GrammarAssignments)),oldAssignments,'Keep historical bookmark/card IDs');
const bands=pre2Curriculum[3];for(let i=1;i<bands.length;i++)assert.ok(bands[i].band>=bands[i-1].band);
for(const [stage,band] of [[0,1],[7,2],[14,3]])assert.equal(getPre2CurriculumLimit(3,stage),bands.filter(e=>e.band<=band).length);
assert.deepEqual([0,7,14].map(s=>getPre2CurriculumLimit(3,s)),[67,135,158]);
for(const f of ['src/App.tsx','src/learningProgress.ts','src/longTextBattleBalance.ts','src/monsterProfiles.json','src/monsterProfiles.ts','src/data/pre2Balance.ts']){
 let actual=fs.readFileSync(f,'utf8').replaceAll('\r\n','\n');
 if(f==='src/App.tsx')actual=actual.replace("import { getGrade5FoundationLimit } from './data/questionSets/eiken/grade5';\n",'').replace('? getGrade5FoundationLimit(stageIndex)','? (stageIndex < 7 ? 16 : stageIndex < 14 ? 66 : Infinity)');
 assert.equal(actual,execFileSync('git',['show','e17b7fa:'+f],{encoding:'utf8',maxBuffer:6000000}).replaceAll('\r\n','\n'),f);
}
console.log('PASS: approved 158 questions, 93 retained identities / 65 new; 173 legacy reviews; other scopes, saves, monster IDs and balance code unchanged; all grammar links and 67/135/158 pools.');
