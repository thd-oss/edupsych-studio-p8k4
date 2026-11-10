import {
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MasteryState,
  ModuleId,
  PositionedGraphNode,
  StoryBeatDescriptor
} from '../types/graph';
import { ModulePayload } from '../types/study';
import { VisualTopologyType } from '../types/visuals';
import { resolveAssetUrl } from '../utils/assetUrl';
import { getTheoryVisualBlueprint } from './theoryVisuals';

export interface TheoryEdgeMapping {
  topology: VisualTopologyType;
  flashcards: string[];
  cases: string[];
  questions: string[];
}

// 명세서 섹션 2.3 전 모듈 90개 원자화 노드 전수 매핑 테이블
export const THEORY_GRAPH_MAPPING: Record<string, TheoryEdgeMapping> = {
  // Module 1 (16 nodes: 이론 4 · 플래시카드 8 · 사례 2 · 면접 2)
  'mod1-theory-piaget': {
    topology: 'step-flow',
    flashcards: ['mod1-fc-equilibration', 'mod1-fc-neopiagetian'],
    cases: ['mod1-case-hostile'],
    questions: ['mod1-q-piaget-vygotsky']
  },
  'mod1-theory-vygotsky': {
    topology: 'concentric-circles',
    flashcards: ['mod1-fc-zpd', 'mod1-fc-scaffolding', 'mod1-fc-privatespeech'],
    cases: ['mod1-case-foreclosure'],
    questions: ['mod1-q-piaget-vygotsky']
  },
  'mod1-theory-ecological': {
    topology: 'concentric-circles',
    flashcards: ['mod1-fc-mesosystem', 'mod1-fc-identitystatus'],
    cases: ['mod1-case-foreclosure'],
    questions: ['mod1-q-piaget-vygotsky']
  },
  'mod1-theory-moral': {
    topology: 'process-cycle',
    flashcards: ['mod1-fc-hostileattribution'],
    cases: ['mod1-case-hostile'],
    questions: ['mod1-q-moral-sip']
  },

  // Module 2 (17 nodes: 이론 4 · 플래시카드 9 · 사례 2 · 면접 2)
  'mod2-theory-chc': {
    topology: 'hierarchy-pyramid',
    flashcards: ['mod2-fc-chc', 'mod2-fc-wmi-psi', 'mod2-fc-meshing'],
    cases: ['mod2-case-wisc-bottleneck'],
    questions: ['mod2-q-chc-clt']
  },
  'mod2-theory-clt-prosthetics': {
    topology: 'stacked-gauge',
    flashcards: [
      'mod2-fc-schema-automatization',
      'mod2-fc-clt',
      'mod2-fc-prosthetics'
    ],
    cases: ['mod2-case-wisc-bottleneck'],
    questions: ['mod2-q-chc-clt']
  },
  'mod2-theory-rti': {
    topology: 'hierarchy-pyramid',
    flashcards: ['mod2-fc-rti'],
    cases: ['mod2-case-wisc-bottleneck', 'mod2-case-adhd-drc'],
    questions: ['mod2-q-rti-adhd']
  },
  'mod2-theory-adhd': {
    topology: 'triadic-network',
    flashcards: ['mod2-fc-inhibition', 'mod2-fc-drc'],
    cases: ['mod2-case-adhd-drc'],
    questions: ['mod2-q-rti-adhd']
  },

  // Module 3 (19 nodes: 이론 4 · 플래시카드 10 · 사례 2 · 면접 3)
  'mod3-theory-operant-punishment': {
    topology: 'matrix-2x2',
    flashcards: [
      'mod3-fc-negative-reinforcement',
      'mod3-fc-presentation-removal-punishment'
    ],
    cases: ['mod3-case-aggression-escape', 'mod3-case-escape'],
    questions: ['mod3-q-fba-pbs']
  },
  'mod3-theory-premack-shaping-task': {
    topology: 'step-flow',
    flashcards: [
      'mod3-fc-premack',
      'mod3-fc-shaping-task-analysis',
      'mod3-fc-token-response-cost'
    ],
    cases: ['mod3-case-aggression-escape'],
    questions: ['mod3-q-shaping-premack']
  },
  'mod3-theory-aba-differential': {
    topology: 'matrix-2x2',
    flashcards: [
      'mod3-fc-extinction-burst',
      'mod3-fc-differential-reinforcement'
    ],
    cases: ['mod3-case-escape'],
    questions: ['mod3-q-extinction-burst-consultation']
  },
  'mod3-theory-fba-pbs': {
    topology: 'process-cycle',
    flashcards: ['mod3-fc-fba', 'mod3-fc-precorrection', 'mod3-fc-fct'],
    cases: ['mod3-case-aggression-escape', 'mod3-case-escape'],
    questions: ['mod3-q-fba-pbs', 'mod3-q-extinction-burst-consultation']
  },

  // Module 4 (19 nodes: 이론 4 · 플래시카드 10 · 사례 2 · 면접 3)
  'mod4-theory-ipm-working-memory': {
    topology: 'triadic-network',
    flashcards: ['mod4-fc-baddeley-wm'],
    cases: ['mod4-case-impulsive-initiation'],
    questions: ['mod4-q-working-memory-automatization']
  },
  'mod4-theory-clt-automatization-chunking': {
    topology: 'stacked-gauge',
    flashcards: [
      'mod4-fc-clt-three-loads',
      'mod4-fc-schema-chunking',
      'mod4-fc-worked-examples'
    ],
    cases: ['mod4-case-impulsive-initiation'],
    questions: [
      'mod4-q-working-memory-automatization',
      'mod4-q-meichenbaum-clt-prosthetics'
    ]
  },
  'mod4-theory-metacognition-srl': {
    topology: 'process-cycle',
    flashcards: ['mod4-fc-metacognition-conditional', 'mod4-fc-zimmerman-srl'],
    cases: ['mod4-case-srl'],
    questions: ['mod4-q-srl-efficacy']
  },
  'mod4-theory-bandura-meichenbaum-casel': {
    topology: 'step-flow',
    flashcards: [
      'mod4-fc-triadic-reciprocal',
      'mod4-fc-self-efficacy-sources',
      'mod4-fc-meichenbaum-cbm',
      'mod4-fc-casel-sel'
    ],
    cases: ['mod4-case-impulsive-initiation', 'mod4-case-srl'],
    questions: ['mod4-q-meichenbaum-clt-prosthetics', 'mod4-q-srl-efficacy']
  },

  // Module 5 (19 nodes: 이론 4 · 플래시카드 10 · 사례 2 · 면접 3)
  'mod5-theory-sdt': {
    topology: 'spectrum-continuum',
    flashcards: [
      'mod5-fc-sdt',
      'mod5-fc-informational-vs-controlling',
      'mod5-fc-internalization-continuum'
    ],
    cases: ['mod5-case-helplessness'],
    questions: [
      'mod5-q-sdt-feedback-overjustification',
      'mod5-q-weiner-helplessness'
    ]
  },
  'mod5-theory-achievement-goals-self-worth': {
    topology: 'matrix-2x2',
    flashcards: ['mod5-fc-mastery-performance-goals', 'mod5-fc-self-handicapping'],
    cases: ['mod5-case-helplessness'],
    questions: ['mod5-q-weiner-helplessness']
  },
  'mod5-theory-attribution-helplessness': {
    topology: 'matrix-2x2',
    flashcards: ['mod5-fc-weiner-attribution', 'mod5-fc-learned-helplessness'],
    cases: ['mod5-case-helplessness'],
    questions: ['mod5-q-weiner-helplessness']
  },
  'mod5-theory-gordon-restorative-justice': {
    topology: 'step-flow',
    flashcards: [
      'mod5-fc-gordon-problem-ownership',
      'mod5-fc-i-message',
      'mod5-fc-restorative-justice'
    ],
    cases: ['mod5-case-relational-aggression-restorative'],
    questions: ['mod5-q-gordon-restorative-circle']
  }
};

