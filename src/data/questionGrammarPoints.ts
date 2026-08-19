import type { DifficultyKey, LevelKey, Question } from './questions';

export type QuestionGrammarPoint = {
  label: string;
  note: string;
  pattern: string;
};

const FIXED_EXPRESSIONS: Record<string, QuestionGrammarPoint> = {
  'Can I help you?': { label: '申し出', note: 'Can I＋動詞で「～しましょうか」と申し出ます。', pattern: 'Can I + 動詞の原形?' },
  'Anything else?': { label: '会話表現', note: '「ほかに何かありますか」と追加を尋ねる表現です。', pattern: 'Anything else?' },
  "That's all, thanks.": { label: '会話表現', note: '「それで全部です」と注文などを終える表現です。', pattern: "That's all." },
  'Here you are.': { label: '会話表現', note: '物を渡すときの「はい、どうぞ」です。', pattern: 'Here you are.' },
  "I'll take it.": { label: '会話表現', note: '買い物で「これにします」と決める表現です。', pattern: "I'll take it." },
  "I'll have grape juice.": { label: '会話表現', note: '注文するときの「～をください」です。', pattern: "I'll have + 注文する物" },
  "I'd like a hot dog.": { label: '会話表現', note: 'wantより丁寧に希望を伝える表現です。', pattern: "I'd like + 名詞" },
  'No, thank you. I\'m full.': { label: '会話表現', note: '丁寧に断ってから理由を添えています。', pattern: 'No, thank you. + 理由' },
  'Attention, please.': { label: '会話表現', note: '人の注意を引くときの決まった表現です。', pattern: 'Attention, please.' },
  'Not very good.': { label: '省略表現', note: '会話では主語とbe動詞を省略して答えることがあります。', pattern: '(It is) not very good.' },
  'Twice a week.': { label: '頻度', note: '回数と期間を組み合わせて頻度を表します。', pattern: '回数 + a week' },
  'Just a moment, please.': { label: '会話表現', note: '少し待ってもらうときの丁寧な表現です。', pattern: 'Just a moment, please.' },
  'Thank you for your help.': { label: '会話表現', note: '助けてもらったことへの感謝を伝える決まった表現です。', pattern: 'Thank you for + 名詞' },
  'Sounds nice.': { label: '会話表現', note: '相手の提案に「よさそう」と反応する表現です。', pattern: 'Sounds + 形容詞' },
  "That's a good idea!": { label: '会話表現', note: '相手の提案に賛成するときの表現です。', pattern: "That's a good idea." },
  "That's too bad.": { label: '会話表現', note: '残念な話を聞いたときの決まった表現です。', pattern: "That's too bad." },
  'Why not?': { label: '会話表現', note: '提案への賛成や「なぜだめなの？」を表す短い表現です。', pattern: 'Why not?' },
  'It takes about fifteen minutes.': { label: '所要時間', note: 'It takes＋時間で「～分かかる」と表します。', pattern: 'It takes + 時間' },
  'I was tired after the game.': { label: '過去のbe動詞', note: '過去の状態なのでbe動詞をwasにします。', pattern: '主語 + was/were + 説明' },
  'Tell me what happened yesterday.': { label: '疑問詞のまとまり', note: 'what happenedを「何が起きたか」というまとまりで使います。', pattern: 'tell + 人 + what + 文' },
  'Please tell me how to get there.': { label: '疑問詞＋不定詞', note: 'how to＋動詞で「～する方法」を表します。', pattern: 'how to + 動詞の原形' },
  'I think this answer is right.': { label: '考えを伝える文', note: 'thinkの後ろに、自分が正しいと思う内容を続けます。', pattern: 'I think + 文' },
  'I am glad to hear that.': { label: '不定詞', note: '感情の理由をto＋動詞で続けています。', pattern: 'be glad + to + 動詞の原形' },
  'I hope you have a nice trip.': { label: '希望を伝える文', note: 'hopeの後ろに、そうなってほしい内容を続けます。', pattern: 'I hope + 文' },
  'Can you tell me how to use this?': { label: '疑問詞＋不定詞', note: 'how to＋動詞で「～する方法」を表します。', pattern: 'how to + 動詞の原形' },
  'I am looking forward to the school festival.': { label: '熟語表現', note: 'look forward toで「～を楽しみにする」を表します。', pattern: 'look forward to + 名詞/動詞ing' },
  'It will be colder tomorrow than today.': { label: '比較級', note: '未来の予想の中で、明日と今日を比較しています。', pattern: 'will be + 比較級 + than' },
  'It took us an hour to get there.': { label: '所要時間', note: 'It took＋人＋時間＋toで、かかった時間を表します。', pattern: 'It took + 人 + 時間 + to + 動詞' },
};

