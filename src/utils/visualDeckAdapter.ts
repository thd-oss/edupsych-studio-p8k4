import { CaseLenses, ClassroomCase } from '../types/study';
import {
  ClinicalContrastRow,
  ConcentricLayerItem,
  ContinuumStageNode,
  MatrixQuadrantItem,
  ProcessStepNode,
  PyramidTierItem,
  StackedGaugeBar,
  TheoryVisualBlueprint,
  TriadicNodeItem
} from '../types/visuals';

export type DeckAccentTone =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'violet'
  | 'slate';

export type VisualDeckModality =
  | 'diagram'
  | 'contrast'
  | 'simulation'
  | 'infographic';

export interface VisualDeckGaugeSegment {
  label: string;
  percent: number;
  tone: 'indigo' | 'rose' | 'emerald' | 'slate';
}

export interface VisualDeckContrastPair {
  naiveLabel: string;
  naiveBody: string;
  evidenceLabel: string;
  evidenceBody: string;
}

export interface VisualDeckSlide {
  id: string;
  stepBadge: string;
  secondaryBadge?: string;
  chipLabel: string;
  title: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  calloutLabel?: string;
  calloutText?: string;
  footerFlowHint?: string;
  gaugeSegments?: VisualDeckGaugeSegment[];
  contrastPair?: VisualDeckContrastPair;
  imageUrl?: string;
  imageAlt?: string;
  accent: DeckAccentTone;
}

const CHIP_TITLE_MAX_CHARS = 14;

function shortenChipTitle(title: string): string {
  const withoutParen = title.replace(/\s*\([^)]*\)/g, '').trim();
  const base = withoutParen || title.trim();
  if (base.length <= CHIP_TITLE_MAX_CHARS) {
    return base;
  }
  return `${base.slice(0, CHIP_TITLE_MAX_CHARS)}…`;
}

function mapQuadrantToneToAccent(
  tone: MatrixQuadrantItem['tone']
): DeckAccentTone {
  switch (tone) {
    case 'positive':
      return 'emerald';
    case 'caution':
      return 'amber';
    case 'critical':
      return 'rose';
    default:
      return 'indigo';
  }
}

function buildPyramidSlides(
  theoryId: string,
  tiers: PyramidTierItem[]
): VisualDeckSlide[] {
  return tiers.map((tier, idx) => ({
    id: `${theoryId}-pyr-${idx}`,
    stepBadge: tier.tierLabel,
    secondaryBadge: tier.proportion ? `비중 ${tier.proportion}` : undefined,
    chipLabel: `${tier.tierLabel} · ${shortenChipTitle(tier.title)}`,
    title: tier.title,
    subtitle: tier.subtitle,
    bullets: tier.details,
    footerFlowHint:
      idx < tiers.length - 1
        ? '다음 상위 지원 층위로 이동 →'
        : '다층 지원 체계(MTSS) 최상위 집중 개입 단계',
    accent: tier.accentColor
  }));
}

function buildConcentricSlides(
  theoryId: string,
  layers: ConcentricLayerItem[]
): VisualDeckSlide[] {
  return layers.map((layer, idx) => ({
    id: `${theoryId}-ring-${idx}`,
    stepBadge: layer.ringName,
    secondaryBadge: `동심원 층위 ${idx + 1}/${layers.length}`,
    chipLabel: `${layer.ringName} · ${shortenChipTitle(layer.title)}`,
    title: layer.title,
    subtitle: layer.subtitle,
    bullets: layer.examples,
    footerFlowHint:
      idx < layers.length - 1
        ? '바깥 생태계 층위로 확장 →'
        : '거시·시간체계 상호작용 종합',
    accent: layer.accentColor
  }));
}

