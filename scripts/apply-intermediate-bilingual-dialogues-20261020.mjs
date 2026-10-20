import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const destination='docs/monster-dialogue-drafts-2026-10-17/approved-english-2026-10-20.json';
const data=read('src/monsterDialogues.json'),approved=read(destination);
assert.equal(Object.keys(approved).length,258,'One-time application to the published grade 5/4 baseline');
for(const [course,slug] of [['Eiken3','eiken3'],['EikenPre2','eikenpre2']]){
 const folder=`docs/${slug}-dialogue-english-review-2026-10-20/`;
 const {summary,records}=read(folder+'review.json'),proposal=read(folder+'proposal.json');
 for(const [file,hash] of Object.entries(read(folder+'baseline.json')))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,`Changed since review: ${file}`);
 assert.equal(summary.ready,129);assert.equal(summary.english,546);assert.equal(records.length,129);assert.equal(Object.keys(proposal).length,129);
 for(const r of records){
  assert.ok(r.key.startsWith(course+':'));assert.ok(!approved[r.key]);const p=proposal[r.key],before=data[r.key];assert.ok(p&&before);
  assert.equal(p.name,before.name);assert.equal(p.entrance,before.entrance);assert.equal(p.defeat,before.defeat);
  for(const field of ['battle','aside','pressure'])assert.equal(p[field].length,before[field].length);
  for(const l of r.lines){const old=Array.isArray(before[l.field])?before[l.field][l.index]:before[l.field];const next=Array.isArray(p[l.field])?p[l.field][l.index]:p[l.field];assert.equal(old,l.before);assert.equal(next,l.after);}
  approved[r.key]={battle:p.battle,aside:p.aside,pressure:p.pressure};
 }
}
assert.equal(Object.keys(approved).length,516);
fs.writeFileSync(destination,JSON.stringify(approved,null,2)+'\n');
console.log('Added 258 approved grade 3/pre-2 overlays; preserved all 258 published grade 5/4 overlays.');
