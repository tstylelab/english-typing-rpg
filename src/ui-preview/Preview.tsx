import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, ChevronDown, Headphones, Home, Keyboard, Menu, Play, Search, Settings, Shield, SkipBack, SkipForward, Sparkles, Square, Star, Sword, Trophy, UserRound, Volume2, X } from 'lucide-react';
import { grammarGuides, getGrammarCard, type GrammarCourse } from '../data/grammarGuides';
import type { LevelKey } from '../data/questions';
import { getMonsterArtUrl, getMonsterPreviewArtUrl } from '../monsterArt';
import { courses, demoQuestions, gradeLabel, levelLabel, type DemoQuestion, type StudyState } from './data';
import { usePreviewSpeech } from './useSpeech';

type Page = 'home' | 'list' | 'player' | 'grammar' | 'course' | 'result' | 'book';
type Filter = 'all' | 'review' | 'history' | 'weak' | 'selected' | StudyState;
type Scope = 'current' | 'all' | 'grades';
type Visit = { page: Page; scroll: number };
const titles: Record<Page, string> = { home: 'ホーム', list: '問題リスト・復習', player: '連続再生', grammar: '文法一覧', course: '教材・学習方法', result: '学習結果', book: 'モンスター図鑑' };
const filters: [Filter, string][] = [['all', 'すべて'], ['review', 'あとで復習'], ['weak', '苦手'], ['selected', '自分で選んだ問題'], ['学習中', '学習中'], ['もう少し', 'もう少し'], ['覚えた', '覚えた'], ['history', '解除履歴']];
const matches = (q: DemoQuestion, filter: Filter) => filter === 'all' || (filter === 'review' ? q.review : filter === 'history' ? q.history : filter === 'weak' ? q.weak : filter === 'selected' ? q.selected : q.state === filter);

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const startedOutside = useRef(false);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; opener?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className="ui-modal" aria-label={title} onCancel={e => { e.preventDefault(); close(); }}
    onPointerDown={e => { startedOutside.current = e.target === e.currentTarget; }}
    onClick={e => { if (e.target === e.currentTarget && startedOutside.current) close(); }}>
    <section><header><h2>{title}</h2><button className="icon-button" aria-label="閉じる" onClick={close}><X /></button></header>{children}</section>
  </dialog>;
}

