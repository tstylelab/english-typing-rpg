import { cloneElement, useLayoutEffect, useId, useRef, useState, type ReactElement } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MONSTER_PREVIEW_IMAGE_SIZE } from './monsterArt';
import './MonsterPreview.css';

type AvatarElement = ReactElement<{ size?: number; lazy?: boolean; enlarged?: boolean }>;
type PreviewItem = { name: string; locked?: boolean; avatar: AvatarElement };
type PreviewGallery = { items: PreviewItem[]; index: number };

function PreviewDialog({ initialItem, gallery, origin, onClose }: { initialItem: PreviewItem; gallery?: PreviewGallery; origin: DOMRect; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swipeRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [index, setIndex] = useState(gallery?.index ?? 0);
  const { name, locked, avatar } = gallery?.items[index] ?? initialItem;
  const gallerySize = gallery?.items.length ?? 0;
  const hasNavigation = gallerySize > 1;
  const titleId = useId();
  const navigate = (direction: -1 | 1) => {
    if (!hasNavigation) return;
    setIndex(current => Math.max(0, Math.min(gallerySize - 1, current + direction)));
    if (dialogRef.current) dialogRef.current.scrollTop = 0;
  };
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
      onKeyDown={event => {
        if (!hasNavigation || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          event.stopPropagation();
          navigate(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
      className={`monster-preview-dialog ${hasNavigation ? 'has-gallery' : ''} fixed inset-0 m-auto overflow-y-auto rounded-2xl border-2 border-cyan-300/60 bg-slate-900 p-0 text-white shadow-2xl`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="pt-1 text-xl font-black text-cyan-100">{locked ? '???' : name}</h2>
          <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="拡大表示を閉じる" className="shrink-0 rounded-lg border border-slate-600 p-2 text-slate-200 hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-cyan-300">
            <X size={24} />
          </button>
        </div>
        <div
          className={`mt-4 flex justify-center ${hasNavigation ? 'monster-preview-swipe' : ''}`}
          data-monster-preview={locked ? 'locked' : 'unlocked'}
          onPointerDown={event => {
            if (!hasNavigation || event.pointerType === 'mouse' || !event.isPrimary) return;
            swipeRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={event => {
            const start = swipeRef.current;
            swipeRef.current = null;
            if (!start || start.pointerId !== event.pointerId) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.4) navigate(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => { swipeRef.current = null; }}
        >
          <div className={`monster-preview-art ${locked ? 'opacity-30 grayscale blur-[1px]' : ''}`}>
            {cloneElement(avatar, { key: index, size: 640, lazy: false, enlarged: true })}
          </div>
        </div>
        {locked && <p className="mt-4 text-center text-sm text-slate-300">倒すと、姿がはっきり見られるようになります。</p>}
        {hasNavigation && (
          <nav aria-label="モンスターの切り替え" className="mt-4">
            <div className="flex items-center justify-center gap-5">
              <button type="button" onClick={() => navigate(-1)} disabled={index === 0} aria-label="前のモンスター" className="rounded-lg border border-slate-500 p-2 text-cyan-100 hover:bg-slate-700 disabled:cursor-default disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-cyan-300">
                <ChevronLeft size={24} />
              </button>
              <span aria-live="polite" aria-atomic="true" className="min-w-16 text-center text-sm font-bold text-slate-200">{index + 1} / {gallerySize}</span>
              <button type="button" onClick={() => navigate(1)} disabled={index === gallerySize - 1} aria-label="次のモンスター" className="rounded-lg border border-slate-500 p-2 text-cyan-100 hover:bg-slate-700 disabled:cursor-default disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-cyan-300">
                <ChevronRight size={24} />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">← → キー・左右スワイプで切り替え</p>
          </nav>
        )}
      </div>
    </dialog>
  );
}

export default function MonsterPreview({ name, locked = false, gallery, children }: { name: string; locked?: boolean; gallery?: PreviewGallery; children: AvatarElement }) {
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  return (
    <>
      <button type="button" aria-label={`${locked ? '未撃破のモンスター' : name}を拡大表示`} title="クリック・タップで拡大" onClick={event => setOrigin(event.currentTarget.getBoundingClientRect())} className="relative inline-flex cursor-zoom-in items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
        <span aria-hidden="true" className={locked ? 'opacity-30 grayscale blur-[1px]' : undefined}>{children}</span>
      </button>
      {origin && <PreviewDialog initialItem={{ name, locked, avatar: children }} gallery={gallery} origin={origin} onClose={() => setOrigin(null)} />}
    </>
  );
}
