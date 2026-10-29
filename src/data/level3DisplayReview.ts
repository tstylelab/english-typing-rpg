import entries from './level3DisplayReview.json';

type QuestionLike = { text: string; translation: string; exampleEn?: string };
const identity = (course: string, question: QuestionLike) => JSON.stringify([
  course, question.text, question.translation, question.exampleEn ?? '',
]);
const reviews = new Map(entries.map(entry => [identity(entry.course, entry), entry]));
// Grammar notes already resolve older saved questions by course and sentence text.
const grammar = new Map(entries.filter(entry => entry.grammar).map(entry => [
  JSON.stringify([entry.course, entry.text]), entry.grammar,
]));

export const getLevel3DisplayReview = (
  course: string, level: number, question: QuestionLike,
) => level === 3 ? reviews.get(identity(course, question)) : undefined;

export const getLevel3ReviewedGrammarPoint = (
  course: string, level: number, text: string,
) => level === 3 ? grammar.get(JSON.stringify([course, text])) : undefined;
