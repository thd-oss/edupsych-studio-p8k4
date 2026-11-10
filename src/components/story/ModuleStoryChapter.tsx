import React, { useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  ExternalLink,
  Layers,
  MessageSquareWarning,
  Network,
  Save,
  Stethoscope
} from 'lucide-react';
import {
  buildModuleStoryBeats,
  CROSS_MODULE_BRIDGES,
  MODULE_CONCEPT_ANCHORS,
  THEORY_GRAPH_MAPPING
} from '../../data/curriculumGraph';
import { getTheoryVisualBlueprint } from '../../data/theoryVisuals';
import {
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  WorkspaceTabId
} from '../../types/graph';
import {
  ClassroomCase,
  FlashcardStatus,
  ModulePayload
} from '../../types/study';
import { InlineTermQuickCheck } from './InlineTermQuickCheck';

interface ModuleStoryChapterProps {
  mod: ModulePayload;
  activeBeatId: string | null;
  activeNodeId: string;
  isCompleted: boolean;
  visitedBeats: Record<string, boolean>;
  simulationChoices: Record<string, number>;
  bookmarks: string[];
  userNotes: Record<string, string>;
  nodeMap: Record<string, KnowledgeGraphNode>;
  masteryMap: Record<string, MasteryState>;
  onFocusNode: (nodeId: string, beatId?: string) => void;
  onInspectNode: (nodeId: string) => void;
  onRecordSimulationChoice: (theoryId: string, optionIndex: number) => void;
  onUpdateFlashcardStatus: (cardId: string, status: FlashcardStatus) => void;
  onToggleBookmark: (itemId: string) => void;
  onUpdateItemNote: (itemId: string, note: string) => void;
  onToggleModuleCompleted: (moduleId: ModuleId) => void;
  onJumpToWorkspace: (
    tab: WorkspaceTabId,
    moduleId: ModuleId,
    nodeId: string
  ) => void;
}

const MASTERY_KOR_LABEL: Record<MasteryState, string> = {
  mastered: '숙련',
  review: '복습',
  weak: '취약',
  unseen: '미학습'
};

function splitScenarioIntoThreeCues(scenario: string): {
  antecedentCue: string;
  behaviorCue: string;
  consequenceCue: string;
} {
  const sentences = scenario
    .split(/(?<=[.?!다])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 3) {
    const third = Math.ceil(sentences.length / 3);
    return {
      antecedentCue: sentences.slice(0, third).join(' '),
      behaviorCue: sentences.slice(third, third * 2).join(' '),
      consequenceCue: sentences.slice(third * 2).join(' ')
    };
  }
  if (sentences.length === 2) {
    return {
      antecedentCue: sentences[0],
      behaviorCue: sentences[1],
      consequenceCue:
        '단기적 회피·통제 반응이 문제행동을 부적 강화하거나 학습된 무기력을 고착시킬 위험이 있는 상태입니다.'
    };
  }
  return {
    antecedentCue: scenario,
    behaviorCue: '관찰 가능한 표적 행동 및 인지·정서 병목 단서 확인 필요',
    consequenceCue: '단기 처벌/방치 대신 3중 렌즈(행동·인지·동기) 생태학적 개입 필요'
  };
}

