import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  Cpu,
  Gauge,
  Layers,
  Sliders,
  Wrench
} from 'lucide-react';
import { getTheoryVisualBlueprint } from '../../data/theoryVisuals';
import {
  GraphAdjacencyIndex,
  KnowledgeGraphNode,
  MasteryState
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
  onNavigateNode: (nodeId: string) => void;
  onOpenTextbookPassage?: (nodeId: string) => void;
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
type CaseLensTabId = 'matrix' | keyof CaseLenses;

const CLT_PROSTHETICS_THEORY_ID = 'mod2-theory-clt-prosthetics';

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

const CASE_LENS_TABS: ReadonlyArray<{
  id: CaseLensTabId;
  label: string;
}> = [
  { id: 'matrix', label: '종합 매트릭스' },
  { id: 'behavioral', label: '1. 행동주의(FBA)' },
  { id: 'cognitive', label: '2. 인지·보철' },
  { id: 'motivational', label: '3. 동기·상담' }
];

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
  onNavigateNode
}) => {
  const sliderUid = useId();
  const tabBaseId = useId();
  const hasCltLab = theory.id === CLT_PROSTHETICS_THEORY_ID;
  const [subView, setSubView] = useState<TheorySubView>('diagram');
  const cltTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!hasCltLab && subView !== 'diagram') {
      setSubView('diagram');
    }
  }, [hasCltLab, subView]);

  // CLT 마이크로 실험기 로컬 상태 (mod2-theory-clt-prosthetics 전용)
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

  // 파생 학술 용어(DEFINES_TERM)만 추출 — 클릭 시 실전훈련 > 단어장 고유 위치로 직행
  const derivedTermNodes = useMemo(() => {
    const outEdges = adjacency.outgoingByNode[theory.id] ?? [];
    const terms: KnowledgeGraphNode[] = [];
    for (const edge of outEdges) {
      if (edge.relation === 'DEFINES_TERM') {
        const tgt = nodeMap[edge.target];
        if (tgt) {
          terms.push(tgt);
        }
      }
    }
    return terms;
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

  const handleCltTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const nextIdx = idx === 0 ? 1 : 0;
    const nextView: TheorySubView = nextIdx === 0 ? 'diagram' : 'clt-lab';
    setSubView(nextView);
    cltTabRefs.current[nextIdx]?.focus();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-[22px] bg-[#f5f5f7] p-4 sm:p-5 space-y-4 border border-black/[0.04]"
    >
      {/* 상단 스테이지 헤더 + (인지부하이론 전용) 보철 실험기 스위치 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0">
          <span className="text-[11px] font-semibold text-[var(--accent-solid)] block">
            핵심 도식 &amp; 통념·처방 슬라이드
          </span>
          <p className="text-xs sm:text-sm font-bold text-[#1d1d1f] truncate">
            {blueprint.diagramTitle}
          </p>
        </div>

        {hasCltLab && (
          <div
            role="tablist"
            aria-label={`${theory.titleKo} 도식 및 보철 실험기 전환`}
            className="single-row-tablist apple-segmented-track"
          >
            <button
              ref={(el) => {
                cltTabRefs.current[0] = el;
              }}
              id={`${tabBaseId}-diagram`}
              role="tab"
              type="button"
              tabIndex={subView === 'diagram' ? 0 : -1}
              aria-selected={subView === 'diagram'}
              data-active={subView === 'diagram' ? 'true' : 'false'}
              onClick={() => setSubView('diagram')}
              onKeyDown={(e) => handleCltTabKeyDown(e, 0)}
              className={`apple-segmented-pill no-press-scale min-h-[32px] px-3 py-1 text-xs flex items-center gap-1.5 whitespace-nowrap ${
                subView === 'diagram'
                  ? 'text-[#1d1d1f]'
                  : 'text-[#424245] hover:text-[#1d1d1f]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>도식 슬라이드</span>
            </button>

            <button
              ref={(el) => {
                cltTabRefs.current[1] = el;
              }}
              id={`${tabBaseId}-clt-lab`}
              role="tab"
              type="button"
              tabIndex={subView === 'clt-lab' ? 0 : -1}
              aria-selected={subView === 'clt-lab'}
              data-active={subView === 'clt-lab' ? 'true' : 'false'}
              onClick={() => setSubView('clt-lab')}
              onKeyDown={(e) => handleCltTabKeyDown(e, 1)}
              className={`apple-segmented-pill no-press-scale min-h-[32px] px-3 py-1 text-xs flex items-center gap-1.5 whitespace-nowrap ${
                subView === 'clt-lab'
                  ? 'text-[#1d1d1f]'
                  : 'text-[#424245] hover:text-[#1d1d1f]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>보철 실험기</span>
            </button>
          </div>
        )}
      </div>

      {/* 본문 스테이지 뷰포트 */}
      {!hasCltLab || subView === 'diagram' ? (
        <div
          role={hasCltLab ? 'tabpanel' : undefined}
          aria-labelledby={hasCltLab ? `${tabBaseId}-diagram` : undefined}
        >
          <TheoryVisualRenderer blueprint={blueprint} frameless />
        </div>
      ) : (
        <div
          role="tabpanel"
          aria-labelledby={`${tabBaseId}-clt-lab`}
        >
          <div className="rounded-[18px] bg-white p-3.5 sm:p-5 border border-black/[0.05] shadow-2xs space-y-4 tabular-nums">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent-solid)]">
                <Cpu className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
                aria-pressed={useProsthetics}
                onClick={() => setUseProsthetics((prev) => !prev)}
                className={`text-left rounded-[14px] border p-3 space-y-1 transition-colors ${
                  useProsthetics
                    ? 'bg-emerald-50 border-emerald-400 text-[#1d1d1f]'
                    : 'bg-[#f5f5f7] border-transparent text-[#424245] hover:bg-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
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
                aria-pressed={useWorkedExample}
                onClick={() => setUseWorkedExample((prev) => !prev)}
                className={`text-left rounded-[14px] border p-3 space-y-1 transition-colors ${
                  useWorkedExample
                    ? 'bg-[#0071e3]/10 border-[#0071e3]/50 text-[#1d1d1f]'
                    : 'bg-[#f5f5f7] border-transparent text-[#424245] hover:bg-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-[var(--accent-solid)] shrink-0" aria-hidden="true" />
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
                aria-pressed={useChunking}
                onClick={() => setUseChunking((prev) => !prev)}
                className={`text-left rounded-[14px] border p-3 space-y-1 transition-colors ${
                  useChunking
                    ? 'bg-violet-50 border-violet-400 text-[#1d1d1f]'
                    : 'bg-[#f5f5f7] border-transparent text-[#424245] hover:bg-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-violet-600 shrink-0" aria-hidden="true" />
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
        </div>
      )}

      {/* 파생 학술 용어 칩 (클릭 시 실전훈련 > 단어장 해당 카드로 직행) */}
      {derivedTermNodes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-[#6e6e73] mr-0.5 shrink-0 whitespace-nowrap">
            파생 학술 용어 (단어장 직행):
          </span>
          {derivedTermNodes.map((fcNode) => {
            const mState = masteryMap[fcNode.id] ?? 'unseen';
            return (
              <button
                key={fcNode.id}
                type="button"
                onClick={() => onNavigateNode(fcNode.id)}
                className="group inline-flex min-h-[28px] items-center gap-1.5 rounded-full bg-white hover:bg-[var(--accent-subtle)] border border-black/[0.06] hover:border-[#0071e3]/25 px-2.5 py-1 text-[11px] font-semibold text-[#1d1d1f] hover:text-[var(--accent-solid)] transition-colors whitespace-nowrap"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: MASTERY_DOT_COLOR[mState] }}
                  aria-hidden="true"
                />
                <span>{fcNode.titleKo}</span>
                <ArrowUpRight
                  className="w-3 h-3 text-[#86868b] group-hover:text-[var(--accent-solid)] shrink-0"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CaseInlineStage: React.FC<CaseInlineStageProps> = ({
  classroomCase,
  adjacency,
  nodeMap,
  onNavigateNode,
  onOpenTextbookPassage
}) => {
  const lensTabBaseId = useId();
  const [selectedLens, setSelectedLens] = useState<CaseLensTabId>('matrix');
  const lensTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // 역방향 원천 이론 추출 (APPLIED_IN_CASE incoming edges -> 클릭 시 개념학습 내 해당 이론으로 스크롤)
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

  useEffect(() => {
    const activeIdx = CASE_LENS_TABS.findIndex((t) => t.id === selectedLens);
    if (activeIdx >= 0) {
      lensTabRefs.current[activeIdx]?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [selectedLens]);

  const handleLensKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    let nextIdx = idx;
    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % CASE_LENS_TABS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + CASE_LENS_TABS.length) % CASE_LENS_TABS.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = CASE_LENS_TABS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = CASE_LENS_TABS[nextIdx];
    setSelectedLens(nextTab.id);
    lensTabRefs.current[nextIdx]?.focus();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-[20px] bg-white p-4 sm:p-5 border border-black/[0.06] space-y-4"
    >
      {/* 원천 처방 이론 역추적 배지 + 3중 렌즈 단일 행 탭 피커 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {sourceTheories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-semibold text-[#6e6e73] mr-0.5 shrink-0 whitespace-nowrap">
              처방 근거 이론:
            </span>
            {sourceTheories.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => onNavigateNode(th.id)}
                className="inline-flex min-h-[28px] max-w-full items-center gap-1 rounded-[10px] bg-[#f5f5f7] hover:bg-[var(--accent-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[#1d1d1f] hover:text-[var(--accent-solid)] text-left korean-keep-all transition-colors"
              >
                <span>{th.titleKo}</span>
              </button>
            ))}
            {onOpenTextbookPassage && (
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => onOpenTextbookPassage(classroomCase.id)}
                className="inline-flex min-h-[28px] shrink-0 items-center gap-1 rounded-[10px] bg-[var(--accent-subtle)] hover:bg-[#0071e3]/15 border border-[#0071e3]/20 px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-solid)] whitespace-nowrap transition-colors"
              >
                <BookOpen className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>근거 원문</span>
              </button>
            )}
          </div>
        )}

        <div
          role="tablist"
          aria-label={`${classroomCase.title} 3중 처방 렌즈 전환`}
          className="single-row-tablist rounded-[14px] bg-[#f5f5f7] p-1"
        >
          {CASE_LENS_TABS.map((tab, idx) => {
            const isActive = selectedLens === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  lensTabRefs.current[idx] = el;
                }}
                id={`${lensTabBaseId}-${tab.id}`}
                role="tab"
                type="button"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                onClick={() => setSelectedLens(tab.id)}
                onKeyDown={(e) => handleLensKeyDown(e, idx)}
                className={`no-press-scale min-h-[32px] rounded-[10px] px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
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
      <div
        role="tabpanel"
        aria-labelledby={`${lensTabBaseId}-${selectedLens}`}
      >
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
