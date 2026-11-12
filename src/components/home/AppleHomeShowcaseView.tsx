import React, { useId, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2
} from 'lucide-react';
import { MODULE_CONCEPT_ANCHORS } from '../../data/curriculumGraph';
import {
  MasteryState,
  ModuleId,
  ModuleSubgraphSummary,
  ResumeStudyTarget
} from '../../types/graph';

interface AppleHomeShowcaseViewProps {
  moduleSummaries: ModuleSubgraphSummary[];
  resumeTarget: ResumeStudyTarget;
  masteryMap: Record<string, MasteryState>;
  totalNodesCount: number;
  completedModulesCount: number;
  onResumeStudy: (nodeId: string) => void;
  onOpenModuleStudy: (moduleId: ModuleId) => void;
  onJumpToWeakGraph: () => void;
}

const PERCENTAGE_FULL = 100;

const RESUME_REASON_BADGE: Record<ResumeStudyTarget['reason'], string> = {
  'last-active': '최근 학습 위치',
  'bridge-next': '다음 추천 학습',
  starter: '권장 출발점'
};

export const AppleHomeShowcaseView: React.FC<AppleHomeShowcaseViewProps> = ({
  moduleSummaries,
  resumeTarget,
  masteryMap,
  totalNodesCount,
  completedModulesCount,
  onResumeStudy,
  onOpenModuleStudy,
  onJumpToWeakGraph
}) => {
  const tocHeadingId = useId();

  const globalStats = useMemo(() => {
    let mastered = 0;
    let review = 0;
    let weak = 0;
    let unseen = 0;

    for (const summary of moduleSummaries) {
      mastered += summary.masteredCount;
      review += summary.reviewCount;
      weak += summary.weakCount;
      unseen += summary.unseenCount;
    }

    const totalFromSummaries = mastered + review + weak + unseen;
    if (totalFromSummaries === 0 && totalNodesCount > 0) {
      for (const s of Object.values(masteryMap)) {
        if (s === 'mastered') mastered += 1;
        else if (s === 'review') review += 1;
        else if (s === 'weak') weak += 1;
        else unseen += 1;
      }
    }

    const safeTotal = Math.max(1, totalNodesCount);
    const overallPercent = Math.round(
      ((mastered + review * 0.55 + weak * 0.15) / safeTotal) * PERCENTAGE_FULL
    );

    return {
      mastered,
      weakOrReview: weak + review,
      overallPercent: Math.min(PERCENTAGE_FULL, overallPercent)
    };
  }, [moduleSummaries, masteryMap, totalNodesCount]);

  return (
    <div className="max-w-[1160px] mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* 1. 상단 전체 진도 요약 & 이어하기 단일 바 */}
      <section className="bento-tile-white p-5 sm:p-7 space-y-5 tabular-nums">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent-solid)]">
                <span>Woolfolk 13판 · Seifert &amp; Sutton 핵심 커리큘럼</span>
              </span>
              <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[11px] font-semibold text-[#424245]">
                {RESUME_REASON_BADGE[resumeTarget.reason]}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-[-0.022em] text-[#1d1d1f] korean-keep-all">
              학교상담 · 교육심리 대학원 입시 스튜디오
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {globalStats.weakOrReview > 0 && (
              <button
                type="button"
                onClick={onJumpToWeakGraph}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full bg-rose-500/12 hover:bg-rose-500/18 px-4 py-2 text-xs font-semibold text-rose-700 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>복습 필요 {globalStats.weakOrReview}개 점검</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onResumeStudy(resumeTarget.nodeId)}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <BookOpenCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[240px] sm:max-w-[300px]">
                이어서 학습하기 · M{resumeTarget.moduleNumber}{' '}
                {resumeTarget.nodeTitleKo}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 전체 진도율 프로그레스 바 */}
        <div className="rounded-[16px] bg-[#f5f5f7] p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span className="text-[#1d1d1f]">
              전체 학습 숙련도 {globalStats.overallPercent}% ({globalStats.mastered} /{' '}
              {totalNodesCount} 노드 숙련)
            </span>
            <span className="text-[#6e6e73]">
              모듈 완주 {completedModulesCount} / {moduleSummaries.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/[0.08] overflow-hidden">
            <div
              className="gpu-progress-bar h-full w-full origin-left bg-[var(--accent-solid)]"
              style={{
                transform: `scaleX(${Math.min(
                  1,
                  globalStats.overallPercent / PERCENTAGE_FULL
                )})`
              }}
            />
          </div>
        </div>
      </section>

      {/* 2. M1 ~ M5 모듈 목차 카드 5개 (모듈당 단일 진입) */}
      <section aria-labelledby={tocHeadingId} className="space-y-4">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <h2
            id={tocHeadingId}
            className="text-base sm:text-lg font-bold tracking-tight text-[#1d1d1f]"
          >
            전체 모듈 목차 (Module 01 – 05)
          </h2>
          <span className="text-xs font-medium text-[#6e6e73] tabular-nums">
            모듈 선택 시 개념학습으로 이동
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {moduleSummaries.map((summary, idx) => {
            const anchor = MODULE_CONCEPT_ANCHORS[summary.moduleId];
            return (
              <button
                key={summary.moduleId}
                type="button"
                onClick={() => onOpenModuleStudy(summary.moduleId)}
                className="group bento-tile-white overflow-hidden text-left flex flex-col justify-between hover:ring-2 hover:ring-[#0071e3]/30 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
              >
                {/* 상단 모듈 커버 배너 */}
                <div className="relative aspect-[16/8] w-full bg-[#eef0f4] overflow-hidden border-b border-black/[0.05]">
                  <img
                    src={anchor.imageUrl}
                    alt={`Module ${summary.moduleNumber} ${summary.titleKo} 대표 도해`}
                    width={640}
                    height={320}
                    loading={idx < 3 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-x-3.5 top-3 flex items-center justify-between gap-2 tabular-nums">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: anchor.accentHex }}
                        aria-hidden="true"
                      />
                      <span>Module 0{summary.moduleNumber}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-white/92 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#1d1d1f] shadow-2xs">
                      {summary.isCompleted && (
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span>{summary.masteryPercent}% 숙련</span>
                    </span>
                  </div>
                </div>

                {/* 모듈 목차 정보 및 단일 진입 어포던스 */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4 w-full">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#6e6e73] block">
                      {summary.sourceMapping}
                    </span>
                    <h3 className="text-base sm:text-[17px] font-bold tracking-tight text-[#1d1d1f] group-hover:text-[var(--accent-solid)] leading-snug korean-keep-all transition-colors">
                      {summary.titleKo}
                    </h3>
                    <p className="text-xs text-[#6e6e73] line-clamp-1">
                      {summary.subtitleEn}
                    </p>
                  </div>

                  <div className="space-y-3 pt-1 w-full tabular-nums">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#6e6e73]">
                        <span>
                          숙련 {summary.masteredCount} / {summary.totalNodes} 노드
                        </span>
                        <span>전이 브릿지 {summary.crossBridgeCount}개</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                        <div
                          className="gpu-progress-bar h-full w-full origin-left bg-[var(--accent-solid)]"
                          style={{
                            transform: `scaleX(${Math.min(
                              1,
                              summary.masteryPercent / PERCENTAGE_FULL
                            )})`
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between text-xs font-semibold text-[var(--accent-solid)]">
                      <span>개념학습 열기</span>
                      <ArrowRight
                        className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
