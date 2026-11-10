import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  ExternalLink,
  Filter,
  Network,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import {
  computeCurriculumGraphLayout,
  CROSS_MODULE_BRIDGES,
  getNodeNeighbors,
  getWeakSubgraph
} from '../../data/curriculumGraph';
import {
  EdgeRelation,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  NodeKind,
  WorkspaceTabId
} from '../../types/graph';

interface KnowledgeGraphMapProps {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  nodeMap: Record<string, KnowledgeGraphNode>;
  masteryMap: Record<string, MasteryState>;
  selectedModule: ModuleId | 'all';
  onChangeModule: (mod: ModuleId | 'all') => void;
  weakFocusActive: boolean;
  onToggleWeakFocus: (next: boolean) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onJumpToStory: (moduleId: ModuleId, nodeId: string) => void;
  onJumpToWorkspaceTab: (
    tab: WorkspaceTabId,
    moduleId: ModuleId,
    nodeId: string
  ) => void;
}

const MASTERY_PALETTE: Record<
  MasteryState,
  { fill: string; stroke: string; badgeClass: string; labelKo: string }
> = {
  mastered: {
    fill: '#10b981',
    stroke: '#34d399',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    labelKo: '숙련 완료 (Mastered)'
  },
  review: {
    fill: '#f59e0b',
    stroke: '#fbbf24',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    labelKo: '복습 요망 (Review)'
  },
  weak: {
    fill: '#f43f5e',
    stroke: '#fb7185',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-200',
    labelKo: '취약 노드 (Weak/Again)'
  },
  unseen: {
    fill: '#334155',
    stroke: '#64748b',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    labelKo: '미학습 (Unseen)'
  }
};

