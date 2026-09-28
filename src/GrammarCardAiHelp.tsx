import { useEffect, useRef, useState } from 'react';
import type { GrammarCard } from './data/grade5GrammarGuide';
import { buildGrammarQuestion, GRAMMAR_AI_DESTINATIONS } from './grammarAiPrompt';

type Props = { grade: string; card: GrammarCard; questionText?: string };
type Destination = keyof typeof GRAMMAR_AI_DESTINATIONS;

export default function GrammarCardAiHelp(props: Props) {
  const [open, setOpen] = useState(false);
  return <details className="grammar-ai-help" onToggle={event => {
    if (event.target === event.currentTarget) setOpen(event.currentTarget.open);
  }}>
    <summary>このカードをAIに質問</summary>
    {open && <QuestionActions {...props} />}
  </details>;
}

function QuestionActions({ grade, card, questionText }: Props) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [destination, setDestination] = useState<Destination>();
  const copying = useRef(false);
  const mounted = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const copy = async (target?: Destination) => {
    if (copying.current) return;
    copying.current = true;
    setBusy(true);
    setDestination(undefined);
    const text = buildGrammarQuestion(grade, card, questionText);
    setPrompt(text);
    try {
      await navigator.clipboard.writeText(text);
      if (!mounted.current || !root.current?.closest('details')?.open) return;
      if (target) {
        setDestination(target);
        // Clipboard failure never opens a tab. No prompt data in the URL.
        // noopener can return null on success: always provide a manual link.
        try { window.open(GRAMMAR_AI_DESTINATIONS[target], '_blank', 'noopener,noreferrer'); }
        catch { /* The link below also handles blocked popups. */ }
      }
      setStatus(target ? `コピーしました。${target}に貼り付けて送信してください。` : 'コピーしました。お使いのAIに貼り付けてください。');
    } catch {
      if (!mounted.current) return;
      setPreview(true);
      setStatus('自動コピーが使えませんでした。下の質問文を選択してコピーしてください。');
    } finally {
      copying.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return <div ref={root} className="grammar-ai-actions">
    <p>説明と確認問題の質問文をコピーします。貼り付け・送信はご自身で。</p>
    <div className="grammar-ai-buttons">
      <button type="button" disabled={busy} onClick={() => copy()}>{busy ? 'コピー中…' : '質問文をコピー'}</button>
      {(Object.keys(GRAMMAR_AI_DESTINATIONS) as Destination[]).map(target =>
        <button key={target} type="button" disabled={busy} onClick={() => copy(target)}>コピーして{target}を開く</button>)}
    </div>
    <p role="status">{status}</p>
    {destination && <a href={GRAMMAR_AI_DESTINATIONS[destination]} target="_blank" rel="noopener noreferrer">{destination}を開く（開かない場合）</a>}
    <button type="button" className="grammar-ai-preview-toggle" aria-expanded={preview} onClick={() => {
      if (!prompt) setPrompt(buildGrammarQuestion(grade, card, questionText));
      setPreview(value => !value);
    }}>{preview ? '質問文を閉じる' : '質問文を確認する'}</button>
    {preview && <textarea aria-label="このカードのAI質問文" readOnly value={prompt} rows={7} onFocus={event => event.currentTarget.select()} />}
    <details className="grammar-ai-safety">
      <summary>AIは誤ることがあります・利用条件</summary>
      <p>ChatGPTは13歳以上（18歳未満は保護者の許可が必要）。13歳未満への説明は大人が操作してください。Geminiはアカウント等の条件をご確認ください。</p>
      <a href="https://help.openai.com/en/articles/8313401-is-chatgpt-safe-for-all-ages" target="_blank" rel="noopener noreferrer">ChatGPTの条件</a> ／ <a href="https://support.google.com/gemini/answer/13278668?hl=ja" target="_blank" rel="noopener noreferrer">Geminiの条件</a>
    </details>
  </div>;
}
