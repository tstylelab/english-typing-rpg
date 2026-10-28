import entries from './grade2VocabularyUsageNotes.json';
import type { DifficultyKey } from './questions';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (q: QuestionLike) => JSON.stringify([q.text, q.translation, q.exampleEn ?? '']);
const notes = new Map(entries.map(entry => [identity(entry), entry.note]));

// Study feedback only. Keep this out of prompts, grading and saved identities.
export const getGrade2VocabularyUsageNote = (
  course: DifficultyKey, level: number, question: QuestionLike,
): string | undefined => (
  course === 'Eiken2' && level === 1 ? notes.get(identity(question)) : undefined
);
