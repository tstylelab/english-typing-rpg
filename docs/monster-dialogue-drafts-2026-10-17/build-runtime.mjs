import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const here = path.dirname(fileURLToPath(import.meta.url));
const records = JSON.parse(fs.readFileSync(path.join(here, 'catalogue.json'), 'utf8'));
const edits = JSON.parse(fs.readFileSync(path.join(here, 'transition-edits.json'), 'utf8'));
const english = JSON.parse(fs.readFileSync(path.join(here, 'approved-english-2026-10-20.json'), 'utf8'));
assert.equal(Object.keys(english).length, 645);
for (const [key, entry] of Object.entries(english)) {
  assert.match(key, /^Eiken(?:[2345]|Pre2):/);
  assert.deepEqual(Object.keys(entry).sort(), ['aside', 'battle', 'pressure']);
}
const output = {};
assert.equal(records.length, 1161, 'Only a complete, checked catalogue can be exported');
for (const record of records) {
  const key = `${record.course}:${record.id}`;
  assert.ok(!output[key], `Duplicate identity: ${key}`);
  const entry = { name: record.name, entrance: record.entrance, battle: record.battle,
    aside: record.aside, pressure: record.pressure, defeat: record.defeat, ...edits[key], ...english[key] };
  assert.equal(entry.battle.length, record.boss ? 5 : 3, key);
  assert.equal(entry.aside.length, record.boss ? 3 : 2, key);
  assert.equal(entry.pressure.length, record.boss ? 2 : 1, key);
  for (const line of [entry.entrance, ...entry.battle, ...entry.aside, ...entry.pressure, entry.defeat]) {
    assert.ok(typeof line === 'string' && line.trim() && [...line].length <= 70, key);
  }
  output[key] = entry;
}
for (const key of Object.keys(edits)) assert.ok(output[key], `Unused edit: ${key}`);
for (const key of Object.keys(english)) assert.ok(output[key], `Unused English overlay: ${key}`);
const destination = path.join(here, '../../src/monsterDialogues.json');
fs.writeFileSync(destination, JSON.stringify(output, null, 2) + '\n');
console.log(`Exported ${records.length} monster dialogue sets to ${destination}`);
