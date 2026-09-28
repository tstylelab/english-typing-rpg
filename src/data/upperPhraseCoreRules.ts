import type { Question } from './questions';

// Reviewed whole-entry replacements, NOT automatic trimming of arbitrary English.
// Keep legacy source rows unchanged for migrations and representative examples.
// Format: original | learning target | Japanese cue | optional synonyms (comma separated).
const rows = `
cheer her up|cheer up|（人を）元気づける|encourage
no more bread|no more|これ以上の〜はない
get on the bus|get on|（バス・電車など）に乗る|board
give me a ride|give A a ride|Aを車に乗せて送る（Aは人）
such as apples|such as|例えば〜のような
on my way home|on the way home|帰宅する途中で
give me a hand|give A a hand|Aに手を貸す（Aは人）
give her a hand|give A a hand|Aに手を貸す（Aは人）
agree with you|agree with|（人・意見）に賛成する
too many books|too many|多すぎる〜（数えられるもの）
put on a jacket|put on|（衣服など）を身につける
not cold at all|not at all|少しも〜ない（notとat allで挟む）
pick up the pen|pick up|（物を）拾い上げる・（人を）迎えに行く
pick up my sister|pick up|（物を）拾い上げる・（人を）迎えに行く
leave for Tokyo|leave for|〜に向けて出発する
look for my keys|look for|〜を探す|search for
try on this coat|try on|（服など）を試着する
all the way home|all the way|道中ずっと・はるばる
turn on the radio|turn on|（機器・電気）をつける|switch on
have time to read|have time to|〜する時間がある（後ろに動詞の原形）
part of the story|part of|〜の一部
be kind to others|be kind to|〜に親切にする
hundreds of birds|hundreds of|何百もの〜
in time for lunch|in time for|〜に間に合って
the same as yours|the same as|〜と同じ
turn off the light|turn off|（機器・電気）を消す|switch off
too heavy to carry|too A to B|AすぎてBできない（Aは形容詞、Bは動詞の原形）
both cats and dogs|both A and B|AとBの両方
find out the truth|find out|（調べて事実・答えを）見つけ出す|discover
work for a company|work for|（会社・人）のために働く
be full of flowers|be full of|〜でいっぱいである|be filled with
take off your shoes|take off|（靴・衣服）を脱ぐ
take part in a race|take part in|〜に参加する|participate in
be afraid of snakes|be afraid of|〜を怖がる|be scared of
be proud of my team|be proud of|〜を誇りに思う
take care of a baby|take care of|〜の世話をする（takeを使う）|look after
thousands of people|thousands of|何千もの〜
turn down the music|turn down|（音量など）を下げる
most of the students|most of|〜の大部分
throw away old paper|throw away|（不要な物）を捨てる|discard
turn left at the bank|turn left|左に曲がる
be different from mine|be different from|〜とは異なる
at the end of the road|at the end of|〜の終わりに・突き当たりに
be famous for its food|be famous for|〜で有名である|be well known for
hear about the accident|hear about|〜について耳にする
belong to me|belong to|〜のものである・〜に所属する
on your right|on the right|右側に
call you back|call back|（人に）折り返し電話する
forget to call|forget to|〜するのを忘れる（後ろに動詞の原形）
sound like fun|sound like|〜のように聞こえる
change my mind|change one's mind|考えを変える（one'sはmy・yourなど）
talk to myself|talk to oneself|独り言を言う（oneselfはmyselfなど）
look up a word|look up|（語・情報）を辞書などで調べる
ask him to help|ask A to do|Aに〜するよう頼む（Aは人、doは動詞の原形）
decide to leave|decide to|〜することに決める（後ろに動詞の原形）
be glad to help|be glad to|喜んで〜する（後ろに動詞の原形）
get him to help|get A to do|Aを説得して〜してもらう（Aは人、doは動詞の原形）
on my first day|on the first day|最初の日に
be able to swim|be able to|〜することができる（後ろに動詞の原形）
run out of milk|run out of|（物など）を使い切る
want you to come|want A to do|Aに〜してほしい（Aは人、doは動詞の原形）
tell her to wait|tell A to do|Aに〜するよう伝える（Aは人、doは動詞の原形）
not have to work|not have to|〜する必要がない（後ろに動詞の原形）
not finished yet|not yet|まだ〜していない（notとyetで挟む）
be happy to join|be happy to|喜んで〜する（happyを使い、後ろに動詞の原形）
a couple of days|a couple of|二、三の〜
be ready to start|be ready to|〜する準備ができている（後ろに動詞の原形）
look after my dog|look after|〜の世話をする（lookを使う）|take care of
feel like dancing|feel like|〜したい気分だ（後ろに-ing形）
care about others|care about|〜を気にかける
instead of coffee|instead of|〜の代わりに（insteadを使う）
used to live here|used to|以前は〜していた（後ろに動詞の原形）
give it back to me|give A back to B|AをBに返す（Aは物、Bは人など）
hear of the writer|hear of|〜の存在を耳にする
take turns reading|take turns|交代で〜する（後ろに-ing形を続けられる）
because of the rain|because of|〜のために（理由）|due to
do well on the test|do well on|（試験など）でよい成績を取る
be tired of waiting|be tired of|〜にうんざりしている|be sick of
show me how to cook|show A how to do|Aに〜の仕方を教える（Aは人、doは動詞の原形）
have been to Canada|have been to|〜へ行ったことがある
thanks to your help|thanks to|〜のおかげで
would love to visit|would love to|ぜひ〜したい（後ろに動詞の原形）
be similar to yours|be similar to|〜によく似ている
plan to study abroad|plan to|〜する予定を立てる（後ろに動詞の原形）
invite you to dinner|invite A to B|AをBに招く（Aは人、Bは場所・行事など）
far from the station|far from|（場所）から遠くに
as tall as my father|as tall as|〜と同じくらい背が高い
on the way to school|on the way to|〜へ行く途中で
such a beautiful day|such a|こんなに〜な（後ろに形容詞と単数名詞）
be covered with snow|be covered with|〜で覆われている
be filled with water|be filled with|〜で満たされている|be full of
be known as a writer|be known as|〜として知られている
look around the town|look around|〜を見て回る
make paper from wood|make A from B|Bを原料にAを作る（材料の形が変わる）
make a chair of wood|make A of B|Bを材料にAを作る（材料が見てわかる）
think of a good idea|think of|（考えなど）を思いつく
either tea or coffee|either A or B|AかBのどちらか
help me with homework|help A with B|AのBを手伝う（Aは人、Bは仕事など）
be ready for the test|be ready for|〜の準備ができている
finish reading a book|finish reading|読み終える（finishの後に-ing形）
be absent from school|be absent from|（学校・会合など）を欠席している
graduate from college|graduate from|（学校）を卒業する
depend on the weather|depend on|〜次第である・〜に頼る
help me carry this box|help A do|Aが〜するのを手伝う（Aは人、doは動詞の原形）
be careful about money|be careful about|〜に気をつける
one of the best players|one of the best|最もよい〜の一つ・一人（後ろに複数名詞）
something cold to drink|something to drink|何か飲むもの
have enough time to eat|have enough time to|〜するのに十分な時間がある（後ろに動詞の原形）
get away from the noise|get away from|〜から離れる・逃れる
be interested in science|be interested in|〜に興味がある
show you around the city|show A around|Aに周辺を案内する（Aは人）
exchange dollars for yen|exchange A for B|AをBに交換する
taller than any other boy|than any other|ほかのどの〜よりも（比較級の後、続く名詞は単数）
name him after his father|name A after B|BにちなんでAを名づける
introduce you to my sister|introduce A to B|AをBに紹介する
have an interview with her|have an interview with|〜と面接・取材をする
make sure the door is shut|make sure|〜を確かめる
where to buy tickets|where to|どこで〜するか（後ろに動詞の原形）
as soon as I get home|as soon as|〜するとすぐに（後ろに文）
keep in touch with you|keep in touch with|〜と連絡を取り続ける
not today but tomorrow|not A but B|AではなくB
the number of students|the number of|〜の数（後ろに複数名詞）
leave a message for her|leave a message for|〜に伝言を残す
look forward to seeing you|look forward to|〜を楽しみにする（後ろに名詞・-ing形）
It is easy for me to swim.|It is A for B to do|Bにとって〜するのはAだ（Aは形容詞、Bは人、doは動詞の原形）
so tired that I cannot walk|so A that B|とてもAなのでBだ（Aは形容詞・副詞、Bは文）
This is my first time skiing.|one's first time doing|〜するのは初めて（one'sはmyなど、doingは-ing形）
It takes an hour to walk there.|It takes A to do|〜するのにAかかる（Aは時間、doは動詞の原形）
see her off|see off|（人を）見送る
live on rice|live on|〜を主食にする・〜で生計を立てる
do me a favor|do A a favor|Aの頼みを聞く（Aは人）
plenty of time|plenty of|十分な・たっぷりの〜
lose my balance|lose one's balance|バランスを崩す（one'sはmy・yourなど）
go into the room|go into|〜の中に入る
add sugar to tea|add A to B|AをBに加える
put down the bag|put down|（物を）下に置く
fill up the tank|fill up|〜を満タンにする
hand in homework|hand in|（書類など）を提出する|submit
work on a project|work on|（課題など）に取り組む
run after the dog|run after|〜を走って追いかける
stop by the store|stop by|〜にちょっと立ち寄る|drop by
pass by the house|pass by|〜の前を通り過ぎる
tired from walking|be tired from|〜で疲れている（疲れの原因）
leave a bag behind|leave behind|（物を）置き忘れる
watch out for cars|watch out for|〜に気をつける
bring back the book|bring back|（物を）持ち帰る・返しに来る
send out invitations|send out|（招待状・通知など）を発送する
across from the bank|across from|〜の向かいに
take after my father|take after|（家族など）に似ている|resemble
head for the station|head for|〜へ向かう
popular with children|be popular with|〜に人気がある
start with a question|start with|〜から始める
by the side of the road|by the side of|〜の脇に
stay away from the edge|stay away from|〜に近づかない
take a book out of a bag|take A out of B|AをBから取り出す
stand by me|stand by|（人の）味方でいる・支える
let her down|let down|（人を）がっかりさせる|disappoint
mean to call|mean to|〜するつもりである（後ろに動詞の原形）
set up a tent|set up|（設備）を設置する・（組織）を設立する
about to leave|be about to|まさに〜しようとしている（後ろに動詞の原形）
typical of him|be typical of|いかにも〜らしい
based on facts|be based on|〜に基づいている
look up to her|look up to|（人を）尊敬する|respect
busy with work|be busy with|〜で忙しい
be sure to call|be sure to|忘れずに必ず〜する（後ろに動詞の原形）
apply for a job|apply for|（仕事・許可など）に応募する・申請する
due to the rain|due to|〜のために（原因、dueを使う）|because of
see if it works|see if|〜かどうか確かめる（後ろに文）
make up my mind|make up one's mind|決心する（one'sはmy・yourなど）
free from worry|be free from|（心配・害など）がない
get over a cold|get over|（病気・困難など）から回復する・乗り越える
stand for peace|stand for|〜を表す|represent
even if it rains|even if|たとえ〜でも（後ろに文）
search for a key|search for|〜を探し回る|look for
decide on a date|decide on|〜を決める
up to ten people|up to|最大〜まで
go over the plan|go over|（計画・内容など）をよく見直す|review
in case it rains|in case|〜の場合に備えて（後ろに文）
a room of my own|of one's own|自分専用の〜（名詞の後、one'sはmyなど）
do without a car|do without|〜なしで済ませる
carry out a plan|carry out|（計画・調査など）を実行する
unable to attend|be unable to|〜することができない（後ろに動詞の原形）
had better leave|had better|〜した方がよい（忠告、後ろに動詞の原形）
in order to learn|in order to|〜するために（後ろに動詞の原形）
a variety of food|a variety of|さまざまな種類の〜
cut down on sugar|cut down on|（摂取量・使用量など）を減らす
cut off the water|cut off|（供給など）を止める
focus on the task|focus on|〜に集中する|concentrate on
related to health|be related to|〜に関連している
bring up children|bring up|（子どもを）育てる
catch up with her|catch up with|〜に追いつく
think about moving|think about|〜を検討する・〜について考える
a number of people|a number of|かなりの数の〜（後ろに複数名詞）
by the end of June|by the end of|〜の終わりまでに
sure of the answer|be sure of|〜を確信している
feel sorry for him|feel sorry for|〜を気の毒に思う
come across a book|come across|（人・物）に偶然出会う
rely on my friends|rely on|〜を頼りにする|depend on
expected to arrive|be expected to|〜すると見込まれている（後ろに動詞の原形）
in addition to math|in addition to|〜に加えて
put off the meeting|put off|（予定など）を延期する|postpone
point out a mistake|point out|（問題点など）を指摘する
lead to an accident|lead to|（結果として）〜につながる
aware of the danger|be aware of|〜に気づいている
lead us to the exit|lead A to B|AをBへ案内する（Aは人、Bは場所）
come up with an idea|come up with|（考え・案）を思いつく
spend money on books|spend A on B|AをBに使う（Aはお金・時間など）
look over the report|look over|（書類など）にざっと目を通す
provide us with food|provide A with B|AにBを提供する
along with my friends|along with|〜と一緒に
by the time we arrive|by the time|〜する時までには（後ろに文）
suffer from a disease|suffer from|（病気・問題など）に苦しむ
keep an eye on my bag|keep an eye on|〜を見ている・見守る|watch
succeed in finding it|succeed in|〜に成功する（後ろに名詞・-ing形）
in charge of the team|in charge of|〜を担当して
hope for good weather|hope for|〜を望む
except for one mistake|except for|〜を除いて
translate into English|translate into|〜語に翻訳する
keep up with the class|keep up with|〜に遅れずについていく
take over the business|take over|（事業など）を引き継ぐ
grow up to be a doctor|grow up to be|成長して〜になる
responsible for safety|be responsible for|〜に責任がある
lose sight of the boat|lose sight of|〜を見失う
have a chance to speak|have a chance to|〜する機会がある（後ろに動詞の原形）
run into an old friend|run into|（人に）偶然会う
get rid of old clothes|get rid of|（不要なもの）を処分する
grateful for your help|be grateful for|〜に感謝している
jealous of her success|be jealous of|〜をうらやんでいる
reach out for the rope|reach out for|〜に手を伸ばす
pay attention to signs|pay attention to|〜に注意を向ける
go through a hard time|go through|（つらいことなど）を経験する
in return for your help|in return for|〜のお返しに
look through the papers|look through|（書類など）にひと通り目を通す
involved in the project|be involved in|〜に関わっている
impressed with the work|be impressed with|〜に感心している
complain about the noise|complain about|〜について苦情を言う
satisfied with the result|be satisfied with|〜に満足している
take me back to childhood|take A back to B|AにBを思い出させる（Aは人、Bは過去の時期）
compare my plan with yours|compare A with B|AをBと比べる
separate paper from plastic|separate A from B|AをBから分ける
by far the best|by far|群を抜いて・はるかに（最上級などを強める）
against my will|against one's will|意志に反して（one'sはmy・yourなど）
result in success|result in|結果として〜につながる
no more than five|no more than|わずか〜・〜にすぎない
make out the words|make out|（文字など）をなんとか読み取る
said to be healthy|be said to|〜すると言われている（後ろに動詞の原形）
turn out to be true|turn out to be|〜であると判明する
at risk of flooding|at risk of|〜の危険にさらされて
as long as you stay|as long as|〜する限り（後ろに文）
in spite of the rain|in spite of|〜にもかかわらず|despite
capable of solving it|be capable of|〜する能力がある（後ろに名詞・-ing形）
independent of others|be independent of|〜から自立している
make sense of the map|make sense of|〜を理解する
make up for lost time|make up for|（遅れ・損失など）を埋め合わせる|compensate for
appeal to young people|appeal to|（人の心）に訴える・気に入られる
as a result of the storm|as a result of|〜の結果として
ask her for help|ask A for B|AにBを求める
stop by the shop|stop by|〜にちょっと立ち寄る|drop by
try out the game|try out|（物・方法）を試してみる
fill out the form|fill out|（用紙）に記入する
fill out a form|fill out|（用紙）に記入する
bring back a book|bring back|（物を）持ち帰る・返しに来る
take up gardening|take up|（趣味など）を始める
throw away the box|throw away|（不要な物）を捨てる|discard
turn up the volume|turn up|（音量など）を上げる
in search of a job|in search of|〜を探して
pick up the package|pick up|（荷物など）を受け取る
take a look at this|take a look at|〜をちょっと見る
leave my bag behind|leave behind|（物を）置き忘れる
stare at the screen|stare at|〜をじっと見る
three days in a row|in a row|連続して・一列に
hand in the homework|hand in|（書類など）を提出する|submit
sell out the tickets|sell out|（商品など）を売り切る
take away the plates|take away|（物を）片づける・持ち去る
put together the table|put together|（部品など）を組み立てる|assemble
according to the report|according to|〜によると
look through the photos|look through|（写真・書類など）にざっと目を通す
meet our needs|meet one's needs|必要を満たす（one'sはour・theirなど）
run out of time|run out of|（時間・物など）を使い切る
keep my promise|keep a promise|約束を守る
make fun of him|make fun of|〜をからかう
work on a report|work on|（課題など）に取り組む
instead of a car|instead of|〜の代わりに（insteadを使う）
set up a company|set up|（設備）を設置する・（組織）を設立する
manage to finish|manage to|何とか〜する（後ろに動詞の原形）
look up the word|look up|（語・情報）を辞書などで調べる
as if he knew me|as if|まるで〜であるかのように（後ろに文）
tend to be quiet|tend to|〜する傾向がある（後ろに動詞の原形）
find my way home|find one's way|道を見つけて進む（one'sはmy・yourなど）
major in history|major in|（学問）を専攻する
put off the trip|put off|（予定など）を延期する|postpone
be based on facts|be based on|〜に基づいている
happen to see her|happen to|偶然〜する（後ろに動詞の原形）
result in a delay|result in|結果として〜につながる
by the end of May|by the end of|〜の終わりまでに
apply for the job|apply for|（仕事・許可など）に応募する・申請する
be about to leave|be about to|まさに〜しようとしている（後ろに動詞の原形）
due to heavy rain|due to|〜のために（原因、dueを使う）|because of
stick to the plan|stick to|（計画・約束など）を守り続ける
be likely to rain|be likely to|〜しそうだ（後ろに動詞の原形）
keep that in mind|keep in mind|（大事なことを）覚えておく|bear in mind
remind me of home|remind A of B|AにBを思い出させる
wear out my shoes|wear out|（靴など）をすり減らす
bring up an issue|bring up|（問題・話題）を持ち出す
carry out a survey|carry out|（計画・調査など）を実行する
find a way to help|find a way to|〜する方法を見つける（後ろに動詞の原形）
refer to the chart|refer to|（資料など）を参照する
in return for help|in return for|〜のお返しに
allow her to enter|allow A to do|Aが〜するのを許す（Aは人、doは動詞の原形）
let my friend down|let down|（人を）がっかりさせる|disappoint
be willing to help|be willing to|進んで〜する（後ろに動詞の原形）
drop out of school|drop out of|（学校など）を中退する・途中でやめる
take over the shop|take over|（事業など）を引き継ぐ
a series of events|a series of|一連の〜
come up with a plan|come up with|（考え・案）を思いつく
turn water into ice|turn A into B|AをBに変える
as long as you need|as long as|〜する限り（後ろに文）
end up staying home|end up|結局〜することになる（後ろに-ing形など）
feel like going out|feel like|〜したい気分だ（後ろに-ing形）
give in to pressure|give in to|〜に屈する
count on my friends|count on|〜を頼りにする|rely on
ever since that day|ever since|〜以来ずっと
a number of students|a number of|かなりの数の〜（後ろに複数名詞）
encourage him to try|encourage A to do|Aが〜するよう励ます（Aは人、doは動詞の原形）
along with my family|along with|〜と一緒に
be related to health|be related to|〜に関連している
prefer tea to coffee|prefer A to B|BよりAを好む
had better leave now|had better|〜した方がよい（忠告、後ろに動詞の原形）
persuade him to join|persuade A to do|Aが〜するよう説得する（Aは人、doは動詞の原形）
in danger of closing|in danger of|〜の危険がある（後ろに名詞・-ing形）
in time for the show|in time for|〜に間に合って
be sick of the noise|be sick of|〜にうんざりしている|be tired of
break into the house|break into|（建物に）押し入る
call off the meeting|call off|（予定・行事）を中止する|cancel
care for the patient|care for|〜の世話をする|look after
put aside some money|put aside|（お金など）を取っておく
think over the offer|think over|（案など）をよく考える|consider
use up all the paper|use up|〜をすべて使い切る
go along with a plan|go along with|（案など）に賛同する
so tired that I slept|so A that B|とてもAなのでBだ（Aは形容詞・副詞、Bは文）
deal with the problem|deal with|（問題など）に対処する（dealを使う）|cope with
figure out the answer|figure out|（答えなど）を考えて見つける
so that she can study|so that|〜するように（目的を表し、後ろに文）
get used to the noise|get used to|〜に慣れる（後ろに名詞・-ing形）
look up to my teacher|look up to|（人を）尊敬する|respect
a wide range of books|a wide range of|幅広い種類の〜
just in case it rains|just in case|万が一に備えて（後ろに文を続けられる）
look into the problem|look into|（問題など）を調査する|investigate
make use of this tool|make use of|〜を活用する|utilize
in order to save money|in order to|〜するために（後ろに動詞の原形）
suffer from a headache|suffer from|（病気・問題など）に苦しむ
take part in the event|take part in|〜に参加する|participate in
tea rather than coffee|rather than|〜よりもむしろ
be similar to this one|be similar to|〜によく似ている
be aware of the danger|be aware of|〜に気づいている
live on a small income|live on|〜を主食にする・〜で生計を立てる
be capable of swimming|be capable of|〜する能力がある（後ろに名詞・-ing形）
consist of three parts|consist of|〜から成る
except for one student|except for|〜を除いて
in addition to English|in addition to|〜に加えて
rely on her for advice|rely on A for B|BのためにAを頼る
sign up for the course|sign up for|（講座など）に申し込む
would rather stay home|would rather|むしろ〜したい（後ろに動詞の原形）
compare this with that|compare A with B|AをBと比べる
carry on with the work|carry on with|〜を続ける
get by on little money|get by on|〜で何とか暮らす
in place of my brother|in place of|〜の代わりに
keep in touch with her|keep in touch with|〜と連絡を取り続ける
sum up the main points|sum up|（要点など）をまとめる|summarize
a variety of activities|a variety of|さまざまな種類の〜
catch up with the class|catch up with|〜に追いつく
concentrate on the task|concentrate on|〜に集中する|focus on
prevent him from leaving|prevent A from doing|Aが〜するのを防ぐ（doingは動詞の-ing形）
be concerned about costs|be concerned about|〜を心配している
come across an old photo|come across|（人・物）に偶然出会う
get along with my sister|get along with|〜と仲よくやっていく
be made up of four teams|be made up of|〜で構成される|consist of
in exchange for a ticket|in exchange for|〜と引き換えに
provided that it is safe|provided that|〜であることを条件に（後ろに文）
make sure that it is safe|make sure that|〜であることを確認する（後ろに文）
pay attention to the sign|pay attention to|〜に注意を向ける
be responsible for safety|be responsible for|〜に責任がある
be involved in the project|be involved in|〜に関わっている
in response to the request|in response to|〜に応じて
put an end to the argument|put an end to|〜を終わらせる
put the plan into practice|put into practice|（計画・考え）を実行に移す
provide children with books|provide A with B|AにBを提供する
be satisfied with the result|be satisfied with|〜に満足している
not only students but also teachers|not only A but also B|AだけでなくBも
in terms of cost|in terms of|〜の面では・〜の観点から
cope with stress|cope with|（問題など）に対処する|deal with
be free from worry|be free from|（心配・害など）がない
bring about change|bring about|（変化など）をもたらす|cause
owing to the storm|owing to|〜のために（原因）|because of
for fear of failure|for fear of|〜を恐れて
enable her to study|enable A to do|Aが〜できるようにする（doは動詞の原形）
by means of a survey|by means of|〜という手段で
in favor of the plan|in favor of|〜に賛成して
be reluctant to speak|be reluctant to|〜するのをためらう（後ろに動詞の原形）
put up with the noise|put up with|〜を我慢する|tolerate
keep track of expenses|keep track of|（出費・変化など）を記録して把握する
take health for granted|take for granted|〜を当然のことと思う
in contrast to the past|in contrast to|〜とは対照的に
live up to expectations|live up to|（期待など）に応える
not to mention the cost|not to mention|〜は言うまでもなく
rule out the possibility|rule out|（可能性など）を除外する
account for half the sales|account for|（割合）を占める
be familiar with the rules|be familiar with|〜をよく知っている
prohibit them from entering|prohibit A from doing|Aが〜するのを禁じる（doingは動詞の-ing形）
take advantage of the chance|take advantage of|（機会など）を活用する
be independent of her parents|be independent of|〜から自立している
play an important role in health|play a role in|〜に役割を果たす
dawn on me|dawn on|（人に）ふとわかる
cater to demand|cater to|（需要・好みなど）に応える
drum up support|drum up|（支持・商売など）を集める
choke back tears|choke back|（涙・感情など）をこらえる
dip into savings|dip into|（貯金など）を少し使う
flesh out a plan|flesh out|（案など）を詳しく肉付けする
dote on her child|dote on|（人を）溺愛する
dwell on the past|dwell on|（過去など）をくよくよ考える
farm out the work|farm out|（仕事を）外部に委託する|outsource
abide by the rules|abide by|（規則など）を守る|comply with
bargain on success|bargain on|〜を当てにする
defer to an expert|defer to|（人の判断など）を尊重する
factor in the cost|factor in|（費用・事情など）を計算に入れる
fend off an attack|fend off|（攻撃など）を防ぐ
crack down on crime|crack down on|（犯罪など）を厳しく取り締まる
creep into the room|creep into|〜にそっと忍び込む
ease up on the rules|ease up on|（規制など）を緩める
fall back on savings|fall back on|（困ったときに）〜を頼りにする
cash in on popularity|cash in on|〜を利用して利益を得る
come in for criticism|come in for|（批判など）を受ける
boil down to one issue|boil down to|結局〜に帰着する
chip away at a problem|chip away at|（問題など）を少しずつ減らす
detract from the value|detract from|（価値など）を損なう
barge through the crowd|barge through|〜を強引に通り抜ける
come down on the company|come down on|（人・組織）を厳しく非難する
dispense with formalities|dispense with|（手続きなど）を省く
capitalize on an opportunity|capitalize on|（好機など）を生かす
tide him over|tide over|（人に困難な時期を）一時的にしのがせる
gang up on him|gang up on|（人を）集団で攻撃する
hike up prices|hike up|（価格など）を大幅に引き上げる
level with him|level with|（人に）率直に話す
scrimp on food|scrimp on|（費用など）を切り詰める
load up on food|load up on|（食料など）をたっぷり買い込む
revel in success|revel in|〜を大いに喜ぶ
settle on a plan|settle on|（案など）に決める
fritter away time|fritter away|（時間・お金）を無駄に使う
pick up on a clue|pick up on|（手がかりなど）に気づく
root for the team|root for|（チーム・人）を応援する
stock up on water|stock up on|（物資など）を買いだめする
gain on the leader|gain on|（先を行く人など）との差を縮める
grate on my nerves|grate on one's nerves|神経に障る（one'sはmy・yourなど）
nail down the date|nail down|（日付・条件など）をはっきり決める
pass up the chance|pass up|（機会など）を見送る
ride out the storm|ride out|（困難など）を何とか乗り切る
stave off a crisis|stave off|（危機など）を食い止める
tap into new ideas|tap into|（資源・発想など）を活用する
tip off the police|tip off|（人に）密告する・そっと知らせる
hinge on the result|hinge on|〜次第で決まる|depend on
leaf through a book|leaf through|（本など）をぱらぱらめくる
live down a mistake|live down|（失敗などの）悪い評判を消す
mete out punishment|mete out|（罰など）を与える
mull over the offer|mull over|（案など）をじっくり考える|ponder
own up to a mistake|own up to|（過ちなど）を認める|admit
rip into the policy|rip into|（政策・人など）を激しく批判する
root out corruption|root out|（悪弊など）を根絶する|eradicate
shrug off criticism|shrug off|（批判など）を気にせず受け流す
gloss over a problem|gloss over|（問題など）に詳しく触れずに済ます
iron out the details|iron out|（問題・食い違いなど）を解決する
lead up to the event|lead up to|（出来事など）の前に起きる・そこにつながる
swear by this method|swear by|（方法など）を強く信頼する
tamper with evidence|tamper with|（証拠など）を改ざんする
lag behind the others|lag behind|〜より遅れる
side with the workers|side with|（人・陣営）の側を支持する
sift through evidence|sift through|（証拠など）を丹念に調べる
glance over the report|glance over|（書類など）にざっと目を通す
gnaw at his confidence|gnaw at|（自信・心など）を徐々にむしばむ
harp on the same point|harp on|（同じこと）をしつこく言う
muscle into the market|muscle into|（市場など）に強引に参入する
opt out of the program|opt out of|（制度などへの）参加をやめる
roll out a new service|roll out|（新サービスなど）を導入する
shy away from conflict|shy away from|（争いなど）を避ける
stand in for the actor|stand in for|（人の）代役を務める|substitute for
stumble upon an answer|stumble upon|（答え・物など）を偶然見つける
make off with the money|make off with|（物を）持ち逃げする
stack up against rivals|stack up against|〜と比べてどの程度であるか
go through with the plan|go through with|（計画など）を最後まで実行する
opt for the cheaper plan|opt for|（案など）を選ぶ|choose
hunker down in the shelter|hunker down|身を潜める・腰を据えて取り組む
ingratiate oneself with the boss|ingratiate oneself with|〜に取り入る（oneselfはmyselfなど）
`;

