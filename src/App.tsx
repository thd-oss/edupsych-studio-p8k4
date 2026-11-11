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
      mode: 'home',
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

  const resolvedMode: AppMode =
    rawMode === 'workspace'
      ? 'workspace'
      : rawMode === 'story'
      ? 'story'
      : 'home';

  return {
    mode: resolvedMode,
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

  const weakOrReviewCount = prioritizedWeakQueue.length;

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
      initialUrl.node && initialUrl.mode === 'story'
        ? { nodeId: initialUrl.node, requestId: 1 }
        : null
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

  // URL Search Params 실시간 양방향 동기화 (?mode=home|story|workspace&tab=...&mod=...&node=...&focus=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (mode === 'workspace') {
      params.set('tab', activeTab);
    }
    if (mode !== 'home' && selectedModule !== 'all') {
      params.set('mod', selectedModule);
    }
    const currentNode = drawerNodeId ?? (mode !== 'home' ? activeNodeId : null);
    if (currentNode) {
      params.set('node', currentNode);
    }
    if (mode === 'workspace' && weakFocusActive) {
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

  // [스토리 맥락에서 다시 보기] 딥링크 점프
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
      setPreferredEntryMode('story');
    },
    [setLastActiveNode, setPreferredEntryMode]
  );

  // [워크스페이스로 이동] 딥링크 점프 (전체 'all' 또는 단일 ModuleId 지원)
  const handleJumpToWorkspaceNode = useCallback(
    (tab: WorkspaceTabId, moduleId: ModuleId | 'all', nodeId: string) => {
      setSelectedModule(tab === 'graph' ? 'all' : moduleId);
      setActiveTab(tab);
      setActiveNodeId(nodeId);
      setLastActiveNode(nodeId);
      setWeakFocusActive(false);
      setMode('workspace');
      setPreferredEntryMode('workspace');
      if (tab === 'graph' && moduleId !== 'all') {
        setDrawerNodeId(nodeId);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setLastActiveNode, setPreferredEntryMode]
  );

  // 상단 바 [복습 N] 배지 또는 홈 벤토 타일 클릭 -> 지식 그래프 취약 서브그래프 즉시 하이라이트
  const handleJumpToWeakGraph = useCallback(() => {
    setMode('workspace');
    setPreferredEntryMode('workspace');
    setActiveTab('graph');
    setSelectedModule('all');
    setWeakFocusActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setPreferredEntryMode]);

  // 홈 벤토 타일에 노출할 대표 압박 면접 문항 선정 (미숙련 문항 우선)
  const featuredQuestionMeta = useMemo(() => {
    const targetQ =
      allQuestions.find((q) => nodeMasteryMap[q.id] === 'weak') ??
      allQuestions.find((q) => nodeMasteryMap[q.id] !== 'mastered') ??
      allQuestions[0] ??
      null;
    const ownerModId: ModuleId =
      (targetQ && curriculumGraph.nodeMap[targetQ.id]?.moduleId) || 'mod1';
    return { question: targetQ, moduleId: ownerModId };
  }, [allQuestions, nodeMasteryMap, curriculumGraph.nodeMap]);

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
      {/* 상단 고정 48px 애플 프로스티드 글래스 리본 */}
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

      {/* 메인 컨텐츠: 홈 쇼케이스 허브 · 풀와이드 스토리 커리큘럼 · 스터디 워크스페이스 */}
      <main className="flex-1 pb-32 lg:pb-16">
        {mode === 'home' ? (
          <AppleHomeShowcaseView
            moduleSummaries={moduleSummaries}
            resumeTarget={resumeTarget}
            prioritizedWeakQueue={prioritizedWeakQueue}
            masteryMap={nodeMasteryMap}
            totalNodesCount={curriculumGraph.nodes.length}
            completedModulesCount={userProgress.story.completedModules.length}
            featuredQuestion={featuredQuestionMeta.question}
            featuredQuestionModuleId={featuredQuestionMeta.moduleId}
            onResumeStudy={handleJumpToStoryNode}
            onJumpToModuleStory={(modId, leadNodeId) => {
              setSelectedModule(modId);
              setActiveNodeId(leadNodeId);
              setStoryScrollRequest({ nodeId: modId, requestId: Date.now() });
              setLastActiveNode(leadNodeId);
              setMode('story');
              setPreferredEntryMode('story');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onJumpToWorkspace={handleJumpToWorkspaceNode}
            onJumpToWeakGraph={handleJumpToWeakGraph}
            onInspectNode={(nodeId) => {
              setLastActiveNode(nodeId);
              setDrawerNodeId(nodeId);
            }}
            onOpenAiTutor={() => setIsAiTutorOpen(true)}
          />
        ) : mode === 'story' ? (
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
            adjacency={curriculumGraph.adjacency}
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
            onJumpToStoryNode={handleJumpToStoryNode}
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
            adjacency={curriculumGraph.adjacency}
            masteryMap={nodeMasteryMap}
            prioritizedWeakQueue={prioritizedWeakQueue}
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

      {/* 우측 슬라이드오버 노드 상세 드로어 (홈 · 스토리 · 워크스페이스 공통) */}
      <NodeDetailDrawer
        selectedNodeId={drawerNodeId}
        onClose={() => setDrawerNodeId(null)}
        onSelectNode={(nextId) => {
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
        onJumpToStory={handleJumpToStoryNode}
        onJumpToWorkspaceTab={handleJumpToWorkspaceNode}
      />

      {/* 모바일 전용 하단 애플 글래스 독 (< lg) */}
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

      {/* 글로벌 스포트라이트 검색 모달 (⌘K, 0ms instant dialog) */}
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
