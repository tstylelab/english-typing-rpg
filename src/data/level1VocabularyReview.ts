import entries from './level1VocabularyReview.json';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (course: string, question: QuestionLike) => JSON.stringify([
  course, question.text, question.translation, question.exampleEn ?? '',
]);
const reviews = new Map(entries.map(entry => [identity(entry.course, entry), entry]));

// Display feedback only. Imported questions retain their original saved identity.
export const getLevel1VocabularyReview = (
  course: DifficultyKey, level: number, question: QuestionLike,
) => level === 1 ? reviews.get(identity(course, question)) : undefined;
