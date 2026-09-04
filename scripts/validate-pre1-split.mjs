import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const questionSetDir = path.join(repoRoot, 'src', 'data', 'questionSets', 'eiken');
const readJson = (fileName) => JSON.parse(fs.readFileSync(path.join(questionSetDir, fileName), 'utf8'));

const combined = readJson('gradepre1.json');
const part1 = readJson('gradepre1-part1.json');
const part2 = readJson('gradepre1-part2.json');
const problems = [];
const counts = {};

if (part1.difficultyKey !== 'EikenPre1Part1' || part1.displayName !== '英検準1級①') {
  problems.push('Part 1 metadata is invalid.');
}
if (part2.difficultyKey !== 'EikenPre1Part2' || part2.displayName !== '英検準1級②') {
  problems.push('Part 2 metadata is invalid.');
}

for (const level of ['1', '2', '3']) {
  const allQuestions = combined.levels?.[level] ?? [];
  const part1Questions = part1.levels?.[level] ?? [];
  const part2Questions = part2.levels?.[level] ?? [];
  const joinedQuestions = [...part1Questions, ...part2Questions];
  const joinedKeys = joinedQuestions.map((question) => `${question.text}\u0000${question.translation}`);

  counts[level] = {
    combined: allQuestions.length,
    part1: part1Questions.length,
    part2: part2Questions.length,
  };

  if (JSON.stringify(joinedQuestions) !== JSON.stringify(allQuestions)) {
    problems.push(`Level ${level} split does not preserve the combined order and content.`);
  }
  if (new Set(joinedKeys).size !== joinedKeys.length) {
    problems.push(`Level ${level} contains duplicate questions across the split.`);
  }
  if (Math.abs(part1Questions.length - part2Questions.length) > 1) {
    problems.push(`Level ${level} is not split evenly.`);
  }
}

console.log(JSON.stringify({ counts, problems }, null, 2));
if (problems.length > 0) process.exitCode = 1;
