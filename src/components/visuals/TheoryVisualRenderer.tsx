import React, { useMemo, useState } from 'react';
import {
  CircleDot,
  Cpu,
  GitBranch,
  Grid,
  Layers,
  Network,
  RefreshCw,
  Sliders,
  Sparkles
} from 'lucide-react';
import { TheoryVisualBlueprint, VisualTopologyType } from '../../types/visuals';
import { buildUnifiedTheoryVisualSlides } from '../../utils/visualDeckAdapter';
import {
  InlineVisualCardReel,
  VisualCardDeckModal
} from './VisualCardDeckModal';

interface TheoryVisualRendererProps {
  blueprint: TheoryVisualBlueprint;
  frameless?: boolean;
}

const TOPOLOGY_META: Record<
  VisualTopologyType,
  { labelKo: string; badgeClass: string; icon: React.ReactNode }
> = {
  'hierarchy-pyramid': {
    labelKo: '위계 피라미드 모형',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  'concentric-circles': {
    labelKo: '다층 동심원 체계도',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: <CircleDot className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  'matrix-2x2': {
    labelKo: '2×2 다차원 교차 매트릭스',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    icon: <Grid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  'stacked-gauge': {
    labelKo: '작업기억 인지부하 스택 게이지',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: <Cpu className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  'process-cycle': {
    labelKo: '순환적 피드백 루프',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  'step-flow': {
    labelKo: '단계별 발달·내면화 파이프라인',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
    icon: <GitBranch className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  'spectrum-continuum': {
    labelKo: '동기 내면화 스펙트럼 연속체',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: <Sliders className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  'triadic-network': {
    labelKo: '중심축-하위요소 상호작용 네트워크',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200',
    icon: <Network className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  }
};

export const TheoryVisualRenderer: React.FC<TheoryVisualRendererProps> = ({
  blueprint,
  frameless = false
}) => {
  const meta = TOPOLOGY_META[blueprint.topology];
  const unifiedSlides = useMemo(
    () => buildUnifiedTheoryVisualSlides(blueprint),
    [blueprint]
  );

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    initialIndex: number;
  }>({
    isOpen: false,
    initialIndex: 0
  });

  return (
    <>
      <div
        className={
          frameless
            ? 'space-y-3'
            : 'rounded-[20px] bg-[#f5f5f7] border border-black/[0.06] p-4 sm:p-5 space-y-3'
        }
      >
        {/* 상단 토폴로지 배지 & 한 줄 핵심 설명 */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeClass}`}
            >
              {meta.icon}
              <span>{meta.labelKo}</span>
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-950 korean-keep-all">
              <Sparkles
                className="w-3 h-3 text-amber-700 shrink-0"
                aria-hidden="true"
              />
              <span>{blueprint.keyTakeawayBadge}</span>
            </span>
          </div>

          {!frameless && (
            <h4 className="text-base sm:text-lg font-extrabold text-[#1d1d1f] leading-snug korean-keep-all">
              {blueprint.diagramTitle}
            </h4>
          )}
          <p className="text-xs sm:text-[13px] text-[#6e6e73] leading-relaxed korean-keep-all">
            {blueprint.diagramSubtitle}
          </p>
        </div>

        {/* 중첩 탭 없이 단일 연속 가로 슬라이드 릴 (도식 카드 + 통념 vs 처방 + 인포그래픽) */}
        <InlineVisualCardReel
          slides={unifiedSlides}
          ariaLabel={`${blueprint.diagramTitle} 개념 도식 및 통념 대 처방 슬라이드`}
          onSelectCard={(idx) =>
            setModalState({ isOpen: true, initialIndex: idx })
          }
        />
      </div>

      <VisualCardDeckModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        deckTitle={blueprint.diagramTitle}
        slides={unifiedSlides}
        initialSlideIndex={modalState.initialIndex}
      />
    </>
  );
};
