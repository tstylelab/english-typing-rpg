// Authoring only: exact reviewed text from the editorial plan, never a runtime fallback.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {load} from './lib/load-typescript-data.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const plan=JSON.parse(readFileSync('docs/pre1-grammar-plan-2026-10-14.json','utf8'));
const corrections={
  'If I understand you correctly.':'conditional-intro',
  'When you put it that way.':'conditional-intro',
  'To put it simply.':'rephrase-intro',
  'To put it another way.':'rephrase-intro',
  'If you ask me.':'stance-intro',
  'From what I can tell.':'stance-intro',
  'The way I see it.':'stance-intro',
  "I can see where you're coming from.":'viewpoint-understanding',
  "I get where you're going with this.":'viewpoint-understanding',
  "I don't know if that's fair.":'indirect-if',
  "That's certainly a possibility.":'chance',
  "That's not a bad idea.":'litotes',
  "I'm still not convinced.":'sure-clause',
  'That works for me.':'practical-response',
  'I can work with that.':'practical-response',
  "That's more like it.":'practical-response',
  'That crossed my mind too.':'thought',
  "I'm on the fence about it.":'undecided',
};
const result=Object.fromEntries(plan.courses.map(({course,entries})=>{
  const map=Object.fromEntries(entries.map(e=>[e.text,corrections[e.text]??e.topicId]));
  assert.equal(entries.length,75);
  assert.deepEqual(Object.keys(map).sort(),QUESTIONS[course][3].map(q=>q.text).sort());
  assert.ok(!Object.values(map).some(id=>['conversation','intro-fragment'].includes(id)));
  return [course,map];
}));
writeFileSync('src/data/pre1GrammarAssignments.ts', '// Reviewed exact-text links; regenerate with scripts/prepare-pre1-grammar-assignments.mjs.\nexport const pre1GrammarAssignments: Record<\'EikenPre1Part1\' | \'EikenPre1Part2\', Record<string, string>> = '+JSON.stringify(result,null,2)+';\n');
console.log('PASS: 150 reviewed Pre-1 question assignments');
