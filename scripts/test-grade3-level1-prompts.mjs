import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { load } from './lib/load-typescript-data.mjs';

const { QUESTIONS } = load('src/data/questions.ts');
const { getQuestionMeaning } = load('src/data/questionMeaning.ts');
const { getGrade3VocabularyAnswerCue } = load('src/data/grade3VocabularyPrompts.ts');
const { getGrade4PhraseMeaning } = load('src/data/grade4PhrasePrompts.ts');
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const entries = read('src/data/grade3Level1Prompts.json');
const report = readFileSync('docs/grade3-level1-prompt-audit-2026-10-07.md', 'utf8');
const identity = q => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const scopedKey = (course, q) => `${course}:${identity(q)}`;
const oldOverrides = new Map([...read('src/data/intermediateMeaningCorrections.json'), ...read('src/data/additionalMeaningCorrections.json')].map(c => [scopedKey(c.course, c), c.meaning]));
const oldMeaning = (q, course) => getGrade4PhraseMeaning(q, course) ?? oldOverrides.get(scopedKey(course, q)) ?? getQuestionMeaning(q);
const revised = new Map(entries.map(c => [identity(c), c]));
const questions = QUESTIONS.Eiken3[1];
assert.equal(questions.length, 514);
assert.equal(new Set(questions.map(identity)).size, 514);
assert.equal(createHash('sha256').update(JSON.stringify(questions)).digest('hex'), '1514b432902ba3931d3cf618afa76ca02bc10f35df8bfcc1e349b86fdecb1552', 'English, translations, examples, order and saved identities must stay unchanged');
assert.equal(entries.length, 247);
assert.equal(revised.size, entries.length);
for (const entry of entries) {
  assert.equal(questions.filter(q => identity(q) === identity(entry)).length, 1, `stale correction: ${entry.text}`);
  assert.notEqual(entry.meaning, oldMeaning(entry, 'Eiken3'));
  assert.ok(entry.meaning.length <= 28, entry.text);
  assert.ok(!/[a-z]/i.test(entry.meaning), 'Keep spelling cues out of Japanese speech');
  assert.equal((entry.meaning.match(/（/g) ?? []).length, (entry.meaning.match(/）/g) ?? []).length);
  assert.equal(getGrade3VocabularyAnswerCue({ ...entry, translation: '別の意味' }, 'Eiken3', 1), undefined);
}

// All current courses are compared against the existing display overrides;
// only the 247 Grade 3 Level 1 identities may change.
let audited = 0, changed = 0;
for (const [course, levels] of Object.entries(QUESTIONS)) {
  for (const [level, qs] of Object.entries(levels)) {
    for (const q of qs) {
      const before = JSON.stringify(q);
      const correction = course === 'Eiken3' && level === '1' ? revised.get(identity(q)) : undefined;
      const meaning = getQuestionMeaning(q, course);
      assert.equal(meaning, correction?.meaning ?? oldMeaning(q, course), `${course} Level ${level}: ${q.text}`);
      assert.equal(getQuestionMeaning(JSON.parse(before), course), meaning, 'Saved export/import question must resolve identically');
      assert.equal(JSON.stringify(q), before, 'Do not mutate legacy progress keys');
      if (correction) changed++;
      const cue = getGrade3VocabularyAnswerCue(q, course, Number(level));
      if (course === 'Eiken3' && level === '1') {
        const words = q.text.split(/\s+/);
        assert.ok(cue.endsWith(`${q.text.replace(/\s/g, '').length}文字）`));
        if (words.length > 1) assert.ok(cue.includes(`${words.length}語・`));
        assert.ok(!cue.includes(q.text), 'Do not reveal the full answer');
      } else assert.equal(cue, undefined, 'Do not add spelling clues to other courses or levels');
      audited++;
    }
  }
}
assert.equal(changed, 247);

const changeRows = report.split('\n').filter(line => /^\| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \|$/.test(line) && !line.startsWith('| 単語'));
assert.equal(changeRows.length, 247, 'Every changed meaning must be documented');
for (const row of changeRows) {
  const [text, before, after, reason] = row.split('|').slice(1, -1).map(value => value.trim());
  const q = questions.find(q => q.text === text);
  assert.ok(q && reason);
  assert.equal(oldMeaning(q, 'Eiken3'), before, `Historical display before: ${text}`);
  assert.equal(getQuestionMeaning(q, 'Eiken3'), after);
}
const auditRows = report.split('\n').filter(line => /^\| \d+ \|/.test(line));
assert.equal(auditRows.length, 514);
auditRows.forEach((row, i) => {
  const [number, text, meaning, cue, decision] = row.split('|').slice(1, -1).map(value => value.trim());
  const q = questions[i];
  assert.equal(Number(number), i + 1);
  assert.equal(text, q.text);
  assert.equal(meaning, getQuestionMeaning(q, 'Eiken3'));
  assert.equal(cue, getGrade3VocabularyAnswerCue(q, 'Eiken3', 1));
  assert.equal(decision, revised.has(identity(q)) ? '修正' : '維持');
});
for (const [a, b] of [['fix', 'repair'], ['smart', 'clever'], ['afraid', 'scared'], ['reach', 'arrive']]) {
  const cue = text => getGrade3VocabularyAnswerCue(questions.find(q => q.text === text), 'Eiken3', 1);
  assert.notEqual(cue(a), cue(b), `Synonym forms remain distinguishable: ${a}/${b}`);
}
assert.equal(getGrade3VocabularyAnswerCue(questions.find(q => q.text === 'everybody'), 'Eiken3', 1), 'everyb…（9文字）');
console.log(`PASS: ${audited} current questions; 514 audited words and cues; 247 documented meanings; unchanged other courses, original identities, saved-question round trips and synonym cues.`);
