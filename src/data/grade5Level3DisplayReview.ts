import entries from './grade5Level3DisplayReview.json';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (question: QuestionLike) => JSON.stringify([
  question.text, question.translation, question.exampleEn ?? '',
]);
const reviews = new Map(entries.map(entry => [identity(entry), entry.changes]));

// Display metadata only: the original questions and their saved keys stay intact.
export const getGrade5Level3DisplayReview = (
  course: string, level: number, question: QuestionLike,
) => course === 'Eiken5' && level === 3 ? reviews.get(identity(question)) : undefined;
