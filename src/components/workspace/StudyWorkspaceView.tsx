import React from 'react';
import {
  BookOpen,
  Brain,
  Compass,
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
  WorkspaceTabId
} from '../../types/graph';
import {
  ClassroomCase,
  Flashcard,
  FlashcardStatus,
  InterviewDraftRecord,
  InterviewQuestion,
  ModulePayload,
  StudyItemType,
  StudyItemUnion,
  TheoryConcept
} from '../../types/study';
import { CaseSimulatorTab } from './CaseSimulatorTab';
import { CheatSheetPrintTab } from './CheatSheetPrintTab';
import { FlashcardSrsTab } from './FlashcardSrsTab';
import { InterviewDefenseTab } from './InterviewDefenseTab';
import { KnowledgeGraphMap } from './KnowledgeGraphMap';
import { TheoryArchiveTab } from './TheoryArchiveTab';

interface StudyWorkspaceViewProps {
  activeTab: WorkspaceTabId;
  onChangeTab: (tab: WorkspaceTabId) => void;
  selectedModule: ModuleId | 'all';
  onChangeModule: (mod: ModuleId | 'all') => void;
  weakFocusActive: boolean;
  onToggleWeakFocus: (next: boolean) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  modules: ModulePayload[];
  allTheories: TheoryConcept[];
  allFlashcards: Flashcard[];
  allCases: ClassroomCase[];
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
  onUpdateItemNote: (itemId: string, note: string) => void;
  onUpdateTheoryContent: (
    theoryId: string,
    updatedFields: Partial<TheoryConcept>
  ) => Promise<void>;
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
  onJumpToStory: (moduleId: ModuleId, nodeId: string) => void;
}

