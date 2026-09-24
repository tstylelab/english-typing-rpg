// Original short sentences for Level 3: social issues, science, governance, and argumentation.
// Sentences are intentionally shorter than a reading passage so typing load does not mask comprehension.
export const grade1Grammar = {
  contrast: { label: '譲歩・対比', note: '一方の事実を認めたうえで、反対方向の主張につなげます。', pattern: 'Although A, B / While A, B' },
  condition: { label: '条件', note: '条件が満たされた場合に限る、または満たされなければどうなるかを示します。', pattern: 'If A, B / Unless A, B' },
  passive: { label: '受け身', note: '行為を受けるものを主語に置き、結果や影響を前に出します。', pattern: 'A is / was + 過去分詞' },
  relative: { label: '関係詞', note: '直前の名詞に説明を加え、主語や対象を明確にします。', pattern: '名詞 + that / which / who ...' },
  cause: { label: '原因と結果', note: '理由と結果をつなぎ、主張の根拠を伝えます。', pattern: 'Because A, B / A led to B' },
  modality: { label: '可能性・提案', note: '断定を避けたり、必要な対応を示したりします。', pattern: 'may / could / should + 動詞' },
  comparison: { label: '比較・程度', note: '二つの状況を比較し、差の大きさを表します。', pattern: 'more / less ... than ...' },
  nounclause: { label: '内容を表す節', note: 'that 以下を主張・証拠・事実の内容としてまとめます。', pattern: 'The evidence suggests that ...' },
} as const;

