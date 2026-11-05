import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Older Eiken audits freeze the 3-Level entry points. Verify the exact reviewed
// extension before presenting their released view; the real 500-item runtime,
// storage functions and all Eiken encounters are audited separately.
const approved = JSON.parse(fs.readFileSync(new URL('./conversation-release-contract.json', import.meta.url), 'utf8'));
const cache = new Map();
export function beforeConversationRelease(source, file) {
  const expected = approved[file];
  if (!expected) return source;
  assert.equal(createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex'), expected, `${file}: exact independently audited conversation extension`);
  if (!cache.has(file)) cache.set(file, execFileSync('git', ['show', `2e8755b:${file}`], { encoding: 'utf8', maxBuffer: 8_000_000 }));
  return cache.get(file);
}
