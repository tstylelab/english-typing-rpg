import fs from 'node:fs';
import assert from 'node:assert/strict';
import {load} from './load-typescript-data.mjs';
// Reconstruct only the approved Grade 1 revision for earlier immutable audits.
export const grade1ExpansionRelease=JSON.parse(fs.readFileSync(new URL('../../docs/grade1-level3-check-2026-10-19/release.json',import.meta.url)));
export function withoutGrade1Expansion(questions){
 const {legacyGrade1Sentences}=load('src/data/questionSets/eiken/grade1.ts');
 return {...questions,...Object.fromEntries(Object.entries(legacyGrade1Sentences).map(([c,qs])=>[c,{...questions[c],3:qs}]))};
}
export function beforeGrade1PromptChanges(current){
 const key=p=>JSON.stringify([p.course,p.level,p.text,p.translation,p.exampleEn??'']);
 const r=grade1ExpansionRelease;
 const report=JSON.parse(fs.readFileSync(new URL('../../docs/grade1-level3-check-2026-10-19/review.json',import.meta.url)));
 const newKeys=new Set(report.courses.flatMap(c=>c.proposed.map(q=>key({course:c.course,level:3,text:q.text,translation:q.meaning}))));
 const oldChanges=new Map(r.changedPrompts.map(p=>[key(p.after),p]));
 return current.flatMap(p=>{
  if(newKeys.has(key(p)))return [];
  const change=oldChanges.get(key(p));if(!change)return [p];
  assert.deepEqual(p,change.after,'Unexpected change outside approved prompt audit');
  return change.before?[change.before]:[];
 });
}
