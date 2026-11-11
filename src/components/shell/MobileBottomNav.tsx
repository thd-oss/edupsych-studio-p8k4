import React, { useState } from 'react';
import {
  BookOpen,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Layers,
  MessageSquareWarning,
  Network,
  Printer,
  Search
} from 'lucide-react';
import { MODULE_CONCEPT_ANCHORS } from '../../data/curriculumGraph';
import { AppMode, ModuleId, WorkspaceTabId } from '../../types/graph';
import { ModulePayload } from '../../types/study';

interface MobileBottomNavProps {
  mode: AppMode;
  activeTab: WorkspaceTabId;
  selectedModule: ModuleId | 'all';
  completedModules: ModuleId[];
  modules: ModulePayload[];
  weakOrReviewCount: number;
  onChangeMode: (next: AppMode) => void;
  onChangeTab: (tab: WorkspaceTabId) => void;
  onChangeModule: (mod: ModuleId | 'all') => void;
  onOpenSearch: () => void;
}

const MOBILE_WORKSPACE_TOOLS: Array<{
  id: WorkspaceTabId;
  shortLabel: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'graph',
    shortLabel: '① 그래프',
    icon: <Network className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  {
    id: 'theories',
    shortLabel: '② 이론비교',
    icon: <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  {
    id: 'flashcards',
    shortLabel: '③ 카드암기',
    icon: <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  {
    id: 'cases',
    shortLabel: '④ 사례렌즈',
    icon: <Brain className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  {
    id: 'interview',
    shortLabel: '⑤ 압박면접',
    icon: (
      <MessageSquareWarning className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    )
  },
  {
    id: 'cheatsheet',
    shortLabel: '⑥ 요약인쇄',
    icon: <Printer className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  }
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  mode,
  activeTab,
  selectedModule,
  completedModules,
  modules,
  weakOrReviewCount,
  onChangeMode,
  onChangeTab,
  onChangeModule,
  onOpenSearch
}) => {
  const [isModulePickerOpen, setIsModulePickerOpen] = useState<boolean>(false);

  const selectedModBadge =
    selectedModule === 'all'
      ? '전체'
      : `M${selectedModule.replace('mod', '')}`;

  const handleSelectModule = (mod: ModuleId | 'all') => {
    onChangeModule(mod);
    setIsModulePickerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      aria-label="모바일 하단 학습 탐색 독"
      className="no-print print:hidden lg:hidden fixed inset-x-0 bottom-0 z-40 bg-slate-950/95 translucent-header backdrop-blur-md text-white border-t border-white/10 safe-bottom-bar pt-1.5 space-y-1.5"
    >
      {/* 상단 컨텍스트 스트립: 모듈 빠른 점프 피커 또는 워크스페이스 6대 도구 스와이프 바 */}
      {isModulePickerOpen ? (
        <div
          role="region"
          aria-label="모듈 즉시 이동 선택기"
          className="mobile-strip-scroll px-1 pb-1 border-b border-white/10"
        >
          {modules.map((m) => {
            const isSelected = selectedModule === m.id;
            const isDone = completedModules.includes(m.id);
            const anchor = MODULE_CONCEPT_ANCHORS[m.id];

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectModule(m.id)}
                className={`min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-extrabold border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-white/[0.06] text-slate-200 border-white/10'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: anchor.accentHex }}
                  aria-hidden="true"
                />
                <span>
                  M{m.number}. {m.title.split(' ')[0]}
                </span>
                {isDone && (
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handleSelectModule('all')}
            className={`min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-extrabold border ${
              selectedModule === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-white/[0.06] text-slate-300 border-white/10'
            }`}
          >
            전체 연속(M1~5)
          </button>
        </div>
      ) : mode === 'workspace' ? (
        <div
          role="tablist"
          aria-label="워크스페이스 6대 학습 도구 전환"
          className="mobile-strip-scroll px-1 pb-1 border-b border-white/10"
        >
          {MOBILE_WORKSPACE_TOOLS.map((tool) => {
            const isActive = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => {
                  onChangeTab(tool.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`no-press-scale min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-extrabold border flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : 'bg-white/[0.05] text-slate-300 border-white/10 hover:text-white'
                }`}
              >
                {tool.icon}
                <span>{tool.shortLabel}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* 하단 메인 4버튼 엄지 네비게이션 (터치 타깃 >= 44px 준수) */}
      <div className="grid grid-cols-4 gap-1 px-0.5 tabular-nums">
        <button
          type="button"
          aria-current={mode === 'story' ? 'page' : undefined}
          onClick={() => {
            setIsModulePickerOpen(false);
            onChangeMode('story');
          }}
          className={`no-press-scale min-h-[44px] rounded-xl px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold transition-colors ${
            mode === 'story' && !isModulePickerOpen
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-white/[0.06]'
          }`}
        >
          <BookOpenCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>스토리</span>
        </button>

        <button
          type="button"
          aria-current={mode === 'workspace' ? 'page' : undefined}
          onClick={() => {
            setIsModulePickerOpen(false);
            onChangeMode('workspace');
          }}
          className={`no-press-scale min-h-[44px] rounded-xl px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold transition-colors ${
            mode === 'workspace' && !isModulePickerOpen
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-white/[0.06]'
          }`}
        >
          <Network className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>워크스페이스</span>
        </button>

        <button
          type="button"
          aria-expanded={isModulePickerOpen}
          onClick={() => setIsModulePickerOpen((prev) => !prev)}
          className={`no-press-scale min-h-[44px] rounded-xl px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold transition-colors ${
            isModulePickerOpen
              ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-300 hover:bg-white/[0.06]'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>모듈 · {selectedModBadge}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsModulePickerOpen(false);
            onOpenSearch();
          }}
          className="no-press-scale relative min-h-[44px] rounded-xl px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold text-slate-300 hover:bg-white/[0.06] transition-colors"
        >
          <div className="relative">
            <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
            {weakOrReviewCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500"
              />
            )}
          </div>
          <span>노드 검색</span>
        </button>
      </div>
    </nav>
  );
};
