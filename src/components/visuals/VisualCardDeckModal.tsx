import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  Scale,
  Sparkles,
  Stethoscope,
  X,
  XCircle
} from 'lucide-react';
import { ConceptMicroSimulation } from '../../types/visuals';
import {
  DeckAccentTone,
  VisualDeckModality,
  VisualDeckSlide
} from '../../utils/visualDeckAdapter';

export interface VisualCardDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryBadge: string;
  takeawayBadge?: string;
  deckTitle: string;
  deckSubtitle?: string;
  diagramSlides: VisualDeckSlide[];
  contrastSlides?: VisualDeckSlide[];
  microSimulation?: ConceptMicroSimulation;
  illustrationUrl?: string;
  illustrationCaption?: string;
  initialModality?: VisualDeckModality;
  initialSlideIndex?: number;
}

const SCROLL_SETTLE_DEBOUNCE_MS = 120;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const ACCENT_STYLE_MAP: Record<
  DeckAccentTone,
  {
    stepPill: string;
    secondaryPill: string;
    subtitleText: string;
    calloutBox: string;
    bulletDot: string;
  }
> = {
  indigo: {
    stepPill: 'bg-[#1d1d1f] text-white',
    secondaryPill: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    subtitleText: 'text-indigo-700',
    calloutBox: 'bg-indigo-50/70 border-indigo-200/90 text-indigo-950',
    bulletDot: 'bg-indigo-600'
  },
  emerald: {
    stepPill: 'bg-emerald-800 text-white',
    secondaryPill: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    subtitleText: 'text-emerald-800',
    calloutBox: 'bg-emerald-50/75 border-emerald-200/90 text-emerald-950',
    bulletDot: 'bg-emerald-600'
  },
  amber: {
    stepPill: 'bg-[#1d1d1f] text-white',
    secondaryPill: 'bg-amber-100/90 text-amber-950 border-amber-300',
    subtitleText: 'text-amber-800',
    calloutBox: 'bg-amber-50/80 border-amber-200/90 text-amber-950',
    bulletDot: 'bg-amber-500'
  },
  rose: {
    stepPill: 'bg-rose-800 text-white',
    secondaryPill: 'bg-rose-50 text-rose-900 border-rose-200',
    subtitleText: 'text-rose-800',
    calloutBox: 'bg-rose-50/75 border-rose-200/90 text-rose-950',
    bulletDot: 'bg-rose-600'
  },
  sky: {
    stepPill: 'bg-[#1d1d1f] text-white',
    secondaryPill: 'bg-sky-50 text-sky-900 border-sky-200',
    subtitleText: 'text-sky-800',
    calloutBox: 'bg-sky-50/75 border-sky-200/90 text-sky-950',
    bulletDot: 'bg-sky-600'
  },
  violet: {
    stepPill: 'bg-violet-800 text-white',
    secondaryPill: 'bg-violet-50 text-violet-900 border-violet-200',
    subtitleText: 'text-violet-800',
    calloutBox: 'bg-violet-50/75 border-violet-200/90 text-violet-950',
    bulletDot: 'bg-violet-600'
  },
  slate: {
    stepPill: 'bg-slate-800 text-white',
    secondaryPill: 'bg-slate-100 text-slate-800 border-slate-300',
    subtitleText: 'text-slate-700',
    calloutBox: 'bg-slate-50 border-slate-200 text-slate-900',
    bulletDot: 'bg-slate-600'
  }
};

const GAUGE_SEGMENT_BG: Record<'indigo' | 'rose' | 'emerald' | 'slate', string> =
  {
    indigo: 'bg-indigo-600 text-white',
    rose: 'bg-rose-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    slate: 'bg-slate-200 text-slate-700'
  };

