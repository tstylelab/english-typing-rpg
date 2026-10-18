import original from './grade4.json';
import foundations from './grade4Foundations.json';
import type { QuestionSetFile } from '../../questions';

// Keep the published objects available: saved question identities must not change.
export const legacyGrade4Sentences = original.levels['3'];
export const grade4Foundations = foundations;
export const getGrade4FoundationLimit = (stageIndex: number) => {
  const band = stageIndex < 7 ? 1 : stageIndex < 14 ? 2 : 3;
  return foundations.filter(entry => entry.band <= band).length;
};
export default {
  ...original,
  levels: { ...original.levels, '3': foundations.map(entry => entry.question) },
} as QuestionSetFile;
