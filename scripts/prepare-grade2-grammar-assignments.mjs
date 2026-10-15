// One-time authoring helper: stable exact-text links, with reviewed distinctions.
import { writeFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
const { grade2SentenceRows } = load('src/data/questionSets/eiken/grade2Sentences.ts');
const ids = { opinion:'opinion', agreement:'agreement', reason:'reason-because', order:'order', example:'example', addition:'addition', contrast:'contrast-clause', result:'result', conclusion:'conclusion', trend:'trend-change', importance:'it-to', relative:'relative-subject', passive:'passive', condition:'condition', indirect:'indirect-question', perfect:'perfect-result', gerund:'gerund', infinitive:'infinitive-purpose', comparison:'comparison' };
const overrides = {
  'I have two reasons why I think so.':'reasons-for-why',
  'I have two reasons for this.':'reasons-for-why',
  'The game was canceled because of the rain.':'reason-noun',
  'Thanks to her help, I finished on time.':'reason-noun',
  'Another reason is that it is easy to use.':'reason-content',
  'The first reason is that it saves money.':'reason-content',
  'One reason is that everyone needs a fair chance.':'reason-content',
  'The most important thing is to keep trying.':'infinitive-complement',
  'I prefer learning with friends.':'gerund',
  'In conclusion, the program is worth trying.':'worth',
  'The number of visitors is increasing.':'trend-number',
  'The number of online classes is increasing.':'trend-number',
  'However, we must consider the cost.':'contrast-link',
  'However, some people do not have enough time.':'contrast-link',
  'It is often said that travel broadens the mind.':'passive-report',
  'The book that you recommended was useful.':'relative-object',
  'Can you tell me how to apply for the program?':'wh-to',
  'I have lived in this town for ten years.':'perfect-duration',
  'I have never visited that museum.':'perfect-experience',
};
const assignments = Object.fromEntries(grade2SentenceRows.split('\n').map(row => {
  const [, , point, text] = row.split('|');
  if (!ids[point]) throw new Error(point);
  return [text, overrides[text] ?? ids[point]];
}));
writeFileSync('src/data/grade2GrammarAssignments.ts', '// Exact-text links reviewed against all Grade 2 Level 3 sentences.\nexport const grade2GrammarAssignments: Record<string, string> = ' + JSON.stringify(assignments, null, 2) + ';\n');
console.log(Object.keys(assignments).length + ' reviewed question links');
