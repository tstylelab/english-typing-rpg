# 英検4級 Level 3 和訳からの出題点検（2026-10-02）

現在のLevel 3全209問を、表示される和訳と英文の組で確認した。和訳だけで別の自然な英文が先に浮かぶ箇所を20問修正。変更前は今回の作業前に画面へ表示されていた文言で、元データの `translation` とは異なる場合がある。

英語の問題文、元の `translation`、順序、問題数、文法ポイント、採点、HP、保存済み学習記録の識別キーは変更しない。表示用和訳と和訳の読み上げだけを `grade4MeaningCorrections.json` で更新する。日本語だけで自然な英訳を完全に一意にすることはできないため、会話の場面や語句の最小限の手掛かりを付けた。

| 英文 | 変更前 | 変更後 | 修正理由 |
|---|---|---|---|
| Anything else? | ほかに何かありますか。 | （注文を聞いた店員が短く）ほかに何か？ | 接客中の短い追加質問と分かるようにする |
| Can I have some more water? | 水をもう少しいただけますか。 | 水をもう少しいただいてもいいですか（Can I haveを使う）？ | May I have との区別 |
| Would you like tea or coffee? | 紅茶とコーヒーのどちらがよいですか。 | 紅茶かコーヒーはいかがですか（Would you like）？ | 丁寧な申し出の形を示す |
| What happened to you? | あなた、どうしたのですか。 | あなたの身に何が起こったのですか？ | What's wrong? など現在の状態を尋ねる文と区別 |
| I have to go now. | もう行かなければなりません。 | 私はもう行かなければなりません（have toを使う）。 | must / need to との区別 |
| Just a moment, please. | 少々お待ちください。 | ほんの少しだけお待ちください（Justで始める）。 | Wait a moment との区別 |
| Why not? | いいですね（提案への返事）。 | （誘いへの返事）断る理由はないですね。いいですよ。 | 肯定の返事になる理由と表現の形をつなぐ |
| Could you open the door? | ドアを開けていただけますか？ | ドアを開けていただけますか（Could youで始める）？ | Can you との区別 |
| Would you like to join us? | 私たちと一緒に参加しませんか？ | 私たちに加わりませんか（Would you like toを使う）？ | join の意味と丁寧な誘いを示す |
| Please show me the way. | 私に道を教えてください。 | 私に道を示して案内してください。 | tell me the way などとの区別 |
| There is nobody in the room. | 部屋には誰もいません。 | 部屋には誰もいません（There isで始め、「誰も」は1語）。 | nobody と no one の語数の違いを示す |
| Everyone in my class likes music. | 私のクラスのみんなは音楽が好きです。 | 私のクラスの全員が音楽を好きです（Everyoneで始める）。 | everybody との区別 |
| Do you know anyone in London? | あなたはロンドンに知り合いがいますか？ | あなたはロンドンに知り合いがいますか（anyoneを使う）？ | anybody との区別 |
| Please be kind to animals. | 動物に親切にしてください。 | どうか動物に対して親切でいてください。 | treat animals kindly などより be kind to を思い浮かべやすくする |
| Can you lend me some money? | 私に少しお金を貸してくれますか？ | 私に少しお金を貸してくれますか（Can youで始める）？ | Could you との区別 |
| Nobody in my family likes coffee. | 私の家族にはコーヒーが好きな人はいません。 | 家族の誰もコーヒーが好きではありません（Nobodyで始める）。 | no one との区別 |
| Does anyone know the answer? | だれか答えを知っていますか？ | だれか答えを知っていますか（anyoneを使う）？ | anybody との区別 |
| There was no one at the bus stop. | バス停にはだれもいませんでした。 | バス停に誰もいませんでした（There was・「誰も」は2語）。 | nobody との語数の違いを示す |
| May I ask you a question? | あなたに質問してもよいですか。 | あなたに質問してもよろしいですか（May Iを使う）？ | Can I との区別 |
| I am looking forward to the school festival. | 私は学園祭を楽しみにしています。 | 私は学園祭を楽しみにしています（look forward toの形）。 | can't wait for などとの区別 |

`Anything else?`、`Please be kind to animals.`、`Why not?` は、2026-10-02に提供された画面の指摘。元の `translation` を変えずに表示を直すため、保存済みデータのキーは従来どおり。別解を自由入力として採点する機能の追加は今回の対象外。
