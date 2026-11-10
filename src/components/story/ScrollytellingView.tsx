import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  Network
} from 'lucide-react';
import {
  buildModuleStoryBeats,
  MODULE_CONCEPT_ANCHORS
} from '../../data/curriculumGraph';
import {
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  StoryBeatDescriptor,
  StoryProgressState,
  StoryScrollRequest,
  WorkspaceTabId
} from '../../types/graph';
import { FlashcardStatus, ModulePayload } from '../../types/study';
import { ModuleStoryChapter } from './ModuleStoryChapter';
import { StickyVisualStage } from './StickyVisualStage';

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
  onJumpToWorkspace: (
    tab: WorkspaceTabId,
    moduleId: ModuleId,
    nodeId: string
  ) => void;
}

const SCROLL_JUMP_DELAY_MS = 60;

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
  nodeMap,
  edges,
  masteryMap,
  onMarkBeatVisited,
  onRecordSimulationChoice,
  onUpdateFlashcardStatus,
  onToggleBookmark,
  onUpdateItemNote,
  onToggleModuleCompleted,
  onInspectNode,
  onJumpToWorkspace
}) => {
  const narrativeContainerRef = useRef<HTMLDivElement | null>(null);

  const visibleModules = useMemo(() => {
    if (selectedModuleFilter === 'all') return modules;
    return modules.filter((m) => m.id === selectedModuleFilter);
  }, [modules, selectedModuleFilter]);

  const allBeatsMap = useMemo(() => {
    const map: Record<string, StoryBeatDescriptor> = {};
    for (const mod of modules) {
      const modBeats = buildModuleStoryBeats(mod);
      for (const b of modBeats) {
        map[b.beatId] = b;
      }
    }
    return map;
  }, [modules]);

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

  // 모듈 필터가 단일 모듈로 변경되면 해당 모듈 첫 이론으로 스테이지 동기화
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

  // 단일 IntersectionObserver로 스크롤 비트 감지 (scroll 이벤트 리스너 내 setState 금지 준수)
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
        rootMargin: '-30% 0px -48% 0px',
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

  const activeBeat: StoryBeatDescriptor | null = useMemo(() => {
    if (activeBeatId && allBeatsMap[activeBeatId]) {
      return allBeatsMap[activeBeatId];
    }
    return null;
  }, [activeBeatId, allBeatsMap]);

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
      return;
    }
    setActiveModuleId(modId);
    const el = document.getElementById(`story-chapter-${modId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const visitedCount = Object.keys(storyProgress.visitedBeats).length;

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-5 space-y-6">
      {/* 상단 스토리텔링 네비게이션 & 학습 흐름 브리프 (차분한 서피스 + 1px 헤어라인) */}
      <section className="surface-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
              <BookOpenCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>1단계 · 스크롤 연동 스토리텔링 커리큘럼</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
              현장의 오개념에서 출발해 과학자-실무자의 시선으로 교실 처방을 재설계합니다
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              좌측 서사 레일을 스크롤하며 <strong>통념 반박 투표 · 8대 개념 도식 조작 · 인라인 한-영 용어 인출 · 교실 사례 3중 렌즈 해부 · 압박 면접 방어</strong>를 차례대로 수행하세요. 우측 고정 스테이지가 현재 읽고 있는 문단과 실시간으로 동기화됩니다.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 shrink-0 tabular-nums">
            <div className="surface-subtle px-3 py-1.5 text-xs">
              <span className="text-slate-600">탐색한 스토리 비트: </span>
              <strong className="text-indigo-700 font-extrabold">
                {visitedCount} / 40
              </strong>
            </div>

            <button
              type="button"
              onClick={() =>
                onJumpToWorkspace('graph', activeModule.id, activeNodeId)
              }
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white"
            >
              <Network className="w-3.5 h-3.5 shrink-0" />
              <span>90-Node 스터디 워크스페이스 열기</span>
            </button>
          </div>
        </div>

        {/* 챕터 타임라인 네비게이터 (모바일 가로 스와이프 트랙 지원) */}
        <div className="pt-3 border-t border-slate-900/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 tabular-nums">
          <div
            role="region"
            aria-label="모듈 챕터 바로가기"
            className="chip-scroll-row"
          >
            <button
              type="button"
              onClick={() => onChangeModuleFilter('all')}
              className={`min-h-[34px] rounded-lg px-3 py-1.5 text-xs font-bold border ${
                selectedModuleFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              전 모듈 연속 학습 (Mod 1~5)
            </button>

            {modules.map((m) => {
              const isCurrent = activeModule.id === m.id;
              const isDone = storyProgress.completedModules.includes(m.id);
              const anchor = MODULE_CONCEPT_ANCHORS[m.id];

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => scrollToChapter(m.id)}
                  className={`min-h-[34px] rounded-lg px-3 py-1.5 text-xs font-bold border flex items-center gap-1.5 ${
                    selectedModuleFilter === m.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : isCurrent
                      ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: anchor.accentHex }}
                  />
                  <span>
                    Mod {m.number}. {m.title.split(' ')[0]}
                  </span>
                  {isDone && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
            <span className="font-semibold mr-1">단일 모듈 집중:</span>
            {modules.map((m) => (
              <button
                key={`filter-${m.id}`}
                type="button"
                onClick={() =>
                  onChangeModuleFilter(
                    selectedModuleFilter === m.id ? 'all' : m.id
                  )
                }
                className={`min-h-[28px] rounded-md px-2 py-0.5 font-bold border ${
                  selectedModuleFilter === m.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                M{m.number}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 메인 2-Column Scrollytelling Split (좌측 서사 레일 5 : 우측 Sticky Stage 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 좌측: 서사 스크롤 레일 (Narrative Scroll Rail) */}
        <div
          ref={narrativeContainerRef}
          className="lg:col-span-5 space-y-10 order-2 lg:order-1 min-w-0"
        >
          {visibleModules.map((mod) => (
            <ModuleStoryChapter
              key={mod.id}
              mod={mod}
              activeBeatId={activeBeatId}
              activeNodeId={activeNodeId}
              isCompleted={storyProgress.completedModules.includes(mod.id)}
              visitedBeats={storyProgress.visitedBeats}
              simulationChoices={storyProgress.simulationChoices}
              bookmarks={bookmarks}
              userNotes={userNotes}
              nodeMap={nodeMap}
              masteryMap={masteryMap}
              onFocusNode={handleFocusNodeManual}
              onInspectNode={onInspectNode}
              onRecordSimulationChoice={onRecordSimulationChoice}
              onUpdateFlashcardStatus={onUpdateFlashcardStatus}
              onToggleBookmark={onToggleBookmark}
              onUpdateItemNote={onUpdateItemNote}
              onToggleModuleCompleted={onToggleModuleCompleted}
              onJumpToWorkspace={onJumpToWorkspace}
            />
          ))}
        </div>

        {/* 우측: 고정 인터랙티브 스테이지 (Sticky Interactive Stage) */}
        <div className="lg:col-span-7 lg:sticky lg:top-[72px] order-1 lg:order-2 min-w-0">
          <StickyVisualStage
            activeModule={activeModule}
            activeBeat={activeBeat}
            activeNodeId={activeNodeId}
            nodeMap={nodeMap}
            edges={edges}
            masteryMap={masteryMap}
            onSelectNode={(nodeId) => handleFocusNodeManual(nodeId)}
            onInspectNode={onInspectNode}
            onJumpToWorkspace={onJumpToWorkspace}
          />
        </div>
      </div>
    </div>
  );
};
