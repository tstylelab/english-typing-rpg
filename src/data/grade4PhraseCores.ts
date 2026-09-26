import original from './questionSets/eiken/grade4.json';
import { getQuestionExample } from './questionExamples';
import type { Question } from './questions';

// Indices refer to the unchanged legacy source. Keep it for saved-data migration.
const groups: [number[], string, string][] = [
  [[5,105], 'want to', '〜したい（wantを使う）'],
  [[6], 'like to', '〜するのが好きだ（likeの後にto）'],
  [[7], 'want to be', '〜になりたい'],
  [[8,107], 'need to', '〜する必要がある'],
  [[9,32,124], 'go back', '（元の場所へ）戻る・戻っていく'],
  [[12,109], 'do homework', '宿題をする'],
  [[13,110], 'take A to B', 'AをBへ持っていく・連れていく（A・Bは入れ替える部分）'],
  [[15,112], 'leave A for B', 'Aを出てBへ向かう（A・Bは場所）'],
  [[14,111], 'look for', '〜を探す'],
  [[17,113], 'wait for', '〜を待つ'],
  [[18], 'stay in', '（部屋・建物など）の中に泊まる・滞在する'],
  [[19,115], 'stay with', '（人）の家に泊まる'],
  [[21,196], 'wake up', '目を覚ます（寝床を出るとは限らない）'],
  [[24,116], 'speak to', '〜に話しかける（speakを使う）'],
  [[25,117], 'talk to', '〜に話す（talkの後にto）'],
  [[26,118], 'talk with', '〜と話す（talkの後にwith）'],
  [[27,119], 'listen to', '〜に耳を傾ける・〜を聞く'],
  [[28,120], 'hear about', '〜について耳にする'],
  [[30,122], 'finish reading', '読み終える（finishの後に-ing形）'],
  [[31,123], 'enjoy playing', '遊ぶこと・競技をすることを楽しむ'],
  [[33,125], 'come back', '（元の場所へ）戻ってくる'],
  [[35,126], 'come back from', '〜から帰ってくる'],
  [[36,127], 'arrive at', '（駅などの地点）に着く（arriveを使う）'],
  [[37,128], 'arrive in', '（国・都市）に着く（arriveを使う）'],
  [[38,129], 'get to', '（場所）に着く（getを使う）'],
  [[39], 'start to', '〜し始める（startの後にto）'],
  [[40,131], 'stop talking', '話すのをやめる（stopの後に-ing形）'],
  [[42,132], 'walk to', '〜へ歩いて行く'],
  [[43,45], 'ask for', '〜を求める'],
  [[44,134], 'help A with B', 'AのBを手伝う（Aは人、Bは仕事など）'],
  [[51,135], 'say goodbye to', '〜にさよならを言う'],
  [[53,136,192], 'think of', '〜のことを考える・〜を思いつく'],
  [[54,137], 'become friends with', '〜と友達になる（becomeを使う）'],
  [[56,138], 'get off', '（電車・バスなど）を降りる'],
  [[59,139], 'go around', '〜のまわりを回る'],
  [[61,140], 'move to', '〜へ引っ越す'],
  [[62,141], 'write to', '〜に手紙を書く'],
  [[65,142,198], 'worry about', '〜を心配する'],
  [[66,143], 'look like', '〜に似ている・〜のように見える'],
  [[67,144], 'believe in', '〜を信じる'],
  [[70,145], 'a lot of', 'たくさんの〜'],
  [[71,146], 'be late for', '〜に遅れる'],
  [[73,147], 'be interested in', '〜に興味がある'],
  [[74], 'kind of', '少し・なんとなく（くだけた言い方）'],
  [[75,148], 'a glass of', 'グラス一杯の〜'],
  [[76,149], 'a cup of', 'カップ一杯の〜'],
  [[86], 'as busy as', '〜と同じくらい忙しい'],
  [[88,151], 'from A to B', 'AからBまで（A・Bは場所や時刻など）'],
  [[89,152], 'years old', '〜歳（前に年齢の数字を置く）'],
  [[90,153], 'in front of', '〜の前に'],
  [[91,154], 'next to', '〜のとなりに'],
  [[92,155], 'out of', '〜の中から外へ'],
  [[93,156], 'both A and B', 'AとBの両方（A・Bは入れ替える部分）'],
  [[104,158], 'have to', '〜しなければならない'],
  [[106], 'like playing', '遊ぶこと・競技をすることが好きだ'],
  [[114], 'stay at', '（ホテルなど）に泊まる・滞在する'],
  [[133], 'ask A for B', 'AにBを求める（Aは人、Bは助け・物など）'],
  [[150], 'as tall as', '〜と同じくらい背が高い'],
  [[159], 'be afraid of', '〜を怖がる'],
  [[160], 'be good for', '〜のためになる・〜によい'],
  [[161], 'be ready for', '〜の準備ができている'],
  [[162], 'be proud of', '〜を誇りに思う'],
  [[163], 'be surprised at', '〜に驚く'],
  [[164], 'belong to', '〜のものだ・〜に所属する'],
  [[165], 'care for', '〜の世話をする（careを使う）'],
  [[166], 'decide to', '〜することに決める'],
  [[167], 'enjoy cooking', '料理することを楽しむ'],
  [[168], 'feel like', '〜したい気がする（後ろに-ing形）'],
  [[169], 'find out', '（調べて答え・事実など）を見つけ出す'],
  [[170], 'get along with', '〜と仲良くする'],
  [[171], 'get ready for', '〜の準備をする'],
  [[172], 'go abroad', '海外へ行く'],
  [[173], 'grow up', '成長する・育つ'],
  [[175], 'have a fever', '熱がある'],
  [[176], 'have a look at', '〜を見てみる'],
  [[177], 'hear from', '〜から連絡をもらう'],
  [[178], 'keep on', '〜し続ける（後ろに-ing形）'],
  [[179], 'know about', '〜について知っている'],
  [[180], 'look forward to', '〜を楽しみにする（後ろに名詞・-ing形）'],
  [[181], 'make friends with', '〜と友達になる（makeを使う）'],
  [[182], 'pay for', '〜の代金を払う'],
  [[183], 'plan to', '〜する予定である'],
  [[184], 'practice playing', '演奏すること・競技をすることを練習する'],
  [[185], 'remember to', '忘れずに〜する'],
  [[186], 'run away from', '〜から逃げ出す'],
  [[187], 'spend time with', '〜と時間を過ごす'],
  [[188], 'take care of', '〜の世話をする（takeを使う）'],
  [[189], 'take part in', '〜に参加する'],
  [[190], 'talk about', '〜について話す'],
  [[191], 'thank you for', '〜をありがとう（後ろに名詞・-ing形）'],
  [[193], 'try to', '〜しようとする'],
  [[194], 'turn into', '〜に変わる'],
  [[195], 'use A for B', 'AをBに使う（Aは物、Bは目的など）'],
  [[197], 'work hard', '一生懸命取り組む'],
  [[199], 'be different from', '〜とは違う'],
];

