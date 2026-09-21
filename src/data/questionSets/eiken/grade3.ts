import type { Question, QuestionSetFile } from '../../questions';
import { grade3VocabularyRows } from './grade3Vocabulary';
import { grade3PhraseRows } from './grade3Phrases';
import { grade3SentenceRows, grade3Grammar } from './grade3Sentences';

type Entry = { band: number; sourceId?: number; question: Question };
const lines = (rows: string) => rows.split('\n').map(line => line.split('|'));
const vocabulary: Entry[] = lines(grade3VocabularyRows).map(([band, text, translation, exampleEn]) => ({
  band: Number(band), question: { text, translation, exampleEn },
}));
const phrases: Entry[] = lines(grade3PhraseRows).map(([band, sourceId, text, translation, exampleEn]) => ({
  band: Number(band), sourceId: Number(sourceId), question: { text, translation, exampleEn },
}));
const sentences: Entry[] = lines(grade3SentenceRows).map(([band, sourceId, grammar, text, translation]) => ({
  band: Number(band), sourceId: Number(sourceId), question: { text, translation, grammarPoint: grade3Grammar[grammar] },
}));

// Meaning/grammar bands come first; input length only orders items within a band.
const ordered = (entries: Entry[]) => [...entries].sort((a, b) => a.band - b.band || a.question.text.length - b.question.text.length);
export const grade3Curriculum = { 1: ordered(vocabulary), 2: ordered(phrases), 3: ordered(sentences) };
export const getGrade3CurriculumLimit = (level: 1 | 2 | 3, stageIndex: number) => {
  const band = stageIndex < 7 ? 1 : stageIndex < 14 ? 2 : 3;
  return grade3Curriculum[level].filter(entry => entry.band <= band).length;
};

const grade3: QuestionSetFile = {
  category: 'eiken', series: '英検', difficultyKey: 'Eiken3', displayName: '英検3級',
  levels: {
    1: grade3Curriculum[1].map(entry => entry.question),
    2: grade3Curriculum[2].map(entry => entry.question),
    3: grade3Curriculum[3].map(entry => entry.question),
  },
};
export default grade3;
