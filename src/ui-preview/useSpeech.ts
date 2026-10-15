import { useCallback, useEffect, useRef, useState } from 'react';
import { speakAutoPlayEntry } from '../autoPlaySpeech';

export type SpeechPart = { text: string; lang: string };
export function usePreviewSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const cleanup = useRef<(() => void) | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const generation = useRef(0);
  const stop = useCallback(() => {
    generation.current++;
    window.clearTimeout(timer.current);
    cleanup.current?.();
    cleanup.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);
  useEffect(() => () => {
    generation.current++;
    window.clearTimeout(timer.current);
    cleanup.current?.();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);
  const play = useCallback((parts: SpeechPart[], rate = 1, onEnd?: () => void) => {
    stop();
    setError('');
    if (!('speechSynthesis' in window)) { setError('このブラウザでは音声を再生できません。'); return; }
    const token = generation.current;
    const entries = parts.filter(part => part.text.trim());
    const next = (index: number) => {
      if (token !== generation.current) return;
      if (index >= entries.length) { setSpeaking(false); onEnd?.(); return; }
      setSpeaking(true);
      const part = entries[index];
      cleanup.current = speakAutoPlayEntry(part.text, {
        lang: part.lang, voice: null, rate,
        onend: () => { timer.current = window.setTimeout(() => next(index + 1), 450); },
        onfailure: () => { if (token === generation.current) { setSpeaking(false); setError('音声を開始できませんでした。「再生」を押してもう一度お試しください。'); } },
        onretry: () => {},
      });
    };
    next(0);
  }, [stop]);
  return { speaking, error, play, stop };
}
