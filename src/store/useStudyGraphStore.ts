import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildCurriculumKnowledgeGraph,
  EDGE_SEMANTIC_WEIGHTS,
  MASTERY_NUMERIC_WEIGHTS,
  THEORY_GRAPH_MAPPING
} from '../data/curriculumGraph';
import {
  computeModuleSubgraphSummaries,
  computePrioritizedWeakQueue,
  resolveOptimalResumeTarget
} from '../data/graphIntelligence';
import {
  AppMode,
  MasteryState,
  ModuleId,
  StoryProgressState,
  UnifiedProgressGraph
} from '../types/graph';
import {
  ClassroomCase,
  Flashcard,
  FlashcardStatus,
  InterviewDraftRecord,
  InterviewQuestion,
  ManifestData,
  ModulePayload,
  StudyItemType,
  StudyItemUnion,
  TheoryConcept
} from '../types/study';
import { isLocalRuntime } from '../utils/assetUrl';

// 정적 폴백(Static Fallback)을 위한 로컬 DB JSON 초기 로드
import rawManifest from '../../server/db/manifest.json';
import rawUserProgress from '../../server/db/user-progress.json';

import mod1Theories from '../../server/db/mod1/theories.json';
import mod1Flashcards from '../../server/db/mod1/flashcards.json';
import mod1Cases from '../../server/db/mod1/cases.json';
import mod1Questions from '../../server/db/mod1/questions.json';

import mod2Theories from '../../server/db/mod2/theories.json';
import mod2Flashcards from '../../server/db/mod2/flashcards.json';
import mod2Cases from '../../server/db/mod2/cases.json';
import mod2Questions from '../../server/db/mod2/questions.json';

import mod3Theories from '../../server/db/mod3/theories.json';
import mod3Flashcards from '../../server/db/mod3/flashcards.json';
import mod3Cases from '../../server/db/mod3/cases.json';
import mod3Questions from '../../server/db/mod3/questions.json';

import mod4Theories from '../../server/db/mod4/theories.json';
import mod4Flashcards from '../../server/db/mod4/flashcards.json';
import mod4Cases from '../../server/db/mod4/cases.json';
import mod4Questions from '../../server/db/mod4/questions.json';

import mod5Theories from '../../server/db/mod5/theories.json';
import mod5Flashcards from '../../server/db/mod5/flashcards.json';
import mod5Cases from '../../server/db/mod5/cases.json';
import mod5Questions from '../../server/db/mod5/questions.json';

const LOCAL_STORAGE_PROGRESS_KEY = 'edupsych_studio_unified_progress_v2';
const LOCAL_STORAGE_MODULES_KEY = 'edupsych_studio_modules_cache_v2';
const PERCENTAGE_MULTIPLIER = 100;
const MIN_KEYWORD_TOKEN_LEN = 2;
const STORAGE_DEBOUNCE_MS = 250;
const HIGH_COVERAGE_THRESHOLD = 80;
const MEDIUM_COVERAGE_THRESHOLD = 50;
const CASE_NOTE_MASTERED_MIN_LEN = 20;
const THEORY_MASTERY_CHILD_RATIO = 0.7;
const WEAK_QUEUE_FULL_LIMIT = 90;

const DEFAULT_STORY_PROGRESS: StoryProgressState = {
  visitedBeats: {},
  simulationChoices: {},
  completedModules: [],
  lastActiveNodeId: 'mod1-theory-piaget'
};

