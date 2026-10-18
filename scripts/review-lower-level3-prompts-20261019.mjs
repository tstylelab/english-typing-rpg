import {applyReview} from './lib/apply-translation-prompt-review.mjs';
import {load} from './lib/load-typescript-data.mjs';
const {QUESTIONS}=load('src/data/questions.ts');
const {getQuestionMeaning}=load('src/data/questionMeaning.ts');
const all={Eiken5:[],Eiken4:[],Eiken3:[]};
const add=(c,text,meaning,alternatives,formNote,reason='和訳から文の形と語義を想起しやすくし、自然な別表現の重なりも示す。')=>all[c].push({text,meaning,alternatives,formNote,reason});
const a=(...x)=>add('Eiken5',...x),b=(...x)=>add('Eiken4',...x),c=(...x)=>add('Eiken3',...x);
a('She cleaned her room.','彼女は自分の部屋の汚れを落とし、掃除しました。','washed|洗った',undefined,'掃除する表現を、整理整頓だけの別表現と同じに扱わない。');
a('The children are happy.','その子どもたちはうれしい・幸せな気分です。',undefined,undefined,'見た目の推量を示すそうを除き、英文の状態を保つ。');
a('Open the door.','ドアを開けなさい。',undefined,'丁寧な依頼の言葉を添えない命令文');
a('Close your book.','自分の本を閉じなさい。',undefined,'丁寧な依頼の言葉を添えない命令文');
a('Stand up, please.','','rise|立ち上がる','丁寧に頼む言葉を文末に添える');
a('Sit down, please.','','have a seat|席に着く','丁寧に頼む言葉を文末に添える');
a('How is the weather?','','What is the weather like?|天気はどうですか');
a('I saw a movie.','','watched|映画などを見た;film|映画');
a('I am sorry I am late.','私は遅れてすみません（短縮しない形）。',undefined,undefined,'文中の二か所とも短縮しない形であることを示す。');
a('Can I use this pen?','','May I|〜してもよいですか');
a('May I come in?','','Can I|〜してもよいですか');
a('She is watching TV.','','watching television|テレビを見ている');
a('Are you watching TV?','','watching television|テレビを見ている');
// Full vs contracted forms are part of the expected sentence, not a spelling cue.
for(const q of QUESTIONS.Eiken5[3]){
 if(all.Eiken5.some(e=>e.text===q.text)||getQuestionMeaning(q,'Eiken5').includes('短縮'))continue;
 if(/^(?:I am|You are|He is|She is|It is|We are|They are|I will|We will|There is|There are)\b/.test(q.text))a(q.text,undefined,undefined,'短縮しない形で表す','意味が同じ短縮形との違いを、日本語の文型情報として示す。');
}
b('These are on sale.','これらは販売中です／特価で売られています。',undefined,undefined,'販売中と値下げの両用法を残し、文脈がないのにセールと決めつけない。');
b('Clean your room now.','今すぐ自分の部屋を掃除しなさい。',undefined,undefined,'整理整頓だけでなく、汚れを落とす意味を保つ。');
b('We met at school three years ago.','私たちは3年前、学校で会いました。',undefined,undefined,'必ず初めて知り合ったという意味ではないため、過剰な限定を外す。');
b('You do not have to hurry.','','need not|〜する必要はない');
b('You must not use your phone here.','ここでは自分の携帯電話を使ってはいけません（短縮しない形）。',undefined,'禁止を表す。必要がないという意味ではない');
b('Please tell me how to get there.','どうか私に、そこへの行き方を教えてください。',undefined,'疑問の表現の後に不定詞を続ける');
b('Please show me the way.','どうか私に道を示して、案内してください。','tell me the way|私に道順を教える');
b('Would you like to go shopping with me?','私と一緒に買い物に行きませんか（丁寧な誘い）。','Do you want to|〜したいですか');
b('I am looking forward to the school festival.','私は学園祭を楽しみにしています（短縮しない形）。','anticipating|〜を楽しみにしている');
b('I think this answer is right.','','correct|正しい','思う内容を直接続け、接続詞は省く');
b('I forgot to bring my homework today.','','left my homework behind|自分の宿題を置き忘れた','忘れた行為を不定詞で続ける');
b('I stayed home because I was sick.','','ill|具合が悪い','家にいたことを先に述べ、理由の節を続ける');
b('They were playing soccer after school.','彼らは放課後、サッカーをしているところでした。',undefined,'過去のある時点で進行中の動作');
b('I was reading when you called me.','あなたが私に電話したとき、私は読書をしているところでした。',undefined,'読書の動作を過去進行形で表す');
c('I am coming.','今そちらへ行きます（短縮しない形）。');
c('I am not sure.','私は確信がありません（短縮しない形）。','certain|確かな');
c('I cannot decide.','私は決められません（短縮しない形）。');
c('I would love to.','ぜひそうしたいです（誘いへの返事・短縮しない形）。');
c('I do not think so.','私はそうは思いません（短縮しない形）。');
c('I am just looking.','（店で）私は見ているだけです（短縮しない形）。');
c('I am afraid not.','残念ですが、そうではありません（短縮しない形）。');
c('I am not from here.','私はこの土地の者ではありません（短縮しない形）。');
c('Can I take a message?','','May I|〜しましょうか','電話を受けた側が伝言を預かる申し出');
c('I think that reading is important.','','essential|とても重要な','読書を動名詞の主語にし、思う内容の接続詞を省略しない');
c('I have not read it yet.','私はまだそれを読んでいません（短縮しない形）。');
c('I cannot wait to see you.','あなたに会うのが待ちきれません（短縮しない形）。');
c('I do not know where to go.','私はどこへ行けばよいかわかりません（短縮しない形）。');
c('I do not know why he left.','なぜ彼が去ったのか私は知りません（短縮しない形）。');
c('This song makes me happy.','この歌は私を幸せな気分にします。',undefined,'歌を主語にして、人をある状態にする文');
c('These pictures were taken by Ken.','これらの写真はケンによって撮られました。',undefined,'写真を主語にした受け身');
c('This machine can be used by anyone.','この機械は誰によっても使われることができます。',undefined,'機械を主語にし、可能を表す受け身');
c('The boy who is running is my brother.','走っている少年は私の兄弟です。','that|人にも使える関係代名詞',undefined,'年上か年下かは英文から決まらないため、弟だけに限定しない。');
c('The girl playing tennis is my sister.','テニスをしている女の子は私の姉妹です。',undefined,'現在分詞を後ろから添えて、女の子を説明する','年上か年下かは英文から決まらないため、姉だけに限定しない。');
c('I like stories that make me laugh.','','which|物を説明する関係代名詞','話を主語の関係代名詞で説明する');
c('This bag is not as heavy as yours.','このかばんはあなたのものほど重くありません（短縮しない形）。');
c('I think we should use less plastic.','','reduce our plastic use|プラスチックの使用を減らす','思う内容を直接続け、接続詞は省く');
for(const [course,edits] of Object.entries(all))applyReview({course,level:3,date:'2026-10-19',edits,auditPath:`docs/translation-prompt-reviews-2026-10-18/${course}-L3.json`,sources:[
 'https://dictionary.cambridge.org/dictionary/english/on-sale',
 'https://dictionary.cambridge.org/grammar/british-grammar/contractions',
 'https://dictionary.cambridge.org/grammar/british-grammar/relative-pronouns'
]});
