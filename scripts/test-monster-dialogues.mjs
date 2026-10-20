import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { load } from './lib/load-typescript-data.mjs';
import { loadBattleTuning } from './lib/load-battle-tuning.mjs';

const data = JSON.parse(readFileSync('src/monsterDialogues.json', 'utf8'));
const reviewed = JSON.parse(readFileSync('docs/monster-dialogue-drafts-2026-10-17/catalogue.json', 'utf8'));
const edits = JSON.parse(readFileSync('docs/monster-dialogue-drafts-2026-10-17/transition-edits.json', 'utf8'));
const english = JSON.parse(readFileSync('docs/monster-dialogue-drafts-2026-10-17/approved-english-2026-10-20.json', 'utf8'));
const { advanceQuestionSpeech, applyMonsterDialogue, getMonsterDialogue } = load('src/monsterDialogues.ts');
const source = readFileSync('src/App.tsx', 'utf8');
const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declaration = ast.statements.filter(ts.isVariableStatement).flatMap(n => [...n.declarationList.declarations])
  .find(n => n.name.getText(ast) === 'getCourseMonsters');
const tuning = loadBattleTuning(source);
const context = { MONSTERS: tuning.roster, ...load('src/monsterProfiles.ts'), applyMonsterDialogue };
vm.runInNewContext(ts.transpileModule(`const ${declaration.getText(ast)};globalThis.roster=getCourseMonsters;`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
const plain = value => JSON.parse(JSON.stringify(value));
assert.equal(Object.keys(data).length, 1161);
const reviewedKeys = new Set(reviewed.map(r => `${r.course}:${r.id}`));
assert.deepEqual(new Set(Object.keys(data)), reviewedKeys);
for (const row of reviewed) {
  const key = `${row.course}:${row.id}`;
  const expected = { name: row.name, entrance: row.entrance, battle: row.battle, aside: row.aside,
    pressure: row.pressure, defeat: row.defeat, ...edits[key], ...english[key] };
  assert.deepEqual(data[key], expected, `Must use the approved content: ${key}`);
}

let frozen = 0, transitions = 0;
for (const [key, dialogue] of Object.entries(data)) {
  const [course, id] = key.split(':');
  const level = Number(id[1]);
  const original = [...tuning.roster[level].guide, ...tuning.roster[level].challenge].find(m => m.id === id);
  const beforeDialogue = context.applyMonsterProfile(course, original);
  const roster = context.roster(course, level);
  const actual = [...roster.guide, ...roster.challenge].find(m => m.id === id);
  assert.equal(actual.name, dialogue.name, key);
  const { dialogueStart: oldStart, dialogueDefeat: oldDefeat, ...protectedBefore } = beforeDialogue;
  const { dialogueStart: newStart, dialogueDefeat: newDefeat, ...protectedAfter } = actual;
  assert.deepEqual(plain(protectedAfter), plain(protectedBefore), `Only speech may change: ${key}`);
  assert.ok(oldStart && oldDefeat && newStart && newDefeat);
  assert.deepEqual([...roster.guide, ...roster.challenge].map(m => m.id), [...tuning.roster[level].guide, ...tuning.roster[level].challenge].map(m => m.id));
  assert.equal(actual.dialogueStart, dialogue.entrance);
  assert.equal(actual.dialogueDefeat, dialogue.defeat);
  const allowed = new Set([dialogue.entrance, ...dialogue.battle, ...dialogue.aside, ...dialogue.pressure]);
  for (const lowFrom of [2, 6, 18]) {
    let previous = null;
    const seen = new Set();
    for (let questionNumber = 1; questionNumber <= 70; questionNumber++) {
      const request = { encounterKey: key, questionNumber, dialogue, hpRate: questionNumber >= lowFrom ? .1 : 1, fallbackText: 'legacy' };
      const speech = advanceQuestionSpeech(previous, request);
      assert.ok(allowed.has(speech.text), key);
      assert.notEqual(speech.text, previous?.text, `No adjacent repeat: ${key}:${questionNumber}`);
      if (speech.kind === 'pressure') {
        assert.ok(request.hpRate <= .2);
        assert.notEqual(previous?.kind, 'pressure');
      }
      assert.ok(!(speech.kind === 'aside' && previous?.kind === 'aside'), 'Side remarks cannot dominate consecutive questions');
      for (const hpRate of [0, .05, .2, .8, 1]) {
        assert.equal(advanceQuestionSpeech(speech, { ...request, hpRate, fallbackText: 'changed by mistakes or flash' }), speech,
          `The displayed question must retain its snapshot: ${key}`);
        frozen++;
      }
      seen.add(speech.text); previous = speech; transitions++;
    }
    assert.deepEqual(seen, allowed, `Every authored option is reachable before reuse: ${key}`);
    const another = advanceQuestionSpeech(previous, { encounterKey: `${key}:replay`, questionNumber: 1, dialogue, hpRate: 1, fallbackText: '' });
    assert.equal(another.text, dialogue.entrance);
    assert.equal(another.generalTurn, 0);
  }
}
const legacy = { id: 'm1_1', dialogueStart: 'old entry', dialogueDefeat: 'old exit', baseHp: 150 };
assert.equal(getMonsterDialogue('Conversation', legacy.id), undefined);
assert.equal(getMonsterDialogue('unknown', legacy.id), undefined);
assert.equal(applyMonsterDialogue('Conversation', legacy), legacy);
const fallback = { encounterKey: 'fallback', questionNumber: 1, hpRate: 1, fallbackText: 'safe legacy text' };
const legacySpeech = advanceQuestionSpeech(null, fallback);
assert.equal(legacySpeech.text, fallback.fallbackText);
assert.equal(advanceQuestionSpeech(legacySpeech, { ...fallback, hpRate: .1, fallbackText: 'different' }), legacySpeech);
assert.ok(source.includes('<MonsterBattleSpeech'), 'Actual battle must mount the frozen speech component');
console.log(`PASS: ${Object.keys(data).length} reviewed identities; ${transitions} question transitions; ${frozen} same-question HP/effect changes frozen; all lines reachable, no adjacent repeats; roster/HP/types/order preserved; legacy fallback.`);
