import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const protectedPaths=['docs/eiken3-dialogue-english-review-2026-10-20','docs/eiken4-dialogue-english-review-2026-10-20','docs/monster-dialogue-drafts-2026-10-17/approved-english-2026-10-20.json','docs/monster-dialogue-drafts-2026-10-17/build-runtime.mjs','docs/eiken5-dialogue-english-review-2026-10-20','docs/monster-dialogue-drafts-2026-10-17/catalogue.json','src','scripts/test-grade5-grammar-guide-ui.mjs','package.json','package-lock.json','index.html'];
function files(p){return fs.statSync(path.join(root,p)).isDirectory()?fs.readdirSync(path.join(root,p)).flatMap(n=>files(p+'/'+n)):[p];}
const currentHashes=Object.fromEntries(protectedPaths.flatMap(files).map(p=>[p,hash(p)]));
const baselineFile=path.join(here,'baseline.json');
if(!fs.existsSync(baselineFile))fs.writeFileSync(baselineFile,JSON.stringify(currentHashes,null,2)+'\n');
assert.deepEqual(currentHashes,JSON.parse(fs.readFileSync(baselineFile,'utf8')),'Game source or existing work changed since review began');
const runtime=read('src/monsterDialogues.json'),drafts=new Map();
for(const l of [1,2,3]){
 const file=path.join(here,`level${l}.txt`);if(!fs.existsSync(file))continue;
 for(const block of fs.readFileSync(file,'utf8').trim().split(/\r?\n\s*\r?\n/)){
  const [id,...lines]=block.split(/\r?\n/);assert.ok(!drafts.has(id));
  drafts.set(id,lines.map(line=>{const a=line.split(' | ');assert.equal(a.length,2,`${id}: translation pair`);return a;}));
 }
}
const records=[],allNew=[],jp=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
for(const level of [1,2,3])for(const meta of read('docs/monster-dialogue-drafts-2026-10-17/catalogue.json').filter(r=>r.course==='EikenPre2'&&r.level===level)){
 const key=`EikenPre2:${meta.id}`,before=runtime[key];assert.ok(before);assert.equal(meta.name,before.name);
 const boss=before.battle.length===5,after=structuredClone(before),proposal=drafts.get(meta.id);
 const englishAside=before.aside.findIndex(s=>!jp.test(s)&&/[A-Za-z]{2,}/.test(s));
 const mixedAside=before.aside.findIndex(s=>/[A-Za-z]{2,}/.test(s));
 const ai=englishAside<0?Math.max(0,mixedAside):englishAside;
 const slots=[['battle',0],['battle',1],['aside',ai],['pressure',0],...(boss?[['battle',3],['aside',ai===0?1:0]]:[])];
 if(proposal){assert.equal(proposal.length,slots.length,meta.id);proposal.forEach(([en,meaning],i)=>{
  assert.ok(en.trim()&&meaning.trim());assert.ok(!jp.test(en),`${meta.id}: English only`);assert.ok(/[A-Za-z]/.test(en));
  assert.ok(en.length<=76,`${meta.id}: long English (${en.length})`);
  assert.ok(en.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g).length<=15,`${meta.id}: long sentence`);
  const [field,index]=slots[i];after[field][index]=en;allNew.push({id:meta.id,field,index,en,meaning});
 });}
 const lines=[];for(const field of ['entrance','battle','aside','pressure','defeat']){
  const a=Array.isArray(before[field])?before[field]:[before[field]],b=Array.isArray(after[field])?after[field]:[after[field]];
  assert.equal(a.length,b.length);a.forEach((old,i)=>{const at=slots.findIndex(([f,ix])=>f===field&&ix===i);lines.push({field,index:i,before:old,after:b[i],changed:old!==b[i],meaning:proposal&&at>=0?proposal[at][1]:'',language:jp.test(b[i])?(/[A-Za-z]{2,}/.test(b[i])?'mixed':'ja'):'en'});});
 }
 assert.equal(after.entrance,before.entrance);assert.equal(after.defeat,before.defeat);
 if(proposal)assert.equal(lines.filter(l=>l.language==='en').length,boss?6:4,`${meta.id}: half English`);
 const art=`public/monsters/eikenpre2-v2-level${level}/256/${meta.id}.webp`;assert.ok(fs.existsSync(path.join(root,art)));
 records.push({id:meta.id,key,name:meta.name,voice:meta.voice,visual:meta.visualCue,level,boss,group:meta.id.startsWith('m')?'training':'battle',ready:Boolean(proposal),image:`/monsters/eikenpre2-v2-level${level}/256/${meta.id}.webp`,lines});
}
assert.equal(records.length,129);for(const id of drafts.keys())assert.ok(records.some(r=>r.id===id));
const lines=records.flatMap(r=>r.lines),ready=records.filter(r=>r.ready);
const summary={date:'2026-10-20',course:'EikenPre2',reviewOnly:true,monsters:129,ready:ready.length,totalLines:lines.length,english:lines.filter(l=>l.language==='en').length,mixed:lines.filter(l=>l.language==='mixed').length,japanese:lines.filter(l=>l.language==='ja').length,changed:lines.filter(l=>l.changed).length,proposedEnglishSlots:allNew.length,maxCharacters:Math.max(0,...allNew.map(l=>l.en.length)),maxWords:Math.max(0,...allNew.map(l=>l.en.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g).length)),sourceUnchanged:true,protectedFiles:Object.keys(currentHashes).length,byLevel:[1,2,3].map(level=>{const a=records.filter(r=>r.level===level);return {level,monsters:a.length,ready:a.filter(r=>r.ready).length,totalLines:a.flatMap(r=>r.lines).length,english:a.flatMap(r=>r.lines).filter(l=>l.language==='en').length};})};
assert.equal(summary.totalLines,1092);
if(process.argv.includes('--complete')){assert.equal(ready.length,129);assert.equal(allNew.length,546);assert.equal(summary.english,546);}
const dup=new Map();for(const line of allNew){const key=line.en.toLowerCase();if(!dup.has(key))dup.set(key,[]);dup.get(key).push(line);}summary.repeatedEnglish=[...dup].filter(([,a])=>a.length>1).map(([text,a])=>({text,ids:a.map(x=>x.id)}));
fs.writeFileSync(path.join(here,'review.json'),JSON.stringify({summary,records},null,2)+'\n');
fs.writeFileSync(path.join(here,'proposal.json'),JSON.stringify(Object.fromEntries(ready.map(r=>{const original=structuredClone(runtime[r.key]);for(const l of r.lines)if(Array.isArray(original[l.field]))original[l.field][l.index]=l.after;else original[l.field]=l.after;return [r.key,original];})),null,2)+'\n');
let html=fs.readFileSync(path.join(here,'page-template.html'),'utf8');
html=html.replace('/*REVIEW_DATA*/',JSON.stringify({summary,records}).replaceAll('<','\\u003c'));
fs.writeFileSync(path.join(here,'index.html'),html);console.log(JSON.stringify(summary,null,2));
