import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const work = 'design/monster-samples';
const prefix = process.argv[2] ?? 'eiken4-redesign-level1';
if (!/^[a-z0-9]+-redesign-level[123]$/.test(prefix)) throw Error('Invalid prefix');
const plan = JSON.parse(readFileSync(`${work}/${prefix}-plan.json`, 'utf8'));
const report = JSON.parse(readFileSync(`${work}/${prefix}-sizes.json`, 'utf8'));
assert.equal(report.count, 43);
assert.deepEqual(report.missing, []);
assert.deepEqual(report.issues, []);
const fields = ['course', 'monsterId', 'name', 'type', 'color', 'theme', 'dialogueStart', 'dialogueDefeat', 'artFolder'];
const themes = {comic:'コミカル',cool:'かっこいい',cute:'かわいい',beautiful:'きれい'};
// Preserve gameplay boss classification even for a cute/object redesign.
const app = readFileSync('src/App.tsx','utf8');
const begin = app.indexOf('const BASE_MONSTERS:');
const end = app.indexOf('// --- Components ---',begin);
assert.ok(begin >= 0 && end > begin);
const context = {};
vm.runInNewContext(ts.transpileModule(app.slice(begin,end)+'\nthis.roster=MONSTERS;',{
  compilerOptions:{target:ts.ScriptTarget.ES2022},
}).outputText,context);
const original = [...context.roster[plan.level].guide,...context.roster[plan.level].challenge];
const effectiveAssets = report.assets.map(row => {
  const old = original.find(monster=>monster.id===row.monsterId);
  assert.ok(old,`Unknown monster ${row.monsterId}`);
  assert.equal(row.type==='boss' && old.type!=='boss',false,`Unexpected new boss ${row.monsterId}`);
  return {...row,type:old.type==='boss'?'boss':row.type};
});
const replacement = effectiveAssets.map(row => {
  for (const size of [256,384,1024]) {
    assert.ok(existsSync(`public/monsters/${row.artFolder}/${size}/${row.monsterId}.webp`));
  }
  return Object.fromEntries(fields.map(field => [field,field === 'theme' ? themes[row.mood] : row[field]]));
});
const previous = JSON.parse(readFileSync('src/monsterProfiles.json', 'utf8'));
const keys = new Set(replacement.map(row => `${row.course}:${row.monsterId}`));
assert.equal(keys.size, 43);
const profiles = [...previous.filter(row => !keys.has(`${row.course}:${row.monsterId}`)), ...replacement];
assert.equal(new Set(profiles.map(row => row.name)).size, profiles.length);
writeFileSync('src/monsterProfiles.json', JSON.stringify(profiles,null,2)+'\n');
mkdirSync('docs/monster-redesign', {recursive:true});
writeFileSync(`docs/monster-redesign/${plan.course.toLowerCase()}-level${plan.level}.json`, JSON.stringify({course:plan.course,level:plan.level,count:43,
  generationTool:'built-in image_gen', oldArtworkReused:false, totalBytes:report.totalBytes,
  assets:effectiveAssets.map(row=>({...row,theme:themes[row.mood]}))},null,2)+'\n');
console.log(`Activated ${replacement.length} course-specific name/art profiles`);
