import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Compass,
  ExternalLink,
  HelpCircle,
  Layers,
  Network,
  Save,
  X,
  XCircle
} from 'lucide-react';
import { getNodeNeighbors } from '../../data/curriculumGraph';
import {
  EdgeRelation,
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
  InterviewQuestion,
  TheoryConcept
} from '../../types/study';

interface NodeDetailDrawerProps {
  selectedNodeId: string | null;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  nodeMap: Record<string, KnowledgeGraphNode>;
  edges: KnowledgeGraphEdge[];
  masteryMap: Record<string, MasteryState>;
  allTheories: TheoryConcept[];
  allFlashcards: Flashcard[];
  allCases: ClassroomCase[];
  allQuestions: InterviewQuestion[];
  bookmarks: string[];
  userNotes: Record<string, string>;
  onToggleBookmark: (itemId: string) => void;
  onUpdateFlashcardStatus: (cardId: string, status: FlashcardStatus) => void;
  onUpdateItemNote: (itemId: string, note: string) => void;
  onJumpToStory: (moduleId: ModuleId, nodeId: string) => void;
  onJumpToWorkspaceTab: (
    tab: WorkspaceTabId,
    moduleId: ModuleId,
    nodeId: string
  ) => void;
}

const RELATION_LABEL: Record<
  EdgeRelation,
  { label: string; badgeClass: string }
