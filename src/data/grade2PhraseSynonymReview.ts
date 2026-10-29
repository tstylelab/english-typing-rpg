import entries from './grade2PhraseSynonymReview.json';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const reviews = new Map(entries.map(entry => [identity(entry), entry.expressions]));

// Display metadata only; retain the exact original identity of imported questions.
export const getGrade2PhraseSynonymReview = (
  course: DifficultyKey, level: number, question: QuestionLike,
): Array<{ text: string; note: string }> | undefined => (
  course === 'Eiken2' && level === 2 ? reviews.get(identity(question)) : undefined
);