function buildMatrixSlides(
  theoryId: string,
  matrixAxis: NonNullable<TheoryVisualBlueprint['matrixAxis']>
): VisualDeckSlide[] {
  return matrixAxis.quadrants.map((quad, idx) => ({
    id: `${theoryId}-quad-${idx}`,
    stepBadge: `사분면 ${idx + 1}`,
    secondaryBadge: quad.badgeText,
    chipLabel: shortenChipTitle(quad.quadrantTitle),
    title: quad.quadrantTitle,
    subtitle: `${quad.rowLabel} × ${quad.colLabel}`,
    body: quad.summary,
    calloutLabel: '교실·상담 현장 적용',
    calloutText: quad.example,
    footerFlowHint: `교차축: ${matrixAxis.xAxisLabel} / ${matrixAxis.yAxisLabel}`,
    accent: mapQuadrantToneToAccent(quad.tone)
  }));
}

function buildStackedGaugeSlides(
  theoryId: string,
  gauges: StackedGaugeBar[]
): VisualDeckSlide[] {
  return gauges.map((bar, idx) => {
    const segments: VisualDeckGaugeSegment[] = [];
    if (bar.intrinsicPercent > 0) {
      segments.push({
        label: '내재적 부하',
        percent: bar.intrinsicPercent,
        tone: 'indigo'
      });
    }
    if (bar.extraneousPercent > 0) {
      segments.push({
        label: '외재적 부하',
        percent: bar.extraneousPercent,
        tone: 'rose'
      });
    }
    if (bar.germanePercent > 0) {
      segments.push({
        label: '본유적(스키마)',
        percent: bar.germanePercent,
        tone: 'emerald'
      });
    }
    if (bar.unusedPercent > 0) {
      segments.push({
        label: '여유 용량',
        percent: bar.unusedPercent,
        tone: 'slate'
      });
    }

    return {
      id: `${theoryId}-gauge-${idx}`,
      stepBadge: `시나리오 ${idx + 1}`,
      secondaryBadge:
        bar.overflowWarning ?? `본유적 부하 ${bar.germanePercent}% 확보`,
      chipLabel: shortenChipTitle(bar.label),
      title: bar.label,
      subtitle: '전체 작업기억 한계 용량 = 100% (4±1 청크)',
      body: bar.caption,
      gaugeSegments: segments,
      accent: bar.overflowWarning ? 'rose' : 'emerald'
    };
  });
}

function buildProcessSlides(
  theoryId: string,
  steps: ProcessStepNode[],
  isCyclical: boolean
): VisualDeckSlide[] {
  return steps.map((step, idx) => {
    const isLast = idx === steps.length - 1;
    const footerFlowHint = !isLast
      ? '다음 단계로 이행 →'
      : isCyclical
        ? '↻ 1단계로 피드백 순환 (Cyclical Loop)'
        : '✓ 최종 내면화·일반화 달성';

    return {
      id: `${theoryId}-step-${idx}`,
      stepBadge: step.stepNumber,
      secondaryBadge: step.highlightBadge,
      chipLabel: `${step.stepNumber} · ${shortenChipTitle(step.title)}`,
      title: step.title,
      subtitle: step.subtitle,
      body: step.description,
      footerFlowHint,
      accent: isCyclical ? 'sky' : 'indigo'
    };
  });
}

function buildSpectrumSlides(
  theoryId: string,
  stages: ContinuumStageNode[]
): VisualDeckSlide[] {
  return stages.map((stage, idx) => ({
    id: `${theoryId}-spec-${idx}`,
    stepBadge: stage.stageLabel,
    secondaryBadge: stage.locus,
    chipLabel: shortenChipTitle(stage.title),
    title: stage.title,
    subtitle: `인과소재 및 조절 양식: ${stage.locus}`,
    body: stage.description,
    footerFlowHint:
      idx < stages.length - 1
        ? '자율성·내면화 수준 상승 →'
        : '최고 수준의 자기결정적 동기 도달',
    accent: stage.accentColor
  }));
}

