import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = 'design/monster-samples';
const [course = 'Eiken4', levelText = '1'] = process.argv.slice(2);
const level = Number(levelText);
if (!['Eiken4','Eiken3','EikenPre2','Eiken2','EikenPre1Part1','EikenPre1Part2','Eiken1Part1','Eiken1Part2'].includes(course) || ![1,2,3].includes(level)) throw Error('Invalid course/level');
const prefix = `${course.toLowerCase()}-redesign-level${level}`;
const concepts = JSON.parse(readFileSync(`${root}/${prefix}-concepts.json`, 'utf8'));
const names = JSON.parse(readFileSync('docs/monster-name-proposals-2026-10-05/names.json', 'utf8'));
const selected = names.entries.filter(e => e.course === course && e.level === level);
if (selected.length !== 43 || concepts.length !== 43 || new Set(selected.map(e => e.key)).size !== 43) throw Error('Expected exactly 43 unique assignments');
const instruction = 'Use case: illustration-story. Asset: one original full-body monster sprite for a children friendly English learning RPG. Genuine transparent alpha background. Square composition. One character only, centered within the central 75 percent of the canvas, generous transparent margin on EVERY edge. Clear distinctive silhouette and expressive face readable at thumbnail scale, polished professional character illustration. The named subject is mandatory. No text, lettering, numerals, logos, scenery, background, checkerboard, ground shadow, outer glow, loose particles, or cropped limbs. Accessories must remain part of this single character. ';
const assets = selected.map((entry, i) => {
  const [type, color, mood, concept, dialogueStart, dialogueDefeat] = concepts[i];
  return { ...entry, type, color, mood, theme: entry.name, dialogueStart, dialogueDefeat,
    artFolder: `${course.toLowerCase()}-v2-level${level}`, concept, prompt: instruction + `Character name (do not write it): ${entry.name}. Subject and medium: ${concept}.` };
});
const plan = { course, level, count: 43, authorizedOn: '2026-10-05',
  generationTool: 'built-in image_gen', oldArtworkReused: false, assets };
plan.assignmentHash = createHash('sha256').update(JSON.stringify(assets)).digest('hex');
mkdirSync(`${root}/${prefix}-receipts`, { recursive: true });
writeFileSync(`${root}/${prefix}-plan.json`, JSON.stringify(plan, null, 2) + '\n');
console.log(JSON.stringify({ count: assets.length, training: assets.filter(e => e.area === 'training').length, battle: assets.filter(e => e.area === 'battle').length, assignmentHash: plan.assignmentHash, assets }));
