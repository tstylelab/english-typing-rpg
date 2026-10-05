import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const [id, source] = process.argv.slice(2);
const root = 'design/monster-samples';
const prefixAt = process.argv.indexOf('--prefix');
const prefix = prefixAt >= 0 ? process.argv[prefixAt + 1] : 'eiken4-redesign-level1';
if (!/^[a-z0-9]+-redesign-level[123]$/.test(prefix)) throw Error('Invalid prefix');
const plan = JSON.parse(readFileSync(`${root}/${prefix}-plan.json`, 'utf8'));
const entry = plan.assets.find(e => e.monsterId === id);
if (!entry || !source || !path.isAbsolute(source) || path.extname(source).toLowerCase() !== '.png') throw Error('Invalid asset receipt');
const hash = createHash('sha256').update(readFileSync(source)).digest('hex');
const folder = `${root}/${prefix}-originals`;
mkdirSync(folder, { recursive: true });
const retained = `${folder}/${id}-${hash.slice(0, 12)}.png`;
if (!existsSync(retained)) copyFileSync(source, retained);
const receipt = `${root}/${prefix}-receipts/${id}.json`;
if (existsSync(receipt)) {
  const old = JSON.parse(readFileSync(receipt,'utf8'));
  if (old.sourceHash === hash && old.assignmentHash === plan.assignmentHash && old.key === entry.key) {
    console.log(JSON.stringify({key:entry.key,name:entry.name,retained,alreadySaved:true}));
    process.exit(0);
  }
  if (!process.argv.includes('--replace-reviewed')) throw Error(`Receipt already exists; preserve it and review before replacing: ${id}`);
  writeFileSync(`${root}/${prefix}-receipts/${id}-previous-${old.sourceHash.slice(0,12)}.json`, JSON.stringify(old,null,2)+'\n');
}
writeFileSync(receipt, JSON.stringify({ key: entry.key, name: entry.name, monsterId: id, assignmentHash: plan.assignmentHash, source: path.resolve(retained), sourceHash: hash }, null, 2) + '\n');
console.log(JSON.stringify({ key: entry.key, name: entry.name, retained }));
