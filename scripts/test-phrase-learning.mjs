import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {load} from './lib/load-typescript-data.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const core=load('src/data/grade4PhraseCores.ts');
const progress=load('src/learningProgress.ts');
const {spaceLongTextQuestions}=load('src/learningQuestionBalance.ts');
const {getQuestionExample}=load('src/data/questionExamples.ts');
const original=load('src/data/questionSets/eiken/grade4.json').levels;
const key=q=>`Eiken4:2:${q.text}:${q.translation}`;
const json=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(json(QUESTIONS.Eiken4[1]),json(original['1']));
assert.deepEqual(json(QUESTIONS.Eiken4[3]),json(original['3']));
const qs=QUESTIONS.Eiken4[2];
assert.equal(new Set(qs.map(q=>q.text)).size,qs.length);
assert.equal(new Set(core.grade4PhraseChanges.map(c=>c.before.text)).size,core.grade4PhraseChanges.length);
for(const q of qs) assert.ok(getQuestionExample('Eiken4',2,q)?.length>10, q.text);
for(const c of core.grade4PhraseChanges) {
  const next=core.migrateGrade4Phrase(c.before);
  assert.equal(next.text,c.after.text);
  assert.equal(core.migrateGrade4PhraseKey(key(c.before)),key(next));
  assert.equal(core.migrateGrade4PhraseKey(key(next)),key(next));
  assert.equal(core.migrateGrade4PhraseKey(`Eiken3:2:${c.before.text}:${c.before.translation}`),`Eiken3:2:${c.before.text}:${c.before.translation}`);
}
assert.equal(qs.filter(q=>q.text==='be interested in').length,1);
assert.ok(!qs.some(q=>/be interested in (music|science)/.test(q.text)));
assert.ok(qs.some(q=>q.text==='take a picture'));
assert.ok(qs.some(q=>q.text==='for example'));
for(const [length,allowance] of [[9,0],[10,2],[19,2],[20,3],[29,3],[30,4],[39,4],[40,5],[49,5],[50,6],[59,6],[60,7],[200,21]]) {
  assert.equal(progress.getLongTextMistakeAllowance(length),allowance);
  for(const level of [2,3]) {
    assert.equal(progress.getBattleLearningOutcome(level,allowance,length),'success');
    assert.notEqual(progress.getBattleLearningOutcome(level,allowance+1,length),'success');
  }
  assert.equal(progress.getBattleLearningOutcome(1,1,length),'struggle');
}
// The relaxed allowance wins before demotion; excess errors still use the old rule.
for(const level of [2,3]) {
  for(const [length,misses] of [[16,2],[25,3],[35,4],[45,5],[65,7]]) {
    const outcome=progress.getBattleLearningOutcome(level,misses,length);
    assert.equal(outcome,'success');
    const first=progress.getNextLongTextLearningState({listeningLevel:1,battleLevel:1},'battle',outcome);
    assert.equal(first.battleLevel,2);
    assert.equal(progress.getNextLongTextLearningState(first,'battle',outcome),first,'No immediate mastery');
    const mastered=progress.getNextLongTextLearningState({...first,longTextSpacingRemaining:0},'battle',outcome);
    assert.equal(mastered.battleLevel,3);
    assert.equal(progress.getNextLongTextLearningState(mastered,'battle',outcome).battleLevel,3,'Allowed typos retain mastery');
  }
  assert.equal(progress.getBattleLearningOutcome(level,5,40),'success');
  assert.equal(progress.getBattleLearningOutcome(level,6,40),'neutral');
  assert.equal(progress.getBattleLearningOutcome(level,7,40),'struggle');
}
let s={listeningLevel:1,battleLevel:1};
s=progress.getNextLongTextLearningState(s,'battle','success');
assert.equal(progress.getAutomaticLearningLevel(s),2);
assert.equal(s.longTextSpacingRemaining,5);
assert.equal(progress.getNextLongTextLearningState(s,'battle','success'),s);
s={...s,longTextSpacingRemaining:0};
s=progress.getNextLongTextLearningState(s,'battle','success');
assert.equal(progress.getAutomaticLearningLevel(s),3);
assert.equal(progress.getNextLongTextLearningState(s,'battle','neutral'),s);
const failed=progress.getNextLongTextLearningState(s,'battle','struggle');
assert.equal(failed.battleLevel,2);assert.equal(failed.longTextSuccessCount,0);
const fromListening=progress.getNextLongTextLearningState({listeningLevel:2,battleLevel:1},'battle','success');
assert.equal(fromListening.battleLevel,2,'Listening does not substitute for two battle recalls');
const one=progress.getNextLongTextLearningState({listeningLevel:1,battleLevel:1},'battle','success',true,1000);
assert.equal(progress.getNextLongTextLearningState(one,'battle','success',true,120999),one);
assert.equal(progress.getNextLongTextLearningState(one,'battle','success',true,121000).battleLevel,3);
assert.equal(progress.getNextLongTextLearningState(one,'battle','success',false,121000),one);
// Even a deterministic chooser rotates small pools and cannot repeat within six picks.
for(const count of [1,2,5,7,20]) {
  const candidates=Array.from({length:count},(_,i)=>String(i));
  const recent=[];
  for(let i=0;i<100;i++) {
    const picked=spaceLongTextQuestions(candidates,recent,q=>q)[0];
    assert.ok(picked!==undefined);
    if(count>=7) assert.ok(!recent.slice(-6).includes(picked));
    if(count>1) assert.notEqual(picked,recent.at(-1));
    recent.push(picked);
  }
  assert.ok(new Set(recent).size>=Math.min(count,7));
}
// Execute the actual saved-data normalizers, not a parallel imitation.
const source=fs.readFileSync('src/App.tsx','utf8');
const ast=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=['normalizeManualQuestionStatuses','getEffectiveLearningLevel','withDerivedLearningLevel','normalizeWeakQuestionStats','normalizeQuestionArray','normalizeReviewQueue','normalizeSelectedQuestionKeysByScope','normalizeSavedSelectionLists','getQuestionStatusKey'];
const selected=ast.statements.filter(s=>ts.isVariableStatement(s)&&s.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))).map(s=>s.getText(ast)).join('\n');
const ctx={...core,...load('src/data/phraseCoreMigration.ts'),...progress,LEARNING_LEVELS:[1,2,3],LEVELS:[1,2,3],PRE1_DIFFICULTIES:[],LEGACY_PRE1_DIFFICULTY:'legacy',LEGACY_PRE1_QUESTION_KEY_MAP:new Map(),DIFFICULTIES:Object.keys(QUESTIONS),getAvailableLevels:()=>[1,2,3],getReviewScopeKey:(d,l)=>`${d}:${l}`};
vm.runInNewContext(ts.transpile(selected+'\nObject.assign(globalThis,{'+names.join(',')+'});',{target:ts.ScriptTarget.ES2022}),ctx);
const oldA=original['2'].find(q=>q.text==='be interested in science');
const oldB=original['2'].find(q=>q.text==='be interested in music');
const newQ=core.migrateGrade4Phrase(oldA);
const base={practiceLevel:1,listeningLevel:1,battleLevel:1,manualOverrideLevel:null,excluded:false,updatedAt:1};
const saved={[key(oldA)]:{...base,battleLevel:3},[key(oldB)]:{...base,updatedAt:2}};
const migrated=ctx.normalizeManualQuestionStatuses(saved);
assert.equal(migrated[key(newQ)].battleLevel,3);
assert.deepEqual(json(ctx.normalizeManualQuestionStatuses(migrated)),json(migrated));
const excluded=ctx.normalizeManualQuestionStatuses({...saved,[key(oldB)]:{...base,excluded:true,updatedAt:3}});
assert.equal(excluded[key(newQ)].excluded,true);
const weak=ctx.normalizeQuestionArray([oldA,oldB]);
assert.ok(weak.some(q=>q.text===newQ.text));
assert.ok(weak.some(q=>q.text===oldA.text),'Preserve legacy entry for other grades');
assert.deepEqual(json(ctx.normalizeQuestionArray(weak)),json(weak));
assert.ok(!ctx.normalizeQuestionArray(weak.filter(q=>q.text!==newQ.text)).some(q=>q.text===newQ.text),'Completed core must not be resurrected from retained legacy entries');
const stats=ctx.normalizeWeakQuestionStats({[oldA.text]:{missCount:2,lastMissedAt:1,consecutiveCorrect:0},[oldB.text]:{missCount:3,lastMissedAt:2,consecutiveCorrect:1}});
assert.equal(stats[newQ.text].missCount,5);
assert.deepEqual(json(ctx.normalizeWeakQuestionStats(stats)),json(stats));
const queue=ctx.normalizeReviewQueue([oldA,oldB].map(question=>({difficulty:'Eiken4',level:2,question,remainingQuestions:3,missCount:2})));
assert.equal(queue.length,1);assert.equal(queue[0].question.text,newQ.text);
const selection=ctx.normalizeSelectedQuestionKeysByScope({'Eiken4:2':[key(oldA),key(oldB)]});
assert.deepEqual(json(selection['Eiken4:2']),[key(newQ)]);
const lists=ctx.normalizeSavedSelectionLists([{id:'saved',name:'favorites',difficulty:'Eiken4',level:2,questionKeys:[key(oldA),key(oldB)]}]);
assert.deepEqual(json(lists[0].questionKeys),[key(newQ)]);
console.log(`PASS: ${core.grade4PhraseChanges.length} phrase revisions, ${qs.length} unique cores, examples, migration/idempotence, typo thresholds, spaced progress and small-pool selection.`);

