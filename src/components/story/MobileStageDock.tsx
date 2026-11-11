import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ChevronDown,
  Maximize2,
  Rows2,
  Sparkles,
  X
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

export type MobileStageViewMode = 'minimized' | 'split' | 'sheet';

interface MobileStageDockProps {
  stageViewMode: MobileStageViewMode;
  onChangeStageViewMode: (next: MobileStageViewMode) => void;
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

const BLUR_RESTORE_DELAY_MS = 120;

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

export const MobileStageDock: React.FC<MobileStageDockProps> = ({
  stageViewMode,
  onChangeStageViewMode,
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
  const sheetDialogRef = useRef<HTMLDialogElement | null>(null);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const nextModeOnSheetCloseRef = useRef<MobileStageViewMode>('minimized');
  const sheetTitleId = useId();

  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const conceptAnchor = MODULE_CONCEPT_ANCHORS[activeModule.id];
  const syncedNode = nodeMap[activeNodeId];
  const syncedTitle =
    syncedNode?.titleKo ??
    activeBeat?.titleKo ??
    activeModule.theories[0]?.titleKo ??
    activeModule.title;

  // 가상 키보드 활성화 시 상하 스플릿 상단 도식을 일시 접어 입력 시야 확보
  useEffect(() => {
    let blurTimer: number | null = null;

    const onFocusIn = (e: FocusEvent) => {
      if (
        splitContainerRef.current &&
        e.target instanceof Node &&
        splitContainerRef.current.contains(e.target)
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

  // 네이티브 <dialog> Top-Layer 모달 동기화 (showModal / close)
  useEffect(() => {
    const dialog = sheetDialogRef.current;
    if (!dialog) return;

    if (stageViewMode === 'sheet') {
      nextModeOnSheetCloseRef.current = 'minimized';
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [stageViewMode]);

  // closedby="any" 미지원 브라우저(Safari 등)용 백드롭 Light-Dismiss 폴백
  useEffect(() => {
    const dialog = sheetDialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onChangeStageViewMode(nextModeOnSheetCloseRef.current);
    };

    dialog.addEventListener('close', handleClose);

    let cleanupFallback: (() => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
      };
      const onPointerDown = (e: PointerEvent) => {
        if (e.target !== dialog) {
          pressedOutside = false;
          return;
        }
        pressedOutside = isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && e.target === dialog && isOutside(e)) {
          dialog.close();
        }
        pressedOutside = false;
      };

      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      cleanupFallback = () => {
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      if (cleanupFallback) cleanupFallback();
    };
  }, [onChangeStageViewMode]);

  const handleSwitchSheetToSplit = () => {
    nextModeOnSheetCloseRef.current = 'split';
    if (sheetDialogRef.current?.open) {
      sheetDialogRef.current.close();
    } else {
      onChangeStageViewMode('split');
    }
  };

  return (
    <>
      {/* 1) 상하 반반 스플릿 비교 모드 (상단 고정 도식 + 하단 본문 스크롤 동시 대조) */}
      {stageViewMode === 'split' && (
        <div
          ref={splitContainerRef}
          className="lg:hidden sticky top-[calc(var(--mobile-topbar-h)+env(safe-area-inset-top,0px))] z-30 -mx-3 sm:mx-0 sm:rounded-2xl overflow-hidden border-b sm:border border-slate-900/15 shadow-lg bg-slate-950"
        >
          {/* 슬림 상단 스플릿 컨트롤 바 */}
          <div className="px-3 py-1.5 bg-slate-950 text-white border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-extrabold text-white shrink-0 tabular-nums"
                style={{ backgroundColor: conceptAnchor.accentHex }}
              >
                M{activeModule.number} 동기화
              </span>
              <span className="text-xs font-bold text-slate-100 truncate">
                {syncedTitle}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isInputFocused ? (
                <button
                  type="button"
                  onClick={() => setIsInputFocused(false)}
                  className="min-h-[30px] rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  도식 다시 펴기
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onChangeStageViewMode('sheet')}
                    aria-label="전체 바텀시트로 도식 확대"
                    className="min-h-[30px] inline-flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/15 px-2 py-1 text-[11px] font-bold text-slate-100"
                  >
                    <Maximize2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>확대</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeStageViewMode('minimized')}
                    aria-label="상단 고정 도식 접기"
                    className="min-h-[30px] inline-flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/15 px-2 py-1 text-[11px] font-bold text-slate-200"
                  >
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>접기</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {!isInputFocused && (
            <StickyVisualStage
              density="split"
              activeModule={activeModule}
              activeBeat={activeBeat}
              activeNodeId={activeNodeId}
              nodeMap={nodeMap}
              edges={edges}
              masteryMap={masteryMap}
              onSelectNode={onSelectNode}
              onInspectNode={onInspectNode}
              onJumpToWorkspace={onJumpToWorkspace}
            />
          )}
        </div>
      )}

      {/* 2) 평상시 하단 플로팅 도식 동기화 HUD (하단 네비게이션 독 바로 위) */}
      {stageViewMode === 'minimized' && !isInputFocused && (
        <div
          role="region"
          aria-label="현재 본문과 동기화된 시각 도식 바로가기"
          className="no-print lg:hidden fixed safe-floating-hud z-30 rounded-2xl bg-slate-950/95 text-white border border-white/15 shadow-xl px-3 py-2 flex items-center justify-between gap-2 backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => onChangeStageViewMode('split')}
            className="flex items-center gap-2 min-w-0 text-left flex-1"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: conceptAnchor.accentHex }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-indigo-300 block leading-tight">
                스크롤 연동 도식 대기 중 · M{activeModule.number}
              </span>
              <span className="text-xs font-extrabold text-white block truncate">
                {syncedTitle}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onChangeStageViewMode('split')}
              className="min-h-[36px] inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1.5 text-xs font-extrabold text-white"
            >
              <Rows2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>반반 비교</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeStageViewMode('sheet')}
              aria-label="도식 전체 시트로 열기"
              className="min-h-[36px] inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-2.5 py-1.5 text-xs font-bold text-slate-100"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
              <span>시트</span>
            </button>
          </div>
        </div>
      )}

      {/* 3) 바텀시트 전체 도식 모달 (네이티브 Top-Layer <dialog closedby="any">) */}
      <dialog
        ref={sheetDialogRef}
        aria-labelledby={sheetTitleId}
        {...({ closedby: 'any' } as Record<string, string>)}
        className="bottom-sheet-dialog lg:hidden rounded-t-2xl bg-white text-slate-900 border-t border-slate-900/15 shadow-2xl p-0 overflow-hidden"
      >
        <div className="bg-slate-950 text-white px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-indigo-300 block">
              인터랙티브 도식 · 작업기억 실험실
            </span>
            <h2
              id={sheetTitleId}
              className="text-sm font-extrabold text-white truncate"
            >
              {syncedTitle}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSwitchSheetToSplit}
              className="min-h-[34px] inline-flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-xs font-bold text-white"
            >
              <Rows2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>상하 반반 비교로 전환</span>
            </button>
            <button
              type="button"
              autoFocus
              aria-label="도식 시트 닫기"
              onClick={() => sheetDialogRef.current?.close()}
              className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {stageViewMode === 'sheet' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <StickyVisualStage
              density="sheet"
              activeModule={activeModule}
              activeBeat={activeBeat}
              activeNodeId={activeNodeId}
              nodeMap={nodeMap}
              edges={edges}
              masteryMap={masteryMap}
              onSelectNode={onSelectNode}
              onInspectNode={(nodeId) => {
                sheetDialogRef.current?.close();
                onInspectNode(nodeId);
              }}
              onJumpToWorkspace={(tab, modId, nodeId) => {
                sheetDialogRef.current?.close();
                onJumpToWorkspace(tab, modId, nodeId);
              }}
            />
          </div>
        )}
      </dialog>
    </>
  );
};
