import React, {
  useCallback,
  useEffect,
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
  ChevronsUpDown,
  Network
} from 'lucide-react';
import { MODULE_CONCEPT_ANCHORS } from '../../data/curriculumGraph';
import {
  GraphAdjacencyIndex,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  StoryProgressState,
  StoryScrollRequest,
  WorkspaceTabId
} from '../../types/graph';
import { FlashcardStatus, ModulePayload } from '../../types/study';
import { ModuleStoryChapter } from './ModuleStoryChapter';

interface ScrollytellingViewProps {
  modules: ModulePayload[];
  selectedModuleFilter: ModuleId | 'all';
  onChangeModuleFilter: (mod: ModuleId | 'all') => void;
  initialNodeId: string | null;
  scrollRequest: StoryScrollRequest | null;
  onConsumeScrollRequest: () => void;
  onActiveNodeChange: (nodeId: string) => void;
  storyProgress: StoryProgressState;
  bookmarks: string[];
  userNotes: Record<string, string>;
  adjacency: GraphAdjacencyIndex;
  nodeMap: Record<string, KnowledgeGraphNode>;
  edges: KnowledgeGraphEdge[];
  masteryMap: Record<string, MasteryState>;
  onMarkBeatVisited: (beatId: string, primaryNodeId?: string) => void;
  onRecordSimulationChoice: (theoryId: string, optionIndex: number) => void;
  onUpdateFlashcardStatus: (cardId: string, status: FlashcardStatus) => void;
  onToggleBookmark: (itemId: string) => void;
  onUpdateItemNote: (itemId: string, note: string) => void;
  onToggleModuleCompleted: (moduleId: ModuleId) => void;
  onInspectNode: (nodeId: string) => void;
  onJumpToStoryNode: (moduleId: ModuleId, nodeId: string) => void;
  onJumpToWorkspace: (
    tab: WorkspaceTabId,
    moduleId: ModuleId,
    nodeId: string
  ) => void;
}

const SCROLL_JUMP_DELAY_MS = 60;
const MOBILE_MEDIA_QUERY = '(max-width: 1023px)';
const OBSERVER_MARGIN_STANDARD = '-22% 0px -48% 0px';
const TOTAL_STORY_BEATS_COUNT = 40;

