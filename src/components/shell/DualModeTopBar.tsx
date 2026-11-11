import React, { useEffect, useId, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  Download,
  Ellipsis,
  GraduationCap,
  Home,
  Network,
  RotateCcw,
  Search,
  Sparkles,
  Upload
} from 'lucide-react';
import { AppMode, MasteryState, ModuleId } from '../../types/graph';

interface DualModeTopBarProps {
  mode: AppMode;
  onChangeMode: (nextMode: AppMode) => void;
  completedModules: ModuleId[];
  totalModulesCount: number;
  masteryMap: Record<string, MasteryState>;
  totalNodesCount: number;
  isServerConnected: boolean;
  isAiTutorOpen: boolean;
  onOpenSearch: () => void;
  onToggleAiTutor: () => void;
  onJumpToWeakGraph: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<{ success: boolean; message: string }>;
  onResetProgress: () => Promise<void>;
}

const HOLD_RESET_DURATION_MS = 1400;
const TOAST_AUTO_DISMISS_MS = 2600;
const TOTAL_MODULES_DEFAULT = 5;

export const DualModeTopBar: React.FC<DualModeTopBarProps> = ({
  mode,
  onChangeMode,
  completedModules,
  totalModulesCount = TOTAL_MODULES_DEFAULT,
  masteryMap,
  totalNodesCount,
  isServerConnected,
  isAiTutorOpen,
  onOpenSearch,
  onToggleAiTutor,
  onJumpToWeakGraph,
  onExportBackup,
  onImportBackup,
  onResetProgress
}) => {
  const menuPanelId = useId();
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const menuWrapperRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isHoldingReset, setIsHoldingReset] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Scroll-Driven Animation 미지원 브라우저용 rAF + style.transform 폴백
  useEffect(() => {
    const supportsScrollTimeline =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('animation-timeline', 'scroll()');

    if (supportsScrollTimeline) {
      return;
    }

    let rafId: number | null = null;
    const updateScrollBar = () => {
      rafId = null;
      if (!progressBarRef.current) return;
      const docEl = document.documentElement;
      const maxScroll = Math.max(1, docEl.scrollHeight - window.innerHeight);
      const ratio = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      progressBarRef.current.style.transform = `scaleX(${ratio})`;
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateScrollBar);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollBar();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [mode]);

  // 스튜디오 관리 드롭다운 외부 클릭 및 Escape 닫기
  useEffect(() => {
    if (!isManageOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const wrap = menuWrapperRef.current;
      if (wrap && !wrap.contains(e.target as Node)) {
        setIsManageOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsManageOpen(false);
        menuTriggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isManageOpen]);

  const counts = React.useMemo(() => {
    let mastered = 0;
    let weakOrReview = 0;
    for (const state of Object.values(masteryMap)) {
      if (state === 'mastered') mastered += 1;
      if (state === 'weak' || state === 'review') weakOrReview += 1;
    }
    return { mastered, weakOrReview };
  }, [masteryMap]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), TOAST_AUTO_DISMISS_MS);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onImportBackup(file);
    setIsManageOpen(false);
    showToast(result.message);
    e.target.value = '';
  };

  const startHoldReset = () => {
    setIsHoldingReset(true);
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
    }
    holdTimerRef.current = window.setTimeout(async () => {
      setIsHoldingReset(false);
      holdTimerRef.current = null;
      await onResetProgress();
      setIsManageOpen(false);
      showToast('모든 스토리·워크스페이스 진행 상태가 초기화되었습니다.');
    }, HOLD_RESET_DURATION_MS);
  };

  const cancelHoldReset = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHoldingReset(false);
  };

  const completedCount = completedModules.length;

  return (
    <header className="no-print print:hidden sticky top-0 z-40 apple-glass-light text-[#1d1d1f] border-b border-black/[0.07] pt-[env(safe-area-inset-top)]">
      {/* 상단 2px Apple Blue 스크롤 진행률 인디케이터 */}
      <div
        aria-hidden="true"
        className="h-[2px] w-full bg-black/[0.04] overflow-hidden"
      >
        <div
          ref={progressBarRef}
          className="scroll-timeline-progress-bar gpu-progress-bar h-full w-full origin-left bg-[var(--accent-solid)]"
        />
      </div>

      {/* 단일 48px 컴팩트 프로스티드 글래스 리본 (content-first-noise-reduction: 뷰포트 12% 미만 단일 행 유지) */}
      <div className="max-w-[1280px] mx-auto px-3.5 sm:px-6 h-12 flex items-center justify-between gap-2">
        {/* 좌측: 애플 스타일 미니멀 워드마크 (홈 쇼케이스 이동) */}
        <button
          type="button"
          onClick={() => onChangeMode('home')}
          className="inline-flex items-center gap-2 rounded-full py-1 pr-2.5 text-left group min-w-0"
          title="EduPsych Studio 홈 쇼케이스로 이동"
        >
          <span className="w-7 h-7 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className="text-[14px] sm:text-[15px] font-semibold tracking-tight text-[#1d1d1f] whitespace-nowrap">
            EduPsych <span className="font-normal text-[#6e6e73] hidden sm:inline">Studio</span>
          </span>
        </button>

        {/* 중앙(lg+): [홈 · 스토리 · 워크스페이스] 3-모드 애플 세그먼트 피커 */}
        <nav
          aria-label="주요 학습 모드"
          className="hidden lg:inline-flex apple-segmented-track"
        >
          {(
            [
              {
                id: 'home',
                label: '홈',
                icon: <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              },
              {
                id: 'story',
                label: '스토리 커리큘럼',
                icon: (
                  <BookOpenCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )
              },
              {
                id: 'workspace',
                label: '스터디 워크스페이스',
                icon: <Network className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              }
            ] as const
          ).map((item) => {
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-active={isActive ? 'true' : 'false'}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onChangeMode(item.id)}
                className={`apple-segmented-pill no-press-scale min-h-[32px] px-4 py-1 text-xs flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#1d1d1f]'
                    : 'text-[#424245] hover:text-[#1d1d1f]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 우측: 글로벌 스포트라이트 검색 + 복습 표적 + 데스크톱 AI 질문 + [⋯] 스튜디오 관리 팝오버 */}
        <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
          <button
            type="button"
            aria-label="90개 노드 스포트라이트 검색 열기"
            onClick={onOpenSearch}
            className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center gap-1.5 rounded-full bg-black/[0.05] hover:bg-black/[0.09] px-2.5 sm:px-3 py-1 text-xs font-semibold text-[#1d1d1f]"
            title="90개 학습 노드 즉시 검색 (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-[#424245] shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">검색</span>
            <kbd className="hidden xl:inline rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-[#6e6e73] border border-black/[0.06]">
              ⌘K
            </kbd>
          </button>

          {/* 복습 표적 서브그래프 바로가기 */}
          <button
            type="button"
            onClick={onJumpToWeakGraph}
            className={`inline-flex min-h-[34px] items-center gap-1 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-colors ${
              counts.weakOrReview > 0
                ? 'bg-rose-500/12 text-rose-700 hover:bg-rose-500/18'
                : 'bg-black/[0.05] text-[#424245] hover:bg-black/[0.09]'
            }`}
            title="위상 파급도 기준 복습 필요 서브그래프 열기"
          >
            <AlertTriangle
              aria-hidden="true"
              className={`w-3.5 h-3.5 shrink-0 ${
                counts.weakOrReview > 0 ? 'text-rose-600' : 'text-[#6e6e73]'
              }`}
            />
            <span>복습 {counts.weakOrReview}</span>
          </button>

          {/* 데스크톱 전용 AI 질문 캡슐 (모바일은 하단 글래스 독 우측 런처가 담당) */}
          <button
            type="button"
            aria-expanded={isAiTutorOpen}
            aria-label="교재 우선 탐색 AI 질문 말풍선 열기"
            onClick={onToggleAiTutor}
            className={`hidden lg:inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
              isAiTutorOpen
                ? 'bg-[var(--accent-solid)] text-white shadow-sm'
                : 'bg-[var(--accent-subtle)] text-[var(--accent-solid)] hover:bg-[#0071e3]/15'
            }`}
            title="2-Hop 지식 그래프 기반 교재 우선 AI 튜터 (⌘J)"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>AI 질문</span>
          </button>

          {/* [⋯] 스튜디오 관리(백업·복원·진도 요약·초기화) 드롭다운 */}
          <div ref={menuWrapperRef} className="relative">
            <button
              ref={menuTriggerRef}
              type="button"
              aria-label="스튜디오 데이터 및 백업 관리 메뉴"
              aria-expanded={isManageOpen}
              aria-controls={menuPanelId}
              onClick={() => setIsManageOpen((prev) => !prev)}
              className={`inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-full transition-colors ${
                isManageOpen
                  ? 'bg-[#1d1d1f] text-white'
                  : 'bg-black/[0.05] hover:bg-black/[0.09] text-[#1d1d1f]'
              }`}
              title="진도 요약 · JSON 백업 · 복원 · 초기화"
            >
              <Ellipsis className="w-4 h-4" aria-hidden="true" />
            </button>

            {isManageOpen && (
              <div
                id={menuPanelId}
                role="region"
                aria-label="스튜디오 학습 데이터 관리"
                className="absolute right-0 top-[calc(100%+0.55rem)] w-[min(19.5rem,calc(100vw-1.5rem))] rounded-[22px] bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-[var(--shadow-overlay)] p-3.5 space-y-3 text-[#1d1d1f] z-50"
              >
                <div className="rounded-[14px] bg-[#f5f5f7] p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#6e6e73]">
                      학습 그래프 텔레메트리
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#424245] border border-black/[0.05]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isServerConnected ? 'bg-emerald-500' : 'bg-[#0071e3]'
                        }`}
                      />
                      <span>{isServerConnected ? '로컬 DB' : '브라우저 저장소'}</span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className="text-xs font-bold text-[#1d1d1f]">
                      모듈 완주 {completedCount}/{totalModulesCount}
                    </span>
                    <span className="text-xs font-bold text-[var(--accent-solid)]">
                      숙련 {counts.mastered}/{totalNodesCount} 노드
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onExportBackup();
                      setIsManageOpen(false);
                      showToast('학습 진행도 JSON 백업 파일을 저장했습니다.');
                    }}
                    className="w-full min-h-[38px] rounded-[12px] bg-[#f5f5f7] hover:bg-black/[0.07] px-3 py-2 text-xs font-semibold text-[#1d1d1f] flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
                      <span>진행도 JSON 백업 다운로드</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full min-h-[38px] rounded-[12px] bg-[#f5f5f7] hover:bg-black/[0.07] px-3 py-2 text-xs font-semibold text-[#1d1d1f] flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
                      <span>백업 JSON 파일에서 복원</span>
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="pt-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    data-holding={isHoldingReset ? 'true' : 'false'}
                    onPointerDown={startHoldReset}
                    onPointerUp={cancelHoldReset}
                    onPointerLeave={cancelHoldReset}
                    onPointerCancel={cancelHoldReset}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                        startHoldReset();
                      }
                    }}
                    onKeyUp={cancelHoldReset}
                    className="hold-confirm-btn relative overflow-hidden w-full min-h-[38px] rounded-[12px] bg-rose-50 hover:bg-rose-100/80 px-3 py-2 text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5"
                  >
                    <span
                      aria-hidden="true"
                      className="hold-confirm-overlay pointer-events-none absolute inset-0 bg-rose-600/20"
                    />
                    <RotateCcw className="w-3.5 h-3.5 relative z-10 shrink-0" />
                    <span className="relative z-10">
                      {isHoldingReset
                        ? '계속 누르면 초기화됩니다...'
                        : '1.4초 길게 눌러 진도 초기화'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 토스트 알림 */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="toast-enter fixed top-16 right-4 z-50 rounded-full bg-[#1d1d1f] text-white px-4 py-2.5 text-xs font-semibold shadow-xl border border-white/10"
        >
          {toastMsg}
        </div>
      )}
    </header>
  );
};
