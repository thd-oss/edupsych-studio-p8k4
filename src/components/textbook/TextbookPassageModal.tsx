import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  Languages,
  Loader2,
  X
} from 'lucide-react';
import { resolveNodeTextbookBundle } from '../../services/textbookPassageService';
import { GraphAdjacencyIndex, KnowledgeGraphNode } from '../../types/graph';
import {
  NodeTextbookBundle,
  TextbookBookId,
  TextbookExcerptCard
} from '../../types/textbook';

export interface TextbookPassageModalProps {
  nodeId: string | null;
  onClose: () => void;
  nodeMap: Record<string, KnowledgeGraphNode>;
  adjacency: GraphAdjacencyIndex;
}

const MIN_HIGHLIGHT_CHARS = 12;

const BOOK_BADGE_META: Record<
  TextbookBookId,
  {
    shortLabel: string;
    editionBadge: string;
    pillActiveClass: string;
    headerBadgeClass: string;
  }
> = {
  woolfolk: {
    shortLabel: 'Woolfolk 13e',
    editionBadge: 'Woolfolk · 13th Global Ed.',
    pillActiveClass: 'bg-[#1d1d1f] text-white shadow-2xs',
    headerBadgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200/90'
  },
  seifert: {
    shortLabel: 'Seifert & Sutton',
    editionBadge: 'Seifert & Sutton · Open Textbook',
    pillActiveClass: 'bg-emerald-800 text-white shadow-2xs',
    headerBadgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200/90'
  }
};

let cachedSupportsDiscreteDisplay: boolean | null = null;

