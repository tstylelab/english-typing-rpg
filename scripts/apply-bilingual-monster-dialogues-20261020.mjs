import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('src/monsterDialogues.json'),approved={};
for(const [course,slug] of [['Eiken5','eiken5'],['Eiken4','eiken4']]){
 const folder=`docs/${slug}-dialogue-english-review-2026-10-20/`;
 const {records}=read(folder+'review.json'),proposal=read(folder+'proposal.json');
 const baseline=read(folder+'baseline.json');
 for(const [file,hash] of Object.entries(baseline))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,`Changed since review: ${file}`);
 assert.equal(records.length,129);assert.equal(Object.keys(proposal).length,129);
 for(const r of records){
  assert.ok(r.key.startsWith(course+':'));const p=proposal[r.key],before=data[r.key];assert.ok(p&&before);
  assert.equal(p.name,before.name);assert.equal(p.entrance,before.entrance);assert.equal(p.defeat,before.defeat);
  for(const l of r.lines){const old=Array.isArray(before[l.field])?before[l.field][l.index]:before[l.field];const next=Array.isArray(p[l.field])?p[l.field][l.index]:p[l.field];assert.equal(old,l.before);assert.equal(next,l.after);}
  approved[r.key]={battle:p.battle,aside:p.aside,pressure:p.pressure};
 }
}
assert.equal(Object.keys(approved).length,258);
fs.writeFileSync('docs/monster-dialogue-drafts-2026-10-17/approved-english-2026-10-20.json',JSON.stringify(approved,null,2)+'\n');
console.log('Prepared 258 approved dialogue overlays; runtime generation is a separate step.');
