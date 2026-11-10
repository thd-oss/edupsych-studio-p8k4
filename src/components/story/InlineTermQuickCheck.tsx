import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Bookmark,
  CheckCircle2,
  HelpCircle,
  Network,
  RotateCw,
  XCircle
} from 'lucide-react';
import { Flashcard, FlashcardStatus } from '../../types/study';

interface InlineTermQuickCheckProps {
  cards: Flashcard[];
  bookmarks: string[];
  onUpdateStatus: (cardId: string, status: FlashcardStatus) => void;
  onToggleBookmark: (cardId: string) => void;
  onInspectNode: (nodeId: string) => void;
}

const STATUS_BADGE: Record<
  FlashcardStatus,
  { label: string; badgeClass: string }
> = {
  mastered: {
    label: '숙련(Mastered)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  review: {
    label: '복습(Review)',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  again: {
    label: '모름(Again)',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  unseen: {
    label: '미학습(Unseen)',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
  }
};

export const InlineTermQuickCheck: React.FC<InlineTermQuickCheckProps> = ({
  cards,
  bookmarks,
  onUpdateStatus,
  onToggleBookmark,
  onInspectNode
}) => {
  const [flippedMap, setFlippedMap] = useState<Record<string, boolean>>({});
  const [showEnFirst, setShowEnFirst] = useState(false);

  const toggleFlip = (id: string) => {
    setFlippedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const masteredCount = cards.filter((c) => c.status === 'mastered').length;
  const confusingCount = cards.filter(
    (c) => c.status === 'again' || c.status === 'review'
  ).length;

  return (
    <div className="space-y-3">
      {/* 상단 인라인 컨트롤 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 surface-subtle px-3.5 py-2.5 text-xs tabular-nums">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-800">
            인출 완료: {masteredCount}/{cards.length}장
          </span>
          {confusingCount > 0 && (
            <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-800">
              복습 표적: {confusingCount}장
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowEnFirst((prev) => !prev)}
            className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700"
          >
            <ArrowLeftRight className="w-3 h-3 text-indigo-600 shrink-0" />
            <span>{showEnFirst ? '영어 → 한국어' : '한국어 → 영어'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const allOpen = cards.every((c) => flippedMap[c.id]);
              const next: Record<string, boolean> = {};
              cards.forEach((c) => {
                next[c.id] = !allOpen;
              });
              setFlippedMap(next);
            }}
            className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700"
          >
            <RotateCw className="w-3 h-3 shrink-0" />
            <span>전체 뒤집기</span>
          </button>
        </div>
      </div>

      {/* 카드 그리드 (0ms 즉시 뒤집기 & 실시간 숙련도 체크) */}
      <div className="grid grid-cols-1 gap-2.5">
        {cards.map((card) => {
          const isFlipped = Boolean(flippedMap[card.id]);
          const badge = STATUS_BADGE[card.status];
          const isBookmarked = bookmarks.includes(card.id);

          return (
            <div
              key={card.id}
              className={`rounded-xl border p-4 transition-colors duration-150 ${
                isFlipped
                  ? 'bg-indigo-50/40 text-slate-900 border-indigo-300'
                  : 'bg-white text-slate-900 border-slate-900/[0.08] hover:border-slate-300'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold ${badge.badgeClass}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {card.id}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onInspectNode(card.id)}
                    className="inline-flex min-h-[28px] items-center gap-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600"
                    title="지식 그래프 연결 노드 확인"
                  >
                    <Network className="w-3 h-3 shrink-0" />
                    <span>연결 노드</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(card.id)}
                    aria-label="북마크 토글"
                    className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded-md bg-white border border-slate-200 text-slate-500"
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        isBookmarked
                          ? 'fill-amber-400 text-amber-500'
                          : 'opacity-60'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 클릭하여 0ms 즉시 뒤집기 영역 */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleFlip(card.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFlip(card.id);
                  }
                }}
                className="no-press-scale cursor-pointer py-2.5 space-y-2 select-none"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h5 className="text-sm sm:text-base font-extrabold text-slate-900 min-w-0">
                    {showEnFirst ? card.termEn : card.termKo}
                  </h5>
                  <span className="text-[11px] font-bold text-indigo-600 shrink-0">
                    {isFlipped ? '접기' : '정의 인출'}
                  </span>
                </div>

                {!isFlipped ? (
                  <p className="text-xs text-slate-500">
                    반대 언어 명칭과 핵심 메커니즘을 떠올린 뒤 클릭하세요.
                  </p>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-slate-900/[0.08] text-xs">
                    <p className="font-bold text-indigo-900">
                      ⇄ {showEnFirst ? card.termKo : card.termEn}
                    </p>
                    <div className="rounded-lg bg-white border border-slate-200/80 p-3 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-800 block">
                        핵심 학술 정의
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {card.definition}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50/70 border border-amber-200/80 p-3 space-y-1">
                      <span className="text-[10px] font-bold text-amber-900 block">
                        교실·상담실 처방 적용
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {card.classroomExample}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 숙련도 즉시 평가 버튼 바 */}
              <div className="pt-2 border-t border-slate-900/[0.06] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  숙련도 즉시 기록:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(card.id, 'again')}
                    className={`inline-flex min-h-[30px] items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold border ${
                      card.status === 'again'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-3 h-3 shrink-0" />
                    <span>Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(card.id, 'review')}
                    className={`inline-flex min-h-[30px] items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold border ${
                      card.status === 'review'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <HelpCircle className="w-3 h-3 shrink-0" />
                    <span>Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(card.id, 'mastered')}
                    className={`inline-flex min-h-[30px] items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold border ${
                      card.status === 'mastered'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>Mastered</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