// 명세서 섹션 2.2 모듈 간 거시 연결 토폴로지 (Cross-Module Macro Knowledge Graph)
export const CROSS_MODULE_BRIDGES: Array<{
  source: string;
  target: string;
  shortLabel: string;
  rationaleKo: string;
}> = [
  {
    source: 'mod1-theory-piaget',
    target: 'mod2-theory-chc',
    shortLabel: '신피아제 작업기억 병목',
    rationaleKo:
      '신피아제 학파의 작업기억 병목 해석이 CHC·WISC-V의 작업기억(WMI)·처리속도(PSI) 임상 프로파일 분석으로 확장됩니다.'
  },
  {
    source: 'mod1-theory-vygotsky',
    target: 'mod2-theory-clt-prosthetics',
    shortLabel: '비계설정·사적 언어 내면화',
    rationaleKo:
      '근접발달영역(ZPD) 내 비계설정(Scaffolding)이 외재적 인지부하 축소 및 신경심리학적 환경적 보철 설계로 구체화됩니다.'
  },
  {
    source: 'mod1-theory-vygotsky',
    target: 'mod4-theory-bandura-meichenbaum-casel',
    shortLabel: '근접발달영역 → 자기교수법',
    rationaleKo:
      '비고츠키의 사적 언어(Private Speech) 내면화 기제가 마이켄바움(Meichenbaum)의 5단계 자기교수법(CBM)의 이론적 뿌리가 됩니다.'
  },
  {
    source: 'mod2-theory-chc',
    target: 'mod4-theory-ipm-working-memory',
    shortLabel: 'WMI·PSI 병목 심화',
    rationaleKo:
      'WISC-V 작업기억 지표(WMI) 저하가 배들리(Baddeley) 다중요소 작업기억의 음운루프·시공간잡기장·중앙집행기 병목으로 정밀 해부됩니다.'
  },
  {
    source: 'mod2-theory-clt-prosthetics',
    target: 'mod4-theory-clt-automatization-chunking',
    shortLabel: '외재적 부하 축소·스키마',
    rationaleKo:
      '환경적 보철을 통한 외재적 부하 경감이 스웰러(Sweller)의 본유적 부하 확보 및 청킹·스키마 자동화로 직결됩니다.'
  },
  {
    source: 'mod2-theory-adhd',
    target: 'mod3-theory-fba-pbs',
    shortLabel: '수행 시점 보철 + 일일행동카드',
    rationaleKo:
      '바클리(Barkley)의 수행 시점(Point of Performance) 환경적 보철과 일일행동보고카드(DRC)가 FBA·PBS의 사전교정 및 대체행동 강화와 결합됩니다.'
  },
  {
    source: 'mod3-theory-operant-punishment',
    target: 'mod5-theory-sdt',
    shortLabel: '외적 통제 남용 시 내재동기 저하',
    rationaleKo:
      '외적 보상·통제적 유관의 오남용이 데시와 라이언(SDT)의 자율성 욕구를 침해하여 과잉정당화 효과(내재동기 저하)를 유발합니다.'
  },
  {
    source: 'mod4-theory-metacognition-srl',
    target: 'mod5-theory-attribution-helplessness',
    shortLabel: '유창성 착각 극복 → 성취경험·재귀인',
    rationaleKo:
      '유창성 착각을 극복한 능동적 인출 연습과 지머만의 자기조절 전략 수정이 와이너의 통제 가능한 노력·전략 재귀인 훈련의 핵심 도구가 됩니다.'
  },
  {
    source: 'mod1-theory-moral',
    target: 'mod5-theory-gordon-restorative-justice',
    shortLabel: '적대적 귀인 교정 → 회복적 서클',
    rationaleKo:
      '닷지(Dodge)의 적대적 귀인 편향 교정 및 조망수용 훈련이 고든의 적극적 경청·나-전달법 및 회복적 서클(Restorative Circle) 대화 절차로 실현됩니다.'
  }
];

