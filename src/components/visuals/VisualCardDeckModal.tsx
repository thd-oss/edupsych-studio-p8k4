import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  X,
  XCircle
} from 'lucide-react';
import { ConceptMicroSimulation } from '../../types/visuals';
import {
  DeckAccentTone,
  VisualDeckSlide
} from '../../utils/visualDeckAdapter';

export interface InlineVisualCardReelProps {
  slides: VisualDeckSlide[];
  ariaLabel: string;
  onSelectCard: (index: number) => void;
  surfaceTone?: 'light' | 'dark';
}

export interface VisualCardDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckTitle: string;
  slides: VisualDeckSlide[];
  initialSlideIndex?: number;
  illustrationUrl?: string;
  illustrationCaption?: string;
}

const SCROLL_SETTLE_DEBOUNCE_MS = 120;
const MAX_TAP_DRIFT_PX = 8;
const GAUGE_LABEL_MIN_PERCENT = 14;
const INLINE_PREVIEW_BULLET_COUNT = 2;
const MIN_SLIDES_FOR_CONTROLS = 2;
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
    calloutBox: 'bg-indigo-50/75 border-indigo-200/90 text-indigo-950',
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

function isInsideSpotlightSurface(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('[data-spotlight-surface]'));
}

export const DeckMicroSimulationCard: React.FC<{
  simulation: ConceptMicroSimulation;
}> = ({ simulation }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [compareAll, setCompareAll] = useState<boolean>(false);

  return (
    <div className="rounded-[20px] bg-white border border-black/[0.06] p-4 sm:p-5 shadow-2xs space-y-3.5">
      <div className="rounded-[16px] bg-[#1d1d1f] text-white p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 whitespace-nowrap">
            <Stethoscope className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>현장 의사결정 시뮬레이션</span>
          </span>
          <button
            type="button"
            onClick={() => setCompareAll((prev) => !prev)}
            className="min-h-[28px] rounded-full bg-white/12 hover:bg-white/20 px-3 py-0.5 text-[11px] font-semibold text-white whitespace-nowrap transition-colors"
          >
            {compareAll ? '개별 선택 모드' : '전체 근거 비교'}
          </button>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-white/95 leading-relaxed korean-keep-all">
          {simulation.scenarioPrompt}
        </p>
      </div>

      <div className="space-y-2">
        {simulation.options.map((opt, idx) => {
          const showFeedback = selectedIdx === idx || compareAll;
          return (
            <div
              key={opt.label}
              className={`rounded-[14px] border p-3.5 transition-colors ${
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
                        <CheckCircle2
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>최적 처방</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>통념 부작용 주의</span>
                      </>
                    )}
                  </span>
                )}
              </button>

              {showFeedback && (
                <p
                  className={`mt-2.5 pt-2.5 border-t text-xs leading-relaxed korean-keep-all ${
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

/**
 * 인라인 가로 슬라이드(Peek) 카드 영역:
 * 별도 런처 버튼 없이 카드 자체가 가로 스크롤-스냅 스트립으로 제시되며,
 * 임의의 카드를 터치/클릭하면 해당 인덱스로 집중 팝업(VisualCardDeckModal)을 즉시 오픈합니다.
 */
export const InlineVisualCardReel: React.FC<InlineVisualCardReelProps> = ({
  slides,
  ariaLabel,
  onSelectCard,
  surfaceTone = 'light'
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pendingTargetIndexRef = useRef<number | null>(null);
  const settledIndexRef = useRef<number>(0);
  const scrollRafRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [liveStatusAnnouncement, setLiveStatusAnnouncement] =
    useState<string>('');

  const isDarkSurface = surfaceTone === 'dark';
  const hasMultipleSlides = slides.length >= MIN_SLIDES_FOR_CONTROLS;

  const scrollToInlineSlide = useCallback(
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

      track.scrollTo({
        left: Math.max(0, slideEl.offsetLeft),
        behavior: effectiveBehavior
      });
    },
    []
  );

  useEffect(() => {
    setActiveIndex(0);
    settledIndexRef.current = 0;
    pendingTargetIndexRef.current = null;
    setLiveStatusAnnouncement('');
  }, [slides]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !hasMultipleSlides) return;

    const computeNearestStartIndex = (): number => {
      const currentLeft = track.scrollLeft;
      let bestIdx = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < slides.length; i += 1) {
        const el = slideRefs.current[i];
        if (!el) continue;
        const dist = Math.abs(el.offsetLeft - currentLeft);
        if (dist < minDistance) {
          minDistance = dist;
          bestIdx = i;
        }
      }
      return bestIdx;
    };

    const handleLiveScroll = () => {
      if (pendingTargetIndexRef.current !== null) return;
      if (scrollRafRef.current !== null) return;

      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const nearest = computeNearestStartIndex();
        setActiveIndex((prev) => (prev === nearest ? prev : nearest));
      });
    };

    const handleScrollSettled = () => {
      const settled = computeNearestStartIndex();
      pendingTargetIndexRef.current = null;
      setActiveIndex(settled);

      if (settled !== settledIndexRef.current) {
        settledIndexRef.current = settled;
        const slide = slides[settled];
        if (slide) {
          setLiveStatusAnnouncement(
            `${settled + 1} / ${slides.length} 카드: ${slide.title}`
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
  }, [hasMultipleSlides, slides]);

  const handleStepInline = useCallback(
    (delta: -1 | 1) => {
      if (!hasMultipleSlides) return;
      const baseIndex = pendingTargetIndexRef.current ?? activeIndex;
      const nextIndex = Math.max(
        0,
        Math.min(slides.length - 1, baseIndex + delta)
      );
      if (nextIndex !== baseIndex) {
        scrollToInlineSlide(nextIndex);
      }
    },
    [activeIndex, hasMultipleSlides, scrollToInlineSlide, slides.length]
  );

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className="space-y-2.5"
    >
      <div className="relative">
        {/* 이전/다음 컨트롤을 트랙보다 먼저 DOM에 배치 (modern-web-guidance: carousel) */}
        {hasMultipleSlides && (
          <div className="pointer-events-none hidden sm:flex items-center justify-between absolute inset-y-0 -inset-x-1.5 z-10">
            <button
              type="button"
              onClick={() => handleStepInline(-1)}
              disabled={activeIndex === 0}
              aria-label="이전 카드 보기"
              className={`pointer-events-auto w-8 h-8 rounded-full border shadow-sm inline-flex items-center justify-center transition-all touch-manipulation disabled:opacity-0 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] ${
                isDarkSurface
                  ? 'bg-[#2c2c2e]/95 hover:bg-[#3a3a3c] border-white/15 text-white'
                  : 'bg-white/95 hover:bg-white border-black/[0.08] text-[#1d1d1f]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleStepInline(1)}
              disabled={activeIndex === slides.length - 1}
              aria-label="다음 카드 보기"
              className={`pointer-events-auto w-8 h-8 rounded-full border shadow-sm inline-flex items-center justify-center transition-all touch-manipulation disabled:opacity-0 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] ${
                isDarkSurface
                  ? 'bg-[#2c2c2e]/95 hover:bg-[#3a3a3c] border-white/15 text-white'
                  : 'bg-white/95 hover:bg-white border-black/[0.08] text-[#1d1d1f]'
              }`}
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div
          ref={trackRef}
          tabIndex={0}
          role="group"
          aria-label="가로로 넘겨보고 터치하여 집중 열람하는 카드 슬라이드"
          className="inline-peek-reel-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] rounded-[20px]"
        >
          {slides.map((slide, idx) => {
            const palette = ACCENT_STYLE_MAP[slide.accent];
            return (
              <div
                key={slide.id}
                ref={(el) => {
                  slideRefs.current[idx] = el;
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} / ${slides.length}: ${slide.title}`}
                data-single={slides.length === 1 ? 'true' : undefined}
                className="inline-peek-reel-card"
              >
                <button
                  type="button"
                  onClick={() => onSelectCard(idx)}
                  aria-haspopup="dialog"
                  className={`group w-full h-full rounded-[20px] border p-4 sm:p-5 text-left flex flex-col justify-between gap-3.5 transition-all touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] ${
                    isDarkSurface
                      ? 'bg-white/[0.08] hover:bg-white/[0.13] border-white/12 text-white'
                      : 'bg-white hover:border-[#0071e3]/35 border-black/[0.06] text-[#1d1d1f] shadow-2xs hover:shadow-md'
                  }`}
                >
                  <div className="space-y-2.5 w-full">
                    {/* 상단 배지 바 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span
                          className={`shrink-0 whitespace-nowrap inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tabular-nums ${
                            isDarkSurface
                              ? 'bg-white/18 text-white'
                              : palette.stepPill
                          }`}
                        >
                          {slide.stepBadge}
                        </span>

                        {slide.secondaryBadge && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold korean-keep-all ${
                              isDarkSurface
                                ? 'bg-white/10 border-white/15 text-[#8cc4ff]'
                                : palette.secondaryPill
                            }`}
                          >
                            {slide.secondaryBadge}
                          </span>
                        )}
                      </div>

                      <ArrowUpRight
                        className={`w-4 h-4 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                          isDarkSurface
                            ? 'text-white/45 group-hover:text-[#66b2ff]'
                            : 'text-[#86868b] group-hover:text-[var(--accent-solid)]'
                        }`}
                        aria-hidden="true"
                      />
                    </div>

                    {/* 제목 및 부제 */}
                    <div className="space-y-0.5">
                      <h5
                        className={`text-[15px] sm:text-base font-extrabold leading-snug korean-keep-all ${
                          isDarkSurface ? 'text-white' : 'text-[#1d1d1f]'
                        }`}
                      >
                        {slide.title}
                      </h5>
                      {slide.subtitle && (
                        <p
                          className={`text-xs font-bold leading-snug line-clamp-1 ${
                            isDarkSurface
                              ? 'text-white/70'
                              : palette.subtitleText
                          }`}
                        >
                          {slide.subtitle}
                        </p>
                      )}
                    </div>

                    {/* 컴팩트 시각 프리뷰 (게이지 / 통념·처방 / 본문 / 핵심 불릿) */}
                    {slide.gaugeSegments && slide.gaugeSegments.length > 0 && (
                      <div className="h-6 w-full rounded-lg overflow-hidden flex border border-black/[0.08] bg-slate-100 text-[10px] font-extrabold tabular-nums">
                        {slide.gaugeSegments.map((seg) => (
                          <div
                            key={seg.label}
                            style={{ width: `${seg.percent}%` }}
                            className={`flex items-center justify-center px-1 truncate ${GAUGE_SEGMENT_BG[seg.tone]}`}
                          >
                            {seg.percent >= GAUGE_LABEL_MIN_PERCENT
                              ? `${seg.label} ${seg.percent}%`
                              : `${seg.percent}%`}
                          </div>
                        ))}
                      </div>
                    )}

                    {slide.imageUrl ? (
                      <div className="pt-0.5">
                        <img
                          src={slide.imageUrl}
                          alt={slide.imageAlt ?? slide.title}
                          loading="lazy"
                          className="w-full h-32 object-contain rounded-[12px] bg-[#f5f5f7] border border-black/[0.05]"
                        />
                      </div>
                    ) : slide.contrastPair ? (
                      <div className="space-y-1.5 pt-0.5">
                        <p className="rounded-xl bg-rose-50/90 border border-rose-200/80 px-2.5 py-1.5 text-xs text-rose-950 line-clamp-2 korean-keep-all">
                          <strong className="font-extrabold text-rose-800 mr-1">
                            통념:
                          </strong>
                          {slide.contrastPair.naiveBody}
                        </p>
                        <p className="rounded-xl bg-emerald-50/95 border border-emerald-200/80 px-2.5 py-1.5 text-xs text-emerald-950 line-clamp-2 korean-keep-all">
                          <strong className="font-extrabold text-emerald-800 mr-1">
                            처방:
                          </strong>
                          {slide.contrastPair.evidenceBody}
                        </p>
                      </div>
                    ) : slide.body ? (
                      <p
                        className={`text-xs sm:text-[13px] leading-relaxed korean-keep-all line-clamp-3 ${
                          isDarkSurface ? 'text-white/80' : 'text-[#424245]'
                        }`}
                      >
                        {slide.body}
                      </p>
                    ) : slide.bullets && slide.bullets.length > 0 ? (
                      <ul className="space-y-1 pt-0.5">
                        {slide.bullets
                          .slice(0, INLINE_PREVIEW_BULLET_COUNT)
                          .map((bullet, bIdx) => (
                            <li
                              key={bIdx}
                              className={`flex items-start gap-2 text-xs leading-relaxed line-clamp-2 ${
                                isDarkSurface
                                  ? 'text-white/80'
                                  : 'text-[#424245]'
                              }`}
                            >
                              <span
                                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isDarkSurface
                                    ? 'bg-[#66b2ff]'
                                    : palette.bulletDot
                                }`}
                                aria-hidden="true"
                              />
                              <span className="korean-keep-all line-clamp-2">
                                {bullet}
                              </span>
                            </li>
                          ))}
                      </ul>
                    ) : null}
                  </div>

                  {/* 하단 마이크로 어포던스 캡션 */}
                  <div
                    className={`w-full pt-2 border-t flex items-center justify-between gap-2 text-[11px] font-semibold ${
                      isDarkSurface
                        ? 'border-white/10 text-white/60 group-hover:text-[#66b2ff]'
                        : 'border-black/[0.05] text-[#6e6e73] group-hover:text-[var(--accent-solid)]'
                    }`}
                  >
                    <span className="truncate">
                      {slide.footerFlowHint ?? '터치하여 집중 모드로 열기'}
                    </span>
                    <span className="shrink-0 tabular-nums opacity-75">
                      {idx + 1} / {slides.length}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {liveStatusAnnouncement}
      </p>

      {/* 하단 미니멀 슬라이드 마커 인디케이터 */}
      {hasMultipleSlides && (
        <div className="flex items-center justify-between gap-2 px-1">
          <nav
            aria-label={`${ariaLabel} 슬라이드 바로가기`}
            className="flex items-center gap-1.5"
          >
            {slides.map((slide, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`${idx + 1}번 카드 (${slide.title})로 이동`}
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => scrollToInlineSlide(idx)}
                  className="py-1.5 px-0.5 inline-flex items-center cursor-pointer touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      isCurrent
                        ? isDarkSurface
                          ? 'w-5 bg-[#66b2ff]'
                          : 'w-5 bg-[#1d1d1f]'
                        : isDarkSurface
                          ? 'w-1.5 bg-white/30 hover:bg-white/55'
                          : 'w-1.5 bg-black/20 hover:bg-black/40'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <span
            className={`text-[11px] font-semibold whitespace-nowrap ${
              isDarkSurface ? 'text-white/55' : 'text-[#86868b]'
            }`}
          >
            좌우 슬라이드 · 카드 터치 시 확대
          </span>
        </div>
      )}
    </section>
  );
};

/**
 * 음영 배경 집중 카드 라이트박스 (Chromeless Card-Only Focus Dialog):
 * 외곽 모달 박스나 무거운 상·하단 바 없이, 어둡게 블러 처리된(::backdrop) 배경 위에
 * 오직 선택된 카드만 띄워 좌우 스와이프·방향키로 집중 열람합니다.
 */
export const VisualCardDeckModal: React.FC<VisualCardDeckModalProps> = ({
  isOpen,
  onClose,
  deckTitle,
  slides,
  initialSlideIndex = 0,
  illustrationUrl,
  illustrationCaption
}) => {
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const pendingTargetIndexRef = useRef<number | null>(null);
  const settledIndexRef = useRef<number>(initialSlideIndex);
  const scrollRafRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState<number>(initialSlideIndex);
  const [liveStatusAnnouncement, setLiveStatusAnnouncement] =
    useState<string>('');

  const hasSlides = slides.length > 0;
  const hasMultipleSlides = slides.length >= MIN_SLIDES_FOR_CONTROLS;

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
        slideEl.offsetLeft - (track.clientWidth - slideEl.clientWidth) / 2;

      track.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: effectiveBehavior
      });
    },
    []
  );

  // 모달 오픈/클로즈 동기화 (showModal + 터치한 카드 인덱스로 즉시 중앙 정렬)
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      const boundedIdx =
        slides.length > 0
          ? Math.max(0, Math.min(initialSlideIndex, slides.length - 1))
          : 0;
      setActiveIndex(boundedIdx);
      settledIndexRef.current = boundedIdx;
      pendingTargetIndexRef.current = null;
      setLiveStatusAnnouncement('');

      if (!dialog.open) {
        dialog.showModal();
      }

      if (slides.length > 0) {
        window.requestAnimationFrame(() => {
          scrollToSlide(boundedIdx, 'instant');
        });
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [initialSlideIndex, isOpen, scrollToSlide, slides.length]);

  // 음영 영역 Light-Dismiss:
  // 1) closedBy 미지원 브라우저(Safari 등)에서 ::backdrop 바깥 클릭 폴백 (press+release 모두 외부일 때만)
  // 2) 투명한 <dialog> 패딩/여백 영역(카드 바깥 음영 구간)에서 스와이프가 아닌 순수 탭(이동량 <= MAX_TAP_DRIFT_PX)일 때 닫기
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog || typeof HTMLDialogElement === 'undefined') {
      return;
    }

    const lacksNativeClosedBy = !('closedBy' in HTMLDialogElement.prototype);
    let pressedOutsideRect = false;
    let pressedOnDimmedGap = false;
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
      const outsideRect = isPointOutsideDialog(event, dialog);
      pressedOutsideRect = outsideRect;
      pressedOnDimmedGap =
        !outsideRect && !isInsideSpotlightSurface(event.target);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const outsideRect = isPointOutsideDialog(event, dialog);

      if (lacksNativeClosedBy && pressedOutsideRect && outsideRect) {
        dialog.close();
      } else if (
        pressedOnDimmedGap &&
        !outsideRect &&
        !isInsideSpotlightSurface(event.target)
      ) {
        const drift = Math.hypot(event.clientX - downX, event.clientY - downY);
        if (drift <= MAX_TAP_DRIFT_PX) {
          dialog.close();
        }
      }

      pressedOutsideRect = false;
      pressedOnDimmedGap = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isOpen]);

  // 스크롤 위치 기반 활성 슬라이드 추적 및 정착(scrollend / debounced scroll) 동기화
  useEffect(() => {
    const track = trackRef.current;
    if (!isOpen || !track || !hasMultipleSlides) return;

    const computeNearestCenteredIndex = (): number => {
      const trackCenter = track.scrollLeft + track.clientWidth / 2;
      let bestIdx = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < slides.length; i += 1) {
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
      if (pendingTargetIndexRef.current !== null) return;
      if (scrollRafRef.current !== null) return;

      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        const nearest = computeNearestCenteredIndex();
        setActiveIndex((prev) => (prev === nearest ? prev : nearest));
      });
    };

    const handleScrollSettled = () => {
      const settled = computeNearestCenteredIndex();
      pendingTargetIndexRef.current = null;
      setActiveIndex(settled);

      if (settled !== settledIndexRef.current) {
        settledIndexRef.current = settled;
        const slide = slides[settled];
        if (slide) {
          setLiveStatusAnnouncement(
            `${settled + 1} / ${slides.length} 카드: ${slide.title}`
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
  }, [hasMultipleSlides, isOpen, slides]);

  const handleStepRelative = useCallback(
    (delta: -1 | 1) => {
      if (!hasMultipleSlides) return;
      const baseIndex = pendingTargetIndexRef.current ?? activeIndex;
      const nextIndex = Math.max(
        0,
        Math.min(slides.length - 1, baseIndex + delta)
      );
      if (nextIndex !== baseIndex) {
        scrollToSlide(nextIndex);
      }
    },
    [activeIndex, hasMultipleSlides, scrollToSlide, slides.length]
  );

  // 집중 뷰 내 좌/우 방향키 카드 넘김 (폼·링크 기본 키 동작 보존)
  useEffect(() => {
    if (!isOpen || !hasMultipleSlides) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'A')
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
  }, [ handleStepRelative, hasMultipleSlides, isOpen]);

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
      className="spotlight-card-dialog no-print print:hidden"
    >
      <section
        aria-roledescription={hasSlides ? 'carousel' : undefined}
        aria-label={`${deckTitle} 집중 카드 뷰`}
        className="w-full py-2"
      >
        {/* 상단 최소 플로팅 크롬: 불투명 박스 없이 반투명 카운터 필 + 닫기 버튼만 배치 */}
        <div className="px-[6.5vw] sm:px-14 pb-2.5 flex items-center justify-between gap-3">
          <div
            data-spotlight-surface
            className="min-w-0 inline-flex items-center gap-2 rounded-full bg-white/14 backdrop-blur-md border border-white/18 px-3.5 py-1.5 text-white shadow-sm"
          >
            {hasSlides && (
              <span className="shrink-0 whitespace-nowrap text-xs font-extrabold text-[#7cc0ff] tabular-nums">
                {activeIndex + 1} / {slides.length}
              </span>
            )}
            <h3
              id={headingId}
              className="text-xs sm:text-[13px] font-semibold text-white/95 truncate"
            >
              {deckTitle}
            </h3>
          </div>

          <form method="dialog" data-spotlight-surface className="shrink-0">
            <button
              type="submit"
              value="close"
              {...({ autofocus: '' } as React.ButtonHTMLAttributes<HTMLButtonElement>)}
              aria-label="집중 카드 뷰 닫기"
              className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/16 hover:bg-white/28 backdrop-blur-md border border-white/20 text-white transition-colors touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* 중앙 카드 전용 스냅 트랙 */}
        {hasSlides ? (
          <div className="relative">
            {hasMultipleSlides && (
              <div className="pointer-events-none hidden sm:flex items-center justify-between absolute inset-y-0 inset-x-1.5 z-10">
                <button
                  type="button"
                  data-spotlight-surface
                  onClick={() => handleStepRelative(-1)}
                  disabled={activeIndex === 0}
                  aria-label="이전 카드"
                  className="pointer-events-auto w-10 h-10 rounded-full bg-white/16 hover:bg-white/28 backdrop-blur-md border border-white/20 text-white inline-flex items-center justify-center shadow-lg transition-all touch-manipulation disabled:opacity-25 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  data-spotlight-surface
                  onClick={() => handleStepRelative(1)}
                  disabled={activeIndex === slides.length - 1}
                  aria-label="다음 카드"
                  className="pointer-events-auto w-10 h-10 rounded-full bg-white/16 hover:bg-white/28 backdrop-blur-md border border-white/20 text-white inline-flex items-center justify-center shadow-lg transition-all touch-manipulation disabled:opacity-25 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            )}

            <div
              ref={trackRef}
              tabIndex={0}
              role="group"
              aria-label="좌우로 넘겨보는 집중 카드 목록"
              className="spotlight-card-track focus-visible:outline-none"
            >
              {slides.map((slide, idx) => {
                const palette = ACCENT_STYLE_MAP[slide.accent];
                return (
                  <article
                    key={slide.id}
                    ref={(el) => {
                      slideRefs.current[idx] = el;
                    }}
                    data-spotlight-surface
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${idx + 1} / ${slides.length}: ${slide.title}`}
                    className="spotlight-focus-card rounded-[26px] bg-white text-[#1d1d1f] border border-white/60 p-6 sm:p-8 shadow-[0_24px_64px_rgba(0,0,0,0.48)] max-h-[74dvh] overflow-y-auto flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-4">
                      {/* 상단 단계 & 키워드 배지 */}
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

                      {/* 카드 타이틀 & 부제 */}
                      <div className="space-y-1">
                        <h4 className="text-xl sm:text-2xl font-extrabold text-[#1d1d1f] leading-snug korean-keep-all">
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

                      {/* 작업기억 게이지 시각화 */}
                      {slide.gaugeSegments && slide.gaugeSegments.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="h-8 w-full rounded-xl overflow-hidden flex border border-black/[0.08] bg-slate-100 text-[11px] font-extrabold tabular-nums">
                            {slide.gaugeSegments.map((seg) => (
                              <div
                                key={seg.label}
                                style={{ width: `${seg.percent}%` }}
                                title={`${seg.label} ${seg.percent}%`}
                                className={`flex items-center justify-center px-1.5 truncate ${GAUGE_SEGMENT_BG[seg.tone]}`}
                              >
                                {seg.percent >= GAUGE_LABEL_MIN_PERCENT
                                  ? `${seg.label} ${seg.percent}%`
                                  : `${seg.percent}%`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 카드 내장 인포그래픽 도해 */}
                      {slide.imageUrl && (
                        <figure className="pt-1 space-y-2">
                          <img
                            src={slide.imageUrl}
                            alt={slide.imageAlt ?? slide.title}
                            loading="lazy"
                            className="w-full max-h-[48dvh] object-contain rounded-[16px] bg-[#f5f5f7] border border-black/[0.06] mx-auto"
                          />
                        </figure>
                      )}

                      {/* 통념 vs 증거기반 처방 대조 */}
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

                      {/* 카드 본문 */}
                      {slide.body && (
                        <p className="text-sm sm:text-base text-[#2c2c2e] leading-relaxed korean-keep-all">
                          {slide.body}
                        </p>
                      )}

                      {/* 핵심 불릿 리스트 */}
                      {slide.bullets && slide.bullets.length > 0 && (
                        <ul className="space-y-2.5 pt-2 border-t border-black/[0.06]">
                          {slide.bullets.map((bullet, bIdx) => (
                            <li
                              key={bIdx}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-[#2c2c2e] leading-relaxed"
                            >
                              <span
                                className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${palette.bulletDot}`}
                                aria-hidden="true"
                              />
                              <span className="korean-keep-all">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* 처방 / 심화 콜아웃 */}
                      {slide.calloutText && (
                        <div
                          className={`rounded-[16px] border p-4 text-xs sm:text-sm font-semibold leading-relaxed korean-keep-all ${palette.calloutBox}`}
                        >
                          {slide.calloutText}
                        </div>
                      )}
                    </div>

                    {/* 카드 내부 하단 안내 */}
                    {(slide.footerFlowHint || hasMultipleSlides) && (
                      <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2 text-[11px] font-semibold text-[#86868b]">
                        <span className="text-[var(--accent-solid)] truncate">
                          {slide.footerFlowHint ?? ''}
                        </span>
                        {hasMultipleSlides && (
                          <span className="shrink-0 whitespace-nowrap">
                            옆으로 밀어 카드 넘기기
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <p className="sr-only" role="status" aria-live="polite">
              {liveStatusAnnouncement}
            </p>
          </div>
        ) : illustrationUrl ? (
          <div className="px-[6.5vw] sm:px-14">
            <figure
              data-spotlight-surface
              className="rounded-[26px] bg-white p-4 sm:p-6 shadow-[0_24px_64px_rgba(0,0,0,0.48)] max-h-[76dvh] overflow-y-auto space-y-3"
            >
              <img
                src={illustrationUrl}
                alt={illustrationCaption ?? `${deckTitle} 인포그래픽`}
                className="w-full h-auto rounded-[18px] object-contain mx-auto"
              />
              {illustrationCaption && (
                <figcaption className="text-xs sm:text-sm text-[#424245] text-center leading-relaxed korean-keep-all">
                  {illustrationCaption}
                </figcaption>
              )}
            </figure>
          </div>
        ) : null}

        {/* 하단 미니멀 도트 인디케이터 필 */}
        {hasMultipleSlides && (
          <nav
            aria-label="집중 카드 위치 선택"
            className="pt-2.5 flex justify-center"
          >
            <div
              data-spotlight-surface
              className="inline-flex items-center gap-1.5 rounded-full bg-white/14 backdrop-blur-md border border-white/18 px-3.5 py-1.5"
            >
              {slides.map((slide, idx) => {
                const isCurrent = idx === activeIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`${idx + 1}번 카드 (${slide.title}) 보기`}
                    aria-current={isCurrent ? 'true' : undefined}
                    onClick={() => scrollToSlide(idx)}
                    className="p-1 inline-flex items-center cursor-pointer touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <span
                      className={`block h-2 rounded-full transition-all ${
                        isCurrent
                          ? 'w-6 bg-white'
                          : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </section>
    </dialog>
  );
};
