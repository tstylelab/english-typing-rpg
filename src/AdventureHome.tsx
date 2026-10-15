import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Headphones, Keyboard, LayoutGrid, Settings, Sword, Bookmark, Sparkles, Star } from 'lucide-react';
import { getMonsterArtUrl } from './monsterArt';
import { getHomeCompanions, type HomeCompanion } from './homeCompanions';
import './adventure-ui.css';

type Props = {
  today: number; course: string; content: string; mode: string;
  hasStarted: boolean; monsterName: string; monster: ReactNode; monsterDetails: string; monsterTaunt?: string;
  monsterCourse: string; monsterId?: string;
  grammar: ReactNode; onResume: () => void; onCourse: () => void;
  onTyping: () => void; onBeginner: () => void; onList: () => void;
  onPlayback: () => void; onPlaybackSettings: () => void; onBook: () => void;
  onSettings: () => void; onHelp: () => void; onVersus: () => void; onActivity: () => void;
};

// Presentation only: all progress, profile selection and navigation come from App.
let previousCompanions: readonly HomeCompanion[] = [];
export default function AdventureHome(p: Props) {
  const [companions] = useState(() => getHomeCompanions(p.monsterCourse, p.monsterId, previousCompanions));
  useEffect(() => { previousCompanions = companions; }, [companions]);
  return <main className="adventure-home">
    <section className="adventure-stage" aria-label="英語で冒険へ">
      <div className="adventure-copy">
        <img className="adventure-logo" src="/designs/title-logo-playful-v5.png" alt="English Typing Fantasy" />
        <div className="adventure-course"><div><h1>{p.course}</h1></div><p>{p.content} ／ {p.mode}</p></div>
        <button className="adventure-primary" onClick={p.onResume}><Sword size={24} /><span>{p.hasStarted ? '前回の続きから' : '教材を選んではじめる'}</span><ArrowRight size={22} /></button>
        {p.hasStarted && <button className="adventure-course-button" onClick={p.onCourse}><LayoutGrid size={21} /><span>教材を選ぶ</span><ArrowRight size={19} /></button>}
        <button className="adventure-beginner" onClick={p.onTyping}><Keyboard size={22} /><span>はじめてのタイピング練習</span><ArrowRight size={18} /></button>
      </div>
      <div className="adventure-cast">
        <div className="adventure-magic-circle" />
        {companions.map((companion, index) => <img key={`${companion.course}:${companion.monsterId}`} className={`adventure-side adventure-side-${index === 0 ? 'left' : 'right'}`} src={getMonsterArtUrl(companion.monsterId, companion.course)} alt="" />)}
        <div className="adventure-enemy">{p.monster}</div>
        <div className="adventure-enemy-caption" title={p.monsterTaunt}><strong>次の相手：{p.monsterName}</strong><span>{p.monsterDetails} · イラストを押すと拡大</span></div>
      </div>
    </section>
    <button className="adventure-daily" onClick={p.onActivity}><Sparkles size={20} /><span>今日の解答 <strong>{p.today}</strong> 問</span><span>学習記録を見る <ArrowRight size={16} /></span></button>
    <div className="adventure-destinations">
      <button className="adventure-destination is-review" onClick={p.onList}><Bookmark /><h2>問題リスト・復習</h2><span>覚えたい英語を、自分の力に。</span><img src={getMonsterArtUrl('m2_1', 'Eiken2')} alt="" /></button>
      <button className="adventure-destination is-listening" onClick={p.onPlayback}><Headphones /><h2>連続再生</h2><span>前回の設定ですぐに再生</span><img src={getMonsterArtUrl('m3_1', 'Eiken2')} alt="" /></button>
      <div className="adventure-destination is-grammar"><BookOpen /><h2>文法一覧</h2><span>一文から、しくみを見つけよう。</span><div className="adventure-grammar-action">{p.grammar}</div></div>
      <button className="adventure-destination is-collection" onClick={p.onBook}><Star /><h2>モンスター図鑑</h2><span>集めた出会いが、宝物。</span><img src={getMonsterArtUrl('c3_13', 'Eiken2')} alt="" /></button>
    </div>
    <footer className="adventure-footer"><button onClick={p.onBeginner}>初心者向けガイド</button><button onClick={p.onVersus}>対戦（1〜5人）</button><button onClick={p.onPlaybackSettings}>再生設定</button><button onClick={p.onHelp}>遊び方</button><button onClick={p.onSettings}><Settings size={16} />設定・データ</button></footer>
  </main>;
}
