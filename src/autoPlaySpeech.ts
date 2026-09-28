type Options = {
  voice: SpeechSynthesisVoice | null;
  lang: string;
  rate: number;
  onend: () => void;
  onfailure: () => void;
  onretry: () => void;
};

// Only autoplay uses this guard; battle/preview speech behavior is unchanged.
export function speakAutoPlayEntry(text: string, options: Options): () => void {
  const synth = window.speechSynthesis;
  let disposed = false;
  let retries = 0;
  let utterance: SpeechSynthesisUtterance | null = null;
  let timer: number | undefined;
  let waitingForVisible = false;
  const timeoutMs = Math.max(30000, 15000 + text.length * 500 / Math.max(0.5, options.rate));
  let deadline = 0;

  const detach = () => {
    window.clearTimeout(timer);
    if (utterance) {
      utterance.onend = null;
      utterance.onerror = null;
      utterance.onboundary = null;
    }
    utterance = null;
  };
  const dispose = () => {
    disposed = true;
    detach();
    document.removeEventListener('visibilitychange', visible);
  };
  const fail = () => {
    dispose();
    options.onfailure();
  };
  const recover = (permanent = false) => {
    if (disposed) return;
    detach(); // Invalidate events before cancel(), including late end/error pairs.
    if (permanent) { fail(); return; }
    if (document.visibilityState !== 'visible') {
      waitingForVisible = true;
      return;
    }
    if (retries++ >= 1) { fail(); return; }
    options.onretry();
    try { synth.cancel(); } catch { fail(); return; }
    timer = window.setTimeout(start, 300);
  };
  const check = () => {
    if (disposed) return;
    // A background page may be suspended by the OS. Retry only after returning.
    if (document.visibilityState === 'visible') {
      if (Date.now() >= deadline) { recover(); return; }
      try { if (synth.paused) synth.resume(); } catch { recover(); return; }
    }
    timer = window.setTimeout(check, 5000);
  };
  const start = () => {
    if (disposed) return;
    try {
      const current = new SpeechSynthesisUtterance(text);
      utterance = current; // Retain the active utterance until it settles.
      current.lang = options.lang;
      current.rate = options.rate;
      if (options.voice) current.voice = options.voice;
      deadline = Date.now() + timeoutMs;
      current.onboundary = () => {
        if (!disposed && utterance === current) deadline = Date.now() + timeoutMs;
      };
      current.onend = () => {
        if (disposed || utterance !== current) return;
        dispose();
        options.onend();
      };
      current.onerror = event => {
        if (disposed || utterance !== current) return;
        recover(event.error === 'not-allowed');
      };
      timer = window.setTimeout(check, 5000);
      if (synth.paused) synth.resume();
      synth.speak(current);
    } catch { recover(); }
  };
  function visible() {
    if (disposed || document.visibilityState !== 'visible') return;
    if (waitingForVisible) {
      waitingForVisible = false;
      recover();
    } else if (utterance) {
      window.clearTimeout(timer);
      check();
    }
  }
  document.addEventListener('visibilitychange', visible);
  start();
  return dispose;
}