const EDGE_COLOR: Record<EdgeRelation, string> = {
  BELONGS_TO_MODULE: '#334155',
  DEFINES_TERM: '#10b981',
  APPLIED_IN_CASE: '#8b5cf6',
  DEFENDS_QUESTION: '#f43f5e',
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
    accent: '#818cf8'
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

export const KnowledgeGraphMap: React.FC<KnowledgeGraphMapProps> = ({
  nodes,
  edges,
  nodeMap,
  masteryMap,
  selectedModule,
  onChangeModule,
  weakFocusActive,
  onToggleWeakFocus,
  selectedNodeId,
  onSelectNode,
  onJumpToStory,
  onJumpToWorkspaceTab
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
    return getNodeNeighbors(activeFocusId, nodeMap, edges);
  }, [activeFocusId, nodeMap, edges]);

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

  const weakActionNodes = useMemo(() => {
    return nodes.filter((n) => {
      const m = masteryMap[n.id] ?? 'unseen';
      return m === 'weak' || m === 'review';
    });
  }, [nodes, masteryMap]);

  return (
    <div className="space-y-5">
      {/* 상단 지식 그래프 컨트롤 & 숙련도 요약 바 */}
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-extrabold text-indigo-900">
              <Network className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>90-Node 도메인 지식 그래프</span>
            </div>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
              전 모듈 90개 원자화 학습 노드(이론 20 · 플래시카드 47 · 사례 10 · 압박면접 13) 실시간 연결망
            </h3>
            <p className="text-xs text-slate-600">
              노드를 클릭하면 우측 슬라이드오버 드로어가 열리며 정의·처방·꼬리질문 확인 및 <strong>스토리 맥락 복귀</strong>가 가능합니다.
            </p>
          </div>

          {/* 실시간 숙련도 분포 카운터 (tabular-nums) */}
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
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-extrabold ${pal.badgeClass}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: pal.fill }}
                  />
                  <span>
                    {pal.labelKo.split(' ')[0]}: {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 필터 & 취약 연결고리 하이라이트 스위치 바 */}
        <div className="pt-3 border-t border-slate-900/[0.06] flex flex-wrap items-center justify-between gap-3">
          {/* 좌측: 노드 유형 필터 */}
          <div className="chip-scroll-row flex items-center gap-1.5 tabular-nums min-w-0 max-w-full">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span>노드 유형:</span>
            </span>
            {(
              [
                { id: 'all', label: '전체 (90)' },
                { id: 'theory', label: '핵심이론 (20)' },
                { id: 'flashcard', label: '플래시카드 (47)' },
                { id: 'case', label: '교실사례 (10)' },
                { id: 'question', label: '압박면접 (13)' }
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setKindFilter(f.id)}
                className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-extrabold border shrink-0 transition-colors ${
                  kindFilter === f.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-700 border-slate-900/[0.08] hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 우측: 취약 연결고리 서브그래프 필터 + 모듈 간 브릿지 토글 + 줌 */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleWeakFocus(!weakFocusActive)}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold border transition-colors ${
                weakFocusActive
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
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
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold border transition-colors ${
                showCrossBridges
                  ? 'bg-amber-50 text-amber-950 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-900/[0.08]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>모듈 간 브릿지 간선 ({CROSS_MODULE_BRIDGES.length})</span>
            </button>

            <div className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-900/[0.08] p-0.5 tabular-nums">
              <button
                type="button"
                onClick={() =>
                  setZoomScale((z) =>
                    Math.max(ZOOM_MIN, Number((z - ZOOM_STEP).toFixed(2)))
                  )
                }
                aria-label="그래프 축소"
                className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-md hover:bg-white text-slate-700"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-bold text-slate-800">
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
                className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-md hover:bg-white text-slate-700"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                aria-label="배율 초기화"
                className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-md hover:bg-white text-slate-500"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 인터랙티브 SVG 90-Node 지식 그래프 캔버스 */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-lg overflow-hidden relative">
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 1360 820"
            className="w-full min-w-[860px] h-auto select-none block"
            role="img"
            aria-label="교육심리학 90개 학습 노드 도메인 지식 그래프"
          >
            <defs>
              <radialGradient id="clusterGlowMod1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="clusterGlowMod2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
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
            </defs>

            <g
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: '680px 410px'
              }}
            >
              {/* 1. 클러스터 배경 링 (전체 모듈 보기 vs 단일 모듈 집중 보기) */}
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
                      strokeOpacity={0.28}
                      strokeWidth={1.5}
                      strokeDasharray="6 6"
                    />
                    <rect
                      x={cluster.cx - 140}
                      y={cluster.cy - 196}
                      width={280}
                      height={24}
                      rx={12}
                      fill="#0f172a"
                      stroke={cluster.accent}
                      strokeOpacity={0.6}
                      strokeWidth={1.2}
                    />
                    <text
                      x={cluster.cx}
                      y={cluster.cy - 180}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="11"
                      fontWeight="800"
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
                    stroke="#6366f1"
                    strokeOpacity={0.35}
                    strokeWidth={1.8}
                    strokeDasharray="8 6"
                  />
                  <text
                    x={680}
                    y={38}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="14"
                    fontWeight="800"
                  >
                    {selectedModule.toUpperCase()} 집중 클러스터 + 모듈 간 전이 브릿지(Cross-Module Bridges)
                  </text>
                </g>
              )}

              {/* 2. 방향성 엣지(간선) 렌더링 */}
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

                let strokeOpacity = isCrossBridge ? 0.55 : 0.32;
                let strokeWidth = isCrossBridge ? 2.2 : 1.3;

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
                    strokeOpacity = 0.08;
                  }
                }

                return (
                  <line
                    key={edge.id}
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={
                      isWeakHighlighted
                        ? '#fb7185'
                        : EDGE_COLOR[edge.relation]
                    }
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={isCrossBridge ? '7 5' : undefined}
                  />
                );
              })}

              {/* 3. 90개 노드 렌더링 */}
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
                  nodeOpacity = 0.22;
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
                    onClick={() => onSelectNode(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className="cursor-pointer"
                    style={{ opacity: nodeOpacity }}
                  >
                    {/* 선택/취약 외곽 링 */}
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
                          isSelected || isHovered ? '#ffffff' : '#fb7185'
                        }
                        strokeWidth={2}
                      />
                    )}

                    {/* 노드 본체 */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill={palette.fill}
                      stroke={
                        isSelected
                          ? '#ffffff'
                          : node.kind === 'theory'
                          ? '#f8fafc'
                          : palette.stroke
                      }
                      strokeWidth={node.kind === 'theory' ? 2.4 : 1.5}
                    />

                    {/* 노드 내부 타입 약어 */}
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

                    {/* 노드 라벨 배지 */}
                    {showLabel && (
                      <g>
                        <rect
                          x={node.x - 58}
                          y={node.y + radius + 4}
                          width={116}
                          height={17}
                          rx={5}
                          fill="#0f172a"
                          fillOpacity={0.92}
                          stroke={isSelected ? '#818cf8' : '#334155'}
                          strokeWidth={1}
                        />
                        <text
                          x={node.x}
                          y={node.y + radius + 15.5}
                          textAnchor="middle"
                          fill="#f1f5f9"
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
        <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-extrabold text-white">간선(Edge) 범례:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              <span>DEFINES_TERM (용어 정의)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-violet-400 inline-block" />
              <span>APPLIED_IN_CASE (사례 처방)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-rose-400 inline-block" />
              <span>DEFENDS_QUESTION (면접 방어)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" />
              <span>CROSS_MODULE_BRIDGE (모듈 간 전이)</span>
            </span>
          </div>

          <span className="text-indigo-300 font-semibold">
            Tip: 노드를 클릭하면 상세 드로어가 열리고 연결된 선수 이론·사례·면접 문항을 즉시 탐색합니다.
          </span>
        </div>
      </div>

      {/* 하단: 취약 노드 & 복습 표적 우선순위 큐 (Weak Subgraph Action Queue) */}
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                취약 노드 &amp; 선수 이론 표적 복습 큐
              </span>
            </span>
            <p className="text-xs text-slate-500">
              스토리 인라인 체크나 워크스페이스에서 <strong>모름(Again)·애매함(Review)</strong>으로 표시되었거나 면접 키워드 커버리지가 부족한 노드들입니다.
            </p>
          </div>

          <span className="rounded-lg bg-slate-100 border border-slate-900/[0.08] px-3 py-1 text-xs font-extrabold text-slate-700 tabular-nums shrink-0">
            현재 표적 복습 노드: {weakActionNodes.length}개
          </span>
        </div>

        {weakActionNodes.length === 0 ? (
          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold text-emerald-950">
                  현재 취약(Weak/Again) 또는 복습 요망(Review)으로 분류된 노드가 없습니다.
                </p>
                <p className="text-xs text-emerald-800">
                  플래시카드 탭에서 헷갈리는 용어에 Again/Review를 표시하거나 압박 면접 초안을 작성하면 이곳에 표적 복습 경로가 자동 생성됩니다.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onJumpToWorkspaceTab(
                  'flashcards',
                  selectedModule === 'all' ? 'mod1' : selectedModule,
                  'mod1-fc-zpd'
                )
              }
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white shrink-0"
            >
              <span>플래시카드 진단 시작하기</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {weakActionNodes.slice(0, 12).map((node) => {
              const mState = masteryMap[node.id] ?? 'unseen';
              const targetTab: WorkspaceTabId =
                node.kind === 'theory'
                  ? 'theories'
                  : node.kind === 'flashcard'
                  ? 'flashcards'
                  : node.kind === 'case'
                  ? 'cases'
                  : 'interview';

              return (
                <div
                  key={node.id}
                  className="surface-subtle p-3.5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase tabular-nums">
                        {node.moduleId.toUpperCase()} · {node.kind}
                      </span>
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-extrabold ${
                          mState === 'weak'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {mState === 'weak' ? 'Weak / Again' : 'Review'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 [overflow-wrap:anywhere]">
                      {node.titleKo}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 [overflow-wrap:anywhere]">
                      {node.titleEn}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => onSelectNode(node.id)}
                      className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 px-2.5 py-1 text-[11px] font-extrabold text-slate-800"
                    >
                      <Network className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span>노드 상세</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onJumpToStory(node.moduleId, node.id)}
                      className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 text-[11px] font-extrabold text-indigo-800"
                    >
                      <Compass className="w-3 h-3 shrink-0" />
                      <span>스토리 맥락</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onJumpToWorkspaceTab(targetTab, node.moduleId, node.id)
                      }
                      className="inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 px-2.5 py-1 text-[11px] font-extrabold text-white"
                    >
                      <span>훈련 탭 이동</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
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
