import React, { useMemo, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Gauge,
  Image as ImageIcon,
  Layers,
  MessageSquareWarning,
  Network,
  Sliders,
  Wrench
} from 'lucide-react';
import {
  getNodeNeighbors,
  MODULE_CONCEPT_ANCHORS
} from '../../data/curriculumGraph';
import { getTheoryVisualBlueprint } from '../../data/theoryVisuals';
import {
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  StoryBeatDescriptor,
  WorkspaceTabId
} from '../../types/graph';
import {
  CaseLenses,
  ClassroomCase,
  InterviewQuestion,
  ModulePayload,
  TheoryConcept
} from '../../types/study';
import {
  CaseLensVisualRenderer,
  TriLensSummaryMatrix
} from '../visuals/CaseLensVisualRenderer';
import { TheoryVisualRenderer } from '../visuals/TheoryVisualRenderer';

export type StageDensityMode = 'desktop' | 'dock';

interface StickyVisualStageProps {
  activeModule: ModulePayload;
  activeBeat: StoryBeatDescriptor | null;
  activeNodeId: string;
  nodeMap: Record<string, KnowledgeGraphNode>;
  edges: KnowledgeGraphEdge[];
  masteryMap: Record<string, MasteryState>;
  density?: StageDensityMode;
  onSelectNode: (nodeId: string) => void;
  onInspectNode: (nodeId: string) => void;
  onJumpToWorkspace: (
    tab: WorkspaceTabId,
    moduleId: ModuleId,
    nodeId: string
  ) => void;
}

type StageMode = 'diagram' | 'clt-simulator' | 'mini-graph';

const WM_MAX_CAPACITY = 100;
const PROSTHETICS_REDUCTION = 26;
const WORKED_EXAMPLE_REDUCTION = 20;
const CHUNKING_REDUCTION = 18;
const MIN_LOAD_FLOOR = 8;

const MASTERY_COLOR_HEX: Record<
  MasteryState,
  { fill: string; stroke: string; text: string; label: string }
> = {
  mastered: {
    fill: '#10b981',
    stroke: '#059669',
    text: '#ecfdf5',
    label: 'Mastered'
  },
  review: {
    fill: '#f59e0b',
    stroke: '#d97706',
    text: '#fffbeb',
    label: 'Review'
  },
  weak: {
    fill: '#f43f5e',
    stroke: '#e11d48',
    text: '#fff1f2',
    label: 'Weak/Again'
  },
  unseen: {
    fill: '#334155',
    stroke: '#475569',
    text: '#f1f5f9',
    label: 'Unseen'
  }
};

