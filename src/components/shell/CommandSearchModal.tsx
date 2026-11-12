import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  Layers,
  MessageSquareWarning,
  Search,
  X
} from 'lucide-react';
import {
  KnowledgeGraphNode,
  MasteryState,
  NodeKind
} from '../../types/graph';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: KnowledgeGraphNode[];
  masteryMap: Record<string, MasteryState>;
  onSelectNode: (nodeId: string) => void;
}

const KIND_META: Record<
  Exclude<NodeKind, 'module'>,
  {
    label: string;
    destinationLabel: string;
    badgeClass: string;
    icon: React.ReactNode;
  }
> = {
  theory: {
    label: '핵심 이론',
    destinationLabel: '개념학습',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  flashcard: {
    label: '학술 용어',
    destinationLabel: '단어장',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  case: {
    label: '임상 사례',
    destinationLabel: '개념학습',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
    icon: <Brain className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  },
  question: {
    label: '압박 면접',
    destinationLabel: '90초 면접',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: (
      <MessageSquareWarning className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    )
  }
};

const MASTERY_BADGE: Record<
  MasteryState,
  { label: string; className: string }
> = {
  mastered: {
    label: '숙련',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  review: {
    label: '복습',
    className: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  weak: {
    label: '취약',
    className: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  unseen: {
    label: '미학습',
    className: 'bg-slate-100 text-slate-600 border-slate-200'
  }
};

const MAX_RESULTS_DISPLAY = 30;

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({
  isOpen,
  onClose,
  nodes,
  masteryMap,
  onSelectNode
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pressedOutsideRef = useRef(false);
  const headingId = useId();
  const searchInputId = useId();

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<
    'all' | Exclude<NodeKind, 'module'>
  >('all');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const searchableNodes = useMemo(
    () => nodes.filter((n) => n.kind !== 'module'),
    [nodes]
  );

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return searchableNodes
      .filter((n) => {
        if (kindFilter !== 'all' && n.kind !== kindFilter) return false;
        if (!q) return true;
        return (
          n.titleKo.toLowerCase().includes(q) ||
          n.titleEn.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice(0, MAX_RESULTS_DISPLAY);
  }, [searchableNodes, query, kindFilter]);

  const isOutsideDialog = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={() => {
        if (dialogRef.current) {
          dialogRef.current.returnValue = '';
        }
        onClose();
      }}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isOutsideDialog(e);
      }}
      onPointerUp={(e) => {
        if (pressedOutsideRef.current && isOutsideDialog(e)) {
          dialogRef.current?.close();
        }
      }}
      className="instant-dialog w-[min(94vw,680px)] rounded-[24px] bg-white text-[#1d1d1f] p-0 shadow-[var(--shadow-overlay)] border border-black/[0.08] overflow-hidden"
    >
      <div className="p-4 sm:p-5 bg-[#f5f5f7] border-b border-black/[0.06] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Search
              className="w-4 h-4 text-[var(--accent-solid)] shrink-0"
              aria-hidden="true"
            />
            <h2
              id={headingId}
              className="text-sm font-bold text-[#1d1d1f] truncate"
            >
              통합 학습 검색 (⌘K) — 항목 선택 시 고유 위치로 바로 이동
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="검색 창 닫기"
            className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-full bg-white hover:bg-black/[0.05] border border-black/[0.08] text-[#424245] shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="relative">
          <label htmlFor={searchInputId} className="sr-only">
            이론, 용어, 사례, 면접 문항 검색어 입력
          </label>
          <Search
            className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id={searchInputId}
            ref={inputRef}
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이론, 한-영 학술 용어, 임상 사례, 면접 키워드 입력 (예: ZPD, CHC, 사전교정)..."
            className="w-full rounded-full bg-white border border-black/[0.1] pl-10 pr-4 py-2.5 text-base sm:text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none"
          />
        </div>

        <div className="chip-scroll-row tabular-nums">
          {(
            [
              { id: 'all', label: `전체 (${searchableNodes.length})` },
              { id: 'theory', label: '이론 (20)' },
              { id: 'flashcard', label: '단어장 (47)' },
              { id: 'case', label: '사례 (10)' },
              { id: 'question', label: '90초 면접 (13)' }
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={kindFilter === item.id}
              onClick={() => setKindFilter(item.id)}
              className={`min-h-[32px] rounded-full px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                kindFilter === item.id
                  ? 'bg-[#1d1d1f] text-white'
                  : 'bg-white text-[#424245] border border-black/[0.06] hover:bg-black/[0.04]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[62dvh] overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
        {filteredNodes.length === 0 ? (
          <div className="py-12 text-center space-y-1">
            <p className="text-sm font-bold text-slate-700">
              검색어와 일치하는 학습 항목이 없습니다.
            </p>
            <p className="text-xs text-slate-500">
              한국어 용어, 영어 원서 용어, 또는 모듈 키워드로 검색해 보세요.
            </p>
          </div>
        ) : (
          filteredNodes.map((node) => {
            if (node.kind === 'module') return null;
            const meta = KIND_META[node.kind];
            const mastery = masteryMap[node.id] ?? 'unseen';
            const mBadge = MASTERY_BADGE[mastery];

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  onSelectNode(node.id);
                  dialogRef.current?.close();
                }}
                className="group w-full text-left p-3 rounded-xl hover:bg-[#f5f5f7] flex items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-[#1d1d1f] px-2 py-0.5 text-[10px] font-bold text-white uppercase tabular-nums">
                      {node.moduleId.toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}
                    >
                      {meta.icon}
                      <span>{meta.label}</span>
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${mBadge.className}`}
                    >
                      {mBadge.label}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#1d1d1f] group-hover:text-[var(--accent-solid)] korean-keep-all">
                    {node.titleKo}
                  </p>
                  <p className="text-[11px] text-[#6e6e73] line-clamp-1">
                    {node.titleEn}
                  </p>
                </div>

                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#f5f5f7] group-hover:bg-[var(--accent-solid)] px-3 py-1.5 text-[11px] font-semibold text-[#424245] group-hover:text-white transition-colors whitespace-nowrap">
                  <span>{meta.destinationLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </span>
              </button>
            );
          })
        )}
      </div>
    </dialog>
  );
};
