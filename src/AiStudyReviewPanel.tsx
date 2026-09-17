import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AiStudyRecorder, buildAiStudyReport, type ReviewPeriod } from './aiStudyReview';

type Props = { recorder: AiStudyRecorder; courseLabels: Record<string, string>; result?: boolean };
const AI_DESTINATIONS = {
  ChatGPT: 'https://chatgpt.com/',
  Gemini: 'https://gemini.google.com/app',
} as const;
type AiDestination = keyof typeof AI_DESTINATIONS;

// Isolate expansion from the long word list. No save or report generation on open.
export default function AiStudyReviewPanel(props: Props) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<ReviewPeriod>('recent200');
  const [revision, setRevision] = useState(0);
  return <section className="mb-4 flex-shrink-0 rounded-xl border border-violet-400/30 bg-violet-950/15 p-3">
    {props.result ? <ReviewDialog key={revision} {...props} period={period} setPeriod={setPeriod} inline onClose={() => setOpen(true)} /> :
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="flex w-full items-center justify-between gap-3 text-left text-sm font-bold text-violet-100">
      <span>AIに学習相談 <span className="ml-2 text-xs font-normal text-slate-400">試用版</span></span><span>開く</span>
    </button>}
    {open && createPortal(<ReviewDialog {...props} period={period} setPeriod={setPeriod} onClose={() => { setOpen(false); setRevision(value => value + 1); }} />, document.body)}
  </section>;
}

