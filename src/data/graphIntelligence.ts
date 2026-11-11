import {
  CurriculumGraphData,
  MASTERY_NUMERIC_WEIGHTS
} from './curriculumGraph';
import {
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  ModuleSubgraphSummary,
  PrioritizedWeakNodeItem,
  ResumeStudyTarget,
  UnifiedProgressGraph
} from '../types/graph';
import { ModulePayload } from '../types/study';

const WEAK_SEVERITY_SCORE = 2.0;
const REVIEW_SEVERITY_SCORE = 1.15;
const DEGREE_IMPACT_FACTOR = 0.18;
const CROSS_BRIDGE_BONUS_FACTOR = 0.35;
const PERCENTAGE_SCALE = 100;
const DEFAULT_WEAK_QUEUE_LIMIT = 12;
const DEFAULT_STARTER_NODE_ID = 'mod1-theory-piaget';

/**
 * 애플 홈 히어로 '이어서 학습하기' 최적 정점 추론기:
 * 1) 최근 열람 노드(lastActiveNodeId)가 유효하고 소속 모듈이 미완주이면 해당 정점으로 복귀
 * 2) 소속 모듈이 이미 완주되었다면 CROSS_MODULE_BRIDGE 출향 정점 중 아직 미숙련(unseen/weak/review)인 다음 모듈 브릿지 이론을 우선 제안
 * 3) 그 외 미완주 첫 모듈의 선두 이론 또는 기본 출발 정점으로 안전 폴백
 */
export function resolveOptimalResumeTarget(
  modules: ModulePayload[],
  graph: CurriculumGraphData,
  userProgress: UnifiedProgressGraph,
  masteryMap: Record<string, MasteryState>
): ResumeStudyTarget {
  const completedSet = new Set<ModuleId>(userProgress.story.completedModules);
  const moduleById = new Map<ModuleId, ModulePayload>();
  for (const mod of modules) {
    moduleById.set(mod.id, mod);
  }

  const lastId = userProgress.story.lastActiveNodeId;
  const lastNode =
    lastId && graph.nodeMap[lastId] && graph.nodeMap[lastId].kind !== 'module'
      ? graph.nodeMap[lastId]
      : null;

  if (lastNode) {
    const ownerMod = moduleById.get(lastNode.moduleId) ?? modules[0];
    if (!completedSet.has(lastNode.moduleId)) {
      return {
        nodeId: lastNode.id,
        moduleId: lastNode.moduleId,
        moduleNumber: ownerMod.number,
        nodeTitleKo: lastNode.titleKo,
        moduleTitleKo: ownerMod.title,
        reason: 'last-active'
      };
    }

    // 소속 모듈이 완주된 상태라면 연결된 모듈 간 거시 브릿지(CROSS_MODULE_BRIDGE) 후속 정점 탐색
    const modBridgeEdges =
      graph.adjacency.crossBridgesByModule[lastNode.moduleId] ?? [];
    for (const edge of modBridgeEdges) {
      const candidateId =
        edge.source === lastNode.id ||
        graph.nodeMap[edge.source]?.moduleId === lastNode.moduleId
          ? edge.target
          : edge.source;
      const candidateNode = graph.nodeMap[candidateId];
      if (
        candidateNode &&
        candidateNode.moduleId !== lastNode.moduleId &&
        masteryMap[candidateNode.id] !== 'mastered'
      ) {
        const targetMod =
          moduleById.get(candidateNode.moduleId) ?? modules[0];
        return {
          nodeId: candidateNode.id,
          moduleId: candidateNode.moduleId,
          moduleNumber: targetMod.number,
          nodeTitleKo: candidateNode.titleKo,
          moduleTitleKo: targetMod.title,
          reason: 'bridge-next'
        };
      }
    }

    return {
      nodeId: lastNode.id,
      moduleId: lastNode.moduleId,
      moduleNumber: ownerMod.number,
      nodeTitleKo: lastNode.titleKo,
      moduleTitleKo: ownerMod.title,
      reason: 'last-active'
    };
  }

  const firstUnfinishedMod =
    modules.find((m) => !completedSet.has(m.id)) ?? modules[0];
  const leadNodeId =
    firstUnfinishedMod?.theories[0]?.id ?? DEFAULT_STARTER_NODE_ID;
  const leadNode = graph.nodeMap[leadNodeId];

  return {
    nodeId: leadNodeId,
    moduleId: firstUnfinishedMod?.id ?? 'mod1',
    moduleNumber: firstUnfinishedMod?.number ?? 1,
    nodeTitleKo: leadNode?.titleKo ?? '피아제 인지발달이론과 신피아제 학파의 재해석',
    moduleTitleKo: firstUnfinishedMod?.title ?? '인지·자아·사회·도덕성 발달',
    reason: 'starter'
  };
}

