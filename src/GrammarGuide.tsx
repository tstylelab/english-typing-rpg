import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, X, ArrowUp, Bookmark, Sparkles } from 'lucide-react';
import { grammarGuides, type GrammarCourse } from './data/grammarGuides';
import { grammarBookmarkKey, readGrammarBookmarks, toggleGrammarBookmark } from './grammarBookmarks';
import './Grade5GrammarGuide.css';
import GrammarCardAiHelp from './GrammarCardAiHelp';

type Props = { playerId: string; course?: GrammarCourse; cardId?: string; questionText?: string; label?: string; fromResult?: boolean; initialOpen?: boolean };

// Mount the reference only on demand. Native modal keeps the result mounted,
// traps focus and makes all background game controls inert without saving state.
export default function GrammarGuide({ playerId, course = 'Eiken5', cardId, questionText, label, fromResult = false, initialOpen = false }: Props) {
  const [open, setOpen] = useState(initialOpen);
  return <>
    <button type="button" className="grammar-guide-link" disabled={!playerId} onClick={() => setOpen(true)} aria-haspopup="dialog">
      <BookOpen size={15} aria-hidden="true" />{label ?? `${grammarGuides[course].grade}・文のしくみ`}
    </button>
    {open && playerId && createPortal(<GuideDialog key={`${playerId}:${course}`} playerId={playerId} course={course} cardId={cardId} questionText={questionText} fromResult={fromResult} onClose={() => setOpen(false)} />, document.body)}
  </>;
}