export const grade4PhraseChanges = groups.flatMap(([indices, text, translation]) => indices.map(index => ({
  before: original.levels['2'][index], after: { text, translation },
})));
const replacements = new Map(grade4PhraseChanges.map(entry => [entry.before.text, entry.after]));
const synonyms: Record<string, string[]> = {
  'look for': ['search for'], 'go back': ['return'], 'come back': ['return'],
  'want to': ['would like to'], 'need to': ['have to'], 'have to': ['must'],
  'a lot of': ['lots of'], 'next to': ['beside'], 'look like': ['resemble'],
  'care for': ['look after'], 'take care of': ['look after'], 'be ready for': ['be prepared for'],
  'become friends with': ['make friends with'], 'make friends with': ['become friends with'],
  'be afraid of': ['be scared of'], 'take part in': ['participate in'],
  'get along with': ['get on with'], 'turn into': ['change into'],
  'find out': ['discover'], 'belong to': ['be owned by'], 'have a look at': ['look at'],
};
export const grade4PhraseQuestions: Question[] = Array.from(new Map(original.levels['2'].map(q => {
  const replacement = replacements.get(q.text);
  const next = replacement ? { ...q, ...replacement, synonyms: synonyms[replacement.text], exampleEn: getQuestionExample('Eiken4', 2, q) ?? undefined } : q;
  return [next.text, next] as const;
})).values());
const byText = new Map(grade4PhraseQuestions.map(q => [q.text, q]));
const migratedQuestions = new Map(grade4PhraseChanges.map(entry => [JSON.stringify([entry.before.text, entry.before.translation]), byText.get(entry.after.text)!]));
const migratedKeys = new Map(grade4PhraseChanges.map(entry => [`Eiken4:2:${entry.before.text}:${entry.before.translation}`, `Eiken4:2:${entry.after.text}:${entry.after.translation}`]));
export const migrateGrade4Phrase = (question: Question): Question => {
  return migratedQuestions.get(JSON.stringify([question.text, question.translation])) ?? question;
};
export const migrateGrade4PhraseKey = (key: string): string => {
  return migratedKeys.get(key) ?? key;
};
