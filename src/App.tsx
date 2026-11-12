import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { AppleHomeShowcaseView } from './components/home/AppleHomeShowcaseView';
import { CommandSearchModal } from './components/shell/CommandSearchModal';
import { DualModeTopBar } from './components/shell/DualModeTopBar';
import { FloatingAiTutorChat } from './components/shell/FloatingAiTutorChat';
import { MobileBottomNav } from './components/shell/MobileBottomNav';
import { NodeDetailDrawer } from './components/shell/NodeDetailDrawer';
import { ScrollytellingView } from './components/story/ScrollytellingView';
import { TextbookPassageModal } from './components/textbook/TextbookPassageModal';
import { StudyWorkspaceView } from './components/workspace/StudyWorkspaceView';
import { useStudyGraphStore } from './store/useStudyGraphStore';
import {
  AppMode,
  ModuleId,
  NodeKind,
  StoryScrollRequest,
  WorkspaceTabId
} from './types/graph';

const VALID_TABS: WorkspaceTabId[] = [
  'flashcards',
  'interview',
  'graph',
  'cheatsheet'
];

const CONCRETE_MODULES: ModuleId[] = [
  'mod1',
  'mod2',
  'mod3',
  'mod4',
  'mod5'
];

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

type CanonicalRouteSpec =
  | { destination: 'story' }
  | {
      destination: 'workspace';
      tab: WorkspaceTabId;
      scrollWindowTop: boolean;
    };

const CANONICAL_ROUTE_BY_KIND: Record<NodeKind, CanonicalRouteSpec> = {
  module: { destination: 'story' },
  theory: { destination: 'story' },
  case: { destination: 'story' },
  flashcard: {
    destination: 'workspace',
    tab: 'flashcards',
    scrollWindowTop: true
  },
  question: {
    destination: 'workspace',
    tab: 'interview',
    scrollWindowTop: false
  }
};

function isConcreteModuleId(val: string | null): val is ModuleId {
  return Boolean(val && CONCRETE_MODULES.includes(val as ModuleId));
}

function readInitialUrlState(fallbackStoryModule: ModuleId): {
  mode: AppMode;
  tab: WorkspaceTabId;
  storyMod: ModuleId;
  workspaceMod: ModuleId | 'all';
  node: string | null;
  weakFocus: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      mode: 'home',
      tab: 'flashcards',
      storyMod: fallbackStoryModule,
      workspaceMod: 'all',
      node: null,
      weakFocus: false
    };
  }
  const params = new URLSearchParams(window.location.search);
  const rawMode = params.get('mode');
  const rawTab = params.get('tab');
  const rawMod = params.get('mod');
  const rawNode = params.get('node');
  const rawFocus = params.get('focus');

  // 구버전 URL(?tab=theories | ?tab=cases) 호환 정규화 -> 개념학습으로 안내
  const isLegacyConceptTab = rawTab === 'theories' || rawTab === 'cases';
  const resolvedMode: AppMode = isLegacyConceptTab
    ? 'story'
    : rawMode === 'workspace'
    ? 'workspace'
    : rawMode === 'story'
    ? 'story'
    : 'home';

  const resolvedTab: WorkspaceTabId =
    rawFocus === 'weak'
      ? 'graph'
      : rawTab && VALID_TABS.includes(rawTab as WorkspaceTabId)
      ? (rawTab as WorkspaceTabId)
      : 'flashcards';

  const resolvedStoryMod: ModuleId = isConcreteModuleId(rawMod)
    ? rawMod
    : fallbackStoryModule;

  const resolvedWorkspaceMod: ModuleId | 'all' =
    rawMod === 'all'
      ? 'all'
      : isConcreteModuleId(rawMod)
      ? rawMod
      : 'all';

  return {
    mode: resolvedMode,
    tab: resolvedTab,
    storyMod: resolvedStoryMod,
    workspaceMod: resolvedWorkspaceMod,
    node: rawNode && rawNode.trim().length > 0 ? rawNode.trim() : null,
    weakFocus: rawFocus === 'weak'
  };
}