export const upperPhraseCoreRules = new Map(rows.trim().split('\n').map(row => {
  const [original, text, translation, synonyms] = row.split('|');
  return [original, { text, translation, ...(synonyms ? { synonyms: synonyms.split(',') } : {}) }] as const;
}));

// Short, sense-appropriate hints reviewed independently of the old concrete examples.
const coreSynonyms = new Map(`
give A a hand|help A
agree with|share the opinion of
not at all|not in the least
leave for|set off for
part of|a portion of
the same as|identical to
work for|be employed by
take off|remove
turn down|lower
most of|the majority of
be different from|differ from
hear about|learn about
call back|return a call
change one's mind|reconsider
be glad to|be happy to
get A to do|persuade A to do
be able to|can
not have to|not need to
be happy to|be glad to
a couple of|a few
be ready to|be prepared to
care about|be concerned about
instead of|in place of
give A back to B|return A to B
would love to|be eager to
be similar to|resemble
far from|distant from
on the way to|en route to
look around|explore
think of|come up with
be ready for|be prepared for
be absent from|be away from
depend on|rely on,hinge on
be careful about|be cautious about
get away from|escape from
make sure|check,ensure
keep in touch with|stay in contact with
plenty of|more than enough
fill out|complete
go into|enter
put down|set down
run after|chase
pass by|go past
watch out for|be alert for
across from|opposite
head for|go toward
start with|begin with
by the side of|beside
stay away from|keep clear of
stand by|support
mean to|intend to
see if|check whether
make up one's mind|decide
get over|recover from
decide on|choose
up to|at most
do without|manage without
carry out|execute,conduct
be unable to|cannot
in order to|so as to
cut down on|reduce
cut off|stop
be related to|be connected with
think about|consider
a number of|many
be sure of|be certain of
feel sorry for|pity
in addition to|besides
lead to|result in
be aware of|be conscious of
lead A to B|guide A to B
come up with|think of,devise
look over|skim
provide A with B|supply A with B
along with|together with
take over|take charge of
get rid of|discard
be grateful for|be thankful for
be jealous of|be envious of
reach out for|reach for
look through|scan,browse through
be satisfied with|be pleased with
against one's will|unwillingly
result in|lead to
no more than|only
make out|decipher
turn out to be|prove to be
at risk of|in danger of
make sense of|understand
appeal to|attract
try out|test
turn up|increase
take a look at|look at
in a row|consecutively
take away|remove
meet one's needs|satisfy one's needs
keep a promise|keep one's word
make fun of|tease
give in to|yield to
encourage A to do|urge A to do
put aside|save
use up|exhaust
go along with|agree to
figure out|work out
be capable of|be able to
sign up for|enroll in
carry on with|continue
get by on|scrape by on
be concerned about|be worried about
provided that|on condition that
make sure that|check that,ensure that
put an end to|end
put into practice|implement
in terms of|regarding
in favor of|supporting
be reluctant to|be hesitant to
keep track of|monitor
rule out|exclude
take advantage of|make use of
dawn on|occur to
choke back|hold back
dote on|adore
dwell on|brood over
bargain on|count on
factor in|take into account
fend off|repel
crack down on|clamp down on
creep into|sneak into
ease up on|relax
fall back on|rely on
cash in on|profit from
barge through|push through
come down on|condemn
dispense with|do without
capitalize on|take advantage of
hike up|raise sharply
level with|be frank with
scrimp on|economize on
revel in|delight in
settle on|decide on
fritter away|waste
pick up on|notice
root for|support
gain on|catch up to
grate on one's nerves|irritate
nail down|fix
pass up|decline
ride out|survive
stave off|avert
tap into|draw on
tip off|inform
leaf through|browse through
mete out|administer
rip into|attack
shrug off|disregard
gloss over|downplay
iron out|resolve
lead up to|precede
lag behind|trail
side with|support
glance over|skim
gnaw at|erode
roll out|launch
shy away from|avoid
stack up against|compare with
go through with|carry out
`.trim().split('\n').map(row => {
  const [text, synonyms] = row.split('|');
  return [text, synonyms.split(',')] as const;
}));

export const reviewUpperPhrase = (question: Question): Question => {
  const replacement = upperPhraseCoreRules.get(question.text);
  if (!replacement) return question;
  // Examples remain concrete; old phrase-specific synonyms/meaning must not leak into the new cue.
  return { text: replacement.text, translation: replacement.translation, synonyms: replacement.synonyms ?? coreSynonyms.get(replacement.text),
    exampleEn: question.exampleEn, exampleJa: question.exampleJa };
};

export const reviewUpperPhraseEntries = <T extends { question: Question }>(entries: T[]): T[] => {
  const seen = new Set<string>();
  return entries.flatMap(entry => {
    const question = reviewUpperPhrase(entry.question);
    if (seen.has(question.text)) return [];
    seen.add(question.text);
    return [{ ...entry, question }];
  });
};
