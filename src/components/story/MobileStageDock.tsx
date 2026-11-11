import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Maximize2,
  Minimize2,
  Network
} from 'lucide-react';
import { MODULE_CONCEPT_ANCHORS } from '../../data/curriculumGraph';
import {
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  StoryBeatDescriptor,
  WorkspaceTabId
} from '../../types/graph';
import { ModulePayload } from '../../types/study';
import { StickyVisualStage } from './StickyVisualStage';

export type MobileStageDetent = 'collapsed' | 'half' | 'full';

interface MobileStageDockProps {
  detent: MobileStageDetent;
  onChangeDetent: (next: MobileStageDetent) => void;
  activeModule: ModulePayload;
  activeBeat: StoryBeatDescriptor | null;
  activeNodeId: string;
  nodeMap: Record<string, KnowledgeGraphNode>;
  edges: KnowledgeGraphEdge[];
  masteryMap: Record<string, MasteryState>;
  onSelectNode: (nodeId: string) => void;
  onInspectNode: (nodeId: string) => void;
  onJumpToWorkspace: (
    tab: WorkspaceTabId,
    moduleId: ModuleId,
    nodeId: string
  ) => void;
}

const COLLAPSED_BAR_HEIGHT_PX = 62;
const FULL_TOP_PEEK_PX = 8;
const HALF_VISIBLE_RATIO = 0.46;
const MIN_HALF_EXTRA_PX = 140;
const DRAG_ACTIVATE_THRESHOLD_PX = 4;
const FLICK_VELOCITY_PX_PER_MS = 0.42;
const FAST_DISMISS_RATIO = 0.35;
const BLUR_RESTORE_DELAY_MS = 120;
const ANNOUNCEMENT_CLEAR_MS = 1200;

const DETENT_ANNOUNCEMENTS: Record<MobileStageDetent, string> = {
  collapsed: '도식 바텀시트가 하단 대기 바로 접혔습니다',
  half: '도식 바텀시트가 하단 반반 비교 모드로 열렸습니다',
  full: '도식 바텀시트가 전체 화면 모드로 확장되었습니다'
};

function isTextEntryElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type.toLowerCase();
    return !['button', 'checkbox', 'radio', 'range', 'submit', 'file'].includes(
      type
    );
  }
  return el.isContentEditable;
}

function clampOffset(val: number, minVal: number, maxVal: number): number {
  return Math.max(minVal, Math.min(maxVal, val));
}

