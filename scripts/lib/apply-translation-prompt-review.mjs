import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from './load-typescript-data.mjs';
import {getPriorMeaning} from './translation-prompt-baseline.mjs';

export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const identity=q=>JSON.stringify([q.text,q.translation,q.exampleEn??'']);
export function labels(value=''){
 return value?value.split(';').map(item=>{const [text,note]=item.split('|');assert.ok(text&&note,item);assert.ok(note.length<=24,item);return {text,note};}):[];
}
// A blank meaning keeps the current wording; omitted arrays keep existing comparisons.
export function applyReview({course,level,date,edits,auditPath,sources=[]}){
 assert.ok(!fs.existsSync(auditPath),'Do not overwrite the original before/after audit');
 const {QUESTIONS}=load('src/data/questions.ts');
 const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
 const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
 const {getGrade4VocabularySynonyms}=load('src/data/grade4VocabularyPrompts.ts');
 const file='src/data/translationBattlePrompts.json';
 const entries=JSON.parse(fs.readFileSync(file,'utf8'));
 const outside=entries.filter(e=>e.course!==course||e.level!==level);
 const byText=new Map(edits.map(e=>[e.text,e]));assert.equal(byText.size,edits.length);
 const questions=QUESTIONS[course][level];
 const snapshot=q=>{const p=getTranslationBattlePrompt(q,course,level);return {meaning:getQuestionMeaning(q,course),alternatives:p?.alternatives??getGrade4VocabularySynonyms(q,course,level),contrasts:p?.contrasts??[],formNote:p?.formNote??''};};
 const rows=questions.map(q=>{
  const before=snapshot(q),change=byText.get(q.text);
  const after=change?{meaning:change.meaning||before.meaning,alternatives:change.alternatives===undefined?before.alternatives:labels(change.alternatives),contrasts:change.contrasts===undefined?before.contrasts:labels(change.contrasts),formNote:change.formNote??before.formNote}:before;
  const changed=JSON.stringify(before)!==JSON.stringify(after);
  if(change){assert.ok(changed,'No-op correction: '+q.text);let p=entries.find(e=>e.course===course&&e.level===level&&identity(e)===identity(q));
   if(!p){p={course,level,text:q.text,translation:q.translation,...(q.exampleEn?{exampleEn:q.exampleEn}:{}),previousMeaning:getPriorMeaning(q,course)};entries.push(p);}
   Object.assign(p,after,{reason:change.reason});
  }
  return {text:q.text,translation:q.translation,exampleEn:q.exampleEn,before,after,changed,reason:change?.reason??'現在の語義・例文・比較情報を点検し、今回の変更は不要と判断。'};
 });
 assert.equal(rows.filter(r=>r.changed).length,edits.length,'Every edit matches exactly one question');
 assert.equal(hash(outside),hash(entries.filter(e=>e.course!==course||e.level!==level)));
 const audit={date,course,level,reviewed:rows.length,changed:edits.length,questionsSha256:hash(QUESTIONS),outsidePromptsSha256:hash(outside),sources,rows};
 fs.mkdirSync(path.dirname(auditPath),{recursive:true});
 fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
 fs.writeFileSync(file,JSON.stringify(entries,null,2)+'\n');
 console.log('Reviewed',course,level,rows.length,'questions;',edits.length,'changed.');
 return audit;
}
