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
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
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
  masteryMap: Record<string, MasteryState>;
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
    labelKo: '① 지식 그래프 맵',
    countBadge: '90 Nodes',
    icon: <Network className="w-4 h-4 shrink-0" />
  },
  {
    id: 'theories',
    labelKo: '② 핵심 이론 비교',
    countBadge: '20',
    icon: <BookOpen className="w-4 h-4 shrink-0" />
  },
  {
    id: 'flashcards',
    labelKo: '③ 한-영 플래시카드',
    countBadge: '47',
    icon: <Layers className="w-4 h-4 shrink-0" />
  },
  {
    id: 'cases',
    labelKo: '④ 교실 사례 3중 렌즈',
    countBadge: '10',
    icon: <Brain className="w-4 h-4 shrink-0" />
  },
  {
    id: 'interview',
    labelKo: '⑤ 압박 면접 디펜스',
    countBadge: '13',
    icon: <MessageSquareWarning className="w-4 h-4 shrink-0" />
  },
  {
    id: 'cheatsheet',
    labelKo: '⑥ A4 요약 시트 인쇄',
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
  masteryMap,
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
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-5 space-y-5">
      {/* 워크스페이스 상단 6대 탭 & 모듈 필터 바 (인쇄 시 숨김) */}
      <section className="no-print print:hidden surface-card p-3 sm:p-4 space-y-3">
        {/* 6대 워크스페이스 탭 (0ms 즉시 교체) */}
        <div
          role="tablist"
          aria-label="스터디 워크스페이스 도구 탭"
          className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2"
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
                className={`no-press-scale min-h-[42px] rounded-xl px-3.5 py-2 text-xs font-extrabold border flex items-center justify-between gap-2 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-900/[0.08] hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5 min-w-0 truncate">
                  {tab.icon}
                  <span className="truncate">{tab.labelKo}</span>
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold tabular-nums shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {tab.countBadge}
                </span>
              </button>
            );
          })}
        </div>

        {/* 모듈 공통 필터 바 & 스토리 모드 복귀 브릿지 */}
        <div className="pt-2.5 border-t border-slate-900/[0.06] flex flex-wrap items-center justify-between gap-2 tabular-nums">
          <div className="chip-scroll-row flex items-center gap-1.5 min-w-0 max-w-full">
            <span className="text-xs font-extrabold text-slate-500 mr-1 shrink-0">
              모듈 범위:
            </span>
            <button
              type="button"
              onClick={() => onChangeModule('all')}
              className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-extrabold border shrink-0 transition-colors ${
                selectedModule === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-900/[0.08] hover:bg-slate-50'
              }`}
            >
              전 모듈 통합 (Mod 1~5)
            </button>

            {modules.map((m) => {
              const anchor = MODULE_CONCEPT_ANCHORS[m.id];
              const isSelected = selectedModule === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeModule(m.id)}
                  className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-extrabold border flex items-center gap-1.5 shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-900/[0.08] hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: anchor.accentHex }}
                  />
                  <span>
                    Mod {m.number}. {m.title.split(' ')[0]}
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
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 text-xs font-extrabold text-indigo-900 shrink-0 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>스토리 가이드 모드로 이동</span>
          </button>
        </div>
      </section>

      {/* 활성 탭 컨텐츠 (0ms 즉시 교체) */}
      {activeTab === 'graph' && (
        <KnowledgeGraphMap
          nodes={nodes}
          edges={edges}
          nodeMap={nodeMap}
          masteryMap={masteryMap}
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
