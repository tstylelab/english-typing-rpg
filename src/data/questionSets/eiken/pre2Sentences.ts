const p = (label: string, pattern: string, note: string) => ({ label, pattern, note });
export const pre2Grammar: Record<string, { label: string; pattern: string; note: string }> = {
  request: p('丁寧な依頼', 'Could you + 動詞 ...?', '相手にしてほしいことを丁寧に頼む形。'),
  mind: p('許可・依頼', 'Do you mind ...?', '「気にしますか」と尋ねる。No は「構いません」という許可にもなる。'),
  offer: p('申し出・応答', 'May I ...? / Let me ...', '自分がしてあげることを申し出たり、丁寧に応答したりする表現。'),
  conversation: p('会話の決まり文句', '場面に合うひとまとまりの表現', '一語ずつ直訳するより、会話の場面と一緒に覚えよう。'),
  indirect: p('間接疑問', '疑問詞 + 主語 + 動詞', '文の中に疑問を入れるときは、疑問詞の後を普通の文の語順にする。'),
  gerund: p('動名詞', '動詞・前置詞 + 動詞のing形', '動作を「〜すること」として使う。前置詞の後の動詞もing形。'),
  infinitive: p('不定詞', 'to + 動詞の原形', '目的・これからの行動・感情の理由などを表す。'),
  objectTo: p('人に〜するよう求める', '動詞 + 人 + to + 動詞', 'want・ask・tell・allow・encourage などで、誰が何をするのかに注目。'),
  causative: p('使役・知覚', 'let / make / see + 人 + 動詞の原形', 'let は許す、make はさせる。知覚動詞ではing形で動作の途中も表せる。'),
  perfect: p('現在完了の使い分け', 'have / has + 過去分詞', '経験・継続・完了が、今とつながっていることを表す。'),
  pastPerfect: p('過去より前の出来事', 'had + 過去分詞', '過去のある時点よりも前に起きたことを表す。'),
  passive: p('受け身', 'be動詞 + 過去分詞', '動作を受ける人や物を主語にする。助動詞の後は be + 過去分詞。'),
  relative: p('関係詞', '名詞 + who / which / that ...', '名詞の後ろに説明を続ける。人はwho、物はwhichなどを使う。'),
  participle: p('分詞による説明', '名詞 + ing形 / 過去分詞 ...', '「〜している」「〜された」という説明を名詞に加える。'),
  comparison: p('比較', 'as ... as / 比較級 / 最上級', '何と何を比べるかに注意。much は比較級を強める。'),
  condition: p('条件・時', 'if / unless / when + 文', '未来のことでも、条件や時を表す節では通常現在形にする。'),
  subjunctive: p('現実と違う願い・仮定', 'If ... were ..., would ... / I wish ...', '現実とは違う仮定や願いを、過去形などで表す。'),
  conjunction: p('文をつなぐ', 'although / while / so that ...', '理由・対比・目的など、前後の文の関係を示す。'),
  reported: p('人の発言を伝える', 'said / told ... that ...', '誰の発言かに合わせて人称や時制を調整する。'),
  opinion: p('意見を伝える', 'I think / believe that ...', '自分の考えを述べ、その後に理由や具体例をつなごう。'),
  reason: p('理由・例・結論', 'This is because ... / For example, ...', '意見→理由→具体例→結論のつながりを意識する。'),
  question: p('情報を尋ねる', '疑問詞 + 助動詞 + 主語 ...?', '誰・何・いつ・どこ・なぜ・どのように、何を尋ねたいかを決める。'),
};
// Fixed expressions need their own explanation, not an unrelated generic question pattern.
export const pre2ExpressionPoints: Record<number, { label: string; pattern: string; note: string }> = {
  1502: p('選択への応答', 'Either will do.', 'either は二つのどちらでも、do はここでは「十分である」の意味。'),
  1503: p('快諾する', 'By all means.', '許可や依頼に「もちろん、ぜひ」と強く賛成するときの応答。'),
  1504: p('落ち着く', 'calm down', 'calm down で興奮や不安をしずめる。please を添えて呼びかける。'),
  1506: p('丁寧な応答', "Certainly, ma'am.", 'certainly は承知したという応答にも使う。ma\'am は女性への丁寧な呼びかけ。'),
  1507: p('行動を促す', "Come on, let's ...", 'Come on で相手を促し、let\'s で一緒にすることを提案する。'),
  1508: p('お祝いを伝える', 'Congratulations on + 名詞', 'お祝いの言葉は通常複数形。何を祝うかは on の後に続ける。'),
  1512: p('意味を確かめる', 'Does that mean + 文?', '相手の言葉が何を意味するか、mean の後の文で確認する。'),
  1516: p('話を切り出す', 'Guess what!', '驚きやうれしいニュースを伝える前の「ねえ聞いて」に当たる。'),
  1520: p('理由を尋ねる', 'How come + 主語 + 動詞?', 'くだけた「なぜ」。why と違い、この形では後ろを疑問文の語順にしない。'),
  1521: p('感想を尋ねる', 'How do you like + 名詞?', 'どの程度気に入ったか、感想を尋ねる形。方法を尋ねているわけではない。'),
  1522: p('過去の感想', 'How was + 名詞?', '終わった旅行や行事の感想を尋ねるので was を使う。'),
  1524: p('どうしようもない', "can't help it", 'ここでの help は「避ける・どうにかする」。助けられないという直訳ではない。'),
  1525: p('控えめに同意する', 'I guess so.', 'so は相手が述べた内容。確信は強くないが、たぶんそうだと答える。'),
  1526: p('面会・診察の予約', 'have an appointment with + 人', '人との面会や診察の予約には appointment を使う。相手は with の後。'),
  1531: p('戻る予定', "I'll be back at + 時刻", 'be back は戻っている状態。戻る時刻には at を使う。'),
  1532: p('取りに行く申し出', "I'll go get ...", 'go get は go and get に当たる会話表現。取りに行くと申し出る。'),
  1533: p('別れの気持ち', "I'll miss you.", 'miss + 人 で、その人がいなくて寂しく思う。'),
  1534: p('残念な知らせ', "I'm afraid + 文", '悪い知らせを柔らかく伝える前置き。この場合、怖いという意味ではない。'),
  1535: p('食事を断る', "I'm full.", 'full はここでは満腹という意味。感謝を添えると丁寧に断れる。'),
  1536: p('帰宅の挨拶', "I'm home!", 'home は帰宅先。家に帰ったことを知らせる決まり文句。'),
  1537: p('店員への応答', "I'm just looking.", 'まだ買う物を決めず見ている、と店員に伝える表現。'),
  1538: p('不確かさを伝える', 'not sure about + 名詞', 'sure は確信していること。about の後に確かでない対象を置く。'),
  1539: p('気の毒に思う', 'be sorry to hear ...', 'to hear ... は感情の理由。悪い知らせへの共感を伝える。'),
  1541: p('相手の希望に任せる', 'if you like', '「もしよければ」を添えて、相手が自由に選べる形にする。'),
  1542: p('状況に応じた提案', 'In that case, ...', '直前に聞いた状況を受けて「それなら」と次の提案につなぐ。'),
  1543: p('許可を確かめる', 'Is it OK if + 文?', 'if の後に、自分がしてもよいか確かめたい行動を置く。'),
  1544: p('店内か持ち帰りか', 'for here or to go', '米国などの飲食店で使う表現。or で二つの選択肢を示す。'),
  1545: p('可能性を柔らかく伝える', 'could + 動詞 / take a while', 'could はここでは過去ではなく可能性。take a while は少し時間がかかること。'),
  1547: p('支払いを申し出る', "It's on me.", 'この on は費用の負担を表し、私が支払うという意味。'),
  1550: p('確認を申し出る', 'Let me + 動詞の原形', '「私に〜させて」と、自分がする行動を申し出る。'),
  1554: p('伝言を頼む側', 'May I leave a message?', '電話をかけた側が、不在の相手への伝言を残したいときに使う。'),
  1556: p('伝言を受ける側', 'May I take a message?', '電話を受けた側が、伝言を預かるか尋ねる。leave との違いに注意。'),
  1558: p('否定への同意', 'Neither + 助動詞 + 主語', 'I do not like it. などへの「私も〜ない」。助動詞は相手の文に合わせる。'),
  1560: p('強い否定・驚き', 'No way!', 'くだけた強い表現。拒否や信じられない気持ちを表すので、場面に注意。'),
  1562: p('特別なことはない', 'nothing + 形容詞', 'nothing を説明する形容詞は後ろに置く。'),
  1564: p('遠慮なくどうぞ', 'feel free to + 動詞', '自由に行ってよいと相手に伝える。'),
  1565: p('自由に取ってどうぞ', 'help yourself to + 飲食物', '相手に飲食物を自由に取るよう勧める決まり文句。'),
  1566: p('よろしく伝える', 'say hello to + 人', 'ここでは直接挨拶するのでなく、人によろしく伝えてほしいという依頼。'),
  1573: p('条件によって変わる', 'depend on + 名詞', '何に左右されるかを on の後に置く。'),
  1574: p('助けへの応答', 'That would help.', '相手の提案が実現したら助かる、と would で柔らかく伝える。'),
  1575: p('提案を了承する', "That's fine with me.", '自分にとってその提案で差し支えないと伝える。'),
  1576: p('よい知らせへの反応', "That's good to hear.", '聞けてよかったという反応。to hear が何についてよいのかを示す。'),
  1578: p('挨拶を返す', 'The same to you.', 'よい休日を、などの挨拶に同じ願いを返す。どの挨拶にも使えるわけではない。'),
  1580: p('足元への注意', 'Watch your step.', 'watch はここでは気をつけること。段差や滑りやすい場所で使う。'),
  1582: p('残念な気持ち', 'What a + 名詞!', 'What a ...! は感嘆文。この shame は恥というより残念なこと。'),
  1584: p('意見を尋ねる', 'What do you think of + 名詞?', '対象にどんな意見や印象を持つかを尋ねる。'),
  1585: p('特徴を尋ねる', 'What is + 主語 + like?', 'どんな様子かを尋ねる。like は動詞の「好む」ではない。'),
  1587: p('くだけた声かけ', "What's up?", '親しい相手への挨拶や、どうしたのかを尋ねる表現。'),
  1589: p('不具合を尋ねる', "What's wrong with + 名詞?", '何の調子が悪いかを with の後に置く。'),
  1596: p('強く同意する', 'You can say that again.', '言い直しを求めるのではなく「まったくそのとおり」という慣用表現。'),
  1599: p('聞き返して確認する', 'You mean + 文?', '相手の意図を自分の言葉で確認する、会話での質問の形。'),
  1600: p('道順の案内', "You'll find it on your left.", '行けば左側に見つかる、と道順を案内する形。左右には on を使う。'),
  1118: p('人のためになる', 'do + 人 + good', 'do you good で健康や気分によい効果をもたらす。使役の make とは別の表現。'),
  1144: p('確実に実行する', 'see to it that + 文', 'that 以下のことが確実に行われるように手配・確認する。'),
  1155: p('人を取り違える', 'take A for B', 'AをBだと思い違いする。took は take の過去形。'),
  1207: p('〜だけでなく', 'A as well as B', 'BもそうだがAも、という追加。AとBの両方に注目する。'),
  1240: p('両方を強調する', 'not only A but also B', 'AだけでなくBも、と二つの性質や事柄をつなぐ。'),
  1336: p('〜かどうか', 'whether or not + 文', '二つの可能性のどちらなのか、という内容を文の中に入れる。'),
  1354: p('今や〜なので', 'Now that + 文, ...', '状況が整った・変わったことを理由として、その後の行動につなぐ。'),
  1403: p('〜するばかり', 'do nothing but + 動詞の原形', 'ここでの but は「〜以外」。ほかには何もしないという意味。'),
  1420: p('まるで〜のように', 'as if + 過去形', '現実とは違うように見える仮定を過去形で表す。この knew は単なる過去ではない。'),
};
export const pre2SentenceRows = `
1|1502|conversation|Either will do.|どちらでも構いません。
1|1503|conversation|By all means.|ぜひどうぞ。
1|1504|conversation|Calm down, please.|どうか落ち着いてください。
1|1506|offer|Certainly, ma'am.|かしこまりました（女性客へ）。
1|1507|conversation|Come on, let's go.|さあ、行こうよ。
1|1508|conversation|Congratulations on your success!|成功おめでとう！
1|1509|request|Could you tell me the way to the bank?|銀行への道を教えていただけますか。
1|1510|indirect|Could you tell me where the bus stops?|バスがどこに停まるか教えていただけますか。
2|1511|mind|Do you mind if I open the window?|窓を開けても構いませんか（気にしますか）。
1|1512|question|Does that mean we can leave now?|それは今出発できるという意味ですか。
1|1513|request|Could you give me a hand?|手を貸していただけますか。
1|1516|conversation|Guess what! I won the prize.|ねえ聞いて！賞を取ったよ。
1|1520|question|How come you are here?|どうしてここにいるの（くだけた言い方）。
1|1521|question|How do you like your new school?|新しい学校はどうですか（感想）。
1|1522|question|How was your trip to Canada?|カナダへの旅行はどうでしたか。
1|1524|conversation|I can't help it.|それはどうしようもありません。
1|1525|conversation|I guess so.|たぶんそうだと思います。
1|1526|conversation|I have an appointment with Dr. Smith.|スミス先生との診察予約があります。
2|1527|indirect|I have no idea where it is.|それがどこにあるか全くわかりません。
2|1529|indirect|I'd like to know if the room is free.|その部屋が空いているか知りたいです。
1|1531|conversation|I'll be back at five.|五時に戻ります。
1|1532|offer|I'll go get some water.|水を取ってきます。
1|1533|conversation|I'll miss you.|会えなくなると寂しいです。
1|1534|conversation|I'm afraid the tickets are sold out.|残念ですがチケットは売り切れです。
1|1535|conversation|I'm full, thank you.|おなかいっぱいです、ありがとう。
1|1536|conversation|I'm home!|ただいま！
1|1537|conversation|I'm just looking, thank you.|見ているだけです、ありがとう（店で）。
1|1538|conversation|I'm not sure about the date.|日付ははっきりわかりません。
1|1539|conversation|I'm sorry to hear that.|それを聞いてお気の毒に思います。
2|1540|indirect|I'm wondering if you can help me.|手伝っていただけないかと思っています。
1|1541|offer|You can stay here if you like.|よかったらここにいてもいいですよ。
1|1542|conversation|In that case, let's take a taxi.|それならタクシーに乗りましょう。
1|1543|question|Is it OK if I sit here?|ここに座っても大丈夫ですか。
1|1544|conversation|Is this for here or to go?|店内で召し上がりますか、お持ち帰りですか。
1|1545|conversation|It could take a while.|少し時間がかかるかもしれません。
1|1547|offer|It's on me today.|今日は私のおごりです。
1|1550|offer|Let me check the schedule.|予定を確認させてください。
1|1554|request|May I leave a message?|伝言をお願いできますか（電話で）。
1|1556|offer|May I take a message?|伝言をお預かりしましょうか。
1|1558|conversation|Neither do I.|私もそうではありません。
1|1560|conversation|No way!|まさか！・絶対に嫌だ！
1|1562|conversation|Nothing special.|特に何もありません。
1|1564|offer|Please feel free to ask questions.|どうぞ遠慮なく質問してください。
1|1565|offer|Please help yourself to some cake.|ケーキを自由にお取りください。
1|1566|request|Please say hello to your family.|ご家族によろしくお伝えください。
1|1573|conversation|That depends on the weather.|それは天気次第です。
1|1574|conversation|That would help a lot.|そうしていただけると大変助かります。
1|1575|conversation|That's fine with me.|私はそれで構いません。
1|1576|conversation|That's good to hear.|それを聞いてうれしいです。
1|1578|conversation|The same to you.|あなたもね（祝福への返答）。
1|1580|conversation|Watch your step.|足元に気をつけて。
1|1582|conversation|What a shame!|なんて残念なんでしょう。
2|1583|gerund|What do you say to going for a walk?|散歩に行くのはどうですか（提案）。
1|1584|question|What do you think of the new library?|新しい図書館についてどう思いますか。
1|1585|question|What is your hometown like?|あなたの故郷はどんな所ですか。
1|1587|conversation|What's up?|どうしたの・最近どう（くだけた挨拶）。
1|1589|question|What's wrong with this printer?|このプリンターはどこがおかしいのですか。
2|1590|gerund|When it comes to cooking, she is an expert.|料理のことなら彼女は専門家です。
2|1594|mind|Would you mind closing the door?|ドアを閉めていただけますか（気にしますか）。
2|1595|request|Would you put me through to Mr. Brown?|ブラウンさんにつないでいただけますか（電話）。
1|1596|conversation|You can say that again.|まったくそのとおりです。
1|1599|question|You mean we should wait here?|ここで待つべきということですか。
1|1600|conversation|You'll find it on your left.|それは左手にありますよ。
2|1601|opinion|I think that students need more sleep.|生徒にはもっと睡眠が必要だと思います。
3|1602|opinion|I strongly believe that exercise is important.|運動は大切だと強く信じています。
2|1603|opinion|In my opinion, reading is a useful hobby.|私の意見では読書は役立つ趣味です。
2|1604|reason|There are two reasons for that.|それには二つの理由があります。
2|1606|reason|First of all, we should listen to others.|まず第一に他の人の話を聞くべきです。
2|1609|reason|Second, it saves money.|第二に、それはお金の節約になります。
2|1611|reason|This is because buses carry many people.|これはバスが多くの人を運ぶからです。
2|1612|reason|One reason is that it reduces waste.|一つの理由はごみを減らせることです。
2|1613|reason|Another reason is that it is convenient.|もう一つの理由は便利なことです。
2|1615|reason|Take our school, for example.|例えば私たちの学校を取り上げてみましょう。
2|1616|opinion|We should use less plastic.|私たちはプラスチックの使用を減らすべきです。
2|1617|infinitive|It is necessary for us to save water.|私たちが水を節約することは必要です。
2|1619|reason|In addition, we can learn about nature.|さらに、自然について学べます。
3|1620|reason|Moreover, the service is free.|そのうえ、そのサービスは無料です。
3|1621|conjunction|On the one hand, cars are convenient.|一方では、車は便利です。
3|1622|conjunction|On the other hand, they cause pollution.|他方では、それらは汚染を引き起こします。
3|1623|conjunction|Some students walk, while others take a bus.|歩く生徒もいればバスに乗る生徒もいます。
3|1624|reason|Generally speaking, children enjoy games.|一般的に言って子供はゲームを楽しみます。
2|1626|reason|As a result, we used less energy.|結果として私たちは使うエネルギーを減らしました。
2|1627|reason|This means that we need a new plan.|これは新しい計画が必要だという意味です。
3|1628|reason|According to the report, prices are rising.|その報告によると物価は上がっています。
2|1629|reported|I hear that a new library will open.|新しい図書館が開くそうです。
3|1630|passive|It is said that the town is very old.|その町はとても古いと言われています。
3|1631|reason|For these reasons, I support the idea.|これらの理由で私はその考えを支持します。
2|1632|reason|That is why I want to join the club.|それが私がその部に入りたい理由です。
2|1105|gerund|I am used to getting up early.|私は早起きすることに慣れています。
2|1118|conversation|A short walk will do you good.|少し歩くとあなたのためになります。
2|1119|gerund|Thank you for helping me move.|引っ越しを手伝ってくれてありがとう。
2|1144|conjunction|See to it that the door is locked.|必ずドアに鍵がかかっているようにしてください。
2|1145|infinitive|I happened to meet her at the station.|駅で偶然彼女に会いました。
2|1155|conversation|I took him for his brother.|私は彼を彼の兄弟と間違えました。
2|1162|conjunction|I spoke slowly so that everyone could understand.|みんなが理解できるようにゆっくり話しました。
2|1207|conjunction|She plays the guitar as well as the piano.|彼女はピアノだけでなくギターも弾きます。
2|1240|conjunction|He is not only kind but also brave.|彼は親切なだけでなく勇敢でもあります。
2|1246|objectTo|I would like you to check this form.|あなたにこの用紙を確認していただきたいです。
3|1336|conjunction|Tell me whether or not you can come.|来られるかどうか教えてください。
3|1354|conjunction|Now that we are ready, let's begin.|もう準備ができたので始めましょう。
3|1403|infinitive|He did nothing but complain.|彼は不平を言うばかりでした。
3|1420|subjunctive|He talks as if he knew everything.|彼は何でも知っているかのように話します。
2|0|perfect|How long have you lived in this neighborhood?|この近所にどのくらい住んでいますか。
2|0|perfect|She has worked here since she graduated.|彼女は卒業してからここで働いています。
2|0|perfect|Have you ever taken part in a debate?|討論に参加したことはありますか。
2|0|perfect|I have just finished my application.|申請書をちょうど書き終えたところです。
2|0|perfect|He has not replied to my message yet.|彼はまだ私のメッセージに返事をしていません。
2|0|perfect|We have been waiting for thirty minutes.|私たちは三十分間ずっと待っています。
3|0|pastPerfect|The train had left when we arrived.|私たちが着いたとき電車は出発した後でした。
3|0|pastPerfect|I had never seen snow before I moved here.|ここへ越すまで雪を見たことがありませんでした。
3|0|pastPerfect|She had already eaten when I called.|電話したとき彼女はもう食事を済ませていました。
2|0|passive|These products are made from recycled paper.|これらの製品は再生紙で作られています。
2|0|passive|The concert was canceled because of the storm.|嵐のためにコンサートは中止されました。
2|0|passive|This form must be signed by a parent.|この用紙には保護者の署名が必要です。
3|0|passive|The new hospital will be built next year.|新しい病院は来年建設されます。
3|0|passive|The room is being cleaned now.|部屋は今清掃されているところです。
2|0|relative|The woman who lives next door is a nurse.|隣に住んでいる女性は看護師です。
2|0|relative|This is the camera that I bought yesterday.|これが昨日買ったカメラです。
3|0|relative|I know a boy whose father is a pilot.|父親がパイロットの少年を知っています。
3|0|relative|This is the town where I grew up.|ここは私が育った町です。
3|0|relative|I remember the day when we first met.|初めて会った日のことを覚えています。
2|0|participle|Look at the girl carrying a red bag.|赤いかばんを持っている女の子を見て。
2|0|participle|The language spoken in Brazil is Portuguese.|ブラジルで話される言語はポルトガル語です。
2|0|participle|The broken window must be replaced.|割れた窓は取り替える必要があります。
2|0|objectTo|My teacher encouraged me to enter the contest.|先生は私に大会への参加を勧めました。
2|0|objectTo|They do not allow us to use phones here.|ここでは私たちが電話を使うことは許されません。
2|0|objectTo|Please remind me to send the invitation.|招待状を送るのを忘れないよう言ってください。
2|0|causative|My parents let me choose my own clothes.|両親は私に自分の服を選ばせてくれます。
2|0|causative|The movie made me feel happy.|その映画で私は幸せな気分になりました。
2|0|causative|I saw him crossing the street.|彼が道路を渡っているところを見ました。
2|0|gerund|She avoided driving in heavy snow.|彼女は大雪の中での運転を避けました。
2|0|gerund|Would you mind waiting outside?|外で待っていただけますか（気にしますか）。
2|0|gerund|We look forward to hearing from you.|あなたからのご連絡を楽しみにしています。
2|0|gerund|He left without saying goodbye.|彼はさよならを言わずに立ち去りました。
2|0|gerund|The book is worth reading twice.|その本は二度読む価値があります。
2|0|infinitive|I was surprised to hear the news.|その知らせを聞いて驚きました。
2|0|infinitive|She went to the library to do research.|彼女は調査をするため図書館へ行きました。
2|0|infinitive|The box is too heavy for me to carry.|その箱は重すぎて私には運べません。
2|0|infinitive|He is old enough to travel alone.|彼は一人で旅行できる年齢です。
2|0|comparison|This method is much easier than the old one.|この方法は以前の方法よりずっと簡単です。
2|0|comparison|The new train is twice as fast as the bus.|新しい電車はバスの二倍の速さです。
2|0|comparison|This is one of the oldest temples in Japan.|これは日本で最も古い寺の一つです。
3|0|comparison|The more you practice, the better you get.|練習すればするほど上達します。
3|0|comparison|I prefer reading to watching television.|私はテレビを見るより読書が好きです。
2|0|condition|We will stay inside unless the rain stops.|雨がやまない限り私たちは中にいます。
2|0|condition|Please call me as soon as you arrive.|到着したらすぐに電話してください。
2|0|condition|If I have time tomorrow, I will help you.|明日時間があれば手伝います。
2|0|conjunction|Although it was cold, we enjoyed the walk.|寒かったけれど散歩を楽しみました。
2|0|conjunction|I listened to music while I was cooking.|料理をしている間、音楽を聞いていました。
2|0|conjunction|The bag was so heavy that I could not lift it.|かばんがとても重くて持ち上げられませんでした。
3|0|subjunctive|If I were you, I would ask the teacher.|私があなたなら先生に尋ねます。
3|0|subjunctive|I wish I could speak French.|フランス語を話せたらいいのに。
3|0|subjunctive|If I had more time, I would travel abroad.|もっと時間があれば海外へ旅行するのに。
3|0|reported|She said that she was looking for a job.|彼女は仕事を探していると言いました。
3|0|reported|He told me that he would return soon.|彼はすぐ戻ると私に言いました。
3|0|reported|She asked me where I lived.|彼女は私にどこに住んでいるか尋ねました。
2|0|indirect|Do you know how much this ticket costs?|この切符がいくらか知っていますか。
2|0|indirect|I wonder why he changed his mind.|なぜ彼が気を変えたのかと思います。
2|0|indirect|We haven't decided which bus to take.|どのバスに乗るかまだ決めていません。
2|0|question|How often should I water this plant?|どのくらいの頻度でこの植物に水をやるべきですか。
2|0|question|Why was the meeting put off?|なぜ会議は延期されたのですか。
2|0|question|Who is in charge of this project?|誰がこの計画を担当していますか。
2|0|question|What would you do in this situation?|この状況ならあなたはどうしますか。
2|0|question|Where can I apply for the volunteer program?|ボランティア活動にはどこで申し込めますか。
2|0|question|When will the results be announced?|結果はいつ発表されますか。
3|0|opinion|I believe that learning languages broadens our world.|言語を学ぶと世界が広がると信じています。
3|0|reason|For example, we can talk with people abroad.|例えば海外の人と話すことができます。
3|0|opinion|I agree that we should protect local nature.|地域の自然を守るべきだという意見に賛成です。
3|0|reason|One advantage is that we can save energy.|一つの利点はエネルギーを節約できることです。
3|0|reason|However, we also need to consider the cost.|しかし費用も考える必要があります。
3|0|opinion|I do not think that all homework is unnecessary.|すべての宿題が不要だとは思いません。
3|0|opinion|It is important to respect different opinions.|異なる意見を尊重することは大切です。
3|0|reason|In conclusion, small actions can make a difference.|結論として、小さな行動でも違いを生めます。
`.trim();
