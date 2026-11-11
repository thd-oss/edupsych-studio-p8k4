import {
  TextbookCitationItem,
  TextbookPassage,
  TextbookRetrievalResult
} from '../types/aiTutor';
import { KnowledgeGraphEdge, ModuleId, NodeKind } from '../types/graph';
import { ModulePayload } from '../types/study';

const MIN_TOKEN_LENGTH = 2;
const DEFAULT_TOP_PASSAGE_LIMIT = 8;
const CONTEXT_FALLBACK_PASSAGE_LIMIT = 4;

const SCORE_EXACT_TITLE_MATCH = 42;
const SCORE_TITLE_TOKEN_MATCH = 16;
const SCORE_TAG_MATCH = 14;
const SCORE_DEFINITION_TOKEN_MATCH = 6;
const SCORE_RELATION_TOKEN_MATCH = 4;
const SCORE_ACTIVE_NODE_BOOST = 18;
const SCORE_ACTIVE_NEIGHBOR_BOOST = 7;
const SCORE_DEICTIC_ACTIVE_NODE_BOOST = 48;

const KOREAN_PARTICLE_SUFFIX_REGEX =
  /(이라는|라는|이란|란|에서는|에서|에게서|에게|으로|로써|로서|로|이랑|랑|하고|과|와|은|는|이|가|을|를|의|에|도|만|까지|부터|처럼|보다|마다|조차|마저|인가요|인가|뭔가요|뭔지|뭐야|무엇인가요|무엇인지|설명해줘|알려줘)$/u;

const STOPWORDS = new Set([
  '설명',
  '설명해',
  '알려',
  '무엇',
  '뭐야',
  '뭔가',
  '개념',
  '의미',
  '뜻이',
  '어떤',
  '어떻게',
  '왜',
  '대해',
  '대한',
  '차이',
  '차이점',
  '비교',
  '예시',
  '질문',
  '궁금',
  '정리',
  '요약',
  'what',
  'how',
  'why',
  'define',
  'meaning',
  'explain',
  'difference',
  'between'
]);

const DEICTIC_QUERY_CUES = [
  '이 개념',
  '이 용어',
  '이 이론',
  '현재 보고',
  '지금 보고',
  '현재 개념',
  '방금 본',
  '여기서',
  '이 카드',
  '이 사례'
];

interface IndexedCorpusDocument {
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
  normalizedTitleLower: string;
  normalizedTagsLower: string[];
  normalizedBodyLower: string;
  normalizedRelationsLower: string;
}