const STATIC_INITIAL_MODULES: ModulePayload[] = [
  {
    id: 'mod1',
    number: 1,
    title: '인지·자아·사회·도덕성 발달',
    subtitle: 'Cognitive, Self, Social & Moral Development',
    sourceMapping: 'Woolfolk Ch.2, 3 / Seifert & Sutton Ch.3',
    description:
      '피아제·비고츠키 인지발달론의 현대적 재해석(신피아제 학파·작업기억 병목), 브론펜브레너 생태체계이론, 에릭슨·마샤 정체성 발달, 마음이론과 사회정보처리모형 기반 도덕·사회성 발달을 다룹니다.',
    theories: mod1Theories as TheoryConcept[],
    flashcards: mod1Flashcards as Flashcard[],
    cases: mod1Cases as ClassroomCase[],
    questions: mod1Questions as InterviewQuestion[]
  },
  {
    id: 'mod2',
    number: 2,
    title: '학습자 다양성과 특수 교육적 요구',
    subtitle: 'Learner Differences, CHC/Wechsler, CLT, Prosthetics, RTI & ADHD',
    sourceMapping: 'Woolfolk Ch.4 / Seifert & Sutton Ch.4, 5',
    description:
      '가드너 다중지능·학습양식 통념 비판과 CHC/웩슬러 지능이론, 유동성 지능의 안정성을 보완하는 스키마 자동화·인지부하이론(CLT), 신경심리학적 환경적 보철, RTI/MTSS 및 ADHD 실행기능 지원을 다룹니다.',
    theories: mod2Theories as TheoryConcept[],
    flashcards: mod2Flashcards as Flashcard[],
    cases: mod2Cases as ClassroomCase[],
    questions: mod2Questions as InterviewQuestion[]
  },
  {
    id: 'mod3',
    number: 3,
    title: '행동주의 학습이론과 긍정적 행동지원',
    subtitle: 'Behavioral Learning, FBA & Positive Behavior Support (PBS)',
    sourceMapping: 'Woolfolk Ch.7 / Seifert & Sutton Ch.2',
    description:
      '조작적 조건형성, 부적 강화와 처벌의 역설, 기능적 행동평가(FBA: A-B-C 분석), 사전교정(Precorrection), 대체행동 교수 및 긍정적 행동지원(PBS)을 다룹니다.',
    theories: mod3Theories as TheoryConcept[],
    flashcards: mod3Flashcards as Flashcard[],
    cases: mod3Cases as ClassroomCase[],
    questions: mod3Questions as InterviewQuestion[]
  },
  {
    id: 'mod4',
    number: 4,
    title: '인지·사회인지 학습과 자기조절',
    subtitle: 'Cognitive & Social Cognitive Learning, Metacognition & SRL',
    sourceMapping: 'Woolfolk Ch.8, 9, 11 / Seifert & Sutton Ch.2, 9',
    description:
      '작업기억-장기기억 정보처리 모형, 메타인지(유창성 착각)와 바람직한 어려움(인출연습·분산학습), 반두라 자기효능감과 짐머만의 자기조절학습(SRL) 3단계 순환 모형을 다룹니다.',
    theories: mod4Theories as TheoryConcept[],
    flashcards: mod4Flashcards as Flashcard[],
    cases: mod4Cases as ClassroomCase[],
    questions: mod4Questions as InterviewQuestion[]
  },
  {
    id: 'mod5',
    number: 5,
    title: '학습 동기 및 상담적 학급경영',
    subtitle: 'Motivation (SDT, Attribution, Self-Worth) & Classroom Management',
    sourceMapping: 'Woolfolk Ch.12, 13 / Seifert & Sutton Ch.6, 7, 8',
    description:
      '데시와 라이언의 자기결정성이론(자율성·유능감·관계성), 와이너 귀인이론, 코빙턴 자기가치이론(자기구실 만들기) 및 고든 의사소통·회복적 정의를 다룹니다.',
    theories: mod5Theories as TheoryConcept[],
    flashcards: mod5Flashcards as Flashcard[],
    cases: mod5Cases as ClassroomCase[],
    questions: mod5Questions as InterviewQuestion[]
  }
];

