import entries from './grade5VocabularyReview.json';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const reviews = new Map(entries.map(entry => [identity(entry), entry]));

// Display feedback only: original question fields remain the saved identity.
export const getGrade5VocabularyReview = (
  course: DifficultyKey, level: number, question: QuestionLike,
) => course === 'Eiken5' && level === 1 ? reviews.get(identity(question)) : undefined;
