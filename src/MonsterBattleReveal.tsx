import { cloneElement, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import './MonsterBattleReveal.css';

// Load only this encounter's existing preview art; never delay game progress.
export default function MonsterBattleReveal({ children, kind, enabled = true }: {
  children: ReactElement<{ size: number; enlarged?: boolean }>;
  kind: 'entry' | 'defeat';
  enabled?: boolean;
}) {
  const targetRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const target = targetRef.current;
    const backdrop = backdropRef.current;
    if (!enabled || !overlay || !target || !visible) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => {
      target.classList.remove('is-revealing');
      setVisible(false);
    };
    let frame = 0;
    let resizeFrame = 0;
    let disposed = false;
    let playing = false;
    const image = overlay.querySelector('img');
    const updateGeometry = () => {
      const bounds = target.getBoundingClientRect();
      const pixels = image ? image.naturalWidth / (window.devicePixelRatio || 1) : Infinity;
      const size = Math.min(window.innerWidth * .9 - 36, window.innerHeight * .84 - 36, pixels);
      if (size <= bounds.width * 1.05) return false;
      overlay.style.setProperty('--reveal-size', `${size}px`);
      overlay.style.setProperty('--reveal-x', `${bounds.x + bounds.width / 2 - window.innerWidth / 2}px`);
      overlay.style.setProperty('--reveal-y', `${bounds.y + bounds.height / 2 - window.innerHeight / 2}px`);
      overlay.style.setProperty('--reveal-scale', String(bounds.width / size));
      return true;
    };
    const start = () => {
      if (disposed) return;
      if (motion.matches || (image && !image.naturalWidth)) { finish(); return; }
      frame = requestAnimationFrame(() => {
        if (!disposed) {
          if (!updateGeometry()) { finish(); return; }
          playing = true;
          target.classList.add('is-revealing');
          overlay.classList.add('is-playing');
          backdrop?.classList.add('is-playing');
        }
      });
    };
    // Mobile browser chrome / keyboards may resize while art is loading.
    // Loading uses the latest viewport at start; playback keeps its one-second
    // timeline and only updates geometry, without restarting the animation.
    const resize = () => {
      if (!playing || disposed || resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        if (!disposed && !updateGeometry()) finish();
      });
    };
    if (image && !image.complete) image.addEventListener('load', start, { once: true });
    else start();
    image?.addEventListener('error', finish, { once: true });
    window.addEventListener('resize', resize);
    motion.addEventListener('change', finish);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      image?.removeEventListener('load', start);
      image?.removeEventListener('error', finish);
      window.removeEventListener('resize', resize);
      motion.removeEventListener('change', finish);
      overlay.classList.remove('is-playing');
      backdrop?.classList.remove('is-playing');
      target.classList.remove('is-revealing');
    };
  }, [enabled, kind, visible]);
  return <>
    <span ref={targetRef} className="monster-reveal-target">{children}</span>
    {visible && enabled && createPortal(
      <>
        <div ref={backdropRef} className="monster-reveal-backdrop" data-monster-reveal-backdrop={kind} aria-hidden="true" />
        <div ref={overlayRef} aria-hidden="true" data-monster-reveal={kind} className="monster-battle-reveal" onAnimationEnd={event => {
          if (event.target === event.currentTarget && !event.pseudoElement) {
            targetRef.current?.classList.remove('is-revealing');
            setVisible(false);
          }
        }}>
          {cloneElement(children, { enlarged: true })}
        </div>
      </>, document.body,
    )}
  </>;
}
