import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
import {loadBattleDamage} from './lib/load-battle-damage.mjs';
const dir='docs/grade2-level3-expansion-proposal-2026-10-19/';
const p=JSON.parse(fs.readFileSync(dir+'proposal.json')),r=JSON.parse(fs.readFileSync(dir+'release.json'));
const audit=JSON.parse(fs.readFileSync('docs/grade2-level3-check-2026-10-19/review.json'));
const {QUESTIONS}=load('src/data/questions.ts');
const {legacyGrade2Sentences:old,grade2Curriculum,getGrade2CurriculumLimit}=load('src/data/questionSets/eiken/grade2.ts');
const {getGrammarCard,grammarGuides}=load('src/data/grammarGuides.ts');
const {getQuestionGrammarPoint}=load('src/data/questionGrammarPoints.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const plain=x=>JSON.parse(JSON.stringify(x)),sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(sha({...QUESTIONS,Eiken2:{...QUESTIONS.Eiken2,3:old}}),audit.questionsSha256,'All other questions exact; original L3 objects retained');
assert.equal(old.length,94);const qs=QUESTIONS.Eiken2[3];assert.equal(qs.length,166);
assert.equal(new Set(qs.map(q=>q.text)).size,166);
const identity=q=>JSON.stringify([q.text,q.translation,q.exampleEn??'']);
for(const q of old){assert.ok(qs.some(v=>identity(v)===identity(q)),'Keep existing storage identity');assert.ok(getQuestionGrammarPoint('Eiken2',3,{text:q.text}));}
for(const x of p.rows){
 const q=qs.find(q=>q.text===x.text);assert.ok(q);assert.equal(q.translation,x.meaning);assert.equal(getQuestionMeaning(q,'Eiken2'),x.meaning);
 assert.equal(getGrammarCard('Eiken2',3,q)?.id,'exp-'+x.targetId);
 assert.equal(getTranslationBattlePrompt(q,'Eiken2',3).meaning,x.meaning);
 assert.deepEqual(plain(getQuestionGrammarPoint('Eiken2',3,{text:q.text})),plain(q.grammarPoint));
}
for(const q of qs){const c=getGrammarCard('Eiken2',3,q);assert.ok(c);assert.ok(q.grammarPoint.note);assert.equal(c.examples.length,2);}
assert.equal(grammarGuides.Eiken2.cards.length,55);
assert.equal(getQuestionGrammarPoint('Eiken2',3,{text:'Can you tell me how to apply for the program?'}).pattern,'tell + 人 + how to + 動詞の原形');
assert.equal(getQuestionMeaning(qs.find(q=>q.text==='If the city improves the buses, fewer people may drive.'),'Eiken2'),'市がバスを改善すれば、車を運転する人が減るかもしれません。');
const prior=JSON.parse(execFileSync('git',['show',p.baselineCommit+':src/data/translationBattlePrompts.json'],{encoding:'utf8',maxBuffer:8000000}));
const current=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json'));
const key=e=>e.course+':'+e.level+':'+identity(e),changed=new Map(r.changedPrompts.map(e=>[e.text,e]));
for(const e of prior){const now=current.find(v=>key(v)===key(e));assert.ok(now);if(e.course==='Eiken2'&&e.level===3&&changed.has(e.text))assert.deepEqual(now,changed.get(e.text).after);else assert.deepEqual(now,e,'Keep unrelated prompt '+e.text);}
assert.equal(current.length,prior.length+72);assert.equal(changed.size,8);
for(const stage of [0,7,14]){const band=stage<7?1:stage<14?2:3;assert.equal(getGrade2CurriculumLimit(3,stage),grade2Curriculum[3].filter(e=>e.band<=band).length);}
assert.deepEqual([0,7,14].map(s=>getGrade2CurriculumLimit(3,s)),[57,130,166]);
// Damage uses the actual answer handler, including rounding and speed/miss effects.
const app=fs.readFileSync('src/App.tsx','utf8'),engine=loadBattleDamage(app),balance=[];
let calculations=0;
for(const input of ['text-only','voice-only'])for(let i=0;i<23;i++){
 const monster=engine.roster[3].challenge[i],boss=engine.boss('challenge',input,i,23),t=engine.tune('Eiken2',3,'challenge',input,i,monster.baseHp,boss);
 const ref=engine.tune('Eiken5',3,'challenge',input,i,monster.baseHp,boss);
 const mean=a=>a.reduce((n,q)=>n+q.text.length,0)/a.length;
 const oldLimit=Math.max(boss?8:4,Math.ceil(ref.maxQuestions*Math.min(1,Math.sqrt(mean(QUESTIONS.Eiken5[3])/mean(old)))));
 assert.equal(t.maxQuestions,oldLimit,'Addition should not change battle question limits');
 for(const speed of [.5,2,8])for(const ratio of [0,.3,1]){
  const damages=qs.map(q=>engine.damage({selectedDifficulty:'Eiken2',selectedLevel:3,mode:'challenge',inputMode:input,bossStage:boss,maxMonsterHp:t.monsterHp,maxQuestions:t.maxQuestions,missCount:Math.ceil(q.text.length*ratio),startTime:1000000-q.text.length/speed*1000},q.text));calculations+=damages.length;
  if(ratio===0)assert.ok(Math.min(...damages)*t.maxQuestions>=t.monsterHp,'Clean answers can win');
  if(ratio===1||boss&&ratio===.3)assert.ok(Math.max(...damages)*t.maxQuestions<t.monsterHp,'Repeated large errors cannot clear the bosses');
 }
 balance.push({input,stage:i+1,boss,...plain(t)});
}
fs.writeFileSync(dir+'balance-check.json',JSON.stringify({calculations,questionCount:166,pools:[57,130,166],unchangedQuestionLimits:true,bossError30pctCanWin:false,allStagesErrorPerCharacterCanWin:false,limitations:'Corrected wrong keystrokes per character, not percentage of wrong questions; isolated VM, no user storage. Practice modes unchanged.',stages:balance},null,2)+'\n');
console.log('PASS 166 questions / 94 retained storage identities / 72 approved additions; all other scopes and prompts preserved; 55 guides; pools 57/130/166; '+calculations+' actual damage checks.');
