import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';
const json = value => JSON.parse(JSON.stringify(value));
const { QUESTIONS } = load('src/data/questions.ts');
const migration = load('src/data/phraseCoreMigration.ts');
const { upperPhraseCoreRules } = load('src/data/upperPhraseCoreRules.ts');
const { getQuestionExample } = load('src/data/questionExamples.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getQuestionSynonyms } = load('src/data/questionSynonyms.ts');
const changed = Object.keys(migration.upperPhraseLegacy);
const files = new Set(['src/data/questions.ts', ...['grade3','pre2','grade2','grade1'].map(name=>`src/data/questionSets/eiken/${name}.ts`)]);
const cache = new Map();
function baseline(file) {
  if (!files.has(file)) return load(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file,module);
  const source = execFileSync('git',['show',`9ac5d02:${file}`],{encoding:'utf8'});
  const code = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports,require:name=>{
    let target=path.posix.normalize(path.posix.join(path.posix.dirname(file),name));
    if(!path.posix.extname(target))target+='.ts';
    return baseline(target);
  }});
  return module.exports;
}
const old = baseline('src/data/questions.ts').QUESTIONS;
for (const course of Object.keys(QUESTIONS)) for (const level of [1,2,3]) {
  if(level!==2 || !changed.includes(course)) assert.deepEqual(json(QUESTIONS[course][level]),json(old[course][level]),`Untouched ${course}/${level}`);
}
const usedRules=new Set();
for(const course of changed) {
  const qs=QUESTIONS[course][2];
  assert.deepEqual(json(migration.upperPhraseLegacy[course]),json(old[course][2]),'Legacy identities must be exact');
  assert.equal(new Set(qs.map(q=>q.text.toLowerCase())).size,qs.length);
  assert.equal(new Set(qs.map(q=>q.translation)).size,qs.length,`Ambiguous cues ${course}`);
  for(const q of qs) {
    assert.match(q.text,/^[\x20-\x7e]+$/);
    assert.ok(q.translation.length<=50,q.text);
    assert.ok(getQuestionExample(course,2,q)?.length>q.text.length,`Example ${course} ${q.text}`);
    const rewritten=migration.phraseCoreChanges.some(c=>c.difficulty===course&&c.after.text===q.text);
    const original=old[course][2].find(item=>item.text===q.text);
    assert.equal(getQuestionMeaning(q,course),rewritten?q.translation:getQuestionMeaning(original,course),`Cue ${q.text}`);
    if(rewritten && /\b[AB]\b|\bdoing\b|\bdo$|one's|oneself/.test(q.text)) assert.match(q.translation,/A|B|動詞|形|one/,'Explain placeholders');
    for(const syn of getQuestionSynonyms(course,2,q)) assert.notEqual(syn.toLowerCase(),q.text.toLowerCase());
  }
  for(const before of old[course][2]) {
    if(upperPhraseCoreRules.has(before.text))usedRules.add(before.text);
    const after=migration.migrateScopedPhraseCore(course,2,before);
    assert.ok(qs.some(q=>q.text===after.text&&q.translation===after.translation),`Missing target ${before.text}`);
    // When entries merge, preserve a representative example from that group.
    if(before.text===after.text || old[course][2].filter(q=>migration.migrateScopedPhraseCore(course,2,q).text===after.text).length===1) assert.equal(after.exampleEn,before.exampleEn,`Lost example ${before.text}`);
    assert.equal(migration.migrateScopedPhraseCore(course,2,after),after);
    assert.equal(migration.migrateScopedPhraseCore(course,1,before),before);
    const key=q=>`${course}:2:${q.text}:${q.translation}`;
    assert.equal(migration.migratePhraseCoreKey(key(before)),key(after));
    assert.equal(migration.migratePhraseCoreKey(key(after)),key(after));
  }
  console.log(`${course}: ${old[course][2].length} -> ${qs.length}; ${migration.phraseCoreChanges.filter(c=>c.difficulty===course).length} reviewed changes`);
}
assert.equal(usedRules.size,upperPhraseCoreRules.size,'Unused/typo rules');
for(const [course,text] of [['Eiken1Part2','throw in the towel'],['Eiken1Part1','eke out a living'],['Eiken3','a piece of paper'],['Eiken2','as a matter of fact']]) assert.ok(QUESTIONS[course][2].some(q=>q.text===text));
for(const [file,prefix] of [['grade3','grade3'],['pre2','pre2'],['grade2','grade2']]) {
  const module=load(`src/data/questionSets/eiken/${file}.ts`);
  const entries=module[`${prefix}Curriculum`][2];
  for(let i=1;i<entries.length;i++)assert.ok(entries[i].band>=entries[i-1].band);
  const limit=module[`get${prefix==='pre2'?'Pre2':prefix==='grade3'?'Grade3':'Grade2'}CurriculumLimit`];
  for(const [stage,band] of [[0,1],[7,2],[14,3]]) assert.equal(limit(2,stage),entries.filter(e=>e.band<=band).length);
}
// Exercise the actual App normalizers with every changed legacy question.
const app=fs.readFileSync('src/App.tsx','utf8');
const ast=ts.createSourceFile('App.tsx',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=['normalizeManualQuestionStatuses','getEffectiveLearningLevel','withDerivedLearningLevel','normalizeWeakQuestionStats','normalizeQuestionArray','normalizeReviewQueue','normalizeSelectedQuestionKeysByScope','normalizeSavedSelectionLists','getQuestionStatusKey'];
const selected=ast.statements.filter(s=>ts.isVariableStatement(s)&&s.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))).map(s=>s.getText(ast)).join('\n');
const ctx={...migration,...load('src/learningProgress.ts'),LEARNING_LEVELS:[1,2,3],LEVELS:[1,2,3],PRE1_DIFFICULTIES:[],LEGACY_PRE1_DIFFICULTY:'legacy',LEGACY_PRE1_QUESTION_KEY_MAP:new Map(),DIFFICULTIES:Object.keys(QUESTIONS),getAvailableLevels:()=>[1,2,3],getReviewScopeKey:(d,l)=>`${d}:${l}`};
vm.runInNewContext(ts.transpile(selected+'\nObject.assign(globalThis,{'+names.join(',')+'});',{target:ts.ScriptTarget.ES2022}),ctx);
for(const {difficulty,before,after} of migration.phraseCoreChanges) {
  const key=q=>`${difficulty}:2:${q.text}:${q.translation}`;
  const status={practiceLevel:1,listeningLevel:2,battleLevel:3,manualOverrideLevel:2,excluded:true,updatedAt:12,longTextSuccessCount:1,longTextSpacingRemaining:4,longTextLastSuccessAt:9};
  const saved=ctx.normalizeManualQuestionStatuses({[key(before)]:status});
  for(const field of Object.keys(status))assert.equal(saved[key(after)][field],status[field],field);
  assert.deepEqual(json(ctx.normalizeManualQuestionStatuses(saved)),json(saved));
  const selection=ctx.normalizeSelectedQuestionKeysByScope({[difficulty+':2']:[key(before)]});
  assert.deepEqual(json(selection[difficulty+':2']),[key(after)]);
  const lists=ctx.normalizeSavedSelectionLists([{id:'test',name:'test',difficulty,level:2,questionKeys:[key(before)]}]);
  assert.equal(lists[0].questionKeys[0],key(after));
  const queue=ctx.normalizeReviewQueue([{difficulty,level:2,question:before,remainingQuestions:7,missCount:2}]);
  assert.equal(queue[0].question.text,after.text);assert.equal(queue[0].remainingQuestions,7);
  const weak=ctx.normalizeQuestionArray([before]);
  assert.ok(weak.some(q=>q.text===after.text));
  assert.deepEqual(json(ctx.normalizeQuestionArray(weak)),json(weak));
  const removed=weak.filter(q=>q.text===before.text && (q.phraseCoreMigrated || q.grade4CoreMigrated));
  assert.deepEqual(json(ctx.normalizeQuestionArray(removed)),json(removed),'Must not resurrect completed cores');
}
const shared='be interested in science';
const stats=ctx.normalizeWeakQuestionStats({[shared]:{missCount:3,lastMissedAt:1,consecutiveCorrect:1}});
assert.equal(stats['be interested in'].missCount,3);
assert.deepEqual(json(ctx.normalizeWeakQuestionStats(stats)),json(stats));
console.log('PASS: content, unaffected courses/levels, examples, curriculum, saved progress/selection/review/weak migration and idempotence.');