const point = (label: string, note: string, pattern: string): QuestionGrammarPoint => ({ label, note, pattern });

const getEiken4Level3GrammarPoint = (rawText: string): QuestionGrammarPoint => {
  const fixed = FIXED_EXPRESSIONS[rawText];
  if (fixed) return fixed;

  const text = rawText
    .replace(/\bI'm\b/g, 'I am')
    .replace(/\bIt's\b/g, 'It is')
    .replace(/\bI'll\b/g, 'I will')
    .replace(/\bWe'll\b/g, 'We will')
    .replace(/\bI'd\b/g, 'I would')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bDon't\b/g, 'Do not');

  if (/^How much\b/i.test(text)) {
    return point('5W1H', '値段を尋ねるときはHow muchを文の先頭に置きます。', 'How much + be動詞 + 主語?');
  }
  if (/^How often\b/i.test(text)) {
    return point('5W1H', '回数や頻度を尋ねるときはHow oftenを使います。', 'How often + do/does + 主語 + 動詞?');
  }
  if (/^How long\b/i.test(text)) {
    return point('5W1H', '時間や長さを尋ねるときはHow longを使います。', 'How long + 疑問文?');
  }
  if (/^What time\b/i.test(text)) {
    return point('5W1H', '時刻を尋ねるときはWhat timeを使います。', 'What time + 疑問文?');
  }
  if (/^What kind of\b/i.test(text)) {
    return point('5W1H', '種類を尋ねるときはWhat kind ofを使います。', 'What kind of + 名詞 + 疑問文?');
  }
  if (/^What were you doing\b/i.test(text)) {
    return point('過去進行形', '過去のある時点で途中だった動作を尋ねています。', 'What + were + 主語 + 動詞ing?');
  }
  if (/^Who\b/i.test(text)) {
    return point('5W1H', 'だれかを尋ねるWhoが主語になるときはdoを使いません。', 'Who + 動詞 + ...?');
  }
  if (/^Which\b/i.test(text)) {
    return point('5W1H', 'いくつかの中から選ぶときはWhichを使います。', 'Which + 名詞 + 疑問文?');
  }
  if (/^(What|When|Where|Why|How)\b/i.test(text)) {
    return point('5W1H', '疑問詞の後ろを疑問文の語順にします。', '疑問詞 + be動詞/do/does/did + 主語 ...?');
  }

  if (/\bdo not have to\b/i.test(text)) {
    return point('義務表現', 'do not have toは「～する必要はない」を表します。', 'do not have to + 動詞の原形');
  }
  if (/\bcannot\b/i.test(text)) {
    return point('助動詞', 'cannot＋動詞の原形で「～できない」を表します。', 'cannot + 動詞の原形');
  }
  if (/\bmust not\b/i.test(text)) {
    return point('禁止表現', 'must not＋動詞の原形で「～してはいけない」を表します。', 'must not + 動詞の原形');
  }

  if (/^(Can|Could|May) I\b/i.test(text)) {
    return point('助動詞', 'Can・Could・Mayを先頭に置いて許可や依頼を表します。', 'Can/Could/May + 主語 + 動詞の原形?');
  }
  if (/^Would you like\b/i.test(text)) {
    return point('勧誘表現', 'Would you likeで相手の希望を丁寧に尋ねます。', 'Would you like + 名詞/to + 動詞?');
  }
  if (/^(Can|Could|Would) you\b/i.test(text)) {
    return point('助動詞', '助動詞を先頭に置いて相手に丁寧に尋ねています。', 'Can/Could/Would + you + 動詞の原形?');
  }
  if (/^Shall (I|we)\b/i.test(text)) {
    return point('提案表現', 'Shall Iは申し出、Shall weは提案を表します。', 'Shall + I/we + 動詞の原形?');
  }
  if (/^Let(?:'s| us)\b/i.test(text)) {
    return point('提案表現', 'Let usの短縮形Let\'sで「一緒に～しよう」と誘います。', "Let's + 動詞の原形" );
  }
  if (/^(Please |Do not |Don't |Clean |Come |Hurry |Tell |Let me )/i.test(text)) {
    return point('命令文', '主語を置かず動詞から始め、依頼・指示・禁止を表します。', 'Please/Do not + 動詞の原形');
  }

  if (/\b(told|asked) (me|us) to\b/i.test(text)) {
    return point('不定詞', '人の後ろにto＋動詞を置き、頼んだ内容を示します。', 'tell/ask + 人 + to + 動詞');
  }
  if (/^It is (important|easy) (for me )?to\b/i.test(text)) {
    return point('不定詞', 'It is＋形容詞＋toで「～することは…」を表します。', 'It is + 形容詞 + to + 動詞');
  }
  if (/^(I want|I need|We need|My dream is|I hope|He was happy|I was happy)\b.*\bto\b/i.test(text)) {
    return point('不定詞', 'to＋動詞の原形で目的・希望・理由などを表します。', 'to + 動詞の原形');
  }
  if (/\bto (buy|drink|read|carry|get|see|bring|show)\b/i.test(text)) {
    return point('不定詞', 'to＋動詞の原形が目的や名詞の説明になります。', 'to + 動詞の原形');
  }
  if (/^(Reading|Thank you for .*ing|My sister is good at|We enjoyed .*ing)\b/i.test(text)) {
    return point('動名詞', '動詞ingを名詞のように使い「～すること」を表します。', '動詞ing');
  }
  if (/\bwearing a red hat\b/i.test(text)) {
    return point('現在分詞', '動詞ingのまとまりを名詞の後ろに置いて説明します。', '名詞 + 動詞ing ...');
  }

  if (/\b(more .+ than|\w+er than)\b/i.test(text)) {
    return point('比較級', '2つを比べるときは比較級の後ろにthanを置きます。', '比較級 + than');
  }
  if (/\b(the fastest|the most|like best|like the best)\b/i.test(text)) {
    return point('最上級', '3つ以上の中で「いちばん」を表しています。', 'the + 最上級 / like ... best');
  }

  if (/\b(was|were)\b.*\b\w+ing\b/i.test(text)) {
    return point('過去進行形', '過去のある時点で途中だった動作を表します。', 'was/were + 動詞ing');
  }
  if (/\b(am|is|are)\b.*\bgoing to\b/i.test(text)) {
    return point('未来表現', 'be going toで予定や起こりそうなことを表します。', 'be動詞 + going to + 動詞の原形');
  }
  if (/\b(am|is|are)\b.*\b\w+ing\b/i.test(text)) {
    return point('現在進行形', '今している途中の動作を表します。', 'am/is/are + 動詞ing');
  }
  if (/\b(?:will|'ll)\b/i.test(text)) {
    return point('未来表現', 'will＋動詞の原形で未来の予定や予想を表します。', 'will + 動詞の原形');
  }

  if (/\b(should|must|can)\b/i.test(text)) {
    return point('助動詞', '助動詞の後ろでは動詞を原形にします。', '助動詞 + 動詞の原形');
  }
  if (/\b(have|has) to\b/i.test(text)) {
    return point('義務表現', 'have to＋動詞の原形で必要や義務を表します。', 'have to + 動詞の原形');
  }

  if (/^There (is|was)\b/i.test(text)) {
    return point('存在表現', 'There is・wasで人や物が「いる・ある」と伝えます。', 'There + be動詞 + 名詞');
  }
  if (/\b(anything|something|everyone|anyone|nobody|no one)\b/i.test(text)) {
    return point('代名詞', '人や物を特定しない代名詞を使った表現です。', 'some/any/every/no + one/thing');
  }

  if (/\b(lived|finished|visited|saw|came|met|snowed|lost|slept|bought|enjoyed|called|left|forgot|arrived|found|closed|washed|rode|became|moved|stopped|took)\b/i.test(text)) {
    return point('過去形', '過去の出来事なので動詞を過去形にします。', '主語 + 動詞の過去形');
  }

  if (/\b(when|before|after|or|but)\b/i.test(text)) {
    return point('接続表現', '接続する語を使って、時・順序・選択などを示します。', '文 + 接続する語 + 文/語句');
  }
  if (/\b(did not|do not|does not|can't|don't|isn't|aren't|wasn't|weren't)\b/i.test(text)) {
    return point('否定文', 'notを助動詞やbe動詞の後ろに置いて否定します。', '助動詞/be動詞 + not');
  }

  if (/^(Did|Do|Does|Is|Are|Was|Were|Will)\b/i.test(text)) {
    return point('疑問文', '助動詞またはbe動詞を主語の前に置きます。', '助動詞/be動詞 + 主語 + ...?');
  }

  if (/\b(am|is|are|was|were)\b/i.test(text)) {
    return point('be動詞', '主語に合わせてbe動詞を選び、状態を表します。', '主語 + be動詞 + 説明');
  }
  if (/\b(want|like|looks|takes|think|know|feel|have)\b/i.test(text)) {
    return point('現在形', '現在の状態・習慣・考えを動詞の現在形で表します。', '主語 + 動詞の現在形');
  }

  return point('基本語順', '英語は基本的に主語の後ろに動詞を置きます。', '主語 + 動詞 + ...');
};

export const getQuestionGrammarPoint = (
  difficulty: DifficultyKey,
  level: LevelKey,
  question: Pick<Question, 'text'>,
): QuestionGrammarPoint | null => {
  if (difficulty !== 'Eiken4' || level !== 3) return null;
  return getEiken4Level3GrammarPoint(question.text);
};
