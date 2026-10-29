import entries from './level2PhraseReview.json';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (course: string, q: QuestionLike) => JSON.stringify([
  course, q.text, q.translation, q.exampleEn ?? '',
]);
const reviews = new Map(entries.map(entry => [identity(entry.course, entry), entry]));

// Feedback metadata only; saved question fields and before-answer hints stay intact.
export const getLevel2PhraseReview = (
  course: DifficultyKey, level: number, question: QuestionLike,
) => level === 2 ? reviews.get(identity(course, question)) : undefined;
