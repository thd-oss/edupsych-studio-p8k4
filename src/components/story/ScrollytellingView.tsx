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
  BookOpenCheck,
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown
} from 'lucide-react';
import { MODULE_CONCEPT_ANCHORS } from '../../data/curriculumGraph';
import {
  GraphAdjacencyIndex,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  StoryProgressState,
  StoryScrollRequest
} from '../../types/graph';
import { ModulePayload } from '../../types/study';
import { ModuleStoryChapter } from './ModuleStoryChapter';

interface ScrollytellingViewProps {
  modules: ModulePayload[];
  selectedModule: ModuleId;
  onChangeModule: (mod: ModuleId) => void;
  initialNodeId: string | null;
  scrollRequest: StoryScrollRequest | null;
  onConsumeScrollRequest: () => void;
  onActiveNodeChange: (nodeId: string) => void;
  storyProgress: StoryProgressState;
  bookmarks: string[];
  adjacency: GraphAdjacencyIndex;
  nodeMap: Record<string, KnowledgeGraphNode>;
  masteryMap: Record<string, MasteryState>;
  onMarkBeatVisited: (beatId: string, primaryNodeId?: string) => void;
  onRecordSimulationChoice: (theoryId: string, optionIndex: number) => void;
  onToggleBookmark: (itemId: string) => void;
  onToggleModuleCompleted: (moduleId: ModuleId) => void;
  onNavigateNode: (nodeId: string) => void;
  onStartModuleTraining: (moduleId: ModuleId) => void;
}

const SCROLL_JUMP_DELAY_MS = 60;
const OBSERVER_MARGIN_STANDARD = '-22% 0px -48% 0px';

