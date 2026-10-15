import { useState } from 'react';
import { List } from 'lucide-react';
import PlaybackSettingsDialog from './PlaybackSettingsDialog';

export type PlaybackTarget = { key: string; text: string; meaning: string; course: string; level: number };
type Snapshot = { items: PlaybackTarget[]; scope: string; source: string };

export default function PlaybackTargetsButton({ count, getSnapshot }: { count: number; getSnapshot: () => Snapshot }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(200);
  const term = query.trim().toLocaleLowerCase();
  const filtered = snapshot?.items.filter(item => !term || `${item.text} ${item.meaning} ${item.course}`.toLocaleLowerCase().includes(term)) ?? [];
  return <>
    <button type="button" className="playback-targets-button" onClick={() => { setQuery(''); setLimit(200); setSnapshot(getSnapshot()); }}><List size={18} aria-hidden="true" />再生する問題を見る<span>{count}問</span></button>
    {snapshot && <PlaybackSettingsDialog title="再生する問題" closeLabel="一覧を閉じて戻る" onClose={() => setSnapshot(null)}>
      <div className="playback-targets-content">
        <p className="playback-targets-source"><strong>{snapshot.source}</strong> · {snapshot.items.length}問</p>
        <p>{snapshot.scope}</p>
        <p className="playback-targets-note">現在の設定で再生できる問題です。シャッフル時の再生順とは異なります。</p>
        <label className="playback-targets-search">この再生対象から探す<input type="search" value={query} placeholder="英語・和訳・級で検索" onChange={e => { setQuery(e.target.value); setLimit(200); }} /></label>
        <div className="playback-targets-count"><span role="status">{filtered.length}問{term ? 'が一致' : ''}</span>{query && <button onClick={() => setQuery('')}>検索を解除</button>}</div>
        {!filtered.length && <p className="playback-targets-empty">{snapshot.items.length ? '一致する問題がありません。検索語を変えてください。' : '再生できる問題がありません。元の画面で対象範囲や読み上げ内容を確認してください。'}</p>}
        <ol className="playback-targets-list">{filtered.slice(0, limit).map(item => <li key={item.key}>
          <span className="playback-targets-course">{item.course} · Level {item.level}</span><strong lang="en">{item.text}</strong><span className="playback-targets-meaning">{item.meaning}</span>
        </li>)}</ol>
        {filtered.length > limit && <button className="playback-targets-more" onClick={() => setLimit(value => value + 200)}>さらに表示（{limit} / {filtered.length}問）</button>}
      </div>
    </PlaybackSettingsDialog>}
  </>;
}