export const StickyVisualStage: React.FC<StickyVisualStageProps> = ({
  activeModule,
  activeBeat,
  activeNodeId,
  nodeMap,
  edges,
  masteryMap,
  density = 'desktop',
  onSelectNode,
  onInspectNode,
  onJumpToWorkspace
}) => {
  const [stageMode, setStageMode] = useState<StageMode>('diagram');
  const [selectedCaseIndex, setSelectedCaseIndex] = useState<number>(0);
  const [selectedLensTab, setSelectedLensTab] = useState<
    'matrix' | keyof CaseLenses
  >('matrix');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  // 작업기억 & 인지부하(CLT) 마이크로 시뮬레이터 상태
  const [intrinsicBase, setIntrinsicBase] = useState<number>(52);
  const [extraneousBase, setExtraneousBase] = useState<number>(44);
  const [useProsthetics, setUseProsthetics] = useState<boolean>(false);
  const [useWorkedExample, setUseWorkedExample] = useState<boolean>(false);
  const [useChunking, setUseChunking] = useState<boolean>(false);

  // 현재 활성 이론 결정
  const activeTheory: TheoryConcept = useMemo(() => {
    const matched = activeModule.theories.find((t) => t.id === activeNodeId);
    if (matched) return matched;
    if (activeBeat) {
      const beatMatched = activeModule.theories.find(
        (t) => t.id === activeBeat.primaryNodeId
      );
      if (beatMatched) return beatMatched;
    }
    return activeModule.theories[0];
  }, [activeModule.theories, activeNodeId, activeBeat]);

  const activeBlueprint = useMemo(
    () => getTheoryVisualBlueprint(activeTheory),
    [activeTheory]
  );

  // 현재 활성 사례 결정
  const activeCase: ClassroomCase | undefined = useMemo(() => {
    const byId = activeModule.cases.find((c) => c.id === activeNodeId);
    if (byId) return byId;
    return (
      activeModule.cases[selectedCaseIndex] ?? activeModule.cases[0]
    );
  }, [activeModule.cases, activeNodeId, selectedCaseIndex]);

  // 현재 활성 면접 문항 결정
  const activeQuestion: InterviewQuestion | undefined = useMemo(() => {
    const byId = activeModule.questions.find((q) => q.id === activeNodeId);
    if (byId) return byId;
    return (
      activeModule.questions[selectedQuestionIndex] ??
      activeModule.questions[0]
    );
  }, [activeModule.questions, activeNodeId, selectedQuestionIndex]);

  // 현재 노드의 이웃 서브그래프 (Ego-Network)
  const egoCenterId = useMemo(() => {
    if (nodeMap[activeNodeId] && nodeMap[activeNodeId].kind !== 'module') {
      return activeNodeId;
    }
    return activeTheory.id;
  }, [activeNodeId, nodeMap, activeTheory.id]);

  const egoNeighbors = useMemo(
    () => getNodeNeighbors(egoCenterId, nodeMap, edges),
    [egoCenterId, nodeMap, edges]
  );

  // 작업기억 인지부하 연산
  const cltMetrics = useMemo(() => {
    const effectiveIntrinsic = Math.max(
      MIN_LOAD_FLOOR,
      intrinsicBase - (useChunking ? CHUNKING_REDUCTION : 0)
    );
    const effectiveExtraneous = Math.max(
      MIN_LOAD_FLOOR,
      extraneousBase -
        (useProsthetics ? PROSTHETICS_REDUCTION : 0) -
        (useWorkedExample ? WORKED_EXAMPLE_REDUCTION : 0)
    );
    const totalUsed = effectiveIntrinsic + effectiveExtraneous;
    const isOverloaded = totalUsed > WM_MAX_CAPACITY;
    const germaneCapacity = Math.max(0, WM_MAX_CAPACITY - totalUsed);

    return {
      effectiveIntrinsic,
      effectiveExtraneous,
      totalUsed,
      isOverloaded,
      germaneCapacity
    };
  }, [
    intrinsicBase,
    extraneousBase,
    useChunking,
    useProsthetics,
    useWorkedExample
  ]);

  const conceptAnchor = MODULE_CONCEPT_ANCHORS[activeModule.id];
  const currentBeatKind = activeBeat?.kind ?? 'theory-topology';
  const stageSwapKey = `${stageMode}-${currentBeatKind}-${activeNodeId}`;

  const isDock = density === 'dock';
  const bodyScrollClass = isDock
    ? 'stage-card-swap p-3.5 sm:p-4 space-y-3.5 flex-1 min-h-0 overflow-y-auto overscroll-contain'
    : 'stage-card-swap p-4 sm:p-5 space-y-4 max-h-[calc(100dvh-11rem)] overflow-y-auto';

  return (
    <div
      className={`overflow-hidden flex flex-col ${
        isDock ? 'h-full bg-white' : 'surface-card'
      }`}
    >
      {/* 상단 스테이지 컨트롤 바 */}
      <div
        className={`bg-slate-950 text-white border-b border-white/[0.08] ${
          isDock ? 'px-3 py-2 space-y-1.5 shrink-0' : 'px-4 sm:px-5 py-3.5 space-y-3'
        }`}
      >
        {!isDock && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-white shrink-0 tabular-nums"
                style={{ backgroundColor: conceptAnchor.accentHex }}
              >
                <span>모듈 {activeModule.number} 스테이지</span>
              </span>
              <span className="text-xs font-bold text-slate-200 truncate">
                {activeBeat?.stepLabel ?? '개념 토폴로지 및 다중 렌즈 실험실'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onInspectNode(egoCenterId)}
                className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] px-2.5 py-1 text-[11px] font-bold text-slate-100"
              >
                <Network className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span>노드 상세·연결망</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onJumpToWorkspace('graph', activeModule.id, egoCenterId)
                }
                className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-bold text-white"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>워크스페이스 열기</span>
              </button>
            </div>
          </div>
        )}

        {/* 3대 스테이지 서브모드 스위치 (동심원 반경 rounded-xl -> rounded-lg) */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900 p-1 border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setStageMode('diagram')}
            className={`min-h-[32px] rounded-lg px-2 py-1 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 ${
              stageMode === 'diagram'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {isDock ? '도식·처방' : '비트 연동 도식·처방'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStageMode('clt-simulator')}
            className={`min-h-[32px] rounded-lg px-2 py-1 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 ${
              stageMode === 'clt-simulator'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {isDock ? '보철 실험기' : '작업기억·보철 실험기'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStageMode('mini-graph')}
            className={`min-h-[32px] rounded-lg px-2 py-1 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 ${
              stageMode === 'mini-graph'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            <Network className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {isDock ? '서브그래프' : '서브그래프·기준 도해'}
            </span>
          </button>
        </div>
      </div>

      {/* 스테이지 본문 영역 (.stage-card-swap으로 180ms GPU 공간 전환 피드백 제공) */}
      <div key={stageSwapKey} className={bodyScrollClass}>
        {/* Sub-mode 1: 비트 연동 인터랙티브 도식 / 사례 3중 렌즈 / 면접 게이트 */}
        {stageMode === 'diagram' && (
          <div className="space-y-4">
            {/* Case Bridge Beat일 때: 교실 사례 3중 렌즈 시뮬레이터 표시 */}
            {currentBeatKind === 'case-bridge' && activeCase ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 surface-subtle p-3.5">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[11px] font-bold text-violet-700 block">
                      Step D · 교실 임상 사례 3중 렌즈 해부
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {activeCase.title} ({activeCase.studentGrade})
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {activeModule.cases.map((c, idx) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCaseIndex(idx);
                          onSelectNode(c.id);
                        }}
                        className={`min-h-[30px] rounded-lg px-2.5 py-1 text-xs font-bold border tabular-nums ${
                          activeCase.id === c.id
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        사례 #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 렌즈 전환 탭 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'matrix', label: '3중 렌즈 종합 매트릭스' },
                      { id: 'behavioral', label: '1. 행동주의(FBA/PBS)' },
                      { id: 'cognitive', label: '2. 인지·신경심리(보철)' },
                      { id: 'motivational', label: '3. 동기·정서·상담' }
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedLensTab(tab.id)}
                      className={`min-h-[34px] rounded-lg px-2.5 py-1.5 text-xs font-bold border ${
                        selectedLensTab === tab.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {selectedLensTab === 'matrix' ? (
                  <TriLensSummaryMatrix classroomCase={activeCase} />
                ) : (
                  <CaseLensVisualRenderer
                    lensType={selectedLensTab}
                    rawText={activeCase.lenses[selectedLensTab]}
                    caseId={activeCase.id}
                  />
                )}
              </div>
            ) : currentBeatKind === 'module-gate' && activeQuestion ? (
              /* Module Gate Beat일 때: 압박 면접 방어 논리 아키텍처 스테이지 */
              <div className="space-y-4">
                <div className="surface-subtle p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-900">
                      <MessageSquareWarning className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Step E · 실전 압박 면접 방어 아키텍처</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {activeModule.questions.map((q, idx) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            setSelectedQuestionIndex(idx);
                            onSelectNode(q.id);
                          }}
                          className={`min-h-[30px] rounded-lg px-2.5 py-1 text-xs font-bold border tabular-nums ${
                            activeQuestion.id === q.id
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          문항 Q{idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
                    Q. {activeQuestion.question}
                  </p>

                  <div className="rounded-lg bg-rose-50/80 border border-rose-200 p-3.5 space-y-1">
                    <span className="text-[11px] font-bold text-rose-800 block">
                      면접관 압박 꼬리질문
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-rose-950 leading-relaxed">
                      “{activeQuestion.followUpQuestion}”
                    </p>
                  </div>
                </div>

                {/* 필수 학술 키워드 체크리스트 */}
                <div className="surface-subtle p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      채점 루브릭 필수 키워드 ({activeQuestion.requiredKeywords.length}개)
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700">
                      90초 구술 시 아래 용어를 모두 포함해야 방어 성공
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeQuestion.requiredKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-950"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 모범 구술 스트럭처 */}
                <div className="rounded-xl bg-indigo-50/60 border border-indigo-200 p-4 space-y-2">
                  <span className="text-xs font-bold text-indigo-950 block">
                    과학자-실무자 모범 구술 답안 요약
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {activeQuestion.modelAnswer}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onJumpToWorkspace(
                          'interview',
                          activeModule.id,
                          activeQuestion.id
                        )
                      }
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3.5 py-2 text-xs font-bold text-white"
                    >
                      <MessageSquareWarning className="w-4 h-4 shrink-0" />
                      <span>90초 압박 면접 타이머로 훈련하기</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 기본(Myth Hook / Theory Topology / Inline Retrieval): 4대 이론 선택 칩 + TheoryVisualRenderer */
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 surface-subtle p-2.5">
                  <span className="text-xs font-bold text-slate-700 px-1.5">
                    모듈 {activeModule.number} 핵심 이론 도식 선택:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeModule.theories.map((t, idx) => {
                      const isSelected = t.id === activeTheory.id;
                      const mState = masteryMap[t.id] ?? 'unseen';
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onSelectNode(t.id)}
                          className={`min-h-[30px] rounded-lg px-2.5 py-1 text-xs font-bold border flex items-center gap-1.5 tabular-nums ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: MASTERY_COLOR_HEX[mState].fill
                            }}
                          />
                          <span>이론 {idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <TheoryVisualRenderer blueprint={activeBlueprint} />
              </div>
            )}
          </div>
        )}

        {/* Sub-mode 2: 작업기억 & 신경심리학적 환경적 보철 실험기 (CLT Simulator) */}
        {stageMode === 'clt-simulator' && (
          <div className="space-y-4 tabular-nums">
            <div className="surface-subtle p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-900">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>작업기억 병목(WM Bottleneck) 및 환경적 보철 시뮬레이터</span>
                </span>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-xs font-bold border ${
                    cltMetrics.isOverloaded
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {cltMetrics.isOverloaded
                    ? `작업기억 과부하 (${cltMetrics.totalUsed}% / 100%)`
                    : `스키마 정교화 가능 (본유적 여유 ${cltMetrics.germaneCapacity}%)`}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                과제의 내재적 난이도와 불필요한 외재적 인지부하가 작업기억 한계(100%)를 초과하면 학습 부진이나 과제 회피 문제행동이 발생합니다. 아래 처방 스위치를 켜서 본유적 부하(Germane Load) 여유 공간을 확보해 보세요.
              </p>
            </div>

            {/* 실시간 누적 게이지 바 (GPU scaleX 활용) */}
            <div className="surface-subtle p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800">
                  작업기억(Working Memory) 실시간 점유율
                </span>
                <span
                  className={
                    cltMetrics.isOverloaded
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }
                >
                  총 부하 {cltMetrics.totalUsed}% / 정교화 여유{' '}
                  {cltMetrics.germaneCapacity}%
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>1. 내재적 인지부하 (과제 요소 상호작용성)</span>
                    <span>{cltMetrics.effectiveIntrinsic}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="gpu-progress-bar h-full w-full origin-left bg-indigo-600"
                      style={{
                        transform: `scaleX(${Math.min(
                          1,
                          cltMetrics.effectiveIntrinsic / WM_MAX_CAPACITY
                        )})`
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>2. 외재적 인지부하 (모호한 지시·기억 유지 부담)</span>
                    <span>{cltMetrics.effectiveExtraneous}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="gpu-progress-bar h-full w-full origin-left bg-rose-500"
                      style={{
                        transform: `scaleX(${Math.min(
                          1,
                          cltMetrics.effectiveExtraneous / WM_MAX_CAPACITY
                        )})`
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-emerald-800">
                    <span>3. 확보된 본유적 인지부하 (스키마 정교화·전이 가용량)</span>
                    <span>{cltMetrics.germaneCapacity}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="gpu-progress-bar h-full w-full origin-left bg-emerald-500"
                      style={{
                        transform: `scaleX(${Math.min(
                          1,
                          cltMetrics.germaneCapacity / WM_MAX_CAPACITY
                        )})`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 슬라이더 컨트롤 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <label htmlFor="slider-intrinsic">과제 내재적 난이도</label>
                  <span className="text-indigo-600">{intrinsicBase}%</span>
                </div>
                <input
                  id="slider-intrinsic"
                  type="range"
                  min={20}
                  max={75}
                  value={intrinsicBase}
                  onChange={(e) => setIntrinsicBase(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  다단계 추론·복합 문장제일수록 내재적 부하가 상승합니다.
                </p>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <label htmlFor="slider-extraneous">환경·지시 외재적 부하</label>
                  <span className="text-rose-600">{extraneousBase}%</span>
                </div>
                <input
                  id="slider-extraneous"
                  type="range"
                  min={15}
                  max={70}
                  value={extraneousBase}
                  onChange={(e) => setExtraneousBase(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  구두 다중 지시·주의 분산 자극이 많을수록 급증합니다.
                </p>
              </div>
            </div>

            {/* 3대 신경심리·교수설계 처방 스위치 */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 block">
                과학자-실무자 인지·보철 처방 투입 (클릭하여 토글)
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setUseProsthetics((prev) => !prev)}
                  className={`w-full text-left rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
                    useProsthetics
                      ? 'bg-emerald-50/90 text-slate-900 border-emerald-500'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        수행 시점 환경적 보철 투입 (-{PROSTHETICS_REDUCTION}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      책상 위 시각적 절차 체크리스트·타이머·중간 계산 메모지로 작업기억 유지 부담을 외주화합니다.
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-bold shrink-0 ${
                      useProsthetics
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {useProsthetics ? '적용됨' : '미적용'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseWorkedExample((prev) => !prev)}
                  className={`w-full text-left rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
                    useWorkedExample
                      ? 'bg-indigo-50/90 text-slate-900 border-indigo-500'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Gauge className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        완성 예제(Worked Example) 및 하위목표 분할 (-{WORKED_EXAMPLE_REDUCTION}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      초보 학습자의 무작위 시행착오 탐색(외재적 부하)을 차단하고 풀이 스키마에 집중시킵니다.
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-bold shrink-0 ${
                      useWorkedExample
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {useWorkedExample ? '적용됨' : '미적용'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseChunking((prev) => !prev)}
                  className={`w-full text-left rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
                    useChunking
                      ? 'bg-violet-50/90 text-slate-900 border-violet-500'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Brain className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span>
                        하위 기능 스키마 자동화 및 청킹(Chunking) (-{CHUNKING_REDUCTION}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      개별 정보 조각을 의미 있는 상위 덩어리(Chunk)로 묶어 체감 내재적 병목을 낮춥니다.
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2.5 py-1 text-xs font-bold shrink-0 ${
                      useChunking
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {useChunking ? '적용됨' : '미적용'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-mode 3: 미니 서브그래프(Ego-Network) & 모듈 개념 앵커 도해 */}
        {stageMode === 'mini-graph' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-950 text-white p-4 space-y-3 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[11px] font-bold text-indigo-300 block">
                    실시간 숙련도 연동 서브그래프
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    중심 노드: {nodeMap[egoCenterId]?.titleKo ?? activeTheory.titleKo}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onJumpToWorkspace('graph', activeModule.id, egoCenterId)
                  }
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-xs font-bold text-white shrink-0"
                >
                  <Network className="w-3.5 h-3.5 shrink-0" />
                  <span>90-Node 전체 그래프 열기</span>
                </button>
              </div>

              {/* 미니 SVG Ego-Network */}
              <div className="rounded-xl bg-slate-900 border border-white/[0.08] p-2 overflow-hidden">
                <svg
                  viewBox="0 0 620 290"
                  className="w-full h-auto select-none"
                  role="img"
                  aria-label="활성 노드의 지식 그래프 연결 다이어그램"
                >
                  {(() => {
                    const cx = 310;
                    const cy = 145;
                    const allItems = [
                      ...egoNeighbors.incoming.map((item) => ({
                        ...item,
                        dir: 'in' as const
                      })),
                      ...egoNeighbors.outgoing.map((item) => ({
                        ...item,
                        dir: 'out' as const
                      }))
                    ].slice(0, 10);

                    const centerMastery = masteryMap[egoCenterId] ?? 'unseen';
                    const centerPalette = MASTERY_COLOR_HEX[centerMastery];

                    return (
                      <>
                        {/* 간선 렌더링 */}
                        {allItems.map((item, idx) => {
                          const angle =
                            (idx / Math.max(1, allItems.length)) * Math.PI * 2 -
                            Math.PI / 2;
                          const rx = 215;
                          const ry = 102;
                          const nx = Math.round(cx + Math.cos(angle) * rx);
                          const ny = Math.round(cy + Math.sin(angle) * ry);
                          const isBridge =
                            item.edge.relation === 'CROSS_MODULE_BRIDGE';

                          return (
                            <g key={item.edge.id}>
                              <line
                                x1={cx}
                                y1={cy}
                                x2={nx}
                                y2={ny}
                                stroke={isBridge ? '#fbbf24' : '#6366f1'}
                                strokeWidth={isBridge ? 2.2 : 1.6}
                                strokeDasharray={isBridge ? '5 4' : undefined}
                                opacity={0.75}
                              />
                            </g>
                          );
                        })}

                        {/* 주변 이웃 노드 */}
                        {allItems.map((item, idx) => {
                          const angle =
                            (idx / Math.max(1, allItems.length)) * Math.PI * 2 -
                            Math.PI / 2;
                          const rx = 215;
                          const ry = 102;
                          const nx = Math.round(cx + Math.cos(angle) * rx);
                          const ny = Math.round(cy + Math.sin(angle) * ry);
                          const mState = masteryMap[item.node.id] ?? 'unseen';
                          const palette = MASTERY_COLOR_HEX[mState];
                          const shortTitle =
                            item.node.titleKo.length > 15
                              ? `${item.node.titleKo.slice(0, 15)}…`
                              : item.node.titleKo;

                          return (
                            <g
                              key={item.node.id}
                              onClick={() => onInspectNode(item.node.id)}
                              className="cursor-pointer"
                            >
                              <circle
                                cx={nx}
                                cy={ny}
                                r={16}
                                fill={palette.fill}
                                stroke={palette.stroke}
                                strokeWidth={2}
                              />
                              <text
                                x={nx}
                                y={ny + 3.5}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="9"
                                fontWeight="800"
                              >
                                {item.node.kind === 'flashcard'
                                  ? 'FC'
                                  : item.node.kind === 'case'
                                  ? 'CASE'
                                  : item.node.kind === 'question'
                                  ? 'Q'
                                  : 'TH'}
                              </text>
                              <rect
                                x={nx - 66}
                                y={ny + 20}
                                width={132}
                                height={18}
                                rx={6}
                                fill="#0f172a"
                                stroke="#334155"
                                strokeWidth={1}
                              />
                              <text
                                x={nx}
                                y={ny + 32}
                                textAnchor="middle"
                                fill="#e2e8f0"
                                fontSize="9.5"
                                fontWeight="700"
                              >
                                {shortTitle}
                              </text>
                            </g>
                          );
                        })}

                        {/* 중심 노드 */}
                        <g
                          onClick={() => onInspectNode(egoCenterId)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r={30}
                            fill={centerPalette.fill}
                            stroke="#ffffff"
                            strokeWidth={3}
                          />
                          <text
                            x={cx}
                            y={cy - 2}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="800"
                          >
                            ACTIVE
                          </text>
                          <text
                            x={cx}
                            y={cy + 11}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="9"
                            fontWeight="700"
                          >
                            {activeModule.id.toUpperCase()}
                          </text>
                        </g>
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* 모듈 대표 비주얼 도해(PNG) 앵커 카드 */}
            <div className="surface-subtle p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Module {activeModule.number} 핵심 아키텍처 기준 도해</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {conceptAnchor.storyThemeBadge}
                </span>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                <img
                  src={conceptAnchor.imageUrl}
                  alt={conceptAnchor.captionKo}
                  className="w-full h-auto object-contain max-h-[280px] mx-auto"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {conceptAnchor.captionKo}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
