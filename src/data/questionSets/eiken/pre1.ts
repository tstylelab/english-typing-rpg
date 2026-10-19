import type { Question, QuestionSetFile } from '../../questions';
import part1 from './gradepre1-part1.json';
import part2 from './gradepre1-part2.json';
import foundations from './pre1GrammarFoundations.json';
import pointData from '../../pre1GrammarPointOverrides.json';

type Course = 'EikenPre1Part1' | 'EikenPre1Part2';
const points: Record<Course, Record<string, Question['grammarPoint']>> = pointData;
// Retain original source files, order and saved text/meaning identities.
export const legacyPre1SentencesByCourse = {
  EikenPre1Part1: part1.levels['3'],
  EikenPre1Part2: part2.levels['3'],
};
const expanded = (source: QuestionSetFile, course: Course): QuestionSetFile => ({
  ...source,
  levels: {
    ...source.levels,
    3: [
      ...source.levels['3'].map(question => ({ ...question, grammarPoint: points[course][question.text] })),
      ...foundations[course].map(entry => entry.question),
    ],
  },
});
export const pre1Part1 = expanded(part1 as QuestionSetFile, 'EikenPre1Part1');
export const pre1Part2 = expanded(part2 as QuestionSetFile, 'EikenPre1Part2');
