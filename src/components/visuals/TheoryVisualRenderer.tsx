import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Compass,
  Cpu,
  GitBranch,
  Grid,
  Image as ImageIcon,
  Layers,
  LayoutList,
  Maximize2,
  Minimize2,
  Network,
  RefreshCw,
  Scale,
  Sliders,
  Sparkles,
  Stethoscope,
  XCircle
} from 'lucide-react';
import {
  ClinicalContrastRow,
  ConceptMicroSimulation,
  ConcentricLayerItem,
  ContinuumStageNode,
  MatrixQuadrantItem,
  ProcessStepNode,
  PyramidTierItem,
  StackedGaugeBar,
  TheoryVisualBlueprint,
  TriadicNodeItem,
  VisualTopologyType
} from '../../types/visuals';

interface TheoryVisualRendererProps {
  blueprint: TheoryVisualBlueprint;
}

type VisualModalityTab = 'diagram' | 'contrast' | 'simulation' | 'infographic';

const TOPOLOGY_META: Record<
  VisualTopologyType,
  { labelKo: string; badgeClass: string; icon: React.ReactNode }
> = {
  'hierarchy-pyramid': {
    labelKo: '위계 피라미드 모형 (Hierarchy Pyramid)',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: <Layers className="w-3.5 h-3.5 shrink-0" />
  },
  'concentric-circles': {
    labelKo: '다층 동심원 체계도 (Concentric Systems)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <CircleDot className="w-3.5 h-3.5 shrink-0" />
  },
  'matrix-2x2': {
    labelKo: '2×2 다차원 교차 매트릭스 (2×2 Matrix)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    icon: <Grid className="w-3.5 h-3.5 shrink-0" />
  },
  'stacked-gauge': {
    labelKo: '작업기억 인지부하 스택 게이지 (Cognitive Load Gauge)',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: <Cpu className="w-3.5 h-3.5 shrink-0" />
  },
  'process-cycle': {
    labelKo: '순환적 피드백 루프 (Cyclical Process Loop)',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    icon: <RefreshCw className="w-3.5 h-3.5 shrink-0" />
  },
  'step-flow': {
    labelKo: '단계별 발달·내면화 파이프라인 (Step Flow Ladder)',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
    icon: <GitBranch className="w-3.5 h-3.5 shrink-0" />
  },
  'spectrum-continuum': {
    labelKo: '동기 내면화 스펙트럼 연속체 (Spectrum Continuum)',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: <Sliders className="w-3.5 h-3.5 shrink-0" />
  },
  'triadic-network': {
    labelKo: '중심축-하위요소 상호작용 네트워크 (Hub Network)',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    icon: <Network className="w-3.5 h-3.5 shrink-0" />
  }
};

const ACCENT_PALETTE: Record<
  'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate',
  {
    bg: string;
    border: string;
    activeBorder: string;
    badge: string;
    text: string;
    ringBg: string;
    dot: string;
  }
> = {
  indigo: {
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-200',
    activeBorder: 'border-indigo-600 ring-2 ring-indigo-500/20',
    badge: 'bg-indigo-600 text-white',
    text: 'text-indigo-950',
    ringBg: 'bg-indigo-500/15 border-indigo-400',
    dot: 'bg-indigo-600'
  },
  emerald: {
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    activeBorder: 'border-emerald-600 ring-2 ring-emerald-500/20',
    badge: 'bg-emerald-600 text-white',
    text: 'text-emerald-950',
    ringBg: 'bg-emerald-500/15 border-emerald-400',
    dot: 'bg-emerald-600'
  },
  amber: {
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    activeBorder: 'border-amber-600 ring-2 ring-amber-500/20',
    badge: 'bg-amber-600 text-white',
    text: 'text-amber-950',
    ringBg: 'bg-amber-500/15 border-amber-400',
    dot: 'bg-amber-500'
  },
  rose: {
    bg: 'bg-rose-50/80',
    border: 'border-rose-200',
    activeBorder: 'border-rose-600 ring-2 ring-rose-500/20',
    badge: 'bg-rose-600 text-white',
    text: 'text-rose-950',
    ringBg: 'bg-rose-500/15 border-rose-400',
    dot: 'bg-rose-600'
  },
  sky: {
    bg: 'bg-sky-50/80',
    border: 'border-sky-200',
    activeBorder: 'border-sky-600 ring-2 ring-sky-500/20',
    badge: 'bg-sky-600 text-white',
    text: 'text-sky-950',
    ringBg: 'bg-sky-500/15 border-sky-400',
    dot: 'bg-sky-600'
  },
  violet: {
    bg: 'bg-violet-50/80',
    border: 'border-violet-200',
    activeBorder: 'border-violet-600 ring-2 ring-violet-500/20',
    badge: 'bg-violet-600 text-white',
    text: 'text-violet-950',
    ringBg: 'bg-violet-500/15 border-violet-400',
    dot: 'bg-violet-600'
  },
  slate: {
    bg: 'bg-slate-100/90',
    border: 'border-slate-300',
    activeBorder: 'border-slate-700 ring-2 ring-slate-500/20',
    badge: 'bg-slate-700 text-white',
    text: 'text-slate-900',
    ringBg: 'bg-slate-400/15 border-slate-400',
    dot: 'bg-slate-500'
  }
};

