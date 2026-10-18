import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

// Offline only: real normalization/read/write functions, isolated fake storage.
// d81971d is the released application immediately before the UI integration.
const baseline = 'd81971d';
const root = path.resolve(import.meta.dirname, '..');
const current = readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
const previous = execFileSync('git', ['show', `${baseline}:src/App.tsx`], { cwd: root, encoding: 'utf8' });
const require = createRequire(path.join(root, 'src/App.tsx'));
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);

function declarations(source) {
  const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const vars = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && !vars.has(node.name.text)) vars.set(node.name.text, node);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return { ast, vars };
}
const before = declarations(previous), after = declarations(current);
const protectedNames = ['STORAGE_KEYS', 'normalizePlayerProfiles', 'normalizePlayerProfileData', 'getUniqueKey', 'getQuestionStatusKey',
  'normalizeDefeatedMonsterIds', 'persistPlayerProfiles', 'readLegacyWorkingSetFromLocalStorage', 'writeProfileDataToWorkingSet',
  'captureCurrentProfileData', 'activatePlayerProfile'];
const printer = ts.createPrinter({ removeComments: true });
// Replay positions are the only additive storage change. Strip that field alone
// for the legacy AST comparison; all original keys and statements remain exact.
function legacyPrint(node, ast) {
  const transformed = ts.transform(node, [context => {
    const visit = n => {
      if ((ts.isPropertyAssignment(n) || ts.isShorthandPropertyAssignment(n)) && n.name.getText(ast) === 'battleResumePositions') return undefined;
      if (ts.isExpressionStatement(n) && ts.isCallExpression(n.expression)
        && n.expression.expression.getText(ast) === 'localStorage.setItem'
        && n.expression.arguments[0]?.getText(ast) === 'STORAGE_KEYS.battleResumePositions') return undefined;
      if (ts.isArrayLiteralExpression(n)) return ts.factory.updateArrayLiteralExpression(n,
        ts.factory.createNodeArray(n.elements.filter(e => !(ts.isIdentifier(e) && e.text === 'battleResumePositions')).map(e => ts.visitNode(e, visit)), n.elements.hasTrailingComma));
      return ts.visitEachChild(n, visit, context);
    };
    return root => ts.visitNode(root, visit);
  }]);
  const printed = printer.printNode(ts.EmitHint.Unspecified, transformed.transformed[0], ast);
  transformed.dispose();
  return printed;
}
for (const name of protectedNames) {
  assert.ok(before.vars.has(name) && after.vars.has(name), name);
  assert.equal(legacyPrint(after.vars.get(name), after.ast),
    printer.printNode(ts.EmitHint.Unspecified, before.vars.get(name), before.ast), `${name} must retain released storage behavior`);
}
// Validate all actual helper dependencies too, and execute them rather than test replicas.
const roots = ['STORAGE_KEYS', 'normalizePlayerProfiles', 'getQuestionStatusKey', 'getUniqueKey', 'matchesDefeatedMonster',
  'readLegacyWorkingSetFromLocalStorage', 'writeProfileDataToWorkingSet'];
