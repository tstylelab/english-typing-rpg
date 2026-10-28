import entries from './grade2VocabularySynonymReview.json';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
export type VocabularySynonymExpression = { text: string; note: string };

// Display metadata only. The original translation and example remain save identities.
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const reviews = new Map(entries.map(entry => [identity(entry), entry.expressions]));

export const getGrade2VocabularySynonymReview = (
  course: DifficultyKey, level: number, question: QuestionLike,
): VocabularySynonymExpression[] | undefined => (
  course === 'Eiken2' && level === 1 ? reviews.get(identity(question)) : undefined
);
