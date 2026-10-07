import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, ShieldCheck } from 'lucide-react';
import { acknowledgeBackupReminder, needsBackupReminder } from './dailyBackupReminder';

export default function BackupReminder({ playerId, date, answered, onExport }: {
  playerId: string;
  date: string;
  answered: number;
  onExport: () => boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const laterRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!needsBackupReminder(playerId, date, answered)) return;
    // Let CLEAR finish, including when its image loads slowly. Observe only
    // during this result screen; leaving it cancels the pending reminder.
    const showWhenReady = () => {
      if (document.querySelector('[data-monster-reveal="defeat"]')) return;
      observer.disconnect();
      if (needsBackupReminder(playerId, date, answered)) setVisible(true);
    };
    const observer = new MutationObserver(showWhenReady);
    const timer = window.setTimeout(() => {
      observer.observe(document.body, { childList: true, subtree: true });
      showWhenReady();
    }, 2200);
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, [playerId, date, answered]);

  useEffect(() => {
    if (!visible) return;
    const previous = document.activeElement as HTMLElement | null;
    const appRoot = document.getElementById('root');
    const previousInert = appRoot?.inert ?? false;
    if (appRoot) appRoot.inert = true;
    laterRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); laterRef.current?.click(); }
      if (event.key !== 'Tab') return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button');
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (appRoot) appRoot.inert = previousInert;
      if (previous?.isConnected) previous.focus();
    };
  }, [visible]);

  if (!visible) return null;
  const dismiss = () => {
    acknowledgeBackupReminder(playerId, date);
    setVisible(false);
  };
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="backup-reminder-title" aria-describedby="backup-reminder-description" className="w-full max-w-md rounded-2xl border border-cyan-300/50 bg-slate-900 p-5 shadow-xl sm:p-6">
        <ShieldCheck size={32} className="mb-3 text-cyan-300" aria-hidden="true" />
        <h2 id="backup-reminder-title" className="text-xl font-black text-white">そろそろデータを書き出しませんか？</h2>
        <div id="backup-reminder-description" className="mt-3 space-y-2 text-sm leading-relaxed text-slate-200">
          <p>今日は <strong className="text-cyan-200">{answered}問</strong> 解きました。学習の記録をファイルに残しておきましょう。</p>
          <p>現在のプレイヤーの学習データを書き出します。保存したファイルは、設定の「学習データを読み込む」から戻せます。</p>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-amber-200">書き出しに失敗しました。もう一度お試しください。</p>}
        <div className="mt-5 flex flex-col gap-3">
          <button type="button" onClick={() => { if (onExport()) dismiss(); else setError(true); }} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-bold text-white hover:bg-cyan-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"><Download size={20} /> データを書き出す</button>
          <button ref={laterRef} type="button" onClick={dismiss} className="min-h-11 rounded-xl border border-slate-600 px-4 py-2 font-bold text-slate-200 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">今日はあとで</button>
        </div>
        <p className="mt-3 text-xs text-slate-400">この案内は、同じプレイヤーには1日1回です。</p>
      </div>
    </div>, document.body,
  );
}
