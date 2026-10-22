import { getReviewedTranslationMeaning } from './translationBattlePrompts';
import corrections from './pre1MeaningCorrections.json';
import sentenceCorrections from './pre1SentenceMeaningCorrections.json';
import grade5Corrections from './grade5MeaningCorrections.json';
import grade4Corrections from './grade4MeaningCorrections.json';
import intermediateCorrections from './intermediateMeaningCorrections.json';
import additionalCorrections from './additionalMeaningCorrections.json';
import grade2VocabularyCorrections from './grade2VocabularyMeaningCorrections.json';
import { getLevel1VocabularyDisplay } from './level1VocabularyDisplay';
import type { DifficultyKey } from './questions';
import { getGrade4PhraseMeaning } from './grade4PhrasePrompts';
import { getGrade3VocabularyMeaning } from './grade3VocabularyPrompts';
import { getGrade4VocabularyMeaning } from './grade4VocabularyPrompts';

type MeaningQuestion = { text: string; translation: string; exampleEn?: string };

// translation remains the legacy identity used by progress, exclusions and saved queues.
// Include the original example to avoid applying corrections to other courses.
const identity = (question: MeaningQuestion) => JSON.stringify([
  question.text, question.translation, question.exampleEn ?? '',
]);
const meanings = new Map([...corrections, ...sentenceCorrections, ...grade5Corrections, ...grade4Corrections].map(entry => [identity(entry), entry.meaning]));
// Grade 2 reuses some Pre-1 questions verbatim. Scope new meanings to the course
// rather than changing the saved identity or leaking the correction to Pre-1.
const courseMeanings = new Map([...intermediateCorrections, ...additionalCorrections].map(entry => [
  `${entry.course}:${identity(entry)}`, entry.meaning,
]));
// Broaden the Grade 2 headword gloss without changing its legacy saved identity
// or the same question's meaning in another course.
const grade2VocabularyMeanings = new Map(grade2VocabularyCorrections.map(entry => [identity(entry), entry.meaning]));

export const getQuestionMeaning = (question: MeaningQuestion, difficulty?: DifficultyKey): string => (
  getLevel1VocabularyDisplay(question, difficulty)?.meaning
  ?? (difficulty === 'Eiken2' ? grade2VocabularyMeanings.get(identity(question)) : undefined)
  ?? getReviewedTranslationMeaning(question, difficulty)
  ?? getGrade3VocabularyMeaning(question, difficulty)
  ?? getGrade4VocabularyMeaning(question, difficulty)
  ?? getGrade4PhraseMeaning(question, difficulty)
  ?? (difficulty ? courseMeanings.get(`${difficulty}:${identity(question)}`) : undefined)
  ?? meanings.get(identity(question)) ?? question.translation
);
