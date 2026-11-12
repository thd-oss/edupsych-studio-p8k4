import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Bookmark,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Grid,
  HelpCircle,
  Layers,
  Plus,
  RotateCw,
  Save,
  Search,
  Sparkles,
  X,
  XCircle
} from 'lucide-react';
import { ModuleId, StoryScrollRequest } from '../../types/graph';
import { Flashcard, FlashcardStatus } from '../../types/study';

interface FlashcardSrsTabProps {
  flashcards: Flashcard[];
  selectedModule: ModuleId | 'all';
  bookmarks: string[];
  focusRequest?: StoryScrollRequest | null;
  onConsumeFocusRequest?: () => void;
  onUpdateStatus: (cardId: string, status: FlashcardStatus) => void;
  onToggleBookmark: (cardId: string) => void;
  onCreateFlashcard: (moduleId: ModuleId, item: Flashcard) => Promise<void>;
  onJumpToConceptContext: (nodeId: string) => void;
  onOpenTextbookPassage: (nodeId: string) => void;
}

export const FlashcardSrsTab: React.FC<FlashcardSrsTabProps> = ({
  flashcards,
  selectedModule,
  bookmarks,
  focusRequest = null,
  onConsumeFocusRequest,
  onUpdateStatus,
  onToggleBookmark,
  onCreateFlashcard,
  onJumpToConceptContext,
  onOpenTextbookPassage
}) => {
  const [displayMode, setDisplayMode] = useState<'deck' | 'grid'>('deck');
  const [direction, setDirection] = useState<'ko-to-en' | 'en-to-ko'>(
    'ko-to-en'
  );
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'confusing' | FlashcardStatus
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 덱 모드 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeckFlipped, setIsDeckFlipped] = useState(false);

  // 그리드 모드 뒤집기 상태
  const [gridFlippedMap, setGridFlippedMap] = useState<Record<string, boolean>>(
    {}
  );

  // 신규 카드 추가 폼
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModId, setNewModId] = useState<ModuleId>('mod1');
  const [newTermKo, setNewTermKo] = useState('');
  const [newTermEn, setNewTermEn] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newExample, setNewExample] = useState('');

  const moduleFilteredCards = useMemo(() => {
    if (selectedModule === 'all') return flashcards;
    return flashcards.filter((c) => c.moduleId === selectedModule);
  }, [flashcards, selectedModule]);

  const counts = useMemo(() => {
    let mastered = 0;
    let review = 0;
    let again = 0;
    let unseen = 0;
    for (const c of moduleFilteredCards) {
      if (c.status === 'mastered') mastered += 1;
      else if (c.status === 'review') review += 1;
      else if (c.status === 'again') again += 1;
      else unseen += 1;
    }
    return {
      mastered,
      review,
      again,
      unseen,
      confusing: again + review,
      total: moduleFilteredCards.length
    };
  }, [moduleFilteredCards]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return moduleFilteredCards.filter((c) => {
      if (statusFilter === 'confusing') {
        if (c.status !== 'again' && c.status !== 'review') return false;
      } else if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        c.termKo.toLowerCase().includes(q) ||
        c.termEn.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q) ||
        c.classroomExample.toLowerCase().includes(q)
      );
    });
  }, [moduleFilteredCards, statusFilter, searchQuery]);

  // 모듈·필터 변경 시 기본 0번 인덱스 리셋 (단, 외부 딥링크 포커스 요청 처리 중에는 덮어쓰지 않음)
  useEffect(() => {
    if (focusRequest) return;
    setCurrentIndex(0);
    setIsDeckFlipped(false);
  }, [selectedModule, statusFilter, searchQuery, focusRequest]);

  // 개념학습 파생 학술 용어 칩·검색·그래프에서 특정 플래시카드 직행 시 해당 카드로 즉시 포커스
  useEffect(() => {
    if (!focusRequest) return;
    const existsInAll = flashcards.some((c) => c.id === focusRequest.nodeId);
    if (!existsInAll) {
      onConsumeFocusRequest?.();
      return;
    }
    if (statusFilter !== 'all' || searchQuery !== '') {
      setStatusFilter('all');
      setSearchQuery('');
      return;
    }
    const targetIdx = filteredCards.findIndex(
      (c) => c.id === focusRequest.nodeId
    );
    if (targetIdx >= 0) {
      setDisplayMode('deck');
      setCurrentIndex(targetIdx);
      setIsDeckFlipped(false);
      onConsumeFocusRequest?.();
    }
  }, [
    focusRequest,
    flashcards,
    filteredCards,
    statusFilter,
    searchQuery,
    onConsumeFocusRequest
  ]);

  const activeCard: Flashcard | undefined =
    filteredCards[Math.min(currentIndex, Math.max(0, filteredCards.length - 1))];

  // 키보드 단축키: Space/Enter 0ms 즉시 뒤집기, 화살표 이동
  useEffect(() => {
    if (displayMode !== 'deck' || !activeCard) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'BUTTON')
      ) {
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsDeckFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsDeckFlipped(false);
        setCurrentIndex((prev) =>
          filteredCards.length > 0 ? (prev + 1) % filteredCards.length : 0
        );
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsDeckFlipped(false);
        setCurrentIndex((prev) =>
          filteredCards.length > 0
            ? (prev - 1 + filteredCards.length) % filteredCards.length
            : 0
        );
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [displayMode, activeCard, filteredCards.length]);

  const handleGradeDeckCard = (status: FlashcardStatus) => {
    if (!activeCard) return;
    onUpdateStatus(activeCard.id, status);
    setIsDeckFlipped(false);
    if (filteredCards.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermKo.trim() || !newTermEn.trim()) return;
    const item: Flashcard = {
      id: `${newModId}-fc-custom-${Date.now()}`,
      moduleId: newModId,
      termKo: newTermKo.trim(),
      termEn: newTermEn.trim(),
      definition: newDefinition.trim() || '핵심 학술 정의',
      classroomExample: newExample.trim() || '교실 현장 적용 사례',
      status: 'unseen'
    };
    await onCreateFlashcard(newModId, item);
    setNewTermKo('');
    setNewTermEn('');
    setNewDefinition('');
    setNewExample('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5">
      {/* 상단 플래시카드 컨트롤 & 숙련도 분포 헤더 */}
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-extrabold text-emerald-900">
              <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>한-영 학술 단어장 ({counts.total}개 용어)</span>
            </span>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
              한-영 학술 용어 능동적 인출 훈련 (평가 즉시 지식그래프 숙련도에 실시간 반영)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 한→영 / 영→한 전환 */}
            <button
              type="button"
              onClick={() =>
                setDirection((prev) =>
                  prev === 'ko-to-en' ? 'en-to-ko' : 'ko-to-en'
                )
              }
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 text-xs font-extrabold text-indigo-900 transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                {direction === 'ko-to-en'
                  ? '한국어 → 영어 인출'
                  : '영어 → 한국어 인출'}
              </span>
            </button>

            {/* 덱 모드 / 그리드 모드 전환 */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-900/[0.08]">
              <button
                type="button"
                onClick={() => setDisplayMode('deck')}
                className={`min-h-[32px] rounded-lg px-3 py-1 text-xs font-extrabold flex items-center gap-1 transition-colors ${
                  displayMode === 'deck'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>1장씩 덱 모드</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('grid')}
                className={`min-h-[32px] rounded-lg px-3 py-1 text-xs font-extrabold flex items-center gap-1 transition-colors ${
                  displayMode === 'grid'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5 shrink-0" />
                <span>전체 그리드</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 text-xs font-extrabold text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>카드 추가</span>
            </button>
          </div>
        </div>

        {/* 숙련도 필터 버튼 & 검색 */}
        <div className="pt-3 border-t border-slate-900/[0.06] flex flex-wrap items-center justify-between gap-3 tabular-nums">
          <div className="chip-scroll-row flex items-center gap-1.5 min-w-0 max-w-full">
            {(
              [
                { id: 'all', label: `전체 (${counts.total})` },
                {
                  id: 'confusing',
                  label: `헷갈리는 카드 (${counts.confusing})`
                },
                { id: 'again', label: `모름 Again (${counts.again})` },
                { id: 'review', label: `애매함 Review (${counts.review})` },
                { id: 'mastered', label: `완벽 Mastered (${counts.mastered})` },
                { id: 'unseen', label: `미학습 (${counts.unseen})` }
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-extrabold border shrink-0 transition-colors ${
                  statusFilter === item.id
                    ? item.id === 'confusing' || item.id === 'again'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-900/[0.08] hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="한글·영문 용어 검색..."
              aria-label="단어장 한글 및 영문 용어 검색"
              className="w-full rounded-lg bg-slate-50 border border-slate-900/[0.08] pl-9 pr-3 py-1.5 text-base sm:text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 신규 카드 추가 폼 */}
        {showAddForm && (
          <form
            onSubmit={handleCreateSubmit}
            className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-950">
                + 새 한-영 플래시카드 추가
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                aria-label="카드 추가 폼 닫기"
                className="text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={newModId}
                onChange={(e) => setNewModId(e.target.value as ModuleId)}
                aria-label="소속 모듈 선택"
                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-base sm:text-xs font-bold text-slate-800"
              >
                <option value="mod1">Module 1</option>
                <option value="mod2">Module 2</option>
                <option value="mod3">Module 3</option>
                <option value="mod4">Module 4</option>
                <option value="mod5">Module 5</option>
              </select>
              <input
                type="text"
                required
                value={newTermKo}
                onChange={(e) => setNewTermKo(e.target.value)}
                placeholder="한국어 학술 용어"
                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
              />
              <input
                type="text"
                required
                value={newTermEn}
                onChange={(e) => setNewTermEn(e.target.value)}
                placeholder="English Academic Term"
                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <textarea
                rows={2}
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                placeholder="핵심 학술 정의"
                className="rounded-xl border border-emerald-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
              />
              <textarea
                rows={2}
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                placeholder="교실·상담 현장 처방 예시"
                className="rounded-xl border border-emerald-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-4 py-1.5 text-xs font-extrabold text-white"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span>플래시카드 저장</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 본문: 덱 모드 vs 그리드 모드 */}
      {filteredCards.length === 0 ? (
        <div className="surface-card p-12 text-center space-y-2">
          <p className="text-sm font-extrabold text-slate-800">
            해당 조건에 맞는 플래시카드가 없습니다.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-extrabold text-white"
          >
            <span>전체 카드 보기로 복귀</span>
          </button>
        </div>
      ) : displayMode === 'deck' && activeCard ? (
        <div className="max-w-3xl mx-auto space-y-4">
          {/* 덱 상단 네비게이션 */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-slate-600 tabular-nums px-1">
            <span>
              카드 {currentIndex + 1} / {filteredCards.length}
            </span>
            <span className="text-indigo-600 hidden sm:inline">
              단축키: Space / Enter (즉시 뒤집기) · ← / → (이전/다음 카드)
            </span>
          </div>

          {/* 메인 0ms 즉시 뒤집기 카드 */}
          <div
            role="button"
            tabIndex={0}
            data-node-id={activeCard.id}
            onClick={() => setIsDeckFlipped((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsDeckFlipped((prev) => !prev);
              }
            }}
            className={`no-press-scale rounded-2xl border p-6 sm:p-8 shadow-sm cursor-pointer select-none min-h-[320px] flex flex-col justify-between transition-colors ${
              isDeckFlipped
                ? 'bg-slate-900 text-white border-indigo-500'
                : 'bg-white text-slate-900 border-slate-900/[0.08] hover:border-indigo-300'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-indigo-600 px-2.5 py-0.5 text-xs font-extrabold text-white uppercase tabular-nums">
                  {activeCard.moduleId.toUpperCase()}
                </span>
                <span className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700 uppercase">
                  상태: {activeCard.status}
                </span>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className="flex flex-wrap items-center gap-1.5"
              >
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => onOpenTextbookPassage(activeCard.id)}
                  className={`inline-flex min-h-[32px] items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold border ${
                    isDeckFlipped
                      ? 'bg-amber-400/15 text-amber-200 border-amber-300/30 hover:bg-amber-400/25'
                      : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>원문 발췌</span>
                </button>

                <button
                  type="button"
                  onClick={() => onJumpToConceptContext(activeCard.id)}
                  className={`inline-flex min-h-[32px] items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold border ${
                    isDeckFlipped
                      ? 'bg-white/10 text-indigo-200 border-white/15 hover:bg-white/20'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <BookOpenCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>관련 개념학습</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleBookmark(activeCard.id)}
                  aria-label="북마크"
                  className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-xl border border-slate-200/40"
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      bookmarks.includes(activeCard.id)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-400'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 앞면 vs 뒷면 */}
            <div className="py-6 space-y-4">
              <div className="space-y-1.5">
                <span
                  className={`text-xs font-extrabold uppercase tracking-wider ${
                    isDeckFlipped ? 'text-indigo-300' : 'text-indigo-600'
                  }`}
                >
                  {direction === 'ko-to-en'
                    ? '한국어 학술 개념 (Prompt)'
                    : 'English Academic Term (Prompt)'}
                </span>
                <h4 className="text-xl sm:text-2xl font-extrabold leading-snug [overflow-wrap:anywhere]">
                  {direction === 'ko-to-en'
                    ? activeCard.termKo
                    : activeCard.termEn}
                </h4>
              </div>

              {!isDeckFlipped ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs sm:text-sm text-slate-600 flex items-center justify-between">
                  <span>
                    반대 언어 원서 용어와 핵심 정의·교실 처방 예시를 머릿속으로 인출한 뒤 카드를 터치하세요.
                  </span>
                  <RotateCw className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                </div>
              ) : (
                <div className="space-y-3.5 pt-3 border-t border-white/15">
                  <div>
                    <span className="text-[11px] font-extrabold text-amber-300 uppercase">
                      반대 언어 학술 표기
                    </span>
                    <p className="text-base sm:text-lg font-extrabold text-amber-200 [overflow-wrap:anywhere]">
                      ⇄{' '}
                      {direction === 'ko-to-en'
                        ? activeCard.termEn
                        : activeCard.termKo}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 border border-white/15 p-4 space-y-1.5">
                    <span className="text-xs font-extrabold text-emerald-300">
                      ① 핵심 학술 정의 (Definition)
                    </span>
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed [overflow-wrap:anywhere]">
                      {activeCard.definition}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-500/15 border border-amber-400/30 p-4 space-y-1.5">
                    <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>② 교실·상담 현장 처방 적용 (Classroom Prescription)</span>
                    </span>
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed [overflow-wrap:anywhere]">
                      {activeCard.classroomExample}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-right text-xs font-bold text-slate-400">
              {isDeckFlipped ? '터치하여 앞면으로 접기' : '터치하여 정답 확인'}
            </div>
          </div>

          {/* 하단 SRS 평가 버튼 + 이전/다음 */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsDeckFlipped(false);
                setCurrentIndex(
                  (prev) =>
                    (prev - 1 + filteredCards.length) % filteredCards.length
                );
              }}
              className="min-h-[44px] rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>이전</span>
            </button>

            <button
              type="button"
              onClick={() => handleGradeDeckCard('again')}
              className="min-h-[44px] rounded-2xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-extrabold text-white flex items-center justify-center gap-1.5 shadow-xs"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span>모름 (Again)</span>
            </button>

            <button
              type="button"
              onClick={() => handleGradeDeckCard('review')}
              className="min-h-[44px] rounded-2xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>애매함 (Review)</span>
            </button>

            <button
              type="button"
              onClick={() => handleGradeDeckCard('mastered')}
              className="min-h-[44px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-white flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>완벽 (Mastered)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDeckFlipped(false);
                setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
              }}
              className="min-h-[44px] rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 flex items-center justify-center gap-1.5"
            >
              <span>다음</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      ) : (
        /* 그리드 모드 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card) => {
            const isFlipped = Boolean(gridFlippedMap[card.id]);
            return (
              <div
                key={card.id}
                data-node-id={card.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-colors ${
                  isFlipped
                    ? 'bg-slate-900 text-white border-indigo-500'
                    : 'surface-card text-slate-900'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase tabular-nums">
                      {card.moduleId.toUpperCase()} · {card.status}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => onOpenTextbookPassage(card.id)}
                        className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-950 inline-flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>원문 발췌</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onJumpToConceptContext(card.id)}
                        className="rounded-lg bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-800"
                      >
                        관련 개념학습
                      </button>
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setGridFlippedMap((prev) => ({
                        ...prev,
                        [card.id]: !prev[card.id]
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGridFlippedMap((prev) => ({
                          ...prev,
                          [card.id]: !prev[card.id]
                        }));
                      }
                    }}
                    className="no-press-scale cursor-pointer space-y-2 py-1"
                  >
                    <h4 className="text-base font-extrabold [overflow-wrap:anywhere]">
                      {direction === 'ko-to-en' ? card.termKo : card.termEn}
                    </h4>
                    {isFlipped ? (
                      <div className="space-y-2 pt-2 border-t border-white/15 text-xs">
                        <p className="font-extrabold text-amber-300">
                          ⇄ {direction === 'ko-to-en' ? card.termEn : card.termKo}
                        </p>
                        <p className="text-slate-200 leading-relaxed">
                          {card.definition}
                        </p>
                        <p className="text-amber-200/90 leading-relaxed">
                          처방: {card.classroomExample}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-indigo-600 font-bold">
                        ▼ 터치하여 정의 및 처방 예시 펼치기
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100/80">
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(card.id, 'again')}
                    className={`min-h-[34px] rounded-xl text-xs font-extrabold border ${
                      card.status === 'again'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    Again
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(card.id, 'review')}
                    className={`min-h-[34px] rounded-xl text-xs font-extrabold border ${
                      card.status === 'review'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(card.id, 'mastered')}
                    className={`min-h-[34px] rounded-xl text-xs font-extrabold border ${
                      card.status === 'mastered'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}
                  >
                    Mastered
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
