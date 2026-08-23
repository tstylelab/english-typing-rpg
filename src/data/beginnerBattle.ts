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
    title: 'キーとなかよしバトル',
    shortTitle: 'キー入門',
    description: '光っている1文字のキーを押してみよう',
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
    title: '3文字スタートバトル',
    shortTitle: '3文字入門',
    description: '身近な3文字の単語を打ってみよう',
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
    title: '3文字どうぶつバトル',
    shortTitle: '3文字どうぶつ',
    description: '3文字のどうぶつと乗り物を倒そう',
    questions: [
      { text: 'pig', translation: 'ぶた', emoji: '🐷' },
      { text: 'fox', translation: 'きつね', emoji: '🦊' },
      { text: 'cow', translation: 'うし', emoji: '🐮' },
      { text: 'hen', translation: 'めんどり', emoji: '🐔' },
      { text: 'bee', translation: 'はち', emoji: '🐝' },
      { text: 'ant', translation: 'あり', emoji: '🐜' },
      { text: 'owl', translation: 'ふくろう', emoji: '🦉' },
      { text: 'bat', translation: 'こうもり', emoji: '🦇' },
      { text: 'car', translation: 'くるま', emoji: '🚗' },
      { text: 'van', translation: 'バン', emoji: '🚐' },
    ],
  },
  {
    title: '3文字くらしバトル',
    shortTitle: '3文字くらし',
    description: '暮らしの中にある3文字の単語に挑戦',
    questions: [
      { text: 'bag', translation: 'かばん', emoji: '👜' },
      { text: 'bed', translation: 'ベッド', emoji: '🛏️' },
      { text: 'egg', translation: 'たまご', emoji: '🥚' },
      { text: 'ice', translation: 'こおり', emoji: '🧊' },
      { text: 'sky', translation: 'そら', emoji: '🌤️' },
      { text: 'sea', translation: 'うみ', emoji: '🌊' },
      { text: 'tea', translation: 'おちゃ', emoji: '🍵' },
      { text: 'pie', translation: 'パイ', emoji: '🥧' },
      { text: 'key', translation: 'かぎ', emoji: '🔑' },
      { text: 'toy', translation: 'おもちゃ', emoji: '🧸' },
    ],
  },
  {
    title: '3文字アクションバトル',
    shortTitle: '3文字動き',
    description: '動きや様子を表す3文字の単語に挑戦',
    questions: [
      { text: 'jam', translation: 'ジャム', emoji: '🍓' },
      { text: 'run', translation: 'はしる', emoji: '🏃' },
      { text: 'sit', translation: 'すわる', emoji: '🪑' },
      { text: 'hop', translation: 'ぴょんと跳ぶ', emoji: '🐇' },
      { text: 'hot', translation: 'あつい', emoji: '🔥' },
      { text: 'big', translation: 'おおきい', emoji: '🐘' },
      { text: 'wet', translation: 'ぬれた', emoji: '💧' },
      { text: 'dry', translation: 'かわいた', emoji: '☀️' },
      { text: 'old', translation: 'ふるい', emoji: '🕰️' },
      { text: 'new', translation: 'あたらしい', emoji: '✨' },
    ],
  },
  {
    title: '4文字スタートバトル',
    shortTitle: '4文字入門',
    description: '4文字の身近な単語をゆっくり打とう',
    questions: [
      { text: 'book', translation: 'ほん', emoji: '📖' },
      { text: 'bird', translation: 'とり', emoji: '🐦' },
      { text: 'fish', translation: 'さかな', emoji: '🐟' },
      { text: 'tree', translation: 'き', emoji: '🌳' },
      { text: 'star', translation: 'ほし', emoji: '🌟' },
      { text: 'blue', translation: 'あお', emoji: '🔵' },
      { text: 'hand', translation: 'て', emoji: '✋' },
      { text: 'milk', translation: 'ぎゅうにゅう', emoji: '🥛' },
      { text: 'cake', translation: 'ケーキ', emoji: '🍰' },
      { text: 'duck', translation: 'あひる', emoji: '🦆' },
    ],
  },
  {
    title: '4文字どうぶつバトル',
    shortTitle: '4文字どうぶつ',
    description: '4文字のどうぶつや自然の単語を倒そう',
    questions: [
      { text: 'bear', translation: 'くま', emoji: '🐻' },
      { text: 'lion', translation: 'ライオン', emoji: '🦁' },
      { text: 'frog', translation: 'かえる', emoji: '🐸' },
      { text: 'goat', translation: 'やぎ', emoji: '🐐' },
      { text: 'crab', translation: 'かに', emoji: '🦀' },
      { text: 'ship', translation: 'ふね', emoji: '🚢' },
      { text: 'boat', translation: 'ボート', emoji: '⛵' },
      { text: 'rain', translation: 'あめ', emoji: '🌧️' },
      { text: 'snow', translation: 'ゆき', emoji: '❄️' },
      { text: 'moon', translation: 'つき', emoji: '🌙' },
    ],
  },
  {
    title: '4文字くらしバトル',
    shortTitle: '4文字くらし',
    description: '暮らしの中の4文字の単語に挑戦',
    questions: [
      { text: 'door', translation: 'ドア', emoji: '🚪' },
      { text: 'desk', translation: 'つくえ', emoji: '🗄️' },
      { text: 'shoe', translation: 'くつ', emoji: '👟' },
      { text: 'sock', translation: 'くつした', emoji: '🧦' },
      { text: 'coat', translation: 'コート', emoji: '🧥' },
      { text: 'food', translation: 'たべもの', emoji: '🍽️' },
      { text: 'rice', translation: 'ごはん', emoji: '🍚' },
      { text: 'soup', translation: 'スープ', emoji: '🥣' },
      { text: 'play', translation: 'あそぶ', emoji: '🎮' },
      { text: 'sing', translation: 'うたう', emoji: '🎤' },
    ],
  },
  {
    title: '4文字アクションバトル',
    shortTitle: '4文字動き',
    description: '4文字の動きや身近な物を打ってみよう',
    questions: [
      { text: 'swim', translation: 'およぐ', emoji: '🏊' },
      { text: 'read', translation: 'よむ', emoji: '📚' },
      { text: 'jump', translation: 'とぶ', emoji: '🦘' },
      { text: 'walk', translation: 'あるく', emoji: '🚶' },
      { text: 'ball', translation: 'ボール', emoji: '⚽' },
      { text: 'doll', translation: 'にんぎょう', emoji: '🪆' },
      { text: 'drum', translation: 'たいこ', emoji: '🥁' },
      { text: 'flag', translation: 'はた', emoji: '🚩' },
      { text: 'king', translation: 'おうさま', emoji: '🤴' },
      { text: 'gift', translation: 'プレゼント', emoji: '🎁' },
    ],
  },
  {
    title: '英検5級 おためしバトル',
    shortTitle: '5文字',
    description: '5文字の英単語で最後のモンスターを倒そう',
    questions: [
      { text: 'apple', translation: 'りんご', emoji: '🍎' },
      { text: 'grape', translation: 'ぶどう', emoji: '🍇' },
      { text: 'lemon', translation: 'レモン', emoji: '🍋' },
      { text: 'peach', translation: 'もも', emoji: '🍑' },
      { text: 'bread', translation: 'パン', emoji: '🍞' },
      { text: 'water', translation: 'みず', emoji: '💧' },
      { text: 'house', translation: 'いえ', emoji: '🏠' },
      { text: 'green', translation: 'みどり', emoji: '🟢' },
      { text: 'black', translation: 'くろ', emoji: '⚫' },
      { text: 'smile', translation: 'ほほえむ', emoji: '😊' },
    ],
  },
];

export const BEGINNER_BATTLE_QUESTIONS = BEGINNER_BATTLE_PHASES.flatMap(phase => phase.questions);
export const BEGINNER_BATTLE_PHASE_SIZE = 10;
