import React, { useEffect, useId, useRef } from 'react';
import {
  Layers,
  MessageSquareWarning,
  Network,
  Printer
} from 'lucide-react';
import { MODULE_CONCEPT_ANCHORS } from '../../data/curriculumGraph';
import {
  GraphAdjacencyIndex,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  PrioritizedWeakNodeItem,
  StoryScrollRequest,
  WorkspaceTabId
} from '../../types/graph';
import {
  Flashcard,
  FlashcardStatus,
  InterviewDraftRecord,
  InterviewQuestion,
  ModulePayload,
  StudyItemType,
  StudyItemUnion
} from '../../types/study';
import { CheatSheetPrintTab } from './CheatSheetPrintTab';
import { FlashcardSrsTab } from './FlashcardSrsTab';
import { InterviewDefenseTab } from './InterviewDefenseTab';
import { KnowledgeGraphMap } from './KnowledgeGraphMap';

interface StudyWorkspaceViewProps {
  activeTab: WorkspaceTabId;
  onChangeTab: (tab: WorkspaceTabId) => void;
  selectedModule: ModuleId | 'all';
  onChangeModule: (mod: ModuleId | 'all') => void;
  weakFocusActive: boolean;
  onToggleWeakFocus: (next: boolean) => void;
  selectedNodeId: string | null;
  focusRequest: StoryScrollRequest | null;
  onConsumeFocusRequest: () => void;
  onSelectGraphNode: (nodeId: string) => void;
  onNavigateCanonical: (nodeId: string) => void;
  onJumpToConceptContext: (nodeId: string) => void;
  onOpenTextbookPassage: (nodeId: string) => void;
  modules: ModulePayload[];
  allFlashcards: Flashcard[];
  allQuestions: InterviewQuestion[];
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  nodeMap: Record<string, KnowledgeGraphNode>;
  adjacency: GraphAdjacencyIndex;
  masteryMap: Record<string, MasteryState>;
  prioritizedWeakQueue: PrioritizedWeakNodeItem[];
  bookmarks: string[];
  userNotes: Record<string, string>;
  interviewDrafts: Record<string, InterviewDraftRecord>;
  onToggleBookmark: (itemId: string) => void;
  onUpdateFlashcardStatus: (cardId: string, status: FlashcardStatus) => void;
  onSaveInterviewDraft: (
    questionId: string,
    mainAnswer: string,
    followUpAnswer: string,
    requiredKeywords: string[]
  ) => InterviewDraftRecord;
  onCreateNewItem: (
    type: StudyItemType,
    moduleId: ModuleId,
    item: StudyItemUnion
  ) => Promise<void>;
}

const WORKSPACE_TABS: Array<{
  id: WorkspaceTabId;
  labelKo: string;
  countBadge: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'flashcards',
    labelKo: '단어장',
    countBadge: '47',
    icon: <Layers className="w-4 h-4 shrink-0" />
  },
  {
    id: 'interview',
    labelKo: '90초 면접',
    countBadge: '13',
    icon: <MessageSquareWarning className="w-4 h-4 shrink-0" />
  },
  {
    id: 'graph',
    labelKo: '지식그래프',
    countBadge: '90',
    icon: <Network className="w-4 h-4 shrink-0" />
  },
  {
    id: 'cheatsheet',
    labelKo: '요약 인쇄',
    countBadge: 'PDF',
    icon: <Printer className="w-4 h-4 shrink-0" />
  }
];

