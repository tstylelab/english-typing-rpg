import {applyReview} from './lib/apply-translation-prompt-review.mjs';
const all={Eiken2:[],EikenPre2:[]};
const add=(course,text,meaning,alternatives,formNote,reason='英文にある主語・語句・文型が和訳から伝わるようにし、自然な言い換えとの重なりも示す。')=>all[course].push({text,meaning,alternatives,formNote,reason});
const a=(...x)=>add('Eiken2',...x),b=(...x)=>add('EikenPre2',...x);
a('I have two reasons for this.','これについて私には二つの理由があります。',undefined,'自分が理由を持つ形で表す');
a('I have two reasons why I think so.','私がそう考える理由は二つあります。',undefined,'理由の後に、自分がそう考えることを節で添える');
a('Second, it costs less.','第二に、それは費用がより少なくて済みます。','Secondly|第二に');
a('First, it saves us time.','','Firstly|第一に');
a('First of all, safety is important.','','To begin with|まず');
a('To begin with, we need a clear plan.','','First of all|何よりもまず');
a('For example, we can share old books.','例えば、私たちは古い本を共有できます。','For instance|例えば');
a('For example, we can reuse these bags.','例えば、私たちはこれらの袋を再利用できます。','For instance|例えば');
a('I think that reading every day is useful.','毎日読書することは役に立つと私は思います。',undefined,'動名詞を主語にした節を続け、接続詞を省略しない');
a('In my opinion, children need time to play.','','From my point of view|私の考えでは');
a('Also, children can learn from the experience.','','In addition|さらに');
a('However, some people do not have enough time.','','Nevertheless|それでも');
a('I think that a library is useful for everyone.','図書館は誰にとっても役に立つと私は思います。',undefined,'思う内容を節で続け、接続詞を省略しない');
a('However, we must consider the cost.','しかし、私たちはその費用を考慮しなければなりません。',undefined,undefined,'必要があるという弱い訳を、義務を示す英文に合わせる。');
a('There are many people who need help.','','a lot of|たくさんの', '存在を表す文に、人を説明する関係詞節を付ける');
a('These days, many people shop online.','','Nowadays|近ごろは');
a('Therefore, I take the train when I can.','したがって、私は可能なときは電車に乗ります。','Thus|したがって');
a('I met a student who volunteers at the hospital.','私はその病院でボランティアをする生徒に会いました。',undefined,'生徒を関係代名詞の節で説明する');
a('The book that you recommended was useful.','','which|物を説明する関係代名詞','目的語の関係代名詞を省略しない');
a('In conclusion, the program is worth trying.','','To conclude|結論として');
a('In conclusion, the benefits are greater than the costs.','','To conclude|結論として');
a('In conclusion, we should use public transportation more often.','','To conclude|結論として');
a('I believe that education can change a community.','','think|〜と思う','信じる内容を節で続け、接続詞を省略しない');
a('I believe that small actions can make a difference.','','think|〜と思う','信じる内容を節で続け、接続詞を省略しない');
a('This means that more people can use the service.','これは、より多くの人がそのサービスを利用できるという意味です。',undefined,'意味する内容を節で続け、接続詞を省略しない');
a('This is because the buses are often late.','','frequently|頻繁に', 'これがそうなる理由を、理由の節で説明する');
// Pre-2: most existing prompts already carry grammar guidance; revise concrete weak spots.
b('How come you are here?','どうしてここにいるの（くだけた言い方）。','Why|なぜ','くだけた理由の質問。疑問の表現の後も主語・動詞の順');
b("I'm sorry to hear that.",'それを聞いてお気の毒に思います。',"That's too bad.|それはお気の毒です",undefined,'自分の過失への謝罪とは限らないため、同情の別表現を比較する。');
b('Is it OK if I sit here?','','May I|〜してもいいですか','大丈夫かを尋ねる文に、もし私が〜したらという節を付ける');
b('May I take a message?','','Can I|〜しましょうか', '電話を受けた側が、伝言を書き留めることを申し出る');
b('May I leave a message?','','Can I|〜してもいいですか','電話をかけた側が、伝言を残す許可を求める');
b('The movie made me feel happy.','その映画は私を幸せな気分にさせました。',undefined,'映画を主語にして、私への働きかけを表す');
b('I am used to getting up early.','私は早起きすることに慣れています（短縮しない形）。',undefined,'慣れている状態。後ろは動名詞');
b('Would you mind closing the door?','','Could you|〜していただけますか','相手が嫌でないか尋ねる形の依頼。後ろは動名詞');
b('Would you mind waiting outside?','','Could you|〜していただけますか','相手が嫌でないか尋ねる形の依頼。後ろは動名詞');
b('Do you mind if I open the window?','','May I|〜してもいいですか','相手に差し支えがあるか、もし私が〜したらという節で尋ねる');
b('They do not allow us to use phones here.','彼らはここで私たちが電話を使うことを許しません。',undefined,'彼らを主語にして、人への許可を否定する');
b('She asked me where I lived.','彼女は私に、私がどこに住んでいるか尋ねました。',undefined,'住んでいる人も一人称。間接疑問と時制の一致');
b('This is the camera that I bought yesterday.','','which|物を説明する関係代名詞','目的語の関係代名詞を省略しない');
b('The woman who lives next door is a nurse.','','that|人にも使える関係代名詞','女性を主語の関係代名詞で説明する');
b('Tell me whether or not you can come.','あなたが来られるかどうか、私に教えてください。','if|〜かどうか', '可能な場合と不可能な場合の両方を、明示して尋ねる');
b('I strongly believe that exercise is important.','運動は大切だと私は強く信じています。',undefined,'信じる内容を節で続け、接続詞を省略しない');
b('I do not think that all homework is unnecessary.','すべての宿題が不要だとは私は思いません。',undefined,'思うことを否定し、内容を示す接続詞を省略しない');
b('In conclusion, small actions can make a difference.','','To conclude|結論として');
b('For example, we can talk with people abroad.','例えば、私たちは海外の人と話すことができます。','For instance|例えば');
b('However, we also need to consider the cost.','しかし、私たちは費用も考える必要があります。','Nevertheless|それでも');
for(const [course,edits] of Object.entries(all))applyReview({course,level:3,date:'2026-10-19',edits,auditPath:`docs/translation-prompt-reviews-2026-10-18/${course}-L3.json`,sources:[
 'https://dictionary.cambridge.org/grammar/british-grammar/relative-pronouns',
 'https://dictionary.cambridge.org/grammar/british-grammar/mind',
 'https://dictionary.cambridge.org/grammar/british-grammar/word-order-and-focus'
]});
