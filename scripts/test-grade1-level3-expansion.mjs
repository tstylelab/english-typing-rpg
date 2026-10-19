import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from './lib/load-typescript-data.mjs';
import {loadBattleDamage} from './lib/load-battle-damage.mjs';
import {beforeGrade1PromptChanges,withoutGrade1Expansion} from './lib/grade1-expansion-audit-snapshot.mjs';
const dir='docs/grade1-level3-check-2026-10-19/',r=JSON.parse(fs.readFileSync(dir+'review.json')),release=JSON.parse(fs.readFileSync(dir+'release.json'));
const {QUESTIONS}=load('src/data/questions.ts'),{legacyGrade1Sentences:old}=load('src/data/questionSets/eiken/grade1.ts');
const {getGrammarCard,grammarGuides}=load('src/data/grammarGuides.ts'),{getQuestionGrammarPoint}=load('src/data/questionGrammarPoints.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts'),{getTranslationBattlePrompt}=load('src/data/translationBattlePrompts.ts');
const plain=x=>JSON.parse(JSON.stringify(x)),sha=s=>createHash('sha256').update(s).digest('hex');
assert.equal(sha(JSON.stringify(withoutGrade1Expansion(QUESTIONS))),r.baseline.questionsSha256,'All other courses and local Pre-1 work unchanged');
for(const p of ['src/App.tsx','src/data/questionSets/eiken/grade1Sentences.ts','src/data/grade1GrammarAssignments.ts'])assert.equal(sha(fs.readFileSync(p)),r.baseline.sourceHashes[p]);
for(const c of r.courses){
 const qs=QUESTIONS[c.course][3];assert.equal(qs.length,100);assert.equal(new Set(qs.map(q=>q.text)).size,100);
 for(let i=0;i<40;i++){
  const {grammarPoint,...identity}=plain(qs[i]),{grammarPoint:unused,...before}=plain(old[c.course][i]);void unused;
  assert.deepEqual(identity,before,'Original storage identities and order retained');assert.ok(grammarPoint);
  assert.equal(getGrammarCard(c.course,3,qs[i]).id,c.rows[i].card.id,'Old guide IDs retained');
 }
 for(const x of c.proposed){const q=qs.find(q=>q.text===x.text);assert.ok(q);assert.equal(q.translation,x.meaning);assert.deepEqual(plain(q.grammarPoint),x.grammarPoint);assert.equal(getGrammarCard(c.course,3,q).id,'exp-'+(c.course.endsWith('1')?'a-':'b-')+x.targetId);const p=getTranslationBattlePrompt(q,c.course,3);assert.equal(p.meaning,x.meaning);assert.ok(p.formNote.startsWith(x.formNote));assert.deepEqual(plain(p.alternatives),x.alternatives);}
 for(const q of qs){assert.deepEqual(plain(getQuestionGrammarPoint(c.course,3,{text:q.text})),plain(q.grammarPoint));assert.ok(getGrammarCard(c.course,3,q));}
 assert.equal(grammarGuides[c.course].cards.length,c.cards+20);
}
const prompts=JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json')),prior=beforeGrade1PromptChanges(prompts);
assert.equal(prior.length,release.promptCountBefore);
assert.equal(sha(JSON.stringify(prior,null,2)+'\n'),r.baseline.sourceHashes['src/data/translationBattlePrompts.json'],'Every preexisting prompt preserved except 23 explicitly logged changes');
assert.equal(release.changedPrompts.length,23);for(const p of release.changedPrompts){const q=QUESTIONS[p.course][3].find(q=>q.text===p.text);assert.deepEqual(plain(getTranslationBattlePrompt(q,p.course,3)),p.after);assert.equal(getQuestionMeaning(q,p.course),p.after.meaning);}
assert.match(getQuestionGrammarPoint('Eiken1Part2',3,{text:'The potential harm outweighs the short-term benefit.'}).pattern,/outweigh/);
assert.match(getQuestionGrammarPoint('Eiken1Part2',3,{text:'The families whose homes were flooded received support.'}).pattern,/whose/);
const engine=loadBattleDamage(fs.readFileSync('src/App.tsx','utf8'));let calculations=0;
for(const expected of r.balance.stages){
 const c=expected.course,input=expected.input,i=expected.stage-1,monster=engine.roster[3].challenge[i],boss=engine.boss('challenge',input,i,23);
 const tuning=engine.tune(c,3,'challenge',input,i,monster.baseHp,boss);assert.deepEqual(plain(tuning),expected.proposed,'Installed tuning matches approved calculation');
 for(const speed of [.5,2,8])for(const rate of [0,.3,1]){
  const damages=QUESTIONS[c][3].map(q=>engine.damage({selectedDifficulty:c,selectedLevel:3,mode:'challenge',inputMode:input,bossStage:boss,maxMonsterHp:tuning.monsterHp,maxQuestions:tuning.maxQuestions,missCount:Math.ceil(q.text.length*rate),startTime:1000000-q.text.length/speed*1000},q.text));calculations+=damages.length;
  if(rate===0)assert.ok(Math.min(...damages)*tuning.maxQuestions>=tuning.monsterHp);
  if(rate===1||boss&&rate===.3)assert.ok(Math.max(...damages)*tuning.maxQuestions<tuning.monsterHp);
 }
}
fs.writeFileSync(dir+'runtime-balance-check.json',JSON.stringify({status:'installed-runtime-verified',calculations,stagesMatchApprovedProposal:true,allStagesLargeMistakesFail:true,boss30PercentMistakesFail:true,questionCount:200,limitations:r.balance.limitations},null,2)+'\n');
console.log('PASS 100+100; 80 original storage identities/order/guide IDs; 120 approved questions, 40 guides; all 200 exact links/short notes; 23 explicit prompt updates and every unrelated scope/Pre-1 work unchanged.');
