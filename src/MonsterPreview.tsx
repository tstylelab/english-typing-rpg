import { cloneElement, useLayoutEffect, useId, useRef, useState, type ReactElement } from 'react';
import { X } from 'lucide-react';

type AvatarElement = ReactElement<{ size?: number; lazy?: boolean }>;

function PreviewDialog({ name, locked, avatar, onClose }: { name: string; locked: boolean; avatar: AvatarElement; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={() => { if (!dialogRef.current?.open) onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[440px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border-2 border-cyan-300/60 bg-slate-900 p-0 text-white shadow-2xl backdrop:bg-slate-950/85"
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="pt-1 text-xl font-black text-cyan-100">{locked ? '???' : name}</h2>
          <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="拡大表示を閉じる" className="shrink-0 rounded-lg border border-slate-600 p-2 text-slate-200 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-cyan-300">
            <X size={24} />
          </button>
        </div>
        <div className="mt-4 flex justify-center" data-monster-preview={locked ? 'locked' : 'unlocked'}>
          <div className={`max-w-full [&>div]:max-w-full [&_img]:max-w-full [&_svg]:max-w-full ${locked ? 'opacity-30 grayscale blur-[1px]' : ''}`}>
            {cloneElement(avatar, { size: 320, lazy: false })}
          </div>
        </div>
        {locked && <p className="mt-4 text-center text-sm text-slate-300">倒すと、姿がはっきり見られるようになります。</p>}
      </div>
    </dialog>
  );
}

export default function MonsterPreview({ name, locked = false, children }: { name: string; locked?: boolean; children: AvatarElement }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-label={`${locked ? '未撃破のモンスター' : name}を拡大表示`} title="クリック・タップで拡大" onClick={() => setOpen(true)} className="relative inline-flex cursor-zoom-in items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
        <span aria-hidden="true" className={locked ? 'opacity-30 grayscale blur-[1px]' : undefined}>{children}</span>
      </button>
      {open && <PreviewDialog name={name} locked={locked} avatar={children} onClose={() => setOpen(false)} />}
    </>
  );
}