export const StudyWorkspaceView: React.FC<StudyWorkspaceViewProps> = ({
  activeTab,
  onChangeTab,
  selectedModule,
  onChangeModule,
  weakFocusActive,
  onToggleWeakFocus,
  selectedNodeId,
  focusRequest,
  onConsumeFocusRequest,
  onSelectGraphNode,
  onNavigateCanonical,
  onJumpToConceptContext,
  onOpenTextbookPassage,
  modules,
  allFlashcards,
  allQuestions,
  nodes,
  edges,
  nodeMap,
  adjacency,
  masteryMap,
  prioritizedWeakQueue,
  bookmarks,
  userNotes,
  interviewDrafts,
  onToggleBookmark,
  onUpdateFlashcardStatus,
  onSaveInterviewDraft,
  onCreateNewItem
}) => {
  const tablistId = useId();
  const tabButtonRefs = useRef<Record<WorkspaceTabId, HTMLButtonElement | null>>(
    {
      flashcards: null,
      interview: null,
      graph: null,
      cheatsheet: null
    }
  );

  // 선택된 탭이 가로 스크롤 컨테이너 가장자리에 가려지지 않도록 자동 스크롤
  useEffect(() => {
    const activeBtn = tabButtonRefs.current[activeTab];
    activeBtn?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth'
    });
  }, [activeTab]);

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const count = WORKSPACE_TABS.length;
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % count;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + count) % count;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = count - 1;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      const targetTab = WORKSPACE_TABS[nextIndex].id;
      onChangeTab(targetTab);
      tabButtonRefs.current[targetTab]?.focus();
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* 실전훈련 4대 도구 1줄 탭 & 모듈 필터 카드 (모바일·데스크톱 공통 노출) */}
      <section className="no-print print:hidden bento-tile-white p-3.5 sm:p-5 space-y-3">
        <div
          role="tablist"
          aria-label="실전훈련 도구"
          className="single-row-tablist gap-2 pb-1"
        >
          {WORKSPACE_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabButtonRefs.current[tab.id] = el;
                }}
                id={`${tablistId}-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onChangeTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`no-press-scale sm:flex-1 min-h-[42px] shrink-0 rounded-[14px] px-3.5 py-2 text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                  isActive
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.07] hover:text-[#1d1d1f]'
                }`}
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  {tab.icon}
                  <span>{tab.labelKo}</span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums shrink-0 ${
                    isActive
                      ? 'bg-[var(--accent-solid)] text-white'
                      : 'bg-white text-[#6e6e73]'
                  }`}
                >
                  {tab.countBadge}
                </span>
              </button>
            );
          })}
        </div>

        {/* 모듈 범위 필터 바 (1줄 가로 스크롤) */}
        <div className="pt-2.5 border-t border-black/[0.06] flex items-center gap-2 tabular-nums">
          <div className="mobile-strip-scroll sm:flex-wrap flex items-center gap-1.5 min-w-0 max-w-full">
            <span className="text-xs font-semibold text-[#6e6e73] mr-0.5 shrink-0">
              범위:
            </span>
            <button
              type="button"
              onClick={() => onChangeModule('all')}
              className={`min-h-[32px] rounded-full px-3 py-1 text-xs font-semibold shrink-0 transition-colors ${
                selectedModule === 'all'
                  ? 'bg-[var(--accent-solid)] text-white'
                  : 'bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.07]'
              }`}
            >
              전체(M1~5)
            </button>

            {modules.map((m) => {
              const anchor = MODULE_CONCEPT_ANCHORS[m.id];
              const isSelected = selectedModule === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeModule(m.id)}
                  className={`min-h-[32px] rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#1d1d1f] text-white'
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
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 활성 탭 패널 */}
      <div
        role="tabpanel"
        aria-labelledby={`${tablistId}-tab-${activeTab}`}
      >
        {activeTab === 'flashcards' && (
          <FlashcardSrsTab
            flashcards={allFlashcards}
            selectedModule={selectedModule}
            bookmarks={bookmarks}
            focusRequest={focusRequest}
            onConsumeFocusRequest={onConsumeFocusRequest}
            onUpdateStatus={onUpdateFlashcardStatus}
            onToggleBookmark={onToggleBookmark}
            onCreateFlashcard={(modId, item) =>
              onCreateNewItem('flashcard', modId, item)
            }
            onJumpToConceptContext={onJumpToConceptContext}
            onOpenTextbookPassage={onOpenTextbookPassage}
          />
        )}

        {activeTab === 'interview' && (
          <InterviewDefenseTab
            questions={allQuestions}
            selectedModule={selectedModule}
            bookmarks={bookmarks}
            interviewDrafts={interviewDrafts}
            focusRequest={focusRequest}
            onConsumeFocusRequest={onConsumeFocusRequest}
            onToggleBookmark={onToggleBookmark}
            onSaveDraft={onSaveInterviewDraft}
            onCreateQuestion={(modId, item) =>
              onCreateNewItem('question', modId, item)
            }
            onJumpToConceptContext={onJumpToConceptContext}
            onOpenTextbookPassage={onOpenTextbookPassage}
          />
        )}

        {activeTab === 'graph' && (
          <KnowledgeGraphMap
            nodes={nodes}
            edges={edges}
            nodeMap={nodeMap}
            adjacency={adjacency}
            masteryMap={masteryMap}
            prioritizedWeakQueue={prioritizedWeakQueue}
            selectedModule={selectedModule}
            onChangeModule={onChangeModule}
            weakFocusActive={weakFocusActive}
            onToggleWeakFocus={onToggleWeakFocus}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectGraphNode}
            onNavigateCanonical={onNavigateCanonical}
          />
        )}

        {activeTab === 'cheatsheet' && (
          <CheatSheetPrintTab
            modules={modules}
            selectedModule={selectedModule}
            bookmarks={bookmarks}
            userNotes={userNotes}
            interviewDrafts={interviewDrafts}
          />
        )}
      </div>
    </div>
  );
};
