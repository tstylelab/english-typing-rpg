import { FOCUSED_BATTLE_LABELS, type FocusedBattleKind } from './focusedBattle';

export default function FocusedBattleActions({ unseenCount, learningCount, onStart }: {
  unseenCount: number;
  learningCount: number;
  onStart: (kind: FocusedBattleKind) => void;
}) {
  return <section data-focused-battle-actions className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3">
    <h3 className="text-sm font-black text-cyan-100">今回だけ出題を絞る</h3>
    <p className="mt-1 text-xs leading-relaxed text-slate-300">同じ教材・モードで1バトル。次の通常バトルには引き継ぎません。</p>
    <div className="mt-2 grid grid-cols-2 gap-2">
      {(['unseen', 'learning'] as const).map(kind => {
        const count = kind === 'unseen' ? unseenCount : learningCount;
        return <button key={kind} type="button" data-focus-kind={kind} disabled={count === 0} onClick={() => onStart(kind)} className="min-h-11 rounded-lg border border-cyan-400/45 bg-slate-900/60 px-2 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-900/50 disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
          {FOCUSED_BATTLE_LABELS[kind]} <span className="inline-block text-xs">{count}問</span>
        </button>;
      })}
    </div>
    <details className="mt-2 text-xs leading-relaxed text-slate-400">
      <summary className="cursor-pointer">対象と終了について</summary>
      <p className="mt-1">「未出題」は出題記録のない問題です。以前の記録が不足している場合、取り組み済みの問題も含まれます。「学習中」は未出題を含む学習中の問題です。除外中は出題しません。</p>
      <p className="mt-1">同じ問題は1回だけ出題します。撃破・通常の問題数上限・対象の一巡のいずれかで終了します。一巡してもHPが残っていれば、撃破にはなりません。</p>
    </details>
  </section>;
}
