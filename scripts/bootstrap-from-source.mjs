#!/usr/bin/env node
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGET_ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOT = path.resolve(TARGET_ROOT, '..', 'dazzling-bell');

const MODULES = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5'];
const DB_FILES = ['theories.json', 'flashcards.json', 'cases.json', 'questions.json'];
const CONCEPT_IMAGES = [
  'mod1-vygotsky-zpd.png',
  'mod2-chc-clt.png',
  'mod3-fba-pbs.png',
  'mod4-working-memory.png',
  'mod5-sdt-restorative.png'
];

// 명세서 섹션 2.3 전 모듈 90개 원자화 노드 전수 매핑 테이블
const THEORY_GRAPH_MAPPING = {
  // Module 1 (16 nodes)
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
  // Module 2 (17 nodes)
  'mod2-theory-chc': {
    topology: 'hierarchy-pyramid',
    flashcards: ['mod2-fc-chc', 'mod2-fc-wmi-psi', 'mod2-fc-meshing'],
    cases: ['mod2-case-wisc-bottleneck'],
    questions: ['mod2-q-chc-clt']
  },
  'mod2-theory-clt-prosthetics': {
    topology: 'stacked-gauge',
    flashcards: ['mod2-fc-schema-automatization', 'mod2-fc-clt', 'mod2-fc-prosthetics'],
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
  // Module 3 (19 nodes)
  'mod3-theory-operant-punishment': {
    topology: 'matrix-2x2',
    flashcards: ['mod3-fc-negative-reinforcement', 'mod3-fc-presentation-removal-punishment'],
    cases: ['mod3-case-aggression-escape', 'mod3-case-escape'],
    questions: ['mod3-q-fba-pbs']
  },
  'mod3-theory-premack-shaping-task': {
    topology: 'step-flow',
    flashcards: ['mod3-fc-premack', 'mod3-fc-shaping-task-analysis', 'mod3-fc-token-response-cost'],
    cases: ['mod3-case-aggression-escape'],
    questions: ['mod3-q-shaping-premack']
  },
  'mod3-theory-aba-differential': {
    topology: 'matrix-2x2',
    flashcards: ['mod3-fc-extinction-burst', 'mod3-fc-differential-reinforcement'],
    cases: ['mod3-case-escape'],
    questions: ['mod3-q-extinction-burst-consultation']
  },
  'mod3-theory-fba-pbs': {
    topology: 'process-cycle',
    flashcards: ['mod3-fc-fba', 'mod3-fc-precorrection', 'mod3-fc-fct'],
    cases: ['mod3-case-aggression-escape', 'mod3-case-escape'],
    questions: ['mod3-q-fba-pbs', 'mod3-q-extinction-burst-consultation']
  },
  // Module 4 (19 nodes)
  'mod4-theory-ipm-working-memory': {
    topology: 'triadic-network',
    flashcards: ['mod4-fc-baddeley-wm'],
    cases: ['mod4-case-impulsive-initiation'],
    questions: ['mod4-q-working-memory-automatization']
  },
  'mod4-theory-clt-automatization-chunking': {
    topology: 'stacked-gauge',
    flashcards: ['mod4-fc-clt-three-loads', 'mod4-fc-schema-chunking', 'mod4-fc-worked-examples'],
    cases: ['mod4-case-impulsive-initiation'],
    questions: ['mod4-q-working-memory-automatization', 'mod4-q-meichenbaum-clt-prosthetics']
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
  // Module 5 (19 nodes)
  'mod5-theory-sdt': {
    topology: 'spectrum-continuum',
    flashcards: [
      'mod5-fc-sdt',
      'mod5-fc-informational-vs-controlling',
      'mod5-fc-internalization-continuum'
    ],
    cases: ['mod5-case-helplessness'],
    questions: ['mod5-q-sdt-feedback-overjustification', 'mod5-q-weiner-helplessness']
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

// 명세서 섹션 2.2 모듈 간 거시 연결 브릿지
const CROSS_MODULE_BRIDGES = [
  {
    source: 'mod1-theory-piaget',
    target: 'mod2-theory-chc',
    rationaleKo: '신피아제 학파의 작업기억 병목 해석이 CHC·WISC-V의 작업기억(WMI)·처리속도(PSI) 임상 프로파일 분석으로 확장됨'
  },
  {
    source: 'mod1-theory-vygotsky',
    target: 'mod2-theory-clt-prosthetics',
    rationaleKo: '근접발달영역(ZPD) 내 비계설정(Scaffolding)이 외재적 인지부하 축소 및 신경심리학적 환경적 보철 설계로 구체화됨'
  },
  {
    source: 'mod1-theory-vygotsky',
    target: 'mod4-theory-bandura-meichenbaum-casel',
    rationaleKo: '비고츠키의 사적 언어(Private Speech) 내면화 기제가 마이켄바움(Meichenbaum)의 5단계 자기교수법(CBM)의 이론적 뿌리가 됨'
  },
  {
    source: 'mod2-theory-chc',
    target: 'mod4-theory-ipm-working-memory',
    rationaleKo: 'WISC-V 작업기억 지표(WMI) 저하가 배들리(Baddeley) 다중요소 작업기억의 음운루프·시공간잡기장·중앙집행기 병목으로 정밀 해부됨'
  },
  {
    source: 'mod2-theory-clt-prosthetics',
    target: 'mod4-theory-clt-automatization-chunking',
    rationaleKo: '환경적 보철을 통한 외재적 부하 경감이 스웰러(Sweller)의 본유적 부하 확보 및 청킹·스키마 자동화로 직결됨'
  },
  {
    source: 'mod2-theory-adhd',
    target: 'mod3-theory-fba-pbs',
    rationaleKo: '바클리(Barkley)의 수행 시점(Point of Performance) 환경적 보철과 일일행동보고카드(DRC)가 FBA·PBS의 사전교정 및 대체행동 강화와 결합됨'
  },
  {
    source: 'mod3-theory-operant-punishment',
    target: 'mod5-theory-sdt',
    rationaleKo: '외적 보상·통제적 유관의 오남용이 데시와 라이언(SDT)의 자율성 욕구를 침해하여 과잉정당화 효과(내재동기 저하)를 유발함'
  },
  {
    source: 'mod4-theory-metacognition-srl',
    target: 'mod5-theory-attribution-helplessness',
    rationaleKo: '유창성 착각을 극복한 능동적 인출 연습과 지머만의 자기조절 전략 수정이 와이너의 통제 가능한 노력·전략 재귀인 훈련의 핵심 도구가 됨'
  },
  {
    source: 'mod1-theory-moral',
    target: 'mod5-theory-gordon-restorative-justice',
    rationaleKo: '닷지(Dodge)의 적대적 귀인 편향 교정 및 조망수용 훈련이 고든의 적극적 경청·나-전달법 및 회복적 서클(Restorative Circle) 대화 절차로 실현됨'
  }
];

async function copyFileEnsureDir(srcPath, destPath) {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.copyFile(srcPath, destPath);
}

async function runBootstrap() {
  console.log('=== [Phase 0] EduPsych Interactive Studio 부트스트랩 시작 ===');
  if (!existsSync(SOURCE_ROOT)) {
    throw new Error(`원본 경로를 찾을 수 없습니다: ${SOURCE_ROOT}`);
  }

  // 1. server/db 복사 및 항목 수 검증
  let totalTheories = 0;
  let totalFlashcards = 0;
  let totalCases = 0;
  let totalQuestions = 0;

  for (const modId of MODULES) {
    for (const file of DB_FILES) {
      const src = path.join(SOURCE_ROOT, 'server', 'db', modId, file);
      const dest = path.join(TARGET_ROOT, 'server', 'db', modId, file);
      await copyFileEnsureDir(src, dest);
      const parsed = JSON.parse(await fs.readFile(dest, 'utf-8'));
      if (file === 'theories.json') totalTheories += parsed.length;
      if (file === 'flashcards.json') totalFlashcards += parsed.length;
      if (file === 'cases.json') totalCases += parsed.length;
      if (file === 'questions.json') totalQuestions += parsed.length;
    }
  }

  for (const rootDbFile of ['manifest.json', 'user-progress.json']) {
    const src = path.join(SOURCE_ROOT, 'server', 'db', rootDbFile);
    const dest = path.join(TARGET_ROOT, 'server', 'db', rootDbFile);
    await copyFileEnsureDir(src, dest);
  }

  // 2. 시각 도식 블루프린트 복사 (mod1Visuals.ts ~ mod5Visuals.ts + theoryVisuals.ts)
  for (let i = 1; i <= 5; i++) {
    const fileName = `mod${i}Visuals.ts`;
    await copyFileEnsureDir(
      path.join(SOURCE_ROOT, 'src', 'data', 'visuals', fileName),
      path.join(TARGET_ROOT, 'src', 'data', 'visuals', fileName)
    );
  }
  await copyFileEnsureDir(
    path.join(SOURCE_ROOT, 'src', 'data', 'theoryVisuals.ts'),
    path.join(TARGET_ROOT, 'src', 'data', 'theoryVisuals.ts')
  );

  // 3. 기존 타입 및 시각 렌더러 복사
  await copyFileEnsureDir(
    path.join(SOURCE_ROOT, 'src', 'types', 'study.ts'),
    path.join(TARGET_ROOT, 'src', 'types', 'study.ts')
  );
  await copyFileEnsureDir(
    path.join(SOURCE_ROOT, 'src', 'types', 'visuals.ts'),
    path.join(TARGET_ROOT, 'src', 'types', 'visuals.ts')
  );
  await copyFileEnsureDir(
    path.join(SOURCE_ROOT, 'src', 'components', 'visuals', 'TheoryVisualRenderer.tsx'),
    path.join(TARGET_ROOT, 'src', 'components', 'visuals', 'TheoryVisualRenderer.tsx')
  );
  await copyFileEnsureDir(
    path.join(SOURCE_ROOT, 'src', 'components', 'visuals', 'CaseLensVisualRenderer.tsx'),
    path.join(TARGET_ROOT, 'src', 'components', 'visuals', 'CaseLensVisualRenderer.tsx')
  );

  // 4. public/images/concepts 5종 및 PWA 아이콘 복사
  for (const imgName of CONCEPT_IMAGES) {
    const src = path.join(SOURCE_ROOT, 'public', 'images', 'concepts', imgName);
    const dest = path.join(TARGET_ROOT, 'public', 'images', 'concepts', imgName);
    await copyFileEnsureDir(src, dest);
  }

  for (const iconName of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
    const src = path.join(SOURCE_ROOT, 'public', 'icons', iconName);
    const dest = path.join(TARGET_ROOT, 'public', 'icons', iconName);
    if (existsSync(src)) {
      await copyFileEnsureDir(src, dest);
    }
  }
  for (const pubFile of ['manifest.webmanifest', 'sw.js']) {
    const src = path.join(SOURCE_ROOT, 'public', pubFile);
    const dest = path.join(TARGET_ROOT, 'public', pubFile);
    if (existsSync(src)) {
      await copyFileEnsureDir(src, dest);
    }
  }

  // 5. server/db/graph-edges.json 생성
  const edges = [];
  let edgeSeq = 1;
  for (const [theoryId, mapping] of Object.entries(THEORY_GRAPH_MAPPING)) {
    const moduleId = theoryId.slice(0, 4);
    edges.push({
      id: `edge-${edgeSeq++}`,
      source: theoryId,
      target: moduleId,
      relation: 'BELONGS_TO_MODULE',
      rationaleKo: `${moduleId.toUpperCase()} 핵심 이론 축`
    });
    for (const fcId of mapping.flashcards) {
      edges.push({
        id: `edge-${edgeSeq++}`,
        source: theoryId,
        target: fcId,
        relation: 'DEFINES_TERM',
        rationaleKo: '이론에서 파생된 핵심 한-영 학술 용어 정의'
      });
    }
    for (const caseId of mapping.cases) {
      edges.push({
        id: `edge-${edgeSeq++}`,
        source: theoryId,
        target: caseId,
        relation: 'APPLIED_IN_CASE',
        rationaleKo: '교실 사례 다중 렌즈 진단 및 처방에 적용'
      });
    }
    for (const qId of mapping.questions) {
      edges.push({
        id: `edge-${edgeSeq++}`,
        source: theoryId,
        target: qId,
        relation: 'DEFENDS_QUESTION',
        rationaleKo: '실전 압박 면접 문항의 과학자-실무자 방어 논리 구성'
      });
    }
  }

  for (const bridge of CROSS_MODULE_BRIDGES) {
    edges.push({
      id: `edge-${edgeSeq++}`,
      source: bridge.source,
      target: bridge.target,
      relation: 'CROSS_MODULE_BRIDGE',
      rationaleKo: bridge.rationaleKo
    });
  }

  const graphEdgesPayload = {
    generatedAt: new Date().toISOString(),
    counts: {
      theories: totalTheories,
      flashcards: totalFlashcards,
      cases: totalCases,
      questions: totalQuestions,
      totalNodes: totalTheories + totalFlashcards + totalCases + totalQuestions,
      totalEdges: edges.length
    },
    theoryMappings: THEORY_GRAPH_MAPPING,
    crossModuleBridges: CROSS_MODULE_BRIDGES,
    edges
  };

  await fs.writeFile(
    path.join(TARGET_ROOT, 'server', 'db', 'graph-edges.json'),
    JSON.stringify(graphEdgesPayload, null, 2) + '\n',
    'utf-8'
  );

  const totalItems = totalTheories + totalFlashcards + totalCases + totalQuestions;
  console.log(
    `✓ DB 이관 검증 완료: 이론 ${totalTheories}개 + 플래시카드 ${totalFlashcards}장 + 사례 ${totalCases}건 + 면접 ${totalQuestions}문항 = 총 ${totalItems}개 원자화 노드`
  );
  console.log(`✓ 개념 앵커 PNG 5종 및 시각 도식 블루프린트 20개 이관 완료`);
  console.log(`✓ 지식 그래프 엣지 생성 완료: 총 ${edges.length}개 방향성 엣지 (server/db/graph-edges.json)`);

  if (
    totalTheories !== 20 ||
    totalFlashcards !== 47 ||
    totalCases !== 10 ||
    totalQuestions !== 13 ||
    totalItems !== 90
  ) {
    throw new Error('원본 데이터 90개 항목 검증 실패!');
  }
}

runBootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
