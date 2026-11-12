import { Medal, Trophy } from 'lucide-react';
import { FINAL_BOSS_MILESTONES, getFinalBossMilestone } from './battleClearRecords';
import './final-boss-record.css';

export default function FinalBossRecord({ count, result = false }: { count: number; result?: boolean }) {
  const { achieved, next } = getFinalBossMilestone(count);
  const celebrating = result && FINAL_BOSS_MILESTONES.some(target => target === count);
  return (
    <div className={`final-boss-record${result ? ' final-boss-record-result' : ''}`} data-final-boss-record={count}>
      <span className="final-boss-record-count"><Trophy size={14} aria-hidden="true" />最終裏ボス撃破 <strong>{count}回</strong></span>
      {achieved && <span className="final-boss-record-milestone"><Medal size={14} aria-hidden="true" />{celebrating ? `${count}回撃破達成！` : `${achieved}回達成`}</span>}
      <small>記録開始後{next ? ` · 次の目標 ${next}回` : ''}</small>
    </div>
  );
}
