import entries from './grade4Level1Prompts.json';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (question: QuestionLike) => JSON.stringify([question.text, question.translation, question.exampleEn ?? '']);
const prompts = new Map(entries.map(entry => [identity(entry), entry]));

// Display-only, matched to the unchanged source identity and scoped to Grade 4.
export const getGrade4VocabularyMeaning = (question: QuestionLike, difficulty?: DifficultyKey): string | undefined => (
  difficulty === 'Eiken4' ? prompts.get(identity(question))?.meaning : undefined
);

// These are other expressions, not accepted-answer changes or spelling cues.
// Notes describe overlapping senses; they do not claim interchangeability in every sentence.
export const getGrade4VocabularySynonyms = (question: QuestionLike, difficulty: DifficultyKey, level: number) => (
  difficulty === 'Eiken4' && level === 1 ? prompts.get(identity(question))?.synonyms ?? [] : []
);
