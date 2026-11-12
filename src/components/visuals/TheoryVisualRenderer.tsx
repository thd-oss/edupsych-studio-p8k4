import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CircleDot,
  Cpu,
  GitBranch,
  Grid,
  Image as ImageIcon,
  Layers,
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
  VisualDeckModality,
  VisualDeckSlide
} from '../../utils/visualDeckAdapter';
import {
  DeckMicroSimulationCard,
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
  const { diagramSlides, contrastSlides } = useMemo(
    () => buildTheoryVisualDeck(blueprint),
    [blueprint]
  );

  const [activeTab, setActiveTab] = useState<VisualDeckModality>('diagram');
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    slides: VisualDeckSlide[];
    initialIndex: number;
    illustrationUrl?: string;
    illustrationCaption?: string;
  }>({
    isOpen: false,
    slides: [],
    initialIndex: 0
  });

  const resolvedTab: VisualDeckModality =
    (activeTab === 'contrast' && contrastSlides.length === 0) ||
    (activeTab === 'simulation' && !blueprint.microSimulation) ||
    (activeTab === 'infographic' && !blueprint.illustrationUrl)
      ? 'diagram'
      : activeTab;

  const modalityTabs = useMemo(() => {
    const list: Array<{
      id: VisualDeckModality;
      label: string;
      icon: React.ReactNode;
    }> = [
      {
        id: 'diagram',
        label: `도식 카드 (${diagramSlides.length})`,
        icon: <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      }
    ];

    if (contrastSlides.length > 0) {
      list.push({
        id: 'contrast',
        label: `통념 vs 처방 (${contrastSlides.length})`,
        icon: <Scale className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      });
    }
    if (blueprint.microSimulation) {
      list.push({
        id: 'simulation',
        label: '미니 시뮬레이션',
        icon: <Stethoscope className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      });
    }
    if (blueprint.illustrationUrl) {
      list.push({
        id: 'infographic',
        label: '인포그래픽',
        icon: <ImageIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      });
    }
    return list;
  }, [
    blueprint.illustrationUrl,
    blueprint.microSimulation,
    contrastSlides.length,
    diagramSlides.length
  ]);

  const openSlidesPopup = (slides: VisualDeckSlide[], initialIndex: number) => {
    setModalState({
      isOpen: true,
      slides,
      initialIndex
    });
  };

  const openInfographicPopup = () => {
    if (!blueprint.illustrationUrl) return;
    setModalState({
      isOpen: true,
      slides: [],
      initialIndex: 0,
      illustrationUrl: blueprint.illustrationUrl,
      illustrationCaption: blueprint.illustrationCaption
    });
  };

  return (
    <>
      <section
        className={
          frameless
            ? 'space-y-3.5'
            : 'rounded-[20px] bg-[#f5f5f7] border border-black/[0.06] p-4 sm:p-5 space-y-3.5'
        }
      >
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

          <div className="space-y-0.5">
            {!frameless && (
              <h4 className="text-base sm:text-lg font-extrabold text-[#1d1d1f] leading-snug korean-keep-all">
                {blueprint.diagramTitle}
              </h4>
            )}
            <p className="text-xs sm:text-[13px] text-[#6e6e73] leading-relaxed korean-keep-all">
              {blueprint.diagramSubtitle}
            </p>
          </div>
        </div>

        {/* 보조 모달리티 탭 스위치 (통념 대조·시뮬레이션·인포그래픽이 있을 때만 표시) */}
        {modalityTabs.length > 1 && (
          <div
            role="tablist"
            aria-label={`${blueprint.diagramTitle} 자료 유형 선택`}
            className="mobile-strip-scroll pt-0.5"
          >
            {modalityTabs.map((tab) => {
              const isSelected = resolvedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[32px] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold whitespace-nowrap transition-colors touch-manipulation ${
                    isSelected
                      ? 'bg-[#1d1d1f] text-white shadow-2xs'
                      : 'bg-white text-[#424245] border border-black/[0.06] hover:bg-black/[0.05] hover:text-[#1d1d1f]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 본문: 가로 슬라이드 카드 릴 (카드 터치 시 음영 집중 팝업 오픈) */}
        {resolvedTab === 'diagram' && (
          <InlineVisualCardReel
            slides={diagramSlides}
            ariaLabel={`${blueprint.diagramTitle} 도식 슬라이드`}
            onSelectCard={(idx) => openSlidesPopup(diagramSlides, idx)}
          />
        )}

        {resolvedTab === 'contrast' && (
          <InlineVisualCardReel
            slides={contrastSlides}
            ariaLabel={`${blueprint.diagramTitle} 통념 대 처방 슬라이드`}
            onSelectCard={(idx) => openSlidesPopup(contrastSlides, idx)}
          />
        )}

        {resolvedTab === 'simulation' && blueprint.microSimulation && (
          <DeckMicroSimulationCard simulation={blueprint.microSimulation} />
        )}

        {resolvedTab === 'infographic' && blueprint.illustrationUrl && (
          <button
            type="button"
            onClick={openInfographicPopup}
            aria-haspopup="dialog"
            className="group w-full rounded-[20px] bg-white border border-black/[0.06] hover:border-[#0071e3]/35 p-3.5 sm:p-4 text-left space-y-2.5 shadow-2xs hover:shadow-md transition-all touch-manipulation"
          >
            <img
              src={blueprint.illustrationUrl}
              alt={
                blueprint.illustrationCaption ??
                `${blueprint.diagramTitle} 인포그래픽`
              }
              loading="lazy"
              className="w-full max-h-72 object-contain rounded-[14px] bg-[#f5f5f7]"
            />
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#6e6e73] group-hover:text-[var(--accent-solid)]">
              <span className="truncate">
                {blueprint.illustrationCaption ?? '인포그래픽 전체 집중 보기'}
              </span>
              <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </div>
          </button>
        )}
      </section>

      <VisualCardDeckModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        deckTitle={blueprint.diagramTitle}
        slides={modalState.slides}
        initialSlideIndex={modalState.initialIndex}
        illustrationUrl={modalState.illustrationUrl}
        illustrationCaption={modalState.illustrationCaption}
      />
    </>
  );
};