export const MobileStageDock: React.FC<MobileStageDockProps> = ({
  detent,
  onChangeDetent,
  activeModule,
  activeBeat,
  activeNodeId,
  nodeMap,
  edges,
  masteryMap,
  onSelectNode,
  onInspectNode,
  onJumpToWorkspace
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);

  const dragSessionRef = useRef<{
    pointerId: number;
    startY: number;
    startOffsetPx: number;
    lastY: number;
    lastTimeMs: number;
    velocityY: number;
    didExceedThreshold: boolean;
  } | null>(null);

  const [viewportHeightPx, setViewportHeightPx] = useState<number>(0);
  const [headerHeightPx, setHeaderHeightPx] = useState<number>(
    COLLAPSED_BAR_HEIGHT_PX
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffsetPx, setDragOffsetPx] = useState<number | null>(null);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [showKeyHelp, setShowKeyHelp] = useState<boolean>(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  const conceptAnchor = MODULE_CONCEPT_ANCHORS[activeModule.id];
  const syncedNode = nodeMap[activeNodeId];
  const syncedTitle =
    syncedNode?.titleKo ??
    activeBeat?.titleKo ??
    activeModule.theories[0]?.titleKo ??
    activeModule.title;

  // 스테이지 가용 높이 실시간 측정 (ResizeObserver)
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const updateSizes = () => {
      setViewportHeightPx(vp.clientHeight);
      if (headerRef.current) {
        setHeaderHeightPx(headerRef.current.offsetHeight);
      }
    };

    updateSizes();
    const ro = new ResizeObserver(updateSizes);
    ro.observe(vp);
    if (headerRef.current) {
      ro.observe(headerRef.current);
    }
    return () => ro.disconnect();
  }, [showKeyHelp]);

  // 본문 입력창 포커스 시 가상 키보드 시야 확보를 위해 일시적으로 하단 대기 위치로 접음
  useEffect(() => {
    let blurTimer: number | null = null;

    const onFocusIn = (e: FocusEvent) => {
      if (
        sheetRef.current &&
        e.target instanceof Node &&
        sheetRef.current.contains(e.target)
      ) {
        return;
      }
      if (isTextEntryElement(e.target)) {
        if (blurTimer !== null) {
          window.clearTimeout(blurTimer);
          blurTimer = null;
        }
        setIsInputFocused(true);
      }
    };

    const onFocusOut = () => {
      blurTimer = window.setTimeout(() => {
        if (!isTextEntryElement(document.activeElement)) {
          setIsInputFocused(false);
        }
      }, BLUR_RESTORE_DELAY_MS);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      if (blurTimer !== null) {
        window.clearTimeout(blurTimer);
      }
    };
  }, []);

  const commitDetentWithAnnouncement = useCallback(
    (next: MobileStageDetent) => {
      onChangeDetent(next);
      setLiveAnnouncement(DETENT_ANNOUNCEMENTS[next]);
    },
    [onChangeDetent]
  );

  // 안내 메시지 1.2초 후 정리 (modern-web-guidance: drag)
  useEffect(() => {
    if (!liveAnnouncement) return;
    const id = window.setTimeout(() => {
      setLiveAnnouncement('');
    }, ANNOUNCEMENT_CLEAR_MS);
    return () => window.clearTimeout(id);
  }, [liveAnnouncement]);

  // Esc 키로 단계별 하강 (full -> half -> collapsed)
  useEffect(() => {
    if (detent === 'collapsed') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        commitDetentWithAnnouncement(detent === 'full' ? 'half' : 'collapsed');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detent, commitDetentWithAnnouncement]);

  const effectiveDetent: MobileStageDetent =
    isInputFocused && detent !== 'full' ? 'collapsed' : detent;

  // 3단 디텐트별 픽셀 오프셋 연산 (0에 가까울수록 위로 열림)
  const detentOffsets = useMemo(() => {
    if (viewportHeightPx <= 0) {
      return null;
    }
    const fullOffset = FULL_TOP_PEEK_PX;
    const halfVisible = Math.max(
      COLLAPSED_BAR_HEIGHT_PX + MIN_HALF_EXTRA_PX,
      Math.round(viewportHeightPx * HALF_VISIBLE_RATIO)
    );
    const halfOffset = Math.max(fullOffset, viewportHeightPx - halfVisible);
    const collapsedOffset = Math.max(
      halfOffset,
      viewportHeightPx - COLLAPSED_BAR_HEIGHT_PX
    );

    return {
      full: fullOffset,
      half: halfOffset,
      collapsed: collapsedOffset,
      halfVisible
    };
  }, [viewportHeightPx]);

  const targetOffsetPx = detentOffsets
    ? detentOffsets[effectiveDetent]
    : null;

  const renderedTransform = useMemo(() => {
    if (isDragging && dragOffsetPx !== null) {
      return `translate3d(0, ${dragOffsetPx}px, 0)`;
    }
    if (targetOffsetPx !== null) {
      return `translate3d(0, ${targetOffsetPx}px, 0)`;
    }
    // 첫 측정 전 CSS 퍼센트/토큰 폴백
    if (effectiveDetent === 'full') return 'translate3d(0, 8px, 0)';
    if (effectiveDetent === 'half') return 'translate3d(0, 54%, 0)';
    return 'translate3d(0, calc(100% - var(--mobile-sheet-collapsed-h)), 0)';
  }, [isDragging, dragOffsetPx, targetOffsetPx, effectiveDetent]);

  // 반반(half) 안착 시 도식 내부 스크롤이 끝까지 닿도록 가시 높이에 맞춤 (드래그 중에는 레이아웃 재계산 0회)
  const bodyContainerHeightPx = useMemo(() => {
    if (!detentOffsets) return undefined;
    if (isDragging || effectiveDetent === 'full') {
      return Math.max(160, viewportHeightPx - FULL_TOP_PEEK_PX - headerHeightPx);
    }
    if (effectiveDetent === 'half') {
      return Math.max(140, detentOffsets.halfVisible - headerHeightPx);
    }
    return Math.max(140, detentOffsets.halfVisible - headerHeightPx);
  }, [detentOffsets, isDragging, effectiveDetent, viewportHeightPx, headerHeightPx]);

  const startDragSession = (
    e: React.PointerEvent<HTMLElement>,
    captureTarget: HTMLElement
  ) => {
    if (e.button !== 0 || !detentOffsets) return;
    const currentOffset = detentOffsets[effectiveDetent];
    dragSessionRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startOffsetPx: currentOffset,
      lastY: e.clientY,
      lastTimeMs: performance.now(),
      velocityY: 0,
      didExceedThreshold: false
    };
    captureTarget.setPointerCapture(e.pointerId);
  };

  const moveDragSession = (
    e: React.PointerEvent<HTMLElement>,
    captureTarget: HTMLElement
  ) => {
    const session = dragSessionRef.current;
    if (
      !session ||
      !detentOffsets ||
      !captureTarget.hasPointerCapture(e.pointerId)
    ) {
      return;
    }

    const deltaY = e.clientY - session.startY;
    if (
      !session.didExceedThreshold &&
      Math.abs(deltaY) < DRAG_ACTIVATE_THRESHOLD_PX
    ) {
      return;
    }

    if (!session.didExceedThreshold) {
      session.didExceedThreshold = true;
      setIsDragging(true);
    }

    const now = performance.now();
    const dt = Math.max(1, now - session.lastTimeMs);
    session.velocityY = (e.clientY - session.lastY) / dt;
    session.lastY = e.clientY;
    session.lastTimeMs = now;

    const clamped = clampOffset(
      session.startOffsetPx + deltaY,
      detentOffsets.full,
      detentOffsets.collapsed
    );
    setDragOffsetPx(clamped);
  };

  const finishDragSession = (
    e: React.PointerEvent<HTMLElement>,
    allowTapCycle: boolean
  ) => {
    const session = dragSessionRef.current;
    if (!session) return;
    dragSessionRef.current = null;

    if (!session.didExceedThreshold) {
      setIsDragging(false);
      setDragOffsetPx(null);
      if (allowTapCycle) {
        const nextByTap: MobileStageDetent =
          effectiveDetent === 'collapsed'
            ? 'half'
            : effectiveDetent === 'half'
            ? 'full'
            : 'collapsed';
        setIsInputFocused(false);
        commitDetentWithAnnouncement(nextByTap);
      }
      return;
    }

    if (!detentOffsets) {
      setIsDragging(false);
      setDragOffsetPx(null);
      return;
    }

    const finalOffset = clampOffset(
      session.startOffsetPx + (e.clientY - session.startY),
      detentOffsets.full,
      detentOffsets.collapsed
    );
    const vy = session.velocityY;

    let resolvedDetent: MobileStageDetent = effectiveDetent;

    if (vy < -FLICK_VELOCITY_PX_PER_MS) {
      // 위로 빠르게 쓸어올린 경우: 한 단계 확장 (이미 반반보다 훨씬 위로 올렸다면 바로 전체 확장)
      const midUpper = (detentOffsets.full + detentOffsets.half) / 2;
      if (effectiveDetent === 'collapsed') {
        resolvedDetent = finalOffset < midUpper ? 'full' : 'half';
      } else {
        resolvedDetent = 'full';
      }
    } else if (vy > FLICK_VELOCITY_PX_PER_MS) {
      // 아래로 빠르게 쓸어내린 경우: 단계 하강 또는 스토리 모드 복귀
      const dismissCutoff =
        detentOffsets.half +
        (detentOffsets.collapsed - detentOffsets.half) * FAST_DISMISS_RATIO;
      if (effectiveDetent === 'full') {
        resolvedDetent = finalOffset > dismissCutoff ? 'collapsed' : 'half';
      } else {
        resolvedDetent = 'collapsed';
      }
    } else {
      // 손을 천천히 뗀 경우: 가장 가까운 디텐트로 스냅
      const candidates: Array<{ key: MobileStageDetent; dist: number }> = [
        { key: 'full', dist: Math.abs(finalOffset - detentOffsets.full) },
        { key: 'half', dist: Math.abs(finalOffset - detentOffsets.half) },
        {
          key: 'collapsed',
          dist: Math.abs(finalOffset - detentOffsets.collapsed)
        }
      ];
      candidates.sort((a, b) => a.dist - b.dist);
      resolvedDetent = candidates[0].key;
    }

    setIsDragging(false);
    setDragOffsetPx(null);
    setIsInputFocused(false);
    commitDetentWithAnnouncement(resolvedDetent);
  };

  const cancelDragSession = () => {
    if (!dragSessionRef.current) return;
    dragSessionRef.current = null;
    setIsDragging(false);
    setDragOffsetPx(null);
  };

  // 키보드 방향키로 3단 높이 조절 (modern-web-guidance: drag)
  const handleGrabberKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsInputFocused(false);
      commitDetentWithAnnouncement(
        effectiveDetent === 'collapsed' ? 'half' : 'full'
      );
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commitDetentWithAnnouncement(
        effectiveDetent === 'full' ? 'half' : 'collapsed'
      );
    } else if (e.key === 'Home') {
      e.preventDefault();
      setIsInputFocused(false);
      commitDetentWithAnnouncement('full');
    } else if (e.key === 'End') {
      e.preventDefault();
      commitDetentWithAnnouncement('collapsed');
    }
  };

  const isCollapsed = effectiveDetent === 'collapsed' && !isDragging;

  return (
    <div
      ref={viewportRef}
      className="no-print print:hidden lg:hidden fixed inset-x-0 top-[calc(var(--mobile-topbar-h)+env(safe-area-inset-top,0px))] bottom-[calc(var(--mobile-bottom-nav-h)+env(safe-area-inset-bottom,0px))] overflow-hidden pointer-events-none z-30"
    >
      {/* 전체 화면(full) 확장 시에만 상단 8px 틈새 뒤로 은은한 배경 딤 표시 (탭 시 반반 모드로 하강) */}
      {effectiveDetent === 'full' && !isDragging && (
        <div
          aria-hidden="true"
          onClick={() => commitDetentWithAnnouncement('half')}
          className="pointer-events-auto absolute inset-0 bg-slate-950/35 transition-opacity"
        />
      )}

      {/* 단일 연속 하단 바텀시트 (collapsed ↔ half ↔ full 모두 GPU translate3d로 이동) */}
      <aside
        ref={sheetRef}
        aria-label="스크롤 연동 인터랙티브 도식 바텀시트"
        style={{ transform: renderedTransform }}
        className={`mobile-detent-sheet pointer-events-auto relative h-full w-full flex flex-col rounded-t-2xl bg-white border-t border-slate-900/20 shadow-[0_-10px_32px_rgba(15,23,42,0.22)] overflow-hidden ${
          isDragging ? 'dragging' : ''
        }`}
      >
        {/* 상단 시트 헤더 & 애플 홈 인디케이터 스타일 그립 핸들(Grabber) */}
        <div
          ref={headerRef}
          onPointerDown={(e) => {
            const interactive = (e.target as HTMLElement).closest(
              'button, a, input, select, textarea'
            );
            if (interactive) return;
            startDragSession(e, e.currentTarget);
          }}
          onPointerMove={(e) => moveDragSession(e, e.currentTarget)}
          onPointerUp={(e) => finishDragSession(e, false)}
          onLostPointerCapture={cancelDragSession}
          className="sheet-drag-handle bg-slate-950 text-white px-3 pt-1.5 pb-2 border-b border-white/10 shrink-0"
        >
          {/* 전용 접근성 <button> 그립 막대 (애플 홈 바 스타일 가로 캡슐) */}
          <button
            type="button"
            aria-label="도식 바텀시트 손잡이. 위아래로 쓸어올리거나 내려서 접힘, 반반 비교, 전체 화면 단계를 조절하세요. 키보드는 위·아래 방향키를 사용하세요."
            onKeyDown={handleGrabberKeyDown}
            onPointerDown={(e) => {
              e.stopPropagation();
              startDragSession(e, e.currentTarget);
            }}
            onPointerMove={(e) => {
              e.stopPropagation();
              moveDragSession(e, e.currentTarget);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              finishDragSession(e, true);
            }}
            onLostPointerCapture={cancelDragSession}
            className={`sheet-drag-handle no-press-scale group w-full py-1 flex flex-col items-center justify-center rounded-lg focus-visible:outline-indigo-400 ${
              isDragging ? 'dragging' : ''
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 rounded-full transition-all ${
                isDragging
                  ? 'w-14 bg-indigo-400'
                  : 'w-11 bg-white/45 group-hover:bg-white/75'
              }`}
            />
          </button>

          {/* 동기화 상태 타이틀 & 원탭 단계 전환 버튼 */}
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-extrabold text-white shrink-0 tabular-nums"
                style={{ backgroundColor: conceptAnchor.accentHex }}
              >
                M{activeModule.number}
              </span>
              <span className="text-xs font-extrabold text-white truncate">
                {syncedTitle}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {effectiveDetent === 'collapsed' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInputFocused(false);
                      commitDetentWithAnnouncement('half');
                    }}
                    className="min-h-[30px] inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-extrabold text-white"
                  >
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>반반 보기</span>
                  </button>
                  <button
                    type="button"
                    aria-label="전체 화면으로 도식 펼치기"
                    onClick={() => {
                      setIsInputFocused(false);
                      commitDetentWithAnnouncement('full');
                    }}
                    className="min-h-[30px] inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2 py-1 text-[11px] font-bold text-slate-200"
                  >
                    <Maximize2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>전체</span>
                  </button>
                </>
              ) : effectiveDetent === 'half' ? (
                <>
                  <button
                    type="button"
                    onClick={() => commitDetentWithAnnouncement('full')}
                    className="min-h-[30px] inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-extrabold text-white"
                  >
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>전체 확장</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => commitDetentWithAnnouncement('collapsed')}
                    className="min-h-[30px] inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2 py-1 text-[11px] font-bold text-slate-200"
                  >
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>내리기</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label="현재 노드 지식 그래프 연결망 보기"
                    onClick={() => {
                      commitDetentWithAnnouncement('collapsed');
                      onInspectNode(activeNodeId);
                    }}
                    className="min-h-[30px] inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2 py-1 text-[11px] font-bold text-indigo-200"
                  >
                    <Network className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>연결망</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => commitDetentWithAnnouncement('half')}
                    className="min-h-[30px] inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-extrabold text-white"
                  >
                    <Minimize2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>반반으로</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => commitDetentWithAnnouncement('collapsed')}
                    className="min-h-[30px] inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2 py-1 text-[11px] font-bold text-slate-200"
                  >
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>닫기</span>
                  </button>
                </>
              )}

              <button
                type="button"
                aria-label="바텀시트 조작 도움말 보기"
                aria-expanded={showKeyHelp}
                onClick={() => setShowKeyHelp((prev) => !prev)}
                className="min-h-[30px] min-w-[28px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <CircleHelp className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {showKeyHelp && (
            <p className="mt-1.5 rounded-lg bg-slate-900 border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-300 leading-snug">
              상단 가로 막대를 쓸어올리면 <strong>반반 비교 → 전체 화면</strong>으로 확장되고, 쓸어내리면 <strong>스토리 모드</strong>로 돌아갑니다. (키보드: 손잡이 포커스 후 <kbd className="px-1 rounded bg-white/10">↑</kbd>/<kbd className="px-1 rounded bg-white/10">↓</kbd>, <kbd className="px-1 rounded bg-white/10">Esc</kbd>)
            </p>
          )}
        </div>

        {/* 시트 본문: 인터랙티브 도식 · 보철 실험기 · 서브그래프 */}
        <div
          {...({ inert: isCollapsed ? '' : undefined } as Record<
            string,
            string | undefined
          >)}
          style={
            bodyContainerHeightPx !== undefined
              ? { height: `${bodyContainerHeightPx}px` }
              : undefined
          }
          className="min-h-0 flex flex-col overflow-hidden bg-white"
        >
          <StickyVisualStage
            density="dock"
            activeModule={activeModule}
            activeBeat={activeBeat}
            activeNodeId={activeNodeId}
            nodeMap={nodeMap}
            edges={edges}
            masteryMap={masteryMap}
            onSelectNode={onSelectNode}
            onInspectNode={(nodeId) => {
              commitDetentWithAnnouncement('collapsed');
              onInspectNode(nodeId);
            }}
            onJumpToWorkspace={(tab, modId, nodeId) => {
              commitDetentWithAnnouncement('collapsed');
              onJumpToWorkspace(tab, modId, nodeId);
            }}
          />
        </div>
      </aside>

      {/* 스크린리더용 실시간 디텐트 이동 상태 알림 (modern-web-guidance: drag) */}
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>
    </div>
  );
};
