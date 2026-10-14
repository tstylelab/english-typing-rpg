import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FOCUSED_BATTLE_LABELS, type FocusedBattleKind } from './focusedBattle';
import { useBackdropDismiss } from './useBackdropDismiss';

export default function FocusedBattleActions({ unseenCount, learningCount, onStart }: {
  unseenCount: number;
  learningCount: number;
  onStart: (kind: FocusedBattleKind) => void;
}) {
  return <section data-focused-battle-actions>
    <details className="mb-1 text-xs leading-relaxed text-slate-400">
      <summary className="cursor-pointer"><span className="font-bold text-cyan-100">今回だけ出題を絞る</span> · 説明</summary>
      <p className="mt-1">1バトル限定です。次の通常バトルには引き継ぎません。「未出題」は出題記録のない問題です。以前の記録が不足している場合、取り組み済みの問題も含まれます。「学習中」は未出題を含みます。除外中は出題しません。</p>
      <p className="mt-1">同じ問題は1回だけ出題します。撃破・通常の問題数上限・対象の一巡のいずれかで終了します。一巡してもHPが残っていれば、撃破にはなりません。</p>
    </details>
    <div className="grid grid-cols-2 gap-2">
      {(['unseen', 'learning'] as const).map(kind => {
        const count = kind === 'unseen' ? unseenCount : learningCount;
        return <button key={kind} type="button" data-focus-kind={kind} disabled={count === 0} onClick={() => onStart(kind)} className="min-h-11 rounded-lg border border-cyan-400/45 bg-slate-900/60 px-2 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-900/50 disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
          {FOCUSED_BATTLE_LABELS[kind]} <span className="inline-block text-xs">{count}問</span>
        </button>;
      })}
    </div>
  </section>;
}

type FocusedMode = { label: string; mode: 'guide' | 'challenge'; inputMode: 'voice-text' | 'voice-only' | 'text-only' };
const modes: FocusedMode[] = [
  { label: 'Basic Training / 基礎練習', mode: 'guide', inputMode: 'voice-text' },
  { label: 'Listening Training / リスニング練習', mode: 'challenge', inputMode: 'voice-text' },
  { label: 'Listening Battle / 音声バトル', mode: 'challenge', inputMode: 'voice-only' },
  { label: 'Translation Battle / 和訳バトル', mode: 'challenge', inputMode: 'text-only' },
];

export function FocusedBattleModeActions({ unseenCount, learningCount, onStart }: {
  unseenCount: number;
  learningCount: number;
  onStart: (kind: FocusedBattleKind, mode: FocusedMode['mode'], inputMode: FocusedMode['inputMode']) => void;
}) {
  const [pending, setPending] = useState<FocusedBattleKind | null>(null);
  return <>
    <FocusedBattleActions unseenCount={unseenCount} learningCount={learningCount} onStart={setPending} />
    {pending && createPortal(<FocusedModeDialog kind={pending} onClose={() => setPending(null)} onStart={choice => {
      const kind = pending;
      setPending(null);
      onStart(kind, choice.mode, choice.inputMode);
    }} />, document.body)}
  </>;
}

function FocusedModeDialog({ kind, onClose, onStart }: {
  kind: FocusedBattleKind;
  onClose: () => void;
  onStart: (mode: FocusedMode) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  const close = () => { dialog.current?.close(); onClose(); };
  const backdrop = useBackdropDismiss<HTMLDialogElement>(close);
  return <dialog ref={dialog} {...backdrop} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => event.stopPropagation()} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border border-cyan-400/50 bg-slate-900 p-4 text-slate-100 shadow-2xl backdrop:bg-slate-950/70">
    <div className="flex items-center justify-between gap-2">
      <h2 id={titleId} className="font-bold text-cyan-100">{FOCUSED_BATTLE_LABELS[kind]}で始める</h2>
      <button type="button" autoFocus onClick={close} aria-label="モード選択を閉じる" className="min-h-11 min-w-11 rounded-lg text-xl hover:bg-slate-700">×</button>
    </div>
    <p className="mb-3 text-sm text-slate-300">今回のモードを選んでください。1バトル限定です。</p>
    <div className="grid gap-2">
      {modes.map(choice => <button key={choice.label} type="button" onClick={() => { dialog.current?.close(); onStart(choice); }} className="min-h-11 rounded-lg border border-cyan-400/35 bg-cyan-950/30 px-3 py-2 text-left text-sm font-bold text-cyan-100 hover:bg-cyan-900/50 focus-visible:outline-2 focus-visible:outline-cyan-300">{choice.label}</button>)}
    </div>
  </dialog>;
}
