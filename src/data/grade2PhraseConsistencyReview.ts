import entries from './grade2PhraseConsistencyReview.json';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const reviews = new Map(entries.map(entry => [identity(entry), {
  ...entry, expressions: [...entry.hints, ...entry.related],
}]));

// One exact-sense review supplies the prompt and feedback. Keep saved fields,
// scoring and the set of questions with before-answer hints unchanged.
export const getGrade2PhraseConsistencyReview = (
  course: DifficultyKey, level: number, question: QuestionLike,
) => course === 'Eiken2' && level === 2 ? reviews.get(identity(question)) : undefined;
