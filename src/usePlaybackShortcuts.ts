import { useEffect } from 'react';

type PlaybackShortcuts = {
  enabled: boolean;
  playing: boolean;
  paused: boolean;
  onNavigate: (direction: -1 | 1) => void;
  onPause: () => void;
  onResume: () => void;
  onRemoveReview: () => void;
};

// Reuse the transport actions; never edit the speech queue or learner data here.
export function usePlaybackShortcuts({ enabled, playing, paused, onNavigate, onPause, onResume, onRemoveReview }: PlaybackShortcuts) {
  useEffect(() => {
    if (!enabled || (!playing && !paused)) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.ctrlKey || event.altKey || event.metaKey) return;
      if (document.querySelector('dialog[open], [role="dialog"], [aria-modal="true"]')) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="listbox"], [role="menu"]')) return;

      const remove = event.shiftKey && event.key === 'Enter';
      const previous = !event.shiftKey && event.key === 'ArrowLeft';
      const next = !event.shiftKey && event.key === 'ArrowRight';
      const toggle = !event.shiftKey && event.key === ' ';
      const stop = !event.shiftKey && event.key === 'Escape';
      if (!remove && !previous && !next && !toggle && !stop) return;
      // Space on an unrelated button/link must retain its normal activation.
      if (toggle && target?.closest('button, a, summary, [role="button"]') && !target.closest('[data-playback-toggle]')) return;
      if (!playing && !toggle) return;
      event.preventDefault();
      if (event.repeat) return;
      if (remove) onRemoveReview();
      else if (previous || next) onNavigate(previous ? -1 : 1);
      else if (toggle && paused && !playing) onResume();
      else onPause();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, playing, paused, onNavigate, onPause, onResume, onRemoveReview]);
}
