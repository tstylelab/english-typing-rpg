import { Star } from 'lucide-react';

const STAR_PATH = 'm12 3 2.78 5.63 6.22.91-4.5 4.38 1.06 6.19L12 17.19l-5.56 2.92 1.06-6.19L3 9.54l6.22-.91L12 3Z';

export default function MonsterBookStars({ completedBoth }: { completedBoth: boolean }) {
  return (
    <div
      role="img"
      aria-label={completedBoth ? '両方の出題方式で撃破' : '撃破済み'}
      data-monster-book-stars={completedBoth ? '2' : '1'}
      className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 text-yellow-400"
    >
      <Star size={16} fill="currentColor" aria-hidden="true" />
      {completedBoth && (
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d={STAR_PATH} fill="#fbbf24" stroke="#713f12" strokeWidth="3.5" strokeLinejoin="round" />
          <path d={STAR_PATH} fill="#fbbf24" stroke="#fef3c7" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
