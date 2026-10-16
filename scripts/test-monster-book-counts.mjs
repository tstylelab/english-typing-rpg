import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {loadBattleTuning} from './lib/load-battle-tuning.mjs';

const source=readFileSync('src/App.tsx','utf8');
const ast=ts.createSourceFile('App.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=['getUniqueKey','matchesDefeatedMonster','MONSTER_BOOK_INPUT_MODES','isMonsterDefeatedForBook','countDefeatedMonstersForBook'];
const declarations=ast.statements.filter(s=>ts.isVariableStatement(s)&&s.declarationList.declarations.some(d=>names.includes(d.name.getText(ast)))).map(s=>s.getText(ast)).join('\n');
const ctx={};
vm.runInNewContext(ts.transpileModule(declarations+'\nglobalThis.api={countDefeatedMonstersForBook,isMonsterDefeatedForBook};',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,ctx);
const {countDefeatedMonstersForBook:count,isMonsterDefeatedForBook:discovered}=ctx.api;
const tuning=loadBattleTuning(source);
for(const course of tuning.courses)for(const level of [1,2,3]) {
  const {guide,challenge}=tuning.roster[level];
  const basic=guide.map(m=>`${course}:${level}:guide:voice-text:${m.id}`);
  const listening=guide.map(m=>`${course}:${level}:challenge:voice-text:${m.id}`);
  const audio=challenge.map(m=>`${course}:${level}:challenge:voice-only:${m.id}`);
  const translation=challenge.map(m=>`${course}:${level}:challenge:text-only:${m.id}`);
  for(const keys of [[],basic,listening,audio,translation,[...basic,...listening,...audio,...translation],listening.slice(0,2)]) {
    const immutable=JSON.stringify(keys);
    for(const list of [guide,challenge]) {
      assert.equal(count(list,keys,course,level),list.filter(m=>discovered(keys,course,level,'guide',m.id)||discovered(keys,course,level,'challenge',m.id)).length,'Album count must match visible discovered cards');
      assert.equal(count(list,keys,course,99),0,'Other level isolated');
      assert.equal(count(list,keys,'Other',level),0,'Other course isolated');
    }
    assert.equal(JSON.stringify(keys),immutable,'Counting never changes saved victories');
  }
  assert.equal(count(guide,listening,course,level),guide.length,'Listening training alone unlocks and counts training monsters');
  assert.equal(count(guide,[...basic,...listening],course,level),guide.length,'Both methods count each monster only once');
}
console.log('PASS: album counts match discovered cards across all courses/levels; listening training, both methods without duplicates, isolation, and saved victories unchanged.');
