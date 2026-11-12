import React, { useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  HeartHandshake,
  Layers,
  Sparkles
} from 'lucide-react';
import { CaseLenses, ClassroomCase } from '../../types/study';
import {
  buildCaseLensVisualDeck,
  buildTriLensMatrixDeck
} from '../../utils/visualDeckAdapter';
import {
  InlineVisualCardReel,
  VisualCardDeckModal
} from './VisualCardDeckModal';

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
  }
> = {
  behavioral: {
    icon: <Activity className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  cognitive: {
    icon: <Brain className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  },
  motivational: {
    icon: (
      <HeartHandshake className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    ),
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200'
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
      <div className="rounded-[20px] bg-[#f5f5f7] border border-black/[0.06] p-4 sm:p-5 space-y-3.5">
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

        <InlineVisualCardReel
          slides={deck.slides}
          ariaLabel={`${deck.deckTitle} 처방 슬라이드`}
          onSelectCard={openAtSlide}
        />
      </div>

      <VisualCardDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deckTitle={deck.deckTitle}
        slides={deck.slides}
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
      <div className="rounded-[20px] bg-[#1d1d1f] p-4 sm:p-5 text-white space-y-3.5 border border-white/10">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-0.5 text-[11px] font-semibold text-[#66b2ff] whitespace-nowrap">
            <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{deck.categoryBadge}</span>
          </span>
          <h4 className="text-sm sm:text-base font-bold text-white leading-snug korean-keep-all pt-0.5">
            3대 이론 렌즈 비교 슬라이드
          </h4>
          <p className="text-xs text-white/70 leading-relaxed korean-keep-all">
            {deck.deckSubtitle}
          </p>
        </div>

        <InlineVisualCardReel
          slides={deck.slides}
          ariaLabel={`${deck.deckTitle} 3중 렌즈 비교 슬라이드`}
          onSelectCard={openAtLens}
          surfaceTone="dark"
        />
      </div>

      <VisualCardDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deckTitle={deck.deckTitle}
        slides={deck.slides}
        initialSlideIndex={initialIndex}
      />
    </>
  );
};
