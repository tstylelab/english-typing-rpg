import { cloneElement, useLayoutEffect, useId, useRef, useState, type ReactElement } from 'react';
import { X } from 'lucide-react';
import { MONSTER_PREVIEW_IMAGE_SIZE } from './monsterArt';
import './MonsterPreview.css';

type AvatarElement = ReactElement<{ size?: number; lazy?: boolean; enlarged?: boolean }>;

function PreviewDialog({ name, locked, avatar, origin, onClose }: { name: string; locked: boolean; avatar: AvatarElement; origin: DOMRect; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const previousOverflow = document.body.style.overflow;
    const updateResolution = () => dialog.style.setProperty('--preview-dpr', String(window.devicePixelRatio || 1));
    updateResolution();
    dialog.style.setProperty('--preview-pixels', `${MONSTER_PREVIEW_IMAGE_SIZE}px`);
    dialog.showModal();
    const bounds = dialog.getBoundingClientRect();
    dialog.style.setProperty('--preview-from-x', `${origin.x + origin.width / 2 - bounds.x - bounds.width / 2}px`);
    dialog.style.setProperty('--preview-from-y', `${origin.y + origin.height / 2 - bounds.y - bounds.height / 2}px`);
    dialog.style.setProperty('--preview-from-scale', String(Math.max(0.12, Math.min(1, origin.width / bounds.width))));
    dialog.classList.add('is-opening');
    document.body.style.overflow = 'hidden';
    window.addEventListener('resize', updateResolution);
    return () => {
      window.removeEventListener('resize', updateResolution);
      dialog.classList.remove('is-opening');
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [origin]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={() => { if (!dialogRef.current?.open) onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}
      className="monster-preview-dialog fixed inset-0 m-auto overflow-y-auto rounded-2xl border-2 border-cyan-300/60 bg-slate-900 p-0 text-white shadow-2xl"
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="pt-1 text-xl font-black text-cyan-100">{locked ? '???' : name}</h2>
          <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="拡大表示を閉じる" className="shrink-0 rounded-lg border border-slate-600 p-2 text-slate-200 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-cyan-300">
            <X size={24} />
          </button>
        </div>
        <div className="mt-4 flex justify-center" data-monster-preview={locked ? 'locked' : 'unlocked'}>
          <div className={`monster-preview-art ${locked ? 'opacity-30 grayscale blur-[1px]' : ''}`}>
            {cloneElement(avatar, { size: 640, lazy: false, enlarged: true })}
          </div>
        </div>
        {locked && <p className="mt-4 text-center text-sm text-slate-300">倒すと、姿がはっきり見られるようになります。</p>}
      </div>
    </dialog>
  );
}

export default function MonsterPreview({ name, locked = false, children }: { name: string; locked?: boolean; children: AvatarElement }) {
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  return (
    <>
      <button type="button" aria-label={`${locked ? '未撃破のモンスター' : name}を拡大表示`} title="クリック・タップで拡大" onClick={event => setOrigin(event.currentTarget.getBoundingClientRect())} className="relative inline-flex cursor-zoom-in items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
        <span aria-hidden="true" className={locked ? 'opacity-30 grayscale blur-[1px]' : undefined}>{children}</span>
      </button>
      {origin && <PreviewDialog name={name} locked={locked} avatar={children} origin={origin} onClose={() => setOrigin(null)} />}
    </>
  );
}
