import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Download,
  GraduationCap,
  Network,
  RotateCcw,
  Search,
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
  onOpenSearch: () => void;
  onJumpToWeakGraph: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<{ success: boolean; message: string }>;
  onResetProgress: () => Promise<void>;
}

const HOLD_RESET_DURATION_MS = 1400;
const TOTAL_MODULES_DEFAULT = 5;

export const DualModeTopBar: React.FC<DualModeTopBarProps> = ({
  mode,
  onChangeMode,
  completedModules,
  totalModulesCount = TOTAL_MODULES_DEFAULT,
  masteryMap,
  totalNodesCount,
  isServerConnected,
  onOpenSearch,
  onJumpToWeakGraph,
  onExportBackup,
  onImportBackup,
  onResetProgress
}) => {
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  const [isHoldingReset, setIsHoldingReset] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Scroll-Driven Animation 미지원 브라우저용 rAF + style.transform 직접 쓰기 폴백 (리렌더링 0회)
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
    window.setTimeout(() => setToastMsg(null), 2600);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await onImportBackup(file);
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
  const ringCircumference = 2 * Math.PI * 12;
  const ringOffset =
    ringCircumference *
    (1 - Math.min(1, completedCount / Math.max(1, totalModulesCount)));

  return (
    <header className="no-print print:hidden sticky top-0 z-40 bg-slate-950/95 translucent-header backdrop-blur-md text-white border-b border-white/[0.08] pt-[env(safe-area-inset-top)]">
      {/* 상단 스크롤 진행률 인디케이터 (단일 도메인 액센트 + GPU scaleX 전용) */}
      <div
        aria-hidden="true"
        className="h-0.5 w-full bg-slate-900 overflow-hidden"
      >
        <div
          ref={progressBarRef}
          className="scroll-timeline-progress-bar gpu-progress-bar h-full w-full origin-left bg-indigo-500"
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* 좌측: 프로젝트 타이틀 + 모듈 진행률 링 (tabular-nums) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-[15px] font-bold tracking-tight text-white truncate">
                  EduPsych Interactive Studio
                </h1>
                <span
                  className={`hidden xl:inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border shrink-0 ${
                    isServerConnected
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/[0.06] text-slate-300 border-white/[0.08]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isServerConnected ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span>{isServerConnected ? '로컬 DB 연동' : '브라우저 저장소'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                Woolfolk 13판 · Seifert &amp; Sutton · 90개 학습 노드 지식 그래프
              </p>
            </div>
          </div>

          {/* 진행률 링 & 카운터 */}
          <div className="hidden md:flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-xs tabular-nums shrink-0">
            <svg className="w-6 h-6 -rotate-90 shrink-0" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="#1e293b"
                strokeWidth="3.5"
              />
              <circle
                cx="16"
                cy="16"
                r="12"
                fill="none"
                stroke="#34d399"
                strokeWidth="3.5"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="leading-tight">
              <div className="font-bold text-white text-[11px]">
                모듈 완주 {completedCount}/{totalModulesCount}
              </div>
              <div className="text-[10px] text-emerald-300 font-semibold">
                숙련 {counts.mastered}/{totalNodesCount} 노드
              </div>
            </div>
          </div>
        </div>

        {/* 중앙 세그먼트 스위치 (동심원 반경 rounded-xl -> rounded-lg, GPU translateX) */}
        <div
          role="group"
          aria-label="듀얼 학습 모드 전환"
          className="relative grid grid-cols-2 rounded-xl bg-slate-900 p-1 border border-white/[0.08] w-full sm:w-auto min-w-[280px] sm:min-w-[380px]"
        >
          <div
            aria-hidden="true"
            className="mode-switch-pill pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-indigo-600"
            style={{
              transform:
                mode === 'story' ? 'translateX(0%)' : 'translateX(100%)'
            }}
          />
          <button
            type="button"
            onClick={() => onChangeMode('story')}
            className={`relative z-10 min-h-[36px] px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
              mode === 'story'
                ? 'text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpenCheck className="w-3.5 h-3.5 shrink-0" />
            <span>스토리 가이드 학습</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('workspace')}
            className={`relative z-10 min-h-[36px] px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
              mode === 'workspace'
                ? 'text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5 shrink-0" />
            <span>스터디 워크스페이스</span>
          </button>
        </div>

        {/* 우측: 글로벌 검색(⌘K) + 취약 항목 배지 + 백업/복원/초기화 */}
        <div className="flex items-center gap-1.5 tabular-nums">
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] px-2.5 py-1.5 text-xs font-semibold text-slate-200"
            title="90개 노드 즉시 검색 및 이동 (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">노드 검색</span>
            <kbd className="rounded bg-white/[0.08] border border-white/[0.1] px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onJumpToWeakGraph}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold border ${
              counts.weakOrReview > 0
                ? 'bg-rose-500/15 text-rose-200 border-rose-500/35 hover:bg-rose-500/25'
                : 'bg-white/[0.05] text-slate-300 border-white/[0.08] hover:bg-white/[0.1]'
            }`}
            title="지식 그래프에서 복습 필요 노드만 하이라이트"
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 shrink-0 ${
                counts.weakOrReview > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            />
            <span>복습 표적 {counts.weakOrReview}개</span>
          </button>

          {/* 백업/복원 */}
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] px-2.5 py-1.5 text-xs font-semibold text-slate-300"
            title="학습 진행도 JSON 파일 다운로드"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">백업 저장</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] px-2.5 py-1.5 text-xs font-semibold text-slate-300"
            title="백업 JSON 파일 불러오기"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">백업 복원</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 1.4s Hold-to-Confirm 진도 초기화 버튼 */}
          <button
            type="button"
            data-holding={isHoldingReset ? 'true' : 'false'}
            onMouseDown={startHoldReset}
            onMouseUp={cancelHoldReset}
            onMouseLeave={cancelHoldReset}
            onTouchStart={startHoldReset}
            onTouchEnd={cancelHoldReset}
            className="hold-confirm-btn relative overflow-hidden inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-300"
            title="1.4초 동안 길게 누르면 전체 진도를 초기화합니다"
          >
            <span
              aria-hidden="true"
              className="hold-confirm-overlay pointer-events-none absolute inset-0 bg-rose-600/40"
            />
            <RotateCcw className="w-3.5 h-3.5 relative z-10 shrink-0" />
            <span className="hidden 2xl:inline relative z-10">
              {isHoldingReset ? '유지 중...' : '진도 초기화'}
            </span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="toast-enter bg-emerald-950 border-t border-emerald-700/60 px-4 py-1.5 text-center text-xs font-bold text-emerald-200 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </header>
  );
};
