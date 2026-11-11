import React, { useId, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Brain,
  Cpu,
  Gauge,
  Layers,
  Network,
  Sliders,
  Wrench
} from 'lucide-react';
import { getTheoryVisualBlueprint } from '../../data/theoryVisuals';
import {
  GraphAdjacencyIndex,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  WorkspaceTabId
} from '../../types/graph';
import { CaseLenses, ClassroomCase, TheoryConcept } from '../../types/study';
import {
  CaseLensVisualRenderer,
  TriLensSummaryMatrix
} from '../visuals/CaseLensVisualRenderer';
import { TheoryVisualRenderer } from '../visuals/TheoryVisualRenderer';

interface SharedStageProps {
  adjacency: GraphAdjacencyIndex;
  nodeMap: Record<string, KnowledgeGraphNode>;
  masteryMap: Record<string, MasteryState>;
  onInspectNode: (nodeId: string) => void;
  onJumpToStoryNode: (moduleId: ModuleId, nodeId: string) => void;
  onJumpToWorkspace: (
    tab: WorkspaceTabId,
    moduleId: ModuleId,
    nodeId: string
  ) => void;
}

interface TheoryInlineStageProps extends SharedStageProps {
  variant: 'theory';
  theory: TheoryConcept;
}

interface CaseInlineStageProps extends SharedStageProps {
  variant: 'case';
  classroomCase: ClassroomCase;
}

export type InlineInteractiveStageCardProps =
  | TheoryInlineStageProps
  | CaseInlineStageProps;

type TheorySubView = 'diagram' | 'clt-lab';

const WM_MAX_CAPACITY = 100;
const PROSTHETICS_REDUCTION = 26;
const WORKED_EXAMPLE_REDUCTION = 20;
const CHUNKING_REDUCTION = 18;
const MIN_LOAD_FLOOR = 8;
const DEFAULT_INTRINSIC_LOAD = 52;
const DEFAULT_EXTRANEOUS_LOAD = 44;
const SLIDER_INTRINSIC_MIN = 20;
const SLIDER_INTRINSIC_MAX = 75;
const SLIDER_EXTRANEOUS_MIN = 15;
const SLIDER_EXTRANEOUS_MAX = 70;

const MASTERY_DOT_COLOR: Record<MasteryState, string> = {
  mastered: '#10b981',
  review: '#f59e0b',
  weak: '#f43f5e',
  unseen: '#9ca3af'
};

export const InlineInteractiveStageCard: React.FC<
  InlineInteractiveStageCardProps
> = (props) => {
  if (props.variant === 'theory') {
    return <TheoryInlineStage {...props} />;
  }
  return <CaseInlineStage {...props} />;
};