export const ScrollytellingView: React.FC<ScrollytellingViewProps> = ({
  modules,
  selectedModule,
  onChangeModule,
  initialNodeId,
  scrollRequest,
  onConsumeScrollRequest,
  onActiveNodeChange,
  storyProgress,
  bookmarks,
  adjacency,
  nodeMap,
  masteryMap,
  onMarkBeatVisited,
  onRecordSimulationChoice,
  onToggleBookmark,
  onToggleModuleCompleted,
  onNavigateNode,
  onStartModuleTraining
}) => {
  const tabBaseId = useId();
  const narrativeContainerRef = useRef<HTMLDivElement | null>(null);
  const moduleTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const currentModule = useMemo(
    () => modules.find((m) => m.id === selectedModule) ?? modules[0],
    [modules, selectedModule]
  );

  const [activeNodeId, setActiveNodeId] = useState<string>(() => {
    if (
      initialNodeId &&
      nodeMap[initialNodeId]?.moduleId === selectedModule
    ) {
      return initialNodeId;
    }
    return currentModule.theories[0]?.id ?? currentModule.id;
  });

  const [activeBeatId, setActiveBeatId] = useState<string | null>(
    `${currentModule.id}-beat-myth`
  );

  // 전체 원문 디스클로저 일괄 펼침/접기 상태
  const [areAllDisclosuresOpen, setAreAllDisclosuresOpen] =
    useState<boolean>(false);

  const syncDisclosureExpansionState = useCallback(() => {
    const container = narrativeContainerRef.current;
    if (!container) return;
    const disclosures = Array.from(
      container.querySelectorAll<HTMLDetailsElement>('details.apple-disclosure')
    );
    if (disclosures.length === 0) return;
    setAreAllDisclosuresOpen(disclosures.every((el) => el.open));
  }, []);

  useEffect(() => {
    const container = narrativeContainerRef.current;
    if (!container) return;
    container.addEventListener('toggle', syncDisclosureExpansionState, true);
    return () => {
      container.removeEventListener(
        'toggle',
        syncDisclosureExpansionState,
        true
      );
    };
  }, [syncDisclosureExpansionState]);

  const handleToggleReadAllDisclosures = () => {
    const container = narrativeContainerRef.current;
    const nextOpen = !areAllDisclosuresOpen;
    setAreAllDisclosuresOpen(nextOpen);
    if (!container) return;
    const disclosures = container.querySelectorAll<HTMLDetailsElement>(
      'details.apple-disclosure'
    );
    disclosures.forEach((el) => {
      el.open = nextOpen;
    });
  };

  // 선택된 모듈 탭이 항상 가시 영역에 들어오도록 탭 스트립 내부 스크롤 동기화
  useEffect(() => {
    const idx = modules.findIndex((m) => m.id === currentModule.id);
    if (idx >= 0) {
      moduleTabRefs.current[idx]?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [currentModule.id, modules]);

  // 모듈 변경 시 활성 노드 기본값 동기화
  useEffect(() => {
    setActiveNodeId((prev) => {
      const prevNode = nodeMap[prev];
      if (prevNode && prevNode.moduleId === currentModule.id) {
        return prev;
      }
      const fallbackId = currentModule.theories[0]?.id ?? currentModule.id;
      onActiveNodeChange(fallbackId);
      return fallbackId;
    });
  }, [currentModule, nodeMap, onActiveNodeChange]);

  // 단발성 스크롤 이동 명령(scrollRequest) 처리
  useEffect(() => {
    if (!scrollRequest) return;
    const targetNodeId = scrollRequest.nodeId;
    const targetNode = nodeMap[targetNodeId];
    if (targetNode && targetNode.moduleId !== currentModule.id) {
      onChangeModule(targetNode.moduleId);
    }
    setActiveNodeId(targetNodeId);

    const timerId = window.setTimeout(() => {
      const container = narrativeContainerRef.current;
      if (container) {
        const el =
          container.querySelector<HTMLElement>(
            `[data-node-id="${targetNodeId}"]`
          ) ??
          container.querySelector<HTMLElement>(
            `#story-chapter-${currentModule.id}`
          );

        if (el) {
          const beatAttr = el.getAttribute('data-beat-id');
          if (beatAttr) setActiveBeatId(beatAttr);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      onConsumeScrollRequest();
    }, SCROLL_JUMP_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, [
    scrollRequest,
    currentModule.id,
    nodeMap,
    onChangeModule,
    onConsumeScrollRequest
  ]);

  // 단일 IntersectionObserver로 현재 모듈 내 비트 감지
  useEffect(() => {
    const container = narrativeContainerRef.current;
    if (!container) return;

    const beatElements = Array.from(
      container.querySelectorAll<HTMLElement>('[data-beat-id]')
    );
    if (beatElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          const beatId = target.getAttribute('data-beat-id');
          const nodeId = target.getAttribute('data-node-id');

          if (beatId) {
            setActiveBeatId(beatId);
          }
          if (nodeId) {
            setActiveNodeId(nodeId);
            onActiveNodeChange(nodeId);
          }
          if (beatId) {
            onMarkBeatVisited(beatId, nodeId ?? undefined);
          }
        }
      },
      {
        root: null,
        rootMargin: OBSERVER_MARGIN_STANDARD,
        threshold: 0.05
      }
    );

    beatElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [currentModule, onMarkBeatVisited, onActiveNodeChange]);

  const handleFocusNodeManual = (nodeId: string, beatId?: string) => {
    setActiveNodeId(nodeId);
    onActiveNodeChange(nodeId);
    if (beatId) {
      setActiveBeatId(beatId);
      onMarkBeatVisited(beatId, nodeId);
    }
  };

  const selectModuleAndScrollTop = (modId: ModuleId) => {
    if (modId !== currentModule.id) {
      onChangeModule(modId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleModuleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    let nextIdx = idx;
    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % modules.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + modules.length) % modules.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = modules.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const targetMod = modules[nextIdx];
    onChangeModule(targetMod.id);
    moduleTabRefs.current[nextIdx]?.focus();
  };

  const currentModuleIndex = modules.findIndex(
    (m) => m.id === currentModule.id
  );
  const prevModule =
    currentModuleIndex > 0 ? modules[currentModuleIndex - 1] : null;
  const nextModule =
    currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1
      ? modules[currentModuleIndex + 1]
      : null;

  const activeTabDomId = `${tabBaseId}-${currentModule.id}`;

  return (
    <div className="max-w-[1040px] mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* 비고정(Non-sticky) 1모듈 집중 컨트롤 바 */}
      <section className="bento-tile-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-solid)]">
              <BookOpenCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                개념학습 · Module 0{currentModule.number} / 0{modules.length}
              </span>
            </span>
            <h1 className="text-lg sm:text-xl font-bold tracking-[-0.02em] text-[#1d1d1f] korean-keep-all">
              통념 반박부터 핵심 이론·임상 사례까지 한 모듈씩 정독합니다.
            </h1>
          </div>

          <button
            type="button"
            aria-expanded={areAllDisclosuresOpen}
            onClick={handleToggleReadAllDisclosures}
            className={`min-h-[36px] shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              areAllDisclosuresOpen
                ? 'bg-[var(--accent-solid)] text-white'
                : 'bg-[#f5f5f7] hover:bg-black/[0.07] text-[#1d1d1f]'
            }`}
          >
            {areAllDisclosuresOpen ? (
              <>
                <ChevronsDownUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>전체 원문 접기</span>
              </>
            ) : (
              <>
                <ChevronsUpDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>전체 원문 펼치기</span>
              </>
            )}
          </button>
        </div>

        {/* 단일 행(Single-Row) M1~M5 모듈 전환 탭리스트 */}
        <div className="pt-3 border-t border-black/[0.06]">
          <div
            role="tablist"
            aria-label="개념학습 모듈 선택"
            className="single-row-tablist pb-1"
          >
            {modules.map((m, idx) => {
              const isSelected = currentModule.id === m.id;
              const isDone = storyProgress.completedModules.includes(m.id);
              const anchor = MODULE_CONCEPT_ANCHORS[m.id];

              return (
                <button
                  key={m.id}
                  ref={(el) => {
                    moduleTabRefs.current[idx] = el;
                  }}
                  id={`${tabBaseId}-${m.id}`}
                  role="tab"
                  type="button"
                  tabIndex={isSelected ? 0 : -1}
                  aria-selected={isSelected}
                  onClick={() => selectModuleAndScrollTop(m.id)}
                  onKeyDown={(e) => handleModuleTabKeyDown(e, idx)}
                  className={`no-press-scale min-h-[38px] rounded-[12px] px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-[#1d1d1f] text-white'
                      : 'bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.07] hover:text-[#1d1d1f]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: anchor.accentHex }}
                    aria-hidden="true"
                  />
                  <span>
                    M{m.number}. {m.title.split(' ')[0]}
                  </span>
                  {isDone && (
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 선택된 단일 모듈 본문 패널 */}
      <div
        ref={narrativeContainerRef}
        role="tabpanel"
        aria-labelledby={activeTabDomId}
        className="space-y-8 sm:space-y-10 min-w-0"
      >
        <ModuleStoryChapter
          key={currentModule.id}
          mod={currentModule}
          activeBeatId={activeBeatId}
          activeNodeId={activeNodeId}
          isCompleted={storyProgress.completedModules.includes(
            currentModule.id
          )}
          defaultExpandDisclosures={areAllDisclosuresOpen}
          visitedBeats={storyProgress.visitedBeats}
          simulationChoices={storyProgress.simulationChoices}
          bookmarks={bookmarks}
          adjacency={adjacency}
          nodeMap={nodeMap}
          masteryMap={masteryMap}
          onFocusNode={handleFocusNodeManual}
          onNavigateNode={onNavigateNode}
          onRecordSimulationChoice={onRecordSimulationChoice}
          onToggleBookmark={onToggleBookmark}
          onToggleModuleCompleted={onToggleModuleCompleted}
          onStartModuleTraining={onStartModuleTraining}
        />

        {/* 하단 이전/다음 모듈 페이저 */}
        <nav
          aria-label="이전 및 다음 모듈 이동"
          className="bento-tile-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2.5 tabular-nums"
        >
          {prevModule ? (
            <button
              type="button"
              onClick={() => selectModuleAndScrollTop(prevModule.id)}
              className="min-h-[42px] inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] px-4 py-2 text-xs font-semibold text-[#1d1d1f] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                이전: M{prevModule.number}. {prevModule.title.split(' ')[0]}
              </span>
            </button>
          ) : (
            <span className="text-xs font-medium text-[#6e6e73] px-2">
              첫 번째 모듈입니다
            </span>
          )}

          {nextModule ? (
            <button
              type="button"
              onClick={() => selectModuleAndScrollTop(nextModule.id)}
              className="min-h-[42px] inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] px-5 py-2 text-xs font-semibold text-white transition-colors"
            >
              <span>
                다음: M{nextModule.number}. {nextModule.title.split(' ')[0]}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          ) : (
            <span className="text-xs font-semibold text-emerald-700 px-2">
              마지막 모듈(M5)입니다
            </span>
          )}
        </nav>
      </div>
    </div>
  );
};
