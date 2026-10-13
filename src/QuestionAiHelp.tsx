import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X } from 'lucide-react';
import { GRAMMAR_AI_DESTINATIONS } from './grammarAiPrompt';
import { buildQuestionAiPrompt, type QuestionAiContext } from './questionAiPrompt';

type Destination = keyof typeof GRAMMAR_AI_DESTINATIONS;
const actionClass = 'min-h-10 rounded-lg border border-violet-400/40 bg-violet-950/30 px-3 py-2 text-sm font-bold text-violet-100 hover:bg-violet-900/50 focus-visible:outline-2 focus-visible:outline-violet-300 disabled:opacity-50';

export default function QuestionAiHelp(props: QuestionAiContext) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} type="button" aria-haspopup="dialog" aria-label={`${props.text} についてAIに相談`} onClick={() => setOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-violet-400/35 bg-violet-950/20 px-2.5 py-1 text-xs font-bold text-violet-100 hover:bg-violet-900/40 focus-visible:outline-2 focus-visible:outline-violet-300">
      <MessageCircle size={15} aria-hidden="true" />AIに相談
    </button>
    {open && createPortal(<QuestionDialog {...props} onClose={() => {
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    }} />, document.body)}
  </>;
}

function QuestionDialog({ onClose, ...context }: QuestionAiContext & { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const active = useRef(false);
  const copying = useRef(false);
  const headingId = useId();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(false);
  const [destination, setDestination] = useState<Destination>();
  const prompt = buildQuestionAiPrompt(context);
  useEffect(() => {
    active.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => {
      active.current = false;
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  const close = () => {
    active.current = false;
    // close() restores native modal focus before the trigger is focused again.
    dialog.current?.close();
    onClose();
  };
  const copy = async (target?: Destination) => {
    if (copying.current) return;
    copying.current = true;
    setBusy(true);
    setDestination(undefined);
    try {
      await navigator.clipboard.writeText(prompt);
      if (!active.current || !dialog.current?.open) return;
      if (target) {
        setDestination(target);
        try { window.open(GRAMMAR_AI_DESTINATIONS[target], '_blank', 'noopener,noreferrer'); }
        catch { /* The explicit link also handles blocked popups. */ }
      }
      setStatus(target ? `コピーしました。${target}に貼り付けて送信してください。` : '相談文をコピーしました。お使いのAIに貼り付けてください。');
    } catch {
      if (!active.current) return;
      setPreview(true);
      setStatus('自動コピーが使えませんでした。下の相談文を選択してコピーしてください。');
    } finally {
      copying.current = false;
      if (active.current) setBusy(false);
    }
  };
  return <dialog ref={dialog} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => event.stopPropagation()} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-violet-400/50 bg-slate-900 p-4 text-slate-100 shadow-2xl backdrop:bg-slate-950/70">
    <div className="flex items-center justify-between gap-3">
      <h2 id={headingId} className="font-bold text-violet-100">この問題をAIに相談</h2>
      <button type="button" autoFocus onClick={close} aria-label="相談を閉じて結果に戻る" className="flex min-h-10 min-w-10 items-center justify-center rounded-lg hover:bg-slate-700"><X size={20} /></button>
    </div>
    <p className="mt-2 text-xs text-slate-400">{context.course} · Level {context.level}</p>
    <p className="mt-1 break-words font-bold text-cyan-100">{context.text}</p>
    <p className="mt-1 text-sm text-slate-300">{context.meaning}</p>
    <p className="mt-4 text-sm text-slate-300">相談文をコピーしてAIを開きます。貼り付けて送信してください。</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {(Object.keys(GRAMMAR_AI_DESTINATIONS) as Destination[]).map(target => <button key={target} type="button" disabled={busy} onClick={() => copy(target)} className={actionClass}>{target}で相談</button>)}
      <button type="button" disabled={busy} onClick={() => copy()} className={actionClass}>相談文をコピー</button>
    </div>
    {status && <p role="status" className="mt-3 text-sm text-cyan-100">{status}</p>}
    {destination && <a href={GRAMMAR_AI_DESTINATIONS[destination]} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-cyan-200 underline">{destination}を開く（開かない場合）</a>}
    <button type="button" aria-expanded={preview} onClick={() => setPreview(value => !value)} className="mt-3 min-h-9 text-xs text-slate-300 underline">{preview ? '相談文を閉じる' : '相談文を確認する'}</button>
    {preview && <textarea aria-label="この問題の相談文" readOnly value={prompt} rows={8} onFocus={event => event.currentTarget.select()} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-950 p-3 text-sm text-slate-200" />}
  </dialog>;
}
