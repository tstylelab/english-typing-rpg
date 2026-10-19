// Original teaching drafts. No exam sentences are copied and no runtime data is edited.
// Each target has three contexts; the eventual additions need approval before implementation.
const target=(id,group,title,pattern,note,formNote,examples,extension=false)=>({id,group,title,pattern,note,formNote,examples,extension});
export const plans={
 Eiken1Part1:[
  target('perfect-passive','受け身・報告','現在完了の受け身','has/have been + 過去分詞','過去の行為の結果が今につながることを、行為を受ける対象から述べます。','行為を受けた対象を主語にし、現在につながる完了を表します。',[
   ['The safety rules have been revised in response to complaints.','苦情を受けて、安全規則は改訂されています。'],
   ['Several errors have been identified in the original report.','元の報告書で、いくつかの誤りが見つかっています。'],
   ['The proposal has been approved by an independent committee.','その提案は、独立した委員会によって承認されています。'],
  ]),
  target('progressive-passive','受け身・報告','進行形の受け身','is/are being + 過去分詞','対象が現在処理されている最中だと伝えます。単に処理済みという結果と区別します。','行為を受ける対象を主語にし、今その処理が進行中だと表します。',[
   ['The new system is being tested under realistic conditions.','新しいシステムは、実際に近い条件下で試験されているところです。'],
   ['The remaining samples are being examined for contamination.','残りの試料は、汚染がないか調べられているところです。'],
   ['The disputed figures are being reviewed by outside experts.','疑義のある数値は、外部の専門家によって検証されているところです。'],
  ]),
  target('modal-perfect','受け身・報告','過去への推量','may have + 過去分詞','過去に何かをした可能性を述べます。mayの後ろはhave、その後ろが過去分詞です。','過去の行為の可能性を、助動詞と完了形で述べます。別の推量の助動詞も自然です。',[
   ['The researchers may have overlooked an important variable.','研究者たちは、重要な変数を見落としていたのかもしれません。'],
   ['The agency may have underestimated the cost of maintenance.','その機関は、維持費を過小評価していたのかもしれません。'],
   ['The witnesses may have confused the order of events.','目撃者たちは、出来事の順序を取り違えていたのかもしれません。'],
  ]),
  target('modal-perfect-passive','受け身・報告','過去の対応を振り返る受け身','should have been + 過去分詞','過去にされるべきだったのにされなかった対応を、受け身で振り返ります。','実際にはされなかった対応への批判です。対象を主語にし、助動詞・完了形・受け身を組み合わせます。',[
   ['The risks should have been disclosed before the trial began.','その危険性は、試験が始まる前に開示されるべきでした。'],
   ['Local residents should have been consulted before construction.','地元の住民は、建設前に意見を聞かれるべきでした。'],
   ['The conflicting results should have been examined more closely.','食い違う結果は、もっと詳しく検討されるべきでした。'],
  ]),
  target('impersonal-report','受け身・報告','形式主語を使う伝達の受け身','It is believed that + 文','誰かの判断・報告を受け身で伝え、that節を内容にします。話し手による事実の保証とは区別します。','形式主語で始め、信じられている内容を後ろの節で示す伝達の受け身です。',[
   ['It is believed that output fell before prices increased.','価格が上がる前に、生産量が減ったと考えられています。'],
   ['It is believed that the species once inhabited this valley.','その種は、かつてこの谷に生息していたと考えられています。'],
   ['It is believed that poor drainage contributed to the damage.','排水の悪さが、その被害の一因になったと考えられています。'],
  ]),
  target('personal-report-perfect','受け身・報告','伝達の受け身と完了不定詞','主語 + is believed to have + 過去分詞','現在の見解と、それ以前の出来事を分けます。to have以下は主語について信じられている過去の内容です。','対象を主語にする伝達の受け身です。過去の内容を完了不定詞で続けます。',[
   ['The settlement is believed to have existed for centuries.','その集落は、何世紀にもわたって存在していたと考えられています。'],
   ['The policy is believed to have reduced access to housing.','その政策は、住宅を利用できる機会を減らしたと考えられています。'],
   ['The leak is believed to have originated in an old pipeline.','その漏出は、古い配管で発生したと考えられています。'],
  ]),
  target('mandative-verb','提案・形式構文','提案を表す節の原形','recommend that + 主語 + 原形','提案の内容をthat節に入れ、その節では三人称単数でも原形にする形を練習します。shouldを使う形も自然です。','提案の内容を接続詞の節で続け、三人称単数でも原形にする形です。助動詞を足さずに練習します。',[
   ['The panel recommended that the agency publish the full report.','委員会は、その機関が報告書の全文を公表することを勧告しました。'],
   ['The auditors recommended that the firm revise its procedures.','監査担当者たちは、その会社が手順を見直すことを勧告しました。'],
   ['The adviser recommended that each applicant submit a summary.','助言者は、各応募者が要約を提出することを勧めました。'],
  ]),
  target('mandative-adjective','提案・形式構文','必要性を表す節の原形','It is essential that + 主語 + 原形','必要だと判断する内容を節で示します。この型のbeはis/areにせず原形で使います。','形式主語を先に置き、不可欠な内容を後ろの節で述べます。その節では動詞の原形を使います。',[
   ['It is essential that every participant be fully informed.','すべての参加者が十分な説明を受けていることが不可欠です。'],
   ['It is essential that the evidence be preserved for review.','再検証のために証拠を保全しておくことが不可欠です。'],
   ['It is essential that each region have access to clean water.','各地域できれいな水を利用できることが不可欠です。'],
  ]),
  target('relative-object','関係詞・情報の焦点','目的格の関係代名詞','名詞 + that + 主語 + 動詞','関係節の中に目的語が欠けており、その内容が前の名詞です。主格の関係詞との違いを確かめます。','名詞を説明する節の目的語を関係代名詞にします。省略せず、別表現欄以外の関係代名詞で練習します。',[
   ['The evidence that the team collected contradicted the claim.','そのチームが集めた証拠は、その主張と矛盾していました。'],
   ['The restrictions that the council imposed remain controversial.','議会が課した制限は、今も議論を呼んでいます。'],
   ['The resources that the project requires are not yet available.','その事業が必要とする資源は、まだ利用できません。'],
  ]),
  target('nonrestrictive','関係詞・情報の焦点','名詞への非制限の補足','主語の名詞, which + 補足, 主節の続き','すでに特定された対象にコンマで補足を挟みます。対象を絞り込む関係節とは区別します。','すでに特定されたものへの補足を、コンマで区切る関係詞節として主語の後ろに挟みます。',[
   ['The new database, which is freely accessible, needs updating.','その新しいデータベースは更新が必要です。なお、無料で利用できます。'],
   ['The coastal road, which floods frequently, will be rebuilt.','その海岸沿いの道路は再整備されます。なお、頻繁に浸水します。'],
   ['The revised policy, which takes effect in May, has critics.','その改訂された政策には批判者がいます。なお、5月に施行されます。'],
  ]),
  target('sentential-which','関係詞・情報の焦点','前の内容全体を受ける関係詞','主節, which + 動詞 ...','whichが直前の名詞だけでなく、前の節全体が述べる出来事を受けます。単数の出来事として扱います。','最初の節の出来事全体を受け、コンマの後ろで関係代名詞を使って反応・影響を述べます。',[
   ['The agency withheld the results, which angered local residents.','その機関は結果を公表しませんでした。そのことが地元の住民を怒らせました。'],
   ['The team shared its methods, which improved public confidence.','そのチームは方法を公開しました。そのことが人々の信頼を高めました。'],
   ['The cost doubled in a year, which forced a review of the plan.','費用は1年で2倍になりました。そのため、計画の再検討を余儀なくされました。'],
  ]),
  target('preposition-relative','関係詞・情報の焦点','前置詞を伴う関係詞','名詞 + 前置詞 + which + 主語 + 動詞','節の中の動詞や意味に合う前置詞を、whichの前に置きます。名詞だけで前置詞を決めません。','動詞や文の意味に合う前置詞を、関係代名詞の直前に置く形で練習します。',[
   ['The standards against which we assess safety are changing.','私たちが安全性を評価する際の基準は、変わりつつあります。'],
   ['The conditions under which the test was conducted were unusual.','その試験が行われた条件は、通常とは異なっていました。'],
   ['The evidence on which the judgment rests has been challenged.','その判断の根拠となる証拠には、異議が唱えられています。'],
  ]),
  target('perfect-participle','分詞・形式構文','完了形の分詞構文','Having + 過去分詞, 主節','主節より先に済んだ行為を分詞構文で示します。二つの行為の主体が同じかを確かめます。','先に済んだ行動を、完了形の分詞構文で文頭に置きます。主節と行動の主体は同じです。',[
   ['Having examined the evidence, the panel rejected the claim.','証拠を調べた後で、委員会はその主張を退けました。'],
   ['Having secured funding, the team began the survey.','資金を確保した後で、そのチームは調査を始めました。'],
   ['Having consulted residents, the council revised the proposal.','住民の意見を聞いた後で、議会は提案を修正しました。'],
  ]),
  target('result-participle','分詞・形式構文','結果を付け足す分詞構文','主節, 動詞-ing ...','前の節で起きたことから生じる結果を、コンマの後ろの分詞で続けます。目的を表す不定詞と区別します。','先に出来事を述べ、その結果をコンマの後ろの分詞のまとまりで付け足します。',[
   ['The bridge collapsed, cutting off access to several villages.','橋が崩落し、その結果、いくつかの村への道が断たれました。'],
   ['The rules changed abruptly, leaving many applicants confused.','規則が突然変わり、その結果、多くの応募者が混乱しました。'],
   ['The plant closed, forcing hundreds of workers to relocate.','工場が閉鎖し、その結果、何百人もの労働者が転居を強いられました。'],
  ]),
  target('formal-subject-whether','分詞・形式構文','形式主語と未確定の内容','It remains unclear whether + 文','itを仮の主語にし、何が不明なのかをwhether節で示します。条件のif節とは役割が違います。','形式主語を先に置き、依然として不明な内容を、後ろの「〜かどうか」の節で述べます。',[
   ['It remains unclear whether the benefits will outweigh the costs.','恩恵が費用を上回るかどうかは、依然として不明です。'],
   ['It remains unclear whether the policy has improved access.','その政策が利用の機会を改善したかどうかは、依然として不明です。'],
   ['It remains unclear whether the damage can be reversed.','その被害を元に戻せるかどうかは、依然として不明です。'],
  ]),
  target('formal-object','分詞・形式構文','形式目的語と不定詞','consider + it + 形容詞 + to不定詞','目的語itを先に置き、何を重要だと考えるかを不定詞で後ろに示します。','仮の目的語を置き、その重要性を述べ、行動の内容を後ろの不定詞で示します。',[
   ['We consider it vital to protect access to reliable information.','私たちは、信頼できる情報へのアクセスを守ることが極めて重要だと考えています。'],
   ['They consider it vital to preserve the original records.','彼らは、元の記録を保存しておくことが極めて重要だと考えています。'],
   ['She considers it vital to consult those affected by the policy.','彼女は、その政策の影響を受ける人々に意見を聞くことが極めて重要だと考えています。'],
  ]),
  target('not-until','焦点・発展','時を否定する語句と倒置','Not until + 時, 助動詞 + 主語 + 原形','否定を含む時の語句を前に置き、主節を倒置します。過去の一般動詞にはdidを補います。','「〜になって初めて」という時のまとまりを文頭に置き、主節の助動詞と主語を倒置します。',[
   ['Not until June did the agency release the full results.','6月になって初めて、その機関は結果の全体を公表しました。'],
   ['Not until the hearing did officials acknowledge the error.','公聴会になって初めて、当局者たちは誤りを認めました。'],
   ['Not until the final review did the team discover the flaw.','最終審査になって初めて、そのチームは欠陥を発見しました。'],
  ],true),
  target('cleft','焦点・発展','強調構文で焦点を示す','It was + 焦点 + that + 残りの文','強調する原因や対象をIt wasとthatの間に置きます。形式主語とは異なる構造です。','ある出来事をもたらした原因に焦点を当て、強調構文を使います。',[
   ['It was public pressure that prompted the investigation.','その調査のきっかけとなったのは、世論の圧力でした。'],
   ['It was a lack of oversight that allowed the fraud to continue.','不正を続かせることになったのは、監督の欠如でした。'],
   ['It was the unexpected cost that forced the project to close.','その事業を終了に追い込んだのは、予期しない費用でした。'],
  ],true),
  target('had-inversion','焦点・発展','過去の反実仮想と条件倒置','Had + 主語 + 過去分詞, would have + 過去分詞','実際とは違う過去をifなしで仮定します。hadを主語の前に置く条件節は、疑問文ではありません。','実際と異なる過去の条件を先に置き、接続詞を省いて助動詞を前に出します。結果も過去です。',[
   ['Had the warnings been heeded, the damage would have been less.','もし警告が聞き入れられていたら、被害はもっと小さかったでしょう。'],
   ['Had funding continued, the study would have been completed.','もし資金提供が続いていたら、その研究は完了していたでしょう。'],
   ['Had the records been preserved, we would have found the cause.','もし記録が保存されていたら、私たちは原因を突き止めていたでしょう。'],
  ],true),
  target('concessive-as','焦点・発展','形容詞を前に置く譲歩','形容詞 + as + 主語 + be, 主節','形容詞をasの前に出して、認める事実と予想に反する結果を結びます。理由のasとは区別します。','認める状態を表す形容詞を節の先頭に出し、接続詞と主語を続ける譲歩の型です。',[
   ['Limited as the funds were, the team completed the survey.','資金は限られていましたが、そのチームは調査を完了しました。'],
   ['Useful as the model is, it cannot predict every outcome.','そのモデルは有用ですが、すべての結果を予測することはできません。'],
   ['Severe as the damage was, essential services were restored.','被害は深刻でしたが、不可欠なサービスは復旧しました。'],
  ],true),
 ],
 Eiken1Part2:[
  target('unreal-present','条件・仮定','現在と異なる仮定','If + 主語 + 過去形, would + 原形','現在の事実から距離を置く条件と、そこから想像する結果を組み合わせます。','現状とは違うと仮定します。条件節は過去形、結果は助動詞と原形を使います。',[
   ['If access were more equitable, the policy would gain support.','もし利用の機会がもっと公平なら、その政策は支持を得るでしょう。'],
   ['If the process were transparent, public trust would improve.','もし手続きが透明なら、人々の信頼は高まるでしょう。'],
   ['If reliable data were available, we would revise the estimate.','もし信頼できるデータがあれば、私たちは推定値を修正するでしょう。'],
  ]),
  target('unreal-past','条件・仮定','過去と異なる仮定','If + had + 過去分詞, would have + 過去分詞','過去の事実とは違う条件を仮定し、実際とは違う過去の結果を想像します。','実際とは異なる過去の条件と、その場合の過去の結果を、条件節を先にして述べます。',[
   ['If the rules had been enforced, the losses would have been lower.','もし規則が徹底されていたら、損失はもっと少なかったでしょう。'],
   ['If the council had consulted residents, it would have avoided delays.','もし議会が住民の意見を聞いていたら、遅れを避けられたでしょう。'],
   ['If the evidence had been shared, the review would have been fairer.','もし証拠が共有されていたら、審査はもっと公平だったでしょう。'],
  ]),
  target('mixed-conditional','条件・仮定','過去の仮定と現在の結果','If + had + 過去分詞, would + 原形 + now','条件は過去、結果は現在という二つの時点を分けます。結果まで過去完了にしません。','条件は実際と違う過去、結果は今の状態です。条件節を先に置いて時点を使い分けます。',[
   ['If we had invested earlier, the network would be safer now.','もしもっと早く投資していたら、そのネットワークは今もっと安全でしょう。'],
   ['If she had accepted the post, she would be leading the inquiry now.','もし彼女がその職を引き受けていたら、今その調査を率いているでしょう。'],
   ['If the plant had closed, the town would have fewer jobs now.','もしその工場が閉鎖していたら、その町では今、雇用がもっと少ないでしょう。'],
  ]),
  target('provided','条件・仮定','満たす必要のある条件','主節 + provided that + 文','条件が満たされる場合に限るという意味を、主節の後ろの節で示します。providing thatなども自然です。','主節を先に置いて条件の節を続けます。自然な別表現欄以外の接続の形で練習します。',[
   ['The scheme can succeed provided that oversight remains independent.','監督の独立性が保たれるという条件なら、その制度は成功できます。'],
   ['We will share the data provided that privacy is protected.','プライバシーが守られるという条件なら、私たちはデータを共有します。'],
   ['The trial may proceed provided that every participant consents.','すべての参加者が同意するという条件なら、試験を進めても構いません。'],
  ]),
  target('even-if','譲歩・選択','仮の条件を認める譲歩','Even if + 文, 主節','その条件が起きても主節の判断は変わらないと述べます。事実を認めるeven thoughとの役割を比べます。','事実と確定していない条件を認めても判断は変わらない、という譲歩の条件節を先に置きます。',[
   ['Even if demand recovers, some firms will need further support.','たとえ需要が回復しても、一部の企業には追加の支援が必要になるでしょう。'],
   ['Even if the evidence is incomplete, we must assess the risks.','たとえ証拠が不完全でも、私たちは危険性を評価しなければなりません。'],
   ['Even if costs fall, equal access will remain a challenge.','たとえ費用が下がっても、公平な利用機会の確保は課題として残るでしょう。'],
  ]),
  target('whether-or','譲歩・選択','どちらの場合でもという譲歩','Whether + 文 + or not, 主節','肯定・否定のどちらでも主節が成り立つことを述べます。疑問の内容を動詞の目的語にする用法とは区別します。','〜する場合もしない場合もという節を先に置き、どちらでも必要な対応を続けます。',[
   ['Whether the policy succeeds or not, its effects must be monitored.','その政策が成功してもしなくても、影響を監視しなければなりません。'],
   ['Whether funding increases or not, essential services must continue.','資金が増えても増えなくても、不可欠なサービスは続けなければなりません。'],
   ['Whether demand rises or not, safety standards must be maintained.','需要が増えても増えなくても、安全基準は維持しなければなりません。'],
  ]),
  target('however-degree','譲歩・選択','程度にかかわらない譲歩','However + 形容詞 + 主語 + be, 主節','どれほどその性質が強くても、という意味でhoweverの後ろに形容詞を置きます。単なる逆接のhoweverと区別します。','どれほど〜であってもという程度の譲歩です。程度を表す一語の副詞の直後に形容詞を置きます。',[
   ['However convincing the claim is, it requires independent scrutiny.','その主張がどれほど説得力を持っていても、独立した検証が必要です。'],
   ['However urgent the need is, consent cannot be ignored.','その必要性がどれほど差し迫っていても、同意を無視することはできません。'],
   ['However severe the crisis is, basic rights must be protected.','危機がどれほど深刻であっても、基本的な権利は守らなければなりません。'],
  ]),
  target('regardless-whether','譲歩・選択','二つの可能性に左右されない','Regardless of whether + 文, 主節','前置詞ofの後ろに、どちらの可能性かというwhether節を置きます。名詞の後ろを説明する関係詞ではありません。','どちらの可能性でも方針は変わらないと述べます。前置詞の後ろに「〜かどうか」の節を置いて文頭にします。',[
   ['Regardless of whether it is profitable, the service is essential.','利益が出るかどうかにかかわらず、そのサービスは不可欠です。'],
   ['Regardless of whether costs rise, the contract remains binding.','費用が増えるかどうかにかかわらず、その契約の拘束力は続きます。'],
   ['Regardless of whether they agree, we must record their objections.','彼らが同意するかどうかにかかわらず、私たちは異議を記録しなければなりません。'],
  ]),
  target('partial-negative','否定・内容節','すべてではないという否定','Not all + 複数名詞 + 動詞','全体について成り立つことを否定します。一つも成り立たないという全面否定と区別します。','文頭で、複数の対象すべてに当てはまるわけではないという部分否定を使います。',[
   ['Not all policies that reduce costs improve public welfare.','費用を減らす政策が、すべて人々の福祉を向上させるわけではありません。'],
   ['Not all changes that increase efficiency benefit employees.','効率を高める変化が、すべて従業員の利益になるわけではありません。'],
   ['Not all claims that attract attention are supported by evidence.','注目を集める主張が、すべて証拠に裏付けられているわけではありません。'],
  ]),
  target('not-necessarily','否定・内容節','必ずそうなるとは限らない','主語 + do/does not necessarily + 原形','必然的な結び付きの否定で、結果そのものをすべて否定するのではありません。','二つの事柄の必然的な結び付きを否定します。一般動詞を否定し、副詞で「必ずとは限らない」を表します。',[
   ['Economic growth does not necessarily reduce inequality.','経済成長が、必ずしも格差を縮めるとは限りません。'],
   ['Greater transparency does not necessarily eliminate bias.','透明性が高まれば、必ず偏りがなくなるというわけではありません。'],
   ['Higher expenditure does not necessarily improve access.','支出が増えれば、必ず利用の機会が改善するというわけではありません。'],
  ]),
  target('neither-nor','否定・内容節','二つの対象の両方を否定する','Neither + A + nor + B + 動詞','二つの主語を結び、どちらも当てはまらないと述べます。今回は両方とも単数名詞です。','二つの主語を文頭から否定の対になる接続表現で結び、どちらも当てはまらないと表します。',[
   ['Neither the report nor the testimony provides clear evidence.','その報告書も証言も、明確な証拠を示していません。'],
   ['Neither the agency nor the contractor accepts responsibility.','その機関も請負業者も、責任を認めていません。'],
   ['Neither the model nor the estimate accounts for local variation.','そのモデルも推定も、地域ごとの違いを考慮していません。'],
  ]),
  target('appositive-that','否定・内容節','名詞の内容を示す節','The fact that + 完全文 + 主節','that節に文の要素の欠けがなく、前の名詞factの中身を表します。関係代名詞のthatと区別します。','事実を表す名詞を主語の中心にし、その内容を接続詞の節で続けます。その節は、関係詞節のように目的語などを欠く形ではありません。',[
   ['The fact that the figures differ does not prove dishonesty.','数値が異なるという事実は、不正直であることの証明にはなりません。'],
   ['The fact that costs fell does not justify every decision.','費用が下がったという事実は、すべての決定を正当化するものではありません。'],
   ['The fact that the trial failed does not invalidate the theory.','試験が失敗したという事実は、その理論を無効にするものではありません。'],
  ]),
  target('need-not-perfect','評価・比較','実際にしたが不要だった行為','need not have + 過去分詞','する必要がなかったのに実際にはした、という過去の行為を振り返ります。did not need toだけでは実行の有無は決まりません。','必要がなかったのに実際にはした、という行為です。否定の助動詞と完了形を使い、短縮しない形で述べます。',[
   ['The agency need not have withheld the entire report.','その機関は報告書の全文を非公開にする必要はなかったのに、そうしてしまいました。'],
   ['They need not have repeated the survey at such expense.','彼らはそこまで費用をかけて再調査する必要はなかったのに、そうしてしまいました。'],
   ['We need not have postponed the review for so long.','私たちはそんなに長く再検討を延期する必要はなかったのに、そうしてしまいました。'],
  ]),
  target('multiple-comparison','評価・比較','倍数を使う比較','倍数 + as + 原級 + as + 比較相手','形容詞や副詞の程度を倍数で比べます。比較級や数字の大小だけで文の形を決めません。','比較対象を後ろに置き、形容詞・副詞の原級を用いる倍数比較を練習します。',[
   ['The revised process is twice as efficient as the original one.','改訂後の工程の効率は、元の工程の2倍です。'],
   ['The new cells last three times as long as the earlier ones.','新しい電池は、以前のものの3倍長持ちします。'],
   ['The current network is twice as extensive as the old one.','現在のネットワークの広がりは、古いものの2倍です。'],
  ]),
  target('correlative-comparison','評価・比較','二つの変化の対応','The + 比較級 + 文, the + 比較級 + 文','〜すればするほど、という対応を示します。この構文だけで統計的な因果関係が証明されるわけではありません。','程度を表す二つの変化を、定冠詞と比較級で始まる節の組で表します。',[
   ['The longer the delay lasts, the harder recovery becomes.','遅れが長引くほど、回復は難しくなります。'],
   ['The more widely data is shared, the easier verification becomes.','データが広く共有されるほど、検証は容易になります。'],
   ['The less reliable the source is, the more caution we need.','情報源の信頼性が低いほど、私たちはより慎重になる必要があります。'],
  ]),
  target('rather-than-parallel','評価・比較','行動の選択と並列','主語 + chose to + 原形 + rather than + 原形','二つの行動を対比し、実際に選んだ行動を先に述べます。rather thanの後ろの原形を対応させます。','選んだ行動を不定詞で先に述べ、比較するもう一つの行動は後ろに原形で続けます。',[
   ['The council chose to revise the plan rather than abandon it.','議会は、計画を断念するのではなく修正することを選びました。'],
   ['The firm chose to retrain staff rather than dismiss them.','その会社は、職員を解雇するのではなく再訓練することを選びました。'],
   ['The team chose to disclose the error rather than conceal it.','そのチームは、誤りを隠すのではなく開示することを選びました。'],
  ]),
  target('no-sooner','倒置・発展','直後の出来事と倒置','No sooner had + 主語 + 過去分詞 + than + 文','先の出来事の直後に次が起こることを述べます。前半の過去完了と倒置、後半を導くthanを確認します。','ある出来事の直後に次のことが起きたと述べます。否定を含む比較表現を文頭に出し、前半を過去完了の倒置にします。',[
   ['No sooner had the rules changed than new problems emerged.','規則が変わるやいなや、新しい問題が起きました。'],
   ['No sooner had the inquiry begun than key records disappeared.','調査が始まるやいなや、重要な記録がなくなりました。'],
   ['No sooner had funding resumed than the project faced delays.','資金提供が再開するやいなや、その事業に遅れが生じました。'],
  ],true),
  target('negative-fronting','倒置・発展','否定の語句を前に出す強調','Under no circumstances + 助動詞 + 主語 + 原形','強い否定の条件を前に出し、助動詞を主語の前に置きます。疑問文として尋ねているのではありません。','どんな事情があっても許されないと述べます。否定の条件を表す前置詞句を文頭に置き、主節を倒置します。',[
   ['Under no circumstances should private records be made public.','どのような事情があっても、私的な記録を公表すべきではありません。'],
   ['Under no circumstances should consent be taken for granted.','どのような事情があっても、同意があると決めつけるべきではありません。'],
   ['Under no circumstances should the evidence be destroyed.','どのような事情があっても、証拠を破棄すべきではありません。'],
  ],true),
  target('should-condition','倒置・発展','万一の条件を倒置で示す','Should + 主語 + 原形, 主節','万一起きた場合を控えめに仮定します。義務のshouldとは異なり、条件節のifを省いた形です。','万一〜する場合という条件節を先に置き、接続詞を省いて助動詞と主語を倒置します。',[
   ['Should further evidence emerge, the inquiry will be reopened.','万一さらに証拠が出てきた場合には、その調査は再開されます。'],
   ['Should demand exceed supply, priority will be given to hospitals.','万一需要が供給を上回った場合には、病院が優先されます。'],
   ['Should the talks fail, an independent mediator will intervene.','万一協議が不調に終わった場合には、独立した仲介者が介入します。'],
  ],true),
  target('were-condition','倒置・発展','実現を距離を置いて仮定する','Were + 主語 + to + 原形, would + 原形','現実から距離を置く未来の仮定を、were toと条件倒置で表します。不可能だと断定する形ではありません。','今後のことを距離を置いて仮定します。条件節は接続詞を省き、助動詞と主語を入れ替え、不定詞を続けます。',[
   ['Were the scheme to fail, public confidence would suffer.','仮にその制度が失敗すれば、人々の信頼は損なわれるでしょう。'],
   ['Were funding to cease, several research teams would disband.','仮に資金提供が途絶えれば、いくつかの研究チームは解散するでしょう。'],
   ['Were the treaty to lapse, the region would face greater uncertainty.','仮に条約が失効すれば、その地域はさらに不確実な状況に直面するでしょう。'],
  ],true),
 ],
};