function buildTriadicSlides(
  theoryId: string,
  triadic: NonNullable<TheoryVisualBlueprint['triadicNodes']>
): VisualDeckSlide[] {
  return triadic.nodes.map((node: TriadicNodeItem, idx: number) => ({
    id: `${theoryId}-tri-${idx}`,
    stepBadge: `요소 ${idx + 1}`,
    secondaryBadge: '⇄ 중앙 허브 양방향 연동',
    chipLabel: shortenChipTitle(node.nodeTitle),
    title: node.nodeTitle,
    subtitle: node.subtitle,
    bullets: node.bullets,
    calloutLabel: '중심 통제 허브 (Core Hub)',
    calloutText: triadic.centerLabel,
    accent: node.accentColor
  }));
}

function buildContrastSlides(
  theoryId: string,
  rows: ClinicalContrastRow[]
): VisualDeckSlide[] {
  return rows.map((row, idx) => ({
    id: `${theoryId}-contrast-${idx}`,
    stepBadge: `대조 ${idx + 1}`,
    secondaryBadge: '과학자-실무자 패러다임',
    chipLabel: shortenChipTitle(row.dimension),
    title: row.dimension,
    subtitle: '현장 통념(오개념) vs 실증 기제 기반 처방 대조',
    contrastPair: {
      naiveLabel: '현장의 흔한 통념 · 비과학적 접근',
      naiveBody: row.naiveApproach,
      evidenceLabel: '과학자-실무자 증거기반 처방',
      evidenceBody: row.evidenceBasedApproach
    },
    accent: 'indigo'
  }));
}

export function buildTheoryVisualDeck(blueprint: TheoryVisualBlueprint): {
  diagramSlides: VisualDeckSlide[];
  contrastSlides: VisualDeckSlide[];
} {
  let diagramSlides: VisualDeckSlide[] = [];

  if (blueprint.topology === 'hierarchy-pyramid' && blueprint.pyramidTiers) {
    diagramSlides = buildPyramidSlides(
      blueprint.theoryId,
      blueprint.pyramidTiers
    );
  } else if (
    blueprint.topology === 'concentric-circles' &&
    blueprint.concentricLayers
  ) {
    diagramSlides = buildConcentricSlides(
      blueprint.theoryId,
      blueprint.concentricLayers
    );
  } else if (blueprint.topology === 'matrix-2x2' && blueprint.matrixAxis) {
    diagramSlides = buildMatrixSlides(blueprint.theoryId, blueprint.matrixAxis);
  } else if (
    blueprint.topology === 'stacked-gauge' &&
    blueprint.stackedGauges
  ) {
    diagramSlides = buildStackedGaugeSlides(
      blueprint.theoryId,
      blueprint.stackedGauges
    );
  } else if (blueprint.topology === 'process-cycle' && blueprint.processSteps) {
    diagramSlides = buildProcessSlides(
      blueprint.theoryId,
      blueprint.processSteps,
      true
    );
  } else if (blueprint.topology === 'step-flow' && blueprint.processSteps) {
    diagramSlides = buildProcessSlides(
      blueprint.theoryId,
      blueprint.processSteps,
      false
    );
  } else if (
    blueprint.topology === 'spectrum-continuum' &&
    blueprint.continuumStages
  ) {
    diagramSlides = buildSpectrumSlides(
      blueprint.theoryId,
      blueprint.continuumStages
    );
  } else if (
    blueprint.topology === 'triadic-network' &&
    blueprint.triadicNodes
  ) {
    diagramSlides = buildTriadicSlides(
      blueprint.theoryId,
      blueprint.triadicNodes
    );
  }

  const contrastSlides = blueprint.clinicalContrastRows
    ? buildContrastSlides(blueprint.theoryId, blueprint.clinicalContrastRows)
    : [];

  return { diagramSlides, contrastSlides };
}

/**
 * 중첩 모달리티 탭을 제거하고 '핵심 구조 도식 + 통념 vs 처방(+ 인포그래픽)'을
 * 하나의 연속된 가로 슬라이드 시퀀스로 통합 반환합니다.
 */
