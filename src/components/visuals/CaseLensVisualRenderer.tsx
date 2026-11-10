import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Brain,
  CheckCircle2,
  Compass,
  Cpu,
  Gauge,
  HeartHandshake,
  Layers,
  ShieldAlert,
  Sparkles,
  Target,
  Wrench
} from 'lucide-react';
import { CaseLenses, ClassroomCase } from '../../types/study';

interface ParsedBracketSection {
  heading: string;
  body: string;
}

function parseBracketSections(rawText: string): ParsedBracketSection[] {
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

interface AbcParsedFlow {
  settingOrAntecedent: string;
  targetBehavior: string;
  consequenceAndFunction: string;
  reinforcementBadge: string;
  pbsSteps: {
    category: string;
    title: string;
    detail: string;
    badgeColor: string;
  }[];
}

const CASE_BEHAVIORAL_FALLBACKS: Record<
  string,
  Pick<
    AbcParsedFlow,
    'settingOrAntecedent' | 'targetBehavior' | 'consequenceAndFunction'
  >
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

function parseBehavioralFlow(rawText: string, caseId?: string): AbcParsedFlow {
  const sections = parseBracketSections(rawText);
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
  } else if (caseId && CASE_BEHAVIORAL_FALLBACKS[caseId]) {
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
    reinforcementBadge = '이중 강화 (정적 강화 + 부적 강화)';
  } else if (rawText.includes('부적 강화')) {
    reinforcementBadge = '부적 강화 (과제·불안·수치심 회피)';
  } else if (rawText.includes('정적 강화')) {
    reinforcementBadge = '정적 강화 (또래 관심·감각 자극 획득)';
  }

  const remainingSections = sections.slice(1);
  const pbsSteps: AbcParsedFlow['pbsSteps'] = [];

  if (remainingSections.length === 1) {
    const steps = splitNumberedOrClauseSteps(remainingSections[0].body);
    steps.forEach((step, idx) => {
      const category =
        step.includes('사전교정') || step.includes('선행')
          ? '사전교정 (Precorrection)'
          : step.includes('의사소통') ||
            step.includes('대체') ||
            step.includes('카드')
          ? '기능적 의사소통·대체행동 (FCT)'
          : '차별강화 (DRA) · 프리맥 · 유관 재설계';
      pbsSteps.push({
        category,
        title: `${remainingSections[0].heading} · 단계 ${idx + 1}`,
        detail: step,
        badgeColor:
          idx === 0
            ? 'bg-sky-100 text-sky-800 border-sky-300'
            : idx === 1
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-violet-100 text-violet-800 border-violet-300'
      });
    });
  } else {
    remainingSections.forEach((sec, idx) => {
      const category =
        sec.heading.includes('사전교정') || sec.heading.includes('선행')
          ? '사전교정 (Precorrection)'
          : sec.heading.includes('대체행동') || sec.heading.includes('조형')
          ? '기능적 의사소통·대체행동 (FCT/PBS)'
          : '긍정적 행동지원(PBS) 처방';
      pbsSteps.push({
        category,
        title: sec.heading,
        detail: sec.body,
        badgeColor:
          idx === 0
            ? 'bg-sky-100 text-sky-800 border-sky-300'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
      });
    });
  }

  return {
    settingOrAntecedent,
    targetBehavior,
    consequenceAndFunction,
    reinforcementBadge,
    pbsSteps
  };
}

const COGNITIVE_BOTTLENECK_TERMS = [
  '작업기억(Working Memory)',
  '작업기억(WMI)',
  '처리속도(PSI)',
  '외재적 인지부하',
  '내재적 인지부하',
  '인지 과부하',
  '적대적 귀인 편향',
  '반응 억제(Response Inhibition)',
  '시간맹(Time Blindness)',
  '음운 루프',
  '내적 언어(Inner Speech)',
  '유창성 착각(Illusion of Competence)',
  '도덕적 이탈',
  '정서적 과각성'
];

function extractDetectedTerms(text: string, dictionary: string[]): string[] {
  const found: string[] = [];
  for (const item of dictionary) {
    const baseKeyword = item.split('(')[0].trim();
    if (text.includes(baseKeyword) && !found.includes(item)) {
      found.push(item);
    }
  }
  return found;
}

interface CaseLensVisualRendererProps {
  lensType: keyof CaseLenses;
  rawText: string;
  caseId?: string;
}