function canTransitionDisplay(): boolean {
  if (cachedSupportsDiscreteDisplay !== null) {
    return cachedSupportsDiscreteDisplay;
  }
  if (typeof document === 'undefined' || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.transition = 'display 1ms allow-discrete';
  document.body.appendChild(probe);
  cachedSupportsDiscreteDisplay =
    getComputedStyle(probe).transitionProperty === 'display';
  probe.remove();
  return cachedSupportsDiscreteDisplay;
}

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

interface TextSegment {
  text: string;
  highlighted: boolean;
}

function buildHighlightSegments(
  verbatimText: string,
  highlightQuotes: string[]
): TextSegment[] {
  const validQuotes = highlightQuotes
    .map((q) => q.trim())
    .filter((q) => q.length >= MIN_HIGHLIGHT_CHARS);

  if (validQuotes.length === 0) {
    return [{ text: verbatimText, highlighted: false }];
  }

  const ranges: Array<{ start: number; end: number }> = [];
  const lowerBody = verbatimText.toLowerCase();

  for (const quote of validQuotes) {
    const idx = lowerBody.indexOf(quote.toLowerCase());
    if (idx >= 0) {
      ranges.push({ start: idx, end: idx + quote.length });
    }
  }

  if (ranges.length === 0) {
    return [{ text: verbatimText, highlighted: false }];
  }

  ranges.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const r of ranges) {
    const prev = merged[merged.length - 1];
    if (prev && r.start <= prev.end) {
      prev.end = Math.max(prev.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) {
      segments.push({
        text: verbatimText.slice(cursor, r.start),
        highlighted: false
      });
    }
    segments.push({
      text: verbatimText.slice(r.start, r.end),
      highlighted: true
    });
    cursor = r.end;
  }
  if (cursor < verbatimText.length) {
    segments.push({
      text: verbatimText.slice(cursor),
      highlighted: false
    });
  }

  return segments;
}

export const TextbookPassageModal: React.FC<TextbookPassageModalProps> = ({
  nodeId,
  onClose,
  nodeMap,
  adjacency
}) => {
  const titleId = useId();
  const tabBaseId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isClosingRef = useRef<boolean>(false);

  const [bundle, setBundle] = useState<NodeTextbookBundle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showKoreanGuide, setShowKoreanGuide] = useState<boolean>(true);

  const isOpen = Boolean(nodeId);

  const closeTopLayer = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open) {
      onClose();
      return;
    }
    if (isClosingRef.current) return;

    if (canTransitionDisplay()) {
      dialog.close();
      return;
    }

    isClosingRef.current = true;
    dialog.dataset.closing = '';
    try {
      await Promise.allSettled(
        dialog.getAnimations({ subtree: true }).map((anim) => anim.finished)
      );
    } finally {
      delete dialog.dataset.closing;
      isClosingRef.current = false;
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [onClose]);

  // 모달 열림/닫힘 동기화 (네이티브 showModal)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      delete dialog.dataset.closing;
      isClosingRef.current = false;
      if (!dialog.open) {
        dialog.showModal();
        closeBtnRef.current?.focus({ preventScroll: true });
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // 노드 변경 시 해당 모듈 원문 발췌 번들 지연 로드
  useEffect(() => {
    if (!nodeId) {
      setBundle(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setActiveIndex(0);

    resolveNodeTextbookBundle(nodeId, nodeMap, adjacency)
      .then((resolved) => {
        if (cancelled) return;
        if (!resolved || resolved.excerpts.length === 0) {
          setBundle(null);
          setLoadError('이 항목에 연결된 교재 원문 발췌 단락을 찾지 못했습니다.');
        } else {
          setBundle(resolved);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setBundle(null);
        setLoadError(
          err instanceof Error
            ? err.message
            : '교재 원문 발췌를 불러오는 중 오류가 발생했습니다.'
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adjacency, nodeId, nodeMap]);

  // closedBy 미지원 브라우저(구형 Safari 등) 폴백:
  // 텍스트 드래그 선택 중 백드롭 위에서 마우스를 떼어도 닫히지 않도록 press + release 모두 바깥일 때만 닫기
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog || typeof HTMLDialogElement === 'undefined') {
      return;
    }
    if ('closedBy' in HTMLDialogElement.prototype) {
      return;
    }

    let pressedOutside = false;

    const handlePointerDown = (event: PointerEvent) => {
      pressedOutside = isPointOutsideDialog(event, dialog);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (pressedOutside && isPointOutsideDialog(event, dialog)) {
        void closeTopLayer();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [closeTopLayer, isOpen]);

  const excerpts: TextbookExcerptCard[] = bundle?.excerpts ?? [];
  const safeIndex =
    excerpts.length > 0 ? Math.min(activeIndex, excerpts.length - 1) : 0;
  const activeExcerpt: TextbookExcerptCard | undefined = excerpts[safeIndex];

  const highlightedSegments = useMemo(() => {
    if (!activeExcerpt) return [];
    return buildHighlightSegments(
      activeExcerpt.verbatimExcerpt,
      activeExcerpt.highlightQuotes
    );
  }, [activeExcerpt]);

  useEffect(() => {
    tabRefs.current[safeIndex]?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest'
    });
  }, [safeIndex]);

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (excerpts.length <= 1) return;
    let nextIdx = idx;
    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % excerpts.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + excerpts.length) % excerpts.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = excerpts.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    setActiveIndex(nextIdx);
    tabRefs.current[nextIdx]?.focus();
  };

  const fallbackTitle = nodeId ? nodeMap[nodeId]?.titleKo ?? '교재 원문 발췌' : '교재 원문 발췌';

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={titleId}
      onCancel={(e) => {
        if (!canTransitionDisplay()) {
          e.preventDefault();
          void closeTopLayer();
        }
      }}
      onClose={() => {
        if (dialogRef.current) {
          dialogRef.current.returnValue = '';
        }
        onClose();
      }}
      className="textbook-reader-dialog"
    >
      {/* 상단 헤더 */}
      <header className="px-5 sm:px-6 pt-5 pb-4 bg-[#fbfbfd] border-b border-black/[0.06] shrink-0 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-2.5 py-0.5 text-[11px] font-bold text-white whitespace-nowrap">
              <BookOpen className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>교재 원문 발췌</span>
            </span>
            {bundle?.moduleId && (
              <span className="rounded-full bg-[var(--accent-subtle)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent-solid)] uppercase tabular-nums">
                {bundle.moduleId.toUpperCase()}
              </span>
            )}
            {bundle?.sourceCitation && (
              <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-[#6e6e73] truncate max-w-full">
                {bundle.sourceCitation}
              </span>
            )}
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            autoFocus
            onClick={() => void closeTopLayer()}
            aria-label="교재 원문 창 닫기"
            className="inline-flex min-h-[34px] min-w-[34px] shrink-0 items-center justify-center rounded-full bg-black/[0.05] hover:bg-black/[0.1] text-[#1d1d1f] transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-0.5 min-w-0">
          <h2
            id={titleId}
            className="text-base sm:text-lg font-bold tracking-[-0.02em] text-[#1d1d1f] leading-snug korean-keep-all"
          >
            {bundle?.titleKo ?? fallbackTitle}
          </h2>
          {bundle?.titleEn && (
            <p className="text-xs font-medium text-[#6e6e73] leading-snug">
              {bundle.titleEn}
            </p>
          )}
        </div>

        {/* 원문 단락 전환 탭리스트 + 한글 대조 토글 */}
        {excerpts.length > 0 && (
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="교재별 원문 발췌 단락 선택"
              className="single-row-tablist rounded-full bg-black/[0.05] p-1 min-w-0 max-w-full"
            >
              {excerpts.map((ex, idx) => {
                const isSelected = idx === safeIndex;
                const meta = BOOK_BADGE_META[ex.bookId];
                return (
                  <button
                    key={ex.id}
                    ref={(el) => {
                      tabRefs.current[idx] = el;
                    }}
                    id={`${tabBaseId}-${idx}`}
                    role="tab"
                    type="button"
                    tabIndex={isSelected ? 0 : -1}
                    aria-selected={isSelected}
                    onClick={() => setActiveIndex(idx)}
                    onKeyDown={(e) => handleTabKeyDown(e, idx)}
                    className={`no-press-scale min-h-[30px] rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors tabular-nums ${
                      isSelected
                        ? meta.pillActiveClass
                        : 'text-[#424245] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {meta.shortLabel} · {ex.pageLabel}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              aria-pressed={showKoreanGuide}
              onClick={() => setShowKoreanGuide((prev) => !prev)}
              className={`inline-flex min-h-[30px] shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors whitespace-nowrap ${
                showKoreanGuide
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent-solid)] border-[#0071e3]/25'
                  : 'bg-white text-[#6e6e73] border-black/[0.08] hover:text-[#1d1d1f]'
              }`}
            >
              <Languages className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{showKoreanGuide ? '한글 대조 켜짐' : '원문만 집중'}</span>
            </button>
          </div>
        )}
      </header>

      {/* 스크롤 본문: 원서 지면 리더 카드 */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 bg-[#f5f5f7]">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-[#6e6e73]">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-solid)]" aria-hidden="true" />
            <p className="text-xs font-semibold">교재 원문 단락을 불러오는 중입니다...</p>
          </div>
        ) : loadError ? (
          <div className="rounded-[20px] bg-white border border-black/[0.06] p-6 text-center space-y-2">
            <p className="text-sm font-semibold text-[#1d1d1f] korean-keep-all">
              {loadError}
            </p>
          </div>
        ) : activeExcerpt ? (
          <div
            role="tabpanel"
            aria-labelledby={`${tabBaseId}-${safeIndex}`}
            className="space-y-4"
          >
            {/* 원서 지면 카드 (Warm Editorial Paper) */}
            <article className="rounded-[20px] bg-[#fcfbf7] border border-amber-950/[0.09] shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-950/[0.08]">
                <div className="space-y-0.5 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                      BOOK_BADGE_META[activeExcerpt.bookId].headerBadgeClass
                    }`}
                  >
                    <BookMarked className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>{BOOK_BADGE_META[activeExcerpt.bookId].editionBadge}</span>
                  </span>
                  <p className="text-xs font-semibold text-[#424245] pt-1">
                    {activeExcerpt.chapterLabel} · {activeExcerpt.sectionHeading}
                  </p>
                </div>

                <span className="shrink-0 rounded-lg bg-amber-900/[0.07] px-2.5 py-1 text-xs font-extrabold text-amber-950 tabular-nums">
                  원서 {activeExcerpt.pageLabel}
                </span>
              </div>

              {/* 영문 원문 단락 + 핵심 구절 하이라이트 */}
              <blockquote className="textbook-serif-prose text-[15px] sm:text-[16.5px] text-[#1d1d1f]">
                {highlightedSegments.map((seg, idx) =>
                  seg.highlighted ? (
                    <mark
                      key={idx}
                      className="rounded-[4px] bg-amber-200/75 px-1 py-0.5 text-[#1d1d1f]"
                    >
                      {seg.text}
                    </mark>
                  ) : (
                    <React.Fragment key={idx}>{seg.text}</React.Fragment>
                  )
                )}
              </blockquote>

              {/* Woolfolk Glossary 원문 용어 사전 정의 콜아웃 */}
              {activeExcerpt.glossaryEntry && (
                <div className="rounded-[14px] bg-amber-100/55 border border-amber-300/70 px-4 py-3 space-y-1">
                  <span className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wide block">
                    Textbook Glossary Definition
                  </span>
                  <p className="text-xs sm:text-[13px] text-[#1d1d1f] leading-relaxed font-serif select-text">
                    {activeExcerpt.glossaryEntry}
                  </p>
                </div>
              )}
            </article>

            {/* 한글 핵심 해설 대조 카드 */}
            {showKoreanGuide && activeExcerpt.koreanContextGuide && (
              <section
                aria-label="한글 핵심 대조 해설"
                className="rounded-[18px] bg-white border border-black/[0.06] p-4 sm:p-5 space-y-1.5"
              >
                <span className="text-[11px] font-bold text-[var(--accent-solid)] block">
                  한글 핵심 명제 · 대학원 시험 대조 포인트
                </span>
                <p className="text-xs sm:text-sm text-[#424245] leading-relaxed korean-keep-all select-text">
                  {activeExcerpt.koreanContextGuide}
                </p>
              </section>
            )}
          </div>
        ) : null}
      </div>

      {/* 하단 단락 넘기기 푸터 */}
      {excerpts.length > 1 && (
        <footer className="px-4 sm:px-6 py-3 bg-[#fbfbfd] border-t border-black/[0.06] flex items-center justify-between gap-2 shrink-0 tabular-nums">
          <button
            type="button"
            disabled={safeIndex === 0}
            onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
            className="shrink-0 whitespace-nowrap inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] disabled:opacity-40 disabled:pointer-events-none px-3.5 py-1.5 text-xs font-semibold text-[#1d1d1f] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>이전 단락</span>
          </button>

          <span className="text-xs font-semibold text-[#6e6e73] text-center whitespace-nowrap">
            <span>
              발췌 {safeIndex + 1} / {excerpts.length}
            </span>
            <span className="hidden sm:inline"> · 바깥 음영 터치 시 닫힘</span>
          </span>

          <button
            type="button"
            disabled={safeIndex === excerpts.length - 1}
            onClick={() =>
              setActiveIndex((prev) => Math.min(excerpts.length - 1, prev + 1))
            }
            className="shrink-0 whitespace-nowrap inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] disabled:opacity-40 disabled:pointer-events-none px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
          >
            <span>다음 단락</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </button>
        </footer>
      )}
    </dialog>
  );
};