export function buildUnifiedTheoryVisualSlides(
  blueprint: TheoryVisualBlueprint
): VisualDeckSlide[] {
  const { diagramSlides, contrastSlides } = buildTheoryVisualDeck(blueprint);
  const unified: VisualDeckSlide[] = [...diagramSlides, ...contrastSlides];

  if (blueprint.illustrationUrl) {
    unified.push({
      id: `${blueprint.theoryId}-infographic`,
      stepBadge: '도해 요약',
      secondaryBadge: '인포그래픽',
      chipLabel: '인포그래픽',
      title: blueprint.diagramTitle,
      subtitle:
        blueprint.illustrationCaption ??
        '핵심 메커니즘과 임상 적용을 한 장에 압축한 시각 도해',
      imageUrl: blueprint.illustrationUrl,
      imageAlt:
        blueprint.illustrationCaption ?? `${blueprint.diagramTitle} 인포그래픽`,
      footerFlowHint: '터치하여 전체 도해 확대 보기',
      accent: 'sky'
    });
  }

  return unified;
}

// ============================================================================
// Case Lens Slide Normalization Adapter (A-B-C / Cognitive / Motivational)
// ============================================================================

interface ParsedBracketSection {
  heading: string;
  body: string;
}

export function parseCaseBracketSections(
  rawText: string
): ParsedBracketSection[] {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, idx) => {
    const match = line.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (match) {
      return {
        heading: match[1].trim(),
        body: match[2].trim()
      };
    }
    return {
      heading: `핵심 분석 ${idx + 1}`,
      body: line
    };
  });
}

