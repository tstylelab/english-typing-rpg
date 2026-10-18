import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {load} from './lib/load-typescript-data.mjs';
import {hash,identity} from './lib/apply-translation-prompt-review.mjs';
import {withHistoricalReviewedQuestions} from './lib/historical-question-snapshot.mjs';
const dir='docs/translation-prompt-reviews-2026-10-18';
const audits=fs.readdirSync(dir).filter(f=>/^Eiken.*-L[123]\.json$/.test(f)).map(f=>JSON.parse(fs.readFileSync(dir+'/'+f,'utf8')));
const {QUESTIONS}=load('src/data/questions.ts');
const historicalQuestions=withHistoricalReviewedQuestions(QUESTIONS);
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const {getGrade4VocabularySynonyms}=load('src/data/grade4VocabularyPrompts.ts');
const entries=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json','utf8'));
const baseline=JSON.parse(execFileSync('git',['show','4637b24:src/data/translationBattlePrompts.json'],{encoding:'utf8',maxBuffer:5000000}));
const key=e=>`${e.course}:${e.level}:${identity(e)}`;
const allowed=new Set();let checked=0,changed=0;
for(const a of audits){
 assert.equal(hash(historicalQuestions),a.questionsSha256,'Only the separately approved Pre-2 L3 curriculum may differ from the historical audit');
 assert.equal(a.rows.length,historicalQuestions[a.course][a.level].length);
 assert.equal(a.changed,a.rows.filter(r=>r.changed).length);
 assert.equal(new Set(a.rows.map(identity)).size,a.rows.length);
 for(const r of a.rows){
  const q=historicalQuestions[a.course][a.level].find(q=>identity(q)===identity(r));assert.ok(q,r.text);
  const prompt=getTranslationBattlePrompt(q,a.course,a.level);
  assert.equal(getQuestionMeaning(q,a.course),r.after.meaning);
  assert.equal(getQuestionMeaning(JSON.parse(JSON.stringify(q)),a.course),r.after.meaning);
  assert.equal(JSON.stringify(prompt?.alternatives??getGrade4VocabularySynonyms(q,a.course,a.level)),JSON.stringify(r.after.alternatives));
  assert.deepEqual(prompt?.contrasts??[],r.after.contrasts);
  assert.equal(prompt?.formNote??'',r.after.formNote);
  if(r.changed){allowed.add(key({...r,course:a.course,level:a.level}));changed++;}
  checked++;
 }
}
const before=new Map(baseline.map(e=>[key(e),e])),after=new Map(entries.map(e=>[key(e),e]));
for(const [id,e] of before)assert.ok(after.has(id),'Do not remove a previously reviewed prompt');
const approved=JSON.parse(fs.readFileSync('docs/pre2-level3-grammar-proposal-2026-10-19/proposal.json','utf8'));
const newTargets=new Set(approved.proposed.filter(q=>q.origin!=='keep').map(q=>q.text));
const grade5Review=JSON.parse(fs.readFileSync('docs/grade5-level3-foundations-2026-10-19/review.json','utf8'));
const newGrade5Targets=new Set(grade5Review.active.filter(r=>r.origin==='add').map(r=>r.question.text));
for(const [id,e] of after){if(allowed.has(id))continue;if(e.course==='EikenPre2'&&e.level===3&&newTargets.has(e.text))continue;if(e.course==='Eiken5'&&e.level===3&&newGrade5Targets.has(e.text))continue;assert.deepEqual(e,before.get(id),'Unreviewed prompt changed: '+id);}
const p=(c,text)=>getTranslationBattlePrompt(QUESTIONS[c][2].find(q=>q.text===text),c,2);
assert.ok(p('Eiken2','be willing to').meaning.includes('いとわない'));
assert.ok(p('Eiken2','make sure that').meaning.includes('確実にする'));
assert.ok(p('EikenPre1Part1','check off').meaning.includes('チェック印'));
assert.ok(!p('EikenPre1Part1','check off').meaning.includes('消す'));
assert.equal(p('EikenPre1Part2','result from').contrasts[0].text,'result in');
assert.ok(!p('Eiken1Part2','let on').meaning.includes('うっかり'));
console.log('PASS',checked,'audited questions;',changed,'changes; published baseline outside audited rows intact.');
