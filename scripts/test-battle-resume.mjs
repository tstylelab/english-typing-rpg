import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';
import { loadBattleTuning } from './lib/load-battle-tuning.mjs';

// Run the application's real start/resume/completion functions with offline storage.
const source = readFileSync('src/App.tsx', 'utf8');
const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const vars = new Map();
const calls = [];
function visit(n) {
  if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) vars.set(n.name.text, n);
  if (ts.isCallExpression(n) && n.expression.getText(ast) === 'rememberBattlePosition') calls.push(n);
  ts.forEachChild(n, visit);
}
visit(ast);
const tuning = loadBattleTuning(source);
const resume = load('src/battleResume.ts');
const names = ['NORMAL_TARGET_COUNT', 'HARD_TARGET_COUNT', 'HIDDEN_BOSS_COUNT', 'isEndlessChallengeInputMode',
  'getUniqueKey', 'matchesDefeatedMonster', 'getBattleStageIndices',
  'hasClearedBattleLevel', 'getBattleResumeStep', 'rememberBattlePosition', 'getModeProgress', 'startGame'];
// Include the top-level dependencies used by these application functions.
const refs = new Set(names);
function dependencies(name) {
  const n = vars.get(name);
  if (!n) return;
  function walk(node) {
    if (ts.isIdentifier(node) && vars.has(node.text) && !refs.has(node.text)
      && !['MONSTERS','getCourseMonsters','getGuideTargetCount','getListeningTargetCount'].includes(node.text)
      && vars.get(node.text).parent?.parent?.parent === ast) {
      refs.add(node.text); dependencies(node.text);
    }
    ts.forEachChild(node, walk);
  }
  walk(n.initializer);
}
names.forEach(dependencies);
const selected = [...refs].filter(n => vars.has(n)).sort((a,b)=>vars.get(a).pos-vars.get(b).pos);
const storage = new Map();
const context = {
  ...resume, MONSTERS:tuning.roster, battleResumePositions:{},
  STORAGE_KEYS:{battleResumePositions:'resume', mainGameStartedPlayers:'started'},
  gameState:{defeatedMonsterIds:[],selectedDifficulty:'EikenPre2',selectedLevel:1},
  localStorage:{setItem:(key,value)=>storage.set(key,value)},
  setBattleResumePositions:value=>{context.battleResumePositions=value;},
  getCourseMonsters:(_course,level)=>tuning.roster[level], getGuideTargetCount:()=>20, getListeningTargetCount:()=>20,
  getScopedPlayableQuestions:()=>[{text:'test'}], getFocusedQuestions:()=>[{text:'test'}], shuffleQuestions:q=>q,
  mainGameStartedPlayers:{}, activePlayerId:'synthetic', setMainGameStartedPlayers:()=>{}, setResumeMode:()=>{}, setResumeInputMode:()=>{},
  sessionWeakQuestionsRef:{current:null}, activeReviewEntryRef:{current:null},
  initBattle:(...args)=>{context.started=args;}, alert:message=>{throw Error(message);},
};
vm.createContext(context);
vm.runInContext(ts.transpileModule(selected.map(n=>`const ${vars.get(n).getText(ast)};`).join('\n')
  + '\nglobalThis.api={startGame,getModeProgress,rememberBattlePosition,getBattleStageIndices,hasClearedBattleLevel};',
  {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,context);
const { api } = context;
let encounters=0;
for (const course of tuning.courses) for (const level of [1,2,3]) {
  context.gameState.selectedDifficulty=course; context.gameState.selectedLevel=level;
  context.battleResumePositions={}; context.gameState.defeatedMonsterIds=[];
  const modes=[['guide','voice-text'],['challenge','voice-text'],['challenge','voice-only'],['challenge','text-only']];
  for (const [mode,input] of modes) {
    const list=mode==='guide'||input==='voice-text'?tuning.roster[level].guide:tuning.roster[level].challenge;
    const indices=Array.from(api.getBattleStageIndices(list,20,mode,input));
    const ids=indices.map(i=>list[i].id);
    const keys=ids.map(id=>`${course}:${level}:${mode}:${input}:${id}`);
    api.startGame(course,level,mode,input);
    assert.equal(context.started[4],0,'New course begins at first encounter');
    context.gameState.defeatedMonsterIds.push(...keys.slice(0,3));
    api.startGame(course,level,mode,input);
    assert.equal(context.started[4],3,'Legacy partial save resumes at first undefeated');
    context.gameState.defeatedMonsterIds.push(...keys.slice(3));
    const wins=JSON.stringify(context.gameState.defeatedMonsterIds);
    api.startGame(course,level,mode,input);
    assert.equal(context.started[4],0,'Legacy completed save starts first replay');
    for(let step=0;step<ids.length;step++) {
      api.rememberBattlePosition(course,level,mode,input,resume.nextBattleResumeId(ids,step));
      context.battleResumePositions=resume.normalizeBattleResumePositions(JSON.parse(storage.get('etyping_battle_resume_positions')));
      for (const focus of [undefined,'unseen','learning']) {
        api.startGame(course,level,mode,input,null,focus);
        assert.equal(context.started[4],(step+1)%ids.length,`${course} L${level} ${mode}/${input} ${focus}: after victory ${step+1}`);
        assert.equal(context.started[10]?.kind,focus);
      }
      const status=api.getModeProgress(list,mode,input,20);
      assert.equal(status.isComplete,true,'Replay must retain completed visual');
      assert.equal(status.monster.id,ids[(step+1)%ids.length],'Mode screen and resume agree');
      assert.equal(status.clearedCount,ids.length);
      assert.equal(JSON.stringify(context.gameState.defeatedMonsterIds),wins,'Replay must not mutate lifetime victories');
      encounters++;
    }
  }
  assert.equal(api.hasClearedBattleLevel(new Set(context.gameState.defeatedMonsterIds),course,level),true,'Stars remain after replay');
  // Removing one hidden boss must still prevent completion.
  const missing=context.gameState.defeatedMonsterIds.slice(0,-1);
  assert.equal(api.hasClearedBattleLevel(new Set(missing),course,level),false);
}
assert.equal(resume.resolveBattleResumeStep(['m1_2','m1_1'],'m1_1',()=>true),1,'ID follows a reordered catalog');
assert.equal(resume.resolveBattleResumeStep(['m1_1','m1_2'],'removed',id=>id==='m1_1'),1);
assert.equal(resume.resolveBattleResumeStep([],undefined,()=>true),0);
assert.equal(resume.nextBattleResumeId([],0),undefined);
assert.equal(Object.keys(resume.normalizeBattleResumePositions({invalid:'c1_2','EikenPre2:1:challenge:voice-only':22})).length,0);
assert.equal(calls.length,2,'Only initialization and actual victory may update the replay cursor');
const victoryCall=calls.find(c=>c.arguments[4]?.getText(ast).startsWith('nextBattleResumeId('));
assert.ok(victoryCall);
let guard=victoryCall.parent;
while(guard && !(ts.isIfStatement(guard)&&guard.expression.getText(ast)==='isMonsterDefeated')) guard=guard.parent;
assert.ok(guard,'Pool exhaustion, draw, skip, or defeat must not advance replay');
assert.ok(source.includes('const nextBattleDisplayStep = getBattleResumeStep('),'Home preview shares the resume resolver');
assert.ok(source.includes('rememberBattlePosition(diff, level, mode, inputMode, startingMonster.id)'),'Entering/retrying a battle records its current position');
console.log(`PASS: ${encounters} replay victories across every course/level and 4 modes; normal/unseen/learning restart; mode cards, stars, last-boss wrap, legacy saves, reorder, no lifetime-data changes.`);

// Optional UI fixture: unique new local player, all Pre2 L1 battle wins, no cursor.
if(process.argv.includes('--fixture')) {
  const list=tuning.roster[1].challenge;
  const wins=['voice-only','text-only'].flatMap(input=>Array.from(api.getBattleStageIndices(list,20,'challenge',input),i=>`EikenPre2:1:challenge:${input}:${list[i].id}`));
  mkdirSync('node_modules/.tmp/replay-check',{recursive:true});
  writeFileSync('node_modules/.tmp/replay-check/complete-pre2.json',JSON.stringify({formatVersion:3,app:'english-typing-rpg',exportedAt:new Date().toISOString(),
    player:{id:'local-replay-regression-20261016',name:'再挑戦確認用',data:{defeatedMonsterIds:wins,bgmVolumeLevel:0}}},null,2));
}
