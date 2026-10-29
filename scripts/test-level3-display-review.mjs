
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';import ts from 'typescript';import{load}from'./lib/load-typescript-data.mjs';
const baseline='cd873b6903a8d1ed57e001a5e665a35a543dfe8a';
const approved=[
  {
    "course": "Eiken4",
    "text": "There is nobody in the room.",
    "old": {
      "meaning": "部屋には誰もいません（存在を表す文）。",
      "alternatives": [
        {
          "text": "no one",
          "note": "誰も〜ない"
        }
      ],
      "formNote": "存在を表す文で、だれもいないことを伝えます。上の別表現とは別の代名詞で練習します。別表現も意味は同じです。短縮しない形で。",
      "grammar": {
        "label": "存在表現",
        "note": "There is・wasで人や物が「いる・ある」と伝えます。",
        "pattern": "There + be動詞 + 名詞"
      }
    },
    "next": {
      "meaning": "部屋には誰もいません（存在を表す文）。",
      "alternatives": [
        {
          "text": "no one",
          "note": "誰も〜ない"
        }
      ],
      "formNote": "nobody を使い、短縮しない形で表します。",
      "grammar": {
        "label": "存在表現",
        "note": "There is・wasで人や物が「いる・ある」と伝えます。",
        "pattern": "There + be動詞 + 名詞"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "There was no one at the bus stop.",
    "old": {
      "meaning": "バス停に誰もいませんでした（存在を表す文）。",
      "alternatives": [
        {
          "text": "nobody",
          "note": "誰も〜ない"
        }
      ],
      "formNote": "過去の存在を表す文で、だれもいなかったことを伝えます。上の別表現とは別の代名詞で練習します。別表現も意味は同じです。短縮しない形で。",
      "grammar": {
        "label": "存在表現",
        "note": "There is・wasで人や物が「いる・ある」と伝えます。",
        "pattern": "There + be動詞 + 名詞"
      }
    },
    "next": {
      "meaning": "バス停に誰もいませんでした（存在を表す文）。",
      "alternatives": [
        {
          "text": "nobody",
          "note": "誰も〜ない"
        }
      ],
      "formNote": "no one を使い、短縮しない形で表します。",
      "grammar": {
        "label": "存在表現",
        "note": "There is・wasで人や物が「いる・ある」と伝えます。",
        "pattern": "There + be動詞 + 名詞"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Everyone in my class likes music.",
    "old": {
      "meaning": "私のクラスの全員が音楽を好きです。",
      "alternatives": [
        {
          "text": "everybody",
          "note": "全員・みんな"
        }
      ],
      "formNote": "「みんな」を表す代名詞を主語にします。上の別表現とは別の代名詞で練習します。どちらも動詞は単数扱いです。",
      "grammar": {
        "label": "代名詞",
        "note": "人や物を特定しない代名詞を使った表現です。",
        "pattern": "some/any/every/no + one/thing"
      }
    },
    "next": {
      "meaning": "私のクラスの全員が音楽を好きです。",
      "alternatives": [
        {
          "text": "everybody",
          "note": "全員・みんな"
        }
      ],
      "formNote": "everyone を主語にします。動詞には s を付けます。",
      "grammar": {
        "label": "代名詞",
        "note": "人や物を特定しない代名詞を使った表現です。",
        "pattern": "some/any/every/no + one/thing"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Do you know anyone in London?",
    "old": {
      "meaning": "あなたはロンドンに知り合いがいますか？",
      "alternatives": [
        {
          "text": "anybody",
          "note": "だれか"
        }
      ],
      "formNote": "「だれか」を表す代名詞で尋ねます。上の別表現とは別の代名詞で練習します。別表現も自然です。",
      "grammar": {
        "label": "代名詞",
        "note": "人や物を特定しない代名詞を使った表現です。",
        "pattern": "some/any/every/no + one/thing"
      }
    },
    "next": {
      "meaning": "あなたはロンドンに知り合いがいますか？",
      "alternatives": [
        {
          "text": "anybody",
          "note": "だれか"
        }
      ],
      "formNote": "anyone を使って尋ねます。",
      "grammar": {
        "label": "代名詞",
        "note": "人や物を特定しない代名詞を使った表現です。",
        "pattern": "some/any/every/no + one/thing"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Nobody in my family likes coffee.",
    "old": {
      "meaning": "家族の誰もコーヒーが好きではありません。",
      "alternatives": [
        {
          "text": "no one",
          "note": "誰も〜ない"
        }
      ],
      "formNote": "「だれも〜ない」を表す代名詞を主語にします。上の別表現とは別の代名詞で練習します。別表現も意味は同じです。",
      "grammar": {
        "label": "代名詞",
        "note": "人や物を特定しない代名詞を使った表現です。",
        "pattern": "some/any/every/no + one/thing"
      }
    },
    "next": {
      "meaning": "家族の誰もコーヒーが好きではありません。",
      "alternatives": [
        {
          "text": "no one",
          "note": "誰も〜ない"
        }
      ],
      "formNote": "nobody を主語にします。否定の not は重ねません。",
      "grammar": {
        "label": "代名詞",
        "note": "人や物を特定しない代名詞を使った表現です。",
        "pattern": "some/any/every/no + one/thing"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Does anyone know the answer?",
    "old": {
      "meaning": "だれか答えを知っていますか？",
      "alternatives": [
        {
          "text": "anybody",
          "note": "だれか"
        }
      ],
      "formNote": "「だれか」を表す代名詞で尋ねます。上の別表現とは別の代名詞で練習します。別表現も自然です。",
      "grammar": {
        "label": "代名詞",
        "note": "人や物を特定しない代名詞を使った表現です。",
        "pattern": "some/any/every/no + one/thing"
      }
    },
    "next": {
      "meaning": "だれか答えを知っていますか？",
      "alternatives": [
        {
          "text": "anybody",
          "note": "だれか"
        }
      ],
      "formNote": "anyone を使います。does を使うので、動詞はもとの形にします。",
      "grammar": {
        "label": "代名詞",
        "note": "人や物を特定しない代名詞を使った表現です。",
        "pattern": "some/any/every/no + one/thing"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Can I have some more water?",
    "old": {
      "meaning": "水をもう少しいただいてもいいですか（許可を求める）。",
      "alternatives": [
        {
          "text": "May I have",
          "note": "丁寧に求める別の形"
        },
        {
          "text": "Could I have",
          "note": "丁寧に求める別の形"
        }
      ],
      "formNote": "上の別表現も自然な英語です。この問題では、そこに表示した助動詞以外の形で、許可を求める練習をします。",
      "grammar": {
        "label": "助動詞",
        "note": "Can・Could・Mayを先頭に置いて許可や依頼を表します。",
        "pattern": "Can/Could/May + 主語 + 動詞の原形?"
      }
    },
    "next": {
      "meaning": "水をもう少しいただけますか。",
      "alternatives": [
        {
          "text": "May I have",
          "note": "丁寧に求める別の形"
        },
        {
          "text": "Could I have",
          "note": "丁寧に求める別の形"
        }
      ],
      "formNote": "Can I have ...? を使って、飲み物をお願いします。",
      "grammar": {
        "label": "助動詞",
        "note": "Can・Could・Mayを先頭に置いて許可や依頼を表します。",
        "pattern": "Can/Could/May + 主語 + 動詞の原形?"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "May I use your dictionary?",
    "old": {
      "meaning": "あなたの辞書を使わせていただいてもよいですか（丁寧に許可を求める）。",
      "alternatives": [
        {
          "text": "Can I",
          "note": "許可を求める別の形"
        },
        {
          "text": "Could I",
          "note": "丁寧に許可を求める別の形"
        }
      ],
      "formNote": "上の別表現も自然な英語です。この問題では、そこに表示した助動詞以外の形で、許可を求める練習をします。",
      "grammar": {
        "label": "助動詞",
        "note": "Can・Could・Mayを先頭に置いて許可や依頼を表します。",
        "pattern": "Can/Could/May + 主語 + 動詞の原形?"
      }
    },
    "next": {
      "meaning": "あなたの辞書を使わせていただいてもよいですか（丁寧に許可を求める）。",
      "alternatives": [
        {
          "text": "Can I",
          "note": "許可を求める別の形"
        },
        {
          "text": "Could I",
          "note": "丁寧に許可を求める別の形"
        }
      ],
      "formNote": "May I ...? を使って、丁寧に許可を求めます。",
      "grammar": {
        "label": "助動詞",
        "note": "Can・Could・Mayを先頭に置いて許可や依頼を表します。",
        "pattern": "Can/Could/May + 主語 + 動詞の原形?"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Could I borrow your umbrella today?",
    "old": {
      "meaning": "今日あなたの傘をお借りしてもよいですか（丁寧に許可を求める）。",
      "alternatives": [
        {
          "text": "Can I",
          "note": "許可を求める別の形"
        },
        {
          "text": "May I",
          "note": "丁寧に許可を求める別の形"
        }
      ],
      "formNote": "上の別表現も自然な英語です。この問題では、そこに表示した助動詞以外の形で、許可を求める練習をします。",
      "grammar": {
        "label": "助動詞",
        "note": "Can・Could・Mayを先頭に置いて許可や依頼を表します。",
        "pattern": "Can/Could/May + 主語 + 動詞の原形?"
      }
    },
    "next": {
      "meaning": "今日あなたの傘をお借りしてもよいですか（丁寧に許可を求める）。",
      "alternatives": [
        {
          "text": "Can I",
          "note": "許可を求める別の形"
        },
        {
          "text": "May I",
          "note": "丁寧に許可を求める別の形"
        }
      ],
      "formNote": "Could I ...? を使って、丁寧に許可を求めます。",
      "grammar": {
        "label": "助動詞",
        "note": "Can・Could・Mayを先頭に置いて許可や依頼を表します。",
        "pattern": "Can/Could/May + 主語 + 動詞の原形?"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "May I ask you a question?",
    "old": {
      "meaning": "あなたに質問してもよろしいですか（丁寧に許可を求める）。",
      "alternatives": [
        {
          "text": "Can I",
          "note": "許可を求める別の形"
        },
        {
          "text": "Could I",
          "note": "丁寧に許可を求める別の形"
        }
      ],
      "formNote": "上の別表現も自然な英語です。この問題では、そこに表示した助動詞以外の形で、許可を求める練習をします。",
      "grammar": {
        "label": "助動詞",
        "note": "Can・Could・Mayを先頭に置いて許可や依頼を表します。",
        "pattern": "Can/Could/May + 主語 + 動詞の原形?"
      }
    },
    "next": {
      "meaning": "あなたに質問してもよろしいですか（丁寧に許可を求める）。",
      "alternatives": [
        {
          "text": "Can I",
          "note": "許可を求める別の形"
        },
        {
          "text": "Could I",
          "note": "丁寧に許可を求める別の形"
        }
      ],
      "formNote": "May I ...? を使って、丁寧に許可を求めます。",
      "grammar": {
        "label": "助動詞",
        "note": "Can・Could・Mayを先頭に置いて許可や依頼を表します。",
        "pattern": "Can/Could/May + 主語 + 動詞の原形?"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Could you show me your textbook?",
    "old": {
      "meaning": "私にあなたの教科書を見せていただけますか。",
      "alternatives": [
        {
          "text": "Can you",
          "note": "依頼する別の形"
        },
        {
          "text": "Would you",
          "note": "丁寧に依頼する別の形"
        }
      ],
      "formNote": "上の別表現も自然な英語です。この問題では、そこに表示した助動詞以外の形で、丁寧に依頼する練習をします。",
      "grammar": {
        "label": "助動詞",
        "note": "助動詞を先頭に置いて相手に丁寧に尋ねています。",
        "pattern": "Can/Could/Would + you + 動詞の原形?"
      }
    },
    "next": {
      "meaning": "私にあなたの教科書を見せていただけますか。",
      "alternatives": [
        {
          "text": "Can you",
          "note": "依頼する別の形"
        },
        {
          "text": "Would you",
          "note": "丁寧に依頼する別の形"
        }
      ],
      "formNote": "Could you ...? を使って、丁寧に頼みます。",
      "grammar": {
        "label": "助動詞",
        "note": "助動詞を先頭に置いて相手に丁寧に尋ねています。",
        "pattern": "Can/Could/Would + you + 動詞の原形?"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Could you open the door?",
    "old": {
      "meaning": "ドアを開けていただけますか（丁寧な依頼）。",
      "alternatives": [
        {
          "text": "Can you",
          "note": "依頼する別の形"
        },
        {
          "text": "Would you",
          "note": "丁寧に依頼する別の形"
        }
      ],
      "formNote": "上の別表現も自然な英語です。この問題では、そこに表示した助動詞以外の形で、丁寧に依頼する練習をします。",
      "grammar": {
        "label": "助動詞",
        "note": "助動詞を先頭に置いて相手に丁寧に尋ねています。",
        "pattern": "Can/Could/Would + you + 動詞の原形?"
      }
    },
    "next": {
      "meaning": "ドアを開けていただけますか（丁寧な依頼）。",
      "alternatives": [
        {
          "text": "Can you",
          "note": "依頼する別の形"
        },
        {
          "text": "Would you",
          "note": "丁寧に依頼する別の形"
        }
      ],
      "formNote": "Could you ...? を使って、丁寧に頼みます。",
      "grammar": {
        "label": "助動詞",
        "note": "助動詞を先頭に置いて相手に丁寧に尋ねています。",
        "pattern": "Can/Could/Would + you + 動詞の原形?"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Can you lend me some money?",
    "old": {
      "meaning": "私に少しお金を貸してくれますか（依頼）。",
      "alternatives": [
        {
          "text": "Could you",
          "note": "丁寧に依頼する別の形"
        },
        {
          "text": "Would you",
          "note": "丁寧に依頼する別の形"
        }
      ],
      "formNote": "上の別表現も自然な英語です。この問題では、そこに表示した助動詞以外の形で、丁寧に依頼する練習をします。",
      "grammar": {
        "label": "助動詞",
        "note": "助動詞を先頭に置いて相手に丁寧に尋ねています。",
        "pattern": "Can/Could/Would + you + 動詞の原形?"
      }
    },
    "next": {
      "meaning": "私に少しお金を貸してくれますか（依頼）。",
      "alternatives": [
        {
          "text": "Could you",
          "note": "丁寧に依頼する別の形"
        },
        {
          "text": "Would you",
          "note": "丁寧に依頼する別の形"
        }
      ],
      "formNote": "Can you ...? を使って、頼みます。",
      "grammar": {
        "label": "助動詞",
        "note": "助動詞を先頭に置いて相手に丁寧に尋ねています。",
        "pattern": "Can/Could/Would + you + 動詞の原形?"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Let's go and see a movie.",
    "old": {
      "meaning": "映画を見に行きましょう（自分も含む誘い）。",
      "alternatives": [
        {
          "text": "Shall we",
          "note": "一緒に〜しましょうか"
        },
        {
          "text": "watch a movie",
          "note": "映画を見る"
        }
      ],
      "formNote": "",
      "grammar": {
        "label": "提案表現",
        "note": "Let usの短縮形Let'sで「一緒に～しよう」と誘います。",
        "pattern": "Let's + 動詞の原形"
      }
    },
    "next": {
      "meaning": "映画を見に行きましょう（自分も含む誘い）。",
      "alternatives": [
        {
          "text": "Shall we ...?",
          "note": "一緒に〜しましょうか"
        },
        {
          "text": "watch a movie",
          "note": "映画を見る"
        }
      ],
      "formNote": "",
      "grammar": {
        "label": "提案表現",
        "note": "Let usの短縮形Let'sで「一緒に～しよう」と誘います。",
        "pattern": "Let's + 動詞の原形"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Let's have lunch.",
    "old": {
      "meaning": "昼食にしましょう（自分も含む誘い）。",
      "alternatives": [
        {
          "text": "Shall we",
          "note": "一緒に〜しましょうか"
        },
        {
          "text": "eat lunch",
          "note": "昼食を食べる"
        }
      ],
      "formNote": "",
      "grammar": {
        "label": "提案表現",
        "note": "Let usの短縮形Let'sで「一緒に～しよう」と誘います。",
        "pattern": "Let's + 動詞の原形"
      }
    },
    "next": {
      "meaning": "昼食にしましょう（自分も含む誘い）。",
      "alternatives": [
        {
          "text": "Shall we ...?",
          "note": "一緒に〜しましょうか"
        },
        {
          "text": "eat lunch",
          "note": "昼食を食べる"
        }
      ],
      "formNote": "",
      "grammar": {
        "label": "提案表現",
        "note": "Let usの短縮形Let'sで「一緒に～しよう」と誘います。",
        "pattern": "Let's + 動詞の原形"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "Shall we go out for dinner tomorrow?",
    "old": {
      "meaning": "明日、一緒に夕食を食べに出かけませんか（相談する誘い）。",
      "alternatives": [
        {
          "text": "Let's",
          "note": "一緒に〜しよう"
        }
      ],
      "formNote": "",
      "grammar": {
        "label": "提案表現",
        "note": "Shall Iは申し出、Shall weは提案を表します。",
        "pattern": "Shall + I/we + 動詞の原形?"
      }
    },
    "next": {
      "meaning": "明日、一緒に夕食を食べに出かけませんか（相談する誘い）。",
      "alternatives": [
        {
          "text": "Let's ...",
          "note": "一緒に〜しよう"
        }
      ],
      "formNote": "",
      "grammar": {
        "label": "提案表現",
        "note": "Shall Iは申し出、Shall weは提案を表します。",
        "pattern": "Shall + I/we + 動詞の原形?"
      }
    },
    "area": "prompt"
  },
  {
    "course": "Eiken4",
    "text": "What happened to you?",
    "old": {
      "meaning": "あなたの身に何が起こったのですか？",
      "alternatives": [],
      "formNote": "",
      "grammar": {
        "label": "5W1H",
        "note": "疑問詞の後ろを疑問文の語順にします。",
        "pattern": "疑問詞 + be動詞/do/does/did + 主語 ...?"
      }
    },
    "next": {
      "meaning": "あなたの身に何が起こったのですか？",
      "alternatives": [],
      "formNote": "",
      "grammar": {
        "label": "主語を尋ねる疑問文",
        "note": "what が「何が」に当たり、主語になります。did を足さず、happened を続けます。",
        "pattern": "What + happened + to + 人?"
      }
    },
    "area": "result"
  },
  {
    "course": "Eiken4",
    "text": "What's wrong?",
    "old": {
      "meaning": "どうしましたか（不調を尋ねる・短縮形で）。",
      "alternatives": [],
      "formNote": "",
      "grammar": {
        "label": "5W1H",
        "note": "疑問詞の後ろを疑問文の語順にします。",
        "pattern": "疑問詞 + be動詞/do/does/did + 主語 ...?"
      }
    },
    "next": {
      "meaning": "どうしましたか（不調を尋ねる・短縮形で）。",
      "alternatives": [],
      "formNote": "",
      "grammar": {
        "label": "調子を尋ねる表現",
        "note": "「どうしたの？」「何か問題があるの？」と尋ねます。What's は What is の短い形です。",
        "pattern": "What is wrong? → What's wrong?"
      }
    },
    "area": "result"
  },
  {
    "course": "Eiken4",
    "text": "I'd like to see a movie.",
    "old": {
      "meaning": "映画を見たいです（丁寧な希望・短縮形で）。",
      "alternatives": [
        {
          "text": "want to",
          "note": "〜したい"
        },
        {
          "text": "watch a film",
          "note": "映画を見る"
        }
      ],
      "formNote": "",
      "grammar": {
        "label": "不定詞",
        "note": "to＋動詞の原形が目的や名詞の説明になります。",
        "pattern": "to + 動詞の原形"
      }
    },
    "next": {
      "meaning": "映画を見たいです（丁寧な希望・短縮形で）。",
      "alternatives": [
        {
          "text": "want to",
          "note": "〜したい"
        },
        {
          "text": "watch a film",
          "note": "映画を見る"
        }
      ],
      "formNote": "",
      "grammar": {
        "label": "丁寧な希望",
        "note": "would like to＋動詞で「〜したい」と丁寧に希望を伝えます。I'd は I would の短い形です。",
        "pattern": "I would like to + 動詞の原形"
      }
    },
    "area": "result"
  },
  {
    "course": "Eiken4",
    "text": "I want something cold to drink.",
    "old": {
      "meaning": "私は何か冷たい飲み物が欲しいです。",
      "alternatives": [],
      "formNote": "",
      "grammar": {
        "label": "不定詞",
        "note": "to＋動詞の原形で目的・希望・理由などを表します。",
        "pattern": "to + 動詞の原形"
      }
    },
    "next": {
      "meaning": "私は何か冷たい飲み物が欲しいです。",
      "alternatives": [],
      "formNote": "",
      "grammar": {
        "label": "不定詞：ものの説明",
        "note": "to drink が something cold を説明し、「何か冷たい飲み物」を表します。",
        "pattern": "something + 形容詞 + to + 動詞の原形"
      }
    },
    "area": "result"
  },
  {
    "course": "Eiken4",
    "text": "I need something warm to drink.",
    "old": {
      "meaning": "私は何か温かい飲み物が必要です。",
      "alternatives": [],
      "formNote": "",
      "grammar": {
        "label": "不定詞",
        "note": "to＋動詞の原形で目的・希望・理由などを表します。",
        "pattern": "to + 動詞の原形"
      }
    },
    "next": {
      "meaning": "私は何か温かい飲み物が必要です。",
      "alternatives": [],
      "formNote": "",
      "grammar": {
        "label": "不定詞：ものの説明",
        "note": "to drink が something warm を説明し、「何か温かい飲み物」を表します。",
        "pattern": "something + 形容詞 + to + 動詞の原形"
      }
    },
    "area": "result"
  }
];
const plain=v=>JSON.parse(JSON.stringify(v??null));
const priorFile=file=>execFileSync('git',['show',baseline+':'+file],{encoding:'utf8',maxBuffer:8_000_000});
const priorModule=file=>{const module={exports:{}};vm.runInNewContext(ts.transpileModule(priorFile(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:name=>load(path.posix.join(path.posix.dirname(file),name))});return module.exports;};
const {QUESTIONS}=load('src/data/questions.ts'),{getTranslationBattlePrompt:prompt}=load('src/data/translationBattlePrompts.ts'),{getQuestionMeaning:meaning}=load('src/data/questionMeaning.ts'),{getQuestionGrammarPoint:grammar}=load('src/data/questionGrammarPoints.ts');
const {getLevel3DisplayReview:review,getLevel3ReviewedGrammarPoint:grammarReview}=load('src/data/level3DisplayReview.ts');
const prior=priorModule('src/data/translationBattlePrompts.ts'),priorGrammar=priorModule('src/data/questionGrammarPoints.ts');
const expected=new Map(approved.map(e=>[e.course+':'+e.text,e]));
const entries=JSON.parse(fs.readFileSync('src/data/level3DisplayReview.json','utf8'));
assert.equal(entries.length,21);assert.equal(expected.size,21);
assert.equal(createHash('sha256').update(JSON.stringify(QUESTIONS)).digest('hex'),'8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1');
let checked=0,changed=0,promptsChanged=0,pointsChanged=0;
for(const[course,levels]of Object.entries(QUESTIONS))for(const[level,qs]of Object.entries(levels))for(const q of qs){
const n=Number(level),before=JSON.stringify(q),e=n===3?expected.get(course+':'+q.text):undefined,oldPrompt=prior.getTranslationBattlePrompt(q,course,n),oldGrammar=priorGrammar.getQuestionGrammarPoint(course,n,q);
const current=prompt(q,course,n),point=grammar(course,n,q);
if(e){
const old={meaning:oldPrompt?.meaning??meaning(q,course),alternatives:oldPrompt?.alternatives??[],formNote:oldPrompt?.formNote??'',grammar:plain(oldGrammar)};
assert.deepEqual(plain(old),e.old,'Frozen approved before: '+q.text);
const desiredPrompt=plain(oldPrompt);
if(e.area==='prompt'){
assert.ok(oldPrompt);for(const k of ['meaning','alternatives','formNote'])desiredPrompt[k]=e.next[k];promptsChanged++;
}else pointsChanged++;
assert.deepEqual(plain(current),desiredPrompt,q.text);
assert.equal(meaning(q,course),e.next.meaning);
assert.deepEqual(plain(point),e.next.grammar);
assert.ok(review(course,n,q));changed++;
}else{
assert.deepEqual(plain(current),plain(oldPrompt),'Other prompt '+course+':'+n+':'+q.text);
assert.deepEqual(plain(point),plain(oldGrammar),'Other note '+course+':'+n+':'+q.text);
assert.equal(review(course,n,q),undefined);
}
assert.deepEqual(plain(prompt(JSON.parse(before),course,n)),plain(current));assert.deepEqual(plain(grammar(course,n,{text:q.text})),plain(point),'Historical text-only grammar lookup');
assert.equal(JSON.stringify(q),before);checked++;
}
assert.equal(checked,7650);assert.equal(changed,21);assert.equal(promptsChanged,16);assert.equal(pointsChanged,5);
for(const e of entries){
const approved=expected.get(e.course+':'+e.text);assert.ok(approved);
assert.equal(QUESTIONS[e.course][3].filter(q=>q.text===e.text&&q.translation===e.translation&&(q.exampleEn??'')===e.exampleEn).length,1);
const delta={};for(const k of ['meaning','alternatives','formNote'])if(JSON.stringify(approved.old[k])!==JSON.stringify(approved.next[k]))delta[k]=approved.next[k];
assert.deepEqual(e.prompt??{},delta);assert.deepEqual(e.grammar??null,approved.area==='result'?approved.next.grammar:null);
for(const [course,level,q]of [['Eiken3',3,e],['Eiken4',1,e],['Eiken4',2,e],['Eiken4',3,{...e,translation:'different'}],['Eiken4',3,{...e,exampleEn:'different'}]])assert.equal(review(course,level,q),undefined);
for(const level of[1,2])assert.equal(grammarReview(e.course,level,e.text),undefined);
}
const archived=JSON.parse(priorFile('src/data/translationBattlePrompts.json'));
for(const q of archived){const change=review(q.course,q.level,q)?.prompt;assert.deepEqual(plain(prompt(q,q.course,q.level)),{...plain(prior.getTranslationBattlePrompt(q,q.course,q.level)),...change});}
for(const file of ['src/App.tsx','src/learningProgress.ts','src/data/questions.ts','src/data/questionMeaning.ts','src/data/translationBattlePrompts.json','src/data/grade4GrammarGuide.ts','src/data/grade4GrammarAssignments.ts','src/data/grade5GrammarGuide.ts','src/data/questionSets/eiken/grade4.json','src/data/questionSets/eiken/grade4Foundations.json','src/monsterProfiles.json'])assert.equal(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),priorFile(file).replace(/\r\n/g,'\n'),file+' retained');
console.log('PASS: 21 approved Grade 4 Level 3 reviews (16 prompts, 5 result notes); all 7,650 identities, other displays, archived lookups, guide IDs, scoring and progress retained.');
