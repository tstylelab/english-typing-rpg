import eikenGrade4Json from './questionSets/eiken/grade4.json';
import eikenGrade3 from './questionSets/eiken/grade3';
import eikenPre2 from './questionSets/eiken/pre2';
import eikenGrade5Json from './questionSets/eiken/grade5.json';
import eikenGradePre1Part1Json from './questionSets/eiken/gradepre1-part1.json';
import eikenGradePre1Part2Json from './questionSets/eiken/gradepre1-part2.json';
import conversationBeginnerJson from './questionSets/conversation/beginner.json';

export type Question = {
  text: string;
  translation: string;
  basicMeaning?: string;
  exampleEn?: string;
  exampleJa?: string;
  synonyms?: string[];
  promptEn?: string;
  promptJa?: string;
  speakingTip?: string;
  grammarPoint?: { label: string; note: string; pattern: string };
};

export type DifficultyKey = 'Eiken5' | 'Eiken4' | 'Eiken3' | 'EikenPre2' | 'EikenPre1Part1' | 'EikenPre1Part2' | 'Conversation';
export type LevelKey = 1 | 2 | 3;
export type QuestionSetFile = {
  category: string;
  series: string;
  difficultyKey: DifficultyKey;
  displayName: string;
  levels: Record<string, Question[]>;
};

const questionSetLibrary = {
  eiken: {
    grade5: eikenGrade5Json as QuestionSetFile,
    grade4: eikenGrade4Json as QuestionSetFile,
    grade3: eikenGrade3,
    pre2: eikenPre2,
    gradepre1Part1: eikenGradePre1Part1Json as QuestionSetFile,
    gradepre1Part2: eikenGradePre1Part2Json as QuestionSetFile,
  },
  toeic: {},
  conversation: {
    beginner: conversationBeginnerJson as QuestionSetFile,
  },
} satisfies {
  eiken: Record<string, QuestionSetFile>;
  toeic: Record<string, QuestionSetFile>;
  conversation: Record<string, QuestionSetFile>;
};

const toLevelRecord = (setFile: QuestionSetFile): Record<LevelKey, Question[]> => ({
  1: setFile.levels['1'] ?? [],
  2: setFile.levels['2'] ?? [],
  3: setFile.levels['3'] ?? [],
});

export const QUESTIONS: Record<DifficultyKey, Record<LevelKey, Question[]>> = {
  Eiken5: toLevelRecord(questionSetLibrary.eiken.grade5),
  Eiken4: toLevelRecord(questionSetLibrary.eiken.grade4),
  Eiken3: toLevelRecord(questionSetLibrary.eiken.grade3),
  EikenPre2: toLevelRecord(questionSetLibrary.eiken.pre2),
  EikenPre1Part1: toLevelRecord(questionSetLibrary.eiken.gradepre1Part1),
  EikenPre1Part2: toLevelRecord(questionSetLibrary.eiken.gradepre1Part2),
  Conversation: toLevelRecord(questionSetLibrary.conversation.beginner),
};

export const QUESTION_SET_LIBRARY = questionSetLibrary;
