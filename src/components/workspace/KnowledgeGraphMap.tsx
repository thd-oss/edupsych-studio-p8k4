import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Filter,
  Network,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  computeCurriculumGraphLayout,
  computeQuadraticEdgePath,
  CROSS_BRIDGE_EDGE_CURVATURE,
  CROSS_MODULE_BRIDGES,
  getNodeNeighbors,
  getWeakSubgraph,
  INTRA_MODULE_EDGE_CURVATURE
} from '../../data/curriculumGraph';
import {
  EdgeRelation,
  GraphAdjacencyIndex,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  NodeKind,
  PrioritizedWeakNodeItem
} from '../../types/graph';

interface KnowledgeGraphMapProps {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  nodeMap: Record<string, KnowledgeGraphNode>;
  adjacency: GraphAdjacencyIndex;
  masteryMap: Record<string, MasteryState>;
  prioritizedWeakQueue: PrioritizedWeakNodeItem[];
  selectedModule: ModuleId | 'all';
  onChangeModule: (mod: ModuleId | 'all') => void;
  weakFocusActive: boolean;
  onToggleWeakFocus: (next: boolean) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onNavigateCanonical: (nodeId: string) => void;
}

const MASTERY_PALETTE: Record<
  MasteryState,
  { fill: string; stroke: string; badgeClass: string; labelKo: string }
> = {
  mastered: {
    fill: '#10b981',
    stroke: '#34d399',
    badgeClass: 'bg-emerald-500/12 text-emerald-800 border-emerald-500/20',
    labelKo: '숙련 완료 (Mastered)'
  },
  review: {
    fill: '#f59e0b',
    stroke: '#fbbf24',
    badgeClass: 'bg-amber-500/15 text-amber-900 border-amber-500/25',
    labelKo: '복습 요망 (Review)'
  },
  weak: {
    fill: '#f43f5e',
    stroke: '#fb7185',
    badgeClass: 'bg-rose-500/12 text-rose-800 border-rose-500/20',
    labelKo: '취약 노드 (Weak/Again)'
  },
  unseen: {
    fill: '#48484a',
    stroke: '#636366',
    badgeClass: 'bg-[#f5f5f7] text-[#424245] border-black/[0.06]',
    labelKo: '미학습 (Unseen)'
  }
};

const EDGE_COLOR: Record<EdgeRelation, string> = {
  BELONGS_TO_MODULE: '#3a3a3c',
  DEFINES_TERM: '#34d399',
  APPLIED_IN_CASE: '#a78bfa',
  DEFENDS_QUESTION: '#fb7185',
  CROSS_MODULE_BRIDGE: '#fbbf24'
};

const CLUSTER_META: Array<{
  id: ModuleId;
  title: string;
  cx: number;
  cy: number;
  accent: string;
}> = [
  {
    id: 'mod1',
    title: 'Mod 1. 발달 (피아제·비고츠키·브론펜브레너·도덕)',
    cx: 250,
    cy: 235,
    accent: '#38bdf8'
  },
  {
    id: 'mod2',
    title: 'Mod 2. 학습자 다양성 (CHC·CLT·보철·RTI·ADHD)',
    cx: 680,
    cy: 215,
    accent: '#2997ff'
  },
  {
    id: 'mod3',
    title: 'Mod 3. 행동주의 & FBA/PBS (사전교정·FCT)',
    cx: 1110,
    cy: 235,
    accent: '#34d399'
  },
  {
    id: 'mod4',
    title: 'Mod 4. 인지·자기조절 (작업기억·청킹·SRL·자기교수)',
    cx: 430,
    cy: 610,
    accent: '#c084fc'
  },
  {
    id: 'mod5',
    title: 'Mod 5. 동기 & 상담 (SDT·귀인·자기가치·회복적 정의)',
    cx: 930,
    cy: 610,
    accent: '#fbbf24'
  }
];

const ZOOM_MIN = 0.85;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.15;
const MAX_DISPLAY_WEAK_CARDS = 12;