export const CaseLensVisualRenderer: React.FC<CaseLensVisualRendererProps> = ({
  lensType,
  rawText,
  caseId
}) => {
  if (lensType === 'behavioral') {
    const flow = parseBehavioralFlow(rawText, caseId);

    return (
      <div className="space-y-4">
        {/* 상단 다이어그램 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-900/95 px-4 py-2.5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-300" />
            <span className="text-xs font-extrabold tracking-wide">
              A-B-C 기능적 유관 흐름도 (Functional Contingency Flowchart)
            </span>
          </div>
          <span className="rounded-lg bg-emerald-500/25 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
            핵심 유지 기제: {flow.reinforcementBadge}
          </span>
        </div>

        {/* 3-Box Horizontal A-B-C Visual Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1.15fr] items-stretch gap-2.5">
          {/* Box A */}
          <div className="rounded-2xl bg-white border-2 border-amber-200 p-4 shadow-sm flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[11px] font-extrabold text-amber-900">
                  A. 선행사건·배경사건
                </span>
                <span className="text-[10px] font-bold uppercase text-amber-700">
                  Antecedent
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                {flow.settingOrAntecedent}
              </p>
            </div>
            <div className="pt-2 border-t border-amber-100 text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>유발 자극 · 학업/교실 환경 맥락</span>
            </div>
          </div>

          {/* Directional Arrow A -> B */}
          <div className="flex items-center justify-center py-1 lg:py-0">
            <div className="hidden lg:flex w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 items-center justify-center text-emerald-800 shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="flex lg:hidden w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 items-center justify-center text-emerald-800">
              <ArrowDown className="w-4 h-4" />
            </div>
          </div>

          {/* Box B */}
          <div className="rounded-2xl bg-white border-2 border-rose-200 p-4 shadow-sm flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 border border-rose-300 px-2 py-0.5 text-[11px] font-extrabold text-rose-900">
                  B. 표적 문제행동
                </span>
                <span className="text-[10px] font-bold uppercase text-rose-700">
                  Behavior
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                {flow.targetBehavior}
              </p>
            </div>
            <div className="pt-2 border-t border-rose-100 text-[11px] font-semibold text-rose-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>관찰·측정 가능한 외현적 반응</span>
            </div>
          </div>

          {/* Directional Arrow B -> C */}
          <div className="flex items-center justify-center py-1 lg:py-0">
            <div className="hidden lg:flex w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 items-center justify-center text-emerald-800 shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="flex lg:hidden w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 items-center justify-center text-emerald-800">
              <ArrowDown className="w-4 h-4" />
            </div>
          </div>

          {/* Box C */}
          <div className="rounded-2xl bg-white border-2 border-emerald-300 p-4 shadow-sm flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[11px] font-extrabold text-emerald-900">
                  C. 후속결과 및 강화 기능
                </span>
                <span className="text-[10px] font-bold uppercase text-emerald-700">
                  Consequence
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                {flow.consequenceAndFunction}
              </p>
            </div>
            <div className="pt-2 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-900 px-2 py-0.5 text-[11px] font-bold text-emerald-100">
                <Target className="w-3 h-3 text-emerald-300" />
                <span>{flow.reinforcementBadge}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 긍정적 행동지원(PBS) 처방 파이프라인 */}
        <div className="rounded-2xl bg-white border border-emerald-300/90 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-extrabold text-white">
                긍정적 행동지원(PBS) 처방 파이프라인
              </span>
              <span className="text-xs font-bold text-emerald-900">
                사전교정(Precorrection) ➔ 기능적 의사소통 대체행동(FCT) ➔ 차별강화(DRA/프리맥 원리)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {flow.pbsSteps.map((step, index) => {
              const inlineTools = extractInlineBrackets(step.detail);
              return (
                <div
                  key={index}
                  className="rounded-xl bg-emerald-50/50 border border-emerald-200/80 p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${step.badgeColor}`}
                    >
                      {step.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">
                      {step.title}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    {step.detail}
                  </p>
                  {inlineTools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {inlineTools.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 rounded-md bg-white border border-emerald-300 px-2 py-0.5 text-[11px] font-bold text-emerald-900 shadow-2xs"
                        >
                          <Wrench className="w-3 h-3 text-emerald-600" />
                          <span>도구: {tool}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (lensType === 'cognitive') {
    const sections = parseBracketSections(rawText);
    const prostheticStartIndex = sections.findIndex(
      (s) =>
        s.heading.includes('보철') ||
        s.heading.includes('개입') ||
        s.heading.includes('코칭')
    );

    const splitIdx =
      prostheticStartIndex > 0 ? prostheticStartIndex : Math.ceil(sections.length / 2);
    const diagnosisSections = sections.slice(0, splitIdx);
    const prostheticSections = sections.slice(splitIdx);

    const detectedBottlenecks = extractDetectedTerms(
      rawText,
      COGNITIVE_BOTTLENECK_TERMS
    );

    const prostheticActionSteps = prostheticSections.flatMap((sec) =>
      splitNumberedOrClauseSteps(sec.body).map((step) => ({
        heading: sec.heading,
        step
      }))
    );

    return (
      <div className="space-y-4">
        {/* 상단 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-950 px-4 py-2.5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-extrabold tracking-wide">
              신경인지 병목 진단 vs. 수행 시점 환경적 보철 설계도 (Bottleneck ➔ Prosthetic Blueprint)
            </span>
          </div>
          <span className="rounded-lg bg-indigo-500/30 border border-indigo-400/40 px-2.5 py-0.5 text-[11px] font-bold text-indigo-200">
            Point of Performance 외현화 처방
          </span>
        </div>

        {/* 2-Column Visual Comparison Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.15fr] items-stretch gap-3">
          {/* Left Panel: 인지·신경심리 병목 진단 */}
          <div className="rounded-2xl bg-white border-2 border-rose-200/90 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-rose-100 pb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 border border-rose-300 px-2.5 py-1 text-xs font-extrabold text-rose-900">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                  <span>인지·신경심리 병목 진단 (Cognitive Bottleneck)</span>
                </span>
              </div>

              {/* 시각적 인지부하 경고 미터 */}
              <div className="rounded-xl bg-rose-50/70 border border-rose-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-rose-900">
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-rose-600" />
                    <span>작업기억 용량(WMC) 과부하 경보 미터</span>
                  </span>
                  <span className="text-rose-700">한계치 초과 (Overload)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-rose-200/70 overflow-hidden flex">
                  <div
                    className="h-full bg-amber-500 w-2/5"
                    title="내재적 인지부하 (과제 복잡성)"
                  />
                  <div
                    className="h-full bg-rose-600 w-3/5"
                    title="외재적 부하 및 처리속도/실행기능 병목"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                  <span>내재적 부하(과제 난이도)</span>
                  <span className="text-rose-700 font-bold">
                    + 외재적 부하·정서/억제 병목 ➔ 수행 마비
                  </span>
                </div>
              </div>

              {/* 추출된 핵심 병목 키워드 배지 */}
              {detectedBottlenecks.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500">
                    탐지된 핵심 신경인지 병목 기제:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedBottlenecks.map((term) => (
                      <span
                        key={term}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white"
                      >
                        <Cpu className="w-3 h-3 text-rose-300" />
                        <span>{term}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 병목 진단 텍스트 블록 */}
              <div className="space-y-2.5">
                {diagnosisSections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-50 border border-slate-200/90 p-3 space-y-1"
                  >
                    <span className="inline-block rounded-md bg-rose-900 px-2 py-0.5 text-[11px] font-bold text-rose-100">
                      {sec.heading}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {sec.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Central Arrow */}
          <div className="flex flex-col items-center justify-center py-1 lg:py-0">
            <div className="hidden lg:flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold text-indigo-800 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                외적 보철 설계
              </span>
            </div>
            <div className="flex lg:hidden items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <ArrowDown className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-indigo-800">
                수행 시점(Point of Performance) 보철 처방
              </span>
            </div>
          </div>

          {/* Right Panel: 환경적 보철 & 스키마 자동화 처방 */}
          <div className="rounded-2xl bg-white border-2 border-indigo-300 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-100 border border-indigo-300 px-2.5 py-1 text-xs font-extrabold text-indigo-900">
                  <Wrench className="w-3.5 h-3.5 text-indigo-700" />
                  <span>환경적 보철 &amp; 스키마 자동화 처방 (Prosthetic Action Cards)</span>
                </span>
              </div>

              <div className="space-y-2.5">
                {prostheticActionSteps.map((item, idx) => {
                  const bracketTools = extractInlineBrackets(item.step);
                  const actionTag =
                    item.step.includes('예제') || item.step.includes('쪼개')
                      ? '인지부하 축소 · Chunking / Worked Example'
                      : item.step.includes('자기교수') || item.step.includes('인출')
                      ? '초인지 · 자기교수 스크립트 내면화'
                      : '수행 시점(Point of Performance) 시각·물리적 보철';

                  return (
                    <div
                      key={idx}
                      className="rounded-xl bg-indigo-50/55 border border-indigo-200 p-3.5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>처방 Action {idx + 1}</span>
                        </span>
                        <span className="text-[11px] font-bold text-indigo-800">
                          {actionTag}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                        {item.step}
                      </p>

                      {bracketTools.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {bracketTools.map((tool, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-flex items-center gap-1 rounded-lg bg-white border border-indigo-300 px-2.5 py-1 text-[11px] font-extrabold text-indigo-900 shadow-2xs"
                            >
                              <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span>보철물: {tool}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Motivational Lens
  const sections = parseBracketSections(rawText);
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

  const sdtNeeds = [
    {
      name: '자율성 (Autonomy)',
      active:
        rawText.includes('자율') ||
        rawText.includes('통제') ||
        rawText.includes('강제') ||
        rawText.includes('유실'),
      desc: rawText.includes('자율')
        ? '강압·조건부 통제 해소 및 선택권 부여 필요'
        : '자기주도적 목표·선택권 지원'
    },
    {
      name: '유능감 (Competence)',
      active:
        rawText.includes('유능감') ||
        rawText.includes('성취') ||
        rawText.includes('효능감') ||
        rawText.includes('무기력'),
      desc: '작은 성공 경험(Mastery) 및 재귀인 훈련 표적'
    },
    {
      name: '관계성 (Relatedness)',
      active:
        rawText.includes('관계성') ||
        rawText.includes('낙인') ||
        rawText.includes('안전기지') ||
        rawText.includes('소외') ||
        rawText.includes('경청'),
      desc: '비심판적 타당화·치료적 동맹·학급 소속감 회복'
    }
  ];

  const dynamicBadges: string[] = [];
  if (rawText.includes('귀인')) dynamicBadges.push('와이너 귀인 왜곡/재귀인');
  if (rawText.includes('자기가치') || rawText.includes('자기구실'))
    dynamicBadges.push('자기가치 방어 · 자기구실 만들기');
  if (rawText.includes('무기력')) dynamicBadges.push('학습된 무기력(Learned Helplessness)');
  if (rawText.includes('정체성')) dynamicBadges.push('마샤 정체성 유실/유예 역동');
  if (rawText.includes('회복적') || rawText.includes('고든'))
    dynamicBadges.push('고든 의사소통 · 회복적 정의');

  return (
    <div className="space-y-4">
      {/* 상단 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-950 px-4 py-2.5 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-amber-300" />
          <span className="text-xs font-extrabold tracking-wide">
            내면 역동 진단 ➔ 동기·정서·회복적 상담 처방 (Psychological Dynamics ➔ Counseling)
          </span>
        </div>
        <span className="rounded-lg bg-amber-500/25 border border-amber-400/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
          SDT 기본심리욕구 · 자기가치 · 학교상담 개입
        </span>
      </div>

      {/* Stage 1: 내면 심리·귀인·자기가치 역동 */}
      <div className="rounded-2xl bg-white border-2 border-amber-200 p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-extrabold text-amber-950">
            Stage 1. 내면 심리·귀인·자기가치 역동 진단 ({dynamicsSection.heading})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {dynamicBadges.map((b) => (
              <span
                key={b}
                className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-amber-200"
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* SDT 3대 기본심리욕구 상태 인디케이터 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {sdtNeeds.map((need) => (
            <div
              key={need.name}
              className={`rounded-xl border p-3 space-y-1 ${
                need.active
                  ? 'bg-amber-50/90 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-slate-900">
                  {need.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    need.active
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {need.active ? '좌절·집중회복 표적' : '연계 지원'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">{need.desc}</p>
            </div>
          ))}
        </div>

        <p className="rounded-xl bg-amber-50/40 border border-amber-200/70 p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
          {dynamicsSection.body}
        </p>
      </div>

      {/* 중앙 화살표 */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-300 px-4 py-1 text-xs font-extrabold text-amber-950 shadow-2xs">
          <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
          <span>학교상담실(Tier 2·3) 및 학급 생태계(중간체계) 처방 연결</span>
          <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
        </div>
      </div>

      {/* Stage 2: 학교상담 및 학급경영 개입 */}
      <div className="rounded-2xl bg-white border-2 border-amber-300 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-extrabold text-white">
            Stage 2. 학교상담 및 학급경영 개입 ({counselingSections[0]?.heading ?? '상담적 처방'})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {counselingSteps.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-amber-50/50 border border-amber-200/90 p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-900 px-2 py-0.5 text-[11px] font-bold text-amber-100">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>상담·생태계 처방 Step {idx + 1}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                {item.step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface TriLensSummaryMatrixProps {
  classroomCase: ClassroomCase;
}

export const TriLensSummaryMatrix: React.FC<TriLensSummaryMatrixProps> = ({
  classroomCase
}) => {
  const behSections = parseBracketSections(classroomCase.lenses.behavioral);
  const cogSections = parseBracketSections(classroomCase.lenses.cognitive);
  const motSections = parseBracketSections(classroomCase.lenses.motivational);

  const columns = [
    {
      key: 'behavioral',
      title: '행동주의 (FBA / PBS)',
      headerClass: 'bg-emerald-900 text-white',
      borderClass: 'border-emerald-300',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      diagnosisTitle: behSections[0]?.heading ?? 'A-B-C 기능적 유관 진단',
      diagnosisBody: behSections[0]?.body ?? classroomCase.lenses.behavioral,
      prescriptionTitle:
        behSections
          .slice(1)
          .map((s) => s.heading)
          .join(' · ') || 'PBS 사전교정 및 대체행동 처방',
      prescriptionBody:
        behSections
          .slice(1)
          .map((s) => s.body)
          .join(' ') || classroomCase.lenses.behavioral
    },
    {
      key: 'cognitive',
      title: '인지·신경심리 (CLT / 보철)',
      headerClass: 'bg-indigo-950 text-white',
      borderClass: 'border-indigo-300',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      diagnosisTitle: cogSections[0]?.heading ?? '작업기억·실행기능 병목 진단',
      diagnosisBody: cogSections[0]?.body ?? classroomCase.lenses.cognitive,
      prescriptionTitle:
        cogSections
          .slice(1)
          .map((s) => s.heading)
          .join(' · ') || '수행 시점 환경적 보철 처방',
      prescriptionBody:
        cogSections
          .slice(1)
          .map((s) => s.body)
          .join(' ') || classroomCase.lenses.cognitive
    },
    {
      key: 'motivational',
      title: '동기·정서·상담 (SDT / 자기가치)',
      headerClass: 'bg-amber-950 text-white',
      borderClass: 'border-amber-300',
      badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
      diagnosisTitle: motSections[0]?.heading ?? '내면 심리·귀인·기본욕구 진단',
      diagnosisBody: motSections[0]?.body ?? classroomCase.lenses.motivational,
      prescriptionTitle:
        motSections
          .slice(1)
          .map((s) => s.heading)
          .join(' · ') || '학교상담 및 중간체계 개입',
      prescriptionBody:
        motSections
          .slice(1)
          .map((s) => s.body)
          .join(' ') || classroomCase.lenses.motivational
    }
  ];

  return (
    <div className="rounded-2xl bg-slate-900 p-5 sm:p-6 text-white space-y-4 border border-slate-700 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white">
              3대 이론 렌즈 한눈에 비교 매트릭스 (Tri-Lens Summary Matrix)
            </h4>
            <p className="text-xs text-slate-300">
              행동(A-B-C 유관) · 인지(작업기억 병목과 보철) · 동기(기본심리욕구와 자기가치)의 원인 진단 및 처방 대조
            </p>
          </div>
        </div>
        <span className="rounded-lg bg-indigo-500/20 border border-indigo-400/40 px-3 py-1 text-xs font-bold text-indigo-200">
          면접 구술용 다중 렌즈 종합 보드
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col.key}
            className={`rounded-2xl bg-white text-slate-900 border-2 ${col.borderClass} overflow-hidden flex flex-col justify-between`}
          >
            <div className={`px-4 py-2.5 text-xs font-extrabold ${col.headerClass}`}>
              {col.title}
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <span
                  className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${col.badgeClass}`}
                >
                  ① 핵심 원인 진단: {col.diagnosisTitle}
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {col.diagnosisBody}
                </p>
              </div>

              <div className="flex justify-center py-0.5">
                <ArrowDown className="w-4 h-4 text-slate-400" />
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                <span className="inline-block rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white">
                  ② 현장 핵심 처방: {col.prescriptionTitle}
                </span>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {col.prescriptionBody}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