const WORKSPACE_TABS: Array<{
  id: WorkspaceTabId;
  labelKo: string;
  countBadge: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'graph',
    labelKo: '지식 그래프 맵',
    countBadge: '90',
    icon: <Network className="w-4 h-4 shrink-0" />
  },
  {
    id: 'theories',
    labelKo: '핵심 이론 비교',
    countBadge: '20',
    icon: <BookOpen className="w-4 h-4 shrink-0" />
  },
  {
    id: 'flashcards',
    labelKo: '한-영 플래시카드',
    countBadge: '47',
    icon: <Layers className="w-4 h-4 shrink-0" />
  },
  {
    id: 'cases',
    labelKo: '교실 사례 3중 렌즈',
    countBadge: '10',
    icon: <Brain className="w-4 h-4 shrink-0" />
  },
  {
    id: 'interview',
    labelKo: '압박 면접 디펜스',
    countBadge: '13',
    icon: <MessageSquareWarning className="w-4 h-4 shrink-0" />
  },
  {
    id: 'cheatsheet',
    labelKo: 'A4 요약 시트 인쇄',
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
  onSelectNode,
  modules,
  allTheories,
  allFlashcards,
  allCases,
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
  onUpdateItemNote,
  onUpdateTheoryContent,
  onUpdateFlashcardStatus,
  onSaveInterviewDraft,
  onCreateNewItem,
  onJumpToStory
}) => {
  return (
    <div className="max-w-[1440px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* 워크스페이스 상단 탭 & 모듈 필터 바 (비고정 인라인 카드) */}
      <section className="no-print print:hidden bento-tile-white p-4 sm:p-5 space-y-3.5">
        {/* 데스크톱(lg+) 6대 워크스페이스 탭 */}
        <div
          role="tablist"
          aria-label="스터디 워크스페이스 도구 탭"
          className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-6 gap-2"
        >
          {WORKSPACE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onChangeTab(tab.id)}
                className={`no-press-scale min-h-[42px] rounded-[14px] px-3.5 py-2 text-xs font-semibold flex items-center justify-between gap-2 transition-colors ${
                  isActive
                    ? 'bg-[#1d1d1f] text-white shadow-xs'
                    : 'bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.07] hover:text-[#1d1d1f]'
                }`}
              >
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  {tab.icon}
                  <span className="truncate">{tab.labelKo}</span>
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

        {/* 모듈 공통 필터 바 & 스토리 모드 복귀 브릿지 */}
        <div className="lg:pt-3 lg:border-t lg:border-black/[0.06] flex flex-wrap items-center justify-between gap-2 tabular-nums">
          <div className="mobile-strip-scroll sm:flex-wrap flex items-center gap-1.5 min-w-0 max-w-full">
            <span className="text-xs font-semibold text-[#6e6e73] mr-0.5 shrink-0">
              모듈:
            </span>
            <button
              type="button"
              onClick={() => onChangeModule('all')}
              className={`min-h-[34px] rounded-full px-3.5 py-1 text-xs font-semibold shrink-0 transition-colors ${
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
                  className={`min-h-[34px] rounded-full px-3.5 py-1 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors ${
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

          <button
            type="button"
            onClick={() =>
              onJumpToStory(
                selectedModule === 'all' ? 'mod1' : selectedModule,
                selectedNodeId ?? 'mod1-theory-piaget'
              )
            }
            className="hidden lg:inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[var(--accent-subtle)] hover:bg-[#0071e3]/15 px-3.5 py-1 text-xs font-semibold text-[var(--accent-solid)] shrink-0 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>스토리 커리큘럼에서 보기</span>
          </button>
        </div>
      </section>

      {/* 활성 탭 컨텐츠 */}
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
          onSelectNode={onSelectNode}
          onJumpToStory={onJumpToStory}
          onJumpToWorkspaceTab={(tab, modId, nodeId) => {
            onChangeModule(modId);
            onChangeTab(tab);
            onSelectNode(nodeId);
          }}
        />
      )}

      {activeTab === 'theories' && (
        <TheoryArchiveTab
          theories={allTheories}
          selectedModule={selectedModule}
          bookmarks={bookmarks}
          nodeMap={nodeMap}
          masteryMap={masteryMap}
          onToggleBookmark={onToggleBookmark}
          onUpdateNote={onUpdateItemNote}
          onUpdateTheoryContent={onUpdateTheoryContent}
          onCreateTheory={(modId, item) =>
            onCreateNewItem('theory', modId, item)
          }
          onInspectNode={onSelectNode}
          onJumpToStory={onJumpToStory}
        />
      )}

      {activeTab === 'flashcards' && (
        <FlashcardSrsTab
          flashcards={allFlashcards}
          selectedModule={selectedModule}
          bookmarks={bookmarks}
          onUpdateStatus={onUpdateFlashcardStatus}
          onToggleBookmark={onToggleBookmark}
          onCreateFlashcard={(modId, item) =>
            onCreateNewItem('flashcard', modId, item)
          }
          onInspectNode={onSelectNode}
          onJumpToStory={onJumpToStory}
        />
      )}

      {activeTab === 'cases' && (
        <CaseSimulatorTab
          cases={allCases}
          selectedModule={selectedModule}
          bookmarks={bookmarks}
          userNotes={userNotes}
          onToggleBookmark={onToggleBookmark}
          onUpdateCaseNote={onUpdateItemNote}
          onCreateCase={(modId, item) => onCreateNewItem('case', modId, item)}
          onInspectNode={onSelectNode}
          onJumpToStory={onJumpToStory}
        />
      )}

      {activeTab === 'interview' && (
        <InterviewDefenseTab
          questions={allQuestions}
          selectedModule={selectedModule}
          bookmarks={bookmarks}
          interviewDrafts={interviewDrafts}
          onToggleBookmark={onToggleBookmark}
          onSaveDraft={onSaveInterviewDraft}
          onCreateQuestion={(modId, item) =>
            onCreateNewItem('question', modId, item)
          }
          onInspectNode={onSelectNode}
          onJumpToStory={onJumpToStory}
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
  );
};
