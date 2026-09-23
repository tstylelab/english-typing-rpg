import type { Question, QuestionSetFile } from '../../questions';
import borrowedVocabulary from './grade2BorrowedVocabulary.json';
import { grade2VocabularyRows } from './grade2Vocabulary';
import { grade2PhraseRows } from './grade2Phrases';
import { grade2SentenceRows, grade2Grammar } from './grade2Sentences';

type Entry = { band: number; sourceId?: number; question: Question };
const lines = (rows: string) => rows.split('\n').map(line => line.split('|'));
const vocabulary: Entry[] = [
  ...lines(grade2VocabularyRows).map(([band, text, translation, exampleEn]) => ({
    band: Number(band), question: { text, translation, exampleEn },
  })),
  ...borrowedVocabulary,
];
const phrases: Entry[] = lines(grade2PhraseRows).map(([band, sourceId, text, translation, exampleEn]) => ({
  band: Number(band), sourceId: Number(sourceId), question: { text, translation, exampleEn },
}));
const sentences: Entry[] = lines(grade2SentenceRows).map(([band, sourceId, grammar, text, translation]) => ({
  band: Number(band), sourceId: Number(sourceId), question: { text, translation, grammarPoint: grade2Grammar[grammar] },
}));
const ordered = (entries: Entry[]) => [...entries].sort((a, b) => a.band - b.band || a.question.text.length - b.question.text.length);
export const grade2Curriculum = { 1: ordered(vocabulary), 2: ordered(phrases), 3: ordered(sentences) };
export const getGrade2CurriculumLimit = (level: 1 | 2 | 3, stageIndex: number) => {
  const band = stageIndex < 7 ? 1 : stageIndex < 14 ? 2 : 3;
  return grade2Curriculum[level].filter(entry => entry.band <= band).length;
};

const grade2: QuestionSetFile = {
  category: 'eiken', series: '英検', difficultyKey: 'Eiken2', displayName: '英検2級',
  levels: {
    1: grade2Curriculum[1].map(entry => entry.question),
    2: grade2Curriculum[2].map(entry => entry.question),
    3: grade2Curriculum[3].map(entry => entry.question),
  },
};
export default grade2;
