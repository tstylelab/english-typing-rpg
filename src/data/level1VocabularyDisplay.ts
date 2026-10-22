import corrections from './level1VocabularyDisplayCorrections.json';
import type { DifficultyKey } from './questions';

type VocabularyQuestion = { text: string; translation?: string; exampleEn?: string };

// Match the original fields, including the course, so saved copies resolve
// without changing their identity or applying a gloss to another course.
const identity = (course: string, question: VocabularyQuestion) => JSON.stringify([
  course, question.text, question.translation, question.exampleEn ?? '',
]);
const displays = new Map(corrections.map(entry => [identity(entry.course, entry), entry]));

export const getLevel1VocabularyDisplay = (question: VocabularyQuestion, course?: DifficultyKey) => (
  course && question.translation !== undefined ? displays.get(identity(course, question)) : undefined
);