/**
 * M1~M5 모듈별 유도 서브그래프(Induced Subgraph) 숙련도 및 브릿지 텔레메트리 집계
 */
export function computeModuleSubgraphSummaries(
  modules: ModulePayload[],
  graph: CurriculumGraphData,
  masteryMap: Record<string, MasteryState>,
  masteryScoreMap: Record<string, number>,
  completedModules: ModuleId[]
): ModuleSubgraphSummary[] {
  const completedSet = new Set<ModuleId>(completedModules);

  return modules.map((mod) => {
    const modNodes = graph.adjacency.nodesByModule[mod.id] ?? [];
    let masteredCount = 0;
    let reviewCount = 0;
    let weakCount = 0;
    let unseenCount = 0;
    let scoreSum = 0;

    for (const node of modNodes) {
      const state = masteryMap[node.id] ?? 'unseen';
      if (state === 'mastered') masteredCount += 1;
      else if (state === 'review') reviewCount += 1;
      else if (state === 'weak') weakCount += 1;
      else unseenCount += 1;

      scoreSum +=
        masteryScoreMap[node.id] ?? MASTERY_NUMERIC_WEIGHTS[state] ?? 0;
    }

    const totalNodes = modNodes.length;
    const masteryPercent =
      totalNodes > 0
        ? Math.round((scoreSum / totalNodes) * PERCENTAGE_SCALE)
        : 0;
    const crossBridgeCount = (
      graph.adjacency.crossBridgesByModule[mod.id] ?? []
    ).length;

    return {
      moduleId: mod.id,
      moduleNumber: mod.number,
      titleKo: mod.title,
      subtitleEn: mod.subtitle,
      sourceMapping: mod.sourceMapping,
      totalNodes,
      masteredCount,
      reviewCount,
      weakCount,
      unseenCount,
      masteryPercent,
      crossBridgeCount,
      isCompleted: completedSet.has(mod.id),
      leadTheoryId: mod.theories[0]?.id ?? mod.id
    };
  });
}

/**
 * 위상 파급도(Topological Impact: 심각도 * [1 + 차수 가중치 + 모듈 브릿지 허브 보너스]) 기반 우선순위 복습 큐 산출
 */
export function computePrioritizedWeakQueue(
  graph: CurriculumGraphData,
  masteryMap: Record<string, MasteryState>,
  limit: number = DEFAULT_WEAK_QUEUE_LIMIT
): PrioritizedWeakNodeItem[] {
  const queue: PrioritizedWeakNodeItem[] = [];

  for (const node of graph.nodes) {
    const state = masteryMap[node.id] ?? 'unseen';
    if (state !== 'weak' && state !== 'review') {
      continue;
    }

    const outEdges = graph.adjacency.outgoingByNode[node.id] ?? [];
    const inEdges = graph.adjacency.incomingByNode[node.id] ?? [];
    const semanticDegree = outEdges.length + inEdges.length;
    const isBridgeHub =
      outEdges.some((e) => e.relation === 'CROSS_MODULE_BRIDGE') ||
      inEdges.some((e) => e.relation === 'CROSS_MODULE_BRIDGE');

    const severity =
      state === 'weak' ? WEAK_SEVERITY_SCORE : REVIEW_SEVERITY_SCORE;
    const impactFactor =
      1 +
      DEGREE_IMPACT_FACTOR * semanticDegree +
      (isBridgeHub ? CROSS_BRIDGE_BONUS_FACTOR : 0);
    const priorityScore = Math.round(severity * impactFactor * 100) / 100;

    let prerequisiteTheoryNode: KnowledgeGraphNode | null = null;
    if (node.kind !== 'theory') {
      const parentEdge = inEdges.find(
        (edge) => graph.nodeMap[edge.source]?.kind === 'theory'
      );
      if (parentEdge && graph.nodeMap[parentEdge.source]) {
        prerequisiteTheoryNode = graph.nodeMap[parentEdge.source];
      }
    } else {
      const incomingBridge = inEdges.find(
        (edge) =>
          edge.relation === 'CROSS_MODULE_BRIDGE' &&
          graph.nodeMap[edge.source]?.kind === 'theory'
      );
      if (incomingBridge && graph.nodeMap[incomingBridge.source]) {
        prerequisiteTheoryNode = graph.nodeMap[incomingBridge.source];
      }
    }

    queue.push({
      node,
      mastery: state,
      priorityScore,
      semanticDegree,
      isBridgeHub,
      prerequisiteTheoryNode
    });
  }

  queue.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return a.node.storyOrder - b.node.storyOrder;
  });

  return queue.slice(0, limit);
}