export const MODULE_CONCEPT_ANCHORS: Record<
  ModuleId,
  {
    imageUrl: string;
    captionKo: string;
    mythQuestion: string;
    storyThemeBadge: string;
    accentHex: string;
  }
> = {
  mod1: {
    imageUrl: resolveAssetUrl('images/concepts/mod1-vygotsky-zpd.png'),
    captionKo:
      '비고츠키 근접발달영역(ZPD)과 비계설정(Scaffolding)에서 혼잣말(사적 언어) 내면화로 이어지는 발달 스펙트럼',
    mythQuestion:
      '“문제행동이나 학습 부진은 단지 아이의 발달 단계가 아직 덜 자라서이거나 도덕적 반성이 부족해서일까?”',
    storyThemeBadge: '발달단계 고정론 비판 → 작업기억 병목 & 비계설정 & 사회정보처리',
    accentHex: '#0284c7'
  },
  mod2: {
    imageUrl: resolveAssetUrl('images/concepts/mod2-chc-clt.png'),
    captionKo:
      'CHC 지능이론의 작업기억(WMI)·처리속도(PSI) 병목 진단과 인지부하이론(CLT)·신경심리학적 환경적 보철의 결합',
    mythQuestion:
      '“시각·청각·운동감각 학습양식(Learning Styles)에 맞춰 가르치면 성적이 오른다는 현장의 믿음은 실증적 근거가 있을까?”',
    storyThemeBadge: '학습양식 신화 타파 → CHC/WISC-V 병목 해부 & 수행 시점 외적 보철',
    accentHex: '#4f46e5'
  },
  mod3: {
    imageUrl: resolveAssetUrl('images/concepts/mod3-fba-pbs.png'),
    captionKo:
      '기능적 행동평가(FBA: A-B-C 유관 분석)와 긍정적 행동지원(PBS: 사전교정·기능적 의사소통 훈련·차별강화)',
    mythQuestion:
      '“수업 시간마다 소란을 피우는 아이를 복도로 내보내거나 벌점을 주면 왜 문제행동이 줄어들기는커녕 더 고착될까?”',
    storyThemeBadge: '처벌의 역설(부적 강화) 진단 → A-B-C 기능 평가 & 사전교정·FCT',
    accentHex: '#059669'
  },
  mod4: {
    imageUrl: resolveAssetUrl('images/concepts/mod4-working-memory.png'),
    captionKo:
      '배들리 다중요소 작업기억 모형과 스웰러 인지부하 조절, 지머만 순환적 자기조절학습(SRL) 및 마이켄바움 자기교수법',
    mythQuestion:
      '“매일 밤 12시까지 교과서에 형광펜을 칠하며 5번씩 정독했는데도 왜 시험장만 가면 머릿속이 하얘질까?”',
    storyThemeBadge: '유창성 착각(Illusion of Competence) 극복 → 청킹·인출연습·자기교수법',
    accentHex: '#7c3aed'
  },
  mod5: {
    imageUrl: resolveAssetUrl('images/concepts/mod5-sdt-restorative.png'),
    captionKo:
      '데시와 라이언 자기결정이론(자율성·유능감·관계성), 와이너 귀인 재훈련, 코빙턴 자기가치 보호 및 고든·회복적 정의',
    mythQuestion:
      '“시험 전날 일부러 밤새 게임을 하거나 아예 백지를 내는 학생은 정말 게으르고 반항심이 커서일까?”',
    storyThemeBadge: '자기가치 방어(자기구실 만들기) 해부 → 재귀인 훈련 & 회복적 서클',
    accentHex: '#d97706'
  }
};

