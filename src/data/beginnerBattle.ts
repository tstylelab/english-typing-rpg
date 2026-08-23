export type BeginnerBattleQuestion = {
  text: string;
  translation: string;
  emoji: string;
};

export type BeginnerBattlePhase = {
  title: string;
  shortTitle: string;
  description: string;
  questions: BeginnerBattleQuestion[];
};

export const BEGINNER_BATTLE_PHASES: BeginnerBattlePhase[] = [
  {
    title: 'もじバトル',
    shortTitle: 'もじ',
    description: '光っているキーを1つ押して攻撃しよう',
    questions: [
      { text: 'a', translation: 'Aのキー', emoji: '⭐' },
      { text: 's', translation: 'Sのキー', emoji: '⭐' },
      { text: 'd', translation: 'Dのキー', emoji: '⭐' },
      { text: 'f', translation: 'Fのキー', emoji: '⭐' },
      { text: 'j', translation: 'Jのキー', emoji: '⭐' },
      { text: 'k', translation: 'Kのキー', emoji: '⭐' },
      { text: 'l', translation: 'Lのキー', emoji: '⭐' },
      { text: 'e', translation: 'Eのキー', emoji: '⭐' },
      { text: 'i', translation: 'Iのキー', emoji: '⭐' },
      { text: 'o', translation: 'Oのキー', emoji: '⭐' },
    ],
  },
  {
    title: 'かんたん単語バトル',
    shortTitle: 'かんたん単語',
    description: '身近な3文字の英単語を打ってみよう',
    questions: [
      { text: 'cat', translation: 'ねこ', emoji: '🐱' },
      { text: 'dog', translation: 'いぬ', emoji: '🐶' },
      { text: 'sun', translation: 'たいよう', emoji: '☀️' },
      { text: 'red', translation: 'あか', emoji: '🔴' },
      { text: 'pen', translation: 'ペン', emoji: '🖊️' },
      { text: 'cup', translation: 'コップ', emoji: '🥤' },
      { text: 'hat', translation: 'ぼうし', emoji: '🧢' },
      { text: 'bus', translation: 'バス', emoji: '🚌' },
      { text: 'box', translation: 'はこ', emoji: '📦' },
      { text: 'map', translation: 'ちず', emoji: '🗺️' },
    ],
  },
  {
    title: '英検5級 おためしバトル',
    shortTitle: '英検5級おためし',
    description: '英検5級に出てくる短い単語を倒そう',
    questions: [
      { text: 'milk', translation: 'ぎゅうにゅう', emoji: '🥛' },
      { text: 'cake', translation: 'ケーキ', emoji: '🍰' },
      { text: 'apple', translation: 'りんご', emoji: '🍎' },
      { text: 'book', translation: 'ほん', emoji: '📖' },
      { text: 'bird', translation: 'とり', emoji: '🐦' },
      { text: 'fish', translation: 'さかな', emoji: '🐟' },
      { text: 'tree', translation: 'き', emoji: '🌳' },
      { text: 'star', translation: 'ほし', emoji: '🌟' },
      { text: 'blue', translation: 'あお', emoji: '🔵' },
      { text: 'hand', translation: 'て', emoji: '✋' },
    ],
  },
];

export const BEGINNER_BATTLE_QUESTIONS = BEGINNER_BATTLE_PHASES.flatMap(phase => phase.questions);
export const BEGINNER_BATTLE_PHASE_SIZE = 10;