function ReviewDialog({ recorder, courseLabels, result, inline = false, period, setPeriod, onClose }: Props & { inline?: boolean; period: ReviewPeriod; setPeriod: (value: ReviewPeriod) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(false);
  const [enabled, setEnabled] = useState(recorder.enabled);
  const [report, setReport] = useState('');
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState('');
  const [copying, setCopying] = useState(false);
  const [destination, setDestination] = useState<AiDestination | null>(null);
  const copyingRef = useRef(false);
  const [count, setCount] = useState(() => recorder.snapshot().length);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (inline) return;
    const element = dialog.current!;
    element.showModal();
    // React removes the dialog on unmount; closing in effect cleanup would fire
    // onClose during StrictMode's setup/cleanup probe and dismiss it immediately.
  }, [inline]);

  const copy = async (target?: AiDestination) => {
    if (copyingRef.current) return;
    copyingRef.current = true;
    setCopying(true);
    setDestination(null);
    try {
      const text = buildAiStudyReport(recorder.snapshot(), period, courseLabels, Date.now(), result ? recorder.battleSnapshot() : undefined);
      setReport(text);
      if (!text) { setStatus('この期間の記録はまだありません。通常の練習・バトルをプレイしてからお試しください。'); return; }
      await navigator.clipboard.writeText(text);
      if (!mounted.current || (!inline && !dialog.current?.open)) return;
      if (target) {
        setDestination(target);
        // Copy first: failed clipboard writes must never navigate away. No learning
        // data in URLs. noopener may return null even on success, so always offer a link.
        try { window.open(AI_DESTINATIONS[target], '_blank', 'noopener,noreferrer'); }
        catch { /* A browser may block popups; the explicit link below still works. */ }
        setStatus(`コピーしました。${target}の入力欄に貼り付けて送信してください。開かない場合は下のリンクを押してください。`);
      } else setStatus('コピーしました。お使いのAIに貼り付けてください。');
    } catch {
      setPreview(true);
      setStatus('自動コピーが使えませんでした。下の相談文を選択してコピーしてください。');
    } finally {
      copyingRef.current = false;
      setCopying(false);
    }
  };

  const content = <>
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={inline ? undefined : 'ai-review-title'} className="font-bold text-violet-100">{inline ? 'AIにコピペで学習相談' : 'AIに学習相談'}</h2>
      <button type="button" autoFocus={!inline} onClick={() => inline ? onClose() : dialog.current?.close()} className="rounded-lg border border-slate-600 px-3 py-2">{inline ? '設定' : '閉じる'}</button>
    </div>
    <div className="space-y-3">
      {result && !inline && <p className="text-xs text-slate-300">今回のミスから最大3語＋それ以外の履歴から、あわせて最大10語（{period === 'week' ? '過去7日間' : '直近200問'}）を選びます。</p>}
      {!inline && <>
      <p><strong>英語と和訳・類義語の復習表</strong>で相談します。表は最大10件。Tipsは繰り返すミスに役立つ助言がある場合だけ、最大5語です。ミス一覧は出しません。コピーした相談文をお使いのAIへ貼り付けてください。自動送信はしません。</p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={enabled} onChange={e => {
            recorder.setEnabled(e.target.checked); setEnabled(recorder.enabled);
            setStatus(recorder.warning
              ? 'この画面では設定を変更しましたが、保存できませんでした。再読み込み後に確認してください。'
              : recorder.enabled ? '今後の問題から記録します。' : '記録を停止しました。保存済みの記録は相談に使えます。');
          }} />相談用の記録を取る
        </label>
        <span className="text-xs text-slate-400">保存対象 {count}問</span>
      </div>
      {recorder.warning && <p role="alert" className="text-xs text-amber-200">{recorder.warning}</p>}
      <label className="flex items-center gap-2">対象期間
        <select aria-label="AI相談の対象期間" disabled={copying} value={period} onChange={e => { setPeriod(e.target.value as ReviewPeriod); setReport(''); setPreview(false); setStatus(''); setDestination(null); }} className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2">
          <option value="recent200">直近200問</option><option value="week">過去7日間</option>
        </select>
      </label>
      </>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={copying} onClick={() => copy()} className="rounded-lg border border-violet-400/50 bg-violet-700 px-3 py-2 font-bold hover:bg-violet-600 disabled:opacity-50">{copying ? 'コピー中…' : '相談文を作ってコピー'}</button>
        {(Object.keys(AI_DESTINATIONS) as AiDestination[]).map(target => <button key={target} type="button" disabled={copying} onClick={() => copy(target)} className="rounded-lg border border-slate-500 bg-slate-800 px-3 py-2 font-bold hover:bg-slate-700 disabled:opacity-50">コピーして{target}を開く</button>)}
      </div>
      {!inline && <p className="text-xs text-slate-400">AIは別タブで開きます。入力欄への貼り付けと送信はご自身で行ってください。</p>}
      {status && <p role="status" className="text-violet-100">{status}</p>}
      {destination && <a href={AI_DESTINATIONS[destination]} target="_blank" rel="noopener noreferrer" className="inline-block text-violet-200 underline">{destination}を開く（開かない場合）</a>}
      {report && <>
        <button type="button" onClick={() => setPreview(value => !value)} aria-expanded={preview} className="text-xs text-slate-300 underline">{preview ? '相談文を隠す' : '相談文を確認する'}</button>
        {preview && <textarea aria-label="AIへの相談文" readOnly value={report} onFocus={e => e.currentTarget.select()} className="block h-48 w-full resize-y rounded-lg border border-slate-600 bg-slate-950 p-3 font-mono text-xs leading-5" />}
      </>}
      {!inline && <details className="text-xs leading-5 text-slate-400">
        <summary className="cursor-pointer">記録の範囲・削除について</summary>
        <p className="mt-2">現在のプレイヤーの全教材・Levelが対象。通常の練習・バトルを記録し、対戦・はじめてバトル・連続再生は含みません。この端末に直近30日・最大1,000問（容量上限あり）を保存します。過去のミスランキングからは復元せず、成績の転送にも含みません。保存はバトル終了・画面移動などの区切りで行い、中断した問題は含みません。</p>
        <button type="button" disabled={copying} className="mt-2 py-2 underline" onClick={() => {
          if (!window.confirm('このプレイヤーのAI相談用の記録だけを削除します。成績・苦手語は残ります。削除しますか？')) return;
          recorder.clear(); setCount(0); setReport(''); setPreview(false); setDestination(null); setStatus(recorder.warning ? 'この画面の記録は消去しましたが、保存先を更新できませんでした。' : '相談用の記録を削除しました。');
        }}>相談用の記録を削除</button>
      </details>}
    </div>
  </>;
  return inline ? <div className="text-sm">{content}</div> : <dialog ref={dialog} onClose={onClose} aria-labelledby="ai-review-title" className="fixed inset-0 m-auto max-h-[85dvh] w-[min(36rem,calc(100%-2rem))] overflow-y-auto overscroll-contain rounded-xl border border-violet-400/40 bg-slate-900 p-4 text-sm text-slate-200 shadow-xl backdrop:bg-black/60">{content}</dialog>;
}