const TheoryInlineStage: React.FC<TheoryInlineStageProps> = ({
  theory,
  adjacency,
  nodeMap,
  masteryMap,
  onInspectNode,
  onJumpToStoryNode,
  onJumpToWorkspace
}) => {
  const sliderUid = useId();
  const [subView, setSubView] = useState<TheorySubView>('diagram');

  // CLT 마이크로 실험기 로컬 상태
  const [intrinsicBase, setIntrinsicBase] = useState<number>(
    DEFAULT_INTRINSIC_LOAD
  );
  const [extraneousBase, setExtraneousBase] = useState<number>(
    DEFAULT_EXTRANEOUS_LOAD
  );
  const [useProsthetics, setUseProsthetics] = useState<boolean>(false);
  const [useWorkedExample, setUseWorkedExample] = useState<boolean>(false);
  const [useChunking, setUseChunking] = useState<boolean>(false);

  const blueprint = useMemo(
    () => getTheoryVisualBlueprint(theory),
    [theory]
  );

  // O(deg(v)) 1-Hop Ego-Subgraph 추출 (DEFINES_TERM / APPLIED_IN_CASE / DEFENDS_QUESTION / CROSS_MODULE_BRIDGE)
  const egoLinks = useMemo(() => {
    const outEdges = adjacency.outgoingByNode[theory.id] ?? [];
    const inEdges = adjacency.incomingByNode[theory.id] ?? [];

    const termNodes: KnowledgeGraphNode[] = [];
    const appliedAndQuestionNodes: KnowledgeGraphNode[] = [];
    const crossBridgeItems: Array<{
      directionLabel: string;
      otherNode: KnowledgeGraphNode;
      rationaleKo?: string;
    }> = [];

    for (const edge of outEdges) {
      const tgt = nodeMap[edge.target];
      if (!tgt) continue;
      if (edge.relation === 'DEFINES_TERM') {
        termNodes.push(tgt);
      } else if (
        edge.relation === 'APPLIED_IN_CASE' ||
        edge.relation === 'DEFENDS_QUESTION'
      ) {
        appliedAndQuestionNodes.push(tgt);
      } else if (edge.relation === 'CROSS_MODULE_BRIDGE') {
        crossBridgeItems.push({
          directionLabel: '심화 전이',
          otherNode: tgt,
          rationaleKo: edge.rationaleKo
        });
      }
    }

    for (const edge of inEdges) {
      const src = nodeMap[edge.source];
      if (!src) continue;
      if (edge.relation === 'CROSS_MODULE_BRIDGE') {
        crossBridgeItems.push({
          directionLabel: '선수 기반',
          otherNode: src,
          rationaleKo: edge.rationaleKo
        });
      }
    }

    return { termNodes, appliedAndQuestionNodes, crossBridgeItems };
  }, [adjacency, nodeMap, theory.id]);

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

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-[22px] bg-[#f5f5f7] p-4 sm:p-5 space-y-4 border border-black/[0.04]"
    >
      {/* 상단 스테이지 헤더 + 애플 세그먼트 피커 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-[var(--accent-solid)] block">
            인터랙티브 개념 도식 스테이지
          </span>
          <p className="text-xs sm:text-sm font-bold text-[#1d1d1f] truncate">
            {blueprint.diagramTitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label={`${theory.titleKo} 인터랙티브 실험 도구`}
            className="inline-flex apple-segmented-track"
          >
            <button
              role="tab"
              type="button"
              aria-selected={subView === 'diagram'}
              data-active={subView === 'diagram' ? 'true' : 'false'}
              onClick={() => setSubView('diagram')}
              className={`apple-segmented-pill no-press-scale min-h-[30px] px-3 py-1 text-xs flex items-center gap-1.5 ${
                subView === 'diagram'
                  ? 'text-[#1d1d1f]'
                  : 'text-[#424245] hover:text-[#1d1d1f]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>구조 도식</span>
            </button>

            <button
              role="tab"
              type="button"
              aria-selected={subView === 'clt-lab'}
              data-active={subView === 'clt-lab' ? 'true' : 'false'}
              onClick={() => setSubView('clt-lab')}
              className={`apple-segmented-pill no-press-scale min-h-[30px] px-3 py-1 text-xs flex items-center gap-1.5 ${
                subView === 'clt-lab'
                  ? 'text-[#1d1d1f]'
                  : 'text-[#424245] hover:text-[#1d1d1f]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>보철 실험기</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              onJumpToWorkspace('graph', theory.moduleId, theory.id)
            }
            className="min-h-[32px] inline-flex items-center gap-1 rounded-full bg-white hover:bg-black/[0.05] border border-black/[0.06] px-3 py-1 text-[11px] font-semibold text-[#1d1d1f] transition-colors"
            title="90-노드 지식 그래프에서 이 이론의 위치 보기"
          >
            <Network
              className="w-3 h-3 text-[var(--accent-solid)] shrink-0"
              aria-hidden="true"
            />
            <span>그래프 열기</span>
          </button>
        </div>
      </div>

      {/* 본문 스테이지 뷰포트 */}
      <div className="rounded-[18px] bg-white p-3.5 sm:p-5 border border-black/[0.05] shadow-2xs">
        {subView === 'diagram' ? (
          <TheoryVisualRenderer blueprint={blueprint} />
        ) : (
          <div className="space-y-4 tabular-nums">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent-solid)]">
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>작업기억 병목(WM Bottleneck) 및 환경적 보철 실험기</span>
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  cltMetrics.isOverloaded
                    ? 'bg-rose-500/12 text-rose-700'
                    : 'bg-emerald-500/12 text-emerald-700'
                }`}
              >
                {cltMetrics.isOverloaded
                  ? `작업기억 과부하 (${cltMetrics.totalUsed}% / 100%)`
                  : `스키마 정교화 가능 (본유적 여유 ${cltMetrics.germaneCapacity}%)`}
              </span>
            </div>

            {/* 실시간 누적 게이지 */}
            <div className="rounded-[14px] bg-[#f5f5f7] p-3.5 space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-[#424245]">
                  <span>1. 내재적 인지부하 (과제 요소 상호작용성)</span>
                  <span>{cltMetrics.effectiveIntrinsic}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/[0.08] overflow-hidden">
                  <div
                    className="gpu-progress-bar h-full w-full origin-left bg-[var(--accent-solid)]"
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
                <div className="flex justify-between text-[11px] font-semibold text-[#424245]">
                  <span>2. 외재적 인지부하 (모호한 지시·기억 유지 부담)</span>
                  <span>{cltMetrics.effectiveExtraneous}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/[0.08] overflow-hidden">
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
                <div className="flex justify-between text-[11px] font-semibold text-emerald-700">
                  <span>3. 확보된 본유적 인지부하 (스키마 정교화·전이 가용량)</span>
                  <span>{cltMetrics.germaneCapacity}%</span>
                </div>
                <div className="h-2 rounded-full bg-black/[0.08] overflow-hidden">
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

            {/* 슬라이더 2열 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-[14px] bg-[#f5f5f7] p-3.5 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#1d1d1f]">
                  <label htmlFor={`${sliderUid}-intrinsic`}>
                    과제 내재적 난이도
                  </label>
                  <span className="text-[var(--accent-solid)]">
                    {intrinsicBase}%
                  </span>
                </div>
                <input
                  id={`${sliderUid}-intrinsic`}
                  type="range"
                  min={SLIDER_INTRINSIC_MIN}
                  max={SLIDER_INTRINSIC_MAX}
                  value={intrinsicBase}
                  onChange={(e) => setIntrinsicBase(Number(e.target.value))}
                  className="w-full accent-[#0071e3] cursor-pointer"
                />
              </div>

              <div className="rounded-[14px] bg-[#f5f5f7] p-3.5 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-[#1d1d1f]">
                  <label htmlFor={`${sliderUid}-extraneous`}>
                    환경·지시 외재적 부하
                  </label>
                  <span className="text-rose-600">{extraneousBase}%</span>
                </div>
                <input
                  id={`${sliderUid}-extraneous`}
                  type="range"
                  min={SLIDER_EXTRANEOUS_MIN}
                  max={SLIDER_EXTRANEOUS_MAX}
                  value={extraneousBase}
                  onChange={(e) => setExtraneousBase(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>
            </div>

            {/* 3대 처방 스위치 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUseProsthetics((prev) => !prev)}
                className={`text-left rounded-[14px] border p-3 space-y-1 transition-colors ${
                  useProsthetics
                    ? 'bg-emerald-50 border-emerald-400 text-[#1d1d1f]'
                    : 'bg-[#f5f5f7] border-transparent text-[#424245] hover:bg-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>외적 보철</span>
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    -{PROSTHETICS_REDUCTION}%
                  </span>
                </div>
                <p className="text-[11px] text-[#6e6e73] leading-snug">
                  시각 절차표·타이머·중간 메모지로 기억 부담 외주화
                </p>
              </button>

              <button
                type="button"
                onClick={() => setUseWorkedExample((prev) => !prev)}
                className={`text-left rounded-[14px] border p-3 space-y-1 transition-colors ${
                  useWorkedExample
                    ? 'bg-[#0071e3]/10 border-[#0071e3]/50 text-[#1d1d1f]'
                    : 'bg-[#f5f5f7] border-transparent text-[#424245] hover:bg-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-[var(--accent-solid)] shrink-0" />
                    <span>완성 예제</span>
                  </span>
                  <span className="text-[11px] text-[var(--accent-solid)]">
                    -{WORKED_EXAMPLE_REDUCTION}%
                  </span>
                </div>
                <p className="text-[11px] text-[#6e6e73] leading-snug">
                  무작위 시행착오 탐색을 차단하고 하위목표에 집중
                </p>
              </button>

              <button
                type="button"
                onClick={() => setUseChunking((prev) => !prev)}
                className={`text-left rounded-[14px] border p-3 space-y-1 transition-colors ${
                  useChunking
                    ? 'bg-violet-50 border-violet-400 text-[#1d1d1f]'
                    : 'bg-[#f5f5f7] border-transparent text-[#424245] hover:bg-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                    <span>스키마 청킹</span>
                  </span>
                  <span className="text-[11px] text-violet-700">
                    -{CHUNKING_REDUCTION}%
                  </span>
                </div>
                <p className="text-[11px] text-[#6e6e73] leading-snug">
                  하위 기능 자동화 및 의미 덩어리화로 병목 완화
                </p>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 하단 1-Hop Ego-Subgraph 리본 (파생 용어 · 적용 사례 · 모듈 간 브릿지 점프) */}
      <div className="space-y-2 pt-0.5">
        {egoLinks.termNodes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[#6e6e73] mr-0.5">
              파생 학술 용어:
            </span>
            {egoLinks.termNodes.map((fcNode) => {
              const mState = masteryMap[fcNode.id] ?? 'unseen';
              return (
                <button
                  key={fcNode.id}
                  type="button"
                  onClick={() => onInspectNode(fcNode.id)}
                  className="inline-flex min-h-[28px] items-center gap-1.5 rounded-full bg-white hover:bg-black/[0.04] border border-black/[0.06] px-2.5 py-1 text-[11px] font-semibold text-[#1d1d1f] transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: MASTERY_DOT_COLOR[mState] }}
                    aria-hidden="true"
                  />
                  <span>{fcNode.titleKo}</span>
                </button>
              );
            })}
          </div>
        )}

        {(egoLinks.crossBridgeItems.length > 0 ||
          egoLinks.appliedAndQuestionNodes.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {egoLinks.crossBridgeItems.map((bridge) => (
              <button
                key={`${theory.id}-bridge-${bridge.otherNode.id}`}
                type="button"
                onClick={() =>
                  onJumpToStoryNode(
                    bridge.otherNode.moduleId,
                    bridge.otherNode.id
                  )
                }
                title={bridge.rationaleKo}
                className="inline-flex min-h-[28px] items-center gap-1 rounded-full bg-[var(--accent-subtle)] hover:bg-[#0071e3]/16 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-solid)] transition-colors"
              >
                <span>
                  {bridge.directionLabel} ·{' '}
                  {bridge.otherNode.moduleId.toUpperCase()}{' '}
                  {bridge.otherNode.titleKo}
                </span>
                <ArrowUpRight className="w-3 h-3 shrink-0" aria-hidden="true" />
              </button>
            ))}

            {egoLinks.appliedAndQuestionNodes.map((relNode) => (
              <button
                key={relNode.id}
                type="button"
                onClick={() => onInspectNode(relNode.id)}
                className="inline-flex min-h-[28px] items-center gap-1 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#424245] transition-colors"
              >
                <span className="text-[10px] font-bold text-[#6e6e73]">
                  {relNode.kind === 'case' ? '사례' : '면접'}
                </span>
                <span className="truncate max-w-[180px]">{relNode.titleKo}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CaseInlineStage: React.FC<CaseInlineStageProps> = ({
  classroomCase,
  adjacency,
  nodeMap,
  onInspectNode
}) => {
  const [selectedLens, setSelectedLens] = useState<'matrix' | keyof CaseLenses>(
    'matrix'
  );

  // O(deg-(v)) 역방향 원천 이론 추출 (APPLIED_IN_CASE incoming edges)
  const sourceTheories = useMemo(() => {
    const inEdges = adjacency.incomingByNode[classroomCase.id] ?? [];
    const list: KnowledgeGraphNode[] = [];
    for (const edge of inEdges) {
      if (edge.relation === 'APPLIED_IN_CASE' && nodeMap[edge.source]) {
        list.push(nodeMap[edge.source]);
      }
    }
    return list;
  }, [adjacency, classroomCase.id, nodeMap]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-[20px] bg-white p-4 sm:p-5 border border-black/[0.06] space-y-4"
    >
      {/* 원천 처방 이론 역추적 배지 + 3중 렌즈 세그먼트 피커 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold text-[#6e6e73] mr-0.5">
            처방 근거 이론:
          </span>
          {sourceTheories.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => onInspectNode(th.id)}
              className="inline-flex min-h-[28px] items-center gap-1 rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] px-2.5 py-1 text-[11px] font-semibold text-[#1d1d1f] transition-colors"
            >
              <span>{th.titleKo}</span>
            </button>
          ))}
        </div>

        <div
          role="tablist"
          aria-label={`${classroomCase.title} 3중 처방 렌즈 전환`}
          className="flex flex-wrap items-center gap-1 rounded-[14px] bg-[#f5f5f7] p-1"
        >
          {(
            [
              { id: 'matrix', label: '종합 매트릭스' },
              { id: 'behavioral', label: '1. 행동주의(FBA)' },
              { id: 'cognitive', label: '2. 인지·보철' },
              { id: 'motivational', label: '3. 동기·상담' }
            ] as const
          ).map((tab) => {
            const isActive = selectedLens === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setSelectedLens(tab.id)}
                className={`no-press-scale min-h-[30px] rounded-[10px] px-3 py-1 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-white text-[#1d1d1f] shadow-2xs'
                    : 'text-[#424245] hover:text-[#1d1d1f]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 3중 렌즈 도식 렌더링 */}
      <div>
        {selectedLens === 'matrix' ? (
          <TriLensSummaryMatrix classroomCase={classroomCase} />
        ) : (
          <CaseLensVisualRenderer
            lensType={selectedLens}
            rawText={classroomCase.lenses[selectedLens]}
            caseId={classroomCase.id}
          />
        )}
      </div>
    </div>
  );
};
