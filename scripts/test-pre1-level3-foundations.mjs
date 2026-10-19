import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
import {loadBattleDamage} from './lib/load-battle-damage.mjs';
import {withoutGrade1Expansion,beforeGrade1PromptChanges} from './lib/grade1-expansion-audit-snapshot.mjs';
const dir='docs/pre1-level3-foundations-2026-10-19/';
const report=JSON.parse(fs.readFileSync(dir+'release.json'));
const {QUESTIONS}=load('src/data/questions.ts');
const {legacyPre1SentencesByCourse:old}=load('src/data/questionSets/eiken/pre1.ts');
const {getQuestionGrammarPoint}=load('src/data/questionGrammarPoints.ts');
const {getGrammarCard,grammarGuides}=load('src/data/grammarGuides.ts');
const {getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const plain=x=>JSON.parse(JSON.stringify(x));
const sha=s=>createHash('sha256').update(s).digest('hex');
const restored=withoutGrade1Expansion(QUESTIONS);
const oldAssignments=load('src/data/pre1GrammarAssignments.ts').pre1GrammarAssignments;
for(const c of report.courses){
 const qs=QUESTIONS[c.course][3],previous=old[c.course];
 assert.equal(previous.length,75);assert.equal(qs.length,111);assert.equal(new Set(qs.map(q=>q.text)).size,111);
 restored[c.course]={...QUESTIONS[c.course],3:previous};
 for(let i=0;i<75;i++){const {grammarPoint,...legacy}=plain(qs[i]);assert.deepEqual(legacy,plain(previous[i]),'Exact original question identity/order');assert.ok(grammarPoint);assert.equal(getGrammarCard(c.course,3,qs[i]).id,oldAssignments[c.course][qs[i].text],'Old guide IDs preserved');}
 const counts={};
 for(const row of c.addedRows){counts[row.topic]=(counts[row.topic]??0)+1;const q=qs.find(q=>q.text===row.question.text);assert.deepEqual(plain(q),row.question);const p=getTranslationBattlePrompt(q,c.course,3);assert.ok(p);assert.equal(p.meaning,row.question.translation);assert.equal(p.formNote,row.formNote);assert.deepEqual(plain(p.alternatives),row.alternatives);assert.ok(getGrammarCard(c.course,3,q).id.startsWith(c.course.endsWith('1')?'core-a-':'core-b-'));}
 assert.equal(Object.keys(counts).length,12);assert.ok(Object.values(counts).every(n=>n===3));
 for(const q of qs){const card=getGrammarCard(c.course,3,q);assert.ok(card);assert.ok(card.tip&&card.more&&card.pattern);assert.equal(card.examples.length,2);assert.deepEqual(plain(getQuestionGrammarPoint(c.course,3,{text:q.text})),plain(q.grammarPoint),'Stored reviews resolve annotations by original text');}
 assert.equal(grammarGuides[c.course].cards.length,c.course.endsWith('1')?49:52);
}
assert.equal(sha(JSON.stringify(restored)),report.baseline.questionsSha256,'Every other course/level remains exact');
for(const [p,hash]of Object.entries(report.baseline.sourceHashes))if(!p.endsWith('translationBattlePrompts.json'))assert.equal(sha(fs.readFileSync(p)),hash,p+' unchanged');
const before=JSON.parse(execFileSync('git',['show',report.baseline.head+':src/data/translationBattlePrompts.json'],{encoding:'utf8',maxBuffer:8000000}));
const now=beforeGrade1PromptChanges(JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json')));
assert.equal(before.length,report.baseline.promptCount);assert.deepEqual(now.slice(0,before.length),before);assert.equal(now.length,before.length+72);
// Real answer handler, with fixed timing. Miss rate is corrected wrong keystrokes / answer characters.
const engine=loadBattleDamage(fs.readFileSync('src/App.tsx','utf8')),stages=[];
const mean=qs=>qs.reduce((n,q)=>n+q.text.length,0)/qs.length;
let calculations=0;
for(const c of report.courses)for(const input of ['text-only','voice-only'])for(let stage=0;stage<23;stage++){
 const monster=engine.roster[3].challenge[stage],boss=engine.boss('challenge',input,stage,23);
 const tuning=engine.tune(c.course,3,'challenge',input,stage,monster.baseHp,boss),ref=engine.tune('Eiken5',3,'challenge',input,stage,monster.baseHp,boss);
 const oldLimit=Math.max(boss?8:4,Math.ceil(ref.maxQuestions*Math.min(1,Math.sqrt(mean(QUESTIONS.Eiken5[3])/mean(old[c.course])))));
 const oldHp=Math.round(ref.monsterHp*oldLimit/ref.maxQuestions);
 for(const speed of [.5,2,8])for(const rate of [0,.3,1]){
  const damage=QUESTIONS[c.course][3].map(q=>engine.damage({selectedDifficulty:c.course,selectedLevel:3,mode:'challenge',inputMode:input,bossStage:boss,maxMonsterHp:tuning.monsterHp,maxQuestions:tuning.maxQuestions,missCount:Math.ceil(q.text.length*rate),startTime:1000000-q.text.length/speed*1000},q.text));
  calculations+=damage.length;
  if(rate===0)assert.ok(Math.min(...damage)*tuning.maxQuestions>=tuning.monsterHp,'Clean answers can win');
  if(rate===1||boss&&rate===.3)assert.ok(Math.max(...damage)*tuning.maxQuestions<tuning.monsterHp,'Repeated mistakes cannot clear boss');
 }
 stages.push({course:c.course,input,stage:stage+1,boss,before:{meanLength:mean(old[c.course]),maxQuestions:oldLimit,monsterHp:oldHp},after:{meanLength:mean(QUESTIONS[c.course][3]),...plain(tuning)},requiredDamagePerQuestion:tuning.monsterHp/tuning.maxQuestions});
}
fs.writeFileSync(dir+'balance-check.json',JSON.stringify({calculations,questionCount:222,allStagesErrorPerCharacterCanWin:false,bossError30pctCanWin:false,limitsChanged:stages.filter(s=>s.before.maxQuestions!==s.after.maxQuestions).length,limitations:'Isolated actual answer handler; corrected wrong keystrokes per character, not percentage of wrong questions. Real learning effort is not measured. No player storage or balance code edited.',stages},null,2)+'\n');
console.log('PASS 111+111; all 150 original identities/order and old guide IDs; 72 prompts, 24 guides, all 222 annotations/links; every other course, App and prior prompts exact; '+calculations+' real damage calculations.');
