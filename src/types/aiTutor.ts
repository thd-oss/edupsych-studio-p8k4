import { ModuleId, NodeKind } from './graph';

export type TutorCoverageStatus =
  | 'TEXTBOOK_SUFFICIENT'
  | 'PARTIAL_NEEDS_SUPPLEMENT'
  | 'NOT_IN_TEXTBOOK';

export type GeminiTutorModelId =
  | 'gemini-3.8-flash'
  | 'gemini-3.5-flash-lite'
  | 'gemini-4-argon';

export interface TextbookPassage {
  nodeId: string;
  moduleId: ModuleId;
  moduleNumber: number;
  kind: Exclude<NodeKind, 'module'>;
  titleKo: string;
  titleEn: string;
  sourceMapping: string;
  tags: string[];
  bodyText: string;
  interviewCue: string | null;
  connectedRelations: string[];
  relevanceScore: number;
}

export interface TextbookRetrievalResult {
  query: string;
  normalizedTokens: string[];
  passages: TextbookPassage[];
  maxRelevanceScore: number;
  formattedCorpusXml: string;
}

export interface TextbookCitationItem {
  nodeId: string;
  moduleId: ModuleId;
  kind: Exclude<NodeKind, 'module'>;
  nodeTitle: string;
  sourceMapping: string;
}

export interface WebCitationItem {
  title: string;
  uri: string;
}

export interface TutorPassOneSchemaPayload {
  coverageStatus: TutorCoverageStatus;
  termHeader: {
    termKo: string;
    termEn: string;
    oneLineDefinition: string;
  };
  textbookSection: {
    summary: string;
    citedNodeIds: string[];
    interviewPoint: string | null;
  };
  externalSearchDirective: {
    needed: boolean;
    triggerReason: string;
    searchQuery: string;
  };
}

export interface TutorPassTwoSchemaPayload {
  supplementBody: string;
  keyAcademicPoints: string[];
}

export interface TutorStructuredAnswer {
  coverageStatus: TutorCoverageStatus;
  termHeader: {
    termKo: string;
    termEn: string;
    oneLineDefinition: string;
  };
  textbookSection: {
    summary: string;
    citations: TextbookCitationItem[];
    interviewPoint: string | null;
  };
  externalSupplement: {
    triggerReason: string;
    searchQuery: string;
    supplementBody: string;
    keyAcademicPoints: string[];
    webSources: WebCitationItem[];
  } | null;
  retrievalMeta: {
    retrievedCount: number;
    maxRelevanceScore: number;
    usedExternalSearch: boolean;
    modelId: GeminiTutorModelId;
  };
}

export interface TutorChatMessage {
  id: string;
  role: 'user' | 'assistant';
  questionText: string;
  contextNodeId: string | null;
  contextNodeTitle: string | null;
  answer?: TutorStructuredAnswer;
  errorMessage?: string;
  isPending?: boolean;
  pendingStageLabel?: string;
  createdAt: string;
}
