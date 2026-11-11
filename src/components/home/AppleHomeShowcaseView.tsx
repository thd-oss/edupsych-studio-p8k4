import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Layers,
  MessageSquareWarning,
  Network,
  Sparkles
} from 'lucide-react';
import { MODULE_CONCEPT_ANCHORS } from '../../data/curriculumGraph';
import {
  MasteryState,
  ModuleId,
  ModuleSubgraphSummary,
  PrioritizedWeakNodeItem,
  ResumeStudyTarget,
  WorkspaceTabId
} from '../../types/graph';
import { InterviewQuestion } from '../../types/study';

interface AppleHomeShowcaseViewProps {
  moduleSummaries: ModuleSubgraphSummary[];
  resumeTarget: ResumeStudyTarget;
  prioritizedWeakQueue: PrioritizedWeakNodeItem[];
  masteryMap: Record<string, MasteryState>;
  totalNodesCount: number;
  completedModulesCount: number;
  featuredQuestion: InterviewQuestion | null;
  featuredQuestionModuleId: ModuleId;
  onResumeStudy: (moduleId: ModuleId, nodeId: string) => void;
  onJumpToModuleStory: (moduleId: ModuleId, leadNodeId: string) => void;
  onJumpToWorkspace: (
    tab: WorkspaceTabId,
    moduleId: ModuleId | 'all',
    nodeId: string
  ) => void;
  onJumpToWeakGraph: () => void;
  onInspectNode: (nodeId: string) => void;
  onOpenAiTutor: () => void;
}

const PERCENTAGE_FULL = 100;
const RING_RADIUS = 56;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SCROLL_FALLBACK_DEBOUNCE_MS = 150;
const BENTO_WEAK_PREVIEW_LIMIT = 4;
const FEATURED_KEYWORDS_PREVIEW_LIMIT = 4;

const RESUME_REASON_BADGE: Record<ResumeStudyTarget['reason'], string> = {
  'last-active': '최근 학습 정점 이어보기',
  'bridge-next': '모듈 간 전이 브릿지 추천',
  starter: '권장 출발 정점'
};

const STARTER_RECOMMENDED_NODES: Array<{
  nodeId: string;
  moduleId: ModuleId;
  badge: string;
  titleKo: string;
  subtitle: string;
}> = [
  {
    nodeId: 'mod1-theory-vygotsky',
    moduleId: 'mod1',
    badge: 'M1 · 핵심 브릿지 허브',
    titleKo: '비고츠키 사회문화적 인지이론 (ZPD · 비계설정)',
    subtitle: '인지부하 외적 보철(M2) 및 자기교수법(M4)으로 전이되는 출발점'
  },
  {
    nodeId: 'mod2-theory-clt-prosthetics',
    moduleId: 'mod2',
    badge: 'M2 · 최고 연결 차수',
    titleKo: '인지부하이론(CLT)과 신경심리학적 환경적 보철',
    subtitle: '작업기억 병목 진단과 수행 시점 외적 보조도구 처방의 핵심 축'
  },
  {
    nodeId: 'mod3-theory-fba-pbs',
    moduleId: 'mod3',
    badge: 'M3 · 임상 사례 핵심',
    titleKo: '기능적 행동평가(FBA)와 긍정적 행동지원(PBS)',
    subtitle: '과제 회피·관심 획득 기능을 해부하여 사전교정·FCT로 전환'
  }
];

