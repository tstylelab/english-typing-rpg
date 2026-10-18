import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {load} from './lib/load-typescript-data.mjs';
import {getPriorMeaning} from './lib/translation-prompt-baseline.mjs';
const file='src/data/translationBattlePrompts.json';
let entries=JSON.parse(fs.readFileSync(file,'utf8'));
const baseline=JSON.parse(execFileSync('git',['show','4637b24:src/data/translationBattlePrompts.json'],{encoding:'utf8',maxBuffer:5000000}));
const {QUESTIONS}=load('src/data/questions.ts');
const dir='docs/translation-prompt-reviews-2026-10-18';
const audits=fs.readdirSync(dir).filter(f=>/^Eiken.*-L[123]\.json$/.test(f)).map(f=>[f,JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'))]);
function revise(course,level,text,patch,reason){
 const a=audits.find(([,a])=>a.course===course&&a.level===level)?.[1];assert.ok(a);
 const row=a.rows.find(r=>r.text===text);assert.ok(row,text);
 let e=entries.find(e=>e.course===course&&e.level===level&&e.text===text);
 if(!e){const q=QUESTIONS[course][level].find(q=>q.text===text);e={course,level,text,translation:q.translation,...(q.exampleEn?{exampleEn:q.exampleEn}:{}),previousMeaning:getPriorMeaning(q,course),...row.before};entries.push(e);}
 Object.assign(row.after,patch);Object.assign(e,patch);
 row.changed=JSON.stringify(row.before)!==JSON.stringify(row.after);
 if(reason){row.reason=reason;e.reason=reason;}
 row.recheck='初稿を再読し、過度の限定・比較の精度・日本語を再確認。';
}
// A comparison should not falsely teach that borrowing money is always free.
revise('EikenPre2',1,'rent',{contrasts:[{text:'borrow',note:'物・金を一時的に借りる'}]},'有料で借りる表現と比較するが、借金の利息まで否定しない。');
revise('Eiken2',1,'salary',{meaning:'（ふつう月・年単位で決める）定期的な給料',contrasts:[{text:'wage',note:'時間などに応じた賃金が典型'}]},'典型的な支払われ方を示し、二語の使い分けを絶対的な定義にしない。');
revise('Eiken2',1,'wage',{meaning:'（ふつう時間・日・週などに応じた）賃金',contrasts:[{text:'salary',note:'定期的な固定給が典型'}]},'典型的な支払われ方を示し、二語の使い分けを絶対的な定義にしない。');
revise('EikenPre1Part2',1,'legal',{meaning:'法律の・法律に関する／合法の'},'法律に関係することと、法にかなっていることの両義を残す。');
revise('Eiken1Part1',1,'density',{meaning:'（単位面積・体積内の）密集の程度・密度'},'面積だけでなく体積についても用いる語であることを明示する。');
revise('Eiken3',3,'This machine can be used by anyone.',{meaning:'この機械は誰によっても使用できます。'},'受け身の視点を保ち、読みやすい日本語に整える。');
// Remove additions whose value is too small for the beginner vocabulary.
for(const text of ['basket','slow']){
 const a=audits.find(([,a])=>a.course==='Eiken5'&&a.level===1)[1];const row=a.rows.find(r=>r.text===text);assert.ok(row);
 entries=entries.filter(e=>!(e.course==='Eiken5'&&e.level===1&&e.text===text));
 const prior=baseline.find(e=>e.course==='Eiken5'&&e.level===1&&e.text===text);if(prior)entries.push(prior);
 row.after=row.before;row.changed=false;row.reason='再読で補足の必要性が低いと判断し、元の簡潔な表示を維持。';row.recheck='不要な補足案を撤回。';
}
for(const [name,a] of audits){
 a.changed=a.rows.filter(r=>r.changed).length;
 a.status='editorial-reviewed';
 a.recheckedOn='2026-10-19';
 // These are references for the scoped ambiguities, not a claim of exhaustive dictionary matching.
 a.sources=[...new Set(a.sources)].filter(s=>!s.endsWith('/take-effect')&&!s.endsWith('/word-order-and-focus'));
 if(a.course==='EikenPre1Part2'&&a.level===2)a.sources.push('https://dictionary.cambridge.org/dictionary/english/effect');
 if(a.course==='Eiken3'&&a.level===2)a.sources.push('https://dictionary.cambridge.org/dictionary/english/couple-of');
 if(a.course==='Eiken2'&&a.level===1)a.sources.push('https://dictionary.cambridge.org/dictionary/english/salary','https://dictionary.cambridge.org/dictionary/english/wage');
 for(const r of a.rows)r.review='英文と現在の和訳・比較情報を確認。疑わしい箇所の例文・語義を重点確認。';
 fs.writeFileSync(dir+'/'+name,JSON.stringify(a,null,2)+'\n');
}
fs.writeFileSync(file,JSON.stringify(entries,null,2)+'\n');
console.log(audits.reduce((s,[,a])=>s+a.changed,0),'changes finalized across',audits.length,'course levels.');