function isPointOutsideDialog(
  event: PointerEvent,
  dialog: HTMLDialogElement
): boolean {
  const rect = dialog.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

const DeckMicroSimulationView: React.FC<{
  simulation: ConceptMicroSimulation;
}> = ({ simulation }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [compareAll, setCompareAll] = useState<boolean>(false);

  return (
    <div className="rounded-[22px] bg-white border border-black/[0.06] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="rounded-[18px] bg-[#1d1d1f] text-white p-4 sm:p-5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-amber-300 whitespace-nowrap">
            <Stethoscope className="w-3.5 h-3.5 shrink-0" />
            <span>현장 의사결정 미니 시뮬레이션</span>
          </span>
          <button
            type="button"
            onClick={() => setCompareAll((prev) => !prev)}
            className="min-h-[30px] rounded-full bg-white/12 hover:bg-white/20 px-3 py-1 text-[11px] font-semibold text-white whitespace-nowrap"
          >
            {compareAll ? '개별 선택 모드' : '전체 근거 비교'}
          </button>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-white/95 leading-relaxed korean-keep-all">
          {simulation.scenarioPrompt}
        </p>
      </div>

      <div className="space-y-2.5">
        {simulation.options.map((opt, idx) => {
          const showFeedback = selectedIdx === idx || compareAll;
          return (
            <div
              key={opt.label}
              className={`rounded-[16px] border p-4 transition-colors ${
                showFeedback
                  ? opt.isOptimal
                    ? 'bg-emerald-50/90 border-emerald-400'
                    : 'bg-rose-50/85 border-rose-300'
                  : 'bg-[#f5f5f7] border-black/[0.05] hover:bg-black/[0.05]'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-[#1d1d1f] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#1d1d1f] leading-snug korean-keep-all">
                    {opt.label}
                  </span>
                </div>

                {showFeedback && (
                  <span
                    className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      opt.isOptimal
                        ? 'bg-emerald-700 text-white'
                        : 'bg-rose-700 text-white'
                    }`}
                  >
                    {opt.isOptimal ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>최적 처방</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>통념 부작용 주의</span>
                      </>
                    )}
                  </span>
                )}
              </button>

              {showFeedback && (
                <p
                  className={`mt-3 pt-2.5 border-t text-xs leading-relaxed korean-keep-all ${
                    opt.isOptimal
                      ? 'border-emerald-200 text-emerald-950'
                      : 'border-rose-200 text-rose-950'
                  }`}
                >
                  <strong className="font-extrabold mr-1.5">
                    {opt.isOptimal ? '타당성 근거:' : '한계 및 부작용:'}
                  </strong>
                  {opt.rationale}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const VisualCardDeckModal: React.FC<VisualCardDeckModalProps> = ({
  isOpen,
  onClose,
  categoryBadge,
  takeawayBadge,
  deckTitle,
  deckSubtitle,
  diagramSlides,
  contrastSlides = [],
  microSimulation,
  illustrationUrl,
  illustrationCaption,
  initialModality = 'diagram',
  initialSlideIndex = 0
}) => {
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const pendingTargetIndexRef = useRef<number | null>(null);
  const settledIndexRef = useRef<number>(initialSlideIndex);
  const scrollRafRef = useRef<number | null>(null);

  const [activeModality, setActiveModality] =
    useState<VisualDeckModality>(initialModality);
  const [activeIndex, setActiveIndex] = useState<number>(initialSlideIndex);
  const [liveStatusAnnouncement, setLiveStatusAnnouncement] =
    useState<string>('');

  const activeSlides = useMemo(() => {
    if (activeModality === 'contrast') {
      return contrastSlides;
    }
    if (activeModality === 'diagram') {
      return diagramSlides;
    }
    return [];
  }, [activeModality, contrastSlides, diagramSlides]);

  const isSlideDeckModality =
    activeModality === 'diagram' || activeModality === 'contrast';

  const scrollToSlide = useCallback(
    (targetIdx: number, behaviorOverride?: ScrollBehavior) => {
      const track = trackRef.current;
      const slideEl = slideRefs.current[targetIdx];
      if (!track || !slideEl) return;

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia(REDUCED_MOTION_QUERY).matches;
      const effectiveBehavior: ScrollBehavior =
        behaviorOverride ?? (prefersReduced ? 'instant' : 'smooth');

      pendingTargetIndexRef.current =
        effectiveBehavior === 'smooth' ? targetIdx : null;
      setActiveIndex(targetIdx);

      const targetLeft =
        slideEl.offsetLeft -
        (track.clientWidth - slideEl.clientWidth) / 2;

      track.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: effectiveBehavior
      });
    },
    []
  );

  // 모달 오픈/클로즈 동기화 (showModal + 초기 슬라이드 위치 즉시 스냅)
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setActiveModality(initialModality);
      const boundedIdx = Math.max(
        0,
        Math.min(
          initialSlideIndex,
          (initialModality === 'contrast'
            ? contrastSlides.length
            : diagramSlides.length) - 1
        )
      );
      setActiveIndex(boundedIdx);
      settledIndexRef.current = boundedIdx;
      pendingTargetIndexRef.current = null;
      setLiveStatusAnnouncement('');

      if (!dialog.open) {
        dialog.showModal();
      }

      window.requestAnimationFrame(() => {
        scrollToSlide(boundedIdx, 'instant');
      });
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [
    contrastSlides.length,
    diagramSlides.length,
    initialModality,
    initialSlideIndex,
    isOpen,
    scrollToSlide
  ]);

  // Safari 등 <dialog closedby="any"> 미지원 브라우저용 바깥 백드롭 클릭 Light-Dismiss 폴백 (modern-web-guidance: dialog, light-dismiss-a-dialog)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (
      !isOpen ||
      !dialog ||
      typeof HTMLDialogElement === 'undefined' ||
      'closedBy' in HTMLDialogElement.prototype
    ) {
      return;
    }

    let pressedOutside = false;

    const handlePointerDown = (event: PointerEvent) => {
      pressedOutside = isPointOutsideDialog(event, dialog);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (pressedOutside && isPointOutsideDialog(event, dialog)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isOpen]);

  // 스크롤 위치 기반 현재 슬라이드 계산 및 정착(scrollend / debounced scroll) 동기화 (modern-web-guidance: carousel)
  useEffect(() => {
    const track = trackRef.current;
    if (!isOpen || !isSlideDeckModality || !track || activeSlides.length <= 1) {
      return;
    }

    const computeNearestSlideIndex = (): number => {
      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let bestIdx = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < activeSlides.length; i += 1) {
        const el = slideRefs.current[i];
        if (!el) continue;
        const slideCenter = el.offsetLeft + el.clientWidth / 2;
        const dist = Math.abs(slideCenter - trackCenter);
        if (dist < minDistance) {
          minDistance = dist;
          bestIdx = i;
        }
      }
      return bestIdx;
    };

    const handleLiveScroll = () => {
      // 스크립트 smooth scroll 진행 중에는 매 프레임 재계산을 건너뛰어 Safari 스터터링 방지
      if (pendingTargetIndexRef.current !== null) {
        return;
      }
      if (scrollRafRef.current !== null) {
        return;
      }
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const nearest = computeNearestSlideIndex();
        setActiveIndex((prev) => (prev === nearest ? prev : nearest));
      });
    };

    const handleScrollSettled = () => {
      const settled = computeNearestSlideIndex();
      pendingTargetIndexRef.current = null;
      setActiveIndex(settled);

      if (settled !== settledIndexRef.current) {
        settledIndexRef.current = settled;
        const slide = activeSlides[settled];
        if (slide) {
          setLiveStatusAnnouncement(
            `${settled + 1} / ${activeSlides.length} 카드: ${slide.title}`
          );
        }
      }
    };

    track.addEventListener('scroll', handleLiveScroll, { passive: true });

    const supportsScrollEnd = 'onscrollend' in window;
    let debounceTimer: number | null = null;

    const debouncedSettle = () => {
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(
        handleScrollSettled,
        SCROLL_SETTLE_DEBOUNCE_MS
      );
    };

    if (supportsScrollEnd) {
      track.addEventListener('scrollend', handleScrollSettled);
    } else {
      track.addEventListener('scroll', debouncedSettle, { passive: true });
    }

    return () => {
      track.removeEventListener('scroll', handleLiveScroll);
      if (supportsScrollEnd) {
        track.removeEventListener('scrollend', handleScrollSettled);
      } else {
        track.removeEventListener('scroll', debouncedSettle);
      }
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
      }
    };
  }, [activeSlides, isOpen, isSlideDeckModality]);

  const handleStepRelative = useCallback(
    (delta: -1 | 1) => {
      if (activeSlides.length <= 1) return;
      const baseIndex = pendingTargetIndexRef.current ?? activeIndex;
      const nextIndex =
        (baseIndex + delta + activeSlides.length) % activeSlides.length;
      scrollToSlide(nextIndex);
    },
    [activeIndex, activeSlides.length, scrollToSlide]
  );

  // 모달 내 좌/우 방향키 카드 넘김 지원 (버튼·폼 요소 기본 동작 보존)
  useEffect(() => {
    if (!isOpen || !isSlideDeckModality || activeSlides.length <= 1) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleStepRelative(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleStepRelative(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSlides.length, handleStepRelative, isOpen, isSlideDeckModality]);

  const handleSwitchModality = (nextModality: VisualDeckModality) => {
    setActiveModality(nextModality);
    setActiveIndex(0);
    settledIndexRef.current = 0;
    pendingTargetIndexRef.current = null;
    window.requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.scrollTo({ left: 0, behavior: 'instant' });
      }
    });
  };

  const modalityTabs = useMemo(() => {
    const list: Array<{
      id: VisualDeckModality;
      label: string;
      icon: React.ReactNode;
    }> = [];

    if (diagramSlides.length > 0) {
      list.push({
        id: 'diagram',
        label: `도식 카드 (${diagramSlides.length})`,
        icon: <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      });
    }
    if (contrastSlides.length > 0) {
      list.push({
        id: 'contrast',
        label: `통념 vs 처방 (${contrastSlides.length})`,
        icon: <Scale className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      });
    }
    if (microSimulation) {
      list.push({
        id: 'simulation',
        label: '미니 시뮬레이션',
        icon: <Stethoscope className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      });
    }
    if (illustrationUrl) {
      list.push({
        id: 'infographic',
        label: '인포그래픽',
        icon: <ImageIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      });
    }
    return list;
  }, [
    contrastSlides.length,
    diagramSlides.length,
    illustrationUrl,
    microSimulation
  ]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={headingId}
      onClose={() => {
        if (dialogRef.current) {
          dialogRef.current.returnValue = '';
        }
        onClose();
      }}
      className="visual-deck-dialog no-print print:hidden"
    >
      <div className="flex flex-col w-full max-h-[88dvh] rounded-[28px] bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.08] shadow-[var(--shadow-overlay)] overflow-hidden">
        {/* 상단 플로팅 헤더 */}
        <div className="bg-white/95 border-b border-black/[0.06] px-4 sm:px-6 py-3.5 sm:py-4 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-full bg-[var(--accent-subtle)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent-solid)]">
                  <span>{categoryBadge}</span>
                </span>
                {takeawayBadge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-950 korean-keep-all">
                    <Sparkles
                      className="w-3 h-3 text-amber-700 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{takeawayBadge}</span>
                  </span>
                )}
              </div>

              <h3
                id={headingId}
                className="text-base sm:text-lg font-bold tracking-tight text-[#1d1d1f] leading-snug korean-keep-all"
              >
                {deckTitle}
              </h3>

              {deckSubtitle && (
                <p className="text-xs text-[#6e6e73] leading-relaxed korean-keep-all">
                  {deckSubtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isSlideDeckModality && activeSlides.length > 0 && (
                <span className="rounded-full bg-[#1d1d1f] px-3 py-1 text-xs font-bold text-white tabular-nums whitespace-nowrap">
                  {activeIndex + 1} / {activeSlides.length}
                </span>
              )}
              <form method="dialog">
                <button
                  type="submit"
                  value="close"
                  {...({ autofocus: '' } as React.ButtonHTMLAttributes<HTMLButtonElement>)}
                  aria-label="도식 카드 플로팅 창 닫기"
                  className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-full bg-[#f5f5f7] hover:bg-black/[0.08] text-[#1d1d1f] transition-colors"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>

          {/* 다중 모달리티 세그먼트 스위처 */}
          {modalityTabs.length > 1 && (
            <div
              role="tablist"
              aria-label={`${deckTitle} 시각 자료 유형 전환`}
              className="mobile-strip-scroll pt-0.5"
            >
              {modalityTabs.map((tab) => {
                const isSelected = activeModality === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={isSelected}
                    onClick={() => handleSwitchModality(tab.id)}
                    className={`min-h-[32px] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-[#1d1d1f] text-white shadow-2xs'
                        : 'bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.07] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 본문 영역: 좌우 스와이프 카드 데크 or 시뮬레이션 or 인포그래픽 */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
          {isSlideDeckModality && activeSlides.length > 0 && (
            <section
              aria-roledescription="carousel"
              aria-label={`${deckTitle} 카드 데크`}
              className="space-y-4"
            >
              {/* 스크린 리더용 정착 상태 안내 (초기 로드 시 비워둠) */}
              <p className="sr-only" role="status" aria-live="polite">
                {liveStatusAnnouncement}
              </p>

              {/* 좌우 스냅 카드 트랙 */}
              <div
                ref={trackRef}
                tabIndex={0}
                role="group"
                aria-label="좌우로 넘겨보는 개념 카드 목록"
                className="visual-deck-track"
              >
                {activeSlides.map((slide, idx) => {
                  const palette = ACCENT_STYLE_MAP[slide.accent];
                  return (
                    <article
                      key={slide.id}
                      ref={(el) => {
                        slideRefs.current[idx] = el;
                      }}
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`${idx + 1} / ${activeSlides.length}: ${slide.title}`}
                      className="rounded-[22px] bg-white border border-black/[0.06] p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3.5">
                        {/* 배지 헤더 (단일 행 고정 stepBadge + keep-all 보조 배지) */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`shrink-0 whitespace-nowrap inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold tabular-nums ${palette.stepPill}`}
                          >
                            {slide.stepBadge}
                          </span>

                          {slide.secondaryBadge && (
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold korean-keep-all ${palette.secondaryPill}`}
                            >
                              {slide.secondaryBadge}
                            </span>
                          )}
                        </div>

                        {/* 슬라이드 타이틀 & 부제 */}
                        <div className="space-y-1">
                          <h4 className="text-lg sm:text-xl font-extrabold text-[#1d1d1f] leading-snug korean-keep-all">
                            {slide.title}
                          </h4>
                          {slide.subtitle && (
                            <p
                              className={`text-xs sm:text-sm font-bold leading-snug korean-keep-all ${palette.subtitleText}`}
                            >
                              {slide.subtitle}
                            </p>
                          )}
                        </div>

                        {/* 스택 게이지 시각화 (인지부하이론 등) */}
                        {slide.gaugeSegments &&
                          slide.gaugeSegments.length > 0 && (
                            <div className="space-y-2 pt-1">
                              <div className="h-8 w-full rounded-xl overflow-hidden flex border border-black/[0.08] bg-slate-100 text-[11px] font-extrabold tabular-nums">
                                {slide.gaugeSegments.map((seg) => (
                                  <div
                                    key={seg.label}
                                    style={{ width: `${seg.percent}%` }}
                                    title={`${seg.label} ${seg.percent}%`}
                                    className={`flex items-center justify-center px-1.5 truncate ${GAUGE_SEGMENT_BG[seg.tone]}`}
                                  >
                                    {seg.percent >= 14
                                      ? `${seg.label} ${seg.percent}%`
                                      : `${seg.percent}%`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* 통념 vs 증거기반 처방 대조 페어 */}
                        {slide.contrastPair && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="rounded-[16px] bg-rose-50/85 border border-rose-200 p-4 space-y-1.5">
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-800">
                                <XCircle
                                  className="w-3.5 h-3.5 text-rose-600 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>{slide.contrastPair.naiveLabel}</span>
                              </span>
                              <p className="text-xs sm:text-sm text-rose-950 leading-relaxed korean-keep-all">
                                {slide.contrastPair.naiveBody}
                              </p>
                            </div>

                            <div className="rounded-[16px] bg-emerald-50/90 border border-emerald-200 p-4 space-y-1.5">
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800">
                                <CheckCircle2
                                  className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>{slide.contrastPair.evidenceLabel}</span>
                              </span>
                              <p className="text-xs sm:text-sm font-medium text-emerald-950 leading-relaxed korean-keep-all">
                                {slide.contrastPair.evidenceBody}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 본문 설명 */}
                        {slide.body && (
                          <p className="text-sm sm:text-[15px] text-[#424245] leading-relaxed korean-keep-all">
                            {slide.body}
                          </p>
                        )}

                        {/* 핵심 불릿 리스트 */}
                        {slide.bullets && slide.bullets.length > 0 && (
                          <ul className="space-y-2 pt-1 border-t border-black/[0.05]">
                            {slide.bullets.map((bullet, bIdx) => (
                              <li
                                key={bIdx}
                                className="flex items-start gap-2.5 text-xs sm:text-sm text-[#424245] leading-relaxed"
                              >
                                <span
                                  className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${palette.bulletDot}`}
                                  aria-hidden="true"
                                />
                                <span className="korean-keep-all min-w-0">
                                  {bullet}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* 현장 적용 / 보철 콜아웃 박스 */}
                        {slide.calloutText && (
                          <div
                            className={`rounded-[16px] border p-3.5 text-xs sm:text-sm leading-relaxed korean-keep-all ${palette.calloutBox}`}
                          >
                            {slide.calloutLabel && (
                              <strong className="font-extrabold mr-1.5">
                                {slide.calloutLabel}:
                              </strong>
                            )}
                            <span>{slide.calloutText}</span>
                          </div>
                        )}
                      </div>

                      {/* 하단 단계 흐름 힌트 */}
                      {slide.footerFlowHint && (
                        <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2 text-xs font-bold text-[#6e6e73]">
                          <span className="text-[11px] font-medium">
                            좌우로 스와이프하여 단계 비교
                          </span>
                          <span className="text-[var(--accent-solid)] korean-keep-all text-right">
                            {slide.footerFlowHint}
                          </span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {activeModality === 'simulation' && microSimulation && (
            <DeckMicroSimulationView simulation={microSimulation} />
          )}

          {activeModality === 'infographic' && illustrationUrl && (
            <div className="rounded-[22px] bg-white border border-black/[0.06] p-4 sm:p-5 shadow-xs space-y-3">
              <div className="rounded-[16px] overflow-hidden border border-black/[0.06] bg-[#f5f5f7] flex items-center justify-center p-2">
                <img
                  src={illustrationUrl}
                  alt={illustrationCaption ?? deckTitle}
                  className="w-full max-h-[62dvh] object-contain rounded-lg"
                />
              </div>
              {illustrationCaption && (
                <p className="text-xs sm:text-sm text-[#424245] leading-relaxed korean-keep-all px-1">
                  <strong className="font-bold text-[#1d1d1f] mr-1.5">
                    인포그래픽 해설:
                  </strong>
                  {illustrationCaption}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 하단 좌우 카드 넘김 컨트롤 바 (슬라이드 데크 활성 시) */}
        {isSlideDeckModality && activeSlides.length > 1 && (
          <div className="bg-white/95 border-t border-black/[0.06] px-4 sm:px-6 py-3 shrink-0 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleStepRelative(-1)}
              aria-label="이전 카드 보기"
              className="min-h-[38px] shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-full bg-[#f5f5f7] hover:bg-black/[0.08] px-3.5 py-1.5 text-xs font-bold text-[#1d1d1f] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>이전</span>
            </button>

            <nav
              aria-label="도식 카드 직접 선택"
              className="flex items-center justify-center gap-1.5 overflow-x-auto px-1 py-1"
            >
              {activeSlides.map((slide, idx) => {
                const isCurrent = idx === activeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    aria-current={isCurrent ? 'true' : undefined}
                    aria-label={`${idx + 1}번 카드로 이동: ${slide.chipLabel}`}
                    title={slide.chipLabel}
                    onClick={() => scrollToSlide(idx)}
                    className={`min-h-[26px] rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums transition-all whitespace-nowrap ${
                      isCurrent
                        ? 'bg-[#0071e3] text-white shadow-2xs'
                        : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-black/[0.08] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => handleStepRelative(1)}
              aria-label="다음 카드 보기"
              className="min-h-[38px] shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
            >
              <span>다음</span>
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};
