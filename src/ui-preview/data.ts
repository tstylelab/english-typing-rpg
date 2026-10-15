import { QUESTIONS, type LevelKey } from '../data/questions';
import { grammarGuides, type GrammarCourse } from '../data/grammarGuides';
import { getQuestionMeaning } from '../data/questionMeaning';
import { getQuestionExample } from '../data/questionExamples';

export const courses = Object.keys(grammarGuides) as GrammarCourse[];
export const gradeLabel = (course: GrammarCourse) => `英検${grammarGuides[course].grade}`;
export const levelLabel = (level: LevelKey) => ['単語', '熟語・表現', '文章問題'][level - 1];
export type StudyState = '学習中' | 'もう少し' | '覚えた';
export type DemoQuestion = {
  id: string; course: GrammarCourse; level: LevelKey; text: string; meaning: string;
  example: string; state: StudyState; review: boolean; history: boolean; weak: boolean; selected: boolean;
};

// Real learning material; all progress and review flags are disposable examples.
export const demoQuestions: DemoQuestion[] = courses.flatMap(course => ([1, 2, 3] as const).flatMap(level => {
  const questions = QUESTIONS[course][level];
  const preferred = course === 'Eiken3' && level === 3
    ? ['I look forward to seeing you.', 'I have known her for five years.', 'Reading books is fun.', 'He told us to be quiet.', 'I have finished my homework.', 'I am afraid not.', 'How was your trip?', 'I like stories that make me laugh.']
      .map(text => questions.find(question => question.text === text)).filter(question => question !== undefined)
    : [];
  const allQuestions = [...preferred, ...questions.filter(question => !preferred.includes(question))];
  return allQuestions.map((question, index) => ({
    id: `${course}:${level}:${index}`, course, level, text: question.text,
    meaning: getQuestionMeaning(question, course), example: getQuestionExample(course, level, question) ?? '',
    state: (['学習中', 'もう少し', '覚えた'] as const)[index % 3], review: index < 3,
    history: index === 3, weak: index % 4 === 0, selected: index === 1,
  }));
}));