export const ScrollytellingView: React.FC<ScrollytellingViewProps> = ({
  modules,
  selectedModuleFilter,
  onChangeModuleFilter,
  initialNodeId,
  scrollRequest,
  onConsumeScrollRequest,
  onActiveNodeChange,
  storyProgress,
  bookmarks,
  userNotes,
  adjacency,
  nodeMap,
  masteryMap,
  onMarkBeatVisited,
  onRecordSimulationChoice,
  onUpdateFlashcardStatus,
  onToggleBookmark,
  onUpdateItemNote,
  onToggleModuleCompleted,
  onInspectNode,
  onJumpToStoryNode,
  onJumpToWorkspace
}) => {
  const narrativeContainerRef = useRef<HTMLDivElement | null>(null);

  const visibleModules = useMemo(() => {
    if (selectedModuleFilter === 'all') return modules;
    return modules.filter((m) => m.id === selectedModuleFilter);
  }, [modules, selectedModuleFilter]);

  const [activeModuleId, setActiveModuleId] = useState<ModuleId>(() => {
    if (selectedModuleFilter !== 'all') return selectedModuleFilter;
    if (initialNodeId && nodeMap[initialNodeId]) {
      return nodeMap[initialNodeId].moduleId;
    }
    return 'mod1';
  });

  const [activeNodeId, setActiveNodeId] = useState<string>(() => {
    return (
      initialNodeId ??
      storyProgress.lastActiveNodeId ??
      'mod1-theory-piaget'
    );
  });

  const [activeBeatId, setActiveBeatId] = useState<string | null>(
    'mod1-beat-myth'
  );

  // 정독 모드(전체 원문 디스클로저 일괄 펼침/접기) 상태
  const [areAllDisclosuresOpen, setAreAllDisclosuresOpen] =
    useState<boolean>(false);

  // 개별 <details.apple-disclosure> 열림/닫힘(⌘F 자동 열림 포함)과 마스터 정독 토글 aria-expanded 동기화
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
    // <details>의 toggle 이벤트는 버블링되지 않으므로 캡처 단계(true)에서 위임 수신
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

  // 단발성 스크롤 이동 명령(scrollRequest)이 전달되었을 때만 1회 이동 후 즉시 소비
  useEffect(() => {
    if (!scrollRequest) return;
    const targetNodeId = scrollRequest.nodeId;
    const targetNode = nodeMap[targetNodeId];
    if (targetNode) {
      setActiveModuleId(targetNode.moduleId);
      setActiveNodeId(targetNodeId);
    }

    const timerId = window.setTimeout(() => {
      const container = narrativeContainerRef.current;
      if (container) {
        const el =
          container.querySelector<HTMLElement>(
            `[data-node-id="${targetNodeId}"]`
          ) ??
          (targetNode
            ? container.querySelector<HTMLElement>(
                `#story-chapter-${targetNode.moduleId}`
              )
            : null);

        if (el) {
          const beatAttr = el.getAttribute('data-beat-id');
          if (beatAttr) setActiveBeatId(beatAttr);
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      onConsumeScrollRequest();
    }, SCROLL_JUMP_DELAY_MS);

    return () => window.clearTimeout(timerId);
  }, [scrollRequest, nodeMap, onConsumeScrollRequest]);

  // 모듈 필터가 단일 모듈로 변경되면 해당 모듈 첫 이론으로 활성 노드 동기화
  useEffect(() => {
    if (selectedModuleFilter !== 'all') {
      setActiveModuleId(selectedModuleFilter);
      const mod = modules.find((m) => m.id === selectedModuleFilter);
      if (mod && mod.theories[0]) {
        setActiveNodeId((prev) => {
          const prevNode = nodeMap[prev];
          if (prevNode && prevNode.moduleId === selectedModuleFilter) {
            return prev;
          }
          return mod.theories[0].id;
        });
      }
    }
  }, [selectedModuleFilter, modules, nodeMap]);

  // 단일 IntersectionObserver로 스크롤 비트 감지
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
          const modId = target.getAttribute('data-module-id') as ModuleId | null;

          if (beatId) {
            setActiveBeatId(beatId);
          }
          if (modId) {
            setActiveModuleId(modId);
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
  }, [visibleModules, onMarkBeatVisited, onActiveNodeChange]);

  const activeModule: ModulePayload = useMemo(() => {
    return (
      modules.find((m) => m.id === activeModuleId) ??
      visibleModules[0] ??
      modules[0]
    );
  }, [modules, visibleModules, activeModuleId]);

  const handleFocusNodeManual = (nodeId: string, beatId?: string) => {
    const node = nodeMap[nodeId];
    if (node) {
      setActiveModuleId(node.moduleId);
    }
    setActiveNodeId(nodeId);
    onActiveNodeChange(nodeId);
    if (beatId) {
      setActiveBeatId(beatId);
      onMarkBeatVisited(beatId, nodeId);
    }
  };

  const scrollToChapter = (modId: ModuleId) => {
    if (selectedModuleFilter !== 'all' && selectedModuleFilter !== modId) {
      onChangeModuleFilter(modId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia(MOBILE_MEDIA_QUERY).matches
    ) {
      onChangeModuleFilter(modId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveModuleId(modId);
    const el = document.getElementById(`story-chapter-${modId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentModuleIndex = modules.findIndex(
    (m) =>
      m.id ===
      (selectedModuleFilter === 'all' ? activeModule.id : selectedModuleFilter)
  );
  const prevModule =
    currentModuleIndex > 0 ? modules[currentModuleIndex - 1] : null;
  const nextModule =
    currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1
      ? modules[currentModuleIndex + 1]
      : null;

  const visitedCount = Object.keys(storyProgress.visitedBeats).length;

  return (
    <div className="max-w-[1060px] mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* 비고정(Non-sticky) 인라인 챕터 컨트롤 바 (content-first-noise-reduction: 상단 이중 sticky 적층 금지) */}
      <section className="bento-tile-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-solid)]">
              <BookOpenCheck className="w-3.5 h-3.5 shrink-0" />
              <span>풀와이드 스토리텔링 커리큘럼 · {visitedCount}/{TOTAL_STORY_BEATS_COUNT} 비트 탐색</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.022em] text-[#1d1d1f]">
              현장의 오개념에서 출발해 과학자-실무자의 처방을 체화합니다.
            </h1>
          </div>

          {/* 우측: [정독 모드: 전체 원문 펼치기] 마스터 토글 + 워크스페이스 이동 */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              aria-expanded={areAllDisclosuresOpen}
              onClick={handleToggleReadAllDisclosures}
              className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                areAllDisclosuresOpen
                  ? 'bg-[var(--accent-solid)] text-white'
                  : 'bg-[#f5f5f7] hover:bg-black/[0.07] text-[#1d1d1f]'
              }`}
            >
              {areAllDisclosuresOpen ? (
                <>
                  <ChevronsDownUp className="w-3.5 h-3.5 shrink-0" />
                  <span>정독 모드: 전체 원문 접기</span>
                </>
              ) : (
                <>
                  <ChevronsUpDown className="w-3.5 h-3.5 shrink-0" />
                  <span>정독 모드: 전체 원문 펼치기</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                onJumpToWorkspace('graph', activeModule.id, activeNodeId)
              }
              className="hidden sm:inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] px-4 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <Network className="w-3.5 h-3.5 shrink-0" />
              <span>워크스페이스 열기</span>
            </button>
          </div>
        </div>

        {/* 모듈 챕터 빠른 이동 캡슐 */}
        <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2 tabular-nums">
          <div
            role="region"
            aria-label="모듈 챕터 바로가기"
            className="mobile-strip-scroll sm:flex-wrap"
          >
            {modules.map((m) => {
              const isSelected = selectedModuleFilter === m.id;
              const isCurrent =
                selectedModuleFilter === 'all' && activeModule.id === m.id;
              const isDone = storyProgress.completedModules.includes(m.id);
              const anchor = MODULE_CONCEPT_ANCHORS[m.id];

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => scrollToChapter(m.id)}
                  className={`min-h-[34px] rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? 'bg-[#1d1d1f] text-white'
                      : isCurrent
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent-solid)]'
                      : 'bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.07]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: anchor.accentHex }}
                  />
                  <span>
                    M{m.number}. {m.title.split(' ')[0]}
                  </span>
                  {isDone && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => onChangeModuleFilter('all')}
              className={`min-h-[34px] rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedModuleFilter === 'all'
                  ? 'bg-[var(--accent-solid)] text-white'
                  : 'bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.07]'
              }`}
            >
              전 모듈 연속 (M1~5)
            </button>
          </div>
        </div>
      </section>

      {/* 풀와이드 단일 컬럼 에디토리얼 서사 + 인라인 인터랙티브 스테이지 스트림 */}
      <div
        ref={narrativeContainerRef}
        className="space-y-10 sm:space-y-12 min-w-0"
      >
        {visibleModules.map((mod) => (
          <ModuleStoryChapter
            key={mod.id}
            mod={mod}
            activeBeatId={activeBeatId}
            activeNodeId={activeNodeId}
            isCompleted={storyProgress.completedModules.includes(mod.id)}
            defaultExpandDisclosures={areAllDisclosuresOpen}
            visitedBeats={storyProgress.visitedBeats}
            simulationChoices={storyProgress.simulationChoices}
            bookmarks={bookmarks}
            userNotes={userNotes}
            adjacency={adjacency}
            nodeMap={nodeMap}
            masteryMap={masteryMap}
            onFocusNode={handleFocusNodeManual}
            onInspectNode={onInspectNode}
            onJumpToStoryNode={onJumpToStoryNode}
            onRecordSimulationChoice={onRecordSimulationChoice}
            onUpdateFlashcardStatus={onUpdateFlashcardStatus}
            onToggleBookmark={onToggleBookmark}
            onUpdateItemNote={onUpdateItemNote}
            onToggleModuleCompleted={onToggleModuleCompleted}
            onJumpToWorkspace={onJumpToWorkspace}
          />
        ))}

        {/* 단일 모듈 집중 모드일 때 하단 빠른 이전/다음 모듈 페이저 */}
        {selectedModuleFilter !== 'all' && (
          <nav
            aria-label="이전 및 다음 모듈 페이징"
            className="bento-tile-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2.5 tabular-nums"
          >
            {prevModule ? (
              <button
                type="button"
                onClick={() => {
                  onChangeModuleFilter(prevModule.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="min-h-[42px] inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] px-4 py-2 text-xs font-semibold text-[#1d1d1f] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>이전: M{prevModule.number}</span>
              </button>
            ) : (
              <span className="text-xs font-medium text-[#6e6e73] px-2">
                첫 번째 모듈입니다
              </span>
            )}

            <button
              type="button"
              onClick={() => onChangeModuleFilter('all')}
              className="min-h-[42px] rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] px-4 py-2 text-xs font-semibold text-[#424245] transition-colors"
            >
              전 모듈 연속 보기
            </button>

            {nextModule ? (
              <button
                type="button"
                onClick={() => {
                  onChangeModuleFilter(nextModule.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="min-h-[42px] inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] px-5 py-2 text-xs font-semibold text-white transition-colors"
              >
                <span>
                  다음: M{nextModule.number}. {nextModule.title.split(' ')[0]}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 px-2">
                마지막 모듈(M5) 완주 지점
              </span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
};
