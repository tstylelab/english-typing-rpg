import type { Question, QuestionSetFile } from '../../questions';
import { pre2VocabularyRows } from './pre2Vocabulary';
import { pre2PhraseRows } from './pre2Phrases';
import { pre2SentenceRows, pre2Grammar, pre2ExpressionPoints } from './pre2Sentences';

type Entry = { band: number; sourceId?: number; question: Question };
const lines = (rows: string) => rows.split('\n').map(line => line.split('|'));
const vocabulary: Entry[] = lines(pre2VocabularyRows).map(([band, text, translation, exampleEn]) => ({
  band: Number(band), question: { text, translation, exampleEn },
}));
const phrases: Entry[] = lines(pre2PhraseRows).map(([band, sourceId, text, translation, exampleEn]) => ({
  band: Number(band), sourceId: Number(sourceId), question: { text, translation, exampleEn },
}));
const sentences: Entry[] = lines(pre2SentenceRows).map(([band, sourceId, grammar, text, translation]) => ({
  band: Number(band), sourceId: Number(sourceId), question: { text, translation, grammarPoint: pre2ExpressionPoints[Number(sourceId)] ?? pre2Grammar[grammar] },
}));

// Concrete daily language precedes broader uses and abstract/complex language.
const ordered = (entries: Entry[]) => [...entries].sort((a, b) => a.band - b.band || a.question.text.length - b.question.text.length);
export const pre2Curriculum = { 1: ordered(vocabulary), 2: ordered(phrases), 3: ordered(sentences) };
export const getPre2CurriculumLimit = (level: 1 | 2 | 3, stageIndex: number) => {
  const band = stageIndex < 7 ? 1 : stageIndex < 14 ? 2 : 3;
  return pre2Curriculum[level].filter(entry => entry.band <= band).length;
};

const pre2: QuestionSetFile = {
  category: 'eiken', series: '英検', difficultyKey: 'EikenPre2', displayName: '英検準2級',
  levels: {
    1: pre2Curriculum[1].map(entry => entry.question),
    2: pre2Curriculum[2].map(entry => entry.question),
    3: pre2Curriculum[3].map(entry => entry.question),
  },
};
export default pre2;
