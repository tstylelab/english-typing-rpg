import { BookOpen, Brain, LayoutGrid, Sword, Target, Volume2 } from 'lucide-react';

type HelpScreenProps = {
  onBack: () => void;
};

export default function HelpScreen({ onBack }: HelpScreenProps) {
  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 text-white">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 rounded-full border border-slate-600 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-slate-400 hover:text-white"
        >
          ← タイトルへ
        </button>

        <div className="rounded-3xl border border-slate-700 bg-slate-800/80 p-5 shadow-2xl md:p-6">
          <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_58%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(12,18,32,0.92))] p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">How To Play</p>
              <h1 className="mt-2 text-2xl font-black md:text-3xl">遊び方を覚えて、そのまま学べるゲームです</h1>
              <p className="mt-3 text-sm leading-7 text-slate-200 md:text-base">
                英単語や表現を見て、聞いて、打って覚える学習RPGです。1問ごとに練習しながら進められるので、
                タイピングに慣れていない場合でも少しずつ力をつけられます。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
                <div className="flex items-center gap-2 text-blue-200">
                  <Sword size={18} />
                  <h2 className="text-lg font-black text-white">まずはこの順番で進めるのがおすすめ</h2>
                </div>
                <div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                  <p>1. 難易度を選ぶ</p>
                  <p>2. Level を選ぶ</p>
                  <p>3. まずは Basic Training で確認する</p>
                  <p>4. 慣れてきたら Listening Battle や Translation Battle に挑戦する</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
                <div className="flex items-center gap-2 text-emerald-200">
                  <Target size={18} />
                  <h2 className="text-lg font-black text-white">学習の基本</h2>
                </div>
                <div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                  <p>単語を正しく打てると敵にダメージを与えられます。</p>
                  <p>ミスが多い問題はあとで復習しやすく残ります。</p>
                  <p>ボス戦では限られた問題数の中で勝ち切れるかが大切です。</p>
                  <p>Challenge Mode の後半は、スピードと正確さの両方が試されます。</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2 text-violet-200">
                <LayoutGrid size={18} />
                <h2 className="text-lg font-black text-white">モードの使い分け</h2>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-200">
                  <p className="font-bold text-white">Basic Training</p>
                  <p className="mt-1">まず単語を見て意味を確認したいときの基本モードです。</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-200">
                  <p className="font-bold text-white">Listening Training</p>
                  <p className="mt-1">音を聞いて覚えたいときの練習モードです。</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-200">
                  <p className="font-bold text-white">Listening Battle</p>
                  <p className="mt-1">音声だけを頼りに戦う、耳を使うチャレンジです。</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-200">
                  <p className="font-bold text-white">Translation Battle</p>
                  <p className="mt-1">日本語の意味を見て英単語を思い出す実戦型モードです。</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5">
              <div className="flex items-center gap-2 text-cyan-200">
                <Volume2 size={19} />
                <h2 className="text-lg font-black text-white">連続再生で耳から復習する</h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                トップ画面の「連続再生」を押すと、現在選んでいる教材を、最後に使った設定のまま自動で読み上げます。
                初めて使うときは「苦手語だけ・通常順」が選ばれています。
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-cyan-500/25 bg-slate-950/70 p-4 text-sm leading-7 text-slate-200">
                  <p className="font-black text-cyan-100">連続再生</p>
                  <p className="mt-1">保存されている設定ですぐに再生を始めます。再生中の単語・和訳・例文を確認でき、途中で停止することもできます。</p>
                </div>
                <div className="rounded-xl border border-slate-600 bg-slate-950/70 p-4 text-sm leading-7 text-slate-200">
                  <p className="font-black text-white">再生設定</p>
                  <p className="mt-1">再生する範囲、内容、順番、間隔、速度、リピート、シャッフルなどを変更できます。変更した設定は自動保存され、次回も使われます。</p>
                </div>
              </div>
              <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm leading-7 text-amber-50">
                苦手語がまだ0件のときは再生されません。「再生設定」を開き、「このレベル全部」など別の再生元を選んでください。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5">
                <div className="flex items-center gap-2 text-amber-200">
                  <Brain size={18} />
                  <h2 className="text-lg font-black text-white">上達のコツ</h2>
                </div>
                <div className="mt-3 space-y-2 text-sm leading-7 text-slate-100">
                  <p>読めなかった問題は、あとで反復練習すると定着しやすくなります。</p>
                  <p>Word List で意味を確認して、苦手なものは Weakness で集中練習できます。</p>
                  <p>Learning Progress を見ながら、覚えた数が増えていく感覚をつかんでください。</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
                <div className="flex items-center gap-2 text-cyan-200">
                  <BookOpen size={18} />
                  <h2 className="text-lg font-black text-white">よく使う画面</h2>
                </div>
                <div className="mt-3 space-y-2 text-sm leading-7 text-slate-200">
                  <p>図鑑: 倒したモンスターを確認できます。</p>
                  <p>単語リスト: 収録語の確認、復習、連続再生の管理ができます。</p>
                  <p>設定: 音声や表示、学習データを管理できます。</p>
                  <p>プレイヤー管理: プレイヤーごとの進捗を分けて保存できます。</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
              <p className="text-lg font-black text-white">少しずつ覚えて、毎日より強くなれます。</p>
              <p className="mt-2 text-sm leading-7 text-emerald-50">
                まずは気軽に数問だけでも大丈夫です。続けるほど、聞く力と打つ力が自然に結びついていきます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