const selected = new Set(), imports = new Map();
const topLevelNames = new Set(after.ast.statements.filter(ts.isVariableStatement).flatMap(st=>st.declarationList.declarations.filter(n=>ts.isIdentifier(n.name)).map(n=>n.name.text)));
for (const st of after.ast.statements) if (ts.isImportDeclaration(st) && st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings)) {
  for (const item of st.importClause.namedBindings.elements) if (!item.isTypeOnly) imports.set(item.name.text, { module: st.moduleSpecifier.text, name: item.propertyName?.text ?? item.name.text });
}
const usedImports = new Set();
function select(name) {
  if (name === 'useCallback') return;
  if (!topLevelNames.has(name) && !roots.includes(name)) { if (imports.has(name)) usedImports.add(name); return; }
  if (!after.vars.has(name)) { if (imports.has(name)) usedImports.add(name); return; }
  if (selected.has(name)) return;
  selected.add(name);
  const node = after.vars.get(name);
  assert.equal(legacyPrint(node, after.ast), printer.printNode(ts.EmitHint.Unspecified, before.vars.get(name), before.ast), `${name} changed since release`);
  function refs(n) { if (ts.isIdentifier(n) && n !== node.name) select(n.text); ts.forEachChild(n, refs); }
  refs(node.initializer);
}
roots.forEach(select);
const declarationsText = [...selected].map(name => after.vars.get(name)).sort((a,b) => a.pos-b.pos).map(n=>`const ${n.getText(after.ast)};`).join('\n');
const mapLoop = after.ast.statements.find(st => ts.isForOfStatement(st) && st.getText(after.ast).includes('LEGACY_PRE1_QUESTION_KEY_MAP.set'));
const storage = new Map();
const ctx = { useCallback: fn=>fn, localStorage: {
  getItem: key => storage.get(key) ?? null, setItem: (key,value)=>storage.set(key,String(value)), removeItem: key=>storage.delete(key),
}};
for (const name of usedImports) {
  const spec = imports.get(name);
  assert.ok(spec.module.startsWith('./'), `Unexpected external dependency: ${name}`);
  ctx[name] = require(spec.module)[spec.name];
}
vm.createContext(ctx);
vm.runInContext(ts.transpile(`${declarationsText}\n${mapLoop.getText(after.ast)}\nglobalThis.api={${roots.join(',')}};`, {target:ts.ScriptTarget.ES2022}),ctx);
const api = ctx.api, json = value=>JSON.parse(JSON.stringify(value));
const q = { text:'banana', translation:'バナナ' };
const qKey = api.getQuestionStatusKey('Eiken5',1,q);
const retiredPre2 = {text:'No way!',translation:'まさか！・絶対に嫌だ！'};
const retiredKey = api.getQuestionStatusKey('EikenPre2',3,retiredPre2);
const defeats = ['Eiken5:1:guide:voice-text:m1_1','Eiken3:3:challenge:voice-only:c3_13','EikenPre1:2:guide:text-only:m2_3','Eiken1Part2:3:challenge:text-only:c3_23'];
const fixture = [{id:'existing-child',name:'既存プレイヤー',updatedAt:1728000000000,data:{
  defeatedMonsterIds:defeats,bestScores:{[defeats[1]]:12345},maxKeystrokes:456,
  weakQuestions:[q,retiredPre2],weakQuestionStats:{banana:{missCount:3,lastMissedAt:1728000000000,consecutiveCorrect:1}},
  manualQuestionStatuses:{[qKey]:{learningLevel:3,practiceLevel:3,listeningLevel:2,battleLevel:3,excluded:true,updatedAt:1728000000000},[retiredKey]:{learningLevel:3,practiceLevel:3,listeningLevel:3,battleLevel:3,excluded:true,updatedAt:1728000000000}},
  reviewQueue:[{difficulty:'Eiken5',level:1,question:q,remainingQuestions:2,missCount:3},{difficulty:'EikenPre2',level:3,question:retiredPre2,remainingQuestions:1,missCount:2}],
  dailyProgress:{date:'2026-10-15',questionCount:218},dailyActivityHistory:{'2026-10-14':{answered:30,skipped:2}},
  autoPlaySettings:{source:'marked',playbackScope:'selected',playbackDifficulties:['Eiken3','Eiken2'],playText:true,playTranslation:true,playExample:true,repeat:true,shuffle:true},
  selectedQuestionKeysByScope:{'Eiken5:1':[qKey]},markedQuestionKeysByScope:{'Eiken5:1':[qKey]},reviewHistoryKeysByScope:{'Eiken5:1':[qKey]},
  savedSelectionLists:[{id:'saved',name:'復習リスト',difficulty:'Eiken5',level:1,questionKeys:[qKey],updatedAt:1728000000000}],
}}, {id:'second',name:'家族',updatedAt:1,data:{defeatedMonsterIds:[defeats[0]]}}];
const normalized = json(api.normalizePlayerProfiles(fixture));
assert.deepEqual(normalized[0].data.battleResumePositions, {}, 'Legacy saves need no destructive migration');
assert.deepEqual(normalized[0].data.defeatedMonsterIds, defeats);
assert.equal(normalized.length,2); assert.equal(normalized[0].id,fixture[0].id);
const d=normalized[0].data;
assert.equal(d.bestScores[defeats[1]],12345); assert.equal(d.maxKeystrokes,456);
assert.equal(d.manualQuestionStatuses[qKey].excluded,true); assert.equal(d.manualQuestionStatuses[qKey].learningLevel,3);
assert.equal(d.weakQuestionStats.banana.missCount,3); assert.equal(d.reviewQueue[0].remainingQuestions,2);
assert.equal(d.manualQuestionStatuses[retiredKey].battleLevel,3);
assert.equal(d.reviewQueue[1].question.text,retiredPre2.text);
assert.ok(d.weakQuestions.some(q=>q.text===retiredPre2.text),'Retired curriculum records must not be deleted');
assert.equal(d.dailyActivityHistory['2026-10-14'].answered,30); assert.equal(d.dailyProgress.questionCount,218);
for (const field of ['selectedQuestionKeysByScope','markedQuestionKeysByScope','reviewHistoryKeysByScope','savedSelectionLists']) assert.deepEqual(d[field],fixture[0].data[field]);
assert.equal(d.autoPlaySettings.playbackScope,'selected'); assert.deepEqual(d.autoPlaySettings.playbackDifficulties,['Eiken3','Eiken2']);
for (const profile of normalized) {
  api.writeProfileDataToWorkingSet(profile.data);
  assert.deepEqual(json(api.readLegacyWorkingSetFromLocalStorage()),profile.data, `Profile round trip: ${profile.id}`);
}
api.writeProfileDataToWorkingSet(normalized[0].data);
assert.equal(api.matchesDefeatedMonster(d.defeatedMonsterIds,'Eiken3',3,'challenge','voice-only','c3_13'),true);
assert.deepEqual(json(api.normalizePlayerProfiles(JSON.parse(JSON.stringify(normalized)))),normalized);
const replayField = { 'EikenPre2:1:challenge:voice-only': 'c1_7', 'EikenPre2:1:challenge:text-only': 'c1_3' };
const replayProfiles = json(api.normalizePlayerProfiles([{...normalized[0], data:{...d, battleResumePositions:replayField}}, normalized[1]]));
assert.deepEqual({...replayProfiles[0].data, battleResumePositions:{}}, d, 'Replay cursor must not change any legacy progress');
assert.deepEqual(replayProfiles[1], normalized[1], 'Other player is unchanged');
for (const profile of [replayProfiles[0], replayProfiles[1], replayProfiles[0]]) {
  api.writeProfileDataToWorkingSet(profile.data);
  assert.deepEqual(json(api.readLegacyWorkingSetFromLocalStorage()),profile.data, 'Replay position survives reload and player switching');
}
assert.deepEqual(json(api.normalizePlayerProfiles(JSON.parse(JSON.stringify(replayProfiles)))),replayProfiles, 'Export/import retains cursor and progress');
// Reviewed display overlays can change without changing question identities or saves.
// test-translation-battle-prompts / test-sequential-prompt-reviews validate that overlay.
const approvedMaterialFiles=new Set(['src/data/translationBattlePrompts.json','src/data/questionSets/eiken/pre2.ts','src/data/questionSets/eiken/pre2GrammarCurriculum.json','src/data/questionGrammarPoints.ts','src/data/pre2GrammarAssignments.ts','src/data/pre2GrammarCurriculumAssignments.json','src/data/pre2GrammarCurriculumCards.ts','src/data/pre2GrammarGuide.ts','src/data/grammarGuides.ts']);
const dataDiff = execFileSync('git',['diff','--name-only',baseline,'--','src/data','src/monsterProfiles.json','src/monsterProfiles.ts','src/learningProgress.ts'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
for(const file of ['src/data/questions.ts','src/data/questionSets/eiken/grade5.ts','src/data/questionSets/eiken/grade5Foundations.json','src/data/grade5FoundationAssignments.json','src/data/grade5GrammarAssignments.ts','src/data/grade5GrammarGuide.ts'])approvedMaterialFiles.add(file);
assert.deepEqual(dataDiff.filter(file=>!approvedMaterialFiles.has(file)),[],'Only the separately audited Pre-2 L3 material may differ; monster catalog and learning rules remain unchanged');
console.log(`PASS: ${protectedNames.length} persistence functions and ${selected.size} dependencies retain ${baseline} legacy behavior; 2-player fixture, old saves, reload/profile-switch/export round trips and defeated IDs unchanged; separately audited curricula allowed.`);

const companions = require('./homeCompanions.ts');
const profiles = require('./monsterProfiles.json');
const keys = list=>list.map(x=>`${x.course}:${x.monsterId}`);
assert.equal(new Set(keys(companions.HOME_COMPANIONS)).size,40);
for (const c of companions.HOME_COMPANIONS) {
  const p=profiles.find(p=>p.course===c.course&&p.monsterId===c.monsterId);
  const folder=p?.artFolder ?? `${c.course.toLowerCase()}-level${c.monsterId[1]}`;
  assert.ok(existsSync(path.join(root,'public/monsters',folder,'384',`${c.monsterId}.webp`)),`${c.course}:${c.monsterId} art`);
}
let last=[], seen=new Set();
for(let i=0;i<400;i++) {
  const chosen=companions.getHomeCompanions('Eiken3','m1_1',last,()=>((i*37)%401)/401);
  assert.equal(chosen.length,2); assert.equal(new Set(keys(chosen)).size,2);
  assert.ok(keys(chosen).every(key=>!keys(last).includes(key)&&key!=='Eiken3:m1_1'));
  keys(chosen).forEach(k=>seen.add(k)); last=chosen;
}
assert.equal(seen.size,39);
console.log('PASS: 40 available background-monster assets; every eligible candidate reachable; no duplicate, main-enemy collision, or immediately repeated pair member.');
