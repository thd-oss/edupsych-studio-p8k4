import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Brain,
  HeartHandshake,
  Layers,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { CaseLenses, ClassroomCase } from '../../types/study';
import {
  buildCaseLensVisualDeck,
  buildTriLensMatrixDeck
} from '../../utils/visualDeckAdapter';
import { VisualCardDeckModal } from './VisualCardDeckModal';

interface CaseLensVisualRendererProps {
  lensType: keyof CaseLenses;
  rawText: string;
  caseId?: string;
}

const LENS_THEME_META: Record<
  keyof CaseLenses,
  {
    icon: React.ReactNode;
    badgeClass: string;
    pillActiveBg: string;
  }
> = {
  behavioral: {
    icon: <Activity className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    pillActiveBg: 'bg-emerald-800'
  },
  cognitive: {
    icon: <Brain className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    pillActiveBg: 'bg-indigo-700'
  },
  motivational: {
    icon: (
      <HeartHandshake className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    ),
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    pillActiveBg: 'bg-amber-800'
  }
};

export const CaseLensVisualRenderer: React.FC<CaseLensVisualRendererProps> = ({
  lensType,
  rawText,
  caseId
}) => {
  const theme = LENS_THEME_META[lensType];
  const deck = useMemo(
    () => buildCaseLensVisualDeck(lensType, rawText, caseId),
    [caseId, lensType, rawText]
  );

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [initialIndex, setInitialIndex] = useState<number>(0);

  const openAtSlide = (idx: number) => {
    setInitialIndex(idx);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="rounded-[20px] bg-[#f5f5f7] border border-black/[0.06] p-4 sm:p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${theme.badgeClass}`}
            >
              {theme.icon}
              <span>{deck.categoryBadge}</span>
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-black/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-[#424245] korean-keep-all">
              <Sparkles
                className="w-3 h-3 text-[var(--accent-solid)] shrink-0"
                aria-hidden="true"
              />
              <span>{deck.takeawayBadge}</span>
            </span>
          </div>

          <h5 className="text-sm sm:text-base font-extrabold text-[#1d1d1f] leading-snug korean-keep-all pt-0.5">
            {deck.deckTitle}
          </h5>
          <p className="text-xs text-[#6e6e73] leading-relaxed korean-keep-all">
            {deck.deckSubtitle}
          </p>
        </div>

        {/* 단계별 빠른 점프 카드 목록 */}
        <div className="rounded-[16px] bg-white border border-black/[0.05] p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#6e6e73]">
            <span>진단·처방 단계 선택 (탭하면 플로팅 카드창으로 열림)</span>
            <span className="shrink-0 whitespace-nowrap text-[var(--accent-solid)] tabular-nums">
              총 {deck.slides.length}장
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {deck.slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => openAtSlide(idx)}
                className="group rounded-[12px] bg-[#f5f5f7] hover:bg-[var(--accent-subtle)] border border-black/[0.04] hover:border-[#0071e3]/25 px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 whitespace-nowrap rounded-full ${theme.pillActiveBg} group-hover:bg-[#0071e3] px-2.5 py-0.5 text-[10.5px] font-bold text-white tabular-nums transition-colors`}
                  >
                    {slide.stepBadge}
                  </span>
                  <span className="text-xs font-semibold text-[#1d1d1f] group-hover:text-[var(--accent-solid)] truncate">
                    {slide.title}
                  </span>
                </div>
                <ArrowUpRight
                  className="w-3.5 h-3.5 text-[#6e6e73] group-hover:text-[var(--accent-solid)] shrink-0"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => openAtSlide(0)}
            className="min-h-[40px] inline-flex items-center justify-center gap-2 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] px-5 py-2 text-xs sm:text-[13px] font-bold text-white shadow-xs transition-colors whitespace-nowrap"
          >
            <Maximize2
              className="w-3.5 h-3.5 text-[#66b2ff] shrink-0"
              aria-hidden="true"
            />
            <span>처방 카드창 열기 ({deck.slides.length}장 좌우 넘겨보기)</span>
          </button>
        </div>
      </div>

      <VisualCardDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryBadge={deck.categoryBadge}
        takeawayBadge={deck.takeawayBadge}
        deckTitle={deck.deckTitle}
        deckSubtitle={deck.deckSubtitle}
        diagramSlides={deck.slides}
        initialModality="diagram"
        initialSlideIndex={initialIndex}
      />
    </>
  );
};

interface TriLensSummaryMatrixProps {
  classroomCase: ClassroomCase;
}

export const TriLensSummaryMatrix: React.FC<TriLensSummaryMatrixProps> = ({
  classroomCase
}) => {
  const deck = useMemo(
    () => buildTriLensMatrixDeck(classroomCase),
    [classroomCase]
  );

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [initialIndex, setInitialIndex] = useState<number>(0);

  const openAtLens = (idx: number) => {
    setInitialIndex(idx);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="rounded-[20px] bg-[#1d1d1f] p-4 sm:p-5 text-white space-y-4 border border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-0.5 text-[11px] font-semibold text-[#66b2ff] whitespace-nowrap">
              <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{deck.categoryBadge}</span>
            </span>
            <h4 className="text-sm sm:text-base font-bold text-white leading-snug korean-keep-all pt-0.5">
              3대 이론 렌즈 한눈에 비교 카드 데크
            </h4>
            <p className="text-xs text-white/70 leading-relaxed korean-keep-all">
              {deck.deckSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openAtLens(0)}
            className="min-h-[38px] shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] px-4 py-1.5 text-xs font-bold text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>3중 렌즈 카드창 열기</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {deck.slides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => openAtLens(idx)}
              className="group rounded-[16px] bg-white/[0.07] hover:bg-white/[0.13] border border-white/10 p-3.5 text-left flex flex-col justify-between gap-2 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-0.5 text-[10.5px] font-bold text-white">
                    {slide.secondaryBadge ?? slide.stepBadge}
                  </span>
                  <ArrowUpRight
                    className="w-3.5 h-3.5 text-white/60 group-hover:text-[#66b2ff] shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs sm:text-[13px] font-bold text-white leading-snug korean-keep-all">
                  {slide.title}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#66b2ff]">
                탭하여 진단·처방 전문 열기 →
              </span>
            </button>
          ))}
        </div>
      </div>

      <VisualCardDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryBadge={deck.categoryBadge}
        takeawayBadge={deck.takeawayBadge}
        deckTitle={deck.deckTitle}
        deckSubtitle={deck.deckSubtitle}
        diagramSlides={deck.slides}
        initialModality="diagram"
        initialSlideIndex={initialIndex}
      />
    </>
  );
};