function splitNumberedOrClauseSteps(text: string): string[] {
  const circledSplit = text
    .split(/(?=[①②③④⑤])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (circledSplit.length > 1) {
    return circledSplit;
  }

  const sentenceSplit = text
    .split(/(?<=[.다])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentenceSplit.length > 0 ? sentenceSplit : [text];
}

function extractInlineBrackets(text: string): string[] {
  const matches = text.match(/\[([^\]]+)\]/g) ?? [];
  return matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
}

const CASE_BEHAVIORAL_FALLBACKS: Record<
  string,
  {
    settingOrAntecedent: string;
    targetBehavior: string;
    consequenceAndFunction: string;
  }
> = {
  'mod4-case-impulsive-initiation': {
    settingOrAntecedent:
      '교사의 설명 진행 중이거나 지문이 길고 조건이 3개 이상 포함된 복합 활동지 제시',
    targetBehavior:
      '10초 만에 성급히 오답 찍기 또는 20분간 한 문제도 착수하지 못하고 지우개로 종이 찢기',
    consequenceAndFunction:
      '복합 과제가 유발하는 인지적 긴장·불쾌감으로부터 즉각 벗어나려는 회피(부적 강화) 기능으로 유지됨'
  },
  'mod4-case-srl': {
    settingOrAntecedent:
      '시험 대비 자율학습 상황 및 고난도 서술형·응용문제가 요구되는 학업 맥락',
    targetBehavior:
      '교과서 본문에 알록달록 형광펜 칠하기 및 노트에 그대로 베껴 쓰기만 밤 12시까지 반복',
    consequenceAndFunction:
      '눈에 보이는 필기 결과물을 즉각 획득(정적 강화)하고 깊은 인출 사고의 고통을 회피(부적 강화)'
  },
  'mod5-case-helplessness': {
    settingOrAntecedent:
      '누적 학습 결손 상태에서의 정기고사 시작 및 수행평가 제출 마감 직면',
    targetBehavior:
      '시험 시작 5분 만에 한 줄로 찍고 엎드려 자기, 수행평가 전날 밤새 게임 후 백지 제출',
    consequenceAndFunction:
      '실패 직면이 주는 극심한 수치심과 무능감 확인(혐오 자극)을 즉각 모면함(부적 강화)'
  },
  'mod5-case-relational-aggression-restorative': {
    settingOrAntecedent:
      '체육 모둠 구성 갈등 이후 교실 및 메신저 단체대화방 내 또래 상호작용 맥락',
    targetBehavior:
      '가해 주도 학생들의 눈짓 교환·투명인간 취급 및 별도 단톡방에서의 말투 조롱(관계적 공격성)',
    consequenceAndFunction:
      '주도 학생이 또래 집단 내 사회적 지배력과 내집단 소속감을 손쉽게 획득함(정적 강화: Peer Status)'
  }
};

export interface CaseLensDeckBundle {
  deckTitle: string;
  deckSubtitle: string;
  categoryBadge: string;
  takeawayBadge: string;
  slides: VisualDeckSlide[];
}

export function buildCaseLensVisualDeck(
  lensType: keyof CaseLenses,
  rawText: string,
  caseId = 'case'
): CaseLensDeckBundle {
  if (lensType === 'behavioral') {
    const sections = parseCaseBracketSections(rawText);
    const firstBody = sections[0]?.body ?? rawText;

    let settingOrAntecedent = '';
    let targetBehavior = '';
    let consequenceAndFunction = '';

    const hasExplicitAbc =
      firstBody.includes('선행사건') &&
      firstBody.includes('문제행동') &&
      firstBody.includes('후속결과');

    if (hasExplicitAbc) {
      const arrowParts = firstBody.split('→').map((p) => p.trim());
      const antParts: string[] = [];
      for (const part of arrowParts) {
        if (part.startsWith('배경사건') || part.startsWith('선행사건')) {
          antParts.push(
            part
              .replace(/^배경사건\([^)]*\)\s*:\s*/, '[배경사건] ')
              .replace(/^선행사건\([^)]*\)\s*:\s*/, '')
              .trim()
          );
        } else if (part.startsWith('문제행동')) {
          targetBehavior = part.replace(/^문제행동\([^)]*\)\s*:\s*/, '').trim();
        } else if (part.startsWith('후속결과')) {
          consequenceAndFunction = part
            .replace(/^후속결과\([^)]*\)\s*:\s*/, '')
            .trim();
        }
      }
      settingOrAntecedent = antParts.join(' / ');
    } else if (CASE_BEHAVIORAL_FALLBACKS[caseId]) {
      const fb = CASE_BEHAVIORAL_FALLBACKS[caseId];
      settingOrAntecedent = fb.settingOrAntecedent;
      targetBehavior = fb.targetBehavior;
      consequenceAndFunction = fb.consequenceAndFunction;
    } else {
      settingOrAntecedent = '과제 제시 및 교실 내 상호작용 전환 자극 발생';
      targetBehavior = sections[0]?.heading ?? '표적 부적응 행동 발생';
      consequenceAndFunction = firstBody;
    }

    let reinforcementBadge = '기능적 유관(A-B-C) 유지';
    if (rawText.includes('부적 강화') && rawText.includes('정적 강화')) {
      reinforcementBadge = '이중 강화 (정적 + 부적 강화)';
    } else if (rawText.includes('부적 강화')) {
      reinforcementBadge = '부적 강화 (불안·과제 회피)';
    } else if (rawText.includes('정적 강화')) {
      reinforcementBadge = '정적 강화 (관심·자극 획득)';
    }

    const slides: VisualDeckSlide[] = [
      {
        id: `${caseId}-beh-a`,
        stepBadge: 'A단계',
        secondaryBadge: 'Antecedent · 선행 맥락',
        chipLabel: 'A · 선행사건',
        title: '선행사건 · 배경사건 진단',
        subtitle: '표적 행동을 촉발하는 학업·교실 환경 자극',
        body: settingOrAntecedent,
        footerFlowHint: '표적 문제행동(B) 유발 →',
        accent: 'amber'
      },
      {
        id: `${caseId}-beh-b`,
        stepBadge: 'B단계',
        secondaryBadge: 'Behavior · 외현 반응',
        chipLabel: 'B · 문제행동',
        title: '관찰·측정 가능한 표적 문제행동',
        subtitle: '기능적 행동평가(FBA)의 조작적 정의 표적',
        body: targetBehavior,
        footerFlowHint: '후속결과 및 강화 유관(C) 연결 →',
        accent: 'rose'
      },
      {
        id: `${caseId}-beh-c`,
        stepBadge: 'C단계',
        secondaryBadge: reinforcementBadge,
        chipLabel: 'C · 강화 기능',
        title: '후속결과 및 행동 유지 기능',
        subtitle: '문제행동을 반복·고착시키는 강화 메커니즘',
        body: consequenceAndFunction,
        footerFlowHint: '긍정적 행동지원(PBS) 처방으로 전환 →',
        accent: 'emerald'
      }
    ];

    const remainingSections = sections.slice(1);
    const rawPbsItems =
      remainingSections.length === 1
        ? splitNumberedOrClauseSteps(remainingSections[0].body).map(
            (step, idx) => ({
              heading: `${remainingSections[0].heading} · 단계 ${idx + 1}`,
              detail: step
            })
          )
        : remainingSections.map((sec) => ({
            heading: sec.heading,
            detail: sec.body
          }));

    rawPbsItems.forEach((item, idx) => {
      const category =
        item.detail.includes('사전교정') || item.heading.includes('사전교정')
          ? '사전교정 (Precorrection)'
          : item.detail.includes('의사소통') ||
              item.detail.includes('대체') ||
              item.heading.includes('대체')
            ? '대체행동 교수 (FCT)'
            : '차별강화 (DRA) · 유관 재설계';
      const tools = extractInlineBrackets(item.detail);

      slides.push({
        id: `${caseId}-beh-pbs-${idx}`,
        stepBadge: `PBS ${idx + 1}`,
        secondaryBadge: category,
        chipLabel: `PBS ${idx + 1} · ${shortenChipTitle(category)}`,
        title: item.heading,
        subtitle: '처벌 대신 선행 환경 조정과 대체행동 강화',
        body: item.detail,
        calloutLabel: tools.length > 0 ? '현장 적용 도구' : undefined,
        calloutText: tools.length > 0 ? tools.join(' · ') : undefined,
        accent: 'sky'
      });
    });

    return {
      deckTitle: 'A-B-C 기능적 유관 및 PBS 처방 파이프라인',
      deckSubtitle: '선행사건(A) → 표적행동(B) → 후속결과(C) 및 긍정적 행동지원 설계',
      categoryBadge: '행동주의 렌즈 (FBA / PBS)',
      takeawayBadge: reinforcementBadge,
      slides
    };
  }

  if (lensType === 'cognitive') {
    const sections = parseCaseBracketSections(rawText);
    const prostheticStartIndex = sections.findIndex(
      (s) =>
        s.heading.includes('보철') ||
        s.heading.includes('개입') ||
        s.heading.includes('코칭')
    );
    const splitIdx =
      prostheticStartIndex > 0
        ? prostheticStartIndex
        : Math.ceil(sections.length / 2);
    const diagnosisSections = sections.slice(0, splitIdx);
    const prostheticSections = sections.slice(splitIdx);

    const slides: VisualDeckSlide[] = [];

    diagnosisSections.forEach((sec, idx) => {
      slides.push({
        id: `${caseId}-cog-diag-${idx}`,
        stepBadge: `병목 진단 ${idx + 1}`,
        secondaryBadge: '작업기억 · 실행기능 과부하',
        chipLabel: `진단 ${idx + 1} · ${shortenChipTitle(sec.heading)}`,
        title: sec.heading,
        subtitle: '신경인지·정보처리 관점의 수행 마비 원인 해부',
        body: sec.body,
        footerFlowHint: '수행 시점(Point of Performance) 환경적 보철 처방 →',
        accent: 'rose'
      });
    });

    const prostheticActionSteps = prostheticSections.flatMap((sec) =>
      splitNumberedOrClauseSteps(sec.body).map((step) => ({
        heading: sec.heading,
        step
      }))
    );

    prostheticActionSteps.forEach((item, idx) => {
      const tools = extractInlineBrackets(item.step);
      const actionTag =
        item.step.includes('예제') || item.step.includes('쪼개')
          ? 'Chunking · 완성 예제'
          : item.step.includes('자기교수') || item.step.includes('인출')
            ? '초인지 · 자기교수 내면화'
            : '수행 시점 외적 보철';

      slides.push({
        id: `${caseId}-cog-act-${idx}`,
        stepBadge: `보철 처방 ${idx + 1}`,
        secondaryBadge: actionTag,
        chipLabel: `처방 ${idx + 1} · ${shortenChipTitle(actionTag)}`,
        title: item.heading,
        subtitle: '외재적 부하를 덜어내고 본유적 스키마 형성을 돕는 설계',
        body: item.step,
        calloutLabel: tools.length > 0 ? '핵심 보철물' : undefined,
        calloutText: tools.length > 0 ? tools.join(' · ') : undefined,
        accent: 'indigo'
      });
    });

    return {
      deckTitle: '신경인지 병목 진단 및 환경적 보철 설계도',
      deckSubtitle: '작업기억 과부하 원인 진단과 수행 시점(Point of Performance) 외현화 처방',
      categoryBadge: '인지·신경심리 렌즈 (CLT / 보철)',
      takeawayBadge: '외재적 부하 차단 · 스키마 청킹',
      slides
    };
  }

  // Motivational Lens
  const sections = parseCaseBracketSections(rawText);
  const dynamicsSection = sections[0] ?? {
    heading: '내면 심리·귀인·자기가치 역동',
    body: rawText
  };
  const counselingSections = sections.slice(1);
  const counselingSteps = counselingSections.flatMap((sec) =>
    splitNumberedOrClauseSteps(sec.body).map((step) => ({
      heading: sec.heading,
      step
    }))
  );

  const frustratedNeeds: string[] = [];
  if (
    rawText.includes('자율') ||
    rawText.includes('통제') ||
    rawText.includes('강제') ||
    rawText.includes('유실')
  ) {
    frustratedNeeds.push('자율성(Autonomy) 회복 표적');
  }
  if (
    rawText.includes('유능감') ||
    rawText.includes('성취') ||
    rawText.includes('효능감') ||
    rawText.includes('무기력')
  ) {
    frustratedNeeds.push('유능감(Competence) · 재귀인 표적');
  }
  if (
    rawText.includes('관계성') ||
    rawText.includes('낙인') ||
    rawText.includes('안전기지') ||
    rawText.includes('소외') ||
    rawText.includes('경청')
  ) {
    frustratedNeeds.push('관계성(Relatedness) · 안전기지 표적');
  }

  const slides: VisualDeckSlide[] = [
    {
      id: `${caseId}-mot-dyn`,
      stepBadge: '역동 진단',
      secondaryBadge: 'SDT · 귀인 · 자기가치',
      chipLabel: `진단 · ${shortenChipTitle(dynamicsSection.heading)}`,
      title: dynamicsSection.heading,
      subtitle: '표면 행동 이면의 기본심리욕구 좌절과 방어 기제',
      body: dynamicsSection.body,
      bullets: frustratedNeeds.length > 0 ? frustratedNeeds : undefined,
      footerFlowHint: '학교상담실 및 학급 생태계 처방 연결 →',
      accent: 'amber'
    }
  ];

  counselingSteps.forEach((item, idx) => {
    slides.push({
      id: `${caseId}-mot-step-${idx}`,
      stepBadge: `상담 처방 ${idx + 1}`,
      secondaryBadge: '학교상담 · 학급 생태계',
      chipLabel: `상담 ${idx + 1} · ${shortenChipTitle(item.heading)}`,
      title: item.heading,
      subtitle: '기본심리욕구 회복 및 비심판적 치료 동맹 개입',
      body: item.step,
      accent: 'emerald'
    });
  });

  return {
    deckTitle: '내면 심리 역동 진단 및 동기·회복적 상담 처방',
    deckSubtitle: '자기결정성(SDT) · 귀인 · 자기가치 보호 역동과 학교상담 개입',
    categoryBadge: '동기·정서·상담 렌즈 (SDT / 자기가치)',
    takeawayBadge: '심리적 안전기지 · 재귀인 코칭',
    slides
  };
}

