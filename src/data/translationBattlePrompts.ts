import entries from './translationBattlePrompts.json';
import type { DifficultyKey } from './questions';
import { getGrade2VocabularySynonymReview } from './grade2VocabularySynonymReview';
import { getGrade5Level3DisplayReview } from './grade5Level3DisplayReview';
type QuestionLike = { text: string; translation: string; exampleEn?: string };
export type TranslationBattleExpression = { text: string; note: string };
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const reviewedEntries = entries.map(entry => ({
  ...entry, ...getGrade5Level3DisplayReview(entry.course, entry.level, entry),
}));
const meanings = new Map(reviewedEntries.map(e => [e.course + ':' + identity(e), e.meaning]));
const prompts = new Map(reviewedEntries.map(e => {
  // Keep the existing set of before-answer hints; do not add hints to other words.
  const reviewed = e.alternatives.length > 0
    ? getGrade2VocabularySynonymReview(e.course as DifficultyKey, e.level, e) : undefined;
  return [e.course + ':' + e.level + ':' + identity(e),
    reviewed === undefined ? e : { ...e, alternatives: reviewed }] as const;
}));
export const getReviewedTranslationMeaning = (q: QuestionLike, course?: DifficultyKey) => course ? meanings.get(course + ':' + identity(q)) : undefined;
export const getTranslationBattlePrompt = (q: QuestionLike, course: DifficultyKey, level: number) => prompts.get(course + ':' + level + ':' + identity(q));
