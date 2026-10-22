import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('src/monsterDialogues.json');
const before=JSON.parse(execFileSync('git',['show','0b1cd5b:src/monsterDialogues.json'],{encoding:'utf8',maxBuffer:12e6}));
const approved=read('docs/monster-dialogue-drafts-2026-10-17/approved-english-2026-10-20.json');
assert.deepEqual(Object.keys(data),Object.keys(before));assert.equal(Object.keys(approved).length,645);
const published=JSON.parse(execFileSync('git',['show','5a9d34d:src/monsterDialogues.json'],{encoding:'utf8',maxBuffer:12e6}));
for(const [key,row] of Object.entries(data))if(!/^Eiken(?:2|3|Pre2):/.test(key))assert.deepEqual(row,published[key],`Already published dialogue: ${key}`);
// Compare against the release immediately before Grade 2 dialogue approval.
// Earlier review snapshots predate intentional, separately released curriculum changes.
const releaseBefore='785478405fa1bbfcbdf593a32ed698afae8433d5';
const currentBaseline=JSON.parse(execFileSync('git',['show',`${releaseBefore}:src/monsterDialogues.json`],{encoding:'utf8',maxBuffer:12e6}));
const sourceChanges=execFileSync('git',['diff',releaseBefore,'--name-only','--','src','package.json','package-lock.json','index.html'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.deepEqual(sourceChanges,['src/monsterDialogues.json'],'All other source, storage, questions and battle code must remain unchanged');
assert.equal(crypto.createHash('sha256').update(fs.readFileSync('scripts/test-grade5-grammar-guide-ui.mjs')).digest('hex'),'3b9f2654843bd83ddcdfb78811845ef94e3399e6dc8798601544f00bced179ef','Preserve pre-existing unrelated edits');
for(const [key,row]of Object.entries(data))if(!key.startsWith('Eiken2:'))assert.deepEqual(row,currentBaseline[key],`Grade 2 release scope: ${key}`);
let changed=0;
for(const [key,row]of Object.entries(data)){
 if(!approved[key]){assert.deepEqual(row,before[key],`Unrelated dialogue: ${key}`);continue;}
 assert.equal(row.name,before[key].name);assert.equal(row.entrance,before[key].entrance);assert.equal(row.defeat,before[key].defeat);
 for(const field of ['battle','aside','pressure'])assert.equal(row[field].length,before[key][field].length);
 assert.deepEqual(row,{...before[key],...approved[key]});
}
for(const [course,slug]of [['Eiken5','eiken5'],['Eiken4','eiken4'],['Eiken3','eiken3'],['EikenPre2','eikenpre2']]){
 const {records}=read(`docs/${slug}-dialogue-english-review-2026-10-20/review.json`);
 const proposal=read(`docs/${slug}-dialogue-english-review-2026-10-20/proposal.json`);
 assert.equal(records.length,129);let englishCount=0;
 for(const r of records){assert.equal(r.key.split(':')[0],course);assert.deepEqual(data[r.key],proposal[r.key]);let en=0;
  for(const l of r.lines){const a=Array.isArray(data[r.key][l.field])?data[r.key][l.field][l.index]:data[r.key][l.field];const b=Array.isArray(before[r.key][l.field])?before[r.key][l.field][l.index]:before[r.key][l.field];assert.equal(a,l.after);assert.equal(b,l.before);if(l.changed)changed++;if(l.language==='en')en++;}
  assert.equal(en,r.boss?6:4);englishCount+=en;
 }assert.equal(englishCount,546);
}
assert.equal(changed,2182);
const grade2=Object.fromEntries(Object.entries(data).filter(([key])=>key.startsWith('Eiken2:')));
assert.equal(Object.keys(grade2).length,129);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(grade2)).digest('hex'),'dea547ef21478a125bde7291d42b907bf0a589ce04bb0ff6245b3d69e265dbcc','Exact user-approved Grade 2 proposal');
let grade2Changed=0,grade2English=0;const byLevel={1:{monsters:0,english:0},2:{monsters:0,english:0},3:{monsters:0,english:0}};
for(const [key,row]of Object.entries(grade2)){
 const original=currentBaseline[key];assert.equal(row.entrance,original.entrance);assert.equal(row.defeat,original.defeat);
 const lines=[row.entrance,...row.battle,...row.aside,...row.pressure,row.defeat],en=lines.filter(l=>!/[^\x20-\x7e]/.test(l)).length;
 assert.equal(en*2,lines.length,key);grade2English+=en;
 const level=Number(key.match(/:[mc]([123])_/)[1]);byLevel[level].monsters++;byLevel[level].english+=en;
 for(const field of ['battle','aside','pressure'])for(let i=0;i<row[field].length;i++)if(row[field][i]!==original[field][i]){grade2Changed++;assert.match(row[field][i],/^[\x20-\x7e]+$/);}
}
assert.equal(grade2Changed,546);assert.equal(grade2English,546);
for(const row of Object.values(byLevel))assert.deepEqual(row,{monsters:43,english:182});
console.log('PASS: 645 approved identities; Grade 2 exactly matches approved 129 monsters / 546 changed slots; 546/1092 English lines per course; all other 1032 monsters and source/storage/gameplay files unchanged from 7854784; original IDs, counts, entrance/defeat preserved.');
