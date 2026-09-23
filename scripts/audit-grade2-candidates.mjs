import { parseGrade2Source } from './lib/parse-grade2-source.mjs';
import { load } from './lib/load-typescript-data.mjs';

const source = parseGrade2Source(process.argv[2]);
const { QUESTIONS } = load('src/data/questions.ts');
const normalize = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
const lower = new Set(['Eiken5', 'Eiken4', 'Eiken3', 'EikenPre2'].flatMap(key => Object.values(QUESTIONS[key]).flat()).map(q => normalize(q.text)));
const upper = new Map(['EikenPre1Part1', 'EikenPre1Part2'].flatMap(key => Object.values(QUESTIONS[key]).flat()).map(q => [normalize(q.text), q]));
const kind = process.argv[3] || '単語編';
const rank = process.argv[4] || 'A';
const records = source.filter(entry => entry.kind === kind && entry.rank === rank);
console.log(JSON.stringify({ total: source.length, kind, rank, count: records.length, lowerOverlap: records.filter(entry => lower.has(normalize(entry.text))).length, upperOverlap: records.filter(entry => upper.has(normalize(entry.text))).length }));
for (const entry of records) {
  const same = upper.get(normalize(entry.text));
  console.log(`${entry.id}\t${lower.has(normalize(entry.text)) ? 'LOW' : same ? 'UP ' : 'NEW'}\t${entry.text}${same ? `\t${same.translation}` : ''}`);
}