export function buildTriLensMatrixDeck(
  classroomCase: ClassroomCase
): CaseLensDeckBundle {
  const behSections = parseCaseBracketSections(classroomCase.lenses.behavioral);
  const cogSections = parseCaseBracketSections(classroomCase.lenses.cognitive);
  const motSections = parseCaseBracketSections(
    classroomCase.lenses.motivational
  );

  const slides: VisualDeckSlide[] = [
    {
      id: `${classroomCase.id}-tri-beh`,
      stepBadge: '렌즈 1 / 3',
      secondaryBadge: '행동주의 (FBA / PBS)',
      chipLabel: '1. 행동주의(FBA)',
      title: behSections[0]?.heading ?? 'A-B-C 기능적 유관 진단',
      subtitle: '관찰 가능한 선행사건·행동·후속 강화 기능 분석',
      body: behSections[0]?.body ?? classroomCase.lenses.behavioral,
      calloutLabel:
        behSections
          .slice(1)
          .map((s) => s.heading)
          .join(' · ') || 'PBS 현장 핵심 처방',
      calloutText:
        behSections
          .slice(1)
          .map((s) => s.body)
          .join(' ') || classroomCase.lenses.behavioral,
      footerFlowHint: '다음: 인지·신경심리 렌즈와 대조 →',
      accent: 'emerald'
    },
    {
      id: `${classroomCase.id}-tri-cog`,
      stepBadge: '렌즈 2 / 3',
      secondaryBadge: '인지·신경심리 (CLT / 보철)',
      chipLabel: '2. 인지·보철(CLT)',
      title: cogSections[0]?.heading ?? '작업기억·실행기능 병목 진단',
      subtitle: '외재적 인지부하와 수행 시점(Point of Performance) 병목 해부',
      body: cogSections[0]?.body ?? classroomCase.lenses.cognitive,
      calloutLabel:
        cogSections
          .slice(1)
          .map((s) => s.heading)
          .join(' · ') || '수행 시점 환경적 보철 처방',
      calloutText:
        cogSections
          .slice(1)
          .map((s) => s.body)
          .join(' ') || classroomCase.lenses.cognitive,
      footerFlowHint: '다음: 동기·정서·상담 렌즈와 대조 →',
      accent: 'indigo'
    },
    {
      id: `${classroomCase.id}-tri-mot`,
      stepBadge: '렌즈 3 / 3',
      secondaryBadge: '동기·상담 (SDT / 자기가치)',
      chipLabel: '3. 동기·상담(SDT)',
      title: motSections[0]?.heading ?? '내면 심리·귀인·기본욕구 진단',
      subtitle: '자율성·유능감·관계성 및 자기가치 방어 기제 분석',
      body: motSections[0]?.body ?? classroomCase.lenses.motivational,
      calloutLabel:
        motSections
          .slice(1)
          .map((s) => s.heading)
          .join(' · ') || '학교상담 및 중간체계 개입',
      calloutText:
        motSections
          .slice(1)
          .map((s) => s.body)
          .join(' ') || classroomCase.lenses.motivational,
      footerFlowHint: '✓ 3중 렌즈 다각적 사례개념화 완성',
      accent: 'amber'
    }
  ];

  return {
    deckTitle: `${classroomCase.title} · 3중 렌즈 종합 비교`,
    deckSubtitle:
      '행동(A-B-C 유관) · 인지(작업기억 병목과 보철) · 동기(기본심리욕구와 자기가치) 대조',
    categoryBadge: '면접 구술용 3중 렌즈 보드',
    takeawayBadge: classroomCase.studentGrade,
    slides
  };
}
