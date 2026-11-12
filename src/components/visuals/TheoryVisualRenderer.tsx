import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CircleDot,
  Cpu,
  GitBranch,
  Grid,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Network,
  RefreshCw,
  Scale,
  Sliders,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import { TheoryVisualBlueprint, VisualTopologyType } from '../../types/visuals';
import {
  buildTheoryVisualDeck,
  VisualDeckModality
} from '../../utils/visualDeckAdapter';
import { VisualCardDeckModal } from './VisualCardDeckModal';

interface TheoryVisualRendererProps {
  blueprint: TheoryVisualBlueprint;
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
  blueprint
}) => {
  const meta = TOPOLOGY_META[blueprint.topology];
  const { diagramSlides, contrastSlides } = useMemo(
    () => buildTheoryVisualDeck(blueprint),
    [blueprint]
  );

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInitialModality, setModalInitialModality] =
    useState<VisualDeckModality>('diagram');
  const [modalInitialIndex, setModalInitialIndex] = useState<number>(0);

  const openDeckAt = (modality: VisualDeckModality, slideIndex = 0) => {
    setModalInitialModality(modality);
    setModalInitialIndex(slideIndex);
    setIsModalOpen(true);
  };

  return (
    <>
      <section className="rounded-[20px] bg-[#f5f5f7] border border-black/[0.06] p-4 sm:p-5 space-y-4">
        {/* 상단 토폴로지 배지 & 도식 헤더 */}
        <div className="space-y-2">
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

          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-extrabold text-[#1d1d1f] leading-snug korean-keep-all">
              {blueprint.diagramTitle}
            </h4>
            <p className="text-xs sm:text-[13px] text-[#6e6e73] leading-relaxed korean-keep-all">
              {blueprint.diagramSubtitle}
            </p>
          </div>
        </div>

        {/* 단계별 빠른 점프 카드 스트립 (탭 시 해당 카드로 플로팅 창 즉시 오픈) */}
        {diagramSlides.length > 0 && (
          <div className="rounded-[16px] bg-white border border-black/[0.05] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#6e6e73]">
              <span>구성 카드 미리보기 · 단계를 누르면 해당 카드로 바로 열립니다</span>
              <span className="shrink-0 whitespace-nowrap text-[var(--accent-solid)] tabular-nums">
                총 {diagramSlides.length}장
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {diagramSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => openDeckAt('diagram', idx)}
                  className="group rounded-[12px] bg-[#f5f5f7] hover:bg-[var(--accent-subtle)] border border-black/[0.04] hover:border-[#0071e3]/25 px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-[#1d1d1f] group-hover:bg-[#0071e3] px-2.5 py-0.5 text-[10.5px] font-bold text-white tabular-nums transition-colors">
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
        )}

        {/* 메인 플로팅 팝업 런처 버튼 + 보조 모달리티 바로열기 칩 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
          <button
            type="button"
            onClick={() => openDeckAt('diagram', 0)}
            className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] px-5 py-2.5 text-xs sm:text-[13px] font-bold text-white shadow-xs transition-colors whitespace-nowrap"
          >
            <Maximize2
              className="w-3.5 h-3.5 text-[#66b2ff] shrink-0"
              aria-hidden="true"
            />
            <span>플로팅 카드창으로 열기 ({diagramSlides.length}장 좌우 스와이프)</span>
          </button>

          <div className="flex flex-wrap items-center gap-1.5">
            {contrastSlides.length > 0 && (
              <button
                type="button"
                onClick={() => openDeckAt('contrast', 0)}
                className="min-h-[34px] inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-black/[0.05] border border-black/[0.08] px-3 py-1 text-xs font-semibold text-[#1d1d1f] transition-colors whitespace-nowrap"
              >
                <Scale
                  className="w-3.5 h-3.5 text-[var(--accent-solid)] shrink-0"
                  aria-hidden="true"
                />
                <span>통념 vs 처방 ({contrastSlides.length})</span>
              </button>
            )}

            {blueprint.microSimulation && (
              <button
                type="button"
                onClick={() => openDeckAt('simulation', 0)}
                className="min-h-[34px] inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-black/[0.05] border border-black/[0.08] px-3 py-1 text-xs font-semibold text-[#1d1d1f] transition-colors whitespace-nowrap"
              >
                <Stethoscope
                  className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                  aria-hidden="true"
                />
                <span>미니 시뮬레이션</span>
              </button>
            )}

            {blueprint.illustrationUrl && (
              <button
                type="button"
                onClick={() => openDeckAt('infographic', 0)}
                className="min-h-[34px] inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-black/[0.05] border border-black/[0.08] px-3 py-1 text-xs font-semibold text-[#1d1d1f] transition-colors whitespace-nowrap"
              >
                <ImageIcon
                  className="w-3.5 h-3.5 text-violet-600 shrink-0"
                  aria-hidden="true"
                />
                <span>인포그래픽</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <VisualCardDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryBadge={meta.labelKo}
        takeawayBadge={blueprint.keyTakeawayBadge}
        deckTitle={blueprint.diagramTitle}
        deckSubtitle={blueprint.diagramSubtitle}
        diagramSlides={diagramSlides}
        contrastSlides={contrastSlides}
        microSimulation={blueprint.microSimulation}
        illustrationUrl={blueprint.illustrationUrl}
        illustrationCaption={blueprint.illustrationCaption}
        initialModality={modalInitialModality}
        initialSlideIndex={modalInitialIndex}
      />
    </>
  );
};
