// Draft editorial plan only. This is not imported by the game.
import { writeFileSync } from 'node:fs';
import { load } from './lib/load-typescript-data.mjs';
const { QUESTIONS } = load('src/data/questions.ts');
const topics = {
  'embedded-question':'why / how / where＋主語＋動詞：疑問の内容を文に入れる',
  'what-clause':'what＋文：言いたいこと・意味することをひとまとまりにする',
  'agreement':'agree / be with / be for：賛成・同意の伝え方',
  'sense':'make sense / add up：意味が通る・筋が通る',
  'possibility':'may / might / could：可能性を示す',
  'partial':'up to a point / partly / in a way：同意の範囲を限定する',
  'empathy':'relate to / know what it is like：相手の経験・気持ちを理解する',
  'noun-phrase':'a fair point / a tough one：名詞のまとまりとone',
  'past-perfect':'had not＋過去分詞：過去のある時点より前を振り返る',
  'to-modifier':'a way / time to …：名詞を説明するto不定詞',
  'partial-negative':'not entirely / not always / not quite：否定の及ぶ範囲',
  'sure-clause':'not sure / convinced＋文：確信や留保の内容',
  'would-stance':'would / would not：仮の立場から述べる・断定を和らげる',
  'viewpoint':'see it differently：考え方・見方を伝える',
  'depend':'depend on＋名詞 / 疑問詞節：判断の条件を示す',
  'it-to':'It is＋形容詞＋to：行動を評価する',
  'progressive':'be＋ing：進行中・一時的な取り組み',
  'questions':'疑問詞の役割：主語を尋ねる文と一般の疑問文',
  'requests':'Could / Can you …：説明や例を頼む',
  'make-person':'make＋人＋動詞の原形：そう言う・感じる原因',
  'let':'Let me / Let us：自分にさせてもらう・一緒にする',
  'intro-fragment':'前置き・つなぎの断片：後ろに主節や説明を続ける',
  'make-clear':'make＋目的語＋形容詞：内容を明確にする',
  'worth':'worth＋名詞 / ing：試す・考える価値',
  'tendency':'tend to / be inclined to：傾向・控えめな意見',
  'perfect-change':'have come to …：考えの変化と現在',
  'contrast':'on the other hand / still / even so：異なる面をつなぐ',
  'reason':'for that reason：理由を受けて判断を伝える',
  'modal-perfect':'must have＋過去分詞：過去についての強い推量',
  'sound-seem':'sound / seem＋形容詞、sound like＋名詞',
  'blame-for':'blame＋人＋for＋ing：行動や感情を責める',
  'perfect-experience':'have＋過去分詞＋before：これまでの経験',
  'comparison':'not as … as / more … than：程度を比べる',
  'more-to':'There is more to … than …：見えている以上の事情',
  'rather':'would rather（not）＋原形：どちらを選びたいか',
  'should':'should＋原形：提案・望ましい対応',
  'that-content':'think / say＋文：意見や発言の内容',
  'modal-progressive':'may / might be＋ing：進行中の事柄についての推量',
  'too-to':'too＋形容詞＋to：〜するには程度が過ぎる',
  'hypothetical':'would＋動詞、if＋過去形：仮定した場合の判断',
  'chance':'There is a chance（that）…：可能性の内容',
  'not-necessarily':'not necessarily：必ずしもそうとは言えない',
  'saying-negative':'not saying＋文：発言・主張の範囲を限定する',
  'easier-said':'easier said than done：過去分詞を使った定型比較',
  'ready-to':'be ready / need / try＋to：準備・必要・試み',
  'cause':'lead to＋名詞：結果につながる',
  'conversation':'works for me / on the fence：会話での定型的な意味',
  'past-progressive':'was thinking：過去のそのとき考えていたこと',
  'relative-object':'the point（that）you are making：目的格関係詞の省略',
  'lets-not':'Let us not＋原形：一緒にしないようにしよう',
  'being':'be being＋形容詞：そのときの振る舞い・態度',
  'perception':'see＋目的語＋ing：起きている・起こる場面を思い描く',
  'wh-to':'what to make of …：どう受け止めるか',
};
// Each position was read against the present 75-question sequence, then frozen
// below with exact English so a later order change cannot silently reassign it.
const ids = {
  EikenPre1Part1: `embedded-question sense what-clause possibility partial agreement empathy noun-phrase past-perfect to-modifier partial-negative sure-clause partial-negative would-stance sure-clause possibility viewpoint depend depend it-to would-stance noun-phrase progressive to-modifier noun-phrase questions requests requests make-person that-content let what-clause intro-fragment intro-fragment intro-fragment what-clause intro-fragment what-clause what-clause let make-clear partial-negative intro-fragment intro-fragment worth intro-fragment tendency tendency perfect-change contrast contrast contrast contrast contrast partial reason partial embedded-question modal-perfect sound-seem blame-for perfect-experience would-stance empathy sound-seem noun-phrase comparison comparison more-to to-modifier would-stance possibility worth would-stance possibility`,
  EikenPre1Part2: `sound-seem rather should that-content modal-progressive too-to hypothetical possibility chance would-stance it-to embedded-question not-necessarily saying-negative should easier-said ready-to possibility sense sound-seem sure-clause ready-to cause rather that-content sound-seem conversation progressive partial-negative past-progressive conversation partial-negative partial-negative conversation noun-phrase possibility noun-phrase relative-object sure-clause requests make-person questions embedded-question would-stance would-stance sound-seem sure-clause modal-progressive embedded-question agreement agreement agreement ready-to lets-not embedded-question embedded-question progressive sound-seem sense conversation conversation progressive being ready-to what-clause let partial-negative perception embedded-question saying-negative ready-to sure-clause sure-clause possibility wh-to`,
};
const fragmentNotes = {
  'If I understand you correctly.':'if節だけの前置き。後ろに確認内容の主節を続ける形を解説する。',
  'To put it simply.':'独立した完全文ではなく、説明を導く前置き。',
  'To put it another way.':'言い換えを導く前置き。後ろに言い換えた内容が必要。',
  'When you put it that way.':'when節だけの断片。会話で後ろの反応が省略されることを説明する。',
  'If you ask me.':'「私に言わせれば」という前置き。単独の標準的完全文としない。',
  'From what I can tell.':'視点・根拠を限定する前置き。後ろに判断を続ける。',
  'The way I see it.':'見方を導く前置き。元データの句点と、完全な文の構造を混同しない。',
  'Sounds about right.':'会話でThat / Itが省略された形。主語を省く一般ルールにはしない。',
  'I can see that happening.':'文脈上は、物理的に見えるより「そうなることを想像できる」。',
  'I can see where you\'re coming from.':'出身地ではなく、考えに至った立場・背景への理解を表す。',
};
const courses = Object.entries(ids).map(([course, raw]) => {
  const questions=QUESTIONS[course][3]; const sequence=raw.split(' ');
  if(sequence.length!==questions.length) throw new Error(course+': '+sequence.length+'/'+questions.length);
  return {course, count:questions.length, entries:questions.map((q,i)=>{
    const id=sequence[i]; if(!topics[id])throw new Error(id);
    return {text:q.text,translation:q.translation,topicId:id,topic:topics[id],...(fragmentNotes[q.text]?{reviewNote:fragmentNotes[q.text]}:{})};
  })};
});
writeFileSync('docs/pre1-grammar-plan-2026-10-14.json',JSON.stringify({status:'editorial-draft-not-implemented',topics,courses},null,2)+'\n');
console.log('Draft plan: '+courses.reduce((n,c)=>n+c.count,0)+' exact sentences; not registered in the app');