export function evaluateKeywordMatch(
  userText: string,
  keywordExpression: string
): boolean {
  const normalizedInput = userText.toLowerCase().replace(/\s+/g, '');
  if (!normalizedInput) {
    return false;
  }

  const normalizedFull = keywordExpression.toLowerCase().replace(/\s+/g, '');
  if (normalizedInput.includes(normalizedFull)) {
    return true;
  }

  const tokens = keywordExpression
    .split(/[()[\]/,:·]|vs\.|및/gi)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length >= MIN_KEYWORD_TOKEN_LEN);

  return tokens.some((token) => {
    const clean = token.toLowerCase().replace(/\s+/g, '');
    return (
      clean.length >= MIN_KEYWORD_TOKEN_LEN && normalizedInput.includes(clean)
    );
  });
}

export function analyzeInterviewKeywords(
  combinedAnswerText: string,
  requiredKeywords: string[]
): {
  matchedKeywords: string[];
  missingKeywords: string[];
  coveragePercent: number;
} {
  if (requiredKeywords.length === 0) {
    return {
      matchedKeywords: [],
      missingKeywords: [],
      coveragePercent: PERCENTAGE_MULTIPLIER
    };
  }

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of requiredKeywords) {
    if (evaluateKeywordMatch(combinedAnswerText, kw)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const coveragePercent = Math.round(
    (matchedKeywords.length / requiredKeywords.length) * PERCENTAGE_MULTIPLIER
  );

  return { matchedKeywords, missingKeywords, coveragePercent };
}

function normalizeProgress(
  raw: Partial<UnifiedProgressGraph> | null | undefined
): UnifiedProgressGraph {
  const base = raw ?? {};
  const rawStory = (base.story ?? {}) as Partial<StoryProgressState>;
  return {
    updatedAt: base.updatedAt ?? new Date().toISOString(),
    preferredEntryMode:
      base.preferredEntryMode === 'workspace'
        ? 'workspace'
        : base.preferredEntryMode === 'story'
        ? 'story'
        : 'home',
    story: {
      visitedBeats: rawStory.visitedBeats ?? {},
      simulationChoices: rawStory.simulationChoices ?? {},
      completedModules: Array.isArray(rawStory.completedModules)
        ? (rawStory.completedModules as ModuleId[])
        : [],
      lastActiveNodeId:
        rawStory.lastActiveNodeId ?? DEFAULT_STORY_PROGRESS.lastActiveNodeId
    },
    flashcardStatus: base.flashcardStatus ?? {},
    userNotes: base.userNotes ?? {},
    bookmarks: Array.isArray(base.bookmarks) ? base.bookmarks : [],
    interviewDrafts: base.interviewDrafts ?? {}
  };
}

function loadFallbackProgress(): UnifiedProgressGraph {
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_PROGRESS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<UnifiedProgressGraph>;
      return normalizeProgress(parsed);
    }
  } catch {
    // ignore localStorage read errors
  }
  return normalizeProgress(rawUserProgress as Partial<UnifiedProgressGraph>);
}

function loadFallbackModules(): ModulePayload[] {
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_MODULES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ModulePayload[];
      if (
        Array.isArray(parsed) &&
        parsed.length === STATIC_INITIAL_MODULES.length
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore localStorage read errors
  }
  return STATIC_INITIAL_MODULES;
}

