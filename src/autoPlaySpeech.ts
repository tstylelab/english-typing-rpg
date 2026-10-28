export type AutoPlaySpeechFailure = SpeechSynthesisErrorCode | 'timeout' | 'unsupported' | 'exception';

export function getAutoPlaySpeechFailureMessage(reason: AutoPlaySpeechFailure): string {
  switch (reason) {
    case 'unsupported':
      return 'このブラウザーでは音声を読み上げられません。音声読み上げに対応したブラウザーで開いてください。';
    case 'not-allowed':
      return 'ブラウザーに音声の再生が許可されませんでした。サイトの音声設定を確認し、この画面の再生ボタンを押してください。';
    case 'voice-unavailable':
    case 'language-unavailable':
    case 'synthesis-unavailable':
      return 'この端末で読み上げ音声を利用できませんでした。端末の読み上げ設定と、英語・日本語の音声データを確認してください。';
    case 'network':
      return '読み上げ音声の通信に失敗しました。通信状況を確認して、もう一度再生してください。';
    case 'audio-hardware':
    case 'audio-busy':
      return '音声を出力できませんでした。他の音声再生やイヤホンの接続を確認して、もう一度再生してください。';
    case 'timeout':
      return '読み上げ音声の応答がありませんでした。画面を表示した状態で、もう一度再生してください。';
    default:
      return '音声を再生できませんでした。端末の読み上げ設定を確認して、再生ボタンを押してください。';
  }
}

type Options = {
  voice: SpeechSynthesisVoice | null;
  lang: string;
  rate: number;
  volume?: number;
  onend: () => void;
  onfailure: (reason: AutoPlaySpeechFailure) => void;
  onretry: () => void;
};

// Only autoplay uses this guard; battle/preview speech behavior is unchanged.
export function speakAutoPlayEntry(text: string, options: Options): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    options.onfailure('unsupported');
    return () => {};
  }
  const synth = window.speechSynthesis;
  let disposed = false;
  let retries = 0;
  let utterance: SpeechSynthesisUtterance | null = null;
  let timer: number | undefined;
  let waitingForVisible = false;
  let failureReason: AutoPlaySpeechFailure = 'timeout';
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
  const fail = (reason: AutoPlaySpeechFailure) => {
    dispose();
    options.onfailure(reason);
  };
  const recover = (reason: AutoPlaySpeechFailure = 'timeout') => {
    if (disposed) return;
    failureReason = reason;
    detach(); // Invalidate events before cancel(), including late end/error pairs.
    if (reason === 'not-allowed' || reason === 'invalid-argument' || reason === 'text-too-long') { fail(reason); return; }
    if (document.visibilityState !== 'visible') {
      waitingForVisible = true;
      return;
    }
    if (retries++ >= 1) { fail(reason); return; }
    options.onretry();
    try { synth.cancel(); } catch { fail('exception'); return; }
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
      current.volume = options.volume ?? 1;
      // Some phone engines advertise a voice that cannot actually synthesize.
      // Keep the language but let the device choose its default on the one retry.
      if (options.voice && retries === 0) current.voice = options.voice;
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
        recover(event.error);
      };
      timer = window.setTimeout(check, 5000);
      if (synth.paused) synth.resume();
      synth.speak(current);
    } catch { recover('exception'); }
  };
  function visible() {
    if (disposed || document.visibilityState !== 'visible') return;
    if (waitingForVisible) {
      waitingForVisible = false;
      recover(failureReason);
    } else if (utterance) {
      window.clearTimeout(timer);
      check();
    }
  }
  document.addEventListener('visibilitychange', visible);
  start();
  return dispose;
}
