import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';

const app = readFileSync('src/App.tsx', 'utf8');
const baseline = execFileSync('git',['show','11e3f9c:src/App.tsx'],{encoding:'utf8'});
function roster(source) {
  const begin = source.indexOf('const BASE_MONSTERS:');
  const end = source.indexOf('// --- Components ---',begin);
  const context = {};
  vm.runInNewContext(ts.transpileModule(source.slice(begin,end)+'\nthis.roster=MONSTERS;',{
    compilerOptions:{target:ts.ScriptTarget.ES2022},
  }).outputText,context);
  return JSON.parse(JSON.stringify(context.roster));
}
const base = roster(app);
assert.deepEqual(base,roster(baseline),'Shared roster/HP/order/IDs must remain unchanged');
const plan = JSON.parse(readFileSync('design/monster-samples/eiken4-redesign-level1-plan.json','utf8'));
const proposals = JSON.parse(readFileSync('docs/monster-name-proposals-2026-10-05/names.json','utf8'));
const planned = proposals.entries.filter(e => e.course === 'Eiken4' && e.level === 1);
assert.equal(plan.assets.length,43);
assert.deepEqual(plan.assets.map(e=>[e.key,e.name]),planned.map(e=>[e.key,e.name]));
assert.deepEqual(plan.assets.map(e=>e.monsterId),[...base[1].guide,...base[1].challenge].map(e=>e.id));
const {applyMonsterProfile,getMonsterProfile} = load('src/monsterProfiles.ts');
const profiles = JSON.parse(readFileSync('src/monsterProfiles.json','utf8'));
if (!process.argv.includes('--plan-only')) {
  assert.equal(profiles.filter(e=>e.course==='Eiken4' && /^.[1]_/.test(e.monsterId)).length,43);
  const oldNames = new Set([1,2,3].flatMap(level=>[...base[level].guide,...base[level].challenge].map(e=>e.name)));
  const groups = new Map();
  for (const p of profiles) {
    const key = `${p.course}:${p.monsterId[1]}`;
    groups.set(key,[...(groups.get(key) ?? []),p]);
  }
  for (const [key,group] of groups) assert.equal(group.length,43,`Incomplete enabled level ${key}`);
  for (const entry of profiles) {
    const level = Number(entry.monsterId[1]);
    const accepted = proposals.entries.find(e=>e.course===entry.course && e.monsterId===entry.monsterId);
    assert.equal(entry.name,accepted?.name);
    const old = [...base[level].guide,...base[level].challenge].find(e=>e.id===entry.monsterId);
    const updated = applyMonsterProfile(entry.course,old);
    assert.equal(updated.name,entry.name);
    assert.equal(updated.id,old.id);
    assert.equal(updated.baseHp,old.baseHp);
    assert.equal(updated.type==='boss',old.type==='boss','Boss status/music must remain unchanged');
    assert.equal(updated.type,entry.type);
    assert.equal(updated.theme,entry.theme);
    assert.equal(updated.dialogueStart,entry.dialogueStart);
    assert.ok(!oldNames.has(updated.name),'New name conflicts with retained Eiken5');
    assert.deepEqual(applyMonsterProfile('Eiken5',old),old);
    assert.equal(getMonsterProfile(entry.course,old.id).artFolder,entry.artFolder);
    for (const size of [256,384,1024]) assert.ok(existsSync(`public/monsters/${entry.artFolder}/${size}/${old.id}.webp`));
  }
  for (const level of [1,2,3]) for (const m of [...base[level].guide,...base[level].challenge]) {
    if (!getMonsterProfile('Eiken4',m.id)) assert.deepEqual(applyMonsterProfile('Eiken4',m),m);
  }
  const artModule = {exports:{}};
  const artSource = readFileSync('src/monsterArt.ts','utf8').replaceAll('import.meta.env.BASE_URL',"'/test/'");
  vm.runInNewContext(ts.transpileModule(artSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {module:artModule,exports:artModule.exports,require:()=>load('src/monsterProfiles.ts')});
  for (const p of profiles) {
    assert.equal(artModule.exports.getMonsterArtUrl(p.monsterId,p.course),`/test/monsters/${p.artFolder}/384/${p.monsterId}.webp`);
    assert.equal(artModule.exports.getMonsterArtUrl(p.monsterId,p.course,100),`/test/monsters/${p.artFolder}/256/${p.monsterId}.webp`);
    assert.equal(artModule.exports.getMonsterPreviewArtUrl(p.monsterId,p.course),`/test/monsters/${p.artFolder}/1024/${p.monsterId}.webp`);
  }
  assert.equal(artModule.exports.getMonsterArtUrl('m1_1','Eiken5'),'/test/monsters/eiken5-level1/384/m1_1.webp');
  assert.equal(artModule.exports.getMonsterArtUrl('m1_1','Conversation'),undefined);
}
assert.ok(app.includes('getCourseMonsters(diff, level)'));
assert.ok(app.includes('getCourseMonsters(bookDifficulty, bookLevel)'));
assert.ok(app.includes('getCourseMonsters(gameState.selectedDifficulty, gameState.selectedLevel)'));
const keySource = source => /const getUniqueKey[\s\S]+?};/.exec(source)?.[0].replace(/\r/g,'');
assert.equal(keySource(app),keySource(baseline), 'Progress/save key must not change');
console.log('PASS: 43 assignments; accepted names; Eiken5 roster/HP/IDs/order and save identity preserved; scoped profiles and files');