export function useStudyGraphStore() {
  const [manifest, setManifest] = useState<ManifestData>(
    () => rawManifest as ManifestData
  );
  const [modules, setModules] = useState<ModulePayload[]>(() =>
    loadFallbackModules()
  );
  const [userProgress, setUserProgress] = useState<UnifiedProgressGraph>(() =>
    loadFallbackProgress()
  );
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);

  // 초기 마운트 시 로컬 REST API(/api/manifest, /api/module/all)와 동기화 (원격 정적 배포 시 스킵)
  useEffect(() => {
    if (!isLocalRuntime()) {
      return;
    }
    let active = true;
    (async () => {
      try {
        const [manifestRes, modulesRes] = await Promise.all([
          fetch('/api/manifest'),
          fetch('/api/module/all')
        ]);
        if (!manifestRes.ok || !modulesRes.ok) {
          return;
        }
        const manifestJson = (await manifestRes.json()) as {
          manifest: ManifestData;
          userProgress: Partial<UnifiedProgressGraph>;
        };
        const modulesJson = (await modulesRes.json()) as {
          modules: ModulePayload[];
        };

        if (active) {
          setManifest(manifestJson.manifest);
          setUserProgress((prev) => {
            const serverNorm = normalizeProgress(manifestJson.userProgress);
            return {
              ...serverNorm,
              story: {
                visitedBeats: {
                  ...serverNorm.story.visitedBeats,
                  ...prev.story.visitedBeats
                },
                simulationChoices: {
                  ...serverNorm.story.simulationChoices,
                  ...prev.story.simulationChoices
                },
                completedModules: Array.from(
                  new Set([
                    ...serverNorm.story.completedModules,
                    ...prev.story.completedModules
                  ])
                ),
                lastActiveNodeId:
                  prev.story.lastActiveNodeId ??
                  serverNorm.story.lastActiveNodeId
              }
            };
          });
          setModules(modulesJson.modules);
          setIsServerConnected(true);
        }
      } catch {
        if (active) {
          setIsServerConnected(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // localStorage 자동 백업 (250ms 디바운스)
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          LOCAL_STORAGE_PROGRESS_KEY,
          JSON.stringify(userProgress)
        );
        window.localStorage.setItem(
          LOCAL_STORAGE_MODULES_KEY,
          JSON.stringify(modules)
        );
      } catch {
        // ignore quota errors
      }
    }, STORAGE_DEBOUNCE_MS);

    return () => window.clearTimeout(timerId);
  }, [userProgress, modules]);

  // userProgress 오버레이가 반영된 통합 모듈 데이터 (story 비트 변경 시 불필요한 그래프 재생성 방지)
  const enrichedModules = useMemo(() => {
    return modules.map((mod) => ({
      ...mod,
      theories: mod.theories.map((t) => ({
        ...t,
        userNote: userProgress.userNotes[t.id] ?? t.userNote ?? ''
      })),
      flashcards: mod.flashcards.map((fc) => ({
        ...fc,
        status: (userProgress.flashcardStatus[fc.id] ??
          fc.status ??
          'unseen') as FlashcardStatus
      }))
    }));
  }, [modules, userProgress.userNotes, userProgress.flashcardStatus]);

  const allTheories = useMemo(
    () => enrichedModules.flatMap((m) => m.theories),
    [enrichedModules]
  );
  const allFlashcards = useMemo(
    () => enrichedModules.flatMap((m) => m.flashcards),
    [enrichedModules]
  );
  const allCases = useMemo(
    () => enrichedModules.flatMap((m) => m.cases),
    [enrichedModules]
  );
  const allQuestions = useMemo(
    () => enrichedModules.flatMap((m) => m.questions),
    [enrichedModules]
  );

  // 90-Node 도메인 지식 그래프 빌드
  const curriculumGraph = useMemo(
    () => buildCurriculumKnowledgeGraph(enrichedModules),
    [enrichedModules]
  );

  // 상향식 숙련도 상태(MasteryState) 및 연속 스칼라 점수(nodeMasteryScoreMap) 동시 전파
  const { nodeMasteryMap, nodeMasteryScoreMap } = useMemo(() => {
    const map: Record<string, MasteryState> = {};
    const scoreMap: Record<string, number> = {};

    // 1. 플래시카드 노드 직접 매핑
    for (const fc of allFlashcards) {
      if (fc.status === 'mastered') map[fc.id] = 'mastered';
      else if (fc.status === 'review') map[fc.id] = 'review';
      else if (fc.status === 'again') map[fc.id] = 'weak';
      else map[fc.id] = 'unseen';
      scoreMap[fc.id] = MASTERY_NUMERIC_WEIGHTS[map[fc.id]];
    }

    // 2. 면접 문항 노드 매핑 (coveragePercent 기준)
    for (const q of allQuestions) {
      const draft = userProgress.interviewDrafts[q.id];
      if (!draft) {
        map[q.id] = 'unseen';
      } else if (draft.coveragePercent >= HIGH_COVERAGE_THRESHOLD) {
        map[q.id] = 'mastered';
      } else if (draft.coveragePercent >= MEDIUM_COVERAGE_THRESHOLD) {
        map[q.id] = 'review';
      } else {
        map[q.id] = 'weak';
      }
      scoreMap[q.id] = MASTERY_NUMERIC_WEIGHTS[map[q.id]];
    }

    // 3. 교실 사례 노드 매핑 (블라인드 개입안 작성 길이 기준)
    for (const c of allCases) {
      const note = (userProgress.userNotes[c.id] ?? '').trim();
      if (note.length >= CASE_NOTE_MASTERED_MIN_LEN) {
        map[c.id] = 'mastered';
      } else if (note.length > 0) {
        map[c.id] = 'review';
      } else {
        map[c.id] = 'unseen';
      }
      scoreMap[c.id] = MASTERY_NUMERIC_WEIGHTS[map[c.id]];
    }

    // 4. 이론 노드 상향식 집계 (DEFINES_TERM + DEFENDS_QUESTION 가중 전파)
    for (const t of allTheories) {
      const mapping = THEORY_GRAPH_MAPPING[t.id];
      const fcChildren = mapping?.flashcards ?? [];
      const qChildren = mapping?.questions ?? [];
      const childIds = [...fcChildren, ...qChildren];
      const states = childIds.map((id) => map[id] ?? 'unseen');
      const hasWeak = states.includes('weak');
      const masteredCount = states.filter((s) => s === 'mastered').length;
      const reviewCount = states.filter((s) => s === 'review').length;
      const hasNote = (userProgress.userNotes[t.id] ?? '').trim().length > 0;
      const hasSim = t.id in userProgress.story.simulationChoices;

      if (hasWeak) {
        map[t.id] = 'weak';
      } else if (
        childIds.length > 0 &&
        masteredCount >= Math.ceil(childIds.length * THEORY_MASTERY_CHILD_RATIO)
      ) {
        map[t.id] = 'mastered';
      } else if (masteredCount > 0 || reviewCount > 0 || hasNote || hasSim) {
        map[t.id] = 'review';
      } else {
        map[t.id] = 'unseen';
      }

      let weightedSum = 0;
      let weightTotal = 0;
      for (const fcId of fcChildren) {
        const w = EDGE_SEMANTIC_WEIGHTS.DEFINES_TERM;
        weightedSum += w * (scoreMap[fcId] ?? 0);
        weightTotal += w;
      }
      for (const qId of qChildren) {
        const w = EDGE_SEMANTIC_WEIGHTS.DEFENDS_QUESTION;
        weightedSum += w * (scoreMap[qId] ?? 0);
        weightTotal += w;
      }

      scoreMap[t.id] =
        weightTotal > 0
          ? weightedSum / weightTotal
          : MASTERY_NUMERIC_WEIGHTS[map[t.id]];
    }

    return { nodeMasteryMap: map, nodeMasteryScoreMap: scoreMap };
  }, [
    allFlashcards,
    allQuestions,
    allCases,
    allTheories,
    userProgress.interviewDrafts,
    userProgress.userNotes,
    userProgress.story.simulationChoices
  ]);

  const resumeTarget = useMemo(
    () =>
      resolveOptimalResumeTarget(
        enrichedModules,
        curriculumGraph,
        userProgress,
        nodeMasteryMap
      ),
    [enrichedModules, curriculumGraph, userProgress, nodeMasteryMap]
  );

  const moduleSummaries = useMemo(
    () =>
      computeModuleSubgraphSummaries(
        enrichedModules,
        curriculumGraph,
        nodeMasteryMap,
        nodeMasteryScoreMap,
        userProgress.story.completedModules
      ),
    [
      enrichedModules,
      curriculumGraph,
      nodeMasteryMap,
      nodeMasteryScoreMap,
      userProgress.story.completedModules
    ]
  );

  const prioritizedWeakQueue = useMemo(
    () =>
      computePrioritizedWeakQueue(
        curriculumGraph,
        nodeMasteryMap,
        WEAK_QUEUE_FULL_LIMIT
      ),
    [curriculumGraph, nodeMasteryMap]
  );

  const computeNodeMastery = useCallback(
    (nodeId: string): MasteryState => {
      return nodeMasteryMap[nodeId] ?? 'unseen';
    },
    [nodeMasteryMap]
  );

  // PATCH /api/item/:id 공통 호출기 (로컬 런타임 전용)
  const patchItemOnServer = useCallback(
    async (itemId: string, patchPayload: Record<string, unknown>) => {
      if (!isLocalRuntime()) {
        return;
      }
      try {
        const res = await fetch(`/api/item/${encodeURIComponent(itemId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patch: patchPayload })
        });
        if (res.ok) {
          const data = (await res.json()) as {
            manifest?: ManifestData;
          };
          if (data.manifest) setManifest(data.manifest);
          setIsServerConnected(true);
        }
      } catch {
        setIsServerConnected(false);
      }
    },
    []
  );

  // 스토리 진행 상태 업데이트 (스크롤 비트 진입, 미니 시뮬레이션 투표, 모듈 완주 체크포인트)
  const markBeatVisited = useCallback(
    (beatId: string, primaryNodeId?: string) => {
      setUserProgress((prev) => {
        const alreadyVisited = Boolean(prev.story.visitedBeats[beatId]);
        const sameActive =
          !primaryNodeId || prev.story.lastActiveNodeId === primaryNodeId;
        if (alreadyVisited && sameActive) {
          return prev;
        }
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          story: {
            ...prev.story,
            visitedBeats: {
              ...prev.story.visitedBeats,
              [beatId]: true
            },
            lastActiveNodeId: primaryNodeId ?? prev.story.lastActiveNodeId
          }
        };
      });
    },
    []
  );

  const recordSimulationChoice = useCallback(
    (theoryId: string, optionIndex: number) => {
      setUserProgress((prev) => {
        const nextStory: StoryProgressState = {
          ...prev.story,
          simulationChoices: {
            ...prev.story.simulationChoices,
            [theoryId]: optionIndex
          },
          lastActiveNodeId: theoryId
        };
        void patchItemOnServer(theoryId, { story: nextStory });
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          story: nextStory
        };
      });
    },
    [patchItemOnServer]
  );

  const toggleModuleCompleted = useCallback(
    (moduleId: ModuleId, forceCompleted?: boolean) => {
      setUserProgress((prev) => {
        const exists = prev.story.completedModules.includes(moduleId);
        const shouldComplete =
          typeof forceCompleted === 'boolean' ? forceCompleted : !exists;
        const nextCompleted = shouldComplete
          ? exists
            ? prev.story.completedModules
            : [...prev.story.completedModules, moduleId]
          : prev.story.completedModules.filter((m) => m !== moduleId);

        const nextStory: StoryProgressState = {
          ...prev.story,
          completedModules: nextCompleted
        };
        void patchItemOnServer(moduleId, { story: nextStory });
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          story: nextStory
        };
      });
    },
    [patchItemOnServer]
  );

  const setLastActiveNode = useCallback((nodeId: string) => {
    setUserProgress((prev) => {
      if (prev.story.lastActiveNodeId === nodeId) return prev;
      return {
        ...prev,
        story: {
          ...prev.story,
          lastActiveNodeId: nodeId
        }
      };
    });
  }, []);

  const setPreferredEntryMode = useCallback(
    (mode: AppMode) => {
      setUserProgress((prev) => {
        if (prev.preferredEntryMode === mode) return prev;
        void patchItemOnServer('global', { preferredEntryMode: mode });
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          preferredEntryMode: mode
        };
      });
    },
    [patchItemOnServer]
  );

  // 1. 이론 비판적 노트(또는 사례 메모) 저장
  const updateItemNote = useCallback(
    (itemId: string, userNote: string) => {
      setUserProgress((prev) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        userNotes: {
          ...prev.userNotes,
          [itemId]: userNote
        }
      }));

      setModules((prev) =>
        prev.map((mod) => ({
          ...mod,
          theories: mod.theories.map((t) =>
            t.id === itemId ? { ...t, userNote } : t
          )
        }))
      );

      void patchItemOnServer(itemId, { userNote });
    },
    [patchItemOnServer]
  );

  // 1-2. 이론 본문 내용 직접 수정
  const updateTheoryContent = useCallback(
    async (theoryId: string, updatedFields: Partial<TheoryConcept>) => {
      if (typeof updatedFields.userNote === 'string') {
        const noteVal = updatedFields.userNote;
        setUserProgress((prev) => ({
          ...prev,
          updatedAt: new Date().toISOString(),
          userNotes: {
            ...prev.userNotes,
            [theoryId]: noteVal
          }
        }));
      }

      setModules((prev) =>
        prev.map((mod) => ({
          ...mod,
          theories: mod.theories.map((t) =>
            t.id === theoryId ? { ...t, ...updatedFields } : t
          )
        }))
      );

      await patchItemOnServer(
        theoryId,
        updatedFields as Record<string, unknown>
      );
    },
    [patchItemOnServer]
  );

  // 2. 플래시카드 숙련도 변경 (스토리 인라인 & 워크스페이스 실시간 공유)
  const updateFlashcardStatus = useCallback(
    (cardId: string, status: FlashcardStatus) => {
      setUserProgress((prev) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        flashcardStatus: {
          ...prev.flashcardStatus,
          [cardId]: status
        }
      }));

      setModules((prev) =>
        prev.map((mod) => ({
          ...mod,
          flashcards: mod.flashcards.map((fc) =>
            fc.id === cardId ? { ...fc, status } : fc
          )
        }))
      );

      void patchItemOnServer(cardId, { status });
    },
    [patchItemOnServer]
  );

  // 3. 북마크 토글
  const toggleBookmark = useCallback(
    (itemId: string) => {
      let nextBookmarkedState = false;
      setUserProgress((prev) => {
        const exists = prev.bookmarks.includes(itemId);
        nextBookmarkedState = !exists;
        const nextBookmarks = exists
          ? prev.bookmarks.filter((id) => id !== itemId)
          : [...prev.bookmarks, itemId];
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          bookmarks: nextBookmarks
        };
      });

      void patchItemOnServer(itemId, { bookmarked: nextBookmarkedState });
    },
    [patchItemOnServer]
  );

  // 4. 실전 면접 답변 저장
  const saveInterviewDraft = useCallback(
    (
      questionId: string,
      mainAnswer: string,
      followUpAnswer: string,
      requiredKeywords: string[]
    ): InterviewDraftRecord => {
      const combined = `${mainAnswer} ${followUpAnswer}`;
      const { matchedKeywords, missingKeywords, coveragePercent } =
        analyzeInterviewKeywords(combined, requiredKeywords);

      const draft: InterviewDraftRecord = {
        questionId,
        mainAnswer,
        followUpAnswer,
        matchedKeywords,
        missingKeywords,
        coveragePercent,
        updatedAt: new Date().toISOString()
      };

      setUserProgress((prev) => ({
        ...prev,
        updatedAt: draft.updatedAt,
        interviewDrafts: {
          ...prev.interviewDrafts,
          [questionId]: draft
        }
      }));

      void patchItemOnServer(questionId, { interviewDraft: draft });
      return draft;
    },
    [patchItemOnServer]
  );

  // 5. 새 학습 항목 추가
  const createNewItem = useCallback(
    async (type: StudyItemType, moduleId: ModuleId, item: StudyItemUnion) => {
      setModules((prev) =>
        prev.map((mod) => {
          if (mod.id !== moduleId) return mod;
          if (type === 'theory') {
            return { ...mod, theories: [...mod.theories, item as TheoryConcept] };
          }
          if (type === 'flashcard') {
            return {
              ...mod,
              flashcards: [...mod.flashcards, item as Flashcard]
            };
          }
          if (type === 'case') {
            return { ...mod, cases: [...mod.cases, item as ClassroomCase] };
          }
          return {
            ...mod,
            questions: [...mod.questions, item as InterviewQuestion]
          };
        })
      );

      if (!isLocalRuntime()) {
        return;
      }

      try {
        const res = await fetch('/api/item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, moduleId, item })
        });
        if (res.ok) {
          const data = (await res.json()) as { manifest?: ManifestData };
          if (data.manifest) {
            setManifest(data.manifest);
          }
          setIsServerConnected(true);
        }
      } catch {
        setIsServerConnected(false);
      }
    },
    []
  );

  // 6. JSON 백업 내보내기 / 복원 / 진도 초기화
  const exportBackupJson = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      userProgress,
      modules: enrichedModules
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `edupsych-studio-backup-${dateStamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [userProgress, enrichedModules]);

  const importBackupJson = useCallback(
    async (file: File): Promise<{ success: boolean; message: string }> => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as {
          userProgress?: Partial<UnifiedProgressGraph>;
        } & Partial<UnifiedProgressGraph>;

        const sourceProgress = parsed.userProgress ?? parsed;
        const restoredProgress = normalizeProgress(sourceProgress);

        setUserProgress(restoredProgress);

        if (isLocalRuntime()) {
          try {
            await fetch('/api/progress', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(restoredProgress)
            });
          } catch {
            // fallback handled by localStorage effect
          }
        }

        return {
          success: true,
          message:
            'JSON 백업 파일이 스토리·워크스페이스 통합 진행도 DB에 성공적으로 복원되었습니다.'
        };
      } catch {
        return {
          success: false,
          message: 'JSON 파일 형식이 올바르지 않습니다.'
        };
      }
    },
    []
  );

  const resetAllProgress = useCallback(async () => {
    const emptyProgress: UnifiedProgressGraph = {
      updatedAt: new Date().toISOString(),
      preferredEntryMode: 'home',
      story: DEFAULT_STORY_PROGRESS,
      flashcardStatus: {},
      userNotes: {},
      bookmarks: [],
      interviewDrafts: {}
    };
    setUserProgress(emptyProgress);
    if (isLocalRuntime()) {
      try {
        await fetch('/api/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emptyProgress)
        });
      } catch {
        // ignore offline
      }
    }
  }, []);

  return {
    manifest,
    modules: enrichedModules,
    allTheories,
    allFlashcards,
    allCases,
    allQuestions,
    curriculumGraph,
    nodeMasteryMap,
    nodeMasteryScoreMap,
    resumeTarget,
    moduleSummaries,
    prioritizedWeakQueue,
    computeNodeMastery,
    userProgress,
    isServerConnected,
    markBeatVisited,
    recordSimulationChoice,
    toggleModuleCompleted,
    setLastActiveNode,
    setPreferredEntryMode,
    updateItemNote,
    updateTheoryContent,
    updateFlashcardStatus,
    toggleBookmark,
    saveInterviewDraft,
    createNewItem,
    exportBackupJson,
    importBackupJson,
    resetAllProgress
  };
}
