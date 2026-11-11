import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { CommandSearchModal } from './components/shell/CommandSearchModal';
import { DualModeTopBar } from './components/shell/DualModeTopBar';
import { FloatingAiTutorChat } from './components/shell/FloatingAiTutorChat';
import { MobileBottomNav } from './components/shell/MobileBottomNav';
import { NodeDetailDrawer } from './components/shell/NodeDetailDrawer';
import { ScrollytellingView } from './components/story/ScrollytellingView';
import { StudyWorkspaceView } from './components/workspace/StudyWorkspaceView';
import { useStudyGraphStore } from './store/useStudyGraphStore';
import {
  AppMode,
  ModuleId,
  StoryScrollRequest,
  WorkspaceTabId
} from './types/graph';

const VALID_TABS: WorkspaceTabId[] = [
  'graph',
  'theories',
  'flashcards',
  'cases',
  'interview',
  'cheatsheet'
];

const VALID_MODS: Array<ModuleId | 'all'> = [
  'all',
  'mod1',
  'mod2',
  'mod3',
  'mod4',
  'mod5'
];

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

function readInitialUrlState(fallbackMobileModule: ModuleId): {
  mode: AppMode;
  tab: WorkspaceTabId;
  mod: ModuleId | 'all';
  node: string | null;
  weakFocus: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      mode: 'story',
      tab: 'graph',
      mod: 'all',
      node: null,
      weakFocus: false
    };
  }
  const params = new URLSearchParams(window.location.search);
  const rawMode = params.get('mode');
  const rawTab = params.get('tab') as WorkspaceTabId | null;
  const rawMod = params.get('mod') as ModuleId | 'all' | null;
  const rawNode = params.get('node');
  const rawFocus = params.get('focus');
  const isMobileViewport = window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  const defaultMod: ModuleId | 'all' = isMobileViewport
    ? fallbackMobileModule
    : 'all';

  return {
    mode: rawMode === 'workspace' ? 'workspace' : 'story',
    tab: rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'graph',
    mod: rawMod && VALID_MODS.includes(rawMod) ? rawMod : defaultMod,
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
    isServerConnected,
    markBeatVisited,
    recordSimulationChoice,
    toggleModuleCompleted,
    setLastActiveNode,
    setPreferredEntryMode,
    updateItemNote,
    updateTheoryContent,
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

  const weakOrReviewCount = useMemo(() => {
    let count = 0;
    for (const status of Object.values(nodeMasteryMap)) {
      if (status === 'weak' || status === 'review') {
        count += 1;
      }
    }
    return count;
  }, [nodeMasteryMap]);

  const [mode, setMode] = useState<AppMode>(initialUrl.mode);
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>(initialUrl.tab);
  const [selectedModule, setSelectedModule] = useState<ModuleId | 'all'>(
    initialUrl.mod
  );
  const [activeNodeId, setActiveNodeId] = useState<string | null>(
    initialUrl.node ?? userProgress.story.lastActiveNodeId
  );
  const [storyScrollRequest, setStoryScrollRequest] =
    useState<StoryScrollRequest | null>(() =>
      initialUrl.node ? { nodeId: initialUrl.node, requestId: 1 } : null
    );
  const [drawerNodeId, setDrawerNodeId] = useState<string | null>(null);
  const [weakFocusActive, setWeakFocusActive] = useState<boolean>(
    initialUrl.weakFocus
  );
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState<boolean>(false);
  const [mobileBottomNavHeightPx, setMobileBottomNavHeightPx] = useState<
    number | null
  >(null);
  const mobileAiTriggerRef = useRef<HTMLButtonElement>(null);

  const handleConsumeScrollRequest = useCallback(() => {
    setStoryScrollRequest(null);
  }, []);

  // URL Search Params 실시간 양방향 동기화 (?mode=story|workspace&tab=...&mod=...&node=...&focus=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (mode === 'workspace') {
      params.set('tab', activeTab);
    }
    if (selectedModule !== 'all') {
      params.set('mod', selectedModule);
    }
    const currentNode = drawerNodeId ?? activeNodeId;
    if (currentNode) {
      params.set('node', currentNode);
    }
    if (weakFocusActive) {
      params.set('focus', 'weak');
    }
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', nextUrl);
  }, [
    mode,
    activeTab,
    selectedModule,
    activeNodeId,
    drawerNodeId,
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
      setMode(nextMode);
      setPreferredEntryMode(nextMode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setPreferredEntryMode]
  );

  // [스토리 맥락에서 다시 보기] 딥링크 점프 (단발성 스크롤 요청 생성, 모바일은 해당 단일 모듈로 페이징)
  const handleJumpToStoryNode = useCallback(
    (moduleId: ModuleId, nodeId: string) => {
      const isMobileViewport =
        typeof window !== 'undefined' &&
        window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
      setSelectedModule(isMobileViewport ? moduleId : 'all');
      setActiveNodeId(nodeId);
      setStoryScrollRequest({ nodeId, requestId: Date.now() });
      setLastActiveNode(nodeId);
      setMode('story');
    },
    [setLastActiveNode]
  );

  // [워크스페이스로 이동] 딥링크 점프
  const handleJumpToWorkspaceNode = useCallback(
    (tab: WorkspaceTabId, moduleId: ModuleId, nodeId: string) => {
      setSelectedModule(tab === 'graph' ? 'all' : moduleId);
      setActiveTab(tab);
      setActiveNodeId(nodeId);
      setLastActiveNode(nodeId);
      setMode('workspace');
      if (tab === 'graph') {
        setDrawerNodeId(nodeId);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setLastActiveNode]
  );

  // 상단 바 [헷갈리는 노드 N개] 배지 클릭 -> 지식 그래프 Weak Subgraph 즉시 하이라이트
  const handleJumpToWeakGraph = useCallback(() => {
    setMode('workspace');
    setActiveTab('graph');
    setSelectedModule('all');
    setWeakFocusActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      {/* 상단 고정 글로벌 듀얼 모드 바 */}
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

      {/* 메인 컨텐츠: Stage 1 스토리텔링 vs Stage 2 스터디 워크스페이스 */}
      <main className="flex-1 pb-36 lg:pb-16">
        {mode === 'story' ? (
          <ScrollytellingView
            modules={enrichedModules}
            selectedModuleFilter={selectedModule}
            onChangeModuleFilter={setSelectedModule}
            initialNodeId={activeNodeId}
            scrollRequest={storyScrollRequest}
            onConsumeScrollRequest={handleConsumeScrollRequest}
            onActiveNodeChange={setActiveNodeId}
            storyProgress={userProgress.story}
            bookmarks={userProgress.bookmarks}
            userNotes={userProgress.userNotes}
            nodeMap={curriculumGraph.nodeMap}
            edges={curriculumGraph.edges}
            masteryMap={nodeMasteryMap}
            onMarkBeatVisited={markBeatVisited}
            onRecordSimulationChoice={recordSimulationChoice}
            onUpdateFlashcardStatus={updateFlashcardStatus}
            onToggleBookmark={toggleBookmark}
            onUpdateItemNote={updateItemNote}
            onToggleModuleCompleted={toggleModuleCompleted}
            onInspectNode={(nodeId) => {
              setLastActiveNode(nodeId);
              setDrawerNodeId(nodeId);
            }}
            onJumpToWorkspace={handleJumpToWorkspaceNode}
          />
        ) : (
          <StudyWorkspaceView
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            selectedModule={selectedModule}
            onChangeModule={setSelectedModule}
            weakFocusActive={weakFocusActive}
            onToggleWeakFocus={setWeakFocusActive}
            selectedNodeId={drawerNodeId ?? activeNodeId}
            onSelectNode={(nodeId) => {
              setActiveNodeId(nodeId);
              setLastActiveNode(nodeId);
              setDrawerNodeId(nodeId);
            }}
            modules={enrichedModules}
            allTheories={allTheories}
            allFlashcards={allFlashcards}
            allCases={allCases}
            allQuestions={allQuestions}
            nodes={curriculumGraph.nodes}
            edges={curriculumGraph.edges}
            nodeMap={curriculumGraph.nodeMap}
            masteryMap={nodeMasteryMap}
            bookmarks={userProgress.bookmarks}
            userNotes={userProgress.userNotes}
            interviewDrafts={userProgress.interviewDrafts}
            onToggleBookmark={toggleBookmark}
            onUpdateItemNote={updateItemNote}
            onUpdateTheoryContent={updateTheoryContent}
            onUpdateFlashcardStatus={updateFlashcardStatus}
            onSaveInterviewDraft={saveInterviewDraft}
            onCreateNewItem={createNewItem}
            onJumpToStory={handleJumpToStoryNode}
          />
        )}
      </main>

      {/* 우측 슬라이드오버 노드 상세 드로어 (스토리 & 워크스페이스 공통) */}
      <NodeDetailDrawer
        selectedNodeId={drawerNodeId}
        onClose={() => setDrawerNodeId(null)}
        onSelectNode={(nextId) => {
          setLastActiveNode(nextId);
          setDrawerNodeId(nextId);
        }}
        nodeMap={curriculumGraph.nodeMap}
        edges={curriculumGraph.edges}
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
        onJumpToStory={handleJumpToStoryNode}
        onJumpToWorkspaceTab={handleJumpToWorkspaceNode}
      />

      {/* 모바일 전용 하단 엄지 네비게이션 독 (< lg) */}
      <MobileBottomNav
        mode={mode}
        activeTab={activeTab}
        selectedModule={selectedModule}
        completedModules={userProgress.story.completedModules}
        modules={enrichedModules}
        weakOrReviewCount={weakOrReviewCount}
        isAiTutorOpen={isAiTutorOpen}
        aiButtonRef={mobileAiTriggerRef}
        onMeasuredHeightChange={setMobileBottomNavHeightPx}
        onChangeMode={handleChangeMode}
        onChangeTab={(nextTab) => {
          setIsAiTutorOpen(false);
          setActiveTab(nextTab);
        }}
        onChangeModule={(nextMod) => {
          setIsAiTutorOpen(false);
          setSelectedModule(nextMod);
        }}
        onOpenSearch={() => {
          setIsAiTutorOpen(false);
          setIsSearchOpen(true);
        }}
        onToggleAiTutor={() => setIsAiTutorOpen((prev) => !prev)}
      />

      {/* 교재 우선 탐색 AI 말풍선 채팅창 ([AI 질문] 버튼 원점 탄성 스프링 등장·수축) */}
      <FloatingAiTutorChat
        isOpen={isAiTutorOpen}
        onToggleOpen={() => setIsAiTutorOpen((prev) => !prev)}
        onClose={() => setIsAiTutorOpen(false)}
        mobileTriggerRef={mobileAiTriggerRef}
        modules={enrichedModules}
        edges={curriculumGraph.edges}
        nodeMap={curriculumGraph.nodeMap}
        activeNodeId={drawerNodeId ?? activeNodeId}
        isServerConnected={isServerConnected}
        onInspectNode={(nodeId) => {
          setLastActiveNode(nodeId);
          setDrawerNodeId(nodeId);
        }}
      />

      {/* 글로벌 검색 모달 (⌘K, 0ms instant dialog) */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={curriculumGraph.nodes}
        masteryMap={nodeMasteryMap}
        onJumpToStoryNode={handleJumpToStoryNode}
        onJumpToWorkspaceNode={handleJumpToWorkspaceNode}
      />
    </div>
  );
};

export default App;
