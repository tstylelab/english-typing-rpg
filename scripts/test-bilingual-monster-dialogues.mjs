import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('src/monsterDialogues.json');
const before=JSON.parse(execFileSync('git',['show','0b1cd5b:src/monsterDialogues.json'],{encoding:'utf8',maxBuffer:12e6}));
const approved=read('docs/monster-dialogue-drafts-2026-10-17/approved-english-2026-10-20.json');
assert.deepEqual(Object.keys(data),Object.keys(before));assert.equal(Object.keys(approved).length,516);
const published=JSON.parse(execFileSync('git',['show','5a9d34d:src/monsterDialogues.json'],{encoding:'utf8',maxBuffer:12e6}));
for(const [key,row] of Object.entries(data))if(!/^Eiken(?:3|Pre2):/.test(key))assert.deepEqual(row,published[key],`Already published dialogue: ${key}`);
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
 const baseline=read(`docs/${slug}-dialogue-english-review-2026-10-20/baseline.json`);
 for(const [file,hash]of Object.entries(baseline))if((file.startsWith('src/')&&file!=='src/monsterDialogues.json')||['scripts/test-grade5-grammar-guide-ui.mjs','package.json','package-lock.json','index.html'].includes(file))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,`Protected source: ${file}`);
 assert.equal(records.length,129);let englishCount=0;
 for(const r of records){assert.equal(r.key.split(':')[0],course);assert.deepEqual(data[r.key],proposal[r.key]);let en=0;
  for(const l of r.lines){const a=Array.isArray(data[r.key][l.field])?data[r.key][l.field][l.index]:data[r.key][l.field];const b=Array.isArray(before[r.key][l.field])?before[r.key][l.field][l.index]:before[r.key][l.field];assert.equal(a,l.after);assert.equal(b,l.before);if(l.changed)changed++;if(l.language==='en')en++;}
  assert.equal(en,r.boss?6:4);englishCount+=en;
 }assert.equal(englishCount,546);
}
assert.equal(changed,2182);
console.log('PASS: 516 approved identities; 2182 changed speech slots; 546/1092 English lines per course; other 645 monsters unchanged; published grade 5/4 unchanged; entrance/defeat, all IDs and other source/storage/gameplay files unchanged.');