> = {
  BELONGS_TO_MODULE: {
    label: '소속 모듈',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  DEFINES_TERM: {
    label: '핵심 용어 정의',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  APPLIED_IN_CASE: {
    label: '사례 처방 적용',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200'
  },
  DEFENDS_QUESTION: {
    label: '압박면접 방어',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  CROSS_MODULE_BRIDGE: {
    label: '모듈 간 전이 연결',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200'
  }
};

const MASTERY_STYLE: Record<
  MasteryState,
  { label: string; badgeClass: string }
> = {
  mastered: {
    label: '숙련 완료',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  review: {
    label: '복습 필요',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  weak: {
    label: '취약 노드',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  unseen: {
    label: '미학습',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
  }
};

const KIND_KOR_LABEL: Record<KnowledgeGraphNode['kind'], string> = {
  module: '모듈',
  theory: '핵심 이론',
  flashcard: '학술 용어',
  case: '교실 사례',
  question: '압박 면접'
};

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  selectedNodeId,
  onClose,
  onSelectNode,
  nodeMap,
  edges,
  masteryMap,
  allTheories,
  allFlashcards,
  allCases,
  allQuestions,
  bookmarks,
  userNotes,
  onToggleBookmark,
  onUpdateFlashcardStatus,
  onUpdateItemNote,
  onJumpToStory,
  onJumpToWorkspaceTab
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();

  const node = selectedNodeId ? nodeMap[selectedNodeId] : null;
  const [noteInput, setNoteInput] = useState('');
  const [noteSavedToast, setNoteSavedToast] = useState(false);

  // 네이티브 <dialog> Top-Layer 모달 동기화 (포커스 트랩·배경 inert·Esc 닫기 자동 제공)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (node && !dialog.open) {
      dialog.showModal();
    } else if (!node && dialog.open) {
      dialog.close();
    }
  }, [node]);

  useEffect(() => {
    if (selectedNodeId) {
      setNoteInput(userNotes[selectedNodeId] ?? '');
    }
  }, [selectedNodeId, userNotes]);

  const neighbors = useMemo(() => {
    if (!selectedNodeId) {
      return { incoming: [], outgoing: [], connectedNodeIds: new Set<string>() };
    }
    return getNodeNeighbors(selectedNodeId, nodeMap, edges);
  }, [selectedNodeId, nodeMap, edges]);

  const isOutsideDialog = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  const mastery = node ? masteryMap[node.id] ?? 'unseen' : 'unseen';
  const masteryInfo = MASTERY_STYLE[mastery];
  const isBookmarked = node ? bookmarks.includes(node.id) : false;

  const theoryData =
    node?.kind === 'theory'
      ? allTheories.find((t) => t.id === node.id)
      : undefined;
  const flashcardData =
    node?.kind === 'flashcard'
      ? allFlashcards.find((f) => f.id === node.id)
      : undefined;
  const caseData =
    node?.kind === 'case' ? allCases.find((c) => c.id === node.id) : undefined;
  const questionData =
    node?.kind === 'question'
      ? allQuestions.find((q) => q.id === node.id)
      : undefined;

  const targetTab: WorkspaceTabId =
    node?.kind === 'theory'
      ? 'theories'
      : node?.kind === 'flashcard'
      ? 'flashcards'
      : node?.kind === 'case'
      ? 'cases'
      : 'interview';

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!node) return;
    onUpdateItemNote(node.id, noteInput);
    setNoteSavedToast(true);
    window.setTimeout(() => setNoteSavedToast(false), 2000);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={() => {
        if (dialogRef.current) {
          dialogRef.current.returnValue = '';
        }
        onClose();
      }}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isOutsideDialog(e);
      }}
      onPointerUp={(e) => {
        if (pressedOutsideRef.current && isOutsideDialog(e)) {
          dialogRef.current?.close();
        }
      }}
      className="drawer-dialog w-full max-w-xl bg-white text-slate-900 p-0 shadow-2xl border-l border-slate-900/[0.08] overflow-hidden"
    >
      {node && (
        <div className="h-[100dvh] flex flex-col justify-between overflow-hidden pb-[env(safe-area-inset-bottom)]">
          {/* 상단 헤더 (헤어라인 보더 + 정돈된 서피스 위계) */}
          <div className="bg-slate-50/90 p-5 space-y-3 border-b border-slate-900/[0.08] shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white uppercase tabular-nums">
                  {node.moduleId.toUpperCase()}
                </span>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {KIND_KOR_LABEL[node.kind]}
                </span>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${masteryInfo.badgeClass}`}
                >
                  {masteryInfo.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(node.id)}
                  className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold border ${
                    isBookmarked
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isBookmarked
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{isBookmarked ? '북마크됨' : '북마크'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  aria-label="상세 패널 닫기"
                  className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <p className="text-[11px] font-mono text-slate-500">{node.id}</p>
              <h2
                id={titleId}
                className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug"
              >
                {node.titleKo}
              </h2>
              <p className="text-xs text-slate-500">{node.titleEn}</p>
            </div>

            {/* 듀얼 모드 양방향 딥링크 이동 바 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onJumpToStory(node.moduleId, node.id);
                  dialogRef.current?.close();
                }}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-xs font-bold text-white"
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>스토리 맥락에서 보기</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onJumpToWorkspaceTab(targetTab, node.moduleId, node.id);
                  dialogRef.current?.close();
                }}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>전용 훈련 탭 열기</span>
              </button>
            </div>
          </div>

          {/* 스크롤 본문 */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 1. 플래시카드 노드일 때 */}
            {flashcardData && (
              <div className="space-y-4">
                <div className="surface-subtle p-4 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 block">
                    용어 인출 숙련도 즉시 기록
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFlashcardStatus(flashcardData.id, 'again')
                      }
                      className={`inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold border ${
                        flashcardData.status === 'again'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>모름(Again)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFlashcardStatus(flashcardData.id, 'review')
                      }
                      className={`inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold border ${
                        flashcardData.status === 'review'
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>복습(Review)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateFlashcardStatus(flashcardData.id, 'mastered')
                      }
                      className={`inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold border ${
                        flashcardData.status === 'mastered'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>숙련(Mastered)</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/80 p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>핵심 학술 정의</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {flashcardData.definition}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-amber-900 block">
                    교실·상담 현장 처방 예시
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {flashcardData.classroomExample}
                  </p>
                </div>
              </div>
            )}

            {/* 2. 이론 노드일 때 */}
            {theoryData && (
              <div className="space-y-4">
                <div className="surface-subtle p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>교과서 핵심 명제 ({theoryData.sourceMapping})</span>
                  </div>
                  <ul className="space-y-2">
                    {theoryData.textbookDefinition.map((def, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed"
                      >
                        <span className="mt-0.5 w-4 h-4 rounded bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                          {idx + 1}
                        </span>
                        <span className="min-w-0 flex-1">{def}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl bg-indigo-50/60 border border-indigo-200/80 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-indigo-950 block">
                    과학자-실무자 비판적·실증적 관점
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {theoryData.criticalPerspective}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-amber-950 block">
                    대학원 면접 구술 핵심 포인트
                  </span>
                  <p className="text-xs text-amber-950 leading-relaxed font-medium">
                    {theoryData.interviewPoint}
                  </p>
                </div>
              </div>
            )}

            {/* 3. 사례 노드일 때 */}
            {caseData && (
              <div className="space-y-4">
                <div className="surface-subtle p-4 space-y-1.5">
                  <span className="text-xs font-bold text-indigo-700 block">
                    대상: {caseData.studentGrade} · 교실 임상 시나리오
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {caseData.scenario}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 space-y-1">
                    <span className="text-xs font-bold text-emerald-900 block">
                      1. 행동주의(FBA/PBS) 렌즈
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {caseData.lenses.behavioral}
                    </p>
                  </div>
                  <div className="rounded-xl bg-indigo-50/70 border border-indigo-200 p-3.5 space-y-1">
                    <span className="text-xs font-bold text-indigo-900 block">
                      2. 인지·신경심리(CLT/보철) 렌즈
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {caseData.lenses.cognitive}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 space-y-1">
                    <span className="text-xs font-bold text-amber-950 block">
                      3. 동기·정서·생태(SDT/자기가치) 렌즈
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {caseData.lenses.motivational}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. 면접 문항 노드일 때 */}
            {questionData && (
              <div className="space-y-4">
                <div className="surface-subtle p-4 space-y-1.5">
                  <span className="text-xs font-bold text-indigo-700 block">
                    심층 면접 본 질문
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                    Q. {questionData.question}
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50/70 border border-rose-200 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-rose-800 block">
                    압박 꼬리질문
                  </span>
                  <p className="text-xs font-bold text-rose-950 leading-relaxed">
                    “{questionData.followUpQuestion}”
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block tabular-nums">
                    필수 학술 키워드 ({questionData.requiredKeywords.length}개)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {questionData.requiredKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-900"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-indigo-50/60 border border-indigo-200 p-4 space-y-1.5">
                  <span className="text-xs font-bold text-indigo-900 block">
                    모범 구술 답안 요약
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {questionData.modelAnswer}
                  </p>
                </div>
              </div>
            )}

            {/* 5. 지식 그래프 연결망 (Incoming & Outgoing Edges) */}
            <div className="surface-subtle p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Network className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>연결된 지식 그래프 노드</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 tabular-nums shrink-0">
                  총 {neighbors.incoming.length + neighbors.outgoing.length}개 연결
                </span>
              </div>

              {neighbors.incoming.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    선수·상위 연결 노드
                  </span>
                  <div className="space-y-1.5">
                    {neighbors.incoming.map(({ edge, node: srcNode }) => {
                      const relMeta = RELATION_LABEL[edge.relation];
                      const srcMastery = masteryMap[srcNode.id] ?? 'unseen';
                      return (
                        <button
                          key={edge.id}
                          type="button"
                          onClick={() => onSelectNode(srcNode.id)}
                          className="w-full text-left rounded-lg bg-white hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-300 p-3 space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold ${relMeta.badgeClass}`}
                            >
                              {relMeta.label}
                            </span>
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${MASTERY_STYLE[srcMastery].badgeClass}`}
                            >
                              {MASTERY_STYLE[srcMastery].label}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 flex items-center justify-between gap-2 min-w-0">
                            <span className="truncate min-w-0">{srcNode.titleKo}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          </p>
                          {edge.rationaleKo && (
                            <p className="text-[11px] text-slate-500">
                              {edge.rationaleKo}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {neighbors.outgoing.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    파생·적용·전이 노드
                  </span>
                  <div className="space-y-1.5">
                    {neighbors.outgoing.map(({ edge, node: tgtNode }) => {
                      const relMeta = RELATION_LABEL[edge.relation];
                      const tgtMastery = masteryMap[tgtNode.id] ?? 'unseen';
                      return (
                        <button
                          key={edge.id}
                          type="button"
                          onClick={() => onSelectNode(tgtNode.id)}
                          className="w-full text-left rounded-lg bg-white hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-300 p-3 space-y-1"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold ${relMeta.badgeClass}`}
                            >
                              {relMeta.label}
                            </span>
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${MASTERY_STYLE[tgtMastery].badgeClass}`}
                            >
                              {MASTERY_STYLE[tgtMastery].label}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 flex items-center justify-between gap-2 min-w-0">
                            <span className="truncate min-w-0">{tgtNode.titleKo}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          </p>
                          {edge.rationaleKo && (
                            <p className="text-[11px] text-slate-500">
                              {edge.rationaleKo}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 6. 개인 면접 노트 빠른 메모 */}
            {(node.kind === 'theory' || node.kind === 'case') && (
              <form
                onSubmit={handleSaveNote}
                className="rounded-xl bg-indigo-50/50 border border-indigo-200/80 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={`drawer-note-${node.id}`}
                    className="text-xs font-bold text-indigo-950"
                  >
                    개인 구술·처방 노트 (스토리·워크스페이스 동기화)
                  </label>
                  {noteSavedToast && (
                    <span className="text-xs font-bold text-emerald-700">
                      저장됨
                    </span>
                  )}
                </div>
                <textarea
                  id={`drawer-note-${node.id}`}
                  rows={3}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="이 노드에 대한 면접 핵심 문장이나 처방 아이디어를 메모하세요..."
                  className="w-full rounded-lg border border-indigo-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-indigo-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white"
                  >
                    <Save className="w-3.5 h-3.5 shrink-0" />
                    <span>노트 저장</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
};
