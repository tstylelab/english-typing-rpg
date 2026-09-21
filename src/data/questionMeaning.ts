import corrections from './pre1MeaningCorrections.json';
import sentenceCorrections from './pre1SentenceMeaningCorrections.json';

type MeaningQuestion = { text: string; translation: string; exampleEn?: string };

// translation remains the legacy identity used by progress, exclusions and saved queues.
// Include the original example to avoid applying a Pre-1 correction to other courses.
const identity = (question: MeaningQuestion) => JSON.stringify([
  question.text, question.translation, question.exampleEn ?? '',
]);
const meanings = new Map([...corrections, ...sentenceCorrections].map(entry => [identity(entry), entry.meaning]));

export const getQuestionMeaning = (question: MeaningQuestion): string => (
  meanings.get(identity(question)) ?? question.translation
);