export interface CurriculumGraphData {
  nodes: KnowledgeGraphNode[];
  moduleNodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  nodeMap: Record<string, KnowledgeGraphNode>;
}

export function buildCurriculumKnowledgeGraph(
  modules: ModulePayload[]
): CurriculumGraphData {
  const nodes: KnowledgeGraphNode[] = [];
  const moduleNodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const nodeMap: Record<string, KnowledgeGraphNode> = {};

  let storyOrderCounter = 1;
  let edgeCounter = 1;

  for (const mod of modules) {
    const modNode: KnowledgeGraphNode = {
      id: mod.id,
      moduleId: mod.id,
      kind: 'module',
      titleKo: `Mod ${mod.number}. ${mod.title}`,
      titleEn: mod.subtitle,
      tags: [mod.sourceMapping],
      storyOrder: storyOrderCounter++
    };
    moduleNodes.push(modNode);
    nodeMap[modNode.id] = modNode;

    for (const theory of mod.theories) {
      const mapping = THEORY_GRAPH_MAPPING[theory.id];
      const blueprint = getTheoryVisualBlueprint(theory);
      const node: KnowledgeGraphNode = {
        id: theory.id,
        moduleId: mod.id,
        kind: 'theory',
        titleKo: theory.titleKo,
        titleEn: theory.titleEn,
        tags: theory.tags ?? [],
        storyOrder: storyOrderCounter++,
        visualTopology: mapping?.topology ?? blueprint.topology
      };
      nodes.push(node);
      nodeMap[node.id] = node;

      edges.push({
        id: `e-mod-${edgeCounter++}`,
        source: theory.id,
        target: mod.id,
        relation: 'BELONGS_TO_MODULE',
        rationaleKo: `Module ${mod.number} 핵심 이론 축`
      });
    }

    for (const fc of mod.flashcards) {
      const node: KnowledgeGraphNode = {
        id: fc.id,
        moduleId: mod.id,
        kind: 'flashcard',
        titleKo: fc.termKo,
        titleEn: fc.termEn,
        tags: [fc.termKo, fc.termEn],
        storyOrder: storyOrderCounter++
      };
      nodes.push(node);
      nodeMap[node.id] = node;
    }

    for (const c of mod.cases) {
      const node: KnowledgeGraphNode = {
        id: c.id,
        moduleId: mod.id,
        kind: 'case',
        titleKo: c.title,
        titleEn: c.studentGrade,
        tags: [c.studentGrade, '3중 렌즈 사례'],
        storyOrder: storyOrderCounter++
      };
      nodes.push(node);
      nodeMap[node.id] = node;
    }

    for (const q of mod.questions) {
      const node: KnowledgeGraphNode = {
        id: q.id,
        moduleId: mod.id,
        kind: 'question',
        titleKo: q.question,
        titleEn: (q.requiredKeywords ?? []).join(', '),
        tags: q.requiredKeywords ?? [],
        storyOrder: storyOrderCounter++
      };
      nodes.push(node);
      nodeMap[node.id] = node;
    }
  }

  // 명세서 섹션 2.3 기반 DEFINES_TERM / APPLIED_IN_CASE / DEFENDS_QUESTION 엣지 연결
  const connectedItemIds = new Set<string>();

  for (const [theoryId, mapping] of Object.entries(THEORY_GRAPH_MAPPING)) {
    if (!nodeMap[theoryId]) continue;

    for (const fcId of mapping.flashcards) {
      if (nodeMap[fcId]) {
        connectedItemIds.add(fcId);
        edges.push({
          id: `e-def-${edgeCounter++}`,
          source: theoryId,
          target: fcId,
          relation: 'DEFINES_TERM',
          rationaleKo: `${nodeMap[theoryId].titleKo}에서 정의·파생되는 핵심 학술 용어`
        });
      }
    }

    for (const caseId of mapping.cases) {
      if (nodeMap[caseId]) {
        connectedItemIds.add(caseId);
        edges.push({
          id: `e-case-${edgeCounter++}`,
          source: theoryId,
          target: caseId,
          relation: 'APPLIED_IN_CASE',
          rationaleKo: `교실 사례(${nodeMap[caseId].titleKo})의 다중 렌즈 분석 및 처방에 적용`
        });
      }
    }

    for (const qId of mapping.questions) {
      if (nodeMap[qId]) {
        connectedItemIds.add(qId);
        edges.push({
          id: `e-defend-${edgeCounter++}`,
          source: theoryId,
          target: qId,
          relation: 'DEFENDS_QUESTION',
          rationaleKo: `압박 면접 문항의 과학자-실무자 방어 논리 구성`
        });
      }
    }
  }

  // 사용자가 새로 추가한 항목(POST /api/item)도 해당 모듈의 첫 번째 이론 노드에 자동 연결
  for (const node of nodes) {
    if (node.kind !== 'theory' && !connectedItemIds.has(node.id)) {
      const fallbackTheory = nodes.find(
        (n) => n.kind === 'theory' && n.moduleId === node.moduleId
      );
      if (fallbackTheory) {
        const relation =
          node.kind === 'flashcard'
            ? 'DEFINES_TERM'
            : node.kind === 'case'
            ? 'APPLIED_IN_CASE'
            : 'DEFENDS_QUESTION';
        edges.push({
          id: `e-dyn-${edgeCounter++}`,
          source: fallbackTheory.id,
          target: node.id,
          relation,
          rationaleKo: '사용자 추가 학습 항목 자동 연결'
        });
      }
    }
  }

  // 명세서 섹션 2.2 모듈 간 거시 브릿지 (CROSS_MODULE_BRIDGE)
  for (const bridge of CROSS_MODULE_BRIDGES) {
    if (nodeMap[bridge.source] && nodeMap[bridge.target]) {
      edges.push({
        id: `e-bridge-${edgeCounter++}`,
        source: bridge.source,
        target: bridge.target,
        relation: 'CROSS_MODULE_BRIDGE',
        rationaleKo: bridge.rationaleKo
      });
    }
  }

  return { nodes, moduleNodes, edges, nodeMap };
}

