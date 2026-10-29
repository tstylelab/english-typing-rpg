import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {load} from './lib/load-typescript-data.mjs';

const baseline='134969442a8e92c0e79d9396132b50e1c914ff15';
const approved=[
  {
    "course": "Eiken3",
    "text": "Me, neither.",
    "old": {
      "meaning": "私もそうではありません（否定への同意）。",
      "alternatives": [
        {
          "text": "neither do I",
          "note": "相手の否定に同意する"
        }
      ],
      "formNote": "否定への同意",
      "grammar": {
        "label": "否定への同意",
        "note": "否定の発言に「私も」と応じるときはneitherを使います。",
        "pattern": "Me, neither."
      }
    },
    "next": {
      "meaning": "私もそうではありません（否定への同意）。",
      "alternatives": [
        {
          "text": "neither do I",
          "note": "don't / doesn't への同意"
        }
      ],
      "formNote": "否定への同意",
      "grammar": {
        "label": "否定への同意",
        "note": "否定の発言に「私も」と応じるときはneitherを使います。",
        "pattern": "Me, neither."
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken3",
    "text": "I do not know where to go.",
    "old": {
      "meaning": "私はどこへ行けばよいかわかりません（短縮しない形）。",
      "alternatives": [],
      "formNote": "どこですべきか",
      "grammar": {
        "label": "どこですべきか",
        "note": "where toで「どこへ・どこで～すべきか」を表します。",
        "pattern": "where to + 動詞の原形"
      }
    },
    "next": {
      "meaning": "私はどこへ行けばよいかわかりません（短縮しない形）。",
      "alternatives": [],
      "formNote": "疑問詞＋to で「どこへ行けばよいか」を表します。",
      "grammar": {
        "label": "どこへ行けばよいか",
        "note": "where to go で「どこへ行けばよいか」を表します。",
        "pattern": "where to + 動詞の原形"
      }
    },
    "promptChanged": true,
    "grammarChanged": true
  },
  {
    "course": "Eiken3",
    "text": "Walking is good for our health.",
    "old": {
      "meaning": "歩くことは私たちの健康によいです",
      "alternatives": [],
      "formNote": "動名詞で理由を説明",
      "grammar": {
        "label": "動名詞で理由を説明",
        "note": "Walkingを主語にして、健康によいという理由を伝えます。",
        "pattern": "動詞ing + is good for + 名詞"
      }
    },
    "next": {
      "meaning": "歩くことは私たちの健康によいです",
      "alternatives": [],
      "formNote": "動名詞を主語にします。",
      "grammar": {
        "label": "動名詞の主語",
        "note": "Walking は「歩くこと」という主語です。is good for our health で「私たちの健康によい」と説明します。",
        "pattern": "動詞ing + is good for + 名詞"
      }
    },
    "promptChanged": true,
    "grammarChanged": true
  },
  {
    "course": "Eiken3",
    "text": "What is wrong with your computer?",
    "old": {
      "meaning": "あなたのパソコンはどこが悪いのですか",
      "alternatives": [],
      "formNote": "不調を説明する",
      "grammar": {
        "label": "不調を説明する",
        "note": "wrong withの後ろに、不調の物や人を置きます。",
        "pattern": "something wrong with + 名詞"
      }
    },
    "next": {
      "meaning": "あなたのパソコンはどこが悪いのですか",
      "alternatives": [],
      "formNote": "不調を説明する",
      "grammar": {
        "label": "不調を尋ねる",
        "note": "What is wrong with ...? で、人や物のどこに問題があるかを尋ねます。",
        "pattern": "What is wrong with + 人・物?"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken3",
    "text": "This is the camera that I bought.",
    "old": {
      "meaning": "これは私が買ったカメラです（関係代名詞で説明）。",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "関係代名詞で説明",
      "grammar": {
        "label": "関係代名詞that",
        "note": "that以下の文で、前の名詞を詳しく説明します。",
        "pattern": "名詞 + that + 説明する文"
      }
    },
    "next": {
      "meaning": "これは私が買ったカメラです（関係代名詞で説明）。",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "関係代名詞 that を使って、どのカメラかを説明します。",
      "grammar": {
        "label": "関係代名詞that",
        "note": "that以下の文で、前の名詞を詳しく説明します。",
        "pattern": "名詞 + that + 説明する文"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken3",
    "text": "I like stories that make me laugh.",
    "old": {
      "meaning": "私は笑わせてくれる話が好きです",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "話を主語の関係代名詞で説明する",
      "grammar": {
        "label": "関係代名詞that",
        "note": "that以下の文で、前の名詞を詳しく説明します。",
        "pattern": "名詞 + that + 説明する文"
      }
    },
    "next": {
      "meaning": "私は笑わせてくれる話が好きです",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "主語になる関係代名詞 that で、話を説明します。",
      "grammar": {
        "label": "関係代名詞that",
        "note": "that以下の文で、前の名詞を詳しく説明します。",
        "pattern": "名詞 + that + 説明する文"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken3",
    "text": "The boy who is running is my brother.",
    "old": {
      "meaning": "走っている少年は私の兄弟です。",
      "alternatives": [
        {
          "text": "that",
          "note": "人にも使える関係代名詞"
        }
      ],
      "formNote": "関係代名詞・人",
      "grammar": {
        "label": "関係代名詞・人",
        "note": "人を表す名詞をwho以下で後ろから説明します。",
        "pattern": "人 + who + 動詞 + ..."
      }
    },
    "next": {
      "meaning": "走っている少年は私の兄弟です。",
      "alternatives": [
        {
          "text": "that",
          "note": "人にも使える関係代名詞"
        }
      ],
      "formNote": "関係代名詞 who を使って、どの少年かを説明します。",
      "grammar": {
        "label": "関係代名詞・人",
        "note": "人を表す名詞をwho以下で後ろから説明します。",
        "pattern": "人 + who + 動詞 + ..."
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken3",
    "text": "This is a book which teaches cooking.",
    "old": {
      "meaning": "これは料理を教える本です（関係代名詞で説明）。",
      "alternatives": [
        {
          "text": "that",
          "note": "物も説明する関係代名詞"
        }
      ],
      "formNote": "関係代名詞・物",
      "grammar": {
        "label": "関係代名詞・物",
        "note": "物を表す名詞をwhich以下で後ろから説明します。",
        "pattern": "物 + which + 動詞 + ..."
      }
    },
    "next": {
      "meaning": "これは料理を教える本です（関係代名詞で説明）。",
      "alternatives": [
        {
          "text": "that",
          "note": "物も説明する関係代名詞"
        }
      ],
      "formNote": "関係代名詞 which を使って、どんな本かを説明します。",
      "grammar": {
        "label": "関係代名詞・物",
        "note": "物を表す名詞をwhich以下で後ろから説明します。",
        "pattern": "物 + which + 動詞 + ..."
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken3",
    "text": "I prefer reading to watching TV.",
    "old": {
      "meaning": "私はテレビを見るより読書の方が好きです（動名詞で比較）。",
      "alternatives": [
        {
          "text": "like better",
          "note": "より好きだ"
        }
      ],
      "formNote": "好みの比較",
      "grammar": {
        "label": "好みの比較",
        "note": "prefer A to BはBよりAを好むという意味です。動作はing形にします。",
        "pattern": "prefer + 動詞ing + to + 動詞ing"
      }
    },
    "next": {
      "meaning": "私はテレビを見るより読書の方が好きです（動名詞で比較）。",
      "alternatives": [
        {
          "text": "like better",
          "note": "より好きだ"
        }
      ],
      "formNote": "prefer A to B の形で、どちらが好きかを比べます。",
      "grammar": {
        "label": "好みの比較",
        "note": "prefer A to BはBよりAを好むという意味です。動作はing形にします。",
        "pattern": "prefer + 動詞ing + to + 動詞ing"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre2",
    "text": "I used to walk to school.",
    "old": {
      "meaning": "私は以前、歩いて学校に通っていました。",
      "alternatives": [],
      "formNote": "前置詞の後ろ・過去の習慣との比較",
      "grammar": {
        "label": "前置詞の後ろ・過去の習慣との比較",
        "pattern": "前置詞 + 動名詞 ／ used to + 原形",
        "note": "過去の習慣のused to＋原形と、慣れているbe used to＋ingを対比する。"
      }
    },
    "next": {
      "meaning": "私は以前、歩いて学校に通っていました。",
      "alternatives": [],
      "formNote": "過去の習慣を used to＋動詞の原形で表します。",
      "grammar": {
        "label": "過去の習慣",
        "pattern": "used to + 動詞の原形",
        "note": "used to walk は「以前は歩いて通っていた」。be used to＋ing（〜することに慣れている）とは別の形です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "Why was the meeting put off?",
    "old": {
      "meaning": "なぜ会議は延期されたのですか。",
      "alternatives": [],
      "formNote": "情報を尋ねる",
      "grammar": {
        "label": "助動詞と受け身",
        "pattern": "助動詞 + be + 過去分詞",
        "note": "why＋be動詞＋主語＋過去分詞で、延期された理由を尋ねる。 情報を尋ねる"
      }
    },
    "next": {
      "meaning": "なぜ会議は延期されたのですか。",
      "alternatives": [],
      "formNote": "情報を尋ねる",
      "grammar": {
        "label": "過去の受け身の疑問文",
        "pattern": "Why + was/were + 主語 + 過去分詞?",
        "note": "was the meeting put off で「会議が延期された」と受け身で尋ねます。why はその理由を尋ねます。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "Taking the bus saves us money.",
    "old": {
      "meaning": "バスを利用することは私たちのお金の節約になります。",
      "alternatives": [],
      "formNote": "不定詞・動名詞",
      "grammar": {
        "label": "不定詞・動名詞",
        "pattern": "動詞 + to不定詞 / 動名詞",
        "note": "動名詞を主語にし、savesの三人称単数にも注意する。"
      }
    },
    "next": {
      "meaning": "バスを利用することは私たちのお金の節約になります。",
      "alternatives": [],
      "formNote": "不定詞・動名詞",
      "grammar": {
        "label": "動名詞の主語",
        "pattern": "動詞ingのまとまり + 動詞",
        "note": "Taking the bus が「バスを利用すること」という主語です。一つの活動なので、動詞は saves です。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "The book is worth reading twice.",
    "old": {
      "meaning": "その本は二度読む価値があります。",
      "alternatives": [],
      "formNote": "動名詞",
      "grammar": {
        "label": "不定詞・動名詞",
        "pattern": "動詞 + to不定詞 / 動名詞",
        "note": "be worthの後ろには動名詞を置く。twiceは読む回数。 動名詞"
      }
    },
    "next": {
      "meaning": "その本は二度読む価値があります。",
      "alternatives": [],
      "formNote": "動名詞",
      "grammar": {
        "label": "読む価値がある",
        "pattern": "be worth + 動詞ing",
        "note": "worth reading で「読む価値がある」。twice は読む回数を表します。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "I was surprised to hear the news.",
    "old": {
      "meaning": "その知らせを聞いて驚きました。",
      "alternatives": [],
      "formNote": "不定詞",
      "grammar": {
        "label": "不定詞・動名詞",
        "pattern": "動詞 + to不定詞 / 動名詞",
        "note": "to hearが、驚いた理由を表す。 不定詞"
      }
    },
    "next": {
      "meaning": "その知らせを聞いて驚きました。",
      "alternatives": [],
      "formNote": "不定詞",
      "grammar": {
        "label": "感情の理由を表す不定詞",
        "pattern": "be surprised + to + 動詞の原形",
        "note": "to hear the news が、驚いた理由を説明しています。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "There is no reason to cancel the trip.",
    "old": {
      "meaning": "その旅行を中止する理由はありません。",
      "alternatives": [],
      "formNote": "不定詞・動名詞",
      "grammar": {
        "label": "不定詞・動名詞",
        "pattern": "動詞 + to不定詞 / 動名詞",
        "note": "reasonをto cancelが後ろから説明する。"
      }
    },
    "next": {
      "meaning": "その旅行を中止する理由はありません。",
      "alternatives": [],
      "formNote": "不定詞・動名詞",
      "grammar": {
        "label": "不定詞で名詞を説明",
        "pattern": "名詞 + to + 動詞の原形",
        "note": "to cancel the trip が reason を説明し、「旅行を中止する理由」を表します。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "I prefer reading to watching television.",
    "old": {
      "meaning": "私はテレビを見るより読書が好きです。",
      "alternatives": [],
      "formNote": "比較",
      "grammar": {
        "label": "比較の形",
        "pattern": "as ... as ／ 比較級 + than ／ 最上級",
        "note": "prefer A to Bで、同じ動名詞の形を比べる。 比較"
      }
    },
    "next": {
      "meaning": "私はテレビを見るより読書が好きです。",
      "alternatives": [],
      "formNote": "比較",
      "grammar": {
        "label": "好みの比較",
        "pattern": "prefer A to B",
        "note": "prefer A to B は「BよりAが好き」。ここでは、二つの動作をどちらも ing 形で表しています。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "These products are made from recycled paper.",
    "old": {
      "meaning": "これらの製品は再生紙で作られています。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "助動詞と受け身",
        "pattern": "助動詞 + be + 過去分詞",
        "note": "製品を主語にして、原料から作られる受け身を表す。 受け身"
      }
    },
    "next": {
      "meaning": "これらの製品は再生紙で作られています。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身",
        "pattern": "be動詞 + 過去分詞",
        "note": "are made from で「〜から作られている」と、製品を主語にして述べます。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "The concert was canceled because of the storm.",
    "old": {
      "meaning": "嵐のためにコンサートは中止されました。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "助動詞と受け身",
        "pattern": "助動詞 + be + 過去分詞",
        "note": "中止されたコンサートを主語にし、理由をbecause of＋名詞で添える。 受け身"
      }
    },
    "next": {
      "meaning": "嵐のためにコンサートは中止されました。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "過去の受け身",
        "pattern": "was/were + 過去分詞",
        "note": "was canceled で「中止された」。because of の後ろに理由となる名詞を置きます。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "It is said that the town is very old.",
    "old": {
      "meaning": "その町はとても古いと言われています。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "助動詞と受け身",
        "pattern": "助動詞 + be + 過去分詞",
        "note": "It is said thatの受け身で、伝えられている内容を述べる。 受け身"
      }
    },
    "next": {
      "meaning": "その町はとても古いと言われています。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "伝聞の受け身",
        "pattern": "It is said that + 文",
        "note": "It is said that ... で「〜と言われている」と、伝えられている内容を続けます。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "He is not only kind but also brave.",
    "old": {
      "meaning": "彼は親切なだけでなく勇敢でもあります。",
      "alternatives": [],
      "formNote": "両方を強調する",
      "grammar": {
        "label": "並列・省略・同意の語順",
        "pattern": "neither / so + 助動詞 + 主語 ／ both A and B",
        "note": "not only A but also Bで、二つの形容詞を並べる。 両方を強調する"
      }
    },
    "next": {
      "meaning": "彼は親切なだけでなく勇敢でもあります。",
      "alternatives": [],
      "formNote": "両方を強調する",
      "grammar": {
        "label": "二つの性質を強調",
        "pattern": "not only A but also B",
        "note": "not only A but also B で「AだけでなくBも」。kind と brave という二つの形容詞を並べます。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "She plays the guitar as well as the piano.",
    "old": {
      "meaning": "彼女はピアノだけでなくギターも弾きます。",
      "alternatives": [],
      "formNote": "〜だけでなく",
      "grammar": {
        "label": "並列・省略・同意の語順",
        "pattern": "neither / so + 助動詞 + 主語 ／ both A and B",
        "note": "as well asで、同じ前置詞の目的語となる二つの楽器を並べる。 〜だけでなく"
      }
    },
    "next": {
      "meaning": "彼女はピアノだけでなくギターも弾きます。",
      "alternatives": [],
      "formNote": "〜だけでなく",
      "grammar": {
        "label": "〜だけでなく〜も",
        "pattern": "A as well as B",
        "note": "as well as で二つの楽器を結び、「ピアノだけでなくギターも」と伝えます。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "I listened to music while I was cooking.",
    "old": {
      "meaning": "料理をしている間、音楽を聞いていました。",
      "alternatives": [],
      "formNote": "文をつなぐ",
      "grammar": {
        "label": "理由・譲歩・対比",
        "pattern": "because / although / while / but + 節",
        "note": "whileの節で、その時進行していた別の動作を過去進行形にする。 文をつなぐ"
      }
    },
    "next": {
      "meaning": "料理をしている間、音楽を聞いていました。",
      "alternatives": [],
      "formNote": "文をつなぐ",
      "grammar": {
        "label": "同時の動作",
        "pattern": "文 + while + 主語 + 動詞",
        "note": "while I was cooking で、料理をしていた間に音楽を聞いていたと伝えます。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "The more you practice, the better you get.",
    "old": {
      "meaning": "練習すればするほど上達します。",
      "alternatives": [],
      "formNote": "比較",
      "grammar": {
        "label": "比較の形",
        "pattern": "as ... as ／ 比較級 + than ／ 最上級",
        "note": "the＋比較級を二回使い、変化が連動することを表す。 比較"
      }
    },
    "next": {
      "meaning": "練習すればするほど上達します。",
      "alternatives": [],
      "formNote": "比較",
      "grammar": {
        "label": "変化が連動する比較",
        "pattern": "the + 比較級 ..., the + 比較級 ...",
        "note": "the more ... と the better ... を組み合わせ、「練習すればするほど、上達する」と表します。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "Learning English allows us to talk with people abroad.",
    "old": {
      "meaning": "英語を学ぶことで、私たちは海外の人たちと話せるようになります。",
      "alternatives": [],
      "formNote": "人に行動を求める形",
      "grammar": {
        "label": "人に行動を求める形",
        "pattern": "動詞 + 人 + to + 原形",
        "note": "Learningを一つの活動として主語にし、allows us toを続ける。"
      }
    },
    "next": {
      "meaning": "英語を学ぶことで、私たちは海外の人たちと話せるようになります。",
      "alternatives": [],
      "formNote": "学ぶことで可能になることを、allow＋人＋to の形で表します。",
      "grammar": {
        "label": "可能にする allow",
        "pattern": "allow + 人 + to + 動詞の原形",
        "note": "ここでは「行動を求める」ではなく、「人が〜できるようにする」という allow の使い方です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "They do not allow us to use phones here.",
    "old": {
      "meaning": "彼らはここで私たちが電話を使うことを許しません。",
      "alternatives": [],
      "formNote": "彼らを主語にして、人への許可を否定する",
      "grammar": {
        "label": "人に行動を求める形",
        "pattern": "動詞 + 人 + to + 原形",
        "note": "allow＋人＋toの形を否定文で使う。 彼らを主語にして、人への許可を否定する"
      }
    },
    "next": {
      "meaning": "彼らはここで私たちが電話を使うことを許しません。",
      "alternatives": [],
      "formNote": "彼らを主語にして、人への許可を否定する",
      "grammar": {
        "label": "許可の否定",
        "pattern": "do not allow + 人 + to + 動詞の原形",
        "note": "do not allow us to ... で、私たちが〜することを許可しない、と表します。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "I hear that a new library will open.",
    "old": {
      "meaning": "新しい図書館が開くそうです。",
      "alternatives": [],
      "formNote": "人の発言を伝える",
      "grammar": {
        "label": "発言・質問を伝える形",
        "pattern": "said / told / asked + 内容の節",
        "note": "現在のI hearから内容を伝える。that節を機械的に過去へ変えない。 人の発言を伝える"
      }
    },
    "next": {
      "meaning": "新しい図書館が開くそうです。",
      "alternatives": [],
      "formNote": "人の発言を伝える",
      "grammar": {
        "label": "聞いた情報を伝える",
        "pattern": "I hear that + 文",
        "note": "I hear that ... は「〜だそうです」と、聞いた情報を伝える形です。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "What would you do in this situation?",
    "old": {
      "meaning": "この状況ならあなたはどうしますか。",
      "alternatives": [],
      "formNote": "情報を尋ねる",
      "grammar": {
        "label": "現実と違う仮定",
        "pattern": "If + 過去形, 主語 + would + 原形",
        "note": "仮定した場面での行動をwouldの疑問文で尋ねる。 情報を尋ねる 仮定した場面について尋ねるwouldの疑問文。状況の具体例は実装時に補う。"
      }
    },
    "next": {
      "meaning": "この状況ならあなたはどうしますか。",
      "alternatives": [],
      "formNote": "情報を尋ねる",
      "grammar": {
        "label": "仮定した場面での質問",
        "pattern": "What would you do ...?",
        "note": "仮定した場面で、相手なら何をするかを would で尋ねます。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "EikenPre2",
    "text": "So can I.",
    "old": {
      "meaning": "私もできます。",
      "alternatives": [],
      "formNote": "並列・省略・同意の語順",
      "grammar": {
        "label": "並列・省略・同意の語順",
        "pattern": "neither / so + 助動詞 + 主語 ／ both A and B",
        "note": "肯定への同意ではso＋助動詞＋主語。 前提：相手が「私は泳げます」と言った場面。"
      }
    },
    "next": {
      "meaning": "私もできます。",
      "alternatives": [],
      "formNote": "相手の「私は泳げます」に、「私も」と答えます。so で始める形で。",
      "grammar": {
        "label": "並列・省略・同意の語順",
        "pattern": "neither / so + 助動詞 + 主語 ／ both A and B",
        "note": "肯定への同意ではso＋助動詞＋主語。 前提：相手が「私は泳げます」と言った場面。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre2",
    "text": "Neither do I.",
    "old": {
      "meaning": "（否定の発言に同意して）私もそうではありません。",
      "alternatives": [],
      "formNote": "否定への同意",
      "grammar": {
        "label": "並列・省略・同意の語順",
        "pattern": "neither / so + 助動詞 + 主語 ／ both A and B",
        "note": "一般動詞の否定への同意で、neither＋do＋主語の順にする。 否定への同意 前提：相手が「私はその映画が好きではありません」と言った場面。一般動詞の否定への同意を練習する。"
      }
    },
    "next": {
      "meaning": "（否定の発言に同意して）私もそうではありません。",
      "alternatives": [],
      "formNote": "相手の「私はその映画が好きではありません」に、「私も」と答えます。neither で始める形で。",
      "grammar": {
        "label": "並列・省略・同意の語順",
        "pattern": "neither / so + 助動詞 + 主語 ／ both A and B",
        "note": "一般動詞の否定への同意で、neither＋do＋主語の順にする。 否定への同意 前提：相手が「私はその映画が好きではありません」と言った場面。一般動詞の否定への同意を練習する。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre2",
    "text": "Neither can I.",
    "old": {
      "meaning": "私もできません。",
      "alternatives": [],
      "formNote": "並列・省略・同意の語順",
      "grammar": {
        "label": "並列・省略・同意の語順",
        "pattern": "neither / so + 助動詞 + 主語 ／ both A and B",
        "note": "否定への同意ではneither＋助動詞＋主語。 前提：相手が「私は泳げません」と言った場面。"
      }
    },
    "next": {
      "meaning": "私もできません。",
      "alternatives": [],
      "formNote": "相手の「私は泳げません」に、「私も」と答えます。neither で始める形で。",
      "grammar": {
        "label": "並列・省略・同意の語順",
        "pattern": "neither / so + 助動詞 + 主語 ／ both A and B",
        "note": "否定への同意ではneither＋助動詞＋主語。 前提：相手が「私は泳げません」と言った場面。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre2",
    "text": "The woman who lives next door is a nurse.",
    "old": {
      "meaning": "隣に住んでいる女性は看護師です。",
      "alternatives": [
        {
          "text": "that",
          "note": "人にも使える関係代名詞"
        }
      ],
      "formNote": "女性を主語の関係代名詞で説明する",
      "grammar": {
        "label": "関係代名詞",
        "pattern": "名詞 + who / which / that + 節",
        "note": "主格のwhoの後ろにlivesを続け、先行詞womanを説明する。 女性を主語の関係代名詞で説明する"
      }
    },
    "next": {
      "meaning": "隣に住んでいる女性は看護師です。",
      "alternatives": [
        {
          "text": "that",
          "note": "人にも使える関係代名詞"
        }
      ],
      "formNote": "関係代名詞 who を使い、どの女性かを説明します。",
      "grammar": {
        "label": "関係代名詞",
        "pattern": "名詞 + who / which / that + 節",
        "note": "主格のwhoの後ろにlivesを続け、先行詞womanを説明する。 女性を主語の関係代名詞で説明する"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre2",
    "text": "This is the camera that I bought yesterday.",
    "old": {
      "meaning": "これが昨日買ったカメラです。",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "目的語の関係代名詞を省略しない",
      "grammar": {
        "label": "関係代名詞",
        "pattern": "名詞 + who / which / that + 節",
        "note": "目的格thatの後ろをI boughtで続け、cameraを説明する。 目的語の関係代名詞を省略しない"
      }
    },
    "next": {
      "meaning": "これが昨日買ったカメラです。",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "目的語になる関係代名詞 that を省略せずに使います。",
      "grammar": {
        "label": "関係代名詞",
        "pattern": "名詞 + who / which / that + 節",
        "note": "目的格thatの後ろをI boughtで続け、cameraを説明する。 目的語の関係代名詞を省略しない"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre2",
    "text": "Tell me whether or not you can come.",
    "old": {
      "meaning": "あなたが来られるかどうか、私に教えてください。",
      "alternatives": [
        {
          "text": "if",
          "note": "〜かどうか"
        }
      ],
      "formNote": "可能な場合と不可能な場合の両方を、明示して尋ねる",
      "grammar": {
        "label": "〜かどうかを表す節",
        "pattern": "if / whether + 主語 + 動詞",
        "note": "whether or notの後ろに、来られるかどうかを平叙文の語順で続ける。 可能な場合と不可能な場合の両方を、明示して尋ねる"
      }
    },
    "next": {
      "meaning": "あなたが来られるかどうか、私に教えてください。",
      "alternatives": [
        {
          "text": "if",
          "note": "〜かどうか。or not は文末に置く"
        }
      ],
      "formNote": "whether or not を先に置き、来られるかどうかを尋ねます。",
      "grammar": {
        "label": "〜かどうかを表す節",
        "pattern": "if / whether + 主語 + 動詞",
        "note": "whether or notの後ろに、来られるかどうかを平叙文の語順で続ける。 可能な場合と不可能な場合の両方を、明示して尋ねる"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "She should have backed up the data.",
    "old": {
      "meaning": "彼女はそのデータをバックアップしておくべきでした。（実際はしませんでした）",
      "alternatives": [
        {
          "text": "She ought to have backed up the data.",
          "note": "過去への後悔を表す自然な別表現"
        }
      ],
      "formNote": "過去に実行しなかったことを振り返り、「しておくべきだった」と表します。助動詞の後ろに完了形を続けます。 下の別表現も自然ですが、今回はそれ以外の助動詞を使います。",
      "grammar": {
        "label": "過去の後悔：〜しておくべきだった",
        "pattern": "should have + 過去分詞",
        "note": "should haveと過去分詞で、過去にするべきだったのにしなかったことを振り返れます。今回の例文はこの後悔の意味です。"
      }
    },
    "next": {
      "meaning": "彼女はそのデータをバックアップしておくべきでした。（実際はしませんでした）",
      "alternatives": [
        {
          "text": "She ought to have backed up the data.",
          "note": "過去への後悔を表す自然な別表現"
        }
      ],
      "formNote": "should have＋過去分詞で、過去にしておくべきだったことを表します。",
      "grammar": {
        "label": "過去の後悔：〜しておくべきだった",
        "pattern": "should have + 過去分詞",
        "note": "should haveと過去分詞で、過去にするべきだったのにしなかったことを振り返れます。今回の例文はこの後悔の意味です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "They might have taken a different route.",
    "old": {
      "meaning": "彼らは別の経路を通ったのかもしれません。",
      "alternatives": [
        {
          "text": "They may have taken a different route.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "過去についての可能性を、推量の助動詞に完了形を続けて表します。同じ意味になる助動詞の別表現もあります。 下の別表現も自然ですが、今回はそれ以外の助動詞を使います。",
      "grammar": {
        "label": "過去の推量：〜したかもしれない",
        "pattern": "might have + 過去分詞",
        "note": "might haveと過去分詞で、過去に起きた可能性を述べます。断定せず「〜したかもしれない」と伝えます。"
      }
    },
    "next": {
      "meaning": "彼らは別の経路を通ったのかもしれません。",
      "alternatives": [
        {
          "text": "They may have taken a different route.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "might have＋過去分詞で、過去の可能性を表します。",
      "grammar": {
        "label": "過去の推量：〜したかもしれない",
        "pattern": "might have + 過去分詞",
        "note": "might haveと過去分詞で、過去に起きた可能性を述べます。断定せず「〜したかもしれない」と伝えます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "We should have compared the prices first.",
    "old": {
      "meaning": "私たちはまず価格を比較しておくべきでした。（実際はしませんでした）",
      "alternatives": [
        {
          "text": "We ought to have compared the prices first.",
          "note": "過去への後悔を表す自然な別表現"
        }
      ],
      "formNote": "過去に実行しなかったことを振り返り、「しておくべきだった」と表します。助動詞の後ろに完了形を続けます。 下の別表現も自然ですが、今回はそれ以外の助動詞を使います。",
      "grammar": {
        "label": "過去の後悔：〜しておくべきだった",
        "pattern": "should have + 過去分詞",
        "note": "should haveと過去分詞で、過去にするべきだったのにしなかったことを振り返れます。今回の例文はこの後悔の意味です。"
      }
    },
    "next": {
      "meaning": "私たちはまず価格を比較しておくべきでした。（実際はしませんでした）",
      "alternatives": [
        {
          "text": "We ought to have compared the prices first.",
          "note": "過去への後悔を表す自然な別表現"
        }
      ],
      "formNote": "should have＋過去分詞で、過去にしておくべきだったことを表します。",
      "grammar": {
        "label": "過去の後悔：〜しておくべきだった",
        "pattern": "should have + 過去分詞",
        "note": "should haveと過去分詞で、過去にするべきだったのにしなかったことを振り返れます。今回の例文はこの後悔の意味です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "I might have sent it to the wrong address.",
    "old": {
      "meaning": "私はそれを間違った住所に送ってしまったかもしれません。",
      "alternatives": [
        {
          "text": "I may have sent it to the wrong address.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "過去についての可能性を、推量の助動詞に完了形を続けて表します。同じ意味になる助動詞の別表現もあります。 下の別表現も自然ですが、今回はそれ以外の助動詞を使います。",
      "grammar": {
        "label": "過去の推量：〜したかもしれない",
        "pattern": "might have + 過去分詞",
        "note": "might haveと過去分詞で、過去に起きた可能性を述べます。断定せず「〜したかもしれない」と伝えます。"
      }
    },
    "next": {
      "meaning": "私はそれを間違った住所に送ってしまったかもしれません。",
      "alternatives": [
        {
          "text": "I may have sent it to the wrong address.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "might have＋過去分詞で、過去の可能性を表します。",
      "grammar": {
        "label": "過去の推量：〜したかもしれない",
        "pattern": "might have + 過去分詞",
        "note": "might haveと過去分詞で、過去に起きた可能性を述べます。断定せず「〜したかもしれない」と伝えます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "I should have booked the tickets in advance.",
    "old": {
      "meaning": "私は事前にそのチケットを予約しておくべきでした。（実際はしませんでした）",
      "alternatives": [
        {
          "text": "I ought to have booked the tickets in advance.",
          "note": "過去への後悔を表す自然な別表現"
        }
      ],
      "formNote": "過去に実行しなかったことを振り返り、「しておくべきだった」と表します。助動詞の後ろに完了形を続けます。 下の別表現も自然ですが、今回はそれ以外の助動詞を使います。",
      "grammar": {
        "label": "過去の後悔：〜しておくべきだった",
        "pattern": "should have + 過去分詞",
        "note": "should haveと過去分詞で、過去にするべきだったのにしなかったことを振り返れます。今回の例文はこの後悔の意味です。"
      }
    },
    "next": {
      "meaning": "私は事前にそのチケットを予約しておくべきでした。（実際はしませんでした）",
      "alternatives": [
        {
          "text": "I ought to have booked the tickets in advance.",
          "note": "過去への後悔を表す自然な別表現"
        }
      ],
      "formNote": "should have＋過去分詞で、過去にしておくべきだったことを表します。",
      "grammar": {
        "label": "過去の後悔：〜しておくべきだった",
        "pattern": "should have + 過去分詞",
        "note": "should haveと過去分詞で、過去にするべきだったのにしなかったことを振り返れます。今回の例文はこの後悔の意味です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "She might have misunderstood the instructions.",
    "old": {
      "meaning": "彼女はその指示を誤解したのかもしれません。",
      "alternatives": [
        {
          "text": "She may have misunderstood the instructions.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "過去についての可能性を、推量の助動詞に完了形を続けて表します。同じ意味になる助動詞の別表現もあります。 下の別表現も自然ですが、今回はそれ以外の助動詞を使います。",
      "grammar": {
        "label": "過去の推量：〜したかもしれない",
        "pattern": "might have + 過去分詞",
        "note": "might haveと過去分詞で、過去に起きた可能性を述べます。断定せず「〜したかもしれない」と伝えます。"
      }
    },
    "next": {
      "meaning": "彼女はその指示を誤解したのかもしれません。",
      "alternatives": [
        {
          "text": "She may have misunderstood the instructions.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "might have＋過去分詞で、過去の可能性を表します。",
      "grammar": {
        "label": "過去の推量：〜したかもしれない",
        "pattern": "might have + 過去分詞",
        "note": "might haveと過去分詞で、過去に起きた可能性を述べます。断定せず「〜したかもしれない」と伝えます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "I had my bicycle repaired yesterday.",
    "old": {
      "meaning": "私は昨日、自転車を修理してもらいました。",
      "alternatives": [
        {
          "text": "I got my bicycle repaired yesterday.",
          "note": "get + 物 + 過去分詞も手配を表せます。"
        }
      ],
      "formNote": "自分で作業するのではなく、人に依頼・手配して物を〜してもらいます。目的語に物、その後ろに過去分詞を置く構文を練習します。 下の別表現も自然ですが、今回はそれ以外の動詞で練習します。",
      "grammar": {
        "label": "手配：物を〜してもらう",
        "pattern": "have + 物 + 過去分詞",
        "note": "haveの後ろに物、その後ろに過去分詞を置き、手配して作業をしてもらうことを表します。物は作業を受ける側です。"
      }
    },
    "next": {
      "meaning": "私は昨日、自転車を修理してもらいました。",
      "alternatives": [
        {
          "text": "I got my bicycle repaired yesterday.",
          "note": "get + 物 + 過去分詞も手配を表せます。"
        }
      ],
      "formNote": "have＋物＋過去分詞で、人に依頼・手配して〜してもらう形を練習します。",
      "grammar": {
        "label": "手配：物を〜してもらう",
        "pattern": "have + 物 + 過去分詞",
        "note": "haveの後ろに物、その後ろに過去分詞を置き、手配して作業をしてもらうことを表します。物は作業を受ける側です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "She had her eyesight tested last week.",
    "old": {
      "meaning": "彼女は先週、視力を検査してもらいました。",
      "alternatives": [
        {
          "text": "She got her eyesight tested last week.",
          "note": "get + 物 + 過去分詞も手配を表せます。"
        }
      ],
      "formNote": "自分で作業するのではなく、人に依頼・手配して物を〜してもらいます。目的語に物、その後ろに過去分詞を置く構文を練習します。 下の別表現も自然ですが、今回はそれ以外の動詞で練習します。",
      "grammar": {
        "label": "手配：物を〜してもらう",
        "pattern": "have + 物 + 過去分詞",
        "note": "haveの後ろに物、その後ろに過去分詞を置き、手配して作業をしてもらうことを表します。物は作業を受ける側です。"
      }
    },
    "next": {
      "meaning": "彼女は先週、視力を検査してもらいました。",
      "alternatives": [
        {
          "text": "She got her eyesight tested last week.",
          "note": "get + 物 + 過去分詞も手配を表せます。"
        }
      ],
      "formNote": "have＋物＋過去分詞で、人に依頼・手配して〜してもらう形を練習します。",
      "grammar": {
        "label": "手配：物を〜してもらう",
        "pattern": "have + 物 + 過去分詞",
        "note": "haveの後ろに物、その後ろに過去分詞を置き、手配して作業をしてもらうことを表します。物は作業を受ける側です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "The book that you recommended was useful.",
    "old": {
      "meaning": "あなたが勧めた本は役に立ちました。",
      "alternatives": [
        {
          "text": "The book which you recommended was useful.",
          "note": "whichも自然な目的格の関係代名詞です。"
        },
        {
          "text": "The book you recommended was useful.",
          "note": "目的格の関係代名詞を省略する形も自然です。"
        }
      ],
      "formNote": "目的格の関係代名詞を省略しない形を練習します。下の別表現も自然ですが、今回はそれ以外の関係代名詞を使います。",
      "grammar": {
        "label": "目的格の関係代名詞と省略",
        "pattern": "名詞 ＋（that / which）＋ 主語 ＋ 動詞",
        "note": "you recommendedの後ろに、本にあたる目的語がない点に注目します。thatはその目的語の役割です。このように名詞を絞る説明の目的格は、省略することもできます。"
      }
    },
    "next": {
      "meaning": "あなたが勧めた本は役に立ちました。",
      "alternatives": [
        {
          "text": "The book which you recommended was useful.",
          "note": "whichも自然な目的格の関係代名詞です。"
        },
        {
          "text": "The book you recommended was useful.",
          "note": "目的格の関係代名詞を省略する形も自然です。"
        }
      ],
      "formNote": "目的語になる関係代名詞 that を省略せずに使います。",
      "grammar": {
        "label": "目的格の関係代名詞と省略",
        "pattern": "名詞 ＋（that / which）＋ 主語 ＋ 動詞",
        "note": "you recommendedの後ろに、本にあたる目的語がない点に注目します。thatはその目的語の役割です。このように名詞を絞る説明の目的格は、省略することもできます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "We had the documents translated into English.",
    "old": {
      "meaning": "私たちは、その書類を英語に翻訳してもらいました。",
      "alternatives": [
        {
          "text": "We got the documents translated into English.",
          "note": "get + 物 + 過去分詞も手配を表せます。"
        }
      ],
      "formNote": "自分で作業するのではなく、人に依頼・手配して物を〜してもらいます。目的語に物、その後ろに過去分詞を置く構文を練習します。 下の別表現も自然ですが、今回はそれ以外の動詞で練習します。",
      "grammar": {
        "label": "手配：物を〜してもらう",
        "pattern": "have + 物 + 過去分詞",
        "note": "haveの後ろに物、その後ろに過去分詞を置き、手配して作業をしてもらうことを表します。物は作業を受ける側です。"
      }
    },
    "next": {
      "meaning": "私たちは、その書類を英語に翻訳してもらいました。",
      "alternatives": [
        {
          "text": "We got the documents translated into English.",
          "note": "get + 物 + 過去分詞も手配を表せます。"
        }
      ],
      "formNote": "have＋物＋過去分詞で、人に依頼・手配して〜してもらう形を練習します。",
      "grammar": {
        "label": "手配：物を〜してもらう",
        "pattern": "have + 物 + 過去分詞",
        "note": "haveの後ろに物、その後ろに過去分詞を置き、手配して作業をしてもらうことを表します。物は作業を受ける側です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "Although the plan is expensive, it may save energy.",
    "old": {
      "meaning": "その計画には費用がかかりますが、エネルギーの節約につながるかもしれません。",
      "alternatives": [
        {
          "text": "Though the plan is expensive, it may save energy.",
          "note": "thoughも自然な譲歩の接続詞です。"
        },
        {
          "text": "While the plan is expensive, it may save energy.",
          "note": "whileもここでは譲歩を示せます。"
        }
      ],
      "formNote": "譲歩の節を先に置きます。下の別表現も自然ですが、今回はそれ以外の接続詞を練習します。",
      "grammar": {
        "label": "譲歩・対比の節",
        "pattern": "Although + 文, 文",
        "note": "前半で認めた面に対して、後半で別の面を示します。前半も主語と動詞を持つ節です。"
      }
    },
    "next": {
      "meaning": "その計画には費用がかかりますが、エネルギーの節約につながるかもしれません。",
      "alternatives": [
        {
          "text": "Though the plan is expensive, it may save energy.",
          "note": "thoughも自然な譲歩の接続詞です。"
        },
        {
          "text": "While the plan is expensive, it may save energy.",
          "note": "whileもここでは譲歩を示せます。"
        }
      ],
      "formNote": "Although で譲歩の節を始め、後ろに主節を続けます。",
      "grammar": {
        "label": "譲歩・対比の節",
        "pattern": "Although + 文, 文",
        "note": "前半で認めた面に対して、後半で別の面を示します。前半も主語と動詞を持つ節です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken2",
    "text": "Although the device is expensive, it uses less electricity.",
    "old": {
      "meaning": "その機器は高価ですが、電力消費が少ないです。",
      "alternatives": [
        {
          "text": "Though the device is expensive, it uses less electricity.",
          "note": "thoughも自然な譲歩の接続詞です。"
        },
        {
          "text": "While the device is expensive, it uses less electricity.",
          "note": "whileもここでは譲歩を示せます。"
        }
      ],
      "formNote": "譲歩の節を先に置きます。下の別表現も自然ですが、今回はそれ以外の接続詞を練習します。",
      "grammar": {
        "label": "譲歩・対比の節",
        "pattern": "Although + 文, 文",
        "note": "前半で認めた面に対して、後半で別の面を示します。前半も主語と動詞を持つ節です。"
      }
    },
    "next": {
      "meaning": "その機器は高価ですが、電力消費が少ないです。",
      "alternatives": [
        {
          "text": "Though the device is expensive, it uses less electricity.",
          "note": "thoughも自然な譲歩の接続詞です。"
        },
        {
          "text": "While the device is expensive, it uses less electricity.",
          "note": "whileもここでは譲歩を示せます。"
        }
      ],
      "formNote": "Although で譲歩の節を始め、後ろに主節を続けます。",
      "grammar": {
        "label": "譲歩・対比の節",
        "pattern": "Although + 文, 文",
        "note": "前半で認めた面に対して、後半で別の面を示します。前半も主語と動詞を持つ節です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part1",
    "text": "The file may have been deleted by mistake.",
    "old": {
      "meaning": "そのファイルは誤って削除されたのかもしれません。",
      "alternatives": [
        {
          "text": "The file might have been deleted by mistake.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "過去に何かがされた可能性を表します。下の別表現も自然ですが、今回はそれ以外の助動詞で練習します。",
      "grammar": {
        "label": "助動詞と完了受け身",
        "pattern": "may have been + 過去分詞",
        "note": "過去に何かがされた可能性を、助動詞・完了形・受け身で組み立てます。"
      }
    },
    "next": {
      "meaning": "そのファイルは誤って削除されたのかもしれません。",
      "alternatives": [
        {
          "text": "The file might have been deleted by mistake.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "may have been＋過去分詞で、過去に〜された可能性を表します。",
      "grammar": {
        "label": "助動詞と完了受け身",
        "pattern": "may have been + 過去分詞",
        "note": "過去に何かがされた可能性を、助動詞・完了形・受け身で組み立てます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part1",
    "text": "The figures may have been entered incorrectly.",
    "old": {
      "meaning": "その数値は、間違って入力されたのかもしれません。",
      "alternatives": [
        {
          "text": "The figures might have been entered incorrectly.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "過去に何かがされた可能性を表します。下の別表現も自然ですが、今回はそれ以外の助動詞で練習します。",
      "grammar": {
        "label": "助動詞と完了受け身",
        "pattern": "may have been + 過去分詞",
        "note": "過去に何かがされた可能性を、助動詞・完了形・受け身で組み立てます。"
      }
    },
    "next": {
      "meaning": "その数値は、間違って入力されたのかもしれません。",
      "alternatives": [
        {
          "text": "The figures might have been entered incorrectly.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "may have been＋過去分詞で、過去に〜された可能性を表します。",
      "grammar": {
        "label": "助動詞と完了受け身",
        "pattern": "may have been + 過去分詞",
        "note": "過去に何かがされた可能性を、助動詞・完了形・受け身で組み立てます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part1",
    "text": "The meeting may have been postponed again.",
    "old": {
      "meaning": "その会議は、また延期されたのかもしれません。",
      "alternatives": [
        {
          "text": "The meeting might have been postponed again.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "過去に何かがされた可能性を表します。下の別表現も自然ですが、今回はそれ以外の助動詞で練習します。",
      "grammar": {
        "label": "助動詞と完了受け身",
        "pattern": "may have been + 過去分詞",
        "note": "過去に何かがされた可能性を、助動詞・完了形・受け身で組み立てます。"
      }
    },
    "next": {
      "meaning": "その会議は、また延期されたのかもしれません。",
      "alternatives": [
        {
          "text": "The meeting might have been postponed again.",
          "note": "過去の可能性を表す自然な別表現"
        }
      ],
      "formNote": "may have been＋過去分詞で、過去に〜された可能性を表します。",
      "grammar": {
        "label": "助動詞と完了受け身",
        "pattern": "may have been + 過去分詞",
        "note": "過去に何かがされた可能性を、助動詞・完了形・受け身で組み立てます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part1",
    "text": "But for your advice, I would have signed it.",
    "old": {
      "meaning": "あなたの助言がなかったら、私はそれに署名してしまっていたでしょう。",
      "alternatives": [
        {
          "text": "Without your advice, I would have signed it.",
          "note": "助けがない仮定を表す別表現"
        }
      ],
      "formNote": "もし〜がなかったらという前置詞句を先に置き、過去の反実仮想を続けます。下の別表現以外の句で練習します。",
      "grammar": {
        "label": "助けがなかった場合を仮定する",
        "pattern": "But for + 名詞, would have + 過去分詞",
        "note": "もしその助けや出来事がなかったら、という仮定を前置詞句で示します。後半は実際とは異なる過去の結果です。"
      }
    },
    "next": {
      "meaning": "あなたの助言がなかったら、私はそれに署名してしまっていたでしょう。",
      "alternatives": [
        {
          "text": "Without your advice, I would have signed it.",
          "note": "助けがない仮定を表す別表現"
        }
      ],
      "formNote": "But for＋名詞で「〜がなかったら」を先に置き、would have＋過去分詞で過去の結果を表します。",
      "grammar": {
        "label": "助けがなかった場合を仮定する",
        "pattern": "But for + 名詞, would have + 過去分詞",
        "note": "もしその助けや出来事がなかったら、という仮定を前置詞句で示します。後半は実際とは異なる過去の結果です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part1",
    "text": "But for the grant, the study would have ended.",
    "old": {
      "meaning": "その助成金がなかったら、その研究は終わってしまっていたでしょう。",
      "alternatives": [
        {
          "text": "Without the grant, the study would have ended.",
          "note": "助けがない仮定を表す別表現"
        }
      ],
      "formNote": "もし〜がなかったらという前置詞句を先に置き、過去の反実仮想を続けます。下の別表現以外の句で練習します。",
      "grammar": {
        "label": "助けがなかった場合を仮定する",
        "pattern": "But for + 名詞, would have + 過去分詞",
        "note": "もしその助けや出来事がなかったら、という仮定を前置詞句で示します。後半は実際とは異なる過去の結果です。"
      }
    },
    "next": {
      "meaning": "その助成金がなかったら、その研究は終わってしまっていたでしょう。",
      "alternatives": [
        {
          "text": "Without the grant, the study would have ended.",
          "note": "助けがない仮定を表す別表現"
        }
      ],
      "formNote": "But for＋名詞で「〜がなかったら」を先に置き、would have＋過去分詞で過去の結果を表します。",
      "grammar": {
        "label": "助けがなかった場合を仮定する",
        "pattern": "But for + 名詞, would have + 過去分詞",
        "note": "もしその助けや出来事がなかったら、という仮定を前置詞句で示します。後半は実際とは異なる過去の結果です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part1",
    "text": "But for the warning, we would have used that road.",
    "old": {
      "meaning": "その警告がなかったら、私たちはその道を使っていたでしょう。",
      "alternatives": [
        {
          "text": "Without the warning, we would have used that road.",
          "note": "助けがない仮定を表す別表現"
        }
      ],
      "formNote": "もし〜がなかったらという前置詞句を先に置き、過去の反実仮想を続けます。下の別表現以外の句で練習します。",
      "grammar": {
        "label": "助けがなかった場合を仮定する",
        "pattern": "But for + 名詞, would have + 過去分詞",
        "note": "もしその助けや出来事がなかったら、という仮定を前置詞句で示します。後半は実際とは異なる過去の結果です。"
      }
    },
    "next": {
      "meaning": "その警告がなかったら、私たちはその道を使っていたでしょう。",
      "alternatives": [
        {
          "text": "Without the warning, we would have used that road.",
          "note": "助けがない仮定を表す別表現"
        }
      ],
      "formNote": "But for＋名詞で「〜がなかったら」を先に置き、would have＋過去分詞で過去の結果を表します。",
      "grammar": {
        "label": "助けがなかった場合を仮定する",
        "pattern": "But for + 名詞, would have + 過去分詞",
        "note": "もしその助けや出来事がなかったら、という仮定を前置詞句で示します。後半は実際とは異なる過去の結果です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part2",
    "text": "We can proceed provided that everyone agrees.",
    "old": {
      "meaning": "全員が同意するという条件なら、私たちは先に進めます。",
      "alternatives": [
        {
          "text": "We can proceed providing that everyone agrees.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節を先に置き、条件を明示する接続表現の節を続けます。下の別表現以外の形で練習します。",
      "grammar": {
        "label": "条件を明示する接続表現",
        "pattern": "主節 + provided that + 文",
        "note": "ある条件が満たされる場合に限って、許可や協力などを述べます。"
      }
    },
    "next": {
      "meaning": "全員が同意するという条件なら、私たちは先に進めます。",
      "alternatives": [
        {
          "text": "We can proceed providing that everyone agrees.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節の後ろに provided that の節を置き、条件を示します。",
      "grammar": {
        "label": "条件を明示する接続表現",
        "pattern": "主節 + provided that + 文",
        "note": "ある条件が満たされる場合に限って、許可や協力などを述べます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part2",
    "text": "You may attend provided that you register first.",
    "old": {
      "meaning": "先に登録するという条件なら、参加して構いません。",
      "alternatives": [
        {
          "text": "You may attend providing that you register first.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節を先に置き、条件を明示する接続表現の節を続けます。下の別表現以外の形で練習します。",
      "grammar": {
        "label": "条件を明示する接続表現",
        "pattern": "主節 + provided that + 文",
        "note": "ある条件が満たされる場合に限って、許可や協力などを述べます。"
      }
    },
    "next": {
      "meaning": "先に登録するという条件なら、参加して構いません。",
      "alternatives": [
        {
          "text": "You may attend providing that you register first.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節の後ろに provided that の節を置き、条件を示します。",
      "grammar": {
        "label": "条件を明示する接続表現",
        "pattern": "主節 + provided that + 文",
        "note": "ある条件が満たされる場合に限って、許可や協力などを述べます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part2",
    "text": "They will help provided that we share the costs.",
    "old": {
      "meaning": "私たちが費用を分担するという条件なら、彼らは協力してくれます。",
      "alternatives": [
        {
          "text": "They will help providing that we share the costs.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節を先に置き、条件を明示する接続表現の節を続けます。下の別表現以外の形で練習します。",
      "grammar": {
        "label": "条件を明示する接続表現",
        "pattern": "主節 + provided that + 文",
        "note": "ある条件が満たされる場合に限って、許可や協力などを述べます。"
      }
    },
    "next": {
      "meaning": "私たちが費用を分担するという条件なら、彼らは協力してくれます。",
      "alternatives": [
        {
          "text": "They will help providing that we share the costs.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節の後ろに provided that の節を置き、条件を示します。",
      "grammar": {
        "label": "条件を明示する接続表現",
        "pattern": "主節 + provided that + 文",
        "note": "ある条件が満たされる場合に限って、許可や協力などを述べます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part2",
    "text": "She asked whether we had received the payment.",
    "old": {
      "meaning": "彼女は、私たちがその支払いを受け取っていたかどうか尋ねました。",
      "alternatives": [
        {
          "text": "She asked if we had received the payment.",
          "note": "〜かどうかを表す別表現"
        }
      ],
      "formNote": "尋ねた時点より前の完了を過去完了にし、その内容を間接疑問で伝えます。下の別表現以外で練習します。",
      "grammar": {
        "label": "過去の疑問を伝える",
        "pattern": "asked + whether + 主語 + had + 過去分詞",
        "note": "過去に尋ねた内容を間接疑問で伝え、それより前の完了を過去完了で示します。"
      }
    },
    "next": {
      "meaning": "彼女は、私たちがその支払いを受け取っていたかどうか尋ねました。",
      "alternatives": [
        {
          "text": "She asked if we had received the payment.",
          "note": "〜かどうかを表す別表現"
        }
      ],
      "formNote": "whether の間接疑問を使い、尋ねた時点より前のことを過去完了で伝えます。",
      "grammar": {
        "label": "過去の疑問を伝える",
        "pattern": "asked + whether + 主語 + had + 過去分詞",
        "note": "過去に尋ねた内容を間接疑問で伝え、それより前の完了を過去完了で示します。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part2",
    "text": "He asked whether the deadline had been extended.",
    "old": {
      "meaning": "彼は、締め切りが延長されていたかどうか尋ねました。",
      "alternatives": [
        {
          "text": "He asked if the deadline had been extended.",
          "note": "〜かどうかを表す別表現"
        }
      ],
      "formNote": "尋ねた時点より前の完了を過去完了にし、その内容を間接疑問で伝えます。下の別表現以外で練習します。",
      "grammar": {
        "label": "過去の疑問を伝える",
        "pattern": "asked + whether + 主語 + had + 過去分詞",
        "note": "過去に尋ねた内容を間接疑問で伝え、それより前の完了を過去完了で示します。"
      }
    },
    "next": {
      "meaning": "彼は、締め切りが延長されていたかどうか尋ねました。",
      "alternatives": [
        {
          "text": "He asked if the deadline had been extended.",
          "note": "〜かどうかを表す別表現"
        }
      ],
      "formNote": "whether の間接疑問を使い、尋ねた時点より前のことを過去完了で伝えます。",
      "grammar": {
        "label": "過去の疑問を伝える",
        "pattern": "asked + whether + 主語 + had + 過去分詞",
        "note": "過去に尋ねた内容を間接疑問で伝え、それより前の完了を過去完了で示します。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part2",
    "text": "They asked whether we had checked the figures.",
    "old": {
      "meaning": "彼らは、私たちが数値を確認していたかどうか尋ねました。",
      "alternatives": [
        {
          "text": "They asked if we had checked the figures.",
          "note": "〜かどうかを表す別表現"
        }
      ],
      "formNote": "尋ねた時点より前の完了を過去完了にし、その内容を間接疑問で伝えます。下の別表現以外で練習します。",
      "grammar": {
        "label": "過去の疑問を伝える",
        "pattern": "asked + whether + 主語 + had + 過去分詞",
        "note": "過去に尋ねた内容を間接疑問で伝え、それより前の完了を過去完了で示します。"
      }
    },
    "next": {
      "meaning": "彼らは、私たちが数値を確認していたかどうか尋ねました。",
      "alternatives": [
        {
          "text": "They asked if we had checked the figures.",
          "note": "〜かどうかを表す別表現"
        }
      ],
      "formNote": "whether の間接疑問を使い、尋ねた時点より前のことを過去完了で伝えます。",
      "grammar": {
        "label": "過去の疑問を伝える",
        "pattern": "asked + whether + 主語 + had + 過去分詞",
        "note": "過去に尋ねた内容を間接疑問で伝え、それより前の完了を過去完了で示します。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part2",
    "text": "We should have consulted local residents first.",
    "old": {
      "meaning": "私たちはまず地元の住民に相談しておくべきでした。",
      "alternatives": [
        {
          "text": "We ought to have consulted local residents first.",
          "note": "過去への後悔を表す別表現"
        }
      ],
      "formNote": "実際にはしなかった行動への後悔を、助動詞と完了形で述べます。下の別表現以外の助動詞で練習します。",
      "grammar": {
        "label": "過去にすべきだったこと",
        "pattern": "should have + 過去分詞",
        "note": "実際にはしなかった行動について、しておくべきだったと振り返る3文です。"
      }
    },
    "next": {
      "meaning": "私たちはまず地元の住民に相談しておくべきでした。",
      "alternatives": [
        {
          "text": "We ought to have consulted local residents first.",
          "note": "過去への後悔を表す別表現"
        }
      ],
      "formNote": "should have＋過去分詞で、過去にしておくべきだったことを表します。",
      "grammar": {
        "label": "過去にすべきだったこと",
        "pattern": "should have + 過去分詞",
        "note": "実際にはしなかった行動について、しておくべきだったと振り返る3文です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part2",
    "text": "She should have checked the source before sharing it.",
    "old": {
      "meaning": "彼女はそれを共有する前に、情報源を確認しておくべきでした。",
      "alternatives": [
        {
          "text": "She ought to have checked the source before sharing it.",
          "note": "過去への後悔を表す別表現"
        }
      ],
      "formNote": "実際にはしなかった行動への後悔を、助動詞と完了形で述べます。下の別表現以外の助動詞で練習します。",
      "grammar": {
        "label": "過去にすべきだったこと",
        "pattern": "should have + 過去分詞",
        "note": "実際にはしなかった行動について、しておくべきだったと振り返る3文です。"
      }
    },
    "next": {
      "meaning": "彼女はそれを共有する前に、情報源を確認しておくべきでした。",
      "alternatives": [
        {
          "text": "She ought to have checked the source before sharing it.",
          "note": "過去への後悔を表す別表現"
        }
      ],
      "formNote": "should have＋過去分詞で、過去にしておくべきだったことを表します。",
      "grammar": {
        "label": "過去にすべきだったこと",
        "pattern": "should have + 過去分詞",
        "note": "実際にはしなかった行動について、しておくべきだったと振り返る3文です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "EikenPre1Part2",
    "text": "They should have warned us about the risks.",
    "old": {
      "meaning": "彼らは、その危険について私たちに警告しておくべきでした。",
      "alternatives": [
        {
          "text": "They ought to have warned us about the risks.",
          "note": "過去への後悔を表す別表現"
        }
      ],
      "formNote": "実際にはしなかった行動への後悔を、助動詞と完了形で述べます。下の別表現以外の助動詞で練習します。",
      "grammar": {
        "label": "過去にすべきだったこと",
        "pattern": "should have + 過去分詞",
        "note": "実際にはしなかった行動について、しておくべきだったと振り返る3文です。"
      }
    },
    "next": {
      "meaning": "彼らは、その危険について私たちに警告しておくべきでした。",
      "alternatives": [
        {
          "text": "They ought to have warned us about the risks.",
          "note": "過去への後悔を表す別表現"
        }
      ],
      "formNote": "should have＋過去分詞で、過去にしておくべきだったことを表します。",
      "grammar": {
        "label": "過去にすべきだったこと",
        "pattern": "should have + 過去分詞",
        "note": "実際にはしなかった行動について、しておくべきだったと振り返る3文です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The device that monitors air quality is easy to use.",
    "old": {
      "meaning": "空気の質を監視するその装置は使いやすいです。",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that protects workersはlawの説明で、文全体の中心はThe law will take effectです。二つ目もthat supported the claimをいったん分けると、The evidence was discreditedという受け身の骨組みが見えます。"
      }
    },
    "next": {
      "meaning": "空気の質を監視するその装置は使いやすいです。",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "主格の関係代名詞 that を使い、主語の名詞を説明します。",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that monitors air quality が device を説明します。文全体は The device is easy to use. という骨組みです。"
      }
    },
    "promptChanged": true,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part1",
    "text": "The law that protects workers will take effect next year.",
    "old": {
      "meaning": "労働者を守る法律は来年施行される。",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "主語の名詞を、関係代名詞が主語になる節で説明します。比較欄以外の関係代名詞で練習します。",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that protects workersはlawの説明で、文全体の中心はThe law will take effectです。二つ目もthat supported the claimをいったん分けると、The evidence was discreditedという受け身の骨組みが見えます。"
      }
    },
    "next": {
      "meaning": "労働者を守る法律は来年施行される。",
      "alternatives": [
        {
          "text": "which",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "主格の関係代名詞 that を使い、主語の名詞を説明します。",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that protects workers が law を説明します。文全体の骨組みは The law will take effect next year. です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part1",
    "text": "While the trial failed, it revealed an important problem.",
    "old": {
      "meaning": "試験は失敗したが、重要な問題を明らかにした。",
      "alternatives": [
        {
          "text": "Although",
          "note": "〜ではあるけれど"
        }
      ],
      "formNote": "譲歩の節を先に置きます。比較欄の接続表現も自然ですが、今回はそれ以外の形で練習します。",
      "grammar": {
        "label": "譲歩・対比の接続詞",
        "pattern": "Although / While ＋ 主語＋動詞, 主節",
        "note": "although以下を認めたうえで、後ろの主節に予想と異なる面を示します。whileもここでは「〜している間」ではなく対比。後ろにある問題点まで読んで主張を捉えます。"
      }
    },
    "next": {
      "meaning": "試験は失敗したが、重要な問題を明らかにした。",
      "alternatives": [
        {
          "text": "Although",
          "note": "〜ではあるけれど"
        }
      ],
      "formNote": "While で譲歩の節を始め、後ろに主節を続けます。",
      "grammar": {
        "label": "譲歩・対比の接続詞",
        "pattern": "Although / While ＋ 主語＋動詞, 主節",
        "note": "although以下を認めたうえで、後ろの主節に予想と異なる面を示します。whileもここでは「〜している間」ではなく対比。後ろにある問題点まで読んで主張を捉えます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "Although the evidence is limited, the risk cannot be ignored.",
    "old": {
      "meaning": "証拠は限られるが、危険を無視はできない。",
      "alternatives": [
        {
          "text": "While",
          "note": "〜ではあるけれど"
        }
      ],
      "formNote": "譲歩・対比",
      "grammar": {
        "label": "譲歩・対比の接続詞",
        "pattern": "Although / While ＋ 主語＋動詞, 主節",
        "note": "although以下を認めたうえで、後ろの主節に予想と異なる面を示します。whileもここでは「〜している間」ではなく対比。後ろにある問題点まで読んで主張を捉えます。"
      }
    },
    "next": {
      "meaning": "証拠は限られるが、危険を無視はできない。",
      "alternatives": [
        {
          "text": "While",
          "note": "〜ではあるけれど"
        }
      ],
      "formNote": "Although で譲歩の節を始め、後ろに主節を続けます。",
      "grammar": {
        "label": "譲歩・対比の接続詞",
        "pattern": "Although / While ＋ 主語＋動詞, 主節",
        "note": "although以下を認めたうえで、後ろの主節に予想と異なる面を示します。whileもここでは「〜している間」ではなく対比。後ろにある問題点まで読んで主張を捉えます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The researchers may have overlooked an important variable.",
    "old": {
      "meaning": "研究者たちは、重要な変数を見落としていたのかもしれません。",
      "alternatives": [
        {
          "text": "The researchers might have overlooked an important variable.",
          "note": "過去の可能性を述べる自然な別表現"
        }
      ],
      "formNote": "過去の行為の可能性を、助動詞と完了形で述べます。別の推量の助動詞も自然です。下の別表現以外の助動詞で練習します。",
      "grammar": {
        "label": "過去への推量",
        "pattern": "may have + 過去分詞",
        "note": "過去に何かをした可能性を述べます。mayの後ろはhave、その後ろが過去分詞です。"
      }
    },
    "next": {
      "meaning": "研究者たちは、重要な変数を見落としていたのかもしれません。",
      "alternatives": [
        {
          "text": "The researchers might have overlooked an important variable.",
          "note": "過去の可能性を述べる自然な別表現"
        }
      ],
      "formNote": "may have＋過去分詞で、過去の行為の可能性を表します。",
      "grammar": {
        "label": "過去への推量",
        "pattern": "may have + 過去分詞",
        "note": "過去に何かをした可能性を述べます。mayの後ろはhave、その後ろが過去分詞です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The agency may have underestimated the cost of maintenance.",
    "old": {
      "meaning": "その機関は、維持費を過小評価していたのかもしれません。",
      "alternatives": [
        {
          "text": "The agency might have underestimated the cost of maintenance.",
          "note": "過去の可能性を述べる自然な別表現"
        }
      ],
      "formNote": "過去の行為の可能性を、助動詞と完了形で述べます。別の推量の助動詞も自然です。下の別表現以外の助動詞で練習します。",
      "grammar": {
        "label": "過去への推量",
        "pattern": "may have + 過去分詞",
        "note": "過去に何かをした可能性を述べます。mayの後ろはhave、その後ろが過去分詞です。"
      }
    },
    "next": {
      "meaning": "その機関は、維持費を過小評価していたのかもしれません。",
      "alternatives": [
        {
          "text": "The agency might have underestimated the cost of maintenance.",
          "note": "過去の可能性を述べる自然な別表現"
        }
      ],
      "formNote": "may have＋過去分詞で、過去の行為の可能性を表します。",
      "grammar": {
        "label": "過去への推量",
        "pattern": "may have + 過去分詞",
        "note": "過去に何かをした可能性を述べます。mayの後ろはhave、その後ろが過去分詞です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The witnesses may have confused the order of events.",
    "old": {
      "meaning": "目撃者たちは、出来事の順序を取り違えていたのかもしれません。",
      "alternatives": [
        {
          "text": "The witnesses might have confused the order of events.",
          "note": "過去の可能性を述べる自然な別表現"
        }
      ],
      "formNote": "過去の行為の可能性を、助動詞と完了形で述べます。別の推量の助動詞も自然です。下の別表現以外の助動詞で練習します。",
      "grammar": {
        "label": "過去への推量",
        "pattern": "may have + 過去分詞",
        "note": "過去に何かをした可能性を述べます。mayの後ろはhave、その後ろが過去分詞です。"
      }
    },
    "next": {
      "meaning": "目撃者たちは、出来事の順序を取り違えていたのかもしれません。",
      "alternatives": [
        {
          "text": "The witnesses might have confused the order of events.",
          "note": "過去の可能性を述べる自然な別表現"
        }
      ],
      "formNote": "may have＋過去分詞で、過去の行為の可能性を表します。",
      "grammar": {
        "label": "過去への推量",
        "pattern": "may have + 過去分詞",
        "note": "過去に何かをした可能性を述べます。mayの後ろはhave、その後ろが過去分詞です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The risks should have been disclosed before the trial began.",
    "old": {
      "meaning": "その危険性は、試験が始まる前に開示されるべきでした。",
      "alternatives": [
        {
          "text": "The risks ought to have been disclosed before the trial began.",
          "note": "過去の対応を振り返る別の助動詞表現"
        }
      ],
      "formNote": "実際にはされなかった対応への批判です。対象を主語にし、助動詞・完了形・受け身を組み合わせます。",
      "grammar": {
        "label": "過去の対応を振り返る受け身",
        "pattern": "should have been + 過去分詞",
        "note": "過去にされるべきだったのにされなかった対応を、受け身で振り返ります。"
      }
    },
    "next": {
      "meaning": "その危険性は、試験が始まる前に開示されるべきでした。",
      "alternatives": [
        {
          "text": "The risks ought to have been disclosed before the trial began.",
          "note": "過去の対応を振り返る別の助動詞表現"
        }
      ],
      "formNote": "should have been＋過去分詞で、過去にされるべきだった対応を表します。",
      "grammar": {
        "label": "過去の対応を振り返る受け身",
        "pattern": "should have been + 過去分詞",
        "note": "過去にされるべきだったのにされなかった対応を、受け身で振り返ります。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "Local residents should have been consulted before construction.",
    "old": {
      "meaning": "地元の住民は、建設前に意見を聞かれるべきでした。",
      "alternatives": [
        {
          "text": "Local residents ought to have been consulted before construction.",
          "note": "過去の対応を振り返る別の助動詞表現"
        }
      ],
      "formNote": "実際にはされなかった対応への批判です。対象を主語にし、助動詞・完了形・受け身を組み合わせます。",
      "grammar": {
        "label": "過去の対応を振り返る受け身",
        "pattern": "should have been + 過去分詞",
        "note": "過去にされるべきだったのにされなかった対応を、受け身で振り返ります。"
      }
    },
    "next": {
      "meaning": "地元の住民は、建設前に意見を聞かれるべきでした。",
      "alternatives": [
        {
          "text": "Local residents ought to have been consulted before construction.",
          "note": "過去の対応を振り返る別の助動詞表現"
        }
      ],
      "formNote": "should have been＋過去分詞で、過去にされるべきだった対応を表します。",
      "grammar": {
        "label": "過去の対応を振り返る受け身",
        "pattern": "should have been + 過去分詞",
        "note": "過去にされるべきだったのにされなかった対応を、受け身で振り返ります。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The conflicting results should have been examined more closely.",
    "old": {
      "meaning": "食い違う結果は、もっと詳しく検討されるべきでした。",
      "alternatives": [
        {
          "text": "The conflicting results ought to have been examined more closely.",
          "note": "過去の対応を振り返る別の助動詞表現"
        }
      ],
      "formNote": "実際にはされなかった対応への批判です。対象を主語にし、助動詞・完了形・受け身を組み合わせます。",
      "grammar": {
        "label": "過去の対応を振り返る受け身",
        "pattern": "should have been + 過去分詞",
        "note": "過去にされるべきだったのにされなかった対応を、受け身で振り返ります。"
      }
    },
    "next": {
      "meaning": "食い違う結果は、もっと詳しく検討されるべきでした。",
      "alternatives": [
        {
          "text": "The conflicting results ought to have been examined more closely.",
          "note": "過去の対応を振り返る別の助動詞表現"
        }
      ],
      "formNote": "should have been＋過去分詞で、過去にされるべきだった対応を表します。",
      "grammar": {
        "label": "過去の対応を振り返る受け身",
        "pattern": "should have been + 過去分詞",
        "note": "過去にされるべきだったのにされなかった対応を、受け身で振り返ります。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The evidence that the team collected contradicted the claim.",
    "old": {
      "meaning": "そのチームが集めた証拠は、その主張と矛盾していました。",
      "alternatives": [
        {
          "text": "The evidence which the team collected contradicted the claim.",
          "note": "物を説明する目的格の関係代名詞"
        },
        {
          "text": "The evidence the team collected contradicted the claim.",
          "note": "目的格の関係代名詞を省く形"
        }
      ],
      "formNote": "名詞を説明する節の目的語を関係代名詞にします。省略せず、別表現欄以外の関係代名詞で練習します。",
      "grammar": {
        "label": "目的格の関係代名詞",
        "pattern": "名詞 + that + 主語 + 動詞",
        "note": "関係節の中に目的語が欠けており、その内容が前の名詞です。主格の関係詞との違いを確かめます。"
      }
    },
    "next": {
      "meaning": "そのチームが集めた証拠は、その主張と矛盾していました。",
      "alternatives": [
        {
          "text": "The evidence which the team collected contradicted the claim.",
          "note": "物を説明する目的格の関係代名詞"
        },
        {
          "text": "The evidence the team collected contradicted the claim.",
          "note": "目的格の関係代名詞を省く形"
        }
      ],
      "formNote": "目的格の関係代名詞 that を省略せず、名詞を説明する節を続けます。",
      "grammar": {
        "label": "目的格の関係代名詞",
        "pattern": "名詞 + that + 主語 + 動詞",
        "note": "関係節の中に目的語が欠けており、その内容が前の名詞です。主格の関係詞との違いを確かめます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The restrictions that the council imposed remain controversial.",
    "old": {
      "meaning": "議会が課した制限は、今も議論を呼んでいます。",
      "alternatives": [
        {
          "text": "The restrictions which the council imposed remain controversial.",
          "note": "物を説明する目的格の関係代名詞"
        },
        {
          "text": "The restrictions the council imposed remain controversial.",
          "note": "目的格の関係代名詞を省く形"
        }
      ],
      "formNote": "名詞を説明する節の目的語を関係代名詞にします。省略せず、別表現欄以外の関係代名詞で練習します。",
      "grammar": {
        "label": "目的格の関係代名詞",
        "pattern": "名詞 + that + 主語 + 動詞",
        "note": "関係節の中に目的語が欠けており、その内容が前の名詞です。主格の関係詞との違いを確かめます。"
      }
    },
    "next": {
      "meaning": "議会が課した制限は、今も議論を呼んでいます。",
      "alternatives": [
        {
          "text": "The restrictions which the council imposed remain controversial.",
          "note": "物を説明する目的格の関係代名詞"
        },
        {
          "text": "The restrictions the council imposed remain controversial.",
          "note": "目的格の関係代名詞を省く形"
        }
      ],
      "formNote": "目的格の関係代名詞 that を省略せず、名詞を説明する節を続けます。",
      "grammar": {
        "label": "目的格の関係代名詞",
        "pattern": "名詞 + that + 主語 + 動詞",
        "note": "関係節の中に目的語が欠けており、その内容が前の名詞です。主格の関係詞との違いを確かめます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The resources that the project requires are not yet available.",
    "old": {
      "meaning": "その事業が必要とする資源は、まだ利用できません。",
      "alternatives": [
        {
          "text": "The resources which the project requires are not yet available.",
          "note": "物を説明する目的格の関係代名詞"
        },
        {
          "text": "The resources the project requires are not yet available.",
          "note": "目的格の関係代名詞を省く形"
        }
      ],
      "formNote": "名詞を説明する節の目的語を関係代名詞にします。省略せず、別表現欄以外の関係代名詞で練習します。",
      "grammar": {
        "label": "目的格の関係代名詞",
        "pattern": "名詞 + that + 主語 + 動詞",
        "note": "関係節の中に目的語が欠けており、その内容が前の名詞です。主格の関係詞との違いを確かめます。"
      }
    },
    "next": {
      "meaning": "その事業が必要とする資源は、まだ利用できません。",
      "alternatives": [
        {
          "text": "The resources which the project requires are not yet available.",
          "note": "物を説明する目的格の関係代名詞"
        },
        {
          "text": "The resources the project requires are not yet available.",
          "note": "目的格の関係代名詞を省く形"
        }
      ],
      "formNote": "目的格の関係代名詞 that を省略せず、名詞を説明する節を続けます。",
      "grammar": {
        "label": "目的格の関係代名詞",
        "pattern": "名詞 + that + 主語 + 動詞",
        "note": "関係節の中に目的語が欠けており、その内容が前の名詞です。主格の関係詞との違いを確かめます。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "Limited as the funds were, the team completed the survey.",
    "old": {
      "meaning": "資金は限られていましたが、そのチームは調査を完了しました。",
      "alternatives": [
        {
          "text": "Limited though the funds were, the team completed the survey.",
          "note": "形容詞を前に出す譲歩の別の形"
        }
      ],
      "formNote": "認める状態を表す形容詞を節の先頭に出し、接続詞と主語を続ける譲歩の型です。",
      "grammar": {
        "label": "形容詞を前に置く譲歩",
        "pattern": "形容詞 + as + 主語 + be, 主節",
        "note": "形容詞をasの前に出して、認める事実と予想に反する結果を結びます。理由のasとは区別します。"
      }
    },
    "next": {
      "meaning": "資金は限られていましたが、そのチームは調査を完了しました。",
      "alternatives": [
        {
          "text": "Limited though the funds were, the team completed the survey.",
          "note": "形容詞を前に出す譲歩の別の形"
        }
      ],
      "formNote": "形容詞を先頭に置く「形容詞＋as＋主語＋be動詞」の譲歩の型を練習します。",
      "grammar": {
        "label": "形容詞を前に置く譲歩",
        "pattern": "形容詞 + as + 主語 + be, 主節",
        "note": "形容詞をasの前に出して、認める事実と予想に反する結果を結びます。理由のasとは区別します。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "Useful as the model is, it cannot predict every outcome.",
    "old": {
      "meaning": "そのモデルは有用ですが、すべての結果を予測することはできません。",
      "alternatives": [
        {
          "text": "Useful though the model is, it cannot predict every outcome.",
          "note": "形容詞を前に出す譲歩の別の形"
        }
      ],
      "formNote": "認める状態を表す形容詞を節の先頭に出し、接続詞と主語を続ける譲歩の型です。",
      "grammar": {
        "label": "形容詞を前に置く譲歩",
        "pattern": "形容詞 + as + 主語 + be, 主節",
        "note": "形容詞をasの前に出して、認める事実と予想に反する結果を結びます。理由のasとは区別します。"
      }
    },
    "next": {
      "meaning": "そのモデルは有用ですが、すべての結果を予測することはできません。",
      "alternatives": [
        {
          "text": "Useful though the model is, it cannot predict every outcome.",
          "note": "形容詞を前に出す譲歩の別の形"
        }
      ],
      "formNote": "形容詞を先頭に置く「形容詞＋as＋主語＋be動詞」の譲歩の型を練習します。",
      "grammar": {
        "label": "形容詞を前に置く譲歩",
        "pattern": "形容詞 + as + 主語 + be, 主節",
        "note": "形容詞をasの前に出して、認める事実と予想に反する結果を結びます。理由のasとは区別します。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "Severe as the damage was, essential services were restored.",
    "old": {
      "meaning": "被害は深刻でしたが、不可欠なサービスは復旧しました。",
      "alternatives": [
        {
          "text": "Severe though the damage was, essential services were restored.",
          "note": "形容詞を前に出す譲歩の別の形"
        }
      ],
      "formNote": "認める状態を表す形容詞を節の先頭に出し、接続詞と主語を続ける譲歩の型です。",
      "grammar": {
        "label": "形容詞を前に置く譲歩",
        "pattern": "形容詞 + as + 主語 + be, 主節",
        "note": "形容詞をasの前に出して、認める事実と予想に反する結果を結びます。理由のasとは区別します。"
      }
    },
    "next": {
      "meaning": "被害は深刻でしたが、不可欠なサービスは復旧しました。",
      "alternatives": [
        {
          "text": "Severe though the damage was, essential services were restored.",
          "note": "形容詞を前に出す譲歩の別の形"
        }
      ],
      "formNote": "形容詞を先頭に置く「形容詞＋as＋主語＋be動詞」の譲歩の型を練習します。",
      "grammar": {
        "label": "形容詞を前に置く譲歩",
        "pattern": "形容詞 + as + 主語 + be, 主節",
        "note": "形容詞をasの前に出して、認める事実と予想に反する結果を結びます。理由のasとは区別します。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part2",
    "text": "The study which examined rural hospitals revealed a shortage.",
    "old": {
      "meaning": "地方の病院を調べたその研究は、不足があることを明らかにしました。",
      "alternatives": [
        {
          "text": "that",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that protects workersはlawの説明で、文全体の中心はThe law will take effectです。二つ目もthat supported the claimをいったん分けると、The evidence was discreditedという受け身の骨組みが見えます。"
      }
    },
    "next": {
      "meaning": "地方の病院を調べたその研究は、不足があることを明らかにしました。",
      "alternatives": [
        {
          "text": "that",
          "note": "物を説明する関係代名詞"
        }
      ],
      "formNote": "主格の関係代名詞 which を使い、主語の study を説明します。",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "which examined rural hospitals が study を説明します。文全体の中心となる動詞は revealed です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part2",
    "text": "The scheme can succeed provided that oversight remains independent.",
    "old": {
      "meaning": "監督の独立性が保たれるという条件なら、その制度は成功できます。",
      "alternatives": [
        {
          "text": "The scheme can succeed providing that oversight remains independent.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節を先に置いて条件の節を続けます。自然な別表現欄以外の接続の形で練習します。",
      "grammar": {
        "label": "満たす必要のある条件",
        "pattern": "主節 + provided that + 文",
        "note": "条件が満たされる場合に限るという意味を、主節の後ろの節で示します。providing thatなども自然です。"
      }
    },
    "next": {
      "meaning": "監督の独立性が保たれるという条件なら、その制度は成功できます。",
      "alternatives": [
        {
          "text": "The scheme can succeed providing that oversight remains independent.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節の後ろに provided that の節を置き、満たす必要のある条件を示します。",
      "grammar": {
        "label": "満たす必要のある条件",
        "pattern": "主節 + provided that + 文",
        "note": "条件が満たされる場合に限るという意味を、主節の後ろの節で示します。providing thatなども自然です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part2",
    "text": "We will share the data provided that privacy is protected.",
    "old": {
      "meaning": "プライバシーが守られるという条件なら、私たちはデータを共有します。",
      "alternatives": [
        {
          "text": "We will share the data providing that privacy is protected.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節を先に置いて条件の節を続けます。自然な別表現欄以外の接続の形で練習します。",
      "grammar": {
        "label": "満たす必要のある条件",
        "pattern": "主節 + provided that + 文",
        "note": "条件が満たされる場合に限るという意味を、主節の後ろの節で示します。providing thatなども自然です。"
      }
    },
    "next": {
      "meaning": "プライバシーが守られるという条件なら、私たちはデータを共有します。",
      "alternatives": [
        {
          "text": "We will share the data providing that privacy is protected.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節の後ろに provided that の節を置き、満たす必要のある条件を示します。",
      "grammar": {
        "label": "満たす必要のある条件",
        "pattern": "主節 + provided that + 文",
        "note": "条件が満たされる場合に限るという意味を、主節の後ろの節で示します。providing thatなども自然です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part2",
    "text": "The trial may proceed provided that every participant consents.",
    "old": {
      "meaning": "すべての参加者が同意するという条件なら、試験を進めても構いません。",
      "alternatives": [
        {
          "text": "The trial may proceed providing that every participant consents.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節を先に置いて条件の節を続けます。自然な別表現欄以外の接続の形で練習します。",
      "grammar": {
        "label": "満たす必要のある条件",
        "pattern": "主節 + provided that + 文",
        "note": "条件が満たされる場合に限るという意味を、主節の後ろの節で示します。providing thatなども自然です。"
      }
    },
    "next": {
      "meaning": "すべての参加者が同意するという条件なら、試験を進めても構いません。",
      "alternatives": [
        {
          "text": "The trial may proceed providing that every participant consents.",
          "note": "同じ条件を表せる接続表現"
        }
      ],
      "formNote": "主節の後ろに provided that の節を置き、満たす必要のある条件を示します。",
      "grammar": {
        "label": "満たす必要のある条件",
        "pattern": "主節 + provided that + 文",
        "note": "条件が満たされる場合に限るという意味を、主節の後ろの節で示します。providing thatなども自然です。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part2",
    "text": "Were the scheme to fail, public confidence would suffer.",
    "old": {
      "meaning": "仮にその制度が失敗すれば、人々の信頼は損なわれるでしょう。",
      "alternatives": [],
      "formNote": "今後のことを距離を置いて仮定します。条件節は接続詞を省き、助動詞と主語を入れ替え、不定詞を続けます。",
      "grammar": {
        "label": "実現を距離を置いて仮定する",
        "pattern": "Were + 主語 + to + 原形, would + 原形",
        "note": "現実から距離を置く未来の仮定を、were toと条件倒置で表します。不可能だと断定する形ではありません。"
      }
    },
    "next": {
      "meaning": "仮にその制度が失敗すれば、人々の信頼は損なわれるでしょう。",
      "alternatives": [],
      "formNote": "if を使わず、were を主語の前に置き、to＋動詞の原形を続けて将来を仮定します。",
      "grammar": {
        "label": "実現を距離を置いて仮定する",
        "pattern": "Were + 主語 + to + 原形, would + 原形",
        "note": "現実から距離を置く未来の仮定を、were toと条件倒置で表します。不可能だと断定する形ではありません。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part2",
    "text": "Were funding to cease, several research teams would disband.",
    "old": {
      "meaning": "仮に資金提供が途絶えれば、いくつかの研究チームは解散するでしょう。",
      "alternatives": [],
      "formNote": "今後のことを距離を置いて仮定します。条件節は接続詞を省き、助動詞と主語を入れ替え、不定詞を続けます。",
      "grammar": {
        "label": "実現を距離を置いて仮定する",
        "pattern": "Were + 主語 + to + 原形, would + 原形",
        "note": "現実から距離を置く未来の仮定を、were toと条件倒置で表します。不可能だと断定する形ではありません。"
      }
    },
    "next": {
      "meaning": "仮に資金提供が途絶えれば、いくつかの研究チームは解散するでしょう。",
      "alternatives": [],
      "formNote": "if を使わず、were を主語の前に置き、to＋動詞の原形を続けて将来を仮定します。",
      "grammar": {
        "label": "実現を距離を置いて仮定する",
        "pattern": "Were + 主語 + to + 原形, would + 原形",
        "note": "現実から距離を置く未来の仮定を、were toと条件倒置で表します。不可能だと断定する形ではありません。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part2",
    "text": "Were the treaty to lapse, the region would face greater uncertainty.",
    "old": {
      "meaning": "仮に条約が失効すれば、その地域はさらに不確実な状況に直面するでしょう。",
      "alternatives": [],
      "formNote": "今後のことを距離を置いて仮定します。条件節は接続詞を省き、助動詞と主語を入れ替え、不定詞を続けます。",
      "grammar": {
        "label": "実現を距離を置いて仮定する",
        "pattern": "Were + 主語 + to + 原形, would + 原形",
        "note": "現実から距離を置く未来の仮定を、were toと条件倒置で表します。不可能だと断定する形ではありません。"
      }
    },
    "next": {
      "meaning": "仮に条約が失効すれば、その地域はさらに不確実な状況に直面するでしょう。",
      "alternatives": [],
      "formNote": "if を使わず、were を主語の前に置き、to＋動詞の原形を続けて将来を仮定します。",
      "grammar": {
        "label": "実現を距離を置いて仮定する",
        "pattern": "Were + 主語 + to + 原形, would + 原形",
        "note": "現実から距離を置く未来の仮定を、were toと条件倒置で表します。不可能だと断定する形ではありません。"
      }
    },
    "promptChanged": true,
    "grammarChanged": false
  },
  {
    "course": "Eiken1Part1",
    "text": "The results were published before the election.",
    "old": {
      "meaning": "結果は選挙前に公表された。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "最初の文は主節もafter節も受け身です。afterがあるため、記録の再調査→無実の証明という順序が分かります。二つ目のuntilは延期が続く区切りを示します。"
      }
    },
    "next": {
      "meaning": "結果は選挙前に公表された。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "were published は過去の受け身です。before the election は、選挙より前という時を示す名詞句です。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part1",
    "text": "The accused person was released after new evidence emerged.",
    "old": {
      "meaning": "新たな証拠が現れた後、容疑をかけられていた人は釈放されました。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "最初の文は主節もafter節も受け身です。afterがあるため、記録の再調査→無実の証明という順序が分かります。二つ目のuntilは延期が続く区切りを示します。"
      }
    },
    "next": {
      "meaning": "新たな証拠が現れた後、容疑をかけられていた人は釈放されました。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "主節は was released という受け身です。after の後ろは、新たな証拠が現れたことを表す能動の文です。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part2",
    "text": "Thousands were displaced when the conflict intensified.",
    "old": {
      "meaning": "紛争が激化し、何千人も住まいを追われた。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "最初の文は主節もafter節も受け身です。afterがあるため、記録の再調査→無実の証明という順序が分かります。二つ目のuntilは延期が続く区切りを示します。"
      }
    },
    "next": {
      "meaning": "紛争が激化し、何千人も住まいを追われた。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "were displaced は住まいを追われたという受け身です。when の節で、そのとき紛争が激化したことを添えます。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part2",
    "text": "The suspect was exonerated after the records were reexamined.",
    "old": {
      "meaning": "記録を再調査した後、容疑者の無実が証明された。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "最初の文は主節もafter節も受け身です。afterがあるため、記録の再調査→無実の証明という順序が分かります。二つ目のuntilは延期が続く区切りを示します。"
      }
    },
    "next": {
      "meaning": "記録を再調査した後、容疑者の無実が証明された。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "主節は was exonerated、after の節は were reexamined という受け身です。再調査の後で無実が証明された順序を表します。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part2",
    "text": "The final decision was postponed until further evidence arrived.",
    "old": {
      "meaning": "最終決定は追加の証拠が届くまで延期された。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "最初の文は主節もafter節も受け身です。afterがあるため、記録の再調査→無実の証明という順序が分かります。二つ目のuntilは延期が続く区切りを示します。"
      }
    },
    "next": {
      "meaning": "最終決定は追加の証拠が届くまで延期された。",
      "alternatives": [],
      "formNote": "受け身",
      "grammar": {
        "label": "受け身＋時を表す節・前置詞句",
        "pattern": "受け身の文 ＋ after / before / when / until ＋ 時の情報",
        "note": "was postponed は過去の受け身です。until の節で、延期が追加の証拠の到着まで続いたことを表します。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part1",
    "text": "The senator who proposed the bill defended its aims.",
    "old": {
      "meaning": "法案を提出した上院議員は、その目的を擁護した。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that protects workersはlawの説明で、文全体の中心はThe law will take effectです。二つ目もthat supported the claimをいったん分けると、The evidence was discreditedという受け身の骨組みが見えます。"
      }
    },
    "next": {
      "meaning": "法案を提出した上院議員は、その目的を擁護した。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "who proposed the bill が senator を説明します。文全体の主語は senator、中心となる動詞は defended です。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part1",
    "text": "The researcher who developed the test received an award.",
    "old": {
      "meaning": "その検査を開発した研究者が賞を受けた。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that protects workersはlawの説明で、文全体の中心はThe law will take effectです。二つ目もthat supported the claimをいったん分けると、The evidence was discreditedという受け身の骨組みが見えます。"
      }
    },
    "next": {
      "meaning": "その検査を開発した研究者が賞を受けた。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "who developed the test が researcher を説明します。文全体では、その研究者が賞を受けたと述べています。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part2",
    "text": "The journalist who exposed the scandal received threats.",
    "old": {
      "meaning": "不祥事を暴いた記者は脅迫を受けた。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that protects workersはlawの説明で、文全体の中心はThe law will take effectです。二つ目もthat supported the claimをいったん分けると、The evidence was discreditedという受け身の骨組みが見えます。"
      }
    },
    "next": {
      "meaning": "不祥事を暴いた記者は脅迫を受けた。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "who exposed the scandal が journalist を説明します。文全体では、その記者が脅迫を受けたと述べています。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part2",
    "text": "The evidence that supported the claim was later discredited.",
    "old": {
      "meaning": "その主張を裏付けた証拠は、後に信用を失った。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that protects workersはlawの説明で、文全体の中心はThe law will take effectです。二つ目もthat supported the claimをいったん分けると、The evidence was discreditedという受け身の骨組みが見えます。"
      }
    },
    "next": {
      "meaning": "その主張を裏付けた証拠は、後に信用を失った。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that supported the claim が evidence を説明します。主節は、その証拠の信用が失われたことを表す受け身です。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part2",
    "text": "The officials who approved the contract faced investigation.",
    "old": {
      "meaning": "契約を承認した職員たちは調査を受けた。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "that protects workersはlawの説明で、文全体の中心はThe law will take effectです。二つ目もthat supported the claimをいったん分けると、The evidence was discreditedという受け身の骨組みが見えます。"
      }
    },
    "next": {
      "meaning": "契約を承認した職員たちは調査を受けた。",
      "alternatives": [],
      "formNote": "関係詞",
      "grammar": {
        "label": "主格の関係代名詞",
        "pattern": "名詞 ＋ who / which / that ＋ 動詞 … ＋ 主節の動詞",
        "note": "who approved the contract が officials を説明します。主節では、その職員たちが調査を受けたと述べています。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  },
  {
    "course": "Eiken1Part2",
    "text": "The findings were challenged by several independent experts.",
    "old": {
      "meaning": "その調査結果には、複数の独立した専門家から異議が唱えられました。",
      "alternatives": [],
      "formNote": "調査結果を主語にした受け身",
      "grammar": {
        "label": "過去の受け身",
        "pattern": "主語 ＋ was / were ＋ 過去分詞（＋ by …）",
        "note": "reportは検証する側ではなく、検証される対象です。by以下は行為をした人や、被害をもたらした原因。主語が複数のvillagesならwereを使います。"
      }
    },
    "next": {
      "meaning": "その調査結果には、複数の独立した専門家から異議が唱えられました。",
      "alternatives": [],
      "formNote": "調査結果を主語にした受け身",
      "grammar": {
        "label": "過去の受け身",
        "pattern": "主語 ＋ was / were ＋ 過去分詞（＋ by …）",
        "note": "were challenged は「異議を唱えられた」という過去の受け身です。by 以下は、異議を唱えた専門家たちを示します。"
      }
    },
    "promptChanged": false,
    "grammarChanged": true
  }
];
const plain=v=>JSON.parse(JSON.stringify(v??null));
const normalize=s=>s.replace(/\r\n/g,'\n');
const priorFile=file=>execFileSync('git',['show',baseline+':'+file],{encoding:'utf8',maxBuffer:8_000_000});
const priorEntries=JSON.parse(priorFile('src/data/level3DisplayReview.json'));
const cache=new Map();
const priorModule=file=>{
  if(cache.has(file))return cache.get(file);
  const module={exports:{}};
  const require=name=>{
    const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(file),name));
    if(resolved==='src/data/level3DisplayReview.json')return priorEntries;
    if(['src/data/level3DisplayReview','src/data/translationBattlePrompts'].includes(resolved))return priorModule(resolved+'.ts');
    return load(resolved);
  };
  vm.runInNewContext(ts.transpileModule(priorFile(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module,exports:module.exports,require});
  cache.set(file,module.exports);return module.exports;
};
const {QUESTIONS}=load('src/data/questions.ts');
const {getTranslationBattlePrompt:prompt}=load('src/data/translationBattlePrompts.ts');
const {getQuestionMeaning:meaning}=load('src/data/questionMeaning.ts');
const {getQuestionGrammarPoint:grammar}=load('src/data/questionGrammarPoints.ts');
const {getLevel3DisplayReview:review}=load('src/data/level3DisplayReview.ts');
const previous=priorModule('src/data/translationBattlePrompts.ts');
const previousMeaning=priorModule('src/data/questionMeaning.ts').getQuestionMeaning;
const previousGrammar=priorModule('src/data/questionGrammarPoints.ts').getQuestionGrammarPoint;
const expected=new Map(approved.map(e=>[e.course+':'+e.text,e]));
const entries=JSON.parse(fs.readFileSync('src/data/level3DisplayReview.json','utf8'));
assert.equal(approved.length,94);assert.equal(expected.size,94);
assert.equal(entries.length,115);assert.deepEqual(entries.slice(0,21),priorEntries,'Previously released Grade 4 review retained exactly');
assert.equal(new Set(entries.map(e=>JSON.stringify([e.course,e.text,e.translation,e.exampleEn]))).size,115);
assert.equal(createHash('sha256').update(JSON.stringify(QUESTIONS)).digest('hex'),'8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1');
let checked=0,changed=0,promptsChanged=0,pointsChanged=0;
for(const[course,levels]of Object.entries(QUESTIONS))for(const[level,qs]of Object.entries(levels))for(const q of qs){
  const n=Number(level),before=JSON.stringify(q),e=n===3?expected.get(course+':'+q.text):undefined;
  const oldPrompt=previous.getTranslationBattlePrompt(q,course,n),oldGrammar=previousGrammar(course,n,q),oldMeaning=previousMeaning(q,course);
  const current=prompt(q,course,n),point=grammar(course,n,q);
  if(e){
    const old={meaning:oldMeaning,alternatives:oldPrompt?.alternatives??[],formNote:oldPrompt?.formNote??'',grammar:plain(oldGrammar)};
    assert.deepEqual(plain(old),e.old,'Exact reviewed before display: '+course+':'+q.text);
    const nextPrompt=plain(oldPrompt);
    if(e.promptChanged){assert.ok(oldPrompt);for(const k of ['meaning','alternatives','formNote'])nextPrompt[k]=e.next[k];promptsChanged++;}
    assert.deepEqual(plain(current),nextPrompt,q.text);
    assert.equal(meaning(q,course),e.next.meaning);
    assert.deepEqual(plain(point),e.next.grammar,q.text);
    if(e.grammarChanged)pointsChanged++;
    const record=review(course,n,q);assert.ok(record);
    const delta={};for(const k of ['meaning','alternatives','formNote'])if(JSON.stringify(e.old[k])!==JSON.stringify(e.next[k]))delta[k]=e.next[k];
    assert.deepEqual(plain(record.prompt??{}),delta);
    assert.deepEqual(plain(record.grammar??null),e.grammarChanged?e.next.grammar:null);
    changed++;
  }else{
    assert.deepEqual(plain(current),plain(oldPrompt),'Out-of-scope prompt '+course+':'+level+':'+q.text);
    assert.equal(meaning(q,course),oldMeaning,'Out-of-scope meaning '+course+':'+level+':'+q.text);
    assert.deepEqual(plain(point),plain(oldGrammar),'Out-of-scope note '+course+':'+level+':'+q.text);
  }
  assert.deepEqual(plain(prompt(JSON.parse(before),course,n)),plain(current),'Imported question prompt');
  assert.deepEqual(plain(grammar(course,n,{text:q.text})),plain(point),'Historical text-only grammar lookup');
  assert.equal(JSON.stringify(q),before);checked++;
}
assert.equal(checked,7650);assert.equal(changed,94);assert.equal(promptsChanged,66);assert.equal(pointsChanged,35);
for(const e of entries.slice(21)){
  assert.ok(expected.has(e.course+':'+e.text));
  assert.equal(QUESTIONS[e.course][3].filter(q=>q.text===e.text&&q.translation===e.translation&&(q.exampleEn??'')===e.exampleEn).length,1);
  for(const level of[1,2])assert.equal(review(e.course,level,e),undefined);
  assert.equal(review(e.course,3,{...e,translation:e.translation+' different'}),undefined);
  assert.equal(review(e.course,3,{...e,exampleEn:e.exampleEn+' different'}),undefined);
}
for(const e of JSON.parse(priorFile('src/data/translationBattlePrompts.json'))){
  const additional=expected.get(e.course+':'+e.text);
  const old=plain(previous.getTranslationBattlePrompt(e,e.course,e.level));
  const changes=e.level===3&&additional?.promptChanged?review(e.course,e.level,e)?.prompt:undefined;
  assert.deepEqual(plain(prompt(e,e.course,e.level)),changes?{...old,...changes}:old,'Archived/saved prompt');
}
for(const file of ['src/App.tsx','src/learningProgress.ts','src/data/questions.ts','src/data/questionMeaning.ts','src/data/questionGrammarPoints.ts','src/data/translationBattlePrompts.ts','src/data/translationBattlePrompts.json','src/data/grade5Level3DisplayReview.json','src/data/grade4GrammarGuide.ts','src/data/grade5GrammarGuide.ts','src/monsterProfiles.json'])assert.equal(normalize(fs.readFileSync(file,'utf8')),normalize(priorFile(file)),file+' retained');
for(const file of fs.readdirSync('src/data').filter(f=>/Grammar(Guide|Assignments|Curriculum|Point)/.test(f)&&/\.(json|ts)$/.test(f)))assert.equal(normalize(fs.readFileSync('src/data/'+file,'utf8')),normalize(priorFile('src/data/'+file)),'Guide/assignment identity retained: '+file);
console.log('PASS: exactly 94 approved upper Level 3 reviews (66 prompts, 35 notes, 7 overlaps); all 7,650 original/imported identities, 21 released Grade 4 reviews, other displays, saved lookups, guide IDs, gameplay and learning records retained.');
