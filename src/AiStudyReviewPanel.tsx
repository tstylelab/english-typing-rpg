import { useState } from 'react';
import { AiStudyRecorder, buildAiStudyReport, type ReviewPeriod } from './aiStudyReview';

export default function AiStudyReviewPanel({ recorder, courseLabels }: { recorder: AiStudyRecorder; courseLabels: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<ReviewPeriod>('recent200');
  const [enabled, setEnabled] = useState(recorder.enabled);
  const [report, setReport] = useState('');
  const [status, setStatus] = useState('');
  const [count, setCount] = useState(0);

  const openPanel = () => {
    recorder.flush();
    setCount(recorder.snapshot().length);
    setEnabled(recorder.enabled);
    setOpen(value => !value);
  };
  const copy = async () => {
    const text = buildAiStudyReport(recorder.snapshot(), period, courseLabels);
    setReport(text);
    if (!text) { setStatus('この期間の記録はまだありません。通常の練習・バトルをプレイすると、解答・スキップした問題から記録されます。'); return; }
    try {
      await navigator.clipboard.writeText(text);
      setStatus('コピーしました。お使いのAIに貼り付けて相談できます。');
    } catch {
      setStatus('自動コピーが使えませんでした。下の相談文を選択してコピーしてください。');
    }
  };

  return (
    <section className="mb-4 flex-shrink-0 rounded-xl border border-violet-400/30 bg-violet-950/15 p-3">
      <button type="button" onClick={openPanel} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left text-sm font-bold text-violet-100">
        <span>AIに学習相談 <span className="ml-2 text-xs font-normal text-slate-400">試用版</span></span>
        <span>{open ? '閉じる ▲' : '開く ▼'}</span>
      </button>
      {open && <div className="mt-3 space-y-3 text-sm text-slate-200">
        <p>最近のミスと相談文をコピーして、お使いのAIに貼り付けられます。スペルの覚え方・語呂・短い練習の提案を依頼します。自動送信はしません。</p>
        <p className="text-xs leading-5 text-slate-400">現在のプレイヤーの全教材・Levelが対象です。通常の練習・バトルを記録し、対戦・はじめてバトル・連続再生は含みません。保存はこの端末の直近30日・最大1,000問（容量上限あり）。過去のミスランキングからは復元せず、成績の転送データにも含みません。</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={e => {
              recorder.setEnabled(e.target.checked); setEnabled(recorder.enabled);
              setStatus(recorder.warning
                ? `この画面では記録を${recorder.enabled ? '有効' : '停止'}にしました。設定を保存できなかったため、再読み込み後に確認してください。`
                : recorder.enabled ? '今後の問題から記録します。' : '記録を停止しました。保存済みの記録は相談に使えます。');
            }} />相談用の記録を取る
          </label>
          <span className="text-xs text-slate-400">保存対象 {count}問</span>
        </div>
        {recorder.warning && <p role="alert" className="text-xs text-amber-200">{recorder.warning}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">対象期間
            <select aria-label="AI相談の対象期間" value={period} onChange={e => { setPeriod(e.target.value as ReviewPeriod); setReport(''); setStatus(''); }} className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2">
              <option value="recent200">直近200問</option><option value="week">過去7日間</option>
            </select>
          </label>
          <button type="button" onClick={copy} className="rounded-lg border border-violet-400/50 bg-violet-700 px-3 py-2 font-bold hover:bg-violet-600">相談文を作ってコピー</button>
          <button type="button" className="px-2 py-2 text-xs text-slate-400 underline" onClick={() => {
            if (!window.confirm('このプレイヤーのAI相談用の記録だけを削除します。成績・苦手語は残ります。削除しますか？')) return;
            recorder.clear(); setCount(0); setReport(''); setStatus(recorder.warning ? 'この画面の記録は消去しましたが、保存先を更新できませんでした。' : '相談用の記録を削除しました。');
          }}>相談用の記録を削除</button>
        </div>
        <p className="text-xs text-slate-400">問題中は保存・分析せず、バトル終了・画面移動などの区切りで保存します。途中で中断した問題は含みません。</p>
        {status && <p role="status" className="text-sm text-violet-100">{status}</p>}
        {report && <label className="block text-xs text-slate-300">コピーする内容（確認・手動コピー用）
          <textarea aria-label="AIへの相談文" readOnly value={report} onFocus={e => e.currentTarget.select()} className="mt-2 h-64 w-full resize-y rounded-lg border border-slate-600 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-200" />
        </label>}
      </div>}
    </section>
  );
}
