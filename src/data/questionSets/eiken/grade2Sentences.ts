const point = (label: string, pattern: string, note: string) => ({ label, pattern, note });
export const grade2Grammar: Record<string, { label: string; pattern: string; note: string }> = {
  opinion: point('意見を言う', 'I think / In my opinion, ...', '考えを短く述べ、その後に具体的な理由を続ける。'),
  agreement: point('賛成・反対', 'agree / disagree with ...', '意見に賛成か反対かを示し、何についてかを明確にする。'),
  reason: point('理由を示す', 'because / because of / This is because ...', 'because の後は文、because of の後は名詞句を置く。'),
  order: point('理由を順番に述べる', 'First, ... / Second, ...', '複数の理由は順序を示して整理すると伝わりやすい。'),
  example: point('具体例を示す', 'For example, ... / such as ...', '考えを支える具体例を一つ足す。'),
  addition: point('情報を加える', 'In addition, ... / Furthermore, ...', '前の理由とは別の理由や補足を加える。'),
  contrast: point('対比する', 'However, ... / while / although', '異なる面を述べるときに、前後の関係を示す。'),
  result: point('結果を述べる', 'As a result, ... / Therefore, ...', '理由や出来事から生じた結果を示す。'),
  conclusion: point('結論をまとめる', 'In conclusion, ... / That is why ...', '述べた理由を受けて自分の考えをまとめる。'),
  trend: point('増減・傾向', 'The number of ... is increasing.', '増減しているものを主語にし、単数・複数に注意する。'),
  importance: point('大切さを述べる', 'It is important for ... to ...', 'for の後が行動の主体、to の後がその行動。'),
  relative: point('人や物を説明する', '名詞 + who / that ...', '名詞の後ろから、その人や物について説明する。'),
  passive: point('受け身', 'be + 過去分詞', '行為を受けるものを主語にする。'),
  condition: point('条件', 'if / unless + 文', '何が起こればどうなるかを二つの節で表す。'),
  indirect: point('間接疑問', '疑問詞 + 主語 + 動詞', '疑問を文の中に入れたら、後ろは通常の語順にする。'),
  perfect: point('現在完了', 'have / has + 過去分詞', '過去から現在まで続く状態・経験・結果を表す。'),
  gerund: point('動名詞', '動詞 + ing', '動作を「〜すること」として扱う。'),
  infinitive: point('目的の不定詞', 'to + 動詞の原形', '何のために行動するかを表す。'),
  comparison: point('比較', '比較級 + than / as ... as', '比較する二つのものを明確にする。'),
};