const CLUSTER_CENTERS_ALL: Record<ModuleId, { cx: number; cy: number }> = {
  mod1: { cx: 250, cy: 235 },
  mod2: { cx: 680, cy: 215 },
  mod3: { cx: 1110, cy: 235 },
  mod4: { cx: 430, cy: 610 },
  mod5: { cx: 930, cy: 610 }
};

const FULL_RADIANS = Math.PI * 2;
const THEORY_RING_RADIUS_ALL = 76;
const CHILD_OUTER_RADIUS_ALL = 152;
const SINGLE_MOD_CENTER_X = 680;
const SINGLE_MOD_CENTER_Y = 410;
const SINGLE_MOD_THEORY_RADIUS = 150;
const SINGLE_MOD_CHILD_RADIUS = 315;

export function computeCurriculumGraphLayout(
  nodes: KnowledgeGraphNode[],
  edges: KnowledgeGraphEdge[],
  selectedModule: ModuleId | 'all'
): PositionedGraphNode[] {
  if (selectedModule === 'all') {
    const positioned: PositionedGraphNode[] = [];
    const modulesOrder: ModuleId[] = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5'];

    for (const modId of modulesOrder) {
      const center = CLUSTER_CENTERS_ALL[modId];
      const modNodes = nodes.filter((n) => n.moduleId === modId);
      const theories = modNodes.filter((n) => n.kind === 'theory');
      const others = modNodes.filter((n) => n.kind !== 'theory');

      theories.forEach((t, idx) => {
        const angle =
          (idx / Math.max(1, theories.length)) * FULL_RADIANS - Math.PI / 4;
        positioned.push({
          ...t,
          x: Math.round(center.cx + Math.cos(angle) * THEORY_RING_RADIUS_ALL),
          y: Math.round(center.cy + Math.sin(angle) * THEORY_RING_RADIUS_ALL),
          clusterCenterX: center.cx,
          clusterCenterY: center.cy
        });
      });

      others.forEach((item, idx) => {
        const angle =
          (idx / Math.max(1, others.length)) * FULL_RADIANS - Math.PI / 2;
        const radiusOffset = item.kind === 'flashcard' ? 0 : 18;
        const r = CHILD_OUTER_RADIUS_ALL + radiusOffset;
        positioned.push({
          ...item,
          x: Math.round(center.cx + Math.cos(angle) * r),
          y: Math.round(center.cy + Math.sin(angle) * r),
          clusterCenterX: center.cx,
          clusterCenterY: center.cy
        });
      });
    }

    return positioned;
  }

  // 특정 모듈 집중 탐색 레이아웃 (선택 모듈 노드 + 타 모듈 브릿지 연결 이론 노드)
  const modNodes = nodes.filter((n) => n.moduleId === selectedModule);
  const theories = modNodes.filter((n) => n.kind === 'theory');
  const others = modNodes.filter((n) => n.kind !== 'theory');

  const bridgeNeighborIds = new Set<string>();
  for (const edge of edges) {
    if (edge.relation !== 'CROSS_MODULE_BRIDGE') continue;
    const srcInMod = theories.some((t) => t.id === edge.source);
    const tgtInMod = theories.some((t) => t.id === edge.target);
    if (srcInMod && !tgtInMod) bridgeNeighborIds.add(edge.target);
    if (tgtInMod && !srcInMod) bridgeNeighborIds.add(edge.source);
  }

  const externalBridgeNodes = nodes.filter((n) => bridgeNeighborIds.has(n.id));
  const positioned: PositionedGraphNode[] = [];

  theories.forEach((t, idx) => {
    const angle =
      (idx / Math.max(1, theories.length)) * FULL_RADIANS - Math.PI / 4;
    positioned.push({
      ...t,
      x: Math.round(
        SINGLE_MOD_CENTER_X + Math.cos(angle) * SINGLE_MOD_THEORY_RADIUS
      ),
      y: Math.round(
        SINGLE_MOD_CENTER_Y + Math.sin(angle) * SINGLE_MOD_THEORY_RADIUS
      ),
      clusterCenterX: SINGLE_MOD_CENTER_X,
      clusterCenterY: SINGLE_MOD_CENTER_Y
    });
  });

  others.forEach((item, idx) => {
    const angle =
      (idx / Math.max(1, others.length)) * FULL_RADIANS - Math.PI / 2;
    const rx = SINGLE_MOD_CHILD_RADIUS + (item.kind === 'flashcard' ? 20 : 55);
    const ry = (SINGLE_MOD_CHILD_RADIUS - 35) + (item.kind === 'flashcard' ? 0 : 30);
    positioned.push({
      ...item,
      x: Math.round(SINGLE_MOD_CENTER_X + Math.cos(angle) * rx),
      y: Math.round(SINGLE_MOD_CENTER_Y + Math.sin(angle) * ry),
      clusterCenterX: SINGLE_MOD_CENTER_X,
      clusterCenterY: SINGLE_MOD_CENTER_Y
    });
  });

  externalBridgeNodes.forEach((ext, idx) => {
    const isLeft = idx % 2 === 0;
    const row = Math.floor(idx / 2);
    positioned.push({
      ...ext,
      x: isLeft ? 120 : 1240,
      y: 160 + row * 220,
      clusterCenterX: isLeft ? 120 : 1240,
      clusterCenterY: 160 + row * 220
    });
  });

  return positioned;
}

