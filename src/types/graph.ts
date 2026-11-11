import {
  FlashcardStatus,
  InterviewDraftRecord,
  ModuleId
} from './study';
import { VisualTopologyType } from './visuals';

export type { ModuleId };

export type AppMode = 'home' | 'story' | 'workspace';

export type WorkspaceTabId =
  | 'graph'
  | 'theories'
  | 'flashcards'
  | 'cases'
  | 'interview'
  | 'cheatsheet';

export type NodeKind = 'module' | 'theory' | 'flashcard' | 'case' | 'question';

export type EdgeRelation =
  | 'BELONGS_TO_MODULE'     // 항목 -> 모듈 소속
  | 'DEFINES_TERM'          // 이론 -> 핵심 학술 용어(플래시카드) 정의
  | 'APPLIED_IN_CASE'       // 이론/용어 -> 교실 사례 처방 렌즈에 적용
  | 'DEFENDS_QUESTION'      // 이론/용어/사례 -> 실전 압박 면접 문항의 방어 논리 구성
  | 'CROSS_MODULE_BRIDGE';  // 모듈 간 선수·심화 연결 (예: ZPD 비계설정 -> 인지부하/외적 보철)

export type MasteryState = 'unseen' | 'weak' | 'review' | 'mastered';

export interface KnowledgeGraphNode {
  id: string;                 // 기존 manifest.json ID 100% 호환 (예: 'mod2-theory-chc')
  moduleId: ModuleId;
  kind: NodeKind;
  titleKo: string;
  titleEn: string;
  tags: string[];
  storyOrder: number;         // 스크롤 스토리텔링 내 노출 순서 (모듈 내 Beat 시퀀스)
  visualTopology?: VisualTopologyType;
}

export interface PositionedGraphNode extends KnowledgeGraphNode {
  x: number;
  y: number;
  clusterCenterX: number;
  clusterCenterY: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;             // 출발 노드 ID
  target: string;             // 도착 노드 ID
  relation: EdgeRelation;
  rationaleKo?: string;       // 연결 맥락 설명 (스토리 브릿지 및 그래프 툴팁 표기용)
}

export interface StoryProgressState {
  visitedBeats: Record<string, boolean>;          // 스크롤 진입 완료한 비트 ID
  simulationChoices: Record<string, number>;      // Beat 1 미니 의사결정 선택 인덱스
  completedModules: ModuleId[];                   // Beat 5 체크포인트 통과 모듈
  lastActiveNodeId: string | null;                // 모드 전환 시 포커스 유지용 최근 노드 ID
}

export interface UnifiedProgressGraph {
  updatedAt: string;
  preferredEntryMode: AppMode;
  story: StoryProgressState;
  flashcardStatus: Record<string, FlashcardStatus>;
  userNotes: Record<string, string>;              // 이론/사례 통합 개인 노트 (300ms 디바운스 저장)
  bookmarks: string[];
  interviewDrafts: Record<string, InterviewDraftRecord>;
}

export type StoryBeatKind =
  | 'myth-hook'
  | 'theory-topology'
  | 'inline-retrieval'
  | 'case-bridge'
  | 'module-gate';

export interface StoryBeatDescriptor {
  beatId: string;
  moduleId: ModuleId;
  kind: StoryBeatKind;
  stepLabel: string;
  titleKo: string;
  subtitleKo: string;
  primaryNodeId: string;
  relatedNodeIds: string[];
}

export interface StoryScrollRequest {
  nodeId: string;
  requestId: number;
}

export interface GraphAdjacencyIndex {
  outgoingByNode: Record<string, KnowledgeGraphEdge[]>;
  incomingByNode: Record<string, KnowledgeGraphEdge[]>;
  neighbors1HopByNode: Record<string, ReadonlySet<string>>;
  nodesByModule: Record<ModuleId, KnowledgeGraphNode[]>;
  crossBridgesByModule: Record<ModuleId, KnowledgeGraphEdge[]>;
}

export interface ModuleSubgraphSummary {
  moduleId: ModuleId;
  moduleNumber: number;
  titleKo: string;
  subtitleEn: string;
  sourceMapping: string;
  totalNodes: number;
  masteredCount: number;
  reviewCount: number;
  weakCount: number;
  unseenCount: number;
  masteryPercent: number;
  crossBridgeCount: number;
  isCompleted: boolean;
  leadTheoryId: string;
}

export interface PrioritizedWeakNodeItem {
  node: KnowledgeGraphNode;
  mastery: 'weak' | 'review';
  priorityScore: number;
  semanticDegree: number;
  isBridgeHub: boolean;
  prerequisiteTheoryNode: KnowledgeGraphNode | null;
}

export interface ResumeStudyTarget {
  nodeId: string;
  moduleId: ModuleId;
  moduleNumber: number;
  nodeTitleKo: string;
  moduleTitleKo: string;
  reason: 'last-active' | 'bridge-next' | 'starter';
}
