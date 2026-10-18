import fs from 'node:fs';
import assert from 'node:assert/strict';
const file='src/data/translationBattlePrompts.json';
const entries=JSON.parse(fs.readFileSync(file,'utf8'));
const fixes=[
 ['Eiken2','persuade A to do',{meaning:'Aを説得して〜させる（Aは人、doは動詞の原形）'}],
 ['Eiken2','make sure that',{meaning:'〜であることを確かめる・確実にする（後ろに文）'}],
 ['Eiken2','take for granted',{meaning:'〜を当然として疑わない／ありがたさを意識しない',reason:'当然と見なす用法と、感謝・評価が不足する用法の両方を残す。'}],
 ['Eiken2','play a role in',{meaning:'〜の中で役割を果たす'}],
 ['EikenPre1Part1','deprive A of B',{alternatives:[{text:'rob A of B',note:'AからBを奪う'}]}],
 ['EikenPre1Part2','see through',{alternatives:[{text:'detect',note:'うそ・ごまかしなどを見抜く'}]}],
 ['Eiken3','as soon as possible',{alternatives:[{text:'as early as possible',note:'時期をできるだけ早く'}]}],
];
for(const [course,text,change] of fixes){
 const auditPath=`docs/translation-prompt-reviews-2026-10-18/${course}-L2.json`;
 const audit=JSON.parse(fs.readFileSync(auditPath,'utf8'));
 const p=entries.find(e=>e.course===course&&e.level===2&&e.text===text);
 const row=audit.rows.find(r=>r.text===text);assert.ok(p&&row?.changed,text);
 Object.assign(p,change);for(const key of ['meaning','alternatives','contrasts','formNote'])if(key in change)row.after[key]=change[key];
 if(change.reason)row.reason=change.reason;
 row.recheck='変更案を再読し、意味の範囲と比較対象を調整。';
 fs.writeFileSync(auditPath,JSON.stringify(audit,null,2)+'\n');
}
for(const [script,from,to] of [
 ['scripts/review-eiken2-level2-prompts-20261018.mjs','説得してAが〜する気になるようにする（doは動詞の原形）','Aを説得して〜させる（Aは人、doは動詞の原形）'],
 ['scripts/review-eiken2-level2-prompts-20261018.mjs',"add('make sure that','','ensure that|〜であることを確実にする');","add('make sure that','〜であることを確かめる・確実にする（後ろに文）','ensure that|〜であることを確実にする');"],
 ['scripts/review-eiken2-level2-prompts-20261018.mjs','〜を当たり前と思い、ありがたさを意識しない','〜を当然として疑わない／ありがたさを意識しない'],
 ['scripts/review-eiken2-level2-prompts-20261018.mjs','〜の中で役割を果たす（重要な役割に限らない）','〜の中で役割を果たす'],
 ['scripts/review-pre1-level2-prompts-20261018.mjs','rob A of B|人などから大切なものを奪う','rob A of B|AからBを奪う'],
 ['scripts/review-pre1-level2-prompts-20261018.mjs','see past|うわべに惑わされず見抜く','detect|うそ・ごまかしなどを見抜く'],
 ['scripts/review-lower-level2-prompts-20261018.mjs','as quickly as possible|できるだけ早く','as early as possible|時期をできるだけ早く'],
]){const s=fs.readFileSync(script,'utf8');assert.ok(s.includes(from));fs.writeFileSync(script,s.replace(from,to));}
fs.writeFileSync(file,JSON.stringify(entries,null,2)+'\n');
console.log('Refined',fixes.length,'reviewed prompts.');