export interface NodeNeighborResult {
  incoming: Array<{ edge: KnowledgeGraphEdge; node: KnowledgeGraphNode }>;
  outgoing: Array<{ edge: KnowledgeGraphEdge; node: KnowledgeGraphNode }>;
  connectedNodeIds: Set<string>;
}

export function getNodeNeighbors(
  nodeId: string,
  nodeMap: Record<string, KnowledgeGraphNode>,
  edges: KnowledgeGraphEdge[]
): NodeNeighborResult {
  const incoming: Array<{ edge: KnowledgeGraphEdge; node: KnowledgeGraphNode }> = [];
  const outgoing: Array<{ edge: KnowledgeGraphEdge; node: KnowledgeGraphNode }> = [];
  const connectedNodeIds = new Set<string>([nodeId]);

  for (const edge of edges) {
    if (edge.relation === 'BELONGS_TO_MODULE') continue;
    if (edge.target === nodeId && nodeMap[edge.source]) {
      incoming.push({ edge, node: nodeMap[edge.source] });
      connectedNodeIds.add(edge.source);
    }
    if (edge.source === nodeId && nodeMap[edge.target]) {
      outgoing.push({ edge, node: nodeMap[edge.target] });
      connectedNodeIds.add(edge.target);
    }
  }

  return { incoming, outgoing, connectedNodeIds };
}