// New recall policy is independent of scoring and legacy Level 1 outcomes.
for (const [letters, allowed] of [[0,2],[10,2],[20,3],[30,5],[40,6]]) {
  assert.equal(progress.getRecallMistakeAllowance(letters), allowed);
  assert.equal(progress.getLongTextRecallOutcome('a'.repeat(letters), allowed), 'success');
  assert.equal(progress.getLongTextRecallOutcome('a'.repeat(letters), allowed+1), 'struggle');
}
assert.equal(progress.getEnglishLetterCount("It's raining now."),13);
for (const [target, input] of [['go home','goh'],['home?','home.'],['hello','he '],['Hi, Tom.','HiT']]) {
  assert.equal(progress.isFormattingOnlyMistake(target,input),true);
}
for (const [target, input] of [["we're","were"],["we're","we "],['hello','heq'],['well-known','wellk'],['well-known','well ']]) {
  assert.equal(progress.isFormattingOnlyMistake(target,input),false);
}
const tolerant=progress.getNextTolerantLongTextLearningState;
const known={listeningLevel:2,battleLevel:3,longTextSuccessCount:2,longTextSpacingRemaining:5};
const excess=tolerant(known,'battle','struggle');
assert.equal(excess.battleLevel,3);
assert.equal(excess.longTextSuccessCount,2);
assert.equal(excess.longTextPreviousExcess,true);
assert.equal(tolerant(excess,'battle','neutral'),excess,'Assisted success must not clear previous excess');
const recovered=tolerant(excess,'battle','success');
assert.equal(recovered.battleLevel,3);
assert.equal(recovered.longTextPreviousExcess,false,'Success clears excess even inside spacing window');
const twice=tolerant(excess,'battle','struggle');
assert.equal(twice.battleLevel,2);
assert.equal(twice.longTextSuccessCount,0);
assert.equal(twice.longTextPreviousExcess,false);
const restoreKey=key(newQ);
const restored=ctx.normalizeManualQuestionStatuses({[restoreKey]:{...base,...excess}})[restoreKey];
assert.equal(restored.longTextPreviousExcess,true);
assert.equal(tolerant(restored,'battle','struggle').battleLevel,2);
assert.equal(ctx.normalizeManualQuestionStatuses({[restoreKey]:base})[restoreKey].longTextPreviousExcess,false);
assert.equal(ctx.normalizeManualQuestionStatuses({[restoreKey]:{...base,longTextPreviousExcess:'true'}})[restoreKey].longTextPreviousExcess,false);
assert.equal(tolerant({listeningLevel:1,battleLevel:1},'listening','success').listeningLevel,2);
assert.equal(progress.getBattleLearningOutcome(1,1,40),'struggle');
console.log('PASS: recall allowance, formatting vs apostrophes, two-excess demotion, recovery and saved-data compatibility.');