export const ModuleStoryChapter: React.FC<ModuleStoryChapterProps> = ({
  mod,
  activeBeatId,
  activeNodeId,
  isCompleted,
  visitedBeats,
  simulationChoices,
  bookmarks,
  userNotes,
  nodeMap,
  masteryMap,
  onFocusNode,
  onInspectNode,
  onRecordSimulationChoice,
  onUpdateFlashcardStatus,
  onToggleBookmark,
  onUpdateItemNote,
  onToggleModuleCompleted,
  onJumpToWorkspace
}) => {
  const beats = React.useMemo(() => buildModuleStoryBeats(mod), [mod]);
  const anchor = MODULE_CONCEPT_ANCHORS[mod.id];
  const leadTheory = mod.theories[0];
  const leadBlueprint = React.useMemo(
    () => (leadTheory ? getTheoryVisualBlueprint(leadTheory) : null),
    [leadTheory]
  );

  const [caseDraftInputs, setCaseDraftInputs] = useState<Record<string, string>>(
    () => {
      const init: Record<string, string> = {};
      for (const c of mod.cases) {
        init[c.id] = userNotes[c.id] ?? '';
      }
      return init;
    }
  );
  const [savedCaseToastId, setSavedCaseToastId] = useState<string | null>(null);

  const mythBeat = beats.find((b) => b.kind === 'myth-hook');
  const retrievalBeat = beats.find((b) => b.kind === 'inline-retrieval');
  const caseBeat = beats.find((b) => b.kind === 'case-bridge');
  const gateBeat = beats.find((b) => b.kind === 'module-gate');

  const selectedSimChoice = leadTheory
    ? simulationChoices[leadTheory.id]
    : undefined;

  const moduleBridges = React.useMemo(() => {
    const modTheoryIds = new Set(mod.theories.map((t) => t.id));
    return CROSS_MODULE_BRIDGES.filter(
      (b) => modTheoryIds.has(b.source) || modTheoryIds.has(b.target)
    );
  }, [mod.theories]);

  const handleSaveCaseDraft = (caseItem: ClassroomCase) => {
    const text = caseDraftInputs[caseItem.id] ?? '';
    onUpdateItemNote(caseItem.id, text);
    setSavedCaseToastId(caseItem.id);
    window.setTimeout(() => setSavedCaseToastId(null), 2000);
  };

  return (
    <section
      id={`story-chapter-${mod.id}`}
      aria-labelledby={`story-chapter-heading-${mod.id}`}
      className="space-y-5 pb-10 border-b border-slate-900/[0.08] last:border-b-0"
    >
      {/* 챕터 헤더 카드 (밝은 서피스 + 상단 모듈 컬러 액센트 바 + 1px 헤어라인) */}
      <div className="surface-card overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: anchor.accentHex }}
        />
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="rounded-md px-2.5 py-0.5 text-xs font-bold text-white tabular-nums"
                style={{ backgroundColor: anchor.accentHex }}
              >
                모듈 {mod.number}
              </span>
              <span className="rounded-md bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {mod.sourceMapping}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>완주 완료</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                onJumpToWorkspace(
                  'theories',
                  mod.id,
                  mod.theories[0]?.id ?? mod.id
                )
              }
              className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800"
            >
              <span>모듈 {mod.number} 워크스페이스 열기</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          <div className="space-y-1.5">
            <h2
              id={`story-chapter-heading-${mod.id}`}
              className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900"
            >
              Module {mod.number}. {mod.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-indigo-700">
              {mod.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-0.5">
              {mod.description}
            </p>
          </div>

          {/* 모듈 간 전이 연결고리 */}
          {moduleBridges.length > 0 && (
            <div className="pt-3 border-t border-slate-900/[0.08] space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>타 모듈과 연결되는 전이 브릿지</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {moduleBridges.map((bridge) => {
                  const isOutgoing = mod.theories.some(
                    (t) => t.id === bridge.source
                  );
                  const otherNodeId = isOutgoing ? bridge.target : bridge.source;
                  const otherNode = nodeMap[otherNodeId];
                  return (
                    <button
                      key={`${bridge.source}-${bridge.target}`}
                      type="button"
                      onClick={() => onInspectNode(otherNodeId)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-900 text-left"
                      title={bridge.rationaleKo}
                    >
                      <span>
                        {isOutgoing ? '심화 전이:' : '선수 기반:'}{' '}
                        {bridge.shortLabel}
                      </span>
                      {otherNode && (
                        <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 uppercase tabular-nums">
                          {otherNode.moduleId}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* BEAT 1: 현장 통념 반박 투표 (Myth Hook & Micro-Simulation)           */}
      {/* =================================================================== */}
      {mythBeat && leadTheory && leadBlueprint && (
        <article
          id={mythBeat.beatId}
          data-beat-id={mythBeat.beatId}
          data-node-id={mod.id}
          data-module-id={mod.id}
          onClick={() => onFocusNode(leadTheory.id, mythBeat.beatId)}
          className={`surface-card p-5 sm:p-6 space-y-4 cursor-pointer ${
            activeBeatId === mythBeat.beatId
              ? 'border-indigo-600 ring-2 ring-indigo-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-900">
              <span>{mythBeat.stepLabel}</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
              {visitedBeats[mythBeat.beatId] ? '탐색 완료' : '스크롤 연동 비트'}
            </span>
          </div>

          <div className="rounded-xl bg-amber-50/60 border border-amber-200/90 p-4 space-y-1.5">
            <span className="text-[11px] font-bold text-amber-800 block">
              교실 현장의 흔한 통념 (Common Classroom Myth)
            </span>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
              {anchor.mythQuestion}
            </p>
          </div>

          {/* 마이크로 시뮬레이션 투표 영역 */}
          {leadBlueprint.microSimulation && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-indigo-700 block">
                  교실 의사결정 시뮬레이션 · {leadBlueprint.diagramTitle}
                </span>
                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed surface-subtle p-3.5">
                  {leadBlueprint.microSimulation.scenarioPrompt}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {leadBlueprint.microSimulation.options.map((opt, oIdx) => {
                  const isChosen = selectedSimChoice === oIdx;
                  return (
                    <button
                      key={`${leadTheory.id}-sim-${oIdx}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRecordSimulationChoice(leadTheory.id, oIdx);
                        onFocusNode(leadTheory.id, mythBeat.beatId);
                      }}
                      className={`w-full text-left rounded-xl border p-3.5 space-y-2 ${
                        isChosen
                          ? opt.isOptimal
                            ? 'bg-emerald-50/90 text-slate-900 border-emerald-500'
                            : 'bg-rose-50/90 text-slate-900 border-rose-400'
                          : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs sm:text-sm font-bold leading-snug min-w-0">
                          선택 {oIdx + 1}. {opt.label}
                        </span>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                            isChosen
                              ? opt.isOptimal
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isChosen
                            ? opt.isOptimal
                              ? '과학자-실무자 최적 처방'
                              : '현장 통념의 역설 (부작용 주의)'
                            : '처방 결과 확인'}
                        </span>
                      </div>

                      {isChosen && (
                        <div className="pt-2 border-t border-slate-900/[0.08] space-y-1.5 text-xs">
                          <p className="text-slate-700 leading-relaxed">
                            {opt.rationale}
                          </p>
                          <p className="font-bold text-indigo-900">
                            핵심 결론: {leadBlueprint.keyTakeawayBadge}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </article>
      )}

      {/* =================================================================== */}
      {/* BEAT 2: 모듈 4대 핵심 이론 도식 조작 & 과학자-실무자 비판적 재해석    */}
      {/* =================================================================== */}
      {mod.theories.map((theory, idx) => {
        const beatId = `${mod.id}-beat-theory-${idx + 1}`;
        const mapping = THEORY_GRAPH_MAPPING[theory.id];
        const isActive =
          activeBeatId === beatId || activeNodeId === theory.id;
        const isBookmarked = bookmarks.includes(theory.id);
        const mastery = masteryMap[theory.id] ?? 'unseen';

        return (
          <article
            key={theory.id}
            id={beatId}
            data-beat-id={beatId}
            data-node-id={theory.id}
            data-module-id={mod.id}
            onClick={() => onFocusNode(theory.id, beatId)}
            className={`surface-card p-5 sm:p-6 space-y-4 cursor-pointer ${
              isActive
                ? 'border-indigo-600 ring-2 ring-indigo-500/15'
                : 'hover:border-slate-300'
            }`}
          >
            {/* 상단 메타 바 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-900 tabular-nums">
                  Step B-{idx + 1} · 이론 {idx + 1}/{mod.theories.length}
                </span>
                <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {theory.sourceMapping}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                    mastery === 'mastered'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : mastery === 'review'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : mastery === 'weak'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {MASTERY_KOR_LABEL[mastery]}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusNode(theory.id, beatId);
                  }}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  <Compass className="w-3 h-3 shrink-0" />
                  <span>우측 도식 동기화</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspectNode(theory.id);
                  }}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700"
                >
                  <Network className="w-3 h-3 shrink-0" />
                  <span>연결 노드</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(theory.id);
                  }}
                  aria-label="이론 북마크"
                  className="inline-flex min-h-[30px] min-w-[30px] items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200"
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      isBookmarked
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-400'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 이론 타이틀 */}
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {theory.titleKo}
              </h3>
              <p className="text-xs font-medium text-slate-500">
                {theory.titleEn}
              </p>
            </div>

            {/* 교과서 핵심 명제 */}
            <div className="surface-subtle p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>원서·교과서 핵심 명제</span>
              </div>
              <ul className="space-y-2">
                {theory.textbookDefinition.map((line, lIdx) => (
                  <li
                    key={lIdx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed"
                  >
                    <span className="mt-0.5 w-5 h-5 rounded bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {lIdx + 1}
                    </span>
                    <span className="min-w-0 flex-1">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 과학자-실무자 비판적 재해석 vs 면접 구술 포인트 */}
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl bg-indigo-50/60 border border-indigo-200/80 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Stethoscope className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>과학자-실무자 비판적 재해석 및 임상 대안</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {theory.criticalPerspective}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50/70 border border-amber-200/90 p-4 space-y-1.5">
                <span className="text-xs font-bold text-amber-950 block">
                  대학원 면접 90초 구술 핵심 포인트
                </span>
                <p className="text-xs sm:text-sm font-medium text-amber-950 leading-relaxed">
                  {theory.interviewPoint}
                </p>
              </div>
            </div>

            {/* 연결된 하위 학술 용어(DEFINES_TERM) 칩 */}
            {mapping && mapping.flashcards.length > 0 && (
              <div className="pt-2 border-t border-slate-900/[0.06] flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1">
                  파생 학술 용어 ({mapping.flashcards.length}):
                </span>
                {mapping.flashcards.map((fcId) => {
                  const fcNode = nodeMap[fcId];
                  if (!fcNode) return null;
                  const fcMastery = masteryMap[fcId] ?? 'unseen';
                  return (
                    <button
                      key={fcId}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectNode(fcId);
                      }}
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-bold ${
                        fcMastery === 'mastered'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : fcMastery === 'weak'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : fcMastery === 'review'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50'
                      }`}
                    >
                      <span>{fcNode.titleKo}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </article>
        );
      })}

      {/* =================================================================== */}
      {/* BEAT 3: 인라인 한-영 개념 퀵 체크 (Inline Retrieval Practice)       */}
      {/* =================================================================== */}
      {retrievalBeat && (
        <article
          id={retrievalBeat.beatId}
          data-beat-id={retrievalBeat.beatId}
          data-node-id={retrievalBeat.primaryNodeId}
          data-module-id={mod.id}
          className={`surface-card p-5 sm:p-6 space-y-4 ${
            activeBeatId === retrievalBeat.beatId
              ? 'border-emerald-600 ring-2 ring-emerald-500/15'
              : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-900">
                <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{retrievalBeat.stepLabel}</span>
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 pt-1">
                {retrievalBeat.titleKo}
              </h3>
              <p className="text-xs text-slate-600">
                {retrievalBeat.subtitleKo}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onJumpToWorkspace(
                  'flashcards',
                  mod.id,
                  mod.flashcards[0]?.id ?? mod.id
                )
              }
              className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white"
            >
              <span>전체 플래시카드 덱 열기</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          <InlineTermQuickCheck
            cards={mod.flashcards}
            bookmarks={bookmarks}
            onUpdateStatus={onUpdateFlashcardStatus}
            onToggleBookmark={onToggleBookmark}
            onInspectNode={onInspectNode}
          />
        </article>
      )}

      {/* =================================================================== */}
      {/* BEAT 4: 교실 사례 임상 단서 3분할 해부 & 블라인드 처방 브릿지        */}
      {/* =================================================================== */}
      {caseBeat && (
        <article
          id={caseBeat.beatId}
          data-beat-id={caseBeat.beatId}
          data-node-id={caseBeat.primaryNodeId}
          data-module-id={mod.id}
          onClick={() => onFocusNode(caseBeat.primaryNodeId, caseBeat.beatId)}
          className={`surface-card p-5 sm:p-6 space-y-5 cursor-pointer ${
            activeBeatId === caseBeat.beatId
              ? 'border-violet-600 ring-2 ring-violet-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-bold text-violet-900">
                <Brain className="w-3.5 h-3.5 text-violet-700 shrink-0" />
                <span>{caseBeat.stepLabel}</span>
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 pt-1">
                {caseBeat.titleKo}
              </h3>
              <p className="text-xs text-slate-600">{caseBeat.subtitleKo}</p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onJumpToWorkspace('cases', mod.id, mod.cases[0]?.id ?? mod.id);
              }}
              className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-violet-700 hover:bg-violet-800 px-3 py-1.5 text-xs font-bold text-white"
            >
              <span>사례 시뮬레이터 탭 열기</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          <div className="space-y-4">
            {mod.cases.map((c, cIdx) => {
              const cues = splitScenarioIntoThreeCues(c.scenario);
              const isSelectedCase = activeNodeId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusNode(c.id, caseBeat.beatId);
                  }}
                  className={`rounded-xl border p-4 sm:p-5 space-y-3.5 ${
                    isSelectedCase
                      ? 'bg-violet-50/40 border-violet-400'
                      : 'surface-subtle'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-violet-700 block">
                        사례 {cIdx + 1} · {c.studentGrade}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                        {c.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFocusNode(c.id, caseBeat.beatId);
                      }}
                      className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-1 text-xs font-bold text-white shrink-0"
                    >
                      <span>우측 스테이지에 3중 렌즈 표시</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>

                  {/* 임상 단서 3분할 해부 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="rounded-lg bg-white border border-amber-200/90 p-3 space-y-1">
                      <span className="inline-block rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        1. 선행 맥락·과제 단서
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {cues.antecedentCue}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white border border-rose-200/90 p-3 space-y-1">
                      <span className="inline-block rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                        2. 외현 행동·병목 단서
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {cues.behaviorCue}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white border border-indigo-200/90 p-3 space-y-1">
                      <span className="inline-block rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
                        3. 후속 반응·강화 함정
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {cues.consequenceCue}
                      </p>
                    </div>
                  </div>

                  {/* 인라인 블라인드 처방 초안 입력 (워크스페이스와 실시간 공유) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg bg-white border border-slate-200 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`story-case-draft-${c.id}`}
                        className="text-xs font-bold text-slate-800"
                      >
                        3중 렌즈(행동·인지·동기) 블라인드 개입안 초안 작성
                      </label>
                      {savedCaseToastId === c.id && (
                        <span className="text-xs font-bold text-emerald-700">
                          워크스페이스 동기화 완료
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <textarea
                        id={`story-case-draft-${c.id}`}
                        rows={2}
                        value={caseDraftInputs[c.id] ?? ''}
                        onChange={(e) =>
                          setCaseDraftInputs((prev) => ({
                            ...prev,
                            [c.id]: e.target.value
                          }))
                        }
                        placeholder="우측 스테이지의 모범 3중 렌즈와 대조하기 전에 핵심 개입 키워드를 먼저 적어보세요..."
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-base sm:text-xs text-slate-900 focus:border-violet-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCaseDraft(c)}
                        className="inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shrink-0"
                      >
                        <Save className="w-3.5 h-3.5 shrink-0" />
                        <span>초안 저장</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      )}

      {/* =================================================================== */}
      {/* BEAT 5: 압박 면접 게이트 & 챕터 완주 체크포인트                      */}
      {/* =================================================================== */}
      {gateBeat && (
        <article
          id={gateBeat.beatId}
          data-beat-id={gateBeat.beatId}
          data-node-id={gateBeat.primaryNodeId}
          data-module-id={mod.id}
          onClick={() => onFocusNode(gateBeat.primaryNodeId, gateBeat.beatId)}
          className={`surface-card p-5 sm:p-6 space-y-5 cursor-pointer ${
            activeBeatId === gateBeat.beatId
              ? 'border-rose-600 ring-2 ring-rose-500/15'
              : 'hover:border-slate-300'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-900">
              <MessageSquareWarning className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{gateBeat.stepLabel}</span>
            </span>

            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              실전 압박 면접 문항 {mod.questions.length}개 연결
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              {gateBeat.titleKo}
            </h3>
            <p className="text-xs text-slate-600">{gateBeat.subtitleKo}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {mod.questions.map((q, qIdx) => {
              const qMastery = masteryMap[q.id] ?? 'unseen';
              return (
                <div
                  key={q.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusNode(q.id, gateBeat.beatId);
                  }}
                  className="surface-subtle hover:border-rose-300 p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-rose-800 tabular-nums">
                      압박 면접 문항 Q{qIdx + 1} · {q.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {MASTERY_KOR_LABEL[qMastery]}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToWorkspace('interview', mod.id, q.id);
                        }}
                        className="inline-flex min-h-[28px] items-center gap-1 rounded-md bg-rose-600 hover:bg-rose-700 px-2.5 py-1 text-[11px] font-bold text-white"
                      >
                        <span>90초 타이머 훈련</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                    Q. {q.question}
                  </p>

                  <p className="text-xs text-rose-900 font-medium leading-relaxed">
                    압박 꼬리질문: “{q.followUpQuestion}”
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {q.requiredKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-indigo-800"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 챕터 완주 체크포인트 & 워크스페이스 브릿지 버튼 */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-3 border-t border-slate-900/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5"
          >
            <button
              type="button"
              onClick={() => onToggleModuleCompleted(mod.id)}
              className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold border ${
                isCompleted
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {isCompleted
                  ? `Module ${mod.number} 완주 완료 (클릭 시 해제)`
                  : `Module ${mod.number} 완주 완료로 표시`}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onJumpToWorkspace(
                  'graph',
                  mod.id,
                  mod.theories[0]?.id ?? mod.id
                )
              }
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white"
            >
              <Network className="w-4 h-4 shrink-0" />
              <span>모듈 {mod.number} 워크스페이스에서 실전 훈련</span>
            </button>
          </div>
        </article>
      )}
    </section>
  );
};
