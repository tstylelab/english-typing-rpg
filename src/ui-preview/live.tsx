import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { type LocalPreviewOptions } from '../App';
import '../index.css';
import './live.css';
import { courses } from './data';

const params = new URLSearchParams(location.search);
const screens = ['title', 'monster-book', 'question-list', 'level-select', 'settings', 'typing-practice'] as const;
const screen = screens.find(value => value === params.get('screen')) ?? 'title';
const embedded = params.get('embedded') === '1';
const difficulty = courses.find(value => value === params.get('course'));
const level = ([1, 2, 3] as const).find(value => String(value) === params.get('level'));
const options: LocalPreviewOptions = { screen, revealMonsterArt: screen === 'monster-book', difficulty, level };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.DEV ? <>
      {!embedded && <header className="live-preview-bar">
        <a href="/ui-preview.html" aria-label="デザイン試作に戻る"><img src="/designs/title-logo-playful-v5.png" alt="English Typing Fantasy" /></a>
        <div><strong>本体の実機能テスト</strong><span>全教材・全モンスター・バトル・保存機能を使用できます。データはこのローカルサイトに保存されます。</span></div>
        <a href="/ui-preview.html">デザイン試作に戻る</a>
      </header>}
      <App localPreview={options} />
    </> : <p>このページはローカル確認用です。</p>}
  </StrictMode>,
);
