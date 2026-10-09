import entries from './grade3Level1Prompts.json';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const corrections = new Map(entries.map(entry => [identity(entry), entry]));
// Display-only overrides, matched to the original sense and course. Keep source
// translations, exported questions and progress IDs intact.
export const getGrade3VocabularyMeaning = (question: QuestionLike, difficulty?: DifficultyKey): string | undefined => (
  difficulty === 'Eiken3' ? corrections.get(identity(question))?.meaning : undefined
);

// Retired: translation battles now use semantic notes and alternative expressions.
export const getGrade3VocabularyAnswerCue = (): undefined => undefined;