export function getWeakSubgraph(
  nodes: KnowledgeGraphNode[],
  edges: KnowledgeGraphEdge[],
  masteryMap: Record<string, MasteryState>
): {
  weakNodeIds: Set<string>;
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
} {
  const weakNodeIds = new Set<string>();
  const highlightedNodeIds = new Set<string>();
  const highlightedEdgeIds = new Set<string>();

  for (const node of nodes) {
    const mastery = masteryMap[node.id] ?? 'unseen';
    if (mastery === 'weak' || mastery === 'review') {
      weakNodeIds.add(node.id);
      highlightedNodeIds.add(node.id);
    }
  }

  // 취약 노드의 선수 이론(DEFINES_TERM, DEFENDS_QUESTION, APPLIED_IN_CASE)까지 함께 밝혀 표적 복습 동선 제시
  for (const edge of edges) {
    if (edge.relation === 'BELONGS_TO_MODULE') continue;
    const isTargetWeak = weakNodeIds.has(edge.target);
    const isSourceWeak = weakNodeIds.has(edge.source);

    if (isTargetWeak || isSourceWeak) {
      highlightedNodeIds.add(edge.source);
      highlightedNodeIds.add(edge.target);
      highlightedEdgeIds.add(edge.id);
    }
  }

  return { weakNodeIds, highlightedNodeIds, highlightedEdgeIds };
}