export const grade1SentenceRows = `
1|contrast|Although the policy reduced costs, it also limited access.|その政策は費用を減らしたが、利用の機会も制限した。
1|cause|The drought forced many families to leave the region.|干ばつで多くの家族がその地域を離れざるを得なかった。
1|passive|The report was reviewed by independent scientists.|報告書は独立した科学者に検証された。
1|condition|If the evidence is weak, the case should be reconsidered.|証拠が弱いなら、その事件は再検討すべきだ。
1|relative|The law that protects workers will take effect next year.|労働者を守る法律は来年施行される。
1|modality|Local governments should prepare for extreme weather.|地方自治体は異常気象に備えるべきだ。
1|comparison|The new method uses less energy than the old one.|新しい方法は旧式より少ないエネルギーで済む。
1|nounclause|The data suggests that the disease is spreading slowly.|データはその病気がゆっくり広がっていることを示す。
1|contrast|While the plan is ambitious, its funding remains uncertain.|計画は意欲的だが、資金の見通しはなお不確かだ。
1|cause|Public trust declined because the agency hid the results.|機関が結果を隠したため、公的な信頼が下がった。
1|passive|Several villages were damaged by the sudden flood.|いくつかの村が突然の洪水で被害を受けた。
1|condition|Unless we conserve water, shortages may become common.|節水しなければ、水不足が常態化しかねない。
1|relative|The researcher who developed the test received an award.|その検査を開発した研究者が賞を受けた。
1|modality|The company may need to change its safety procedures.|その会社は安全手順を変える必要があるかもしれない。
1|comparison|This treatment is more effective than the previous one.|この治療法は以前のものより効果的だ。
1|nounclause|Many voters believe that the reform will improve fairness.|多くの有権者は改革が公平さを高めると考えている。
1|contrast|Although the vaccine is safe, some people remain concerned.|ワクチンは安全だが、なお不安を持つ人もいる。
1|cause|Poor housing can increase the risk of illness.|住環境が悪いと病気のリスクが高まることがある。
1|passive|The ancient site was discovered during road construction.|その古代遺跡は道路工事中に発見された。
1|condition|If the population grows, the city will need more schools.|人口が増えれば、市にはさらに学校が必要になる。
1|relative|The device that monitors air quality is easy to use.|空気の質を測るその装置は使いやすい。
1|modality|We should distinguish facts from political propaganda.|私たちは事実と政治的宣伝を区別すべきだ。
1|comparison|Rural areas have fewer doctors than large cities.|地方には大都市より医師が少ない。
1|nounclause|The study found that children benefit from outdoor play.|研究は屋外遊びが子どもに良いと分かった。
1|contrast|While the trial failed, it revealed an important problem.|試験は失敗したが、重要な問題を明らかにした。
1|cause|The new rules led to a sharp drop in pollution.|新しい規則によって汚染が急減した。
1|passive|The accused person was released after new evidence emerged.|新たな証拠が出て、被告人は釈放された。
1|condition|Unless the budget rises, the project cannot continue.|予算が増えなければ、その事業は続けられない。
1|relative|The senator who proposed the bill defended its aims.|法案を提出した上院議員は、その目的を擁護した。
1|modality|A small error could undermine the entire experiment.|小さなミスでも実験全体を損なう可能性がある。
1|comparison|The benefits are greater than the immediate costs.|恩恵は目先の費用を上回る。
1|nounclause|The survey shows that public opinion has shifted.|調査は世論が変化したことを示している。
1|contrast|Although the evidence is limited, the risk cannot be ignored.|証拠は限られるが、危険を無視はできない。
1|cause|The closure left hundreds of workers without jobs.|閉鎖で何百人もの労働者が職を失った。
1|passive|The results were published before the election.|結果は選挙前に公表された。
1|condition|If both sides cooperate, they can resolve the dispute.|双方が協力すれば、争いを解決できる。
1|relative|The program that supports small farms has expanded.|小規模農家を支える事業が拡大した。
1|modality|Governments must protect the rights of indigenous people.|政府は先住民の権利を守らなければならない。
1|comparison|The river is cleaner now than it was a decade ago.|その川は十年前より今のほうがきれいだ。
1|nounclause|Experts warn that the current system is unsustainable.|専門家は現行制度が持続不可能だと警告する。
2|contrast|Although the economy recovered, inequality continued to widen.|景気は回復したが、格差は広がり続けた。
2|cause|The false claim sparked a wave of public criticism.|誤った主張が、世論の批判の波を引き起こした。
2|passive|The minister was accused of withholding crucial information.|大臣は重要な情報を隠したとして非難された。
2|condition|Unless the treaty is enforced, illegal trade will persist.|条約が実施されなければ、違法取引は続くだろう。
2|relative|The evidence that supported the claim was later discredited.|その主張を裏付けた証拠は、後に信用を失った。
2|modality|The court may overturn the earlier conviction.|裁判所は以前の有罪判決を覆すかもしれない。
2|comparison|The damage was far more severe than officials had expected.|被害は当局の予想よりはるかに深刻だった。
2|nounclause|The findings indicate that the treatment has long-term effects.|結果はその治療に長期的影響があることを示す。
2|contrast|While the technology is promising, its risks remain unclear.|その技術には期待が持てるが、リスクはなお不明だ。
2|cause|Repeated delays eroded confidence in the project.|度重なる遅れで、事業への信頼が損なわれた。
2|passive|Thousands were displaced when the conflict intensified.|紛争が激化し、何千人も住まいを追われた。
2|condition|If the data is accurate, the policy needs urgent revision.|データが正しければ、政策は早急に見直す必要がある。
2|relative|The officials who approved the contract faced investigation.|契約を承認した職員たちは調査を受けた。
2|modality|Leaders should address the cause rather than the symptom.|指導者は表面の症状でなく原因に対処すべきだ。
2|comparison|The proposal is less costly than a complete replacement.|その提案は全面的な交換より費用が少ない。
2|nounclause|Researchers concluded that the species was endangered.|研究者たちは、その種が絶滅危惧種だと結論づけた。
2|contrast|Although both sides sought peace, neither would compromise.|双方が平和を求めたが、どちらも譲歩しなかった。
2|cause|A loophole allowed the firm to avoid the restriction.|規則の抜け穴により、その会社は制限を免れた。
2|passive|The suspect was exonerated after the records were reexamined.|記録を再調査した後、容疑者の無実が証明された。
2|condition|Unless emissions fall, the damage may be irreversible.|排出量が減らなければ、被害は元に戻せないかもしれない。
2|relative|The study which examined rural hospitals revealed a shortage.|地方病院を調べた研究が人手不足を明らかにした。
2|modality|New evidence could alter our interpretation of the event.|新たな証拠で、その出来事の解釈が変わる可能性がある。
2|comparison|This explanation is more convincing than the earlier one.|この説明は前のものより説得力がある。
2|nounclause|The inquiry revealed that officials had ignored warnings.|調査で、職員たちが警告を無視していたと分かった。
2|contrast|While aid arrived quickly, clean water remained scarce.|援助はすぐ届いたが、きれいな水は不足したままだった。
2|cause|The campaign helped dispel the stigma surrounding the illness.|その運動は病気に対する偏見をなくす助けとなった。
2|passive|The findings were challenged by several independent experts.|その結果には複数の独立した専門家が異議を唱えた。
2|condition|If officials act now, they can stave off a crisis.|当局が今動けば、危機を食い止められる。
2|relative|The families whose homes were flooded received support.|家が浸水した家族に支援が届いた。
2|modality|The agency must verify the figures before publishing them.|機関は数字を公表する前に確認しなければならない。
2|comparison|The new law offers stronger protection than the old one.|新しい法律は旧法より強い保護を与える。
2|nounclause|Witnesses claimed that the officer had altered the report.|目撃者たちは職員が報告書を改ざんしたと主張した。
2|contrast|Although the measure is unpopular, it may reduce waste.|その対策は不人気だが、無駄を減らすかもしれない。
2|cause|The drought drove more people to migrate to cities.|干ばつにより、さらに多くの人が都市へ移住した。
2|passive|The final decision was postponed until further evidence arrived.|最終決定は追加の証拠が届くまで延期された。
2|condition|Unless the parties reach an agreement, the strike will continue.|双方が合意しなければ、ストライキは続くだろう。
2|relative|The journalist who exposed the scandal received threats.|不祥事を暴いた記者は脅迫を受けた。
2|modality|Policy makers should consider the long-term consequences.|政策担当者は長期的な結果を考慮すべきだ。
2|comparison|The potential harm outweighs the short-term benefit.|潜在的な害は短期的な恩恵を上回る。
2|nounclause|The committee agreed that more oversight was necessary.|委員会は、さらに監督が必要だと合意した。
`.trim();
