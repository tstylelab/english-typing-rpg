import original from './grade5.json';
import foundations from './grade5Foundations.json';
import type { QuestionSetFile } from '../../questions';

// Historical question objects and their identities remain available for saved reviews.
export const legacyGrade5Sentences = original.levels['3'];
export const grade5Foundations = foundations;
export const getGrade5FoundationLimit = (stageIndex: number) => {
  const band = stageIndex < 7 ? 1 : stageIndex < 14 ? 2 : 3;
  return foundations.filter(entry => entry.band <= band).length;
};
export default {
  ...original,
  levels: { ...original.levels, '3': foundations.map(entry => entry.question) },
} as QuestionSetFile;