export default function Preview() {
  const [page, setPage] = useState<Page>('home');
  const history = useRef<Visit[]>([]);
  const restoredScroll = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const [modal, setModal] = useState<'menu' | 'settings' | 'about' | null>(null);
  const [entryPreview, setEntryPreview] = useState<'resume' | 'typing' | null>(null);
  const [questions, setQuestions] = useState(demoQuestions);
  const [course, setCourse] = useState<GrammarCourse>('Eiken3');
  const [level, setLevel] = useState<LevelKey>(3);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [listLimit, setListLimit] = useState(100);
  const [listScope, setListScope] = useState<'current' | 'all'>('current');
  const [selectedMode, setSelectedMode] = useState('音声バトル');
  const [notice, setNotice] = useState('');
  const [undo, setUndo] = useState<DemoQuestion | null>(null);
  const [playerSettingsOpen, setPlayerSettingsOpen] = useState(false);
  const [playScope, setPlayScope] = useState<Scope>('all');
  const [playGrades, setPlayGrades] = useState<GrammarCourse[]>(['Eiken3', 'EikenPre2']);
  const [playFilter, setPlayFilter] = useState<Filter>('review');
  const [readEnglish, setReadEnglish] = useState(true);
  const [readMeaning, setReadMeaning] = useState(true);
  const [readExample, setReadExample] = useState(false);
  const [rate, setRate] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [position, setPosition] = useState(0);
  const [running, setRunning] = useState(false);
  const [grammarQuery, setGrammarQuery] = useState('');
  const [grammarSection, setGrammarSection] = useState<number | null>(0);
  const [newLogo, setNewLogo] = useState(true);
  const [grammarCourse, setGrammarCourse] = useState<GrammarCourse>('Eiken3');
  const [cardId, setCardId] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const playerSpeech = usePreviewSpeech();
  const oneShot = usePreviewSpeech();

  useEffect(() => { document.documentElement.dataset.uiTheme = 'night'; }, []);
  useEffect(() => {
    window.scrollTo({ top: restoredScroll.current, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
  }, [page]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const stop = () => { setRunning(false); playerSpeech.stop(); oneShot.stop(); };
  const navigate = (next: Page) => {
    if (page === next) return;
    stop(); setModal(null); setNotice('');
    history.current.push({ page, scroll: window.scrollY });
    restoredScroll.current = 0; setPage(next);
  };
  const back = () => {
    stop(); setModal(null);
    const visit = history.current.pop();
    restoredScroll.current = visit?.scroll ?? 0;
    setPage(visit?.page ?? 'home');
  };
  const currentQuestions = questions.filter(q => q.course === course && q.level === level);
  const listed = questions.filter(q => (listScope === 'all' || (q.course === course && q.level === level)) && matches(q, filter)
    && `${q.text} ${q.meaning}`.toLowerCase().includes(query.trim().toLowerCase()));
  const eligible = useMemo(() => questions.filter(q => matches(q, playFilter) && (playScope === 'all' || (playScope === 'grades' ? playGrades.includes(q.course) : q.course === course && q.level === level))), [questions, playFilter, playScope, playGrades, course, level]);
  const playbackIds = queue ?? eligible.map(q => q.id);
  const current = questions.find(q => q.id === playbackIds[position]);
  const spokenParts = useMemo(() => current ? [
    ...(readEnglish ? [{ text: current.text, lang: 'en-US' }] : []),
    ...(readMeaning ? [{ text: current.meaning, lang: 'ja-JP' }] : []),
    ...(readExample && current.level !== 3 && current.example && current.example !== current.text ? [{ text: current.example, lang: 'en-US' }] : []),
  ] : [], [current, readEnglish, readMeaning, readExample]);
  const speechPlay = playerSpeech.play;
  const speechStop = playerSpeech.stop;
  useEffect(() => {
    if (!running || page !== 'player' || !spokenParts.length) return;
    speechPlay(spokenParts, rate, () => {
      if (position + 1 < playbackIds.length) setPosition(position + 1);
      else if (repeat && playbackIds.length > 1) setPosition(0);
      else { setRunning(false); setNotice('一巡しました。おつかれさまでした。'); }
    });
    return speechStop;
  }, [running, page, spokenParts, rate, position, playbackIds.length, repeat, speechPlay, speechStop]);

  const changePlayback = (change: () => void) => { stop(); setQueue(null); setPosition(0); change(); };
  const start = () => {
    oneShot.stop();
    if (!current || !spokenParts.length) return;
    if (queue === null) setQueue(eligible.map(q => q.id));
    setRunning(true); setNotice('');
  };
  const changeQuestion = (id: string, updates: Partial<DemoQuestion>) => setQuestions(items => items.map(q => q.id === id ? { ...q, ...updates } : q));
  const toggleReview = (q: DemoQuestion) => {
    setUndo(q); changeQuestion(q.id, { review: !q.review, history: q.review });
    setNotice(q.review ? 'あとで復習から外しました。解除履歴に残っています。' : 'あとで復習に登録しました。');
  };
  const removeAndNext = () => {
    if (!current) return;
    const ids = playbackIds.filter(id => id !== current.id);
    const shouldContinue = running;
    playerSpeech.stop(); oneShot.stop(); toggleReview(current);
    // A completed empty queue must not silently fall back to a new selection.
    setQueue(ids); setPosition(ids.length ? Math.min(position, ids.length - 1) : 0);
    setRunning(shouldContinue && ids.length > 0);
    setNotice(ids.length ? '復習から外し、次の問題に進みました。' : 'この範囲の復習が終了しました。解除履歴で再確認できます。');
  };
  const openGrammar = (q?: DemoQuestion) => {
    setGrammarCourse(q?.course ?? course); setGrammarQuery(''); setSavedOnly(false); setGrammarSection(0);
    setCardId(q ? getGrammarCard(q.course, q.level, { text: q.text })?.id ?? null : null);
    navigate('grammar');
  };
  const guide = grammarGuides[grammarCourse];
  const card = guide.cards.find(item => item.id === cardId);
  const visibleCards = guide.cards.filter(item => (!savedOnly || savedCards.includes(`${grammarCourse}:${item.id}`)) && `${item.title} ${item.term} ${item.subtitle} ${item.pattern} ${item.examples.flat().join(' ')}`.toLowerCase().includes(grammarQuery.toLowerCase()));
  const filterName = filters.find(([key]) => key === playFilter)?.[1];
  const scopeName = playScope === 'all' ? '全級・全Level' : playScope === 'current' ? `${gradeLabel(course)}・Level ${level}` : `${playGrades.length}教材・全Level`;
  // The previous session is independent of the course being browsed in this demo.
  const art = getMonsterPreviewArtUrl('c3_4', 'Eiken3');
  const renderCourseSelect = (value: GrammarCourse, update: (value: GrammarCourse) => void, label: string) => <label className="field">{label}<select value={value} onChange={e => update(e.target.value as GrammarCourse)}>{courses.map(c => <option key={c} value={c}>{gradeLabel(c)}</option>)}</select></label>;

  return <div className={`ui-preview fantasy-preview ${page === 'home' ? 'is-home' : ''}`}>
    <div className="trial-strip"><button onClick={() => setModal('about')}>デザイン試作 <span>・成績は見本</span></button><a className="live-preview-entry" href="/ui-live.html">本体の全機能を試す →</a><a href="http://127.0.0.1:5189/" target="_blank" rel="noreferrer">現行版を見る ↗</a></div>
    <header className="app-header"><div className="header-inner"><div className="header-leading"><button className="icon-button" onClick={back} disabled={page === 'home'} aria-label="前の画面へ戻る"><ArrowLeft size={19} /></button><button className="brand" onClick={() => navigate('home')} aria-label="ホームへ">{page === 'home' ? <><Sparkles size={22} /><span>English Typing <b>Fantasy</b></span></> : <img className="header-game-logo" src="/designs/title-logo-playful-v5.png" alt="English Typing Fantasy" />}</button></div><nav aria-label="主な画面">{([['home', Home, 'ホーム'], ['list', BookOpen, '問題リスト'], ['player', Headphones, '連続再生'], ['grammar', BookOpen, '文法一覧']] as const).map(([key, Icon, title]) => <button key={key} aria-current={page === key ? 'page' : undefined} onClick={() => key === 'grammar' ? openGrammar() : navigate(key)}><Icon size={17} /><span>{title}</span></button>)}</nav><button className="icon-button" onClick={() => setModal('menu')} aria-label="その他のメニュー"><Menu size={22} /></button></div></header>
    <main className={`preview-main page-${page}`}>
      <div className="page-title"><div><p className="eyebrow">{page === 'grammar' ? 'ことばの魔法書' : page === 'player' ? '耳から、英語を自分のものに。' : 'English Typing Fantasy'}</p><h1 ref={heading} tabIndex={-1}>{page === 'home' ? 'English Typing Fantasy' : titles[page]}</h1>{page === 'grammar' && <p className="page-invitation">気になる一文から、しくみを見つけよう。</p>}</div>{page === 'grammar' && <img className="grammar-host" src={getMonsterArtUrl('m1_5', 'Eiken4')} alt="ぷるぷるプリン博士" />}{page !== 'book' && <span className="profile-chip">プレイヤー1（見本）</span>}</div>

      {page === 'home' && <>
        <div className="adventurer-bar"><span><UserRound size={19} />プレイヤー <strong>プレイヤー1</strong><small>見本</small></span><span><Trophy size={19} />累計撃破 <strong>695</strong>体</span></div>
        <section className={newLogo ? "fantasy-stage playful-stage" : "fantasy-stage"} aria-label="英語で冒険へ">
          <div className="stage-copy">
            <div className="logo-frame"><img className={newLogo ? "fantasy-logo new-logo" : "fantasy-logo"} src={newLogo ? "/designs/title-logo-playful-v5.png" : "/designs/title-logo-wide.png"} alt="English Typing Fantasy" /></div>
            <div className="journey-info"><div className="journey-heading"><h2>英検3級 <span>Level 3</span></h2><button className="course-change-inline" onClick={() => navigate('course')} aria-label="教材・学習方法を選ぶ">変更 <ChevronDown size={14} /></button></div><p>文章問題 <span>／</span> 音声バトル</p><p className="next-opponent">次の相手 <b>じたばたエビフライ</b></p></div>
            <button className="adventure-start" onClick={() => setEntryPreview('resume')}><Sword size={24} />前回の続きから<ArrowRight size={22} /></button>
            <button className="beginner-entry" onClick={() => setEntryPreview('typing')}><Keyboard size={23} /><span>はじめてのタイピング練習</span><ArrowRight size={18} /></button>
          </div>
          <div className="encounter-art" aria-label="この世界のモンスターたち">
            <div className="magic-circle" /><div className="magic-sparks" aria-hidden="true">✦<span>✧</span><i>✦</i></div>
            <img className="encounter-side teacup" src={getMonsterPreviewArtUrl('c3_extra_3', 'Eiken3')} alt="はっけよい湯のみ山" />
            <img className="encounter-side pudding" src={getMonsterPreviewArtUrl('c3_13', 'Eiken3')} alt="巨大プリン王プルモンド" />
            <img className="encounter-main" src={art} alt="じたばたエビフライ" />
            <button className="encounter-name" onClick={() => navigate('book')}><Star size={16} fill="currentColor" />次の相手：じたばたエビフライ <ArrowRight size={16} /></button>
          </div>
        </section>
        <div className="adventure-record"><span><Sparkles size={17} /> 今日の冒険 <small>見本</small></span><span>解答 <b>24</b>問</span><span>覚えた <b>＋4</b>問</span><span className="record-message">ひとつ覚えるたび、強くなる。</span></div>
        <div className="fantasy-destinations">
          <button className="destination review-destination" onClick={() => { setFilter('review'); navigate('list'); }}><span className="destination-copy"><Bookmark size={22} /><h3>問題リスト・復習</h3><small>あとで復習 {currentQuestions.filter(q => q.review).length}問</small></span><img src={getMonsterArtUrl('m2_1', 'Eiken2')} alt="" /><ArrowRight className="destination-arrow" size={19} /></button>
          <button className="destination listening-destination" onClick={() => navigate('player')}><span className="destination-copy"><Headphones size={23} /><h3>連続再生</h3><small>再生画面を開く</small></span><img src={getMonsterArtUrl('m3_1', 'Eiken2')} alt="" /><ArrowRight className="destination-arrow" size={19} /></button>
          <button className="destination grammar-destination" onClick={() => openGrammar()}><span className="destination-copy"><BookOpen size={23} /><h3>文法一覧</h3><small>5級〜1級</small></span><span className="spellbook-art" aria-hidden="true" /><ArrowRight className="destination-arrow" size={19} /></button>
          <button className="destination collection-destination" onClick={() => navigate('book')}><span className="destination-copy"><Star size={23} /><h3>モンスター図鑑</h3><small>コレクションを見る</small></span><img src={getMonsterArtUrl('c3_13', 'Eiken2')} alt="" /><ArrowRight className="destination-arrow" size={19} /></button>
        </div>
        <div className="home-footer fantasy-footer"><button onClick={() => setModal('settings')}><Settings size={17} />設定・データ</button><button onClick={() => setNewLogo(!newLogo)}>{newLogo ? '以前のロゴと比べる' : '新しいロゴに戻す'}</button><button onClick={() => setModal('about')}>試作について</button></div>
      </>}

      {page === 'course' && <><section className="panel course-panel"><div className="section-heading"><h2>教材を選ぶ</h2><span>星と成績は表示見本</span></div><div className="grade-grid">{courses.map((c, i) => <button key={c} aria-pressed={course === c} onClick={() => { setCourse(c); setLevel(3); }}><b>{gradeLabel(c)}</b><span className="gold" aria-label={`${Math.max(0, 3 - i)}レベル達成`}>{'★'.repeat(Math.max(0, 3 - i))}</span>{course === c && <Check size={16} />}</button>)}</div><div className="level-grid">{([1, 2, 3] as const).map(l => <button key={l} aria-pressed={level === l} onClick={() => setLevel(l)}><b>Level {l}</b><span>{levelLabel(l)}</span></button>)}</div></section><div className="section-heading"><h2>学習方法を選ぶ</h2><span>{gradeLabel(course)}・Level {level}</span></div><div className="mode-grid">{[['基礎練習', '英語を見て、入力に慣れる', Shield], ['リスニング練習', '音声と和訳を手がかりに入力', Headphones], ['音声バトル', '聞こえた英語を入力', Sword], ['和訳バトル', '日本語の意味から英語を入力', Sword]].map(([title, description, Icon]) => { const ModeIcon = Icon as typeof Sword; return <button key={String(title)} aria-pressed={selectedMode === title} onClick={() => setSelectedMode(String(title))}><ModeIcon size={23} /><div><h3>{String(title)}</h3><p>{String(description)}</p></div>{selectedMode === title && <Check size={18} />}</button>; })}</div><div className="trial-next"><p>学習方法を選ぶところまでの試作です。バトルは現行版で遊べます。</p><a className="secondary" href="http://127.0.0.1:5189/" target="_blank" rel="noreferrer">現行版を開く ↗</a><button className="primary" onClick={() => navigate('result')}>結果画面の見本を見る <ArrowRight size={17} /></button></div></>}

      {page === 'list' && <><section className="panel compact-panel"><div className="toolbar">{renderCourseSelect(course, setCourse, '教材')}<label className="field">Level<select value={level} onChange={e => setLevel(Number(e.target.value) as LevelKey)}>{([1, 2, 3] as const).map(l => <option key={l} value={l}>Level {l}・{levelLabel(l)}</option>)}</select></label><label className="field search-field">問題を探す<div className="search"><Search size={18} /><input placeholder="英語・日本語で検索" value={query} onChange={e => setQuery(e.target.value)} /></div></label><label className="check-label"><input type="checkbox" checked={listScope === 'all'} onChange={e => setListScope(e.target.checked ? 'all' : 'current')} />全級から探す</label></div><div className="filter-row" role="group" aria-label="問題の絞り込み">{filters.map(([key, title]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{title}</button>)}</div></section><div className="list-heading"><div><b>{listed.length}問</b><span>収録教材の全問題・成績は見本</span></div><div><button className="secondary" aria-pressed={selecting} onClick={() => setSelecting(!selecting)}>まとめて選ぶ</button><button className="primary" disabled={!listed.length} onClick={() => { stop(); setQueue(listed.map(q => q.id)); setPosition(0); navigate('player'); }}>この一覧を再生 <Play size={15} /></button></div></div><div className="question-list">{listed.slice(0, listLimit).map(q => <article key={q.id} className="question-row">{selecting && <input type="checkbox" aria-label={`${q.text}を選択`} checked={q.selected} onChange={e => changeQuestion(q.id, { selected: e.target.checked })} />}<button className="audio-button" aria-label={`${q.text}を聞く`} onClick={() => oneShot.play([{ text: q.text, lang: 'en-US' }], rate)}><Volume2 size={18} /></button><div className="question-content"><span className="question-context">{gradeLabel(q.course)}・Level {q.level}</span><h3 lang="en">{q.text}</h3><p>{q.meaning}</p>{q.level !== 3 && q.example && <details><summary>例文を見る</summary><p lang="en">{q.example}</p></details>}</div><div className="question-controls"><label className="sr-only" htmlFor={`state-${q.id}`}>学習状態：{q.text}</label><select id={`state-${q.id}`} className="state-select" value={q.state} onChange={e => changeQuestion(q.id, { state: e.target.value as StudyState })}>{(['学習中', 'もう少し', '覚えた'] as const).map(s => <option key={s}>{s}</option>)}</select><button className={q.review ? 'saved small-button' : 'small-button'} aria-pressed={q.review} onClick={() => toggleReview(q)}><Bookmark size={14} fill={q.review ? 'currentColor' : 'none'} />{q.review ? '登録済み' : 'あとで復習'}</button>{filter === 'history' && <button className="text-button" onClick={() => { setUndo(q); changeQuestion(q.id, { history: false }); setNotice('履歴から消しました。学習状態は変わりません。'); }}>履歴から消す</button>}</div></article>)}</div>{listed.length > listLimit && <button className="secondary load-more-questions" onClick={() => setListLimit(limit => limit + 100)}>さらに表示（{Math.min(listLimit, listed.length)} / {listed.length}問）</button>}{!listed.length && <div className="empty"><Search /><h2>該当する問題がありません</h2><p>検索語や絞り込みを変えてみてください。</p><button onClick={() => { setQuery(''); setFilter('all'); }}>絞り込みを解除</button></div>}</>}

      {page === 'player' && <><div className="player-layout"><section className="panel player-panel"><div className="player-top"><div className="listening-host"><img src={getMonsterArtUrl('m3_1', 'Eiken2')} alt="" /><div><span className="eyebrow">{queue !== null ? '選んだ再生リスト' : filterName}</span><p>{queue !== null ? `${playbackIds.length}問` : `${scopeName}・${eligible.length}問`}</p><span className="listening-invitation">自分のペースで、ひとつずつ。</span></div></div><button className="secondary" aria-expanded={playerSettingsOpen} onClick={() => setPlayerSettingsOpen(!playerSettingsOpen)}><Settings size={16} />再生設定<ChevronDown size={15} /></button></div><div className="play-controls"><button className="icon-button" aria-label="前の問題" disabled={position === 0} onClick={() => { stop(); setPosition(Math.max(0, position - 1)); }}><SkipBack /></button><button className="primary play-main" disabled={!current || !spokenParts.length} onClick={running && !playerSpeech.error ? stop : start}>{running && !playerSpeech.error ? <><Square size={18} />停止</> : <><Play size={19} fill="currentColor" />この設定で再生</>}</button><button className="icon-button" aria-label="次の問題" disabled={position + 1 >= playbackIds.length} onClick={() => { stop(); setPosition(position + 1); }}><SkipForward /></button></div><div className="now-playing"><div className="now-meta"><span><Headphones size={16} />{running && !playerSpeech.error ? '● 再生中' : '現在の問題'}</span><span>{current ? position + 1 : 0} / {playbackIds.length}</span></div>{current ? <><p className="question-context">{gradeLabel(current.course)}・Level {current.level} {levelLabel(current.level)}</p><h2 lang="en">{current.text}</h2><p className="player-meaning">{current.meaning}</p>{current.level !== 3 && current.example && <div className="player-example"><span className="eyebrow">例文</span><p lang="en">{current.example}</p></div>}<div className="player-review">{current.review ? <button className="secondary" onClick={removeAndNext}><Check size={17} />復習から外して次へ</button> : <button className="secondary" onClick={() => toggleReview(current)}><Bookmark size={17} />あとで復習に登録</button>}<button className="text-button" onClick={() => { setFilter('history'); setListScope('all'); navigate('list'); }}>解除履歴を見る</button></div></> : <div className="empty"><Headphones /><h2>再生対象がありません</h2><p>再生設定から範囲や対象を変えてください。</p><button onClick={() => setPlayerSettingsOpen(true)}>再生設定を開く</button></div>}</div><div className="player-bottom"><label className="check-label"><input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} />リピート（2問以上）</label><span>{rate}倍速 · {[readEnglish && '英語', readMeaning && '和訳', readExample && '例文'].filter(Boolean).join(' → ') || '読み上げ内容を選択してください'}</span></div>{playerSpeech.error && <p className="error" role="alert">{playerSpeech.error}</p>}</section>
        {playerSettingsOpen && <aside className="panel playback-settings"><header><h2>再生設定</h2><button className="icon-button" aria-label="再生設定を閉じる" onClick={() => setPlayerSettingsOpen(false)}><X size={18} /></button></header><p className="quiet">変更すると再生を停止します。</p><fieldset><legend>どの教材から？</legend><div className="segmented">{([['current', 'このLevel'], ['all', '全級'], ['grades', '級を選ぶ']] as const).map(([key, title]) => <button key={key} aria-pressed={playScope === key} onClick={() => changePlayback(() => setPlayScope(key))}>{title}</button>)}</div>{playScope === 'grades' && <div className="grade-checks">{courses.map(c => <label key={c}><input type="checkbox" checked={playGrades.includes(c)} onChange={e => changePlayback(() => setPlayGrades(prev => e.target.checked ? [...prev, c] : prev.filter(item => item !== c)))} />{gradeLabel(c)}</label>)}</div>}</fieldset><label className="field">再生する問題<select value={playFilter} onChange={e => changePlayback(() => setPlayFilter(e.target.value as Filter))}>{filters.map(([key, title]) => <option value={key} key={key}>{title}</option>)}</select></label><fieldset><legend>読み上げる内容</legend>{([['英語', readEnglish, setReadEnglish], ['和訳', readMeaning, setReadMeaning], ['例文（Level 1・2）', readExample, setReadExample]] as const).map(([title, value, setter]) => <label className="check-label" key={title}><input type="checkbox" checked={value} onChange={e => { stop(); setter(e.target.checked); }} />{title}</label>)}</fieldset><label className="field">読み上げ速度<select value={rate} onChange={e => { stop(); setRate(Number(e.target.value)); }}>{[0.7, 0.85, 1, 1.15, 1.3].map(n => <option key={n} value={n}>{n}倍速</option>)}</select></label><button className="primary" onClick={() => setPlayerSettingsOpen(false)}>設定を閉じる <Check size={16} /></button></aside>}</div></>}

      {page === 'grammar' && <><div className="toolbar panel compact-panel">{renderCourseSelect(grammarCourse, c => { setGrammarCourse(c); setCardId(null); setGrammarSection(0); }, '教材')}<label className="field search-field">文法を探す<div className="search"><Search size={18} /><input placeholder="現在完了、have been など" value={grammarQuery} onChange={e => { setGrammarQuery(e.target.value); setCardId(null); }} /></div></label><button className="secondary" aria-pressed={savedOnly} onClick={() => { setSavedOnly(!savedOnly); setCardId(null); }}><Bookmark size={16} />保存した解説</button></div>{card ? <article className="grammar-reading"><div className="section-heading"><button className="text-button" onClick={() => setCardId(null)}><ArrowLeft size={16} />目次へ</button><button className="secondary" aria-pressed={savedCards.includes(`${grammarCourse}:${card.id}`)} onClick={() => { const key = `${grammarCourse}:${card.id}`; setSavedCards(prev => prev.includes(key) ? prev.filter(id => id !== key) : [...prev, key]); }}><Bookmark size={16} />{savedCards.includes(`${grammarCourse}:${card.id}`) ? '保存済み' : '解説を保存'}</button></div><div className="reading-title"><img src={getMonsterArtUrl('m1_5', 'Eiken4')} alt="" /><div><span className="eyebrow">{card.term}</span><h2>{card.subtitle ?? card.title}</h2></div></div><p className="grammar-pattern">{card.pattern}</p>{card.examples.map(([en, ja]) => <div className="grammar-example" key={en}><button className="audio-button" aria-label={`${en}を聞く`} onClick={() => oneShot.play([{ text: en, lang: 'en-US' }], rate)}><Volume2 size={17} /></button><div><h3 lang="en">{en}</h3><p>{ja}</p></div></div>)}<div className="grammar-tip"><span><Sparkles size={18} />ここがポイント</span><p>{card.tip}</p></div>{card.compare && <dl>{card.compare.map(([name, text]) => <div key={name}><dt>{name}</dt><dd>{text}</dd></div>)}</dl>}<details><summary>もうひとつヒント</summary><p>{card.more}</p></details></article> : <><label className="grammar-chapter-picker">章を選ぶ<select value={grammarQuery || savedOnly || grammarSection === null ? 'all' : grammarSection} onChange={e => { setGrammarSection(e.target.value === 'all' ? null : Number(e.target.value)); setGrammarQuery(''); setSavedOnly(false); }}>{guide.sections.map((section, index) => <option key={section.title} value={index}>{String(index + 1).padStart(2, '0')} {section.title}</option>)}<option value="all">すべての章</option></select></label><div className="grammar-chapters" role="group" aria-label="文法の章を選ぶ">{guide.sections.map((section, index) => <button key={section.title} aria-pressed={grammarSection === index && !grammarQuery && !savedOnly} onClick={() => { setGrammarSection(index); setGrammarQuery(''); setSavedOnly(false); }}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</button>)}<button aria-pressed={grammarSection === null && !grammarQuery && !savedOnly} onClick={() => { setGrammarSection(null); setGrammarQuery(''); setSavedOnly(false); }}>すべて</button></div><p className="muted-note">{grammarQuery || savedOnly ? `${visibleCards.length}件の解説` : '例文を選ぶと、文のしくみが開きます。'}</p>{guide.sections.map((section, index) => { const items = visibleCards.filter(c => c.section === index); return items.length > 0 && (grammarSection === null || grammarSection === index || grammarQuery || savedOnly) && <section className="grammar-section" key={section.title}><h2><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</h2><div className="grammar-index">{items.map(c => <button key={c.id} onClick={() => { setCardId(c.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}><div className="grammar-card-copy"><span className="grammar-card-topic">{c.subtitle ?? c.title}</span><b lang="en">{c.examples[0]?.[0] ?? c.title}</b><p>{c.examples[0]?.[1]}</p><span className="grammar-card-link" aria-hidden="true"><ArrowRight size={18} /></span></div></button>)}</div></section>; })}{!visibleCards.length && <div className="empty"><BookOpen /><h2>該当する解説がありません</h2><button onClick={() => { setGrammarQuery(''); setSavedOnly(false); }}>すべての解説を見る</button></div>}</>}</>}

      {page === 'result' && <><section className="result-summary panel"><div><span className="eyebrow gold">CLEAR! · 表示見本</span><h2>今回も、一歩前へ。</h2><p>{gradeLabel(course)}・Level {level} {levelLabel(level)}</p></div><div className="result-numbers"><span><b>＋2</b>覚えた</span><span><b>4問</b>今回の解答</span></div><button className="primary" onClick={() => navigate('course')}>学習方法へ <ArrowRight size={18} /></button></section><div className="section-heading"><h2>今回の問題を確認</h2><button className="secondary" onClick={() => navigate('list')}>問題リストへ</button></div><div className="question-list">{currentQuestions.slice(0, 4).map(q => <article className="question-row result-row" key={q.id}><button className="audio-button" aria-label={`${q.text}を聞く`} onClick={() => oneShot.play([{ text: q.text, lang: 'en-US' }], rate)}><Volume2 size={18} /></button><div className="question-content"><h3 lang="en">{q.text}</h3><p>{q.meaning}</p>{getGrammarCard(q.course, q.level, { text: q.text }) && <button className="text-button" onClick={() => openGrammar(q)}><BookOpen size={15} />この文のしくみ</button>}</div><div className="question-controls"><span className="success">学習OK</span><button className="small-button" aria-pressed={q.review} onClick={() => toggleReview(q)}><Bookmark size={14} />{q.review ? '登録済み' : 'あとで復習'}</button></div></article>)}</div><details className="panel compact-panel result-details"><summary>入力の記録・詳しい成績（見本）</summary><p>打ち直しなし：1問／打ち直しあり：3問／スキップ：0問</p><p>入力の記録と、学習状態の変化を分けて表示する案です。</p></details></>}

      {page === 'book' && <><div className="live-book-notice"><span>本体の図鑑です。全級・全Levelを切り替え、画像を押すと拡大できます。</span><a href={`/ui-live.html?screen=monster-book&course=${course}&level=${level}`} target="_blank" rel="noreferrer">広い画面で開く ↗</a></div><iframe className="live-book-frame" src={`/ui-live.html?screen=monster-book&embedded=1&course=${course}&level=${level}`} title="本体のモンスター図鑑" /></>}
      {oneShot.error && <p className="error" role="alert">{oneShot.error}</p>}
    </main>
    {notice && <div className="toast" role="status"><span>{notice}</span>{undo && <button onClick={() => { setQuestions(items => items.map(q => q.id === undo.id ? undo : q)); setUndo(null); setNotice('変更を取り消しました。'); }}>元に戻す</button>}<button aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={16} /></button></div>}
    {entryPreview && <Modal title={entryPreview === 'resume' ? '前回の続きから' : 'はじめてのタイピング練習'} close={() => setEntryPreview(null)}><div className="entry-preview">{entryPreview === 'resume' ? <><img src={art} alt="じたばたエビフライ" /><h3>じたばたエビフライ</h3><p>英検3級 Level 3 ／ 音声バトル</p><p>採用後は、この相手とのバトルを直接開始する入口です。</p></> : <><Keyboard size={64} /><h3>キーの場所から、ゆっくり練習。</h3><p>採用後は、アルファベットを1文字ずつ入力する練習に直接進む入口です。</p></>}<p className="entry-preview-note">実際の練習・バトルは本体の実機能テストへ進めます。成績はこのローカルサイトに保存されます。</p><a className="primary" href={entryPreview === 'typing' ? '/ui-live.html?screen=typing-practice' : '/ui-live.html'}>本体で試す →</a><button className="primary" onClick={() => setEntryPreview(null)}>ホームに戻る</button></div></Modal>}
    {modal && <Modal title={modal === 'menu' ? 'メニュー' : modal === 'settings' ? '設定・データ' : '今回の試作について'} close={() => setModal(null)}>{modal === 'menu' ? <div className="menu-grid"><button onClick={() => navigate('home')}><Home />ホーム</button><button onClick={() => navigate('course')}><Sword />教材・学習方法</button><button onClick={() => navigate('book')}><Star />モンスター図鑑</button><button onClick={() => setModal('settings')}><Settings />設定・データ</button><button onClick={() => setModal('about')}><BookOpen />試作の使い方</button><a href="http://127.0.0.1:5189/" target="_blank" rel="noreferrer">現行版を別タブで開く ↗</a></div> : modal === 'settings' ? <div className="settings-demo"><details open><summary>音声</summary><label className="field">読み上げ速度<select value={rate} onChange={e => { stop(); setRate(Number(e.target.value)); }}>{[0.7, 0.85, 1, 1.15, 1.3].map(n => <option key={n} value={n}>{n}倍速</option>)}</select></label><button className="secondary" onClick={() => oneShot.play([{ text: 'Let us learn English together.', lang: 'en-US' }], rate)}><Volume2 size={16} />音声を試す</button></details><details><summary>プレイヤー</summary><p>この試作は見本プレイヤーです。実際のプレイヤーの変更は現行版で行ってください。</p></details><details><summary>学習データの保存・読み込み</summary><p>配置の確認用です。データ操作は現行版の設定画面で行ってください。</p><a href="http://127.0.0.1:5189/" target="_blank" rel="noreferrer">現行版を開く ↗</a></details></div> : <div className="about-copy"><p>ホーム、共通ナビゲーション、連続再生を中心に、問題リスト・文法・結果画面のつながりも試せます。</p><ul><li>英語と解説は収録済み教材です。</li><li>成績・復習登録・星は見本です。操作はこのタブ内だけに反映され、再読み込みすると戻ります。</li><li>音声再生・絞り込み・検索・復習の登録と解除を試せます。</li><li>図鑑は本体を直接使用します。問題リストは収録教材を全件使用します。</li><li>バトル・AI相談・プレイヤー管理・保存は、上部の「本体の全機能を試す」から確認できます。本体側は既存の画面構成です。</li></ul><p>既存のロゴ・背景・モンスターを主役にした、第4案です。ゲームらしい世界観と操作の分かりやすさを確認してください。</p><button className="primary" onClick={() => setModal(null)}>試してみる <ArrowRight size={17} /></button></div>}</Modal>}
  </div>;
}