export const App: React.FC = () => {
  const {
    modules: enrichedModules,
    allTheories,
    allFlashcards,
    allCases,
    allQuestions,
    userProgress,
    curriculumGraph,
    nodeMasteryMap,
    resumeTarget,
    moduleSummaries,
    prioritizedWeakQueue,
    isServerConnected,
    markBeatVisited,
    recordSimulationChoice,
    toggleModuleCompleted,
    setLastActiveNode,
    setPreferredEntryMode,
    updateItemNote,
    updateFlashcardStatus,
    toggleBookmark,
    saveInterviewDraft,
    createNewItem,
    exportBackupJson,
    importBackupJson,
    resetAllProgress
  } = useStudyGraphStore();

  const initialUrl = useMemo(() => {
    const lastNode = userProgress.story.lastActiveNodeId;
    const fallbackMod =
      (lastNode && curriculumGraph.nodeMap[lastNode]?.moduleId) || 'mod1';
    return readInitialUrlState(fallbackMod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mode, setMode] = useState<AppMode>(initialUrl.mode);
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>(initialUrl.tab);
  const [storyModule, setStoryModule] = useState<ModuleId>(initialUrl.storyMod);
  const [workspaceModule, setWorkspaceModule] = useState<ModuleId | 'all'>(
    initialUrl.workspaceMod
  );
  const [activeNodeId, setActiveNodeId] = useState<string | null>(
    initialUrl.node ?? userProgress.story.lastActiveNodeId
  );
  const [storyScrollRequest, setStoryScrollRequest] =
    useState<StoryScrollRequest | null>(() =>
      initialUrl.node && initialUrl.mode === 'story'
        ? { nodeId: initialUrl.node, requestId: 1 }
        : null
    );
  const [workspaceFocusRequest, setWorkspaceFocusRequest] =
    useState<StoryScrollRequest | null>(() =>
      initialUrl.node && initialUrl.mode === 'workspace'
        ? { nodeId: initialUrl.node, requestId: 1 }
        : null
    );
  const [drawerNodeId, setDrawerNodeId] = useState<string | null>(null);
  const [textbookModalNodeId, setTextbookModalNodeId] = useState<string | null>(
    null
  );
  const [weakFocusActive, setWeakFocusActive] = useState<boolean>(
    initialUrl.weakFocus
  );
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState<boolean>(false);
  const [mobileBottomNavHeightPx, setMobileBottomNavHeightPx] = useState<
    number | null
  >(null);
  const mobileAiTriggerRef = useRef<HTMLButtonElement>(null);

  const isGraphViewActive = mode === 'workspace' && activeTab === 'graph';

  // 지식그래프 탭을 벗어나면 상세 드로어를 즉시 정리하여 타 화면에서의 중첩 오픈 방지
  useEffect(() => {
    if (!isGraphViewActive && drawerNodeId !== null) {
      setDrawerNodeId(null);
    }
  }, [isGraphViewActive, drawerNodeId]);

  const handleConsumeScrollRequest = useCallback(() => {
    setStoryScrollRequest(null);
  }, []);

  const handleConsumeWorkspaceFocusRequest = useCallback(() => {
    setWorkspaceFocusRequest(null);
  }, []);

  // URL Search Params 실시간 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (mode === 'story') {
      params.set('mod', storyModule);
    } else if (mode === 'workspace') {
      params.set('tab', activeTab);
      if (workspaceModule !== 'all') {
        params.set('mod', workspaceModule);
      }
      if (weakFocusActive) {
        params.set('focus', 'weak');
      }
    }
    const currentNode =
      (isGraphViewActive ? drawerNodeId : null) ??
      (mode !== 'home' ? activeNodeId : null);
    if (currentNode) {
      params.set('node', currentNode);
    }
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [
    mode,
    activeTab,
    storyModule,
    workspaceModule,
    activeNodeId,
    drawerNodeId,
    isGraphViewActive,
    weakFocusActive
  ]);

  // 글로벌 단축키 ⌘K (검색 모달) & ⌘J (교재 우선 탐색 AI 질문창)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsAiTutorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleChangeMode = useCallback(
    (nextMode: AppMode) => {
      setIsAiTutorOpen(false);
      setDrawerNodeId(null);
      setMode(nextMode);
      setPreferredEntryMode(nextMode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setPreferredEntryMode]
  );

  // 단일 정본 라우터: 노드 종류(NodeKind)에 따라 유일한 정본 화면으로 직행
  const navigateToCanonicalNode = useCallback(
    (nodeId: string) => {
      setDrawerNodeId(null);
      const node = curriculumGraph.nodeMap[nodeId];
      if (!node) {
        setMode('story');
        setPreferredEntryMode('story');
        return;
      }

      setActiveNodeId(node.id);
      if (node.kind !== 'module') {
        setLastActiveNode(node.id);
      }

      const route = CANONICAL_ROUTE_BY_KIND[node.kind];
      if (route.destination === 'story') {
        setStoryModule(node.moduleId);
        setStoryScrollRequest({ nodeId: node.id, requestId: Date.now() });
        setMode('story');
        setPreferredEntryMode('story');
        if (node.kind === 'module') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      setWorkspaceModule(node.moduleId);
      setActiveTab(route.tab);
      setWeakFocusActive(false);
      setWorkspaceFocusRequest({ nodeId: node.id, requestId: Date.now() });
      setMode('workspace');
      setPreferredEntryMode('workspace');
      if (route.scrollWindowTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [curriculumGraph.nodeMap, setLastActiveNode, setPreferredEntryMode]
  );

  // 단어장·90초 면접에서 [관련 개념학습] 클릭 시 부모 핵심이론 카드로 직행
  const handleJumpToConceptContext = useCallback(
    (nodeId: string) => {
      const node = curriculumGraph.nodeMap[nodeId];
      if (!node) return;
      if (
        node.kind === 'theory' ||
        node.kind === 'case' ||
        node.kind === 'module'
      ) {
        navigateToCanonicalNode(node.id);
        return;
      }

      const neighborIds = Array.from(
        curriculumGraph.adjacency.neighbors1HopByNode[node.id] ?? []
      );
      const parentTheoryId = neighborIds.find((nId) => {
        const candidate = curriculumGraph.nodeMap[nId];
        return (
          candidate?.kind === 'theory' && candidate.moduleId === node.moduleId
        );
      });
      navigateToCanonicalNode(parentTheoryId ?? node.moduleId);
    },
    [
      curriculumGraph.adjacency,
      curriculumGraph.nodeMap,
      navigateToCanonicalNode
    ]
  );

  // 개념학습 챕터 완주 후 [모듈 N 실전훈련 시작하기] 단일 진입점
  const handleStartModuleTraining = useCallback(
    (moduleId: ModuleId) => {
      setDrawerNodeId(null);
      setWorkspaceModule(moduleId);
      setActiveTab('flashcards');
      setWeakFocusActive(false);
      setMode('workspace');
      setPreferredEntryMode('workspace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setPreferredEntryMode]
  );

  // 상단 [복습 N] 배지 또는 홈 복습 알림 -> 지식그래프 취약 연결고리 하이라이트
  const handleJumpToWeakGraph = useCallback(() => {
    setDrawerNodeId(null);
    setMode('workspace');
    setPreferredEntryMode('workspace');
    setActiveTab('graph');
    setWorkspaceModule('all');
    setWeakFocusActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setPreferredEntryMode]);

  const appShellStyle = useMemo<React.CSSProperties | undefined>(
    () =>
      mobileBottomNavHeightPx !== null
        ? ({
            '--measured-bottom-nav-h': `${mobileBottomNavHeightPx}px`
          } as React.CSSProperties)
        : undefined,
    [mobileBottomNavHeightPx]
  );

  return (
    <div
      style={appShellStyle}
      className="min-h-[100dvh] bg-[var(--bg-canvas)] text-[var(--ink-primary)] flex flex-col"
    >
      {/* 상단 고정 48px 애플 프로스티드 글래스 리본: [홈 · 개념학습 · 실전훈련] */}
      <DualModeTopBar
        mode={mode}
        onChangeMode={handleChangeMode}
        completedModules={userProgress.story.completedModules}
        totalModulesCount={enrichedModules.length}
        masteryMap={nodeMasteryMap}
        totalNodesCount={curriculumGraph.nodes.length}
        isServerConnected={isServerConnected}
        isAiTutorOpen={isAiTutorOpen}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleAiTutor={() => setIsAiTutorOpen((prev) => !prev)}
        onJumpToWeakGraph={handleJumpToWeakGraph}
        onExportBackup={exportBackupJson}
        onImportBackup={importBackupJson}
        onResetProgress={resetAllProgress}
      />

      {/* 메인 컨텐츠: 홈 목차 · 개념학습(단일 모듈 집중) · 실전훈련(4대 도구) */}
      <main className="flex-1 pb-28 lg:pb-16">
        {mode === 'home' ? (
          <AppleHomeShowcaseView
            moduleSummaries={moduleSummaries}
            resumeTarget={resumeTarget}
            masteryMap={nodeMasteryMap}
            totalNodesCount={curriculumGraph.nodes.length}
            completedModulesCount={userProgress.story.completedModules.length}
            onResumeStudy={navigateToCanonicalNode}
            onOpenModuleStudy={navigateToCanonicalNode}
            onJumpToWeakGraph={handleJumpToWeakGraph}
          />
        ) : mode === 'story' ? (
          <ScrollytellingView
            modules={enrichedModules}
            selectedModule={storyModule}
            onChangeModule={(nextMod) => {
              setStoryModule(nextMod);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            initialNodeId={activeNodeId}
            scrollRequest={storyScrollRequest}
            onConsumeScrollRequest={handleConsumeScrollRequest}
            onActiveNodeChange={setActiveNodeId}
            storyProgress={userProgress.story}
            bookmarks={userProgress.bookmarks}
            adjacency={curriculumGraph.adjacency}
            nodeMap={curriculumGraph.nodeMap}
            masteryMap={nodeMasteryMap}
            onMarkBeatVisited={markBeatVisited}
            onRecordSimulationChoice={recordSimulationChoice}
            onToggleBookmark={toggleBookmark}
            onToggleModuleCompleted={toggleModuleCompleted}
            onNavigateNode={navigateToCanonicalNode}
            onStartModuleTraining={handleStartModuleTraining}
            onOpenTextbookPassage={setTextbookModalNodeId}
          />
        ) : (
          <StudyWorkspaceView
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            selectedModule={workspaceModule}
            onChangeModule={setWorkspaceModule}
            weakFocusActive={weakFocusActive}
            onToggleWeakFocus={setWeakFocusActive}
            selectedNodeId={drawerNodeId ?? activeNodeId}
            focusRequest={workspaceFocusRequest}
            onConsumeFocusRequest={handleConsumeWorkspaceFocusRequest}
            onSelectGraphNode={(nodeId) => {
              setActiveNodeId(nodeId);
              setLastActiveNode(nodeId);
              setDrawerNodeId(nodeId);
            }}
            onNavigateCanonical={navigateToCanonicalNode}
            onJumpToConceptContext={handleJumpToConceptContext}
            onOpenTextbookPassage={setTextbookModalNodeId}
            modules={enrichedModules}
            allFlashcards={allFlashcards}
            allQuestions={allQuestions}
            nodes={curriculumGraph.nodes}
            edges={curriculumGraph.edges}
            nodeMap={curriculumGraph.nodeMap}
            adjacency={curriculumGraph.adjacency}
            masteryMap={nodeMasteryMap}
            prioritizedWeakQueue={prioritizedWeakQueue}
            bookmarks={userProgress.bookmarks}
            userNotes={userProgress.userNotes}
            interviewDrafts={userProgress.interviewDrafts}
            onToggleBookmark={toggleBookmark}
            onUpdateFlashcardStatus={updateFlashcardStatus}
            onSaveInterviewDraft={saveInterviewDraft}
            onCreateNewItem={createNewItem}
          />
        )}
      </main>

      {/* 우측 슬라이드오버 노드 상세 드로어 (실전훈련 > 지식그래프 전용) */}
      <NodeDetailDrawer
        selectedNodeId={isGraphViewActive ? drawerNodeId : null}
        onClose={() => setDrawerNodeId(null)}
        onSelectNode={(nextId) => {
          setActiveNodeId(nextId);
          setLastActiveNode(nextId);
          setDrawerNodeId(nextId);
        }}
        nodeMap={curriculumGraph.nodeMap}
        edges={curriculumGraph.edges}
        adjacency={curriculumGraph.adjacency}
        masteryMap={nodeMasteryMap}
        allTheories={allTheories}
        allFlashcards={allFlashcards}
        allCases={allCases}
        allQuestions={allQuestions}
        bookmarks={userProgress.bookmarks}
        userNotes={userProgress.userNotes}
        onToggleBookmark={toggleBookmark}
        onUpdateFlashcardStatus={updateFlashcardStatus}
        onUpdateItemNote={updateItemNote}
        onNavigateCanonical={navigateToCanonicalNode}
        onOpenTextbookPassage={setTextbookModalNodeId}
      />

      {/* 교재 원문 발췌 음영 집중 플로팅 리더 카드 */}
      <TextbookPassageModal
        nodeId={textbookModalNodeId}
        onClose={() => setTextbookModalNodeId(null)}
        nodeMap={curriculumGraph.nodeMap}
        adjacency={curriculumGraph.adjacency}
      />

      {/* 모바일 전용 1줄 하단 글래스 독 (< lg): [홈 · 개념학습 · 실전훈련 | AI 질문] */}
      <MobileBottomNav
        mode={mode}
        isAiTutorOpen={isAiTutorOpen}
        aiButtonRef={mobileAiTriggerRef}
        onMeasuredHeightChange={setMobileBottomNavHeightPx}
        onChangeMode={handleChangeMode}
        onToggleAiTutor={() => setIsAiTutorOpen((prev) => !prev)}
      />

      {/* 교재 우선 탐색 AI 말풍선 채팅창 */}
      <FloatingAiTutorChat
        isOpen={isAiTutorOpen}
        onToggleOpen={() => setIsAiTutorOpen((prev) => !prev)}
        onClose={() => setIsAiTutorOpen(false)}
        mobileTriggerRef={mobileAiTriggerRef}
        modules={enrichedModules}
        edges={curriculumGraph.edges}
        nodeMap={curriculumGraph.nodeMap}
        activeNodeId={(isGraphViewActive ? drawerNodeId : null) ?? activeNodeId}
        isServerConnected={isServerConnected}
        onInspectNode={(nodeId) => {
          if (
            typeof window !== 'undefined' &&
            window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
          ) {
            setIsAiTutorOpen(false);
          }
          navigateToCanonicalNode(nodeId);
        }}
      />

      {/* 글로벌 검색 모달 (⌘K, 1클릭 정본 직행) */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={curriculumGraph.nodes}
        masteryMap={nodeMasteryMap}
        onSelectNode={navigateToCanonicalNode}
      />
    </div>
  );
};

export default App;