export const KnowledgeGraphMap: React.FC<KnowledgeGraphMapProps> = ({
  nodes,
  edges,
  nodeMap,
  adjacency,
  masteryMap,
  prioritizedWeakQueue,
  selectedModule,
  onChangeModule,
  weakFocusActive,
  onToggleWeakFocus,
  selectedNodeId,
  onSelectNode,
  onNavigateCanonical
}) => {
  const [kindFilter, setKindFilter] = useState<
    'all' | Exclude<NodeKind, 'module'>
  >('all');
  const [showCrossBridges, setShowCrossBridges] = useState<boolean>(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const positionedNodes = useMemo(
    () => computeCurriculumGraphLayout(nodes, edges, selectedModule),
    [nodes, edges, selectedModule]
  );

  const positionedMap = useMemo(() => {
    const map: Record<string, (typeof positionedNodes)[number]> = {};
    for (const p of positionedNodes) {
      map[p.id] = p;
    }
    return map;
  }, [positionedNodes]);

  const weakSubgraph = useMemo(
    () => getWeakSubgraph(nodes, edges, masteryMap),
    [nodes, edges, masteryMap]
  );

  const activeFocusId = hoveredNodeId ?? selectedNodeId;
  const activeFocusNeighbors = useMemo(() => {
    if (!activeFocusId) return null;
    return getNodeNeighbors(activeFocusId, nodeMap, edges, adjacency);
  }, [activeFocusId, nodeMap, edges, adjacency]);

  const visibleEdges = useMemo(() => {
    return edges.filter((edge) => {
      if (edge.relation === 'BELONGS_TO_MODULE') return false;
      if (edge.relation === 'CROSS_MODULE_BRIDGE' && !showCrossBridges) {
        return false;
      }
      const src = positionedMap[edge.source];
      const tgt = positionedMap[edge.target];
      if (!src || !tgt) return false;
      if (
        kindFilter !== 'all' &&
        src.kind !== kindFilter &&
        tgt.kind !== kindFilter
      ) {
        return false;
      }
      return true;
    });
  }, [edges, positionedMap, showCrossBridges, kindFilter]);

  const masteryStats = useMemo(() => {
    let mastered = 0;
    let review = 0;
    let weak = 0;
    let unseen = 0;
    for (const n of nodes) {
      const s = masteryMap[n.id] ?? 'unseen';
      if (s === 'mastered') mastered += 1;
      else if (s === 'review') review += 1;
      else if (s === 'weak') weak += 1;
      else unseen += 1;
    }
    return { mastered, review, weak, unseen };
  }, [nodes, masteryMap]);

  return (
    <div className="space-y-5">
      {/* 상단 지식 그래프 컨트롤 & 숙련도 요약 바 */}
      <div className="bento-tile-white p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent-solid)]">
              <Network className="w-3.5 h-3.5 shrink-0" />
              <span>90-Node 도메인 지식그래프 · 곡률 스플라인 토폴로지</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">
              전 모듈 90개 원자화 학습 노드(이론 20 · 단어장 47 · 사례 10 · 90초 면접 13) 연결망
            </h3>
            <p className="text-xs sm:text-sm text-[#6e6e73]">
              정점을 클릭하거나 Tab + Enter로 선택하면 우측 상세 드로어가 열리며 1-Hop 연결 탐색 및 <strong>해당 학습 화면 직행</strong>이 가능합니다.
            </p>
          </div>

          {/* 실시간 숙련도 분포 카운터 */}
          <div className="flex flex-wrap items-center gap-2 tabular-nums">
            {(
              [
                { key: 'mastered', count: masteryStats.mastered },
                { key: 'review', count: masteryStats.review },
                { key: 'weak', count: masteryStats.weak },
                { key: 'unseen', count: masteryStats.unseen }
              ] as const
            ).map((item) => {
              const pal = MASTERY_PALETTE[item.key];
              return (
                <div
                  key={item.key}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${pal.badgeClass}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: pal.fill }}
                  />
                  <span>
                    {pal.labelKo.split(' ')[0]} {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 필터 & 취약 연결고리 하이라이트 스위치 바 */}
        <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="chip-scroll-row flex items-center gap-1.5 tabular-nums min-w-0 max-w-full">
            <span className="text-xs font-semibold text-[#6e6e73] mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span>유형:</span>
            </span>
            {(
              [
                { id: 'all', label: '전체 (90)' },
                { id: 'theory', label: '핵심이론 (20)' },
                { id: 'flashcard', label: '단어장 (47)' },
                { id: 'case', label: '임상사례 (10)' },
                { id: 'question', label: '90초 면접 (13)' }
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setKindFilter(f.id)}
                className={`min-h-[34px] rounded-full px-3.5 py-1 text-xs font-semibold shrink-0 transition-colors ${
                  kindFilter === f.id
                    ? 'bg-[#1d1d1f] text-white'
                    : 'bg-[#f5f5f7] text-[#424245] hover:bg-black/[0.07]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleWeakFocus(!weakFocusActive)}
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                weakFocusActive
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-500/12 text-rose-700 hover:bg-rose-500/18'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {weakFocusActive
                  ? '취약 연결고리 하이라이트 중'
                  : '취약 연결고리만 하이라이트'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowCrossBridges((prev) => !prev)}
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                showCrossBridges
                  ? 'bg-amber-500/15 text-amber-900'
                  : 'bg-[#f5f5f7] text-[#6e6e73]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>모듈 간 브릿지 ({CROSS_MODULE_BRIDGES.length})</span>
            </button>

            <div className="inline-flex items-center rounded-full bg-[#f5f5f7] p-0.5 tabular-nums">
              <button
                type="button"
                onClick={() =>
                  setZoomScale((z) =>
                    Math.max(ZOOM_MIN, Number((z - ZOOM_STEP).toFixed(2)))
                  )
                }
                aria-label="그래프 축소"
                className="min-h-[30px] min-w-[30px] inline-flex items-center justify-center rounded-full hover:bg-white text-[#424245]"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-bold text-[#1d1d1f]">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoomScale((z) =>
                    Math.min(ZOOM_MAX, Number((z + ZOOM_STEP).toFixed(2)))
                  )
                }
                aria-label="그래프 확대"
                className="min-h-[30px] min-w-[30px] inline-flex items-center justify-center rounded-full hover:bg-white text-[#424245]"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                aria-label="배율 초기화"
                className="min-h-[30px] min-w-[30px] inline-flex items-center justify-center rounded-full hover:bg-white text-[#6e6e73]"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 인터랙티브 SVG 90-Node 지식 그래프 캔버스 */}
      <div className="rounded-[28px] bg-[#141416] border border-white/10 shadow-[var(--shadow-elevated)] overflow-hidden relative">
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 1360 820"
            className="w-full min-w-[860px] h-auto select-none block"
            role="group"
            aria-label="교육심리학 90개 학습 노드 도메인 지식그래프"
          >
            <defs>
              <radialGradient id="clusterGlowMod1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="clusterGlowMod2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0071e3" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="clusterGlowMod3" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="clusterGlowMod4" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="clusterGlowMod5" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
              </radialGradient>

              <marker
                id="arrowBridge"
                viewBox="0 0 10 10"
                refX="16"
                refY="5"
                markerWidth="5.5"
                markerHeight="5.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#fbbf24" />
              </marker>
            </defs>

            <g
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: '680px 410px'
              }}
            >
              {/* 1. 클러스터 배경 링 */}
              {selectedModule === 'all' ? (
                CLUSTER_META.map((cluster, idx) => (
                  <g
                    key={cluster.id}
                    onClick={() => onChangeModule(cluster.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={cluster.cx}
                      cy={cluster.cy}
                      r={195}
                      fill={`url(#clusterGlowMod${idx + 1})`}
                      stroke={cluster.accent}
                      strokeOpacity={0.26}
                      strokeWidth={1.4}
                      strokeDasharray="6 6"
                    />
                    <rect
                      x={cluster.cx - 142}
                      y={cluster.cy - 196}
                      width={284}
                      height={24}
                      rx={12}
                      fill="#1d1d1f"
                      stroke={cluster.accent}
                      strokeOpacity={0.55}
                      strokeWidth={1.1}
                    />
                    <text
                      x={cluster.cx}
                      y={cluster.cy - 180}
                      textAnchor="middle"
                      fill="#f5f5f7"
                      fontSize="11"
                      fontWeight="700"
                    >
                      {cluster.title}
                    </text>
                  </g>
                ))
              ) : (
                <g>
                  <circle
                    cx={680}
                    cy={410}
                    r={365}
                    fill="url(#clusterGlowMod2)"
                    stroke="#2997ff"
                    strokeOpacity={0.35}
                    strokeWidth={1.6}
                    strokeDasharray="8 6"
                  />
                  <text
                    x={680}
                    y={38}
                    textAnchor="middle"
                    fill="#f5f5f7"
                    fontSize="14"
                    fontWeight="700"
                  >
                    {selectedModule.toUpperCase()} 집중 클러스터 + 모듈 간 전이 브릿지(Cross-Module Bridges)
                  </text>
                </g>
              )}

              {/* 2. 2차 베지어 곡선 스플라인 간선 */}
              {visibleEdges.map((edge) => {
                const src = positionedMap[edge.source];
                const tgt = positionedMap[edge.target];
                if (!src || !tgt) return null;

                const isCrossBridge = edge.relation === 'CROSS_MODULE_BRIDGE';
                const isWeakHighlighted =
                  weakFocusActive && weakSubgraph.highlightedEdgeIds.has(edge.id);
                const isNeighborEdge =
                  activeFocusId &&
                  (edge.source === activeFocusId ||
                    edge.target === activeFocusId);

                let strokeOpacity = isCrossBridge ? 0.62 : 0.34;
                let strokeWidth = isCrossBridge ? 2.2 : 1.35;

                if (weakFocusActive) {
                  if (isWeakHighlighted) {
                    strokeOpacity = 0.95;
                    strokeWidth = 2.6;
                  } else {
                    strokeOpacity = 0.06;
                  }
                } else if (activeFocusId) {
                  if (isNeighborEdge) {
                    strokeOpacity = 0.95;
                    strokeWidth = 2.6;
                  } else {
                    strokeOpacity = 0.07;
                  }
                }

                const dPath = computeQuadraticEdgePath(
                  src.x,
                  src.y,
                  tgt.x,
                  tgt.y,
                  isCrossBridge
                    ? CROSS_BRIDGE_EDGE_CURVATURE
                    : INTRA_MODULE_EDGE_CURVATURE
                );

                return (
                  <path
                    key={edge.id}
                    d={dPath}
                    fill="none"
                    stroke={
                      isWeakHighlighted
                        ? '#fb7185'
                        : EDGE_COLOR[edge.relation]
                    }
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={isCrossBridge ? '7 5' : undefined}
                    markerEnd={
                      isCrossBridge && strokeOpacity > 0.2
                        ? 'url(#arrowBridge)'
                        : undefined
                    }
                  />
                );
              })}

              {/* 3. 90개 키보드·포인터 접근 가능 노드 */}
              {positionedNodes.map((node) => {
                if (kindFilter !== 'all' && node.kind !== kindFilter) {
                  return null;
                }

                const mastery = masteryMap[node.id] ?? 'unseen';
                const palette = MASTERY_PALETTE[mastery];
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;

                const isWeakHighlighted =
                  weakFocusActive &&
                  weakSubgraph.highlightedNodeIds.has(node.id);
                const isNeighbor =
                  activeFocusNeighbors?.connectedNodeIds.has(node.id) ?? false;

                let nodeOpacity = 1;
                if (weakFocusActive && !isWeakHighlighted) {
                  nodeOpacity = 0.14;
                } else if (
                  !weakFocusActive &&
                  activeFocusId &&
                  !isNeighbor
                ) {
                  nodeOpacity = 0.2;
                }

                const radius =
                  node.kind === 'theory'
                    ? selectedModule === 'all'
                      ? 16
                      : 24
                    : node.kind === 'case' || node.kind === 'question'
                    ? selectedModule === 'all'
                      ? 11
                      : 16
                    : selectedModule === 'all'
                    ? 8.5
                    : 13;

                const showLabel =
                  node.kind === 'theory' ||
                  selectedModule !== 'all' ||
                  isSelected ||
                  isHovered ||
                  (weakFocusActive && weakSubgraph.weakNodeIds.has(node.id));

                const shortLabel =
                  node.titleKo.length > 14
                    ? `${node.titleKo.slice(0, 14)}…`
                    : node.titleKo;

                return (
                  <g
                    key={node.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${node.moduleId.toUpperCase()} ${node.titleKo} (${palette.labelKo})`}
                    onClick={() => onSelectNode(node.id)}
                    onFocus={() => setHoveredNodeId(node.id)}
                    onBlur={() => setHoveredNodeId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectNode(node.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className="cursor-pointer focus:outline-none"
                    style={{ opacity: nodeOpacity }}
                  >
                    {(isSelected ||
                      isHovered ||
                      (weakFocusActive &&
                        weakSubgraph.weakNodeIds.has(node.id))) && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius + 6}
                        fill="none"
                        stroke={
                          isSelected || isHovered ? '#2997ff' : '#fb7185'
                        }
                        strokeWidth={2.2}
                      />
                    )}

                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill={palette.fill}
                      stroke={
                        isSelected
                          ? '#ffffff'
                          : node.kind === 'theory'
                          ? '#f5f5f7'
                          : palette.stroke
                      }
                      strokeWidth={node.kind === 'theory' ? 2.4 : 1.5}
                    />

                    {(node.kind === 'theory' || selectedModule !== 'all') && (
                      <text
                        x={node.x}
                        y={node.y + 3.5}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={node.kind === 'theory' ? '9.5' : '8'}
                        fontWeight="800"
                      >
                        {node.kind === 'theory'
                          ? 'TH'
                          : node.kind === 'flashcard'
                          ? 'FC'
                          : node.kind === 'case'
                          ? 'CS'
                          : 'Q'}
                      </text>
                    )}

                    {showLabel && (
                      <g>
                        <rect
                          x={node.x - 58}
                          y={node.y + radius + 4}
                          width={116}
                          height={18}
                          rx={6}
                          fill="#1d1d1f"
                          fillOpacity={0.94}
                          stroke={isSelected ? '#2997ff' : 'rgba(255,255,255,0.16)'}
                          strokeWidth={1}
                        />
                        <text
                          x={node.x}
                          y={node.y + radius + 16}
                          textAnchor="middle"
                          fill="#f5f5f7"
                          fontSize="9"
                          fontWeight="700"
                        >
                          {shortLabel}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* 캔버스 하단 범례 바 */}
        <div className="bg-[#1d1d1f] border-t border-white/10 px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/75">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="font-bold text-white">간선(Edge) 범례:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              <span>DEFINES_TERM (용어 정의)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-violet-400 inline-block" />
              <span>APPLIED_IN_CASE (사례 처방)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-400 inline-block" />
              <span>DEFENDS_QUESTION (면접 방어)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" />
              <span>CROSS_MODULE_BRIDGE (모듈 간 방향 전이)</span>
            </span>
          </div>

          <span className="text-[#66b2ff] font-medium">
            Tip: 정점을 클릭하거나 Tab + Enter를 누르면 우측 상세 드로어가 열립니다.
          </span>
        </div>
      </div>

      {/* 하단: 위상 파급도 우선순위 복습 큐 */}
      <div className="bento-tile-white p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                위상 파급도 기반 우선순위 복습 큐 (Topological Impact Queue)
              </span>
            </span>
            <p className="text-xs text-[#6e6e73]">
              심각도(Again/Review), 의미 연결 차수, 모듈 간 브릿지 허브 여부를 합산하여 가장 파급력이 큰 취약 정점부터 정렬합니다.
            </p>
          </div>

          <span className="rounded-full bg-[#f5f5f7] px-3.5 py-1 text-xs font-semibold text-[#1d1d1f] tabular-nums shrink-0">
            표적 복습 대기: {prioritizedWeakQueue.length}개
          </span>
        </div>

        {prioritizedWeakQueue.length === 0 ? (
          <div className="rounded-[20px] bg-[#f5f5f7] p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-[#1d1d1f]">
                  현재 취약(Weak/Again) 또는 복습 요망(Review)으로 분류된 정점이 없습니다.
                </p>
                <p className="text-xs text-[#6e6e73]">
                  단어장에서 헷갈리는 용어에 Again/Review를 표시하거나 90초 면접 초안을 작성하면 우선순위 복습 큐가 생성됩니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateCanonical('mod1-fc-zpd')}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] px-4 py-2 text-xs font-semibold text-white shrink-0 transition-colors"
            >
              <span>단어장 진단 시작</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {prioritizedWeakQueue
              .slice(0, MAX_DISPLAY_WEAK_CARDS)
              .map((item) => {
                const { node, mastery: mState } = item;

                return (
                  <div
                    key={node.id}
                    className="rounded-[20px] bg-[#f5f5f7] p-4 flex flex-col justify-between gap-3 border border-black/[0.04] tabular-nums"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="rounded-full bg-[#1d1d1f] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                          {node.moduleId.toUpperCase()} · 차수 {item.semanticDegree}
                          {item.isBridgeHub ? ' · 브릿지' : ''}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            mState === 'weak'
                              ? 'bg-rose-500/15 text-rose-800'
                              : 'bg-amber-500/18 text-amber-900'
                          }`}
                        >
                          파급도 {item.priorityScore.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#1d1d1f] [overflow-wrap:anywhere]">
                        {node.titleKo}
                      </p>
                      {item.prerequisiteTheoryNode ? (
                        <button
                          type="button"
                          onClick={() =>
                            onSelectNode(item.prerequisiteTheoryNode!.id)
                          }
                          className="text-[11px] font-semibold text-[var(--accent-solid)] hover:underline text-left truncate max-w-full block"
                        >
                          선수 이론: {item.prerequisiteTheoryNode.titleKo}
                        </button>
                      ) : (
                        <p className="text-[11px] text-[#6e6e73] line-clamp-1">
                          {node.titleEn}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2.5 border-t border-black/[0.06]">
                      <button
                        type="button"
                        onClick={() => onSelectNode(node.id)}
                        className="inline-flex min-h-[30px] items-center gap-1 rounded-full bg-white hover:bg-black/[0.04] border border-black/[0.07] px-3 py-1 text-[11px] font-semibold text-[#1d1d1f]"
                      >
                        <span>노드 상세</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigateCanonical(node.id)}
                        className="inline-flex min-h-[30px] items-center gap-1 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] px-3.5 py-1 text-[11px] font-semibold text-white"
                      >
                        <span>학습하러 이동</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
