import React, { useMemo } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Brain,
  CheckCircle2,
  Network,
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
  ModuleId
} from '../../types/graph';
import { ModulePayload } from '../../types/study';
import { ComparisonCarousel } from '../shared/ComparisonCarousel';
import { InlineInteractiveStageCard } from './InlineInteractiveStageCard';

interface ModuleStoryChapterProps {
  mod: ModulePayload;
  activeBeatId: string | null;
  activeNodeId: string;
  isCompleted: boolean;
  defaultExpandDisclosures: boolean;
  visitedBeats: Record<string, boolean>;
  simulationChoices: Record<string, number>;
  bookmarks: string[];
  adjacency: GraphAdjacencyIndex;
  nodeMap: Record<string, KnowledgeGraphNode>;
  masteryMap: Record<string, MasteryState>;
  onFocusNode: (nodeId: string, beatId?: string) => void;
  onNavigateNode: (nodeId: string) => void;
  onRecordSimulationChoice: (theoryId: string, optionIndex: number) => void;
  onToggleBookmark: (itemId: string) => void;
  onToggleModuleCompleted: (moduleId: ModuleId) => void;
  onStartModuleTraining: (moduleId: ModuleId) => void;
  onOpenTextbookPassage: (nodeId: string) => void;
}

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
  adjacency,
  nodeMap,
  masteryMap,
  onFocusNode,
  onNavigateNode,
  onRecordSimulationChoice,
  onToggleBookmark,
  onToggleModuleCompleted,
  onStartModuleTraining,
  onOpenTextbookPassage
}) => {
  const beats = useMemo(() => buildModuleStoryBeats(mod), [mod]);
  const anchor = MODULE_CONCEPT_ANCHORS[mod.id];
  const leadTheory = mod.theories[0];
  const leadBlueprint = useMemo(
    () => (leadTheory ? getTheoryVisualBlueprint(leadTheory) : null),
    [leadTheory]
  );

  const mythBeat = beats.find((b) => b.kind === 'myth-hook');
  const caseBeat = beats.find((b) => b.kind === 'case-bridge');

  const selectedSimChoice = leadTheory
    ? simulationChoices[leadTheory.id]
    : undefined;

  // O(1) 사전 컴파일된 모듈 간 전이 브릿지 목록
  const moduleBridgeEdges = adjacency.crossBridgesByModule[mod.id] ?? [];

  return (
    <section
      id={`story-chapter-${mod.id}`}
      data-node-id={mod.id}
      aria-labelledby={`story-chapter-heading-${mod.id}`}
      className="space-y-6 sm:space-y-8"
    >
      {/* =================================================================== */}
      {/* CHAPTER INTRO CARD (모듈 개요 & 타 모듈 전이 브릿지)                */}
      {/* =================================================================== */}
      <div className="bento-tile-white overflow-hidden">
        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white tabular-nums"
              style={{ backgroundColor: anchor.accentHex }}
            >
              <span>Module 0{mod.number}</span>
            </span>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => onOpenTextbookPassage(mod.id)}
              className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-[var(--accent-subtle)] border border-black/[0.05] hover:border-[#0071e3]/25 px-3 py-1 text-xs font-semibold text-[#424245] hover:text-[var(--accent-solid)] transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent-solid)] shrink-0" aria-hidden="true" />
              <span>{mod.sourceMapping} · 원문</span>
            </button>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>완주 완료</span>
              </span>
            )}
          </div>

          <div className="space-y-2 max-w-3xl">
            <h2
              id={`story-chapter-heading-${mod.id}`}
              className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-[#1d1d1f] leading-tight korean-keep-all"
            >
              Module {mod.number}. {mod.title}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[var(--accent-solid)]">
              {mod.subtitle}
            </p>
            <p className="text-sm sm:text-[15px] text-[#424245] leading-relaxed pt-0.5 korean-keep-all">
              {mod.description}
            </p>
          </div>

          {/* 모듈 간 전이 브릿지 구조화 카드 */}
          {moduleBridgeEdges.length > 0 && (
            <div className="pt-4 border-t border-black/[0.06] space-y-2.5">
              <span className="text-xs font-semibold text-[#6e6e73] flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-[var(--accent-solid)] shrink-0" aria-hidden="true" />
                <span>타 모듈과 연결되는 전이 브릿지 ({moduleBridgeEdges.length})</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {moduleBridgeEdges.map((edge) => {
                  const isOutgoing = nodeMap[edge.source]?.moduleId === mod.id;
                  const otherNodeId = isOutgoing ? edge.target : edge.source;
                  const otherNode = nodeMap[otherNodeId];
                  if (!otherNode) return null;
                  return (
                    <button
                      key={edge.id}
                      type="button"
                      onClick={() => onNavigateNode(otherNode.id)}
                      className="group rounded-[16px] bg-[#f5f5f7] hover:bg-[var(--accent-subtle)] border border-black/[0.05] hover:border-[#0071e3]/20 px-4 py-3 text-left flex flex-col gap-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="shrink-0 whitespace-nowrap inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent-solid)] shadow-2xs">
                          {isOutgoing ? '심화 전이' : '선수 기반'}
                        </span>
                        <span className="shrink-0 whitespace-nowrap inline-flex items-center gap-0.5 rounded-full bg-white px-2.5 py-0.5 text-[10.5px] font-bold text-[#6e6e73] group-hover:text-[var(--accent-solid)] uppercase tabular-nums">
                          <span>{otherNode.moduleId}</span>
                          <ArrowUpRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                        </span>
                      </div>
                      <span className="text-xs sm:text-[13px] font-semibold text-[#1d1d1f] group-hover:text-[var(--accent-solid)] leading-snug korean-keep-all min-w-0">
                        {otherNode.titleKo}
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
      {/* PART 1: 현장 통념 반박 투표 (Apple Obsidian Dark Spotlight Card)    */}
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
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>1단계 · 현장 통념 반박 투표</span>
            </span>
            <span className="text-[11px] font-medium text-white/55 tabular-nums">
              {visitedBeats[mythBeat.beatId] ? '탐색 완료' : '의사결정 시뮬레이션'}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-amber-300 block">
              교실 현장의 흔한 통념 (Common Classroom Myth)
            </span>
            <p className="text-lg sm:text-xl font-bold text-white leading-snug tracking-tight korean-keep-all">
              {anchor.mythQuestion}
            </p>
          </div>

          {leadBlueprint.microSimulation && (
            <div className="space-y-3.5 pt-1">
              <div className="rounded-[18px] bg-white/[0.06] border border-white/10 p-4 space-y-1">
                <span className="text-[11px] font-semibold text-[#66b2ff] block">
                  임상 의사결정 시나리오 · {leadBlueprint.diagramTitle}
                </span>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed korean-keep-all">
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
                        <span className="text-xs sm:text-sm font-semibold leading-snug min-w-0 korean-keep-all">
                          선택 {oIdx + 1}. {opt.label}
                        </span>
                        <span
                          className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
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
                          <p className="text-white/85 leading-relaxed korean-keep-all">
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
      {/* PART 2: 4대 핵심 이론 (단일 가로 슬라이드 릴 + [+] 원문 디스클로저) */}
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
              isActive ? 'ring-2 ring-[#0071e3]/25' : ''
            }`}
          >
            {/* 상단 아이브로우 & 북마크 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 tabular-nums">
                <span className="rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent-solid)]">
                  2단계 · 핵심 이론 {idx + 1} / {mod.theories.length}
                </span>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTextbookPassage(theory.id);
                  }}
                  className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-[var(--accent-subtle)] border border-black/[0.06] hover:border-[#0071e3]/30 px-3 py-1 text-[11px] font-semibold text-[#1d1d1f] hover:text-[var(--accent-solid)] transition-colors"
                >
                  <BookOpen
                    className="w-3.5 h-3.5 text-[var(--accent-solid)] shrink-0"
                    aria-hidden="true"
                  />
                  <span>{theory.sourceMapping} · 원문 열기</span>
                </button>
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

              <button
                type="button"
                aria-pressed={isBookmarked}
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
                  aria-hidden="true"
                />
              </button>
            </div>

            {/* 이론 헤딩 + 핵심 테이크어웨이 리드 */}
            <div className="space-y-2.5">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-[#1d1d1f] leading-snug korean-keep-all">
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
                  <p className="text-xs sm:text-sm text-[#424245] leading-relaxed korean-keep-all">
                    {leadProposition}
                  </p>
                )}
              </div>
            </div>

            {/* 단일 통합 가로 슬라이드 릴 (+ M2 CLT 전용 보철 실험기) + 파생 학술 용어 칩 */}
            <InlineInteractiveStageCard
              variant="theory"
              theory={theory}
              adjacency={adjacency}
              nodeMap={nodeMap}
              masteryMap={masteryMap}
              onNavigateNode={onNavigateNode}
              onOpenTextbookPassage={onOpenTextbookPassage}
            />

            {/* Apple [+] 프로그레시브 디스클로저: 원서 핵심 명제 전문 · 비판적 재해석 · 90초 면접 구술 포인트 */}
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
                <div className="rounded-[16px] bg-white p-4 sm:p-5 space-y-3 border border-black/[0.04]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f]">
                      <BookOpen
                        className="w-4 h-4 text-[var(--accent-solid)] shrink-0"
                        aria-hidden="true"
                      />
                      <span>원서·교과서 핵심 명제 전문</span>
                    </div>
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => onOpenTextbookPassage(theory.id)}
                      className="inline-flex min-h-[26px] items-center gap-1 rounded-full bg-[var(--accent-subtle)] hover:bg-[#0071e3]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-solid)] transition-colors"
                    >
                      <span>영문 원문 발췌 열기</span>
                      <ArrowUpRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </button>
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
                        <span className="min-w-0 flex-1 korean-keep-all">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="rounded-[16px] bg-white p-4 sm:p-5 space-y-2 border border-black/[0.04]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1f]">
                      <Stethoscope
                        className="w-4 h-4 text-[var(--accent-solid)] shrink-0"
                        aria-hidden="true"
                      />
                      <span>과학자-실무자 비판적 재해석 및 임상 대안</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#424245] leading-relaxed korean-keep-all">
                      {theory.criticalPerspective}
                    </p>
                  </div>

                  <div className="rounded-[16px] bg-[var(--accent-subtle)] p-4 sm:p-5 space-y-2 border border-[#0071e3]/15">
                    <span className="text-xs font-bold text-[var(--accent-solid)] block">
                      대학원 면접 90초 구술 핵심 포인트
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-[#1d1d1f] leading-relaxed korean-keep-all">
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
      {/* PART 3: 교실 임상 사례 2개 (3분할 단서 + 3중 처방 렌즈 스테이지)      */}
      {/* =================================================================== */}
      {caseBeat && mod.cases.length > 0 && (
        <article
          id={caseBeat.beatId}
          data-beat-id={caseBeat.beatId}
          data-node-id={caseBeat.primaryNodeId}
          data-module-id={mod.id}
          onClick={() => onFocusNode(caseBeat.primaryNodeId, caseBeat.beatId)}
          className="bento-tile-white p-6 sm:p-8 space-y-6 apple-scroll-reveal"
        >
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/12 px-3 py-1 text-xs font-semibold text-violet-700">
              <Brain className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>3단계 · 교실 임상 사례 적용 ({mod.cases.length}개)</span>
            </span>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] pt-0.5 korean-keep-all">
              {caseBeat.titleKo}
            </h3>
            <p className="text-xs sm:text-sm text-[#6e6e73] korean-keep-all">
              선행맥락 · 외현행동 · 후속반응 3대 단서를 분해하고 행동·인지·동기 3중 처방 렌즈를 비교합니다.
            </p>
          </div>

          <div className="space-y-5">
            {mod.cases.map((c, cIdx) => {
              const cues = splitScenarioIntoThreeCues(c.scenario);
              const isCaseBookmarked = bookmarks.includes(c.id);
              const isCaseActive = activeNodeId === c.id;

              return (
                <div
                  key={c.id}
                  id={`story-case-${c.id}`}
                  data-node-id={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusNode(c.id, caseBeat.beatId);
                  }}
                  className={`rounded-[22px] bg-[#f5f5f7] p-4 sm:p-6 space-y-4 border transition-shadow ${
                    isCaseActive
                      ? 'border-[#0071e3]/40 ring-2 ring-[#0071e3]/20'
                      : 'border-black/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-[var(--accent-solid)] block">
                        사례 {cIdx + 1} · {c.studentGrade}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-[#1d1d1f] korean-keep-all">
                        {c.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      aria-pressed={isCaseBookmarked}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(c.id);
                      }}
                      aria-label={`${c.title} 북마크`}
                      className="inline-flex min-h-[32px] min-w-[32px] shrink-0 items-center justify-center rounded-full bg-white hover:bg-black/[0.05] border border-black/[0.05] transition-colors"
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${
                          isCaseBookmarked
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-[#6e6e73]'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
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
                            <p className="text-xs text-[#424245] leading-relaxed korean-keep-all">
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
                            <p className="text-xs text-[#424245] leading-relaxed korean-keep-all">
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
                            <p className="text-xs text-[#424245] leading-relaxed korean-keep-all">
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
                      <p className="text-xs text-[#424245] leading-relaxed korean-keep-all">
                        {cues.antecedentCue}
                      </p>
                    </div>
                    <div className="rounded-[16px] bg-white border border-black/[0.05] p-4 space-y-1.5">
                      <span className="inline-block rounded-full bg-rose-500/12 px-2.5 py-0.5 text-[10.5px] font-bold text-rose-800">
                        2. 외현 행동·병목 단서
                      </span>
                      <p className="text-xs text-[#424245] leading-relaxed korean-keep-all">
                        {cues.behaviorCue}
                      </p>
                    </div>
                    <div className="rounded-[16px] bg-white border border-black/[0.05] p-4 space-y-1.5">
                      <span className="inline-block rounded-full bg-[var(--accent-subtle)] px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--accent-solid)]">
                        3. 후속 반응·강화 함정
                      </span>
                      <p className="text-xs text-[#424245] leading-relaxed korean-keep-all">
                        {cues.consequenceCue}
                      </p>
                    </div>
                  </div>

                  {/* 인라인 3중 처방 렌즈 인터랙티브 매트릭스 */}
                  <InlineInteractiveStageCard
                    variant="case"
                    classroomCase={c}
                    adjacency={adjacency}
                    nodeMap={nodeMap}
                    masteryMap={masteryMap}
                    onNavigateNode={onNavigateNode}
                    onOpenTextbookPassage={onOpenTextbookPassage}
                  />
                </div>
              );
            })}
          </div>
        </article>
      )}

      {/* =================================================================== */}
      {/* CHAPTER COMPLETION & SINGLE TRAINING GATE                           */}
      {/* =================================================================== */}
      <div className="bento-tile-white p-6 sm:p-7 space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[var(--accent-solid)] block">
            Module 0{mod.number} 개념 정독 마무리
          </span>
          <h3 className="text-base sm:text-lg font-bold text-[#1d1d1f] korean-keep-all">
            이론 {mod.theories.length}개와 사례 {mod.cases.length}개 학습을 마쳤다면 실전 인출 훈련으로 넘어가세요.
          </h3>
          <p className="text-xs sm:text-sm text-[#6e6e73] korean-keep-all">
            모듈 {mod.number}의 핵심 용어 {mod.flashcards.length}개(단어장)와 압박 면접 {mod.questions.length}문항(90초 면접)이 실전훈련 탭에 준비되어 있습니다.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            aria-pressed={isCompleted}
            onClick={() => onToggleModuleCompleted(mod.id)}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
              isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-[#f5f5f7] hover:bg-black/[0.07] text-[#1d1d1f]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isCompleted
                ? `Module ${mod.number} 완주 완료됨`
                : `Module ${mod.number} 완주 완료로 표시`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStartModuleTraining(mod.id)}
            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] px-5 py-2 text-xs font-semibold text-white transition-colors"
          >
            <span>모듈 {mod.number} 실전훈련 시작하기</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
