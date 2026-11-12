import React, { useLayoutEffect, useRef } from 'react';
import {
  BookOpenCheck,
  Home,
  Layers,
  MessageCircleQuestion,
  Sparkles
} from 'lucide-react';
import { AppMode } from '../../types/graph';

interface MobileBottomNavProps {
  mode: AppMode;
  isAiTutorOpen: boolean;
  aiButtonRef: React.RefObject<HTMLButtonElement>;
  onMeasuredHeightChange: (heightPx: number) => void;
  onChangeMode: (next: AppMode) => void;
  onToggleAiTutor: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  mode,
  isAiTutorOpen,
  aiButtonRef,
  onMeasuredHeightChange,
  onChangeMode,
  onToggleAiTutor
}) => {
  const navRef = useRef<HTMLElement | null>(null);

  // 하단 1줄 고정 바의 실측 높이를 페인트 이전에 상위 좌표계(--measured-bottom-nav-h)에 동기화
  useLayoutEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    const emitHeight = () => {
      const measured = navEl.getBoundingClientRect().height;
      if (measured > 0) {
        onMeasuredHeightChange(measured);
      }
    };

    emitHeight();
    const ro = new ResizeObserver(emitHeight);
    ro.observe(navEl);
    window.addEventListener('resize', emitHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', emitHeight);
    };
  }, [onMeasuredHeightChange, mode]);

  return (
    <nav
      ref={navRef}
      aria-label="하단 주요 메뉴"
      className="no-print print:hidden lg:hidden fixed inset-x-0 bottom-0 z-40 apple-glass-dark text-white border-t border-white/12 safe-bottom-bar pt-1.5"
    >
      {/* 단일 1줄 고정 바: [홈 · 개념학습 · 실전훈련] | [AI 질문] */}
      <div className="flex items-center gap-1.5 px-1 tabular-nums">
        <div className="flex-1 grid grid-cols-3 gap-1 min-w-0">
          <button
            type="button"
            aria-current={mode === 'home' ? 'page' : undefined}
            onClick={() => onChangeMode('home')}
            className={`nav-mode-btn no-press-scale min-h-[44px] rounded-[14px] px-1 py-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mode === 'home'
                ? 'bg-white/16 text-white'
                : 'text-white/70 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>홈</span>
          </button>

          <button
            type="button"
            aria-current={mode === 'story' ? 'page' : undefined}
            onClick={() => onChangeMode('story')}
            className={`nav-mode-btn no-press-scale min-h-[44px] rounded-[14px] px-1 py-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mode === 'story'
                ? 'bg-white/16 text-white'
                : 'text-white/70 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <BookOpenCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>개념학습</span>
          </button>

          <button
            type="button"
            aria-current={mode === 'workspace' ? 'page' : undefined}
            onClick={() => onChangeMode('workspace')}
            className={`nav-mode-btn no-press-scale min-h-[44px] rounded-[14px] px-1 py-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              mode === 'workspace'
                ? 'bg-white/16 text-white'
                : 'text-white/70 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>실전훈련</span>
          </button>
        </div>

        <div
          aria-hidden="true"
          className="w-px h-7 bg-white/15 shrink-0"
        />

        <button
          ref={aiButtonRef}
          type="button"
          aria-expanded={isAiTutorOpen}
          aria-label="현재 화면 위에서 AI 질문 말풍선 열기"
          onClick={onToggleAiTutor}
          className={`shrink-0 min-h-[44px] rounded-[16px] px-3.5 py-1 flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold border transition-all active:scale-95 ${
            isAiTutorOpen
              ? 'bg-white text-[#1d1d1f] border-white shadow-[0_0_0_3px_rgba(0,113,227,0.45)]'
              : 'bg-[var(--accent-solid)] text-white border-white/20 shadow-[0_4px_14px_rgba(0,113,227,0.45)]'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <MessageCircleQuestion className="w-4 h-4 shrink-0" aria-hidden="true" />
            <Sparkles
              className={`w-2.5 h-2.5 -ml-0.5 -mt-1.5 shrink-0 ${
                isAiTutorOpen ? 'text-[var(--accent-solid)]' : 'text-sky-100'
              }`}
              aria-hidden="true"
            />
          </div>
          <span>AI 질문</span>
        </button>
      </div>
    </nav>
  );
};