const QUADRANT_TONE_STYLES: Record<
  MatrixQuadrantItem['tone'],
  {
    card: string;
    badge: string;
    exampleBox: string;
    title: string;
  }
> = {
  positive: {
    card: 'bg-emerald-50/75 border-emerald-200/90',
    badge: 'bg-emerald-700 text-white',
    exampleBox: 'bg-white/90 border-emerald-200 text-emerald-950',
    title: 'text-emerald-950'
  },
  caution: {
    card: 'bg-amber-50/75 border-amber-200/90',
    badge: 'bg-amber-600 text-white',
    exampleBox: 'bg-white/90 border-amber-200 text-amber-950',
    title: 'text-amber-950'
  },
  critical: {
    card: 'bg-rose-50/75 border-rose-200/90',
    badge: 'bg-rose-700 text-white',
    exampleBox: 'bg-white/90 border-rose-200 text-rose-950',
    title: 'text-rose-950'
  },
  neutral: {
    card: 'bg-slate-50/90 border-slate-200/90',
    badge: 'bg-indigo-700 text-white',
    exampleBox: 'bg-white/90 border-slate-200 text-slate-800',
    title: 'text-slate-900'
  }
};

const PYRAMID_WIDTH_CLASSES = ['w-full sm:w-3/5', 'w-full sm:w-4/5', 'w-full'];
const DEFAULT_ACTIVE_INDEX = 0;

