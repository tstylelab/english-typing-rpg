import {applyReview} from './lib/apply-translation-prompt-review.mjs';
const all={Eiken5:[],Eiken4:[],Eiken3:[]};
const add=(course,text,meaning,alternatives,contrasts,reason='意味が重なる表現を短く示すか、動作・状態・用法を明確にして想起の手掛かりを補う。')=>all[course].push({text,meaning,alternatives,contrasts,reason});
// Grade 5: all 200 questions checked, retaining simple unambiguous daily phrases.
add('Eiken5','go to bed','寝るためにベッドに入る',undefined,'fall asleep|眠りに落ちる');
add('Eiken5','clean my room','自分の部屋の汚れを落とす・掃除する',undefined,'tidy my room|自分の部屋を整理する');
add('Eiken5','watch TV','','watch television|テレビを見る');
add('Eiken5','sit down','','have a seat|席に着く・座る');
add('Eiken5','talk to','〜に話す・話しかける／〜と話す',undefined,undefined,'会話にも使えるため、一方向だけの表現だと誤解させない。');
add('Eiken5','look at','','take a look at|〜をちょっと見る');
add('Eiken5','put on','（服などを）身につける動作',undefined,'wear|身につけている状態');
add('Eiken5','go out','外出する・外へ出る',undefined,undefined,'go outsideと重なる場面を否定せず、出る動作を明確にする。');
add('Eiken5','in the evening','夕方から夜の早い時間に',undefined,undefined,'夕方だけに限定せず、夜の時間帯も含む語義を示す。');
add('Eiken5','on the table','テーブルの上に（表面に接して）',undefined,undefined,'上方の空間だけを指す表現との違いを補う。');
add('Eiken5','many books','','a lot of books|たくさんの本');
add('Eiken5','too much','多すぎる・多すぎる量の（数えられないもの）',undefined,'too many|数えられるものが多すぎる');
add('Eiken5','good afternoon','こんにちは（午後のあいさつ）',undefined,undefined,'時間帯のあいさつであることを示す。');
add('Eiken5','I am ready','私は準備ができています（短縮しない形）',undefined,undefined,'短縮形との違いを日本語で示し、正解語は指定しない。');
add('Eiken5','I am hungry','私はお腹が空いています（短縮しない形）',undefined,undefined,'短縮形との違いを日本語で示し、正解語は指定しない。');
add('Eiken5','I am tired','私は疲れています（短縮しない形）',undefined,undefined,'短縮形との違いを日本語で示し、正解語は指定しない。');
add('Eiken5','ask a question','質問する','', 'answer a question|質問に答える','対象級の学習語から遠い別表現を外し、尋ねる・答えるを対比する。');
add('Eiken5','answer a question','','respond to a question|質問に答える');
add('Eiken5','very much','とても・大いに（好きだ・感謝するなどの程度）',undefined,undefined,'形容詞の前にそのまま使う表現との違いが分かるようにする。');
// Grade 4: all 149 checked, preserving approved core phrases and genuine overlaps.
add('Eiken4','want to be','〜になりたい（後ろに職業・立場など）',undefined,undefined,'後ろに置く内容を明確にする。');
add('Eiken4','take A to B','AをBへ持っていく・連れていく（Aは人・物、Bは行き先）',undefined,undefined,'移動させる対象と行き先を区別する。');
add('Eiken4','stay in','（部屋・テントなど）の中に泊まる・滞在する／外出せず中にいる',undefined,undefined,'場所を後ろに続ける用法と、外出しない用法の両方を残す。');
add('Eiken4','stay with','（人）の家に泊まる・滞在する',undefined,undefined,'滞在相手が人であることを明確にする。');
add('Eiken4','take a walk','','go for a walk|散歩に行く');
add('Eiken4','have a cold','かぜをひいている（その状態）',undefined,'catch a cold|かぜをひく変化');
add('Eiken4','catch a cold','かぜをひく（病気になる変化）',undefined,'have a cold|かぜをひいている状態');
add('Eiken4','be late for','〜の開始時刻に遅れる・遅刻する',undefined,undefined,'何に対する遅れかを明確にする。');
add('Eiken4','be interested in','','have an interest in|〜に興味がある');
add('Eiken4','one day','ある日／いつか', 'someday|未来のいつかという意味',undefined,'過去のある日と未来のいつかを混同させない。');
add('Eiken4','around the corner','角を曲がったすぐ先に／間近に迫って', 'just around the corner|角のすぐ先に・間近に',undefined,'場所と、出来事が近いという比喩の両用法を残す。');
add('Eiken4','be surprised at','〜を知って驚く・〜に驚いている', 'be surprised by|〜に驚かされる;be amazed at|〜に非常に驚く');
add('Eiken4','be proud of','','take pride in|〜を誇りに思う');
add('Eiken4','have a fever','','have a temperature|熱がある');
add('Eiken4','have a look at','〜をちょっと見る・一目見る','take a look at|〜をちょっと見る');
add('Eiken4','feel like','','want to|〜したい');
add('Eiken4','remember to','忘れずにこれから〜する（後ろに動詞の原形）',undefined,'remember doing|以前〜したことを覚えている');
add('Eiken4','try to','〜しようと試みる（後ろに動詞の原形）',undefined,'try doing|試しに〜してみる');
add('Eiken4','practice playing','演奏・競技などをする練習をする',undefined,undefined,'日本語を自然にし、演奏だけに限定しない。');
// Grade 3: all 182 checked; state changes and preposition relationships.
add('Eiken3','these days','','nowadays|最近は・現在は',undefined,'現在の習慣と比べやすい表現を残す。完了形と結びつきやすい別表現を整理。');
add('Eiken3','be sold out','商品がすべて売れて、売り切れている',undefined,'sell out|売り切る・売り切れる');
add('Eiken3','cheer up','（人を）元気づける／元気を出す','brighten up|元気になる・明るくする',undefined,'自動詞としての励ましにも使えることを示す。');
add('Eiken3','such as','','like|〜のような具体例を挙げる');
add('Eiken3','put on','（衣服など）を身につける動作',undefined,'wear|身につけている状態');
add('Eiken3','in time for','〜の開始などに間に合って',undefined,'on time|予定の時刻どおりに');
add('Eiken3','on time','予定の時刻どおりに',undefined,'in time for|〜に間に合って');
add('Eiken3','turn down','','lower|音量などを下げる');
add('Eiken3','on sale','販売中で／特価で売られて',undefined,undefined,'英米の用法の違いもあるため、値下げだけに限定しない。');
add('Eiken3','at least','少なくとも〜（数・量の下限）','not less than|〜以上');
add('Eiken3','look well','体調がよさそう・健康そうに見える','look healthy|健康そうに見える');
add('Eiken3','in a minute','','soon|まもなく');
add('Eiken3','sound like','〜のように聞こえる・話を聞くと〜のようだ',undefined,undefined,'実際の音だけでなく、話から受ける印象にも使う。');
add('Eiken3','forget to','これから〜するのを忘れる（後ろに動詞の原形）',undefined,'forget doing|以前〜したことを忘れる');
add('Eiken3','run out of','（時間・物など）の持ち分がなくなる・尽きる','use up|持っている物を使い切る');
add('Eiken3','a couple of','二つの・二人の〜／少数の〜','a few|少数の〜',undefined,'基本の二つと、くだけた少数の用法を分け、必ず二〜三と限定しない。');
add('Eiken3','be ready to','〜する準備・用意ができている（後ろに動詞の原形）',undefined,undefined,'準備が整っている状態を明確にする。');
add('Eiken3','take turns','','alternate|交代で行う');
add('Eiken3','as soon as possible','','as early as possible|時期をできるだけ早く');
add('Eiken3','make sure','〜を確かめる・確実にする',undefined,undefined,'確認と確実にする用法の両方を残す。');
add('Eiken3','where to','どこで・どこへ〜するか（後ろに動詞の原形）',undefined,undefined,'移動先を表す場合も含める。');
add('Eiken3','be careful about','（事柄・扱い方など）について注意する','take care with|〜の扱いに気をつける',undefined,'危険を警戒する比較だけに狭めず、金銭の扱いなどにも合わせる。');
for(const [course,edits] of Object.entries(all))applyReview({course,level:2,date:'2026-10-18',edits,auditPath:`docs/translation-prompt-reviews-2026-10-18/${course}-L2.json`,sources:[
 'https://dictionary.cambridge.org/dictionary/english/on-sale',
 'https://dictionary.cambridge.org/grammar/british-grammar/remember-or-remind',
 'https://dictionary.cambridge.org/grammar/british-grammar/verb-patterns-verb-infinitive-or-verb-ing'
]});