export const AppleHomeShowcaseView: React.FC<AppleHomeShowcaseViewProps> = ({
  moduleSummaries,
  resumeTarget,
  prioritizedWeakQueue,
  masteryMap,
  totalNodesCount,
  completedModulesCount,
  featuredQuestion,
  featuredQuestionModuleId,
  onResumeStudy,
  onJumpToModuleStory,
  onJumpToWorkspace,
  onJumpToWeakGraph,
  onInspectNode,
  onOpenAiTutor
}) => {
  const reelHeadingId = useId();
  const bentoHeadingId = useId();

  const reelTrackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const pendingIndexRef = useRef<number | null>(null);

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [settledAnnouncement, setSettledAnnouncement] = useState<string>('');

  // 전체 90노드 숙련 분포 집계
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

    // 사용자 추가 노드 등으로 합계가 다를 경우 masteryMap 직접 보정
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
      review,
      weak,
      unseen,
      overallPercent: Math.min(PERCENTAGE_FULL, overallPercent)
    };
  }, [moduleSummaries, masteryMap, totalNodesCount]);

  // 수평 스냅 릴 현재 중앙에 가장 가까운 슬라이드 인덱스 계산
  const computeClosestSlideIndex = useCallback((): number => {
    const track = reelTrackRef.current;
    if (!track) return 0;
    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;

    let closestIdx = 0;
    let minDistance = Number.POSITIVE_INFINITY;

    slideRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const slideCenter = rect.left + rect.width / 2;
      const dist = Math.abs(slideCenter - trackCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    return closestIdx;
  }, []);

  // Carousel scroll + scrollend 동기화 (프로그래매틱 스무스 스크롤 중에는 rAF 재계산 생략하여 Safari 끊김 방지)
  useEffect(() => {
    const track = reelTrackRef.current;
    if (!track) return;

    let rafId = 0;
    let settleFallbackTimer = 0;
    const supportsScrollEnd = 'onscrollend' in window;

    const handleSettled = () => {
      pendingIndexRef.current = null;
      const idx = computeClosestSlideIndex();
      setActiveSlideIndex(idx);
      const settledSummary = moduleSummaries[idx];
      if (settledSummary) {
        setSettledAnnouncement(
          `모듈 ${settledSummary.moduleNumber} 슬라이드 표시 중 (${idx + 1} / ${moduleSummaries.length}): ${settledSummary.titleKo}`
        );
      }
    };

    const handleScroll = () => {
      if (pendingIndexRef.current === null && rafId === 0) {
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          setActiveSlideIndex(computeClosestSlideIndex());
        });
      }

      if (!supportsScrollEnd) {
        window.clearTimeout(settleFallbackTimer);
        settleFallbackTimer = window.setTimeout(
          handleSettled,
          SCROLL_FALLBACK_DEBOUNCE_MS
        );
      }
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    if (supportsScrollEnd) {
      track.addEventListener('scrollend', handleSettled);
    }

    return () => {
      track.removeEventListener('scroll', handleScroll);
      if (supportsScrollEnd) {
        track.removeEventListener('scrollend', handleSettled);
      }
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      window.clearTimeout(settleFallbackTimer);
    };
  }, [computeClosestSlideIndex, moduleSummaries]);

  const scrollToSlide = useCallback(
    (targetIndex: number) => {
      const clamped = Math.max(
        0,
        Math.min(moduleSummaries.length - 1, targetIndex)
      );
      const slideEl = slideRefs.current[clamped];
      const track = reelTrackRef.current;
      if (!slideEl || !track) return;

      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      pendingIndexRef.current = clamped;
      setActiveSlideIndex(clamped);

      const targetLeft =
        slideEl.offsetLeft -
        Math.max(0, (track.clientWidth - slideEl.clientWidth) / 2);

      track.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: reducedMotion ? 'instant' : 'smooth'
      });

      if (reducedMotion) {
        pendingIndexRef.current = null;
      }
    },
    [moduleSummaries.length]
  );

  const ringStrokeDashoffset =
    RING_CIRCUMFERENCE * (1 - globalStats.overallPercent / PERCENTAGE_FULL);

  return (
    <div className="bg-white text-[#1d1d1f]">
      {/* ================================================================= */}
      {/* STAGE 1: Apple Keynote Hero Showcase (Pure White #ffffff)         */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden bg-white pt-10 pb-14 sm:pt-16 sm:pb-20 border-b border-black/[0.05]">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* 상단 아이브로우 캡슐 */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f7] px-3.5 py-1.5 text-xs font-semibold text-[#424245]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-solid)]" />
            <span>
              Woolfolk 13판 · Seifert &amp; Sutton · 90-Node 도메인 지식 그래프
            </span>
          </div>

          {/* 대형 디스플레이 헤드라인 */}
          <div className="space-y-3.5">
            <h1 className="text-[clamp(2rem,5.2vw,3.65rem)] font-bold tracking-[-0.032em] leading-[1.1] text-[#1d1d1f]">
              교실의 통념을 넘어,
              <br />
              과학자-실무자의 시선으로.
            </h1>
            <p className="max-w-[680px] mx-auto text-sm sm:text-lg font-normal text-[#6e6e73] leading-relaxed">
              발달·인지부하 보철·기능적 행동평가·자기조절·회복적 상담까지.
              교육심리·학교상담 대학원 심층 면접을 방어하는 90개 핵심 노드를 하나의
              인터랙티브 스튜디오에서 체화하세요.
            </p>
          </div>

          {/* Primary & Secondary Apple Pill CTAs */}
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                onResumeStudy(resumeTarget.moduleId, resumeTarget.nodeId)
              }
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white px-6 py-3 text-sm font-semibold shadow-sm transition-colors"
            >
              <BookOpenCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[260px] sm:max-w-[340px]">
                이어서 학습하기 · M{resumeTarget.moduleNumber}{' '}
                {resumeTarget.nodeTitleKo}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() =>
                onJumpToWorkspace(
                  'graph',
                  'all',
                  resumeTarget.nodeId
                )
              }
              className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] text-[#1d1d1f] px-6 py-3 text-sm font-semibold transition-colors"
            >
              <Network
                className="w-4 h-4 text-[var(--accent-solid)] shrink-0"
                aria-hidden="true"
              />
              <span>90-노드 스터디 워크스페이스 열기</span>
            </button>
          </div>

          {/* 마이크로 상태 리본 */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-medium text-[#6e6e73] tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span className="rounded-full bg-[var(--accent-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-solid)]">
                {RESUME_REASON_BADGE[resumeTarget.reason]}
              </span>
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-black/15">
              |
            </span>
            <span>모듈 완주 {completedModulesCount} / 5</span>
            <span aria-hidden="true" className="text-black/15">
              ·
            </span>
            <span>
              숙련 완료 {globalStats.mastered} / {totalNodesCount} 노드
            </span>
            <span aria-hidden="true" className="text-black/15">
              ·
            </span>
            <span>모듈 간 전이 브릿지 8개</span>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* STAGE 2: M1~M5 Flagship Product Lineup Horizontal Snap Reel       */}
      {/* ================================================================= */}
      <section
        aria-roledescription="carousel"
        aria-labelledby={reelHeadingId}
        className="bg-[#f5f5f7] py-14 sm:py-20"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-6">
          {/* 상단 섹션 타이틀 + 이전/다음 컨트롤 버튼 (DOM 순서상 트랙 앞에 배치) */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[var(--accent-solid)] tracking-tight block">
                커리큘럼 라인업 · Module 01 – 05
              </span>
              <h2
                id={reelHeadingId}
                className="text-2xl sm:text-3xl font-bold tracking-[-0.024em] text-[#1d1d1f]"
              >
                다섯 개의 렌즈로 완성하는 교실 임상 아키텍처.
              </h2>
            </div>

            {/* 스크롤 트랙 이전 DOM 위치에 배치된 이전/다음 버튼 */}
            <div className="flex items-center gap-2 tabular-nums">
              <button
                type="button"
                onClick={() => scrollToSlide(activeSlideIndex - 1)}
                disabled={activeSlideIndex <= 0}
                aria-label="이전 모듈 카드 보기"
                className="w-10 h-10 rounded-full bg-white hover:bg-black/[0.05] disabled:opacity-35 disabled:pointer-events-none shadow-xs border border-black/[0.06] flex items-center justify-center text-[#1d1d1f] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSlide(activeSlideIndex + 1)}
                disabled={activeSlideIndex >= moduleSummaries.length - 1}
                aria-label="다음 모듈 카드 보기"
                className="w-10 h-10 rounded-full bg-white hover:bg-black/[0.05] disabled:opacity-35 disabled:pointer-events-none shadow-xs border border-black/[0.06] flex items-center justify-center text-[#1d1d1f] transition-colors"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* 정착(scrollend) 시점에만 공지되는 스크린 리더 상태 영역 */}
          <p role="status" aria-live="polite" className="sr-only">
            {settledAnnouncement}
          </p>

          {/* 가로 스냅 스크롤 트랙 */}
          <div
            ref={reelTrackRef}
            tabIndex={0}
            aria-label="5대 핵심 교육심리 모듈 쇼케이스 릴"
            className="apple-flagship-reel-track -mx-4 px-4 sm:mx-0 sm:px-1"
          >
            {moduleSummaries.map((summary, idx) => {
              const anchor = MODULE_CONCEPT_ANCHORS[summary.moduleId];
              return (
                <article
                  key={summary.moduleId}
                  ref={(el) => {
                    slideRefs.current[idx] = el;
                  }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} / ${moduleSummaries.length}: Module ${summary.moduleNumber} ${summary.titleKo}`}
                  className="apple-flagship-reel-slide bento-tile-white overflow-hidden flex flex-col justify-between transition-transform duration-300"
                >
                  {/* 상단 아트워크 스테이지 */}
                  <div className="relative aspect-[16/9] w-full bg-[#eef0f4] overflow-hidden border-b border-black/[0.04]">
                    <img
                      src={anchor.imageUrl}
                      alt={`Module ${summary.moduleNumber} ${summary.titleKo} 핵심 도해`}
                      width={640}
                      height={360}
                      loading={idx < 2 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between gap-2 tabular-nums">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/72 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: anchor.accentHex }}
                        />
                        <span>Module 0{summary.moduleNumber}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-[#1d1d1f] shadow-xs">
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

                  {/* 본문 에디토리얼 설명 */}
                  <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-semibold text-[#6e6e73] block">
                        {summary.sourceMapping}
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f] leading-snug">
                          {summary.titleKo}
                        </h3>
                        <p className="text-xs font-medium text-[#6e6e73] line-clamp-1">
                          {summary.subtitleEn}
                        </p>
                      </div>

                      <p className="rounded-[14px] bg-[#f5f5f7] p-3.5 text-xs text-[#424245] leading-relaxed font-medium">
                        {anchor.mythQuestion}
                      </p>
                    </div>

                    {/* 유도 서브그래프 진행 바 & 액션 버튼 */}
                    <div className="space-y-3.5 pt-1 tabular-nums">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#6e6e73]">
                          <span>
                            서브그래프 숙련 {summary.masteredCount}/
                            {summary.totalNodes} 노드
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

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            onJumpToModuleStory(
                              summary.moduleId,
                              summary.leadTheoryId
                            )
                          }
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] px-4 py-2 text-xs font-semibold text-white transition-colors"
                        >
                          <span>스토리 진입</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onJumpToWorkspace(
                              'theories',
                              summary.moduleId,
                              summary.leadTheoryId
                            )
                          }
                          className="min-h-[40px] inline-flex items-center justify-center gap-1 rounded-full bg-[#f5f5f7] hover:bg-black/[0.07] px-4 py-2 text-xs font-semibold text-[#1d1d1f] transition-colors"
                        >
                          <span>도식·이론 탐색</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 하단 슬라이드 마커 도트 */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {moduleSummaries.map((summary, idx) => {
              const isCurrent = activeSlideIndex === idx;
              return (
                <button
                  key={`dot-${summary.moduleId}`}
                  type="button"
                  aria-current={isCurrent ? 'true' : undefined}
                  aria-label={`Module ${summary.moduleNumber} 슬라이드로 이동`}
                  onClick={() => scrollToSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    isCurrent
                      ? 'w-6 bg-[#1d1d1f]'
                      : 'w-2 bg-black/20 hover:bg-black/35'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* STAGE 3: 12-Column Apple Study Intelligence Bento Grid            */}
      {/* ================================================================= */}
      <section
        aria-labelledby={bentoHeadingId}
        className="bg-white py-14 sm:py-20"
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-xs font-semibold text-[var(--accent-solid)] block">
              스터디 인텔리전스 · Graph-Driven Telemetry
            </span>
            <h2
              id={bentoHeadingId}
              className="text-2xl sm:text-3xl font-bold tracking-[-0.024em] text-[#1d1d1f]"
            >
              90개 지식 정점의 위상과 숙련도를 한눈에.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* BENTO TILE 1 (7 Cols): Obsidian Dark 90-Node Mastery Arc Ring */}
            <article className="lg:col-span-7 bento-tile-dark p-6 sm:p-8 flex flex-col justify-between gap-6 apple-scroll-reveal tabular-nums">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2.5 max-w-md">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#66b2ff]">
                    <Network className="w-3.5 h-3.5 shrink-0" />
                    <span>90-Node Knowledge Graph</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    실시간 상향식 숙련도 아키텍처
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    플래시카드 인출 상태와 면접 키워드 방어율이 상위 20개 핵심 이론 정점으로
                    자동 전파됩니다.
                  </p>
                </div>

                {/* SVG 원형 숙련도 아크 링 */}
                <div className="relative w-36 h-36 shrink-0 mx-auto sm:mx-0 flex items-center justify-center">
                  <svg
                    viewBox="0 0 140 140"
                    className="w-full h-full -rotate-90"
                    role="img"
                    aria-label={`전체 지식 그래프 가중 숙련도 ${globalStats.overallPercent}%`}
                  >
                    <circle
                      cx="70"
                      cy="70"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="11"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={RING_RADIUS}
                      fill="none"
                      stroke="#2997ff"
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={ringStrokeDashoffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {globalStats.overallPercent}%
                    </span>
                    <span className="text-[10.5px] font-medium text-white/60">
                      {totalNodesCount} Nodes
                    </span>
                  </div>
                </div>
              </div>

              {/* 4단계 분포 카운터 + 그래프 직행 CTA */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-[14px] bg-white/[0.06] px-3.5 py-2.5">
                    <span className="text-[11px] text-emerald-300 font-semibold block">
                      숙련 완료
                    </span>
                    <span className="text-lg font-bold text-white">
                      {globalStats.mastered}
                    </span>
                  </div>
                  <div className="rounded-[14px] bg-white/[0.06] px-3.5 py-2.5">
                    <span className="text-[11px] text-amber-300 font-semibold block">
                      복습 요망
                    </span>
                    <span className="text-lg font-bold text-white">
                      {globalStats.review}
                    </span>
                  </div>
                  <div className="rounded-[14px] bg-white/[0.06] px-3.5 py-2.5">
                    <span className="text-[11px] text-rose-300 font-semibold block">
                      취약 (Again)
                    </span>
                    <span className="text-lg font-bold text-white">
                      {globalStats.weak}
                    </span>
                  </div>
                  <div className="rounded-[14px] bg-white/[0.06] px-3.5 py-2.5">
                    <span className="text-[11px] text-white/60 font-semibold block">
                      미학습
                    </span>
                    <span className="text-lg font-bold text-white">
                      {globalStats.unseen}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onJumpToWorkspace(
                        'graph',
                        'all',
                        resumeTarget.nodeId
                      )
                    }
                    className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-white text-[#1d1d1f] hover:bg-white/90 px-4.5 py-2 text-xs font-bold transition-colors"
                  >
                    <Network className="w-3.5 h-3.5 shrink-0" />
                    <span>전체 지식 그래프 열기</span>
                  </button>

                  <button
                    type="button"
                    onClick={onJumpToWeakGraph}
                    className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/16 text-white px-4 py-2 text-xs font-semibold transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                    <span>취약 서브그래프 하이라이트</span>
                  </button>
                </div>
              </div>
            </article>

            {/* BENTO TILE 2 (5 Cols): Topological Impact Priority Weak Queue */}
            <article className="lg:col-span-5 bento-tile-gray p-6 sm:p-8 flex flex-col justify-between gap-5 apple-scroll-reveal tabular-nums">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>위상 파급도 기반 표적 복습 큐</span>
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#424245] border border-black/[0.05]">
                    대기 {prioritizedWeakQueue.length}개
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">
                  {prioritizedWeakQueue.length > 0
                    ? '가장 파급력이 큰 취약 고리부터 보강'
                    : '추천 고차수 핵심 허브 경로'}
                </h3>
              </div>

              {prioritizedWeakQueue.length > 0 ? (
                <div className="space-y-2">
                  {prioritizedWeakQueue
                    .slice(0, BENTO_WEAK_PREVIEW_LIMIT)
                    .map((item) => (
                      <button
                        key={item.node.id}
                        type="button"
                        onClick={() => onInspectNode(item.node.id)}
                        className="w-full text-left rounded-[16px] bg-white hover:bg-white/80 p-3.5 border border-black/[0.05] shadow-2xs space-y-1 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10.5px] font-bold text-[#6e6e73] uppercase">
                            {item.node.moduleId.toUpperCase()} · 연결 차수{' '}
                            {item.semanticDegree}
                            {item.isBridgeHub ? ' · 브릿지 허브' : ''}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.mastery === 'weak'
                                ? 'bg-rose-500/12 text-rose-700'
                                : 'bg-amber-500/15 text-amber-800'
                            }`}
                          >
                            파급도 {item.priorityScore.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-[#1d1d1f] truncate">
                          {item.node.titleKo}
                        </p>
                        {item.prerequisiteTheoryNode && (
                          <p className="text-[11px] text-[var(--accent-solid)] font-medium truncate">
                            선수 이론: {item.prerequisiteTheoryNode.titleKo}
                          </p>
                        )}
                      </button>
                    ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {STARTER_RECOMMENDED_NODES.map((rec) => (
                    <button
                      key={rec.nodeId}
                      type="button"
                      onClick={() =>
                        onJumpToModuleStory(rec.moduleId, rec.nodeId)
                      }
                      className="w-full text-left rounded-[16px] bg-white hover:bg-white/80 p-3.5 border border-black/[0.05] shadow-2xs space-y-1 transition-colors"
                    >
                      <span className="text-[10.5px] font-semibold text-[var(--accent-solid)] block">
                        {rec.badge}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-[#1d1d1f] truncate">
                        {rec.titleKo}
                      </p>
                      <p className="text-[11px] text-[#6e6e73] line-clamp-1">
                        {rec.subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  onJumpToWorkspace('flashcards', 'all', 'mod1-fc-zpd')
                }
                className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] text-white px-4 py-2 text-xs font-semibold transition-colors"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>47개 한-영 학술 용어 인출 덱 열기</span>
              </button>
            </article>

            {/* BENTO TILE 3 (6 Cols): 90-Second Pressure Interview Defense */}
            <article className="lg:col-span-6 bento-tile-gray p-6 sm:p-8 flex flex-col justify-between gap-5 apple-scroll-reveal">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-700">
                  <MessageSquareWarning className="w-3.5 h-3.5 shrink-0" />
                  <span>90초 실전 압박 면접 시뮬레이터 · 13문항</span>
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">
                  꼬리질문까지 방어하는 루브릭 키워드 검증
                </h3>

                {featuredQuestion && (
                  <div className="rounded-[18px] bg-white p-4 border border-black/[0.05] space-y-2.5">
                    <p className="text-xs sm:text-sm font-bold text-[#1d1d1f] leading-relaxed line-clamp-2">
                      Q. {featuredQuestion.question}
                    </p>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed line-clamp-2">
                      압박 꼬리질문: “{featuredQuestion.followUpQuestion}”
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {featuredQuestion.requiredKeywords
                        .slice(0, FEATURED_KEYWORDS_PREVIEW_LIMIT)
                        .map((kw) => (
                          <span
                            key={kw}
                            className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#424245]"
                          >
                            {kw}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onJumpToWorkspace(
                      'interview',
                      featuredQuestionModuleId,
                      featuredQuestion?.id ?? 'mod1-q-piaget-vygotsky'
                    )
                  }
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] text-white px-5 py-2 text-xs font-semibold transition-colors"
                >
                  <span>90초 타이머 디펜스 직행</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onJumpToWorkspace(
                      'cases',
                      'all',
                      'mod1-case-hostile'
                    )
                  }
                  className="min-h-[40px] inline-flex items-center gap-1 rounded-full bg-white hover:bg-black/[0.04] border border-black/[0.07] px-4 py-2 text-xs font-semibold text-[#1d1d1f] transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-[var(--accent-solid)] shrink-0" />
                  <span>사례 3중 렌즈</span>
                </button>
              </div>
            </article>

            {/* BENTO TILE 4 (6 Cols): 2-Hop Graph-RAG Textbook-First AI Tutor */}
            <article className="lg:col-span-6 bento-tile-blue-spotlight p-6 sm:p-8 flex flex-col justify-between gap-5 apple-scroll-reveal">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-solid)]/12 px-3 py-1 text-[11px] font-semibold text-[var(--accent-solid)]">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>2-Hop Graph-RAG · 교재 우선 탐색 스키마</span>
                </span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1d1d1f]">
                  읽던 흐름 그대로, 즉석에서 묻는 학술 튜터
                </h3>
                <p className="text-xs sm:text-sm text-[#424245] leading-relaxed">
                  현재 열람 중인 정점에서 1-Hop · 2-Hop 의미 간선을 따라 수록 교재(Woolfolk ·
                  Seifert &amp; Sutton) 패시지를 먼저 인출하고, 교재 외 파생 개념일 때만
                  외부 학술 검색을 별도 카드로 분리해 보충합니다.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    '동화 vs 조절 구분',
                    '작업기억 외적 보철',
                    '소거 폭발 대처법',
                    '자기구실 만들기'
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/85 border border-black/[0.06] px-3 py-1 text-[11px] font-semibold text-[#1d1d1f]"
                    >
                      “{tag}”
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={onOpenAiTutor}
                  className="min-h-[40px] inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] hover:bg-[#2c2c2e] text-white px-5 py-2 text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#66b2ff] shrink-0" />
                  <span>AI 질문 말풍선 열기</span>
                </button>
                <span className="text-[11px] font-medium text-[#6e6e73]">
                  단축키 ⌘J · 모바일 하단 독 우측 버튼
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};