export function normalizeQueryTokens(rawQuery: string): string[] {
  const cleaned = rawQuery
    .toLowerCase()
    .replace(/[?!.,;:'"()[\]{}<>/\\|~`@#$%^&*+=]+/g, ' ')
    .trim();

  if (!cleaned) {
    return [];
  }

  const rawParts = cleaned.split(/\s+/u);
  const tokenSet = new Set<string>();

  for (const part of rawParts) {
    if (part.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(part)) {
      tokenSet.add(part);
    }
    const stripped = part.replace(KOREAN_PARTICLE_SUFFIX_REGEX, '').trim();
    if (stripped.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(stripped)) {
      tokenSet.add(stripped);
    }
  }

  return Array.from(tokenSet);
}

function isDeicticContextQuery(rawQuery: string): boolean {
  const compact = rawQuery.trim();
  return DEICTIC_QUERY_CUES.some((cue) => compact.includes(cue));
}

export function buildCorpusIndex(
  modules: ModulePayload[],
  edges: KnowledgeGraphEdge[]
): IndexedCorpusDocument[] {
  const nodeTitleLookup = new Map<string, string>();
  for (const mod of modules) {
    for (const t of mod.theories) {
      nodeTitleLookup.set(t.id, t.titleKo);
    }
    for (const fc of mod.flashcards) {
      nodeTitleLookup.set(fc.id, `${fc.termKo} (${fc.termEn})`);
    }
    for (const c of mod.cases) {
      nodeTitleLookup.set(c.id, c.title);
    }
    for (const q of mod.questions) {
      nodeTitleLookup.set(q.id, q.question);
    }
  }

  const edgeDescriptionsByNode = new Map<string, string[]>();
  const pushEdgeLine = (nodeId: string, line: string) => {
    const existing = edgeDescriptionsByNode.get(nodeId);
    if (existing) {
      existing.push(line);
    } else {
      edgeDescriptionsByNode.set(nodeId, [line]);
    }
  };

  for (const edge of edges) {
    if (edge.relation === 'BELONGS_TO_MODULE') {
      continue;
    }
    const sourceTitle = nodeTitleLookup.get(edge.source) ?? edge.source;
    const targetTitle = nodeTitleLookup.get(edge.target) ?? edge.target;
    const rationale = edge.rationaleKo ? ` — ${edge.rationaleKo}` : '';
    pushEdgeLine(
      edge.source,
      `[${edge.relation}] → ${targetTitle} (${edge.target})${rationale}`
    );
    pushEdgeLine(
      edge.target,
      `[${edge.relation}] ← ${sourceTitle} (${edge.source})${rationale}`
    );
  }

  const docs: IndexedCorpusDocument[] = [];

  for (const mod of modules) {
    for (const theory of mod.theories) {
      const relations = edgeDescriptionsByNode.get(theory.id) ?? [];
      const bodyLines = [
        ...theory.textbookDefinition.map((def, idx) => `정의 ${idx + 1}: ${def}`),
        `현대적·과학적 비판 관점: ${theory.criticalPerspective}`
      ];
      const bodyText = bodyLines.join('\n');
      docs.push({
        nodeId: theory.id,
        moduleId: mod.id,
        moduleNumber: mod.number,
        kind: 'theory',
        titleKo: theory.titleKo,
        titleEn: theory.titleEn,
        sourceMapping: theory.sourceMapping || mod.sourceMapping,
        tags: theory.tags,
        bodyText,
        interviewCue: theory.interviewPoint || null,
        connectedRelations: relations,
        normalizedTitleLower: `${theory.titleKo} ${theory.titleEn}`.toLowerCase(),
        normalizedTagsLower: theory.tags.map((tag) => tag.toLowerCase()),
        normalizedBodyLower: `${bodyText} ${theory.interviewPoint}`.toLowerCase(),
        normalizedRelationsLower: relations.join(' ').toLowerCase()
      });
    }

    for (const fc of mod.flashcards) {
      const relations = edgeDescriptionsByNode.get(fc.id) ?? [];
      const bodyText = `교재 용어 정의: ${fc.definition}\n학교·상담 현장 예시: ${fc.classroomExample}`;
      docs.push({
        nodeId: fc.id,
        moduleId: mod.id,
        moduleNumber: mod.number,
        kind: 'flashcard',
        titleKo: fc.termKo,
        titleEn: fc.termEn,
        sourceMapping: mod.sourceMapping,
        tags: [fc.termKo, fc.termEn],
        bodyText,
        interviewCue: null,
        connectedRelations: relations,
        normalizedTitleLower: `${fc.termKo} ${fc.termEn}`.toLowerCase(),
        normalizedTagsLower: [fc.termKo.toLowerCase(), fc.termEn.toLowerCase()],
        normalizedBodyLower: bodyText.toLowerCase(),
        normalizedRelationsLower: relations.join(' ').toLowerCase()
      });
    }

    for (const classroomCase of mod.cases) {
      const relations = edgeDescriptionsByNode.get(classroomCase.id) ?? [];
      const bodyText = [
        `대상 학년: ${classroomCase.studentGrade}`,
        `사례 시나리오: ${classroomCase.scenario}`,
        `행동주의 처방 렌즈: ${classroomCase.lenses.behavioral}`,
        `인지주의 처방 렌즈: ${classroomCase.lenses.cognitive}`,
        `동기·정서 처방 렌즈: ${classroomCase.lenses.motivational}`
      ].join('\n');
      docs.push({
        nodeId: classroomCase.id,
        moduleId: mod.id,
        moduleNumber: mod.number,
        kind: 'case',
        titleKo: classroomCase.title,
        titleEn: classroomCase.studentGrade,
        sourceMapping: mod.sourceMapping,
        tags: [classroomCase.studentGrade, mod.title],
        bodyText,
        interviewCue: null,
        connectedRelations: relations,
        normalizedTitleLower: `${classroomCase.title} ${classroomCase.studentGrade}`.toLowerCase(),
        normalizedTagsLower: [classroomCase.studentGrade.toLowerCase()],
        normalizedBodyLower: bodyText.toLowerCase(),
        normalizedRelationsLower: relations.join(' ').toLowerCase()
      });
    }

    for (const q of mod.questions) {
      const relations = edgeDescriptionsByNode.get(q.id) ?? [];
      const bodyText = [
        `면접 주 질문: ${q.question}`,
        `심층 꼬리 질문: ${q.followUpQuestion}`,
        `필수 핵심 키워드: ${q.requiredKeywords.join(', ')}`,
        `교재 기반 모범 방어 논리: ${q.modelAnswer}`
      ].join('\n');
      docs.push({
        nodeId: q.id,
        moduleId: mod.id,
        moduleNumber: mod.number,
        kind: 'question',
        titleKo: q.question,
        titleEn: q.requiredKeywords.join(', '),
        sourceMapping: mod.sourceMapping,
        tags: q.requiredKeywords,
        bodyText,
        interviewCue: q.modelAnswer,
        connectedRelations: relations,
        normalizedTitleLower: `${q.question} ${q.requiredKeywords.join(' ')}`.toLowerCase(),
        normalizedTagsLower: q.requiredKeywords.map((kw) => kw.toLowerCase()),
        normalizedBodyLower: bodyText.toLowerCase(),
        normalizedRelationsLower: relations.join(' ').toLowerCase()
      });
    }
  }

  return docs;
}

export function retrieveTextbookPassages(params: {
  query: string;
  corpusIndex: IndexedCorpusDocument[];
  edges: KnowledgeGraphEdge[];
  activeNodeId: string | null;
  topK?: number;
}): TextbookRetrievalResult {
  const {
    query,
    corpusIndex,
    edges,
    activeNodeId,
    topK = DEFAULT_TOP_PASSAGE_LIMIT
  } = params;

  const tokens = normalizeQueryTokens(query);
  const rawLower = query.trim().toLowerCase();
  const deicticQuery = isDeicticContextQuery(query);

  const neighborNodeIds = new Set<string>();
  if (activeNodeId) {
    for (const edge of edges) {
      if (edge.relation === 'BELONGS_TO_MODULE') continue;
      if (edge.source === activeNodeId) neighborNodeIds.add(edge.target);
      if (edge.target === activeNodeId) neighborNodeIds.add(edge.source);
    }
  }

  const scored: TextbookPassage[] = [];

  for (const doc of corpusIndex) {
    let lexicalScore = 0;

    if (rawLower.length >= MIN_TOKEN_LENGTH && doc.normalizedTitleLower.includes(rawLower)) {
      lexicalScore += SCORE_EXACT_TITLE_MATCH;
    }

    for (const token of tokens) {
      if (doc.normalizedTitleLower.includes(token)) {
        lexicalScore += SCORE_TITLE_TOKEN_MATCH;
      }
      if (doc.normalizedTagsLower.some((tag) => tag.includes(token))) {
        lexicalScore += SCORE_TAG_MATCH;
      }
      if (doc.normalizedBodyLower.includes(token)) {
        lexicalScore += SCORE_DEFINITION_TOKEN_MATCH;
      }
      if (doc.normalizedRelationsLower.includes(token)) {
        lexicalScore += SCORE_RELATION_TOKEN_MATCH;
      }
    }

    let contextBoost = 0;
    if (activeNodeId && doc.nodeId === activeNodeId) {
      contextBoost += deicticQuery
        ? SCORE_DEICTIC_ACTIVE_NODE_BOOST
        : lexicalScore > 0
          ? SCORE_ACTIVE_NODE_BOOST
          : 0;
    } else if (
      activeNodeId &&
      neighborNodeIds.has(doc.nodeId) &&
      (deicticQuery || lexicalScore > 0)
    ) {
      contextBoost += SCORE_ACTIVE_NEIGHBOR_BOOST;
    }

    const totalScore = lexicalScore + contextBoost;
    if (totalScore > 0) {
      scored.push({
        nodeId: doc.nodeId,
        moduleId: doc.moduleId,
        moduleNumber: doc.moduleNumber,
        kind: doc.kind,
        titleKo: doc.titleKo,
        titleEn: doc.titleEn,
        sourceMapping: doc.sourceMapping,
        tags: doc.tags,
        bodyText: doc.bodyText,
        interviewCue: doc.interviewCue,
        connectedRelations: doc.connectedRelations,
        relevanceScore: totalScore
      });
    }
  }

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  let selectedPassages = scored.slice(0, topK);

  // 직접 일치 토큰이 없더라도 현재 열람 노드가 있으면 참고 컨텍스트로 최소 제공 (단 maxRelevanceScore는 0 유지)
  const maxRelevanceScore =
    scored.length > 0 ? scored[0].relevanceScore : 0;

  if (selectedPassages.length === 0 && activeNodeId) {
    const activeDocs = corpusIndex.filter(
      (doc) => doc.nodeId === activeNodeId || neighborNodeIds.has(doc.nodeId)
    );
    selectedPassages = activeDocs
      .slice(0, CONTEXT_FALLBACK_PASSAGE_LIMIT)
      .map((doc) => ({
        nodeId: doc.nodeId,
        moduleId: doc.moduleId,
        moduleNumber: doc.moduleNumber,
        kind: doc.kind,
        titleKo: doc.titleKo,
        titleEn: doc.titleEn,
        sourceMapping: doc.sourceMapping,
        tags: doc.tags,
        bodyText: doc.bodyText,
        interviewCue: doc.interviewCue,
        connectedRelations: doc.connectedRelations,
        relevanceScore: 0
      }));
  }

  const formattedCorpusXml = formatPassagesAsXml(selectedPassages);

  return {
    query,
    normalizedTokens: tokens,
    passages: selectedPassages,
    maxRelevanceScore,
    formattedCorpusXml
  };
}

function formatPassagesAsXml(passages: TextbookPassage[]): string {
  if (passages.length === 0) {
    return '<TEXTBOOK_CORPUS status="EMPTY">일치하는 수록 교재 노드가 검색되지 않았습니다.</TEXTBOOK_CORPUS>';
  }

  const blocks = passages.map((p) => {
    const relationsText =
      p.connectedRelations.length > 0
        ? `\n    <GRAPH_RELATIONS>\n      ${p.connectedRelations.join('\n      ')}\n    </GRAPH_RELATIONS>`
        : '';
    const interviewText = p.interviewCue
      ? `\n    <INTERVIEW_APPLICATION>${p.interviewCue}</INTERVIEW_APPLICATION>`
      : '';

    return [
      `  <PASSAGE nodeId="${p.nodeId}" kind="${p.kind}" module="M${p.moduleNumber}" sourceMapping="${p.sourceMapping}" relevanceScore="${p.relevanceScore}">`,
      `    <TITLE_KO>${p.titleKo}</TITLE_KO>`,
      `    <TITLE_EN>${p.titleEn}</TITLE_EN>`,
      `    <BODY>\n${p.bodyText}\n    </BODY>${interviewText}${relationsText}`,
      `  </PASSAGE>`
    ].join('\n');
  });

  return `<TEXTBOOK_CORPUS count="${passages.length}">\n${blocks.join('\n')}\n</TEXTBOOK_CORPUS>`;
}

export function resolveTextbookCitations(
  citedNodeIds: string[],
  corpusIndex: IndexedCorpusDocument[]
): TextbookCitationItem[] {
  const byId = new Map<string, IndexedCorpusDocument>();
  for (const doc of corpusIndex) {
    byId.set(doc.nodeId, doc);
  }

  const seen = new Set<string>();
  const resolved: TextbookCitationItem[] = [];

  for (const rawId of citedNodeIds) {
    const cleanId = rawId.trim();
    if (!cleanId || seen.has(cleanId)) continue;
    const matched = byId.get(cleanId);
    if (!matched) continue;
    seen.add(cleanId);
    resolved.push({
      nodeId: matched.nodeId,
      moduleId: matched.moduleId,
      kind: matched.kind,
      nodeTitle:
        matched.kind === 'flashcard'
          ? `${matched.titleKo} (${matched.titleEn})`
          : matched.titleKo,
      sourceMapping: matched.sourceMapping
    });
  }

  return resolved;
}

export type { IndexedCorpusDocument };
