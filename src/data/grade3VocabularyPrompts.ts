import entries from './grade3Level1Prompts.json';
import { grade3VocabularyRows } from './questionSets/eiken/grade3Vocabulary';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const corrections = new Map(entries.map(entry => [identity(entry), entry]));
const cues = new Map(grade3VocabularyRows.trim().split('\n').map(line => {
  const [, text, translation, exampleEn] = line.split('|');
  const key = identity({ text, translation, exampleEn });
  const prefix = corrections.get(key)?.answerPrefix;
  const words = text.split(/\s+/);
  const spelling = prefix ? `${prefix}…` : words.map(word => `${word[0]}…`).join(' ');
  // Spaces are excluded; punctuation such as the hyphen in part-time is counted.
  return [key, `${spelling}（${words.length > 1 ? `${words.length}語・` : ''}${text.replace(/\s/g, '').length}文字）`];
}));

// Display-only overrides, matched to the original sense and course. Keep source
// translations, exported questions and progress IDs intact.
export const getGrade3VocabularyMeaning = (question: QuestionLike, difficulty?: DifficultyKey): string | undefined => (
  difficulty === 'Eiken3' ? corrections.get(identity(question))?.meaning : undefined
);

// A requested form, not a claim that other natural translations are wrong.
// Keep this separate from Japanese meanings so speech does not read the cue.
export const getGrade3VocabularyAnswerCue = (question: QuestionLike, difficulty: DifficultyKey, level: number): string | undefined => (
  difficulty === 'Eiken3' && level === 1 ? cues.get(identity(question)) : undefined
);
