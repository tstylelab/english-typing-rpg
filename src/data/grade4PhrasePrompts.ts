import type { DifficultyKey } from './questions';

// Display-only corrections: never rewrite translation, which is part of saved IDs.
const meanings = new Map([
  ['on foot|歩いて', '（乗り物を使わず）徒歩で'],
  ['go around|〜のまわりを回る', '（公園などの）まわりを移動する'],
  ['talk with|〜と話す（talkの後にwith）', '（相手と）話す・会話する'],
  ['talk to|〜に話す（talkの後にto）', '（相手に）話す・話しかける'],
  ['speak to|〜に話しかける（speakを使う）', '（相手に）話しかける'],
  ['like to|〜するのが好きだ（likeの後にto）', '〜するのが好きだ（後ろに動詞の原形）'],
  ['start to|〜し始める（startの後にto）', '〜し始める（後ろに動詞の原形）'],
  ['around the corner|角を曲がったところに', '角を曲がったすぐ先に'],
  ['want to|〜したい（wantを使う）', '〜したい（後ろに動詞の原形）'],
  ['take a trip|旅行をする', '旅行をする'],
  ['go on a trip|旅行に行く', '旅行に出かける'],
  ['get back|戻る', '（元の場所へ）戻る'],
  ['finish reading|読み終える（finishの後に-ing形）', '読み終える（読むという動作を終える）'],
  ['stop talking|話すのをやめる（stopの後に-ing形）', '話すのをやめる（話すという動作を止める）'],
  ['start studying|勉強し始める（studyingを使う）', '勉強し始める（後ろは動詞の-ing形）'],
  ['arrive at|（駅などの地点）に着く（arriveを使う）', '（駅・建物などの地点）に到着する'],
  ['arrive in|（国・都市）に着く（arriveを使う）', '（国・都市などの地域）に到着する'],
  ['get to|（場所）に着く（getを使う）', '（目的地）に着く'],
  ['become friends with|〜と友達になる（becomeを使う）', '〜と友達になる'],
  ['make friends with|〜と友達になる（makeを使う）', '〜と友達になる'],
  ['care for|〜の世話をする（careを使う）', '（人・動物など）の世話をする'],
  ['take care of|〜の世話をする（takeを使う）', '（人・動物など）の世話をする'],
  ['believe in|〜を信じる', '（人の力・可能性など）を信じる'],
  ['in front of|〜の前に', '（場所・位置が）〜の前に'],
  ['ask for|〜を求める', '（助け・物など）を求める・お願いする'],
  ['stay in|（部屋・建物など）の中に泊まる・滞在する', '（部屋・テントなど）の中に泊まる・滞在する'],
]);

// Scoped to this phrase course; [] deliberately suppresses misleading fallback hints.
export const grade4PhraseSynonyms: Record<string, string[]> = {
  'kind of': ['somewhat', 'a little'],
  'after work': ['after finishing work'],
  'post office': [],
  'come home': ['return home'],
  'go home': ['return home'],
  'get up': ['get out of bed'],
  'wake up': ['stop sleeping'],
  'listen to': ['pay attention to'],
  'in front of': [],
  'for free': ['free of charge'],
  'have a good time': ['enjoy oneself'],
};

export const getGrade4PhraseMeaning = (
  question: { text: string; translation: string }, difficulty?: DifficultyKey,
): string | undefined => difficulty === 'Eiken4'
  ? meanings.get(`${question.text}|${question.translation}`) : undefined;

// Retired: no initial-letter or word-count hints.
export const getPhraseAnswerCue = (): undefined => undefined;
