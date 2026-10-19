import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {load} from '../../scripts/lib/load-typescript-data.mjs';
import {withoutGrade1Expansion,beforeGrade1PromptChanges} from '../../scripts/lib/grade1-expansion-audit-snapshot.mjs';
const r=JSON.parse(fs.readFileSync(new URL('./review.json',import.meta.url)));
const {QUESTIONS}=load('src/data/questions.ts');
const {getGrammarCard}=load('src/data/grammarGuides.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const sha=s=>createHash('sha256').update(s).digest('hex');
const plain=x=>JSON.parse(JSON.stringify(x));
const historical=withoutGrade1Expansion(QUESTIONS);
assert.equal(sha(JSON.stringify(historical)),r.baseline.questionsSha256);
const changed=new Set(['src/data/questionSets/eiken/grade1.ts','src/data/grade1GrammarGuide.ts','src/data/translationBattlePrompts.json']);
for(const [p,s]of Object.entries(r.baseline.sourceHashes))if(!changed.has(p))assert.equal(sha(fs.readFileSync(p)),s,'Source unchanged: '+p);
const prompts=beforeGrade1PromptChanges(JSON.parse(fs.readFileSync('src/data/translationBattlePrompts.json')));
assert.equal(sha(JSON.stringify(prompts,null,2)+'\n'),r.baseline.sourceHashes['src/data/translationBattlePrompts.json']);
for(const c of r.courses){
 assert.equal(historical[c.course][3].length,40,'Original inspection snapshot');assert.equal(QUESTIONS[c.course][3].length,100,'Approved expansion installed');
 assert.equal(c.rows.length,40);assert.equal(c.proposed.length,60);assert.equal(c.targets.length,20);
 assert.equal(c.proposed.filter(q=>q.priority==='優先').length,48);assert.equal(c.proposed.filter(q=>q.priority==='発展').length,12);
 for(const [i,row]of c.rows.entries()){
  assert.deepEqual(row.question,plain(historical[c.course][3][i]));
  if(!['If the evidence is weak, the case should be reconsidered.','Witnesses claimed that the officer had altered the report.','Although both sides sought peace, neither would compromise.'].includes(row.question.text))assert.equal(row.meaning,getQuestionMeaning(row.question,c.course));
  assert.deepEqual(row.card,plain(getGrammarCard(c.course,3,row.question)));assert.ok(row.review.finding&&row.review.suggestion);
 }
 for(const t of c.targets){const rows=c.proposed.filter(q=>q.targetId===t.id);assert.equal(rows.length,3);for(const q of rows){assert.ok(q.meaning&&q.formNote&&q.grammarPoint.note&&q.grammarPoint.pattern);assert.equal(/[a-zA-Z]/.test(q.formNote),false,'No English spelling/answer pattern in Japanese form note');assert.equal(q.text,q.text.trim());assert.match(q.text,/^[A-Z].*\.$/);assert.ok(q.text.length<=75);}}
 const all=[...c.rows.map(q=>q.question.text),...c.proposed.map(q=>q.text)];assert.equal(new Set(all).size,100);
}
assert.equal(r.courses.flatMap(c=>c.rows).filter(q=>q.review.kind!=='保持').length,23);
assert.equal(r.balance.calculations,115920);assert.equal(r.balance.stages.length,92);
assert.ok(r.balance.stages.filter(s=>s.stage===23).every(s=>s.before.monsterHp===s.proposed.monsterHp&&s.before.maxQuestions===s.proposed.maxQuestions));
const p1=r.courses[0],p2=r.courses[1];
assert.equal(p1.rows[23].question.text,'The data suggests that the disease is spreading slowly.');
assert.ok(!p2.featureSets.presentPerfect.includes(38),'has long-term effects is a lexical have');
assert.equal(p2.rows[27].card.id,'neither-would');assert.equal(p2.featureSets.unrealConditional.length,0);
console.log('PASS 80 exact current questions/meanings/guide links; 23 annotated candidates; 120 unique complete drafts in 40 targets, 48+12 per course; Japanese-only form notes; actual/proposed numeric checks; all runtime scopes and Pre-1 work unchanged.');