const HierarchyPyramidDiagram: React.FC<{ tiers: PyramidTierItem[] }> = ({
  tiers
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(DEFAULT_ACTIVE_INDEX);
  const activeTier = tiers[selectedIdx] ?? tiers[DEFAULT_ACTIVE_INDEX];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
      {/* 좌측: 시각적 피라미드 블록 */}
      <div className="lg:col-span-6 flex flex-col items-center space-y-2.5 py-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          ▲ 층위를 클릭하여 세부 작동 기제를 확인하세요
        </div>
        {tiers.map((tier, idx) => {
          const palette = ACCENT_PALETTE[tier.accentColor];
          const isSelected = idx === selectedIdx;
          const widthClass =
            PYRAMID_WIDTH_CLASSES[idx] ??
            PYRAMID_WIDTH_CLASSES[PYRAMID_WIDTH_CLASSES.length - 1];

          return (
            <button
              key={tier.tierLabel}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`${widthClass} text-left rounded-2xl p-4 border-2 shadow-sm ${
                palette.bg
              } ${isSelected ? palette.activeBorder : palette.border}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${palette.badge}`}
                >
                  {tier.tierLabel}
                </span>
                {tier.proportion && (
                  <span className="text-xs font-extrabold text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200 tabular-nums">
                    {tier.proportion}
                  </span>
                )}
              </div>
              <p className={`mt-2 text-sm font-extrabold ${palette.text}`}>
                {tier.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                {tier.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* 우측: 선택된 피라미드 층 상세 분석 카드 */}
      {activeTier && (
        <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-900/[0.08] p-5 shadow-sm space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                ACCENT_PALETTE[activeTier.accentColor].badge
              }`}
            >
              {activeTier.tierLabel} 집중 분석
            </span>
            {activeTier.proportion && (
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg tabular-nums">
                비중/범위: {activeTier.proportion}
              </span>
            )}
          </div>
          <h5 className="text-base font-extrabold text-slate-900">
            {activeTier.title}
          </h5>
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            {activeTier.subtitle}
          </p>
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {activeTier.details.map((detail, dIdx) => (
              <div
                key={dIdx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span className="[overflow-wrap:anywhere]">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CONCENTRIC_RING_SIZES = [
  'w-28 h-28',
  'w-44 h-44',
  'w-60 h-60',
  'w-72 h-72'
];

const ConcentricCirclesDiagram: React.FC<{
  layers: ConcentricLayerItem[];
}> = ({ layers }) => {
  const [activeLayerIdx, setActiveLayerIdx] = useState<number>(
    layers.length > 1 ? 1 : DEFAULT_ACTIVE_INDEX
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      {/* 좌측: 동심원 시각화 */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center py-2 overflow-x-auto">
        <div className="relative flex items-center justify-center w-72 h-72 shrink-0">
          {[...layers].reverse().map((layer, revIdx) => {
            const originalIdx = layers.length - 1 - revIdx;
            const sizeClass =
              CONCENTRIC_RING_SIZES[originalIdx] ??
              CONCENTRIC_RING_SIZES[CONCENTRIC_RING_SIZES.length - 1];
            const palette = ACCENT_PALETTE[layer.accentColor];
            const isSelected = originalIdx === activeLayerIdx;

            return (
              <button
                key={layer.ringName}
                type="button"
                onClick={() => setActiveLayerIdx(originalIdx)}
                className={`no-press-scale absolute rounded-full border-2 flex flex-col items-center justify-start pt-2.5 transition-[transform,border-color] duration-200 ease-out-strong ${sizeClass} ${
                  palette.ringBg
                } ${
                  isSelected
                    ? 'ring-4 ring-indigo-500/30 border-indigo-600 shadow-md scale-[1.02]'
                    : 'hover:border-slate-500'
                }`}
              >
                <span className="px-2 py-0.5 rounded-full bg-white/95 text-[10px] font-extrabold text-slate-800 shadow-sm border border-slate-200">
                  {layer.ringName}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] font-semibold text-slate-500 text-center">
          동심원 고리 또는 우측 카드를 클릭해 층위별 개입 원리를 비교하세요
        </p>
      </div>

      {/* 우측: 층위별 선택 및 상세 카드 */}
      <div className="lg:col-span-7 space-y-2.5 min-w-0">
        {layers.map((layer, idx) => {
          const palette = ACCENT_PALETTE[layer.accentColor];
          const isSelected = idx === activeLayerIdx;
          return (
            <div
              key={layer.ringName}
              onClick={() => setActiveLayerIdx(idx)}
              className={`cursor-pointer rounded-2xl p-4 border transition-colors duration-150 ${
                palette.bg
              } ${isSelected ? palette.activeBorder : palette.border}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${palette.badge}`}
                  >
                    {layer.ringName}
                  </span>
                  <h5 className={`text-sm font-extrabold ${palette.text}`}>
                    {layer.title}
                  </h5>
                </div>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {layer.subtitle}
              </p>
              <ul className="mt-2.5 space-y-1.5 border-t border-slate-200/60 pt-2">
                {layer.examples.map((ex, exIdx) => (
                  <li
                    key={exIdx}
                    className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed"
                  >
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${palette.dot}`}
                    />
                    <span className="[overflow-wrap:anywhere]">{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Matrix2x2Diagram: React.FC<{
  matrixAxis: NonNullable<TheoryVisualBlueprint['matrixAxis']>;
}> = ({ matrixAxis }) => {
  return (
    <div className="space-y-3">
      {/* 상단 축 안내 */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-600 bg-slate-100/90 px-4 py-2 rounded-xl border border-slate-200">
        <span>가로축(X): {matrixAxis.xAxisLabel}</span>
        <span>세로축(Y): {matrixAxis.yAxisLabel}</span>
      </div>

      {/* 열 헤더 (데스크톱) */}
      <div className="hidden md:grid md:grid-cols-2 gap-3">
        {matrixAxis.colHeaders.map((colHeader) => (
          <div
            key={colHeader}
            className="rounded-xl bg-slate-800 text-white px-4 py-2 text-center text-xs font-extrabold tracking-wide"
          >
            {colHeader}
          </div>
        ))}
      </div>

      {/* 2x2 사분면 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {matrixAxis.quadrants.map((quad) => {
          const style = QUADRANT_TONE_STYLES[quad.tone];
          return (
            <div
              key={quad.quadrantTitle}
              className={`rounded-2xl border p-4 space-y-2.5 shadow-sm min-w-0 ${style.card}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                  <span className="rounded bg-white/90 px-2 py-0.5 border border-slate-200">
                    {quad.rowLabel}
                  </span>
                  <span>×</span>
                  <span className="rounded bg-white/90 px-2 py-0.5 border border-slate-200">
                    {quad.colLabel}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.badge}`}
                >
                  {quad.badgeText}
                </span>
              </div>

              <h5 className={`text-sm sm:text-base font-extrabold ${style.title}`}>
                {quad.quadrantTitle}
              </h5>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed [overflow-wrap:anywhere]">
                {quad.summary}
              </p>

              <div
                className={`rounded-xl border p-3 text-xs leading-relaxed [overflow-wrap:anywhere] ${style.exampleBox}`}
              >
                <span className="font-extrabold mr-1.5">교실·상담 적용:</span>
                <span>{quad.example}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StackedGaugeDiagram: React.FC<{ gauges: StackedGaugeBar[] }> = ({
  gauges
}) => {
  return (
    <div className="space-y-4">
      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 border border-slate-900/[0.08] text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block shrink-0" />
            <span>내재적 부하 (Intrinsic · 과제 복잡성)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-rose-700">
            <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block shrink-0" />
            <span>외재적 부하 (Extraneous · 제거 표적!)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block shrink-0" />
            <span>본유적 부하 (Germane · 스키마 구축)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500">
            <span className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300 inline-block shrink-0" />
            <span>작업기억 여유 용량</span>
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-500 tabular-nums">
          전체 작업기억 한계 = 100% (4±1 청크)
        </span>
      </div>

      {/* 게이지 바 목록 */}
      <div className="space-y-3.5">
        {gauges.map((bar) => (
          <div
            key={bar.label}
            className="rounded-2xl bg-white border border-slate-900/[0.08] p-4 space-y-2.5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                {bar.label}
              </h5>
              {bar.overflowWarning ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{bar.overflowWarning}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 tabular-nums">
                  <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>본유적 부하 {bar.germanePercent}% 확보</span>
                </span>
              )}
            </div>

            {/* 스택 바 */}
            <div className="h-8 w-full rounded-xl overflow-hidden flex border border-slate-200 bg-slate-100 text-[11px] font-extrabold text-white tabular-nums">
              {bar.intrinsicPercent > 0 && (
                <div
                  style={{ width: `${bar.intrinsicPercent}%` }}
                  className="bg-indigo-600 flex items-center justify-center px-1 truncate"
                  title={`내재적 부하 ${bar.intrinsicPercent}%`}
                >
                  내재 {bar.intrinsicPercent}%
                </div>
              )}
              {bar.extraneousPercent > 0 && (
                <div
                  style={{ width: `${bar.extraneousPercent}%` }}
                  className="bg-rose-500 flex items-center justify-center px-1 truncate"
                  title={`외재적 부하 ${bar.extraneousPercent}%`}
                >
                  외재 {bar.extraneousPercent}%
                </div>
              )}
              {bar.germanePercent > 0 && (
                <div
                  style={{ width: `${bar.germanePercent}%` }}
                  className="bg-emerald-500 flex items-center justify-center px-1 truncate"
                  title={`본유적 부하 ${bar.germanePercent}%`}
                >
                  본유(스키마) {bar.germanePercent}%
                </div>
              )}
              {bar.unusedPercent > 0 && (
                <div
                  style={{ width: `${bar.unusedPercent}%` }}
                  className="bg-slate-200 text-slate-600 flex items-center justify-center px-1 truncate"
                  title={`여유 용량 ${bar.unusedPercent}%`}
                >
                  여유 {bar.unusedPercent}%
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {bar.caption}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProcessCycleDiagram: React.FC<{
  steps: ProcessStepNode[];
  isCyclical: boolean;
}> = ({ steps, isCyclical }) => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(
    DEFAULT_ACTIVE_INDEX
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {steps.map((step, idx) => {
          const isSelected = idx === activeStepIdx;
          const isLast = idx === steps.length - 1;

          return (
            <div
              key={step.stepNumber}
              onClick={() => setActiveStepIdx(idx)}
              className={`cursor-pointer rounded-2xl p-4 border transition-colors duration-150 relative flex flex-col justify-between min-w-0 ${
                isSelected
                  ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-extrabold tabular-nums ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    <span>{step.stepNumber}</span>
                  </span>

                  {step.highlightBadge && (
                    <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                      {step.highlightBadge}
                    </span>
                  )}
                </div>

                <h5 className="text-sm font-extrabold text-slate-900">
                  {step.title}
                </h5>
                <p className="text-xs font-semibold text-indigo-700">
                  {step.subtitle}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed pt-1 [overflow-wrap:anywhere]">
                  {step.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-end text-[11px] font-bold text-slate-500">
                {!isLast ? (
                  <span className="inline-flex items-center gap-1 text-indigo-600">
                    <span>다음 단계로 이행</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </span>
                ) : isCyclical ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>1단계로 피드백 순환 (Loop)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>최종 내면화·일반화 달성</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SpectrumContinuumDiagram: React.FC<{
  stages: ContinuumStageNode[];
}> = ({ stages }) => {
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(
    stages.length - 1
  );

  return (
    <div className="space-y-4">
      {/* 상단 자율성 연속체 바 */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-200 via-amber-100 to-emerald-200 p-3 border border-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-extrabold text-slate-800 px-1">
          <span>◀ 타율적 통제 · 무동기 (Non-Self-Determined)</span>
          <span>정보적 피드백 &amp; 3대 심리욕구(자율성·유능감·관계성) 지원 ▶</span>
          <span>자기결정적 · 내재적 동기 (Self-Determined) ▶</span>
        </div>
      </div>

      {/* 6단계 스펙트럼 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {stages.map((stage, idx) => {
          const palette = ACCENT_PALETTE[stage.accentColor];
          const isSelected = idx === selectedStageIdx;
          return (
            <div
              key={stage.title}
              onClick={() => setSelectedStageIdx(idx)}
              className={`cursor-pointer rounded-2xl p-3.5 border transition-colors duration-150 flex flex-col justify-between min-w-0 ${
                palette.bg
              } ${isSelected ? palette.activeBorder : palette.border}`}
            >
              <div className="space-y-1.5">
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold ${palette.badge}`}
                >
                  {stage.stageLabel}
                </span>
                <h5 className={`text-sm font-extrabold ${palette.text}`}>
                  {stage.title}
                </h5>
                <p className="text-[11px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200/80">
                  {stage.locus}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed pt-1 [overflow-wrap:anywhere]">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TriadicNetworkDiagram: React.FC<{
  triadic: NonNullable<TheoryVisualBlueprint['triadicNodes']>;
}> = ({ triadic }) => {
  return (
    <div className="space-y-4">
      {/* 중앙 컨트롤 허브 */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-900 text-white p-4 shadow-sm border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-indigo-500/30 border border-indigo-400/40 p-2.5 text-indigo-200 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
              Central Executive / Core Regulatory Hub
            </span>
            <h5 className="text-sm sm:text-base font-extrabold text-white">
              {triadic.centerLabel}
            </h5>
          </div>
        </div>
        <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-bold text-indigo-100 shrink-0">
          ⇄ 4대 하위 체계 양방향 제어
        </span>
      </div>

      {/* 4대 연결 노드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {triadic.nodes.map((node: TriadicNodeItem) => {
          const palette = ACCENT_PALETTE[node.accentColor];
          return (
            <div
              key={node.nodeTitle}
              className={`rounded-2xl border p-4 space-y-2 shadow-sm min-w-0 ${palette.bg} ${palette.border}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h6 className={`text-sm font-extrabold ${palette.text}`}>
                  {node.nodeTitle}
                </h6>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0 ${palette.badge}`}
                >
                  ⇄ 중앙 허브 연동
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600">
                {node.subtitle}
              </p>
              <ul className="space-y-1.5 pt-1 border-t border-slate-200/60">
                {node.bullets.map((b, bIdx) => (
                  <li
                    key={bIdx}
                    className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed"
                  >
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${palette.dot}`}
                    />
                    <span className="[overflow-wrap:anywhere]">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ClinicalContrastTable: React.FC<{
  rows: ClinicalContrastRow[];
}> = ({ rows }) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-950 text-white px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 font-extrabold">
          <Scale className="w-4 h-4 text-amber-300 shrink-0" />
          <span>과학자-실무자(Scientist-Practitioner) 패러다임 대조 매트릭스</span>
        </div>
        <span className="text-[11px] text-indigo-200 font-medium">
          직관·통념에 의존한 오개념을 배제하고 실증적 기제에 기반해 처방합니다
        </span>
      </div>

      {/* 데스크톱 3열 헤더 */}
      <div className="hidden md:grid md:grid-cols-12 gap-3 text-xs font-extrabold">
        <div className="md:col-span-3 rounded-xl bg-slate-800 text-white px-3.5 py-2.5 flex items-center">
          진단·개입 차원
        </div>
        <div className="md:col-span-4 rounded-xl bg-rose-900 text-rose-50 px-3.5 py-2.5 flex items-center gap-1.5">
          <span>❌ 현장의 흔한 통념·비과학적 접근</span>
        </div>
        <div className="md:col-span-5 rounded-xl bg-emerald-900 text-emerald-50 px-3.5 py-2.5 flex items-center gap-1.5">
          <span>✅ 과학자-실무자 증거기반 처방</span>
        </div>
      </div>

      {/* 행 목록 */}
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.dimension}
            className="grid grid-cols-1 md:grid-cols-12 gap-2.5 md:gap-3 rounded-2xl bg-white border border-slate-900/[0.08] p-3.5 shadow-sm items-stretch"
          >
            {/* 1열: 진단·개입 차원 */}
            <div className="md:col-span-3 rounded-xl bg-slate-100/90 border border-slate-200/80 p-3 flex flex-col justify-center min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 md:hidden mb-0.5">
                진단·개입 차원
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug [overflow-wrap:anywhere]">
                {row.dimension}
              </span>
            </div>

            {/* 2열: 통념·비과학적 접근 */}
            <div className="md:col-span-4 rounded-xl bg-rose-50/80 border border-rose-200/90 p-3 flex flex-col justify-between space-y-1.5 min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-800">
                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>❌ 현장의 흔한 통념·비과학적 접근</span>
              </span>
              <p className="text-xs text-rose-950 leading-relaxed [overflow-wrap:anywhere]">
                {row.naiveApproach}
              </p>
            </div>

            {/* 3열: 증거기반 처방 */}
            <div className="md:col-span-5 rounded-xl bg-emerald-50/85 border border-emerald-200/90 p-3 flex flex-col justify-between space-y-1.5 min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>✅ 과학자-실무자 증거기반 처방</span>
              </span>
              <p className="text-xs text-emerald-950 font-medium leading-relaxed [overflow-wrap:anywhere]">
                {row.evidenceBasedApproach}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MicroSimulationCard: React.FC<{
  simulation: ConceptMicroSimulation;
}> = ({ simulation }) => {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(
    null
  );
  const [compareAllOptions, setCompareAllOptions] = useState<boolean>(false);

  const selectedOption =
    selectedOptionIdx !== null ? simulation.options[selectedOptionIdx] : null;

  return (
    <div className="rounded-2xl bg-white border border-indigo-200/90 p-4 sm:p-5 shadow-sm space-y-4">
      {/* 시나리오 프롬프트 헤더 */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-4 space-y-2 border border-indigo-500/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/20 border border-amber-300/40 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-200">
            <Stethoscope className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>현장 의사결정 미니 시뮬레이션 (Clinical Decision Sandbox)</span>
          </span>
          <button
            type="button"
            onClick={() => setCompareAllOptions((prev) => !prev)}
            className="min-h-[32px] rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1 text-[11px] font-bold text-indigo-100"
          >
            {compareAllOptions
              ? '선택지 개별 테스트 모드로 전환'
              : '전체 선택지 학술 근거 한눈에 비교'}
          </button>
        </div>
        <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
          {simulation.scenarioPrompt}
        </p>
      </div>

      {/* 선택지 버튼 리스트 */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-bold text-slate-500">
          ▼ 아래 처방 선택지 중 하나를 클릭하여 과학자-실무자 타당성을 즉시 검증하세요
        </div>
        {simulation.options.map((opt, idx) => {
          const isSelected = selectedOptionIdx === idx;
          const showResult = isSelected || compareAllOptions;

          const cardStyle = showResult
            ? opt.isOptimal
              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-rose-50/85 border-rose-400 ring-2 ring-rose-500/15'
            : 'bg-slate-50/80 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40';

          return (
            <div
              key={opt.label}
              className={`rounded-2xl border p-3.5 transition-colors duration-150 ${cardStyle}`}
            >
              <button
                type="button"
                onClick={() => setSelectedOptionIdx(idx)}
                className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] font-extrabold shrink-0 mt-0.5 tabular-nums">
                    {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug [overflow-wrap:anywhere]">
                    {opt.label}
                  </span>
                </div>

                {showResult && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold shrink-0 ${
                      opt.isOptimal
                        ? 'bg-emerald-700 text-white'
                        : 'bg-rose-700 text-white'
                    }`}
                  >
                    {opt.isOptimal ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>[최적의 과학자-실무자 개입]</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>[주의: 부작용 위험 접근]</span>
                      </>
                    )}
                  </span>
                )}
              </button>

              {showResult && (
                <div
                  className={`mt-3 pt-2.5 border-t text-xs leading-relaxed [overflow-wrap:anywhere] ${
                    opt.isOptimal
                      ? 'border-emerald-200/90 text-emerald-950'
                      : 'border-rose-200/90 text-rose-950'
                  }`}
                >
                  <span className="font-extrabold mr-1.5">
                    {opt.isOptimal
                      ? '학술적·임상적 타당성 근거:'
                      : '부작용 및 이론적 한계 분석:'}
                  </span>
                  <span>{opt.rationale}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 즉시 피드백 요약 배너 (개별 선택 시) */}
      {selectedOption && !compareAllOptions && (
        <div
          className={`toast-enter rounded-xl border p-3.5 flex items-start gap-2.5 text-xs leading-relaxed ${
            selectedOption.isOptimal
              ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
              : 'bg-rose-950 text-rose-50 border-rose-800'
          }`}
        >
          {selectedOption.isOptimal ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <span className="font-extrabold mr-1.5">
              {selectedOption.isOptimal
                ? '[최적의 과학자-실무자 개입 검증 완료]'
                : '[주의: 부작용 위험 접근 감지]'}
            </span>
            <span>{selectedOption.rationale}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ConceptInfographicCard: React.FC<{
  illustrationUrl: string;
  illustrationCaption?: string;
  diagramTitle: string;
}> = ({ illustrationUrl, illustrationCaption, diagramTitle }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="rounded-2xl bg-white border border-slate-900/[0.08] p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-900">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
            <span>개념 앵커 인포그래픽 (Visual Anchor Infographic)</span>
          </span>
          <span className="text-xs font-bold text-slate-600">
            이중부호화(Dual-Coding) 시각 심상 고정용 도해
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-700"
        >
          {isExpanded ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 shrink-0" />
              <span>기본 크기로 축소</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
              <span>클릭하여 크게 보기</span>
            </>
          )}
        </button>
      </div>

      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="cursor-zoom-in rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 flex items-center justify-center p-2"
      >
        <img
          src={illustrationUrl}
          alt={illustrationCaption ?? diagramTitle}
          className={`w-full object-contain rounded-lg ${
            isExpanded ? 'max-h-[720px]' : 'max-h-80 sm:max-h-96'
          }`}
          loading="lazy"
        />
      </div>

      {illustrationCaption && (
        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 leading-relaxed">
          <span className="font-extrabold text-slate-800 mr-1.5">
            인포그래픽 해설:
          </span>
          <span>{illustrationCaption}</span>
        </p>
      )}
    </div>
  );
};

export const TheoryVisualRenderer: React.FC<TheoryVisualRendererProps> = ({
  blueprint
}) => {
  const meta = TOPOLOGY_META[blueprint.topology];
  const [activeTab, setActiveTab] = useState<VisualModalityTab>('diagram');
  const [showAllModalities, setShowAllModalities] = useState<boolean>(false);

  const hasContrastRows = Boolean(
    blueprint.clinicalContrastRows && blueprint.clinicalContrastRows.length > 0
  );
  const hasMicroSimulation = Boolean(blueprint.microSimulation);
  const hasIllustration = Boolean(blueprint.illustrationUrl);

  const shouldRenderDiagram = showAllModalities || activeTab === 'diagram';
  const shouldRenderContrast =
    hasContrastRows && (showAllModalities || activeTab === 'contrast');
  const shouldRenderSimulation =
    hasMicroSimulation && (showAllModalities || activeTab === 'simulation');
  const shouldRenderInfographic =
    hasIllustration && (showAllModalities || activeTab === 'infographic');

  const handleSelectTab = (tab: VisualModalityTab) => {
    setShowAllModalities(false);
    setActiveTab(tab);
  };

  return (
    <section className="rounded-2xl bg-slate-50/90 border border-indigo-200/80 p-4 sm:p-5 space-y-4">
      {/* 도식 상단 헤더 및 시각 모달리티 탭 바 */}
      <div className="space-y-3 border-b border-slate-200/80 pb-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold ${meta.badgeClass}`}
              >
                {meta.icon}
                <span>{meta.labelKo}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
                <Sparkles className="w-3 h-3 text-amber-700 shrink-0" />
                <span className="[overflow-wrap:anywhere]">
                  핵심 테이크어웨이: {blueprint.keyTakeawayBadge}
                </span>
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 pt-0.5">
              {blueprint.diagramTitle}
            </h4>
            <p className="text-xs text-slate-600">{blueprint.diagramSubtitle}</p>
          </div>
        </div>

        {/* 시각 모달리티 탭 바 (Visual Modality Switcher Bar) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectTab('diagram')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold border ${
                !showAllModalities && activeTab === 'diagram'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              {meta.icon}
              <span>1. 핵심 구조 다이어그램</span>
            </button>

            {hasContrastRows && (
              <button
                type="button"
                onClick={() => handleSelectTab('contrast')}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold border ${
                  !showAllModalities && activeTab === 'contrast'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span>2. 통념 vs 과학자-실무자 대조표</span>
              </button>
            )}

            {hasMicroSimulation && (
              <button
                type="button"
                onClick={() => handleSelectTab('simulation')}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold border ${
                  !showAllModalities && activeTab === 'simulation'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                <span>3. 현장 의사결정 미니 시뮬레이션</span>
              </button>
            )}

            {hasIllustration && (
              <button
                type="button"
                onClick={() => handleSelectTab('infographic')}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold border ${
                  !showAllModalities && activeTab === 'infographic'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span>4. 개념 앵커 인포그래픽</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAllModalities((prev) => !prev)}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold border ${
              showAllModalities
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5 shrink-0" />
            <span>
              {showAllModalities
                ? '탭 모드로 개별 보기'
                : '전체 시각화 한눈에 펼치기'}
            </span>
          </button>
        </div>
      </div>

      {/* 1. 토폴로지별 핵심 구조 다이어그램 본문 */}
      {shouldRenderDiagram && (
        <div>
          {blueprint.topology === 'hierarchy-pyramid' &&
            blueprint.pyramidTiers && (
              <HierarchyPyramidDiagram tiers={blueprint.pyramidTiers} />
            )}

          {blueprint.topology === 'concentric-circles' &&
            blueprint.concentricLayers && (
              <ConcentricCirclesDiagram layers={blueprint.concentricLayers} />
            )}

          {blueprint.topology === 'matrix-2x2' && blueprint.matrixAxis && (
            <Matrix2x2Diagram matrixAxis={blueprint.matrixAxis} />
          )}

          {blueprint.topology === 'stacked-gauge' &&
            blueprint.stackedGauges && (
              <StackedGaugeDiagram gauges={blueprint.stackedGauges} />
            )}

          {blueprint.topology === 'process-cycle' && blueprint.processSteps && (
            <ProcessCycleDiagram
              steps={blueprint.processSteps}
              isCyclical={true}
            />
          )}

          {blueprint.topology === 'step-flow' && blueprint.processSteps && (
            <ProcessCycleDiagram
              steps={blueprint.processSteps}
              isCyclical={false}
            />
          )}

          {blueprint.topology === 'spectrum-continuum' &&
            blueprint.continuumStages && (
              <SpectrumContinuumDiagram stages={blueprint.continuumStages} />
            )}

          {blueprint.topology === 'triadic-network' &&
            blueprint.triadicNodes && (
              <TriadicNetworkDiagram triadic={blueprint.triadicNodes} />
            )}
        </div>
      )}

      {/* 2. 통념 vs 과학자-실무자 대조표 */}
      {shouldRenderContrast && blueprint.clinicalContrastRows && (
        <ClinicalContrastTable rows={blueprint.clinicalContrastRows} />
      )}

      {/* 3. 현장 의사결정 미니 시뮬레이션 */}
      {shouldRenderSimulation && blueprint.microSimulation && (
        <MicroSimulationCard
          key={blueprint.theoryId}
          simulation={blueprint.microSimulation}
        />
      )}

      {/* 4. 개념 앵커 인포그래픽 */}
      {shouldRenderInfographic && blueprint.illustrationUrl && (
        <ConceptInfographicCard
          illustrationUrl={blueprint.illustrationUrl}
          illustrationCaption={blueprint.illustrationCaption}
          diagramTitle={blueprint.diagramTitle}
        />
      )}
    </section>
  );
};