// 1701-1738: writing patterns from the supplied list, expanded into original
// complete sentences. 0: an original reinforcement sentence.
export const grade2SentenceRows = `
1|1701|opinion|I think that reading every day is useful.|私は毎日読書することは役に立つと思います。
1|1702|opinion|In my opinion, children need time to play.|私の意見では、子どもには遊ぶ時間が必要です。
2|1703|agreement|I agree that we should save energy.|私たちは節電すべきだという考えに賛成です。
2|1704|agreement|I disagree with the idea that tests are unnecessary.|試験は不要だという意見には反対です。
1|1705|reason|I have two reasons why I think so.|そう考える理由が二つあります。
1|1706|reason|I have two reasons for this.|これについて理由が二つあります。
1|1707|order|First, it saves us time.|第一に、それは私たちの時間を節約します。
1|1708|order|Second, it costs less.|第二に、それは費用が少なくて済みます。
1|1709|order|To begin with, we need a clear plan.|まず、明確な計画が必要です。
1|1710|order|First of all, safety is important.|何よりまず、安全が大切です。
2|1711|addition|In addition, we can reduce waste.|加えて、私たちはごみを減らせます。
1|1712|addition|Also, children can learn from the experience.|また、子どもはその経験から学べます。
2|1713|addition|Furthermore, the change will help older people.|そのうえ、その変更は高齢者の助けになります。
1|1714|reason|This is because the buses are often late.|これはバスがよく遅れるからです。
1|1715|reason|I walk because it is good for my health.|健康によいので私は歩きます。
1|1716|reason|The game was canceled because of the rain.|雨のため試合は中止されました。
2|1717|reason|Another reason is that it is easy to use.|もう一つの理由は、それが使いやすいことです。
2|1718|reason|The first reason is that it saves money.|第一の理由は、それがお金を節約できることです。
1|1719|reason|Thanks to her help, I finished on time.|彼女の助けのおかげで時間どおりに終えました。
1|1720|example|For example, we can reuse these bags.|例えば、これらの袋を再利用できます。
1|1721|example|We need clean energy such as solar power.|太陽光発電のようなクリーンなエネルギーが必要です。
2|1722|result|Therefore, we should act now.|したがって、私たちは今行動すべきです。
2|1723|result|As a result, the river became cleaner.|その結果、川はよりきれいになりました。
2|1724|result|This means that more people can use the service.|つまり、より多くの人がそのサービスを利用できます。
2|1725|conclusion|For these two reasons, I support the plan.|これら二つの理由から、私はその計画を支持します。
1|1726|conclusion|That is why I support the plan.|だから私はその計画を支持します。
2|1727|conclusion|In conclusion, the program is worth trying.|結論として、そのプログラムは試す価値があります。
2|1728|trend|The number of visitors is increasing.|訪問者の数は増えています。
2|1729|trend|More and more people work from home.|ますます多くの人が在宅で働いています。
2|1730|trend|The town is becoming more popular.|その町はますます人気になっています。
2|1731|importance|It is important for children to get enough sleep.|子どもが十分な睡眠を取ることは大切です。
2|1732|importance|The most important thing is to keep trying.|最も大切なのは挑戦を続けることです。
2|1733|relative|There are many people who need help.|助けを必要としている人はたくさんいます。
2|1734|contrast|Some students prefer books, while others prefer videos.|本を好む生徒もいれば、動画を好む生徒もいます。
2|1735|trend|These days, many people shop online.|近ごろは多くの人がオンラインで買い物をします。
3|1736|passive|It is often said that travel broadens the mind.|旅は視野を広げるとよく言われます。
2|1737|contrast|Some people drive, and others use buses.|車で行く人もいれば、バスを使う人もいます。
2|1738|contrast|However, we must consider the cost.|しかし、その費用を考える必要があります。
1|0|condition|If it rains tomorrow, we will stay home.|もし明日雨が降ったら、家にいます。
2|0|condition|Unless we leave now, we will be late.|今出発しなければ、遅れてしまいます。
2|0|indirect|Do you know where this bus stops?|このバスがどこに止まるか知っていますか。
2|0|indirect|I wonder why she changed her mind.|彼女がなぜ考えを変えたのか気になります。
2|0|perfect|I have lived in this town for ten years.|私はこの町に十年間住んでいます。
2|0|perfect|She has already sent the email.|彼女はもうメールを送りました。
2|0|gerund|He enjoys working with children.|彼は子どもたちと働くのが好きです。
2|0|gerund|We avoided driving in the snow.|私たちは雪の中の運転を避けました。
2|0|infinitive|She went to the library to study.|彼女は勉強するために図書館へ行きました。
2|0|infinitive|We started a campaign to reduce waste.|ごみを減らすための運動を始めました。
2|0|comparison|This device uses less energy than that one.|この装置はあちらの装置よりエネルギーの使用量が少ないです。
2|0|comparison|The new bridge is as wide as the old one.|新しい橋は古い橋と同じ幅です。
2|0|passive|The bridge was built last year.|その橋は昨年建設されました。
2|0|passive|The results will be announced tomorrow.|結果は明日発表されます。
3|0|relative|The woman who spoke to us is a scientist.|私たちに話しかけた女性は科学者です。
3|0|relative|The book that you recommended was useful.|あなたが勧めた本は役に立ちました。
3|0|contrast|Although the plan is expensive, it may save energy.|その計画には費用がかかりますが、節電につながるかもしれません。
3|0|result|The factory closed; as a result, many people lost their jobs.|工場が閉鎖し、その結果多くの人が仕事を失いました。
3|0|importance|It is necessary for us to protect local nature.|私たちが地域の自然を守ることは必要です。
3|0|opinion|I believe that small actions can make a difference.|小さな行動でも変化を生めると私は信じています。
3|0|conclusion|In conclusion, we should use public transportation more often.|結論として、私たちはもっと公共交通機関を使うべきです。
1|0|opinion|I think that a library is useful for everyone.|図書館は誰にとっても役に立つと思います。
1|0|reason|I ride a bike because it saves money.|お金を節約できるので私は自転車に乗ります。
1|0|example|For example, we can share old books.|例えば、古い本を共有できます。
1|0|importance|It is important to protect clean water.|きれいな水を守ることは大切です。
1|0|contrast|However, some people do not have enough time.|しかし、十分な時間がない人もいます。
1|0|result|As a result, we arrived early.|その結果、私たちは早く到着しました。
1|0|opinion|I prefer learning with friends.|私は友人と一緒に学ぶ方が好きです。
1|0|condition|If you need help, ask the teacher.|助けが必要なら先生に尋ねてください。
1|0|passive|These bags are made from recycled paper.|これらの袋は再生紙から作られています。
1|0|perfect|I have never visited that museum.|私はその博物館に一度も行ったことがありません。
2|0|opinion|In my opinion, the city needs more parks.|私の意見では、その市にはもっと公園が必要です。
2|0|agreement|I disagree with the idea of closing the library.|図書館を閉鎖するという考えには反対です。
2|0|reason|This is because many children study there.|これは多くの子どもがそこで勉強するからです。
2|0|addition|In addition, parks give people a place to relax.|さらに、公園は人々にくつろげる場所を提供します。
2|0|contrast|While cars are convenient, they produce pollution.|車は便利ですが、汚染も生みます。
2|0|result|Therefore, I take the train when I can.|だから私はできるときに電車に乗ります。
2|0|trend|The number of online classes is increasing.|オンライン授業の数は増えています。
2|0|importance|It is important for us to check the source of news.|私たちがニュースの情報源を確かめることは大切です。
2|0|relative|I met a student who volunteers at the hospital.|病院でボランティアをする生徒に会いました。
2|0|passive|The new rule was announced yesterday.|新しい規則は昨日発表されました。
2|0|perfect|The company has reduced its energy use.|その会社はエネルギー使用量を減らしてきました。
2|0|gerund|We should avoid wasting clean water.|私たちはきれいな水を無駄にしないようにすべきです。
2|0|infinitive|She joined the club to make new friends.|彼女は新しい友人を作るためにクラブに入りました。
2|0|comparison|This method is more effective than the old one.|この方法は以前の方法より効果的です。
2|0|indirect|Can you tell me how to apply for the program?|そのプログラムへの応募方法を教えてくれますか。
3|0|opinion|I believe that education can change a community.|教育は地域を変えられると私は信じています。
3|0|reason|One reason is that everyone needs a fair chance.|一つの理由は、誰にも公平な機会が必要だからです。
3|0|addition|Furthermore, better transport may create jobs.|そのうえ、交通の改善は雇用を生むかもしれません。
3|0|contrast|Although the device is expensive, it uses less electricity.|その機器は高価ですが、電力消費が少ないです。
3|0|result|As a result, the town attracted more visitors.|その結果、町はより多くの訪問者を引きつけました。
3|0|trend|More and more people are concerned about privacy.|プライバシーを気にする人がますます増えています。
3|0|importance|It is necessary to protect personal data online.|オンライン上で個人情報を守ることが必要です。
3|0|relative|The scientist who spoke at the conference studies climate.|会議で話した科学者は気候を研究しています。
3|0|condition|If the city improves the buses, fewer people may drive.|市がバスを改善すれば、車に乗る人が減るかもしれません。
3|0|conclusion|In conclusion, the benefits are greater than the costs.|結論として、利益は費用を上回ります。
`.trim();
