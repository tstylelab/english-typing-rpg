import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBackdropDismiss } from './useBackdropDismiss';

export default function PlaybackSettingsDialog({ children, onClose, title = '再生設定', closeLabel = '設定を閉じて再生画面へ' }: { children: ReactNode; onClose: () => void; title?: string; closeLabel?: string }) {
  const headingId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const backdrop = useBackdropDismiss<HTMLDialogElement>(onClose);
  useEffect(() => {
    const el = ref.current!;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = 'hidden';
    return () => { el.close(); document.body.style.overflow = overflow; opener?.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<dialog ref={ref} aria-labelledby={headingId} className="playback-settings-dialog" {...backdrop} onCancel={e => { e.preventDefault(); onClose(); }} onClose={e => { if (!e.currentTarget.open) onClose(); }}><header><h2 id={headingId}>{title}</h2><button onClick={onClose} autoFocus aria-label={`${title}を閉じる`}><X size={21} /></button></header>{children}<footer><button onClick={onClose}>{closeLabel}</button></footer></dialog>, document.body);
}
