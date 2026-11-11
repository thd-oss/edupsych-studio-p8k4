import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Brain,
  CheckCircle2,
  ExternalLink,
  Layers,
  MessageSquareWarning,
  Network,
  Save,
  Sparkles,
  Stethoscope
} from 'lucide-react';
import {
  buildModuleStoryBeats,
  MODULE_CONCEPT_ANCHORS
} from '../../data/curriculumGraph';
import { getTheoryVisualBlueprint } from '../../data/theoryVisuals';
import {
  GraphAdjacencyIndex,
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
import { ComparisonCarousel } from '../shared/ComparisonCarousel';
import { InlineInteractiveStageCard } from './InlineInteractiveStageCard';
import { InlineTermQuickCheck } from './InlineTermQuickCheck';

interface ModuleStoryChapterProps {
  mod: ModulePayload;
  activeBeatId: string | null;
  activeNodeId: string;
  isCompleted: boolean;
  defaultExpandDisclosures: boolean;
  visitedBeats: Record<string, boolean>;
  simulationChoices: Record<string, number>;
  bookmarks: string[];
  userNotes: Record<string, string>;
  adjacency: GraphAdjacencyIndex;
  nodeMap: Record<string, KnowledgeGraphNode>;
  masteryMap: Record<string, MasteryState>;
  onFocusNode: (nodeId: string, beatId?: string) => void;
  onInspectNode: (nodeId: string) => void;
  onJumpToStoryNode: (moduleId: ModuleId, nodeId: string) => void;
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

const SAVE_TOAST_DURATION_MS = 2000;

const MASTERY_KOR_LABEL: Record<MasteryState, string> = {
  mastered: '숙련 완료',
  review: '복습 요망',
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
  defaultExpandDisclosures,
  visitedBeats,
  simulationChoices,
  bookmarks,
  userNotes,
  adjacency,
  nodeMap,
  masteryMap,
  onFocusNode,
  onInspectNode,
  onJumpToStoryNode,
  onRecordSimulationChoice,
  onUpdateFlashcardStatus,
  onToggleBookmark,
  onUpdateItemNote,
  onToggleModuleCompleted,
  onJumpToWorkspace
}) => {
  const beats = useMemo(() => buildModuleStoryBeats(mod), [mod]);
  const anchor = MODULE_CONCEPT_ANCHORS[mod.id];
  const leadTheory = mod.theories[0];
  const leadBlueprint = useMemo(
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

  // O(1) 사전 컴파일된 모듈 간 전이 브릿지 목록
  const moduleBridgeEdges = adjacency.crossBridgesByModule[mod.id] ?? [];

  const handleSaveCaseDraft = (caseItem: ClassroomCase) => {
    const text = caseDraftInputs[caseItem.id] ?? '';
    onUpdateItemNote(caseItem.id, text);
    setSavedCaseToastId(caseItem.id);
    window.setTimeout(() => setSavedCaseToastId(null), SAVE_TOAST_DURATION_MS);
  };

  return (
    <section
      id={`story-chapter-${mod.id}`}
      aria-labelledby={`story-chapter-heading-${mod.id}`}
      className="space-y-6 sm:space-y-8 pb-12 border-b border-black/[0.07] last:border-b-0"
    >
      {/* =================================================================== */}
      {/* CHAPTER HERO CARD (Apple Pure White Editorial Intro)                */}
      {/* =================================================================== */}
      <div className="bento-tile-white overflow-hidden">
        <div className="p-6 sm:p-9 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white tabular-nums"
                style={{ backgroundColor: anchor.accentHex }}
              >
                <span>Module 0{mod.number}</span>
              </span>
              <span className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold text-[#424245]">
                {mod.sourceMapping}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
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
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] px-3.5 py-1.5 text-xs font-semibold text-[#1d1d1f] transition-colors"
            >
              <span>모듈 {mod.number} 워크스페이스</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h2
              id={`story-chapter-heading-${mod.id}`}
              className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-[#1d1d1f] leading-tight"
            >
              Module {mod.number}. {mod.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[var(--accent-solid)]">
              {mod.subtitle}
            </p>
            <p className="text-sm sm:text-[15px] text-[#424245] leading-relaxed pt-0.5">
              {mod.description}
            </p>
          </div>

          {/* 모듈 간 전이 브릿지 캡슐 */}
          {moduleBridgeEdges.length > 0 && (
            <div className="pt-4 border-t border-black/[0.06] space-y-2">
              <span className="text-xs font-semibold text-[#6e6e73] flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-[var(--accent-solid)] shrink-0" />
                <span>타 모듈과 연결되는 전이 브릿지 ({moduleBridgeEdges.length})</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {moduleBridgeEdges.map((edge) => {
                  const isOutgoing = nodeMap[edge.source]?.moduleId === mod.id;
                  const otherNodeId = isOutgoing ? edge.target : edge.source;
                  const otherNode = nodeMap[otherNodeId];
                  if (!otherNode) return null;
                  return (
                    <button
                      key={edge.id}
                      type="button"
                      onClick={() =>
                        onJumpToStoryNode(otherNode.moduleId, otherNode.id)
                      }
                      title={edge.rationaleKo}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-[var(--accent-subtle)] px-3 py-1.5 text-xs font-semibold text-[#1d1d1f] hover:text-[var(--accent-solid)] text-left transition-colors"
                    >
                      <span className="text-[11px] font-bold text-[var(--accent-solid)]">
                        {isOutgoing ? '심화 전이' : '선수 기반'}
                      </span>
                      <span>{otherNode.titleKo}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#6e6e73] uppercase tabular-nums">
                        {otherNode.moduleId}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* BEAT 1: 현장 통념 반박 투표 (Apple Obsidian Dark Spotlight Card)    */}
      {/* =================================================================== */}
      {mythBeat && leadTheory && leadBlueprint && (
        <article
          id={mythBeat.beatId}
          data-beat-id={mythBeat.beatId}
          data-node-id={mod.id}
          data-module-id={mod.id}
          onClick={() => onFocusNode(leadTheory.id, mythBeat.beatId)}
          className="bento-tile-dark p-6 sm:p-8 space-y-5 apple-scroll-reveal"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#66b2ff]">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{mythBeat.stepLabel}</span>
            </span>
            <span className="text-[11px] font-medium text-white/55 tabular-nums">
              {visitedBeats[mythBeat.beatId] ? '탐색 완료' : '의사결정 시뮬레이션'}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-amber-300 block">
              교실 현장의 흔한 통념 (Common Classroom Myth)
            </span>
            <p className="text-lg sm:text-xl font-bold text-white leading-snug tracking-tight">
              {anchor.mythQuestion}
            </p>
          </div>

          {/* 마이크로 시뮬레이션 투표 영역 */}
          {leadBlueprint.microSimulation && (
            <div className="space-y-3.5 pt-1">
              <div className="rounded-[18px] bg-white/[0.06] border border-white/10 p-4 space-y-1">
                <span className="text-[11px] font-semibold text-[#66b2ff] block">
                  임상 의사결정 시나리오 · {leadBlueprint.diagramTitle}
                </span>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  {leadBlueprint.microSimulation.scenarioPrompt}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
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
                      className={`w-full text-left rounded-[18px] border p-4 space-y-2.5 transition-colors ${
                        isChosen
                          ? opt.isOptimal
                            ? 'bg-emerald-500/16 text-white border-emerald-400/70'
                            : 'bg-rose-500/16 text-white border-rose-400/70'
                          : 'bg-white/[0.06] hover:bg-white/[0.11] text-white border-white/12'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <span className="text-xs sm:text-sm font-semibold leading-snug min-w-0">
                          선택 {oIdx + 1}. {opt.label}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                            isChosen
                              ? opt.isOptimal
                                ? 'bg-emerald-500 text-white'
                                : 'bg-rose-500 text-white'
                              : 'bg-white/12 text-white/75'
                          }`}
                        >
                          {isChosen
                            ? opt.isOptimal
                              ? '과학자-실무자 최적 처방'
                              : '현장 통념의 역설'
                            : '진단 확인'}
                        </span>
                      </div>

                      {isChosen && (
                        <div className="pt-2.5 border-t border-white/12 space-y-1.5 text-xs">
                          <p className="text-white/85 leading-relaxed">
                            {opt.rationale}
                          </p>
                          <p className="font-semibold text-[#66b2ff]">
                            핵심 테이크어웨이: {leadBlueprint.keyTakeawayBadge}
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
      {/* BEAT 2: 4대 핵심 이론 풀와이드 쇼케이스 (인라인 도식 + [+] 원문 디스클로저) */}
      {/* =================================================================== */}
      {mod.theories.map((theory, idx) => {
        const beatId = `${mod.id}-beat-theory-${idx + 1}`;
        const blueprint = getTheoryVisualBlueprint(theory);
        const isActive =
          activeBeatId === beatId || activeNodeId === theory.id;
        const isBookmarked = bookmarks.includes(theory.id);
        const mastery = masteryMap[theory.id] ?? 'unseen';
        const leadProposition = theory.textbookDefinition[0] ?? '';

        return (
          <article
            key={theory.id}
            id={beatId}
            data-beat-id={beatId}
            data-node-id={theory.id}
            data-module-id={mod.id}
            onClick={() => onFocusNode(theory.id, beatId)}
            className={`bento-tile-white p-6 sm:p-8 space-y-5 apple-scroll-reveal transition-shadow ${
              isActive
                ? 'ring-2 ring-[#0071e3]/25'
                : ''
            }`}
          >
            {/* 상단 아이브로우 & 유틸리티 바 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 tabular-nums">
                <span className="rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent-solid)]">
                  이론 {idx + 1} / {mod.theories.length}
                </span>
                <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-medium text-[#6e6e73]">
                  {theory.sourceMapping}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    mastery === 'mastered'
                      ? 'bg-emerald-500/12 text-emerald-700'
                      : mastery === 'review'
                      ? 'bg-amber-500/15 text-amber-800'
                      : mastery === 'weak'
                      ? 'bg-rose-500/12 text-rose-700'
                      : 'bg-[#f5f5f7] text-[#6e6e73]'
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
                    onInspectNode(theory.id);
                  }}
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] px-3 py-1 text-xs font-semibold text-[#1d1d1f] transition-colors"
                >
                  <Network
                    className="w-3.5 h-3.5 text-[var(--accent-solid)] shrink-0"
                    aria-hidden="true"
                  />
                  <span>연결 노드 상세</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(theory.id);
                  }}
                  aria-label={`${theory.titleKo} 북마크`}
                  className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] transition-colors"
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${
                      isBookmarked
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-[#6e6e73]'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 이론 헤딩 (<details> 바깥에 배치하여 스크린 리더 헤딩 탐색 보장) + 핵심 테이크어웨이 리드 */}
            <div className="space-y-2.5">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-[#1d1d1f] leading-snug">
                  {theory.titleKo}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-[#6e6e73]">
                  {theory.titleEn}
                </p>
              </div>

              <div className="rounded-[16px] bg-[#f5f5f7] px-4 py-3 space-y-1">
                <span className="text-[11px] font-semibold text-[var(--accent-solid)] block">
                  핵심 테이크어웨이 · {blueprint.keyTakeawayBadge}
                </span>
                {leadProposition && (
                  <p className="text-xs sm:text-sm text-[#424245] leading-relaxed">
                    {leadProposition}
                  </p>
                )}
              </div>
            </div>

            {/* 인라인 인터랙티브 개념 도식 & 보철 실험기 + 1-Hop Ego-Subgraph 리본 */}
            <InlineInteractiveStageCard
              variant="theory"
              theory={theory}
              adjacency={adjacency}
              nodeMap={nodeMap}
              masteryMap={masteryMap}
              onInspectNode={onInspectNode}
              onJumpToStoryNode={onJumpToStoryNode}
              onJumpToWorkspace={onJumpToWorkspace}
            />

            {/* Apple [+] 프로그레시브 디스클로저: 원서 핵심 명제 전문 · 비판적 재해석 · 90초 면접 구술 스크립트 */}
            <details
              open={defaultExpandDisclosures}
              onClick={(e) => e.stopPropagation()}
              className="apple-disclosure rounded-[20px] bg-[#f5f5f7] border border-black/[0.05] px-4 sm:px-5"
            >
              <summary className="py-3.5 text-xs sm:text-sm font-semibold text-[#1d1d1f]">
                <span>
                  교과서 원문 명제 ({theory.textbookDefinition.length}개) · 비판적 재해석 ·
                  90초 면접 구술 포인트 보기
                </span>
                <span aria-hidden="true" className="apple-disclosure-plus">
                  +
                </span>
              </summary>

              <div className="pb-5 pt-3 space-y-4 border-t border-black/[0.06]">
                {/* 1. 원서·교과서 핵심 명제 */}
                <div className="rounded-[16px] bg-white p-4 sm:p-5 space-y-3 border border-black/[0.04]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f]">
                    <BookOpen className="w-4 h-4 text-[var(--accent-solid)] shrink-0" />
                    <span>원서·교과서 핵심 명제 전문</span>
                  </div>
                  <ul className="space-y-2.5">
                    {theory.textbookDefinition.map((line, lIdx) => (
                      <li
                        key={lIdx}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-[#424245] leading-relaxed"
                      >
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[#1d1d1f] text-white text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                          {lIdx + 1}
                        </span>
                        <span className="min-w-0 flex-1">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. 과학자-실무자 비판적 재해석 & 90초 면접 포인트 2열 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="rounded-[16px] bg-white p-4 sm:p-5 space-y-2 border border-black/[0.04]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f]">
                      <Stethoscope className="w-4 h-4 text-[var(--accent-solid)] shrink-0" />
                      <span>과학자-실무자 비판적 재해석 및 임상 대안</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#424245] leading-relaxed">
                      {theory.criticalPerspective}
                    </p>
                  </div>

                  <div className="rounded-[16px] bg-[var(--accent-subtle)] p-4 sm:p-5 space-y-2 border border-[#0071e3]/15">
                    <span className="text-xs font-bold text-[var(--accent-solid)] block">
                      대학원 면접 90초 구술 핵심 포인트
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-[#1d1d1f] leading-relaxed">
                      {theory.interviewPoint}
                    </p>
                  </div>
                </div>
              </div>
            </details>
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
          className="bento-tile-white p-6 sm:p-8 space-y-4 apple-scroll-reveal"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>{retrievalBeat.stepLabel}</span>
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] pt-0.5">
                {retrievalBeat.titleKo}
              </h3>
              <p className="text-xs sm:text-sm text-[#6e6e73]">
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
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] px-4 py-2 text-xs font-semibold text-white transition-colors"
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
      {/* BEAT 4: 교실 임상 사례 3분할 단서 & 인라인 3중 렌즈 스테이지         */}
      {/* =================================================================== */}
      {caseBeat && (
        <article
          id={caseBeat.beatId}
          data-beat-id={caseBeat.beatId}
          data-node-id={caseBeat.primaryNodeId}
          data-module-id={mod.id}
          onClick={() => onFocusNode(caseBeat.primaryNodeId, caseBeat.beatId)}
          className="bento-tile-white p-6 sm:p-8 space-y-6 apple-scroll-reveal"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/12 px-3 py-1 text-xs font-semibold text-violet-700">
                <Brain className="w-3.5 h-3.5 shrink-0" />
                <span>{caseBeat.stepLabel}</span>
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] pt-0.5">
                {caseBeat.titleKo}
              </h3>
              <p className="text-xs sm:text-sm text-[#6e6e73]">
                선행맥락 · 외현행동 · 후속반응 3대 단서를 분해하고 곧바로 3중 처방 렌즈를 비교합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onJumpToWorkspace('cases', mod.id, mod.cases[0]?.id ?? mod.id);
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] px-4 py-2 text-xs font-semibold text-[#1d1d1f] transition-colors"
            >
              <span>사례 시뮬레이터 탭 열기</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>

          <div className="space-y-5">
            {mod.cases.map((c, cIdx) => {
              const cues = splitScenarioIntoThreeCues(c.scenario);

              return (
                <div
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusNode(c.id, caseBeat.beatId);
                  }}
                  className="rounded-[22px] bg-[#f5f5f7] p-4 sm:p-6 space-y-4 border border-black/[0.04]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-[var(--accent-solid)] block">
                        사례 {cIdx + 1} · {c.studentGrade}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-[#1d1d1f]">
                        {c.title}
                      </h4>
                    </div>
                  </div>

                  {/* 모바일(< md): 임상 단서 3분할 가로 스와이프 비교 */}
                  <ComparisonCarousel
                    ariaLabel={`${c.title} 임상 단서 3단계 비교`}
                    className="md:hidden"
                    slides={[
                      {
                        id: `${c.id}-cue-a`,
                        tabLabel: '① 선행 맥락',
                        activeTabClass:
                          'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs',
                        content: (
                          <div className="rounded-[16px] bg-white border border-black/[0.06] p-4 space-y-1.5 h-full">
                            <span className="inline-block rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-900">
                              1. 선행 맥락·과제 단서 (Antecedent)
                            </span>
                            <p className="text-xs text-[#424245] leading-relaxed">
                              {cues.antecedentCue}
                            </p>
                          </div>
                        )
                      },
                      {
                        id: `${c.id}-cue-b`,
                        tabLabel: '② 외현 행동',
                        activeTabClass:
                          'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs',
                        content: (
                          <div className="rounded-[16px] bg-white border border-black/[0.06] p-4 space-y-1.5 h-full">
                            <span className="inline-block rounded-full bg-rose-500/12 px-2.5 py-0.5 text-[10.5px] font-bold text-rose-800">
                              2. 외현 행동·병목 단서 (Behavior)
                            </span>
                            <p className="text-xs text-[#424245] leading-relaxed">
                              {cues.behaviorCue}
                            </p>
                          </div>
                        )
                      },
                      {
                        id: `${c.id}-cue-c`,
                        tabLabel: '③ 후속 반응',
                        activeTabClass:
                          'bg-[#1d1d1f] text-white border-[#1d1d1f] shadow-xs',
                        content: (
                          <div className="rounded-[16px] bg-white border border-black/[0.06] p-4 space-y-1.5 h-full">
                            <span className="inline-block rounded-full bg-[var(--accent-subtle)] px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--accent-solid)]">
                              3. 후속 반응·강화 함정 (Consequence)
                            </span>
                            <p className="text-xs text-[#424245] leading-relaxed">
                              {cues.consequenceCue}
                            </p>
                          </div>
                        )
                      }
                    ]}
                  />

                  {/* 태블릿·데스크톱(md+): 임상 단서 3분할 3열 해부 */}
                  <div className="hidden md:grid md:grid-cols-3 gap-3">
                    <div className="rounded-[16px] bg-white border border-black/[0.05] p-4 space-y-1.5">
                      <span className="inline-block rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-900">
                        1. 선행 맥락·과제 단서
                      </span>
                      <p className="text-xs text-[#424245] leading-relaxed">
                        {cues.antecedentCue}
                      </p>
                    </div>
                    <div className="rounded-[16px] bg-white border border-black/[0.05] p-4 space-y-1.5">
                      <span className="inline-block rounded-full bg-rose-500/12 px-2.5 py-0.5 text-[10.5px] font-bold text-rose-800">
                        2. 외현 행동·병목 단서
                      </span>
                      <p className="text-xs text-[#424245] leading-relaxed">
                        {cues.behaviorCue}
                      </p>
                    </div>
                    <div className="rounded-[16px] bg-white border border-black/[0.05] p-4 space-y-1.5">
                      <span className="inline-block rounded-full bg-[var(--accent-subtle)] px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--accent-solid)]">
                        3. 후속 반응·강화 함정
                      </span>
                      <p className="text-xs text-[#424245] leading-relaxed">
                        {cues.consequenceCue}
                      </p>
                    </div>
                  </div>

                  {/* 인라인 블라인드 처방 초안 입력 */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-[18px] bg-white border border-black/[0.06] p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`story-case-draft-${c.id}`}
                        className="text-xs font-bold text-[#1d1d1f]"
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
                        placeholder="아래 모범 3중 렌즈와 대조하기 전에 핵심 개입 키워드를 먼저 적어보세요..."
                        className="flex-1 rounded-[12px] border border-black/[0.1] bg-[#f5f5f7] focus:bg-white p-3 text-base sm:text-xs text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCaseDraft(c)}
                        className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] px-4 py-2 text-xs font-semibold text-white shrink-0 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5 shrink-0" />
                        <span>초안 저장</span>
                      </button>
                    </div>
                  </div>

                  {/* 인라인 3중 처방 렌즈 인터랙티브 매트릭스 (원천 이론 역추적 배지 포함) */}
                  <InlineInteractiveStageCard
                    variant="case"
                    classroomCase={c}
                    adjacency={adjacency}
                    nodeMap={nodeMap}
                    masteryMap={masteryMap}
                    onInspectNode={onInspectNode}
                    onJumpToStoryNode={onJumpToStoryNode}
                    onJumpToWorkspace={onJumpToWorkspace}
                  />
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
          className="bento-tile-white p-6 sm:p-8 space-y-5 apple-scroll-reveal"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/12 px-3 py-1 text-xs font-semibold text-rose-700">
              <MessageSquareWarning className="w-3.5 h-3.5 shrink-0" />
              <span>{gateBeat.stepLabel}</span>
            </span>

            <span className="text-xs font-medium text-[#6e6e73] tabular-nums">
              실전 압박 면접 문항 {mod.questions.length}개 연결
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">
              {gateBeat.titleKo}
            </h3>
            <p className="text-xs sm:text-sm text-[#6e6e73]">
              {gateBeat.subtitleKo}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {mod.questions.map((q, qIdx) => {
              const qMastery = masteryMap[q.id] ?? 'unseen';
              return (
                <div
                  key={q.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusNode(q.id, gateBeat.beatId);
                  }}
                  className="rounded-[20px] bg-[#f5f5f7] p-5 space-y-3 border border-black/[0.04]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-rose-700 tabular-nums">
                      압박 면접 Q{qIdx + 1} · {q.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10.5px] font-semibold text-[#424245] border border-black/[0.05]">
                        {MASTERY_KOR_LABEL[qMastery]}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToWorkspace('interview', mod.id, q.id);
                        }}
                        className="inline-flex min-h-[30px] items-center gap-1 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] px-3 py-1 text-[11px] font-semibold text-white transition-colors"
                      >
                        <span>90초 타이머 훈련</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm sm:text-[15px] font-bold text-[#1d1d1f] leading-relaxed">
                    Q. {q.question}
                  </p>

                  <p className="text-xs sm:text-sm text-rose-800 font-medium leading-relaxed">
                    압박 꼬리질문: “{q.followUpQuestion}”
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {q.requiredKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full bg-white border border-black/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d1d1f]"
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
            className="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
          >
            <button
              type="button"
              onClick={() => onToggleModuleCompleted(mod.id)}
              className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
                isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#f5f5f7] hover:bg-black/[0.07] text-[#1d1d1f]'
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
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] px-5 py-2 text-xs font-semibold text-white transition-colors"
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