function GuideDialog({ playerId, course = 'Eiken5', cardId, questionText, fromResult, onClose }: Props & { onClose: () => void }) {
  const { cards, sections, grade, intro } = grammarGuides[course];
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const [active, setActive] = useState(cardId);
  const [savedOnly, setSavedOnly] = useState(false);
  const savedFilter = useRef<HTMLButtonElement>(null);
  const [bookmarks, setBookmarks] = useState(() => {
    try { return { ids: readGrammarBookmarks(localStorage, playerId, course), error: '' }; }
    catch { return { ids: [] as string[], error: '保存したカードを読み込めませんでした。ブラウザの保存設定をご確認ください。' }; }
  });
  const [notice, setNotice] = useState('');
  const visibleCards = savedOnly ? cards.filter(card => bookmarks.ids.includes(card.id)) : cards;

  const toggleSaved = (id: string) => {
    try {
      const ids = toggleGrammarBookmark(localStorage, playerId, id, course);
      setBookmarks({ ids, error: '' });
      setNotice(ids.includes(id) ? 'カードを保存しました。' : 'カードの保存を解除しました。');
      if (savedOnly && !ids.includes(id)) savedFilter.current?.focus({ preventScroll: true });
    } catch {
      setBookmarks(current => ({ ...current, error: '保存を変更できませんでした。ブラウザの保存設定や空き容量をご確認ください。' }));
      setNotice('');
    }
  };

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key !== null && event.key !== grammarBookmarkKey(playerId, course)) return;
      try { setBookmarks({ ids: readGrammarBookmarks(localStorage, playerId, course), error: '' }); }
      catch { setBookmarks(current => ({ ...current, error: '保存したカードを読み込めませんでした。' })); }
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [playerId, course]);

  const goTo = (id: string) => {
    const card = dialog.current?.querySelector<HTMLElement>(`[data-grammar-card="${id}"]`);
    if (!card) return;
    setActive(id);
    card.focus({ preventScroll: true });
    card.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const alreadyLocked = document.body.classList.contains('grammar-guide-open');
    document.body.classList.add('grammar-guide-open');
    el.showModal();
    const frame = requestAnimationFrame(() => {
      const card = cardId ? el.querySelector<HTMLElement>(`[data-grammar-card="${cardId}"]`) : null;
      if (card) {
        card.focus({ preventScroll: true });
        card.scrollIntoView({ block: 'start', behavior: 'instant' });
      } else heading.current?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame);
      el.close();
      if (!alreadyLocked) document.body.classList.remove('grammar-guide-open');
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [cardId]);

  return <dialog ref={dialog} className="grammar-guide" data-course={course} aria-labelledby={headingId} onClose={event => { if (!event.currentTarget.open) onClose(); }}
    onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
      event.stopPropagation();
      if (event.key !== 'Tab') return;
      const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], summary, textarea')]
        .filter(el => el.getClientRects().length > 0 && (el.tagName === 'SUMMARY' || !el.closest('details:not([open])')));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <header className="grammar-guide-bar">
      <span><BookOpen size={18} aria-hidden="true" />英検{grade} · 文のしくみ</span>
      <div>
        <button type="button" onClick={() => { content.current?.scrollTo({ top: 0 }); heading.current?.focus({ preventScroll: true }); }}><ArrowUp size={15} aria-hidden="true" />目次</button>
        <button type="button" onClick={onClose}><X size={17} aria-hidden="true" />{fromResult ? '結果へ戻る' : '閉じる'}</button>
      </div>
    </header>
    <div className="grammar-guide-content" ref={content}>
      <div className="grammar-guide-intro">
        <p className="grammar-guide-eyebrow"><Sparkles size={16} aria-hidden="true" />ことばの順番が分かると、英文が見えてくる。</p>
        <h1 id={headingId} ref={heading} tabIndex={-1}>英検{grade}・文のしくみ</h1>
        <p>全部を一度に覚えなくても大丈夫。気になった型から、例文と見比べてみましょう！</p>
        <p className="grammar-guide-small">{intro}</p>
        <p className="grammar-guide-small">このゲームのLevel 3に対応する早見表です。英検の公式な出題範囲一覧ではありません。</p>
      </div>
      <div className="grammar-guide-filters" role="group" aria-label="カードの表示">
        <button type="button" aria-pressed={!savedOnly} onClick={() => setSavedOnly(false)}>すべて <span>{cards.length}</span></button>
        <button ref={savedFilter} type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly(true)}><Bookmark size={15} aria-hidden="true" />保存したカード <span>{bookmarks.ids.length}</span></button>
      </div>
      <p className="grammar-guide-storage-note">保存はこのブラウザのプレイヤー別・級別です。端末間の自動同期・学習データの書き出しには含まれません。</p>
      <span className="sr-only" role="status">{notice}</span>
      {bookmarks.error && <p className="grammar-guide-error" role="alert">{bookmarks.error}</p>}
      {savedOnly && visibleCards.length === 0 && <div className="grammar-guide-empty"><Bookmark size={25} aria-hidden="true" /><p>あとで見たいカードを集めましょう！</p><p>各カードの「保存」を押すと、ここからすぐ見返せます。</p><button type="button" onClick={() => setSavedOnly(false)}>すべてのカードを見る</button></div>}
      {visibleCards.length > 0 && <>
      <nav className="grammar-guide-toc" aria-label="文のしくみの目次">
        {sections.map((section, index) => visibleCards.some(card => card.section === index) && <div key={section.title} data-section={index}>
          <h2>{index + 1}. {section.title}</h2>
          <div>{visibleCards.filter(card => card.section === index).map(card => <button key={card.id} type="button" data-grammar-target={card.id} onClick={() => goTo(card.id)}>{card.subtitle ? <><strong>{card.title}</strong><span>{card.subtitle}</span></> : card.title}</button>)}</div>
        </div>)}
      </nav>
      <p className="grammar-guide-key">読み方：「だれ・何」は文の主役（主語）。「動詞のもとの形」は play / go / be など、s・ed・ing を付ける前の形です。</p>
      {sections.map((section, index) => visibleCards.some(card => card.section === index) && <section className="grammar-guide-section" key={section.title} data-section={index}>
        <h2><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</h2>
        <p className="grammar-guide-section-note">{section.note}</p>
        <div className="grammar-guide-grid">
          {visibleCards.filter(card => card.section === index).map(card => <article key={card.id} data-grammar-card={card.id} tabIndex={-1} className={`grammar-guide-card${active === card.id ? ' is-selected' : ''}`}>
            <div className="grammar-guide-card-top"><div className="grammar-guide-card-heading"><h3>{card.title}</h3><span>{card.subtitle ?? card.term}</span></div>
              <button type="button" className="grammar-guide-save" disabled={!playerId} aria-label={`${card.title}を${bookmarks.ids.includes(card.id) ? '保存解除' : '保存'}`} aria-pressed={bookmarks.ids.includes(card.id)} onClick={() => toggleSaved(card.id)}><Bookmark size={15} aria-hidden="true" fill={bookmarks.ids.includes(card.id) ? 'currentColor' : 'none'} />{bookmarks.ids.includes(card.id) ? '保存済み' : '保存'}</button>
            </div>
            {cardId === card.id && questionText && <p className="grammar-guide-source"><span>今回の文</span>{questionText}</p>}
            <p className="grammar-guide-pattern"><span>型</span>{card.pattern}</p>
            {card.chunks && <div className="grammar-guide-chunks" aria-label="英文を順番に見てみよう">{card.chunks.map(([en, ja], index) => <div key={en} data-part={index}><strong lang="en">{en}</strong><span>{ja}</span></div>)}</div>}
            <div className="grammar-guide-examples">{card.examples.map(([en, ja]) => <div key={en}><p lang="en">{en}</p><p>{ja}</p></div>)}</div>
            <p className="grammar-guide-tip">{card.tip}</p>
            {card.compare && <dl className="grammar-guide-compare" aria-label="形を比べてみよう">{card.compare.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
            <details><summary>もうひとつヒント</summary><p>{card.more}</p></details>
            <GrammarCardAiHelp grade={grade} card={card} questionText={cardId === card.id ? questionText : undefined} />
          </article>)}
        </div>
      </section>)}
      </>}
      <footer className="grammar-guide-footer">
        <p>「この文なら分かる」を、ひとつずつ増やしていきましょう♪</p>
        {course === 'Eiken4' && <p><a href="?guide=eiken5" target="_blank" rel="noreferrer">I・youやbe動詞から確認したいときは、5級の土台へ（別タブ）</a></p>}
        <details><summary>説明の参考資料</summary><p>British Council の文法資料で基本の型を確認しています。英検の級別範囲を示す資料ではありません。</p>
          <a href="https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/present-simple" target="_blank" rel="noreferrer">現在形（英語・別タブ）</a>{' ／ '}
          <a href="https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/question-forms" target="_blank" rel="noreferrer">疑問文（英語・別タブ）</a>{' ／ '}
          <a href="https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/present-continuous" target="_blank" rel="noreferrer">進行形（英語・別タブ）</a>
          {' ／ '}<a href="https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2-grammar/articles-a-an-the" target="_blank" rel="noreferrer">冠詞（英語・別タブ）</a>
          {' ／ '}<a href="https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/possessives-pronouns" target="_blank" rel="noreferrer">所有代名詞（英語・別タブ）</a>
          {' ／ '}<a href="https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/how-often" target="_blank" rel="noreferrer">頻度の副詞（英語・別タブ）</a>
          {' ／ '}<a href="https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/present-simple-be" target="_blank" rel="noreferrer">be動詞・短縮形・返事（英語・別タブ）</a>
          {course === 'Eiken4' && <>{' ／ '}<a href="https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/comparative-superlative-adjectives" target="_blank" rel="noreferrer">比較（英語・別タブ）</a>{' ／ '}<a href="https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/verbs-followed-ing-or-infinitive" target="_blank" rel="noreferrer">toとing（英語・別タブ）</a></>}
        </details>
      </footer>
    </div>
  </dialog>;
}
