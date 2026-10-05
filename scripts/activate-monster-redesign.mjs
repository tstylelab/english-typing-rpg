import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
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
const replacement = report.assets.map(row => {
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
  assets:report.assets.map(row=>({...row,theme:themes[row.mood]}))},null,2)+'\n');
console.log(`Activated ${replacement.length} course-specific name/art profiles`);
