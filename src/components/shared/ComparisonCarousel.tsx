import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ComparisonSlide {
  id: string;
  tabLabel: string;
  badge?: string;
  activeTabClass?: string;
  content: React.ReactNode;
}

interface ComparisonCarouselProps {
  ariaLabel: string;
  slides: ComparisonSlide[];
  className?: string;
}

const SETTLE_DEBOUNCE_MS = 140;

function computeNearestSlideIndex(track: HTMLDivElement): number {
  const children = Array.from(track.children) as HTMLElement[];
  if (children.length === 0) return 0;

  const trackRect = track.getBoundingClientRect();
  const trackCenter = trackRect.left + trackRect.width / 2;

  let nearestIdx = 0;
  let minDistance = Number.POSITIVE_INFINITY;

  children.forEach((child, idx) => {
    const rect = child.getBoundingClientRect();
    const childCenter = rect.left + rect.width / 2;
    const distance = Math.abs(childCenter - trackCenter);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIdx = idx;
    }
  });

  return nearestIdx;
}

export const ComparisonCarousel: React.FC<ComparisonCarouselProps> = ({
  ariaLabel,
  slides,
  className = ''
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pendingTargetRef = useRef<number | null>(null);
  const settledIndexRef = useRef<number>(0);
  const userInteractedRef = useRef<boolean>(false);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [settledIndex, setSettledIndex] = useState<number>(0);
  const [settledAnnouncement, setSettledAnnouncement] = useState<string>('');

  const scrollToSlide = useCallback(
    (targetIdx: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clampedIdx = Math.max(0, Math.min(slides.length - 1, targetIdx));
      const targetEl = track.children[clampedIdx] as HTMLElement | undefined;
      if (!targetEl) return;

      userInteractedRef.current = true;
      pendingTargetRef.current = clampedIdx;
      setActiveIndex(clampedIdx);

      const trackRect = track.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const offsetFromCenter =
        targetRect.left +
        targetRect.width / 2 -
        (trackRect.left + trackRect.width / 2);

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      track.scrollBy({
        left: offsetFromCenter,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    },
    [slides.length]
  );

  const handleStep = useCallback(
    (delta: -1 | 1) => {
      const baseIndex =
        pendingTargetRef.current !== null
          ? pendingTargetRef.current
          : activeIndex;
      scrollToSlide(baseIndex + delta);
    },
    [activeIndex, scrollToSlide]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId: number | null = null;
    let debounceTimerId: number | null = null;

    const handleSettled = () => {
      const idx = computeNearestSlideIndex(track);
      pendingTargetRef.current = null;
      setActiveIndex(idx);
      setSettledIndex(idx);

      if (userInteractedRef.current && idx !== settledIndexRef.current) {
        const slide = slides[idx];
        if (slide) {
          setSettledAnnouncement(
            `${slides.length}개 중 ${idx + 1}번째 관점: ${slide.tabLabel}`
          );
        }
      }
      settledIndexRef.current = idx;
    };

    const handleScroll = () => {
      userInteractedRef.current = true;

      if (pendingTargetRef.current === null && rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          rafId = null;
          if (pendingTargetRef.current !== null) return;
          const nextIdx = computeNearestSlideIndex(track);
          setActiveIndex((prev) => (prev === nextIdx ? prev : nextIdx));
        });
      }

      if (!('onscrollend' in HTMLElement.prototype)) {
        if (debounceTimerId !== null) {
          window.clearTimeout(debounceTimerId);
        }
        debounceTimerId = window.setTimeout(handleSettled, SETTLE_DEBOUNCE_MS);
      }
    };

    track.addEventListener('scroll', handleScroll, { passive: true });

    const supportsScrollEnd = 'onscrollend' in HTMLElement.prototype;
    if (supportsScrollEnd) {
      track.addEventListener('scrollend', handleSettled);
    }

    return () => {
      track.removeEventListener('scroll', handleScroll);
      if (supportsScrollEnd) {
        track.removeEventListener('scrollend', handleSettled);
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (debounceTimerId !== null) {
        window.clearTimeout(debounceTimerId);
      }
    };
  }, [slides]);

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      className={`space-y-2.5 ${className}`}
    >
      {/* 상단 세그먼트 마커 탭 & 이전/다음 버튼 (DOM 순서상 트랙 앞 배치) */}
      <div className="flex items-center gap-1.5 justify-between">
        <nav
          aria-label={`${ariaLabel} 관점 바로가기`}
          className="mobile-strip-scroll flex-1 min-w-0 rounded-xl bg-slate-100/90 border border-slate-900/[0.08] p-1"
        >
          {slides.map((slide, idx) => {
            const isCurrent = activeIndex === idx;
            const activeClass =
              slide.activeTabClass ??
              'bg-slate-900 text-white shadow-xs border-slate-900';

            return (
              <button
                key={slide.id}
                type="button"
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => scrollToSlide(idx)}
                className={`no-press-scale min-h-[34px] flex-1 rounded-lg px-2.5 py-1 text-xs font-extrabold border transition-colors flex items-center justify-center gap-1 whitespace-nowrap ${
                  isCurrent
                    ? activeClass
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                <span>{slide.tabLabel}</span>
                {slide.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {slide.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="이전 관점 보기"
            disabled={settledIndex === 0 && activeIndex === 0}
            onClick={() => handleStep(-1)}
            className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg bg-white border border-slate-900/[0.08] text-slate-700 disabled:opacity-35"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="다음 관점 보기"
            disabled={
              settledIndex === slides.length - 1 &&
              activeIndex === slides.length - 1
            }
            onClick={() => handleStep(1)}
            className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg bg-white border border-slate-900/[0.08] text-slate-700 disabled:opacity-35"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 네이티브 가로 스크롤 스냅 트랙 */}
      <div
        ref={trackRef}
        tabIndex={0}
        role="group"
        aria-label={`${ariaLabel} 슬라이드 트랙 (좌우로 밀어서 비교)`}
        className="comparison-carousel-track rounded-xl"
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slides.length}개 중 ${idx + 1}번째: ${slide.tabLabel}`}
            className="min-w-0"
          >
            {slide.content}
          </div>
        ))}
      </div>

      {/* 하단 스와이프 힌트 도트 + 접근성 상태 알림 영역 */}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
        <span>좌우로 스와이프하거나 상단 탭을 눌러 바로 대조하세요</span>
        <span className="font-bold tabular-nums text-slate-700">
          {activeIndex + 1} / {slides.length}
        </span>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {settledAnnouncement}
      </p>
    </section>
  );
};