export function buildModuleStoryBeats(
  mod: ModulePayload
): StoryBeatDescriptor[] {
  const beats: StoryBeatDescriptor[] = [];
  const firstTheory = mod.theories[0];
  const mapping0 = firstTheory ? THEORY_GRAPH_MAPPING[firstTheory.id] : undefined;

  // Beat 1: 현장 통념 반박 투표 (Micro-Simulation Hook)
  if (firstTheory) {
    beats.push({
      beatId: `${mod.id}-beat-myth`,
      moduleId: mod.id,
      kind: 'myth-hook',
      stepLabel: 'Step A · 현장 통념 반박 투표',
      titleKo: `Module ${mod.number} 도입: 현장의 흔한 통념 vs 과학자-실무자 진단`,
      subtitleKo: MODULE_CONCEPT_ANCHORS[mod.id].mythQuestion,
      primaryNodeId: firstTheory.id,
      relatedNodeIds: mapping0?.flashcards ?? []
    });
  }

  // Beat 2: 모듈 내 4대 핵심 이론 도식 조작 & 교과서 vs 과학자-실무자 대조
  mod.theories.forEach((theory, idx) => {
    const tMap = THEORY_GRAPH_MAPPING[theory.id];
    beats.push({
      beatId: `${mod.id}-beat-theory-${idx + 1}`,
      moduleId: mod.id,
      kind: 'theory-topology',
      stepLabel: `Step B-${idx + 1} · 핵심 이론 & 시각 토폴로지 조작`,
      titleKo: theory.titleKo,
      subtitleKo: theory.titleEn,
      primaryNodeId: theory.id,
      relatedNodeIds: [
        ...(tMap?.flashcards ?? []),
        ...(tMap?.cases ?? []),
        ...(tMap?.questions ?? [])
      ]
    });
  });

  // Beat 3: 인라인 한-영 개념 퀵 체크
  beats.push({
    beatId: `${mod.id}-beat-retrieval`,
    moduleId: mod.id,
    kind: 'inline-retrieval',
    stepLabel: 'Step C · 인라인 한-영 용어 즉시 인출',
    titleKo: `Module ${mod.number} 필수 학술 용어 (${mod.flashcards.length}개) 퀵 체크`,
    subtitleKo:
      '스토리 흐름을 끊지 않고 카드를 뒤집어 확인한 뒤 Mastered / Review / Again 숙련도를 즉시 기록하세요.',
    primaryNodeId: mod.flashcards[0]?.id ?? firstTheory?.id ?? mod.id,
    relatedNodeIds: mod.flashcards.map((f) => f.id)
  });

  // Beat 4: 교실 사례 임상 단서 3분할 브릿지
  beats.push({
    beatId: `${mod.id}-beat-cases`,
    moduleId: mod.id,
    kind: 'case-bridge',
    stepLabel: 'Step D · 교실 사례 단서 해부 & 3중 렌즈 브릿지',
    titleKo: `Module ${mod.number} 교실 임상 사례 (${mod.cases.length}건) 3중 렌즈 해부`,
    subtitleKo:
      '선행맥락 · 외현행동 · 현재반응 3대 단서를 분해하고 우측 스테이지에서 행동·인지·동기 처방도를 조작합니다.',
    primaryNodeId: mod.cases[0]?.id ?? firstTheory?.id ?? mod.id,
    relatedNodeIds: mod.cases.map((c) => c.id)
  });

  // Beat 5: 압박 면접 맛보기 & 챕터 완주 게이트
  beats.push({
    beatId: `${mod.id}-beat-gate`,
    moduleId: mod.id,
    kind: 'module-gate',
    stepLabel: 'Step E · 압박 면접 디펜스 게이트 & 모듈 완주',
    titleKo: `Module ${mod.number} 실전 압박 면접 프리뷰 & 워크스페이스 브릿지`,
    subtitleKo:
      '방금 체화한 이론과 용어가 실제 대학원 면접관의 압박 질문에서 어떻게 방어 논리로 작동하는지 확인하세요.',
    primaryNodeId: mod.questions[0]?.id ?? firstTheory?.id ?? mod.id,
    relatedNodeIds: mod.questions.map((q) => q.id)
  });

  return beats;
}
