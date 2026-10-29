
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {load} from './lib/load-typescript-data.mjs';

const baseline='5f1af4e7830924ef44d9ff2ae09f1a0c309537d8';
const approved=[
  {
    "course": "Eiken5",
    "text": "twice a month",
    "labels": [
      "two times a month（月に2回）"
    ],
    "raw": [
      "two times a month"
    ],
    "note": null,
    "previous": [
      "monthly"
    ]
  },
  {
    "course": "Eiken5",
    "text": "help my mother",
    "labels": [
      "help my mom（自分のお母さんを手伝う）"
    ],
    "raw": [
      "help my mom"
    ],
    "note": null,
    "previous": [
      "assist mother"
    ]
  },
  {
    "course": "Eiken5",
    "text": "play the piano",
    "labels": [],
    "raw": [],
    "note": "playは楽器を演奏するときにも使います。",
    "previous": [
      "perform piano"
    ]
  },
  {
    "course": "Eiken5",
    "text": "read a book",
    "labels": [],
    "raw": [],
    "note": null,
    "previous": [
      "look at words"
    ]
  },
  {
    "course": "Eiken5",
    "text": "get up",
    "labels": [
      "wake up（目を覚ます）"
    ],
    "raw": [
      "wake up"
    ],
    "note": null,
    "previous": [
      "wake up"
    ]
  },
  {
    "course": "Eiken5",
    "text": "wake up",
    "labels": [
      "get up（起きる）"
    ],
    "raw": [
      "get up"
    ],
    "note": null,
    "previous": [
      "get up"
    ]
  },
  {
    "course": "Eiken5",
    "text": "listen to",
    "labels": [
      "hear（聞こえる・聞く）"
    ],
    "raw": [
      "hear"
    ],
    "note": null,
    "previous": [
      "hear"
    ]
  },
  {
    "course": "Eiken5",
    "text": "listen to music",
    "labels": [
      "hear music（音楽が聞こえる）"
    ],
    "raw": [
      "hear music"
    ],
    "note": null,
    "previous": [
      "hear music"
    ]
  },
  {
    "course": "Eiken5",
    "text": "go to bed",
    "labels": [
      "sleep（眠る）"
    ],
    "raw": [
      "sleep"
    ],
    "note": null,
    "previous": [
      "sleep"
    ]
  },
  {
    "course": "Eiken5",
    "text": "all day",
    "labels": [
      "the whole day（一日中）"
    ],
    "raw": [
      "the whole day"
    ],
    "note": null,
    "previous": [
      "whole day"
    ]
  },
  {
    "course": "Eiken5",
    "text": "all night",
    "labels": [
      "the whole night（一晩中）"
    ],
    "raw": [
      "the whole night"
    ],
    "note": null,
    "previous": [
      "whole night"
    ]
  },
  {
    "course": "Eiken4",
    "text": "all day long",
    "labels": [
      "the whole day（一日中）"
    ],
    "raw": [
      "the whole day"
    ],
    "note": null,
    "previous": [
      "whole day"
    ]
  },
  {
    "course": "Eiken4",
    "text": "last week",
    "labels": [
      "the previous week（その前の週）"
    ],
    "raw": [
      "the previous week"
    ],
    "note": null,
    "previous": [
      "previous week"
    ]
  },
  {
    "course": "Eiken4",
    "text": "on the first day",
    "labels": [
      "on day one（初日に）"
    ],
    "raw": [
      "on day one"
    ],
    "note": null,
    "previous": [
      "day one"
    ]
  },
  {
    "course": "Eiken4",
    "text": "feel like",
    "labels": [
      "want to（〜したい・後ろは動詞の原形）"
    ],
    "raw": [
      "want to"
    ],
    "note": null,
    "previous": []
  },
  {
    "course": "Eiken4",
    "text": "belong to",
    "labels": [
      "be owned by（〜のものである）"
    ],
    "raw": [
      "be owned by"
    ],
    "note": null,
    "previous": [
      "be owned by"
    ]
  },
  {
    "course": "Eiken3",
    "text": "change one's mind",
    "labels": [
      "reconsider（考え直す）"
    ],
    "raw": [
      "reconsider"
    ],
    "note": null,
    "previous": [
      "reconsider"
    ]
  },
  {
    "course": "Eiken3",
    "text": "depend on",
    "labels": [
      "rely on（〜を頼る）",
      "hinge on（〜次第である）"
    ],
    "raw": [
      "rely on",
      "hinge on"
    ],
    "note": null,
    "previous": [
      "rely on",
      "hinge on"
    ]
  },
  {
    "course": "Eiken3",
    "text": "on sale",
    "labels": [
      "at a reduced price（値下げした価格で）",
      "for sale（販売中の）"
    ],
    "raw": [
      "at a reduced price",
      "for sale"
    ],
    "note": null,
    "previous": [
      "at a reduced price"
    ]
  },
  {
    "course": "Eiken3",
    "text": "be sick in bed",
    "labels": [
      "be bedridden（病気などでベッドから起きられない）"
    ],
    "raw": [
      "be bedridden"
    ],
    "note": null,
    "previous": [
      "be bedridden"
    ]
  },
  {
    "course": "EikenPre2",
    "text": "come out",
    "labels": [
      "emerge（現れる）",
      "be released（発売される）"
    ],
    "raw": [
      "emerge",
      "be released"
    ],
    "note": null,
    "previous": [
      "emerge",
      "be released"
    ]
  },
  {
    "course": "EikenPre2",
    "text": "carry out",
    "labels": [
      "execute（計画などを実行する）",
      "conduct（調査などを実施する）"
    ],
    "raw": [
      "execute",
      "conduct"
    ],
    "note": null,
    "previous": [
      "execute",
      "conduct"
    ]
  },
  {
    "course": "EikenPre2",
    "text": "out of date",
    "labels": [
      "outdated（時代遅れの）",
      "expired（期限が切れた）"
    ],
    "raw": [
      "outdated",
      "expired"
    ],
    "note": null,
    "previous": [
      "outdated"
    ]
  },
  {
    "course": "EikenPre2",
    "text": "be capable of",
    "labels": [
      "be able to（〜できる・後ろは動詞の原形）"
    ],
    "raw": [
      "be able to"
    ],
    "note": null,
    "previous": [
      "be able to"
    ]
  },
  {
    "course": "EikenPre1Part1",
    "text": "come down with",
    "labels": [
      "catch the flu（インフルエンザにかかる）"
    ],
    "raw": [
      "catch the flu"
    ],
    "note": null,
    "previous": [
      "catch illness"
    ]
  },
  {
    "course": "EikenPre1Part1",
    "text": "go back on",
    "labels": [
      "break a promise（約束を破る）"
    ],
    "raw": [
      "break a promise"
    ],
    "note": null,
    "previous": [
      "break promise"
    ]
  },
  {
    "course": "EikenPre1Part1",
    "text": "miss out on",
    "labels": [
      "miss an opportunity（機会を逃す）"
    ],
    "raw": [
      "miss an opportunity"
    ],
    "note": null,
    "previous": [
      "lose chance for"
    ]
  },
  {
    "course": "EikenPre1Part1",
    "text": "play down",
    "labels": [
      "downplay（重要性を小さく見せる）"
    ],
    "raw": [
      "downplay"
    ],
    "note": null,
    "previous": [
      "make seem less"
    ]
  },
  {
    "course": "EikenPre1Part1",
    "text": "on a basis",
    "labels": [
      "on a weekly basis（毎週・週単位で）"
    ],
    "raw": [
      "on a weekly basis"
    ],
    "note": null,
    "previous": [
      "in a way"
    ]
  },
  {
    "course": "EikenPre1Part1",
    "text": "crack up",
    "labels": [
      "burst out laughing（笑い出す）",
      "break down（精神的に参る意味）"
    ],
    "raw": [
      "burst out laughing",
      "break down"
    ],
    "note": null,
    "previous": [
      "break down"
    ]
  },
  {
    "course": "EikenPre1Part1",
    "text": "fall on",
    "labels": [
      "be assigned to（役目が割り当てられる）",
      "occur on（日付に当たる意味）"
    ],
    "raw": [
      "be assigned to",
      "occur on"
    ],
    "note": null,
    "previous": [
      "occur on"
    ]
  },
  {
    "course": "EikenPre1Part1",
    "text": "grow out of",
    "labels": [
      "outgrow（成長して合わなくなる・脱する）",
      "develop from（〜から発展する意味）"
    ],
    "raw": [
      "outgrow",
      "develop from"
    ],
    "note": null,
    "previous": [
      "develop from"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "put forth",
    "labels": [
      "put forward（案・意見を提示する）"
    ],
    "raw": [
      "put forward"
    ],
    "note": null,
    "previous": [
      "place"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "put A through to B",
    "labels": [
      "connect A to B（電話でAをBにつなぐ）"
    ],
    "raw": [
      "connect A to B"
    ],
    "note": null,
    "previous": [
      "place"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "come across",
    "labels": [
      "run into（偶然会う）",
      "find by chance（偶然見つける）"
    ],
    "raw": [
      "run into",
      "find by chance"
    ],
    "note": null,
    "previous": [
      "appear"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "come up with",
    "labels": [
      "think of（思いつく）",
      "dream up（考え出す）"
    ],
    "raw": [
      "think of",
      "dream up"
    ],
    "note": null,
    "previous": [
      "appear"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "get rid of",
    "labels": [
      "dispose of（処分する）",
      "discard（捨てる）"
    ],
    "raw": [
      "dispose of",
      "discard"
    ],
    "note": null,
    "previous": [
      "obtain"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "put off",
    "labels": [
      "postpone（延期する）",
      "defer（後に延ばす）"
    ],
    "raw": [
      "postpone",
      "defer"
    ],
    "note": null,
    "previous": [
      "place"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "turn away",
    "labels": [
      "refuse entry（入場を断る）",
      "look away（顔をそむける）"
    ],
    "raw": [
      "refuse entry",
      "look away"
    ],
    "note": null,
    "previous": [
      "change"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "turn in",
    "labels": [
      "hand in（提出する）",
      "go to bed（寝る）"
    ],
    "raw": [
      "hand in",
      "go to bed"
    ],
    "note": null,
    "previous": [
      "change"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "turn down",
    "labels": [
      "reject（申し出を断る）",
      "lower（音量を下げる）"
    ],
    "raw": [
      "reject",
      "lower"
    ],
    "note": null,
    "previous": [
      "change"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "turn out",
    "labels": [
      "work out（計画などがうまくいく場合）",
      "prove to be（〜だと分かる）"
    ],
    "raw": [
      "work out",
      "prove to be"
    ],
    "note": null,
    "previous": [
      "change"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "cope with",
    "labels": [
      "deal with（〜に対処する）"
    ],
    "raw": [
      "deal with"
    ],
    "note": null,
    "previous": [
      "deal"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "depend on",
    "labels": [
      "rely on（〜を頼る）"
    ],
    "raw": [
      "rely on"
    ],
    "note": null,
    "previous": [
      "rely"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "engage in",
    "labels": [
      "participate in（〜に参加する）"
    ],
    "raw": [
      "participate in"
    ],
    "note": null,
    "previous": [
      "participate"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "focus on",
    "labels": [
      "concentrate on（〜に集中する）"
    ],
    "raw": [
      "concentrate on"
    ],
    "note": null,
    "previous": [
      "concentrate"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "settle up",
    "labels": [
      "pay in full（全額を支払う）"
    ],
    "raw": [
      "pay in full"
    ],
    "note": null,
    "previous": [
      "pay fully"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "trip up",
    "labels": [
      "make someone stumble（人をつまずかせる・失敗させる）"
    ],
    "raw": [
      "make someone stumble"
    ],
    "note": null,
    "previous": [
      "make stumble"
    ]
  },
  {
    "course": "EikenPre1Part2",
    "text": "wash down",
    "labels": [
      "swallow with a drink（飲み物と一緒に飲み込む）"
    ],
    "raw": [
      "swallow with a drink"
    ],
    "note": null,
    "previous": [
      "drink with"
    ]
  }
];
const plain=v=>JSON.parse(JSON.stringify(v));
const {QUESTIONS}=load('src/data/questions.ts');
const current=load('src/data/questionSynonyms.ts');
const {getVocabularyUsageNote}=load('src/data/vocabularyUsageNotes.ts');
const {getLevel2PhraseReview}=load('src/data/level2PhraseReview.ts');
const entries=JSON.parse(fs.readFileSync('src/data/level2PhraseReview.json','utf8'));
const oldModule=file=>{
 const source=execFileSync('git',['show',baseline+':'+file],{encoding:'utf8',maxBuffer:8_000_000});
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,
  {module,exports:module.exports,require:name=>load(path.posix.join(path.posix.dirname(file),name))});
 return module.exports;
};
const prior=oldModule('src/data/questionSynonyms.ts');
const priorNotes=oldModule('src/data/vocabularyUsageNotes.ts');
const expected=new Map(approved.map(e=>[e.course+':'+e.text,e]));
assert.equal(approved.length,49);assert.equal(expected.size,49);assert.equal(entries.length,49);
assert.equal(createHash('sha256').update(JSON.stringify(QUESTIONS)).digest('hex'),
 '8af479f03894bf6c225aabdc2e38bc56fadaa5d0259402a83fdf6f0f11482ca1','All original saved fields/order stay intact');
let checked=0,reviewed=0;
for(const[course,levels]of Object.entries(QUESTIONS))for(const[level,questions]of Object.entries(levels))for(const q of questions){
 const n=Number(level),before=JSON.stringify(q),e=n===2?expected.get(course+':'+q.text):undefined;
 const labels=plain(current.getQuestionSynonymLabels(course,n,q));
 const raw=plain(current.getQuestionSynonyms(course,n,q));
 const note=getVocabularyUsageNote(course,n,q)??null;
 if(e){
  assert.deepEqual(labels,e.labels,course+':'+q.text);
  assert.deepEqual(raw,e.raw,course+':'+q.text);
  assert.equal(note,e.note);
  assert.deepEqual(plain(prior.getQuestionSynonyms(course,n,q)),e.previous,'Previous display was frozen before implementation');
  assert.ok(getLevel2PhraseReview(course,n,q));
  reviewed++;
 }else{
  assert.deepEqual(labels,plain(prior.getQuestionSynonymLabels(course,n,q)),'Unchanged label '+course+':'+n+':'+q.text);
  assert.deepEqual(raw,plain(prior.getQuestionSynonyms(course,n,q)));
  assert.equal(note,priorNotes.getVocabularyUsageNote(course,n,q)??null);
  assert.equal(getLevel2PhraseReview(course,n,q),undefined);
 }
 assert.deepEqual(plain(current.getQuestionSynonymLabels(course,n,JSON.parse(before))),labels,'Saved/imported clones resolve');
 assert.equal(getVocabularyUsageNote(course,n,JSON.parse(before))??null,note);
 assert.equal(current.getQuestionSynonymHeading(course,n,q),prior.getQuestionSynonymHeading(course,n,q));
 assert.equal(JSON.stringify(q),before,'Display must not mutate questions');
 checked++;
}
assert.equal(checked,7650);assert.equal(reviewed,49);
for(const e of entries){
 assert.equal(QUESTIONS[e.course][2].filter(q=>q.text===e.text&&q.translation===e.translation&&(q.exampleEn??'')===e.exampleEn).length,1);
 for(const level of[1,3])assert.equal(getLevel2PhraseReview(e.course,level,e),undefined);
 assert.equal(getLevel2PhraseReview('Eiken2',2,e),undefined);
 assert.equal(getLevel2PhraseReview(e.course,2,{...e,translation:e.translation+' edited'}),undefined);
 assert.equal(getLevel2PhraseReview(e.course,2,{...e,exampleEn:e.exampleEn+' edited'}),undefined);
 assert.ok(e.expressions.length<=2);
 for(const x of e.expressions){assert.ok(x.text.length<=24&&x.note.length<=26);assert.notEqual(x.text,e.text);}
}
for(const file of ['src/data/translationBattlePrompts.json','src/data/questionMeaning.ts','src/App.tsx','src/learningProgress.ts']){
 const before=execFileSync('git',['show',baseline+':'+file],{encoding:'utf8',maxBuffer:8_000_000}).replace(/\r\n/g,'\n');
 assert.equal(fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),before,'No changes to prompts, meaning lookup, UI, grading or progress');
}
console.log('PASS: exactly 49 approved Level 2 reviews; 7,650 original/imported questions; all other displays, before-answer hints, UI, grading and progress retained.');
