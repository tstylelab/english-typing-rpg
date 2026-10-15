// Authoring tool only: the reviewed order below becomes exact-text runtime links.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {load} from './lib/load-typescript-data.mjs';
const source='src/data/questionSets/eiken/grade1Sentences.ts';
assert.equal(readFileSync(source,'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show','14d0826:'+source],{encoding:'utf8'}).replace(/\r\n/g,'\n'),'Review source changes before regenerating positional authoring plan');
const {grade1SentenceRows}=load(source);
const plans=[
  `concession force-to passive condition relative-subject should quantity that-content
   concession because passive unless relative-subject possibility comparison that-content
   concession cause-direct passive condition relative-subject should quantity that-content
   concession lead-to passive-time unless relative-subject possibility comparison that-content
   concession leave-state passive-time condition relative-subject must comparison that-content`,
  `concession cause-direct accused-of unless relative-subject possibility comparison-past that-content
   concession cause-direct passive-time condition relative-subject should comparison that-content
   neither-would allow-to passive-time unless relative-subject possibility comparison that-past-perfect
   concession help passive condition whose must comparison that-past-perfect
   concession force-to passive-time unless relative-subject should outweigh that-content`,
];
const result={};
for(const [index,plan] of plans.entries()) {
  const ids=plan.trim().split(/\s+/);
  const rows=grade1SentenceRows.split('\n').map(r=>r.split('|')).filter(r=>r[0]===String(index+1));
  assert.equal(ids.length,40);assert.equal(rows.length,40);
  result['Eiken1Part'+(index+1)]=Object.fromEntries(rows.map((r,i)=>[r[2],ids[i]]));
}
writeFileSync('src/data/grade1GrammarAssignments.ts', '// Reviewed exact-text links; regenerate with scripts/prepare-grade1-grammar-assignments.mjs.\nexport const grade1GrammarAssignments: Record<\'Eiken1Part1\' | \'Eiken1Part2\', Record<string, string>> = '+JSON.stringify(result,null,2)+';\n');
console.log('PASS: 80 reviewed Grade-1 exact-text assignments');
