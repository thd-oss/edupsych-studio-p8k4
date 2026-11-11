import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Compass,
  Edit3,
  Layers,
  Network,
  Plus,
  Save,
  Search,
  Stethoscope,
  X
} from 'lucide-react';
import { THEORY_GRAPH_MAPPING } from '../../data/curriculumGraph';
import { getTheoryVisualBlueprint } from '../../data/theoryVisuals';
import {
  KnowledgeGraphNode,
  MasteryState,
  ModuleId
} from '../../types/graph';
import { TheoryConcept } from '../../types/study';
import { VisualTopologyType } from '../../types/visuals';
import { ComparisonCarousel } from '../shared/ComparisonCarousel';
import { TheoryVisualRenderer } from '../visuals/TheoryVisualRenderer';

interface TheoryArchiveTabProps {
  theories: TheoryConcept[];
  selectedModule: ModuleId | 'all';
  bookmarks: string[];
  nodeMap: Record<string, KnowledgeGraphNode>;
  masteryMap: Record<string, MasteryState>;
  onToggleBookmark: (itemId: string) => void;
  onUpdateNote: (theoryId: string, note: string) => void;
  onUpdateTheoryContent: (
    theoryId: string,
    updatedFields: Partial<TheoryConcept>
  ) => Promise<void>;
  onCreateTheory: (moduleId: ModuleId, item: TheoryConcept) => Promise<void>;
  onInspectNode: (nodeId: string) => void;
  onJumpToStory: (moduleId: ModuleId, nodeId: string) => void;
}

const TOPOLOGY_FILTERS: Array<{
  id: 'all' | VisualTopologyType;
  label: string;
}> = [
  { id: 'all', label: '전체 토폴로지 (20)' },
  { id: 'hierarchy-pyramid', label: '위계 피라미드' },
  { id: 'concentric-circles', label: '다층 동심원' },
  { id: 'matrix-2x2', label: '2×2 매트릭스' },
  { id: 'process-cycle', label: '순환 피드백' },
  { id: 'step-flow', label: '단계 파이프라인' },
  { id: 'stacked-gauge', label: '인지부하 게이지' },
  { id: 'spectrum-continuum', label: '스펙트럼 연속체' },
  { id: 'triadic-network', label: '삼원 상호결정망' }
];

export const TheoryArchiveTab: React.FC<TheoryArchiveTabProps> = ({
  theories,
  selectedModule,
  bookmarks,
  nodeMap,
  masteryMap,
  onToggleBookmark,
  onUpdateNote,
  onUpdateTheoryContent,
  onCreateTheory,
  onInspectNode,
  onJumpToStory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [topologyFilter, setTopologyFilter] = useState<
    'all' | VisualTopologyType
  >('all');
  const [viewMode, setViewMode] = useState<'combined' | 'visual-only'>(
    'combined'
  );

  // 인라인 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleKo, setEditTitleKo] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editCritical, setEditCritical] = useState('');
  const [editInterview, setEditInterview] = useState('');

  // 노트 입력 상태
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savedToastId, setSavedToastId] = useState<string | null>(null);

  // 신규 이론 추가 폼
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModId, setNewModId] = useState<ModuleId>('mod1');
  const [newTitleKo, setNewTitleKo] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newDefText, setNewDefText] = useState('');
  const [newCritical, setNewCritical] = useState('');
  const [newInterview, setNewInterview] = useState('');

  const filteredTheories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return theories.filter((t) => {
      if (selectedModule !== 'all' && t.moduleId !== selectedModule) {
        return false;
      }
      if (bookmarkedOnly && !bookmarks.includes(t.id)) {
        return false;
      }
      const blueprint = getTheoryVisualBlueprint(t);
      if (topologyFilter !== 'all' && blueprint.topology !== topologyFilter) {
        return false;
      }
      if (!q) return true;
      return (
        t.titleKo.toLowerCase().includes(q) ||
        t.titleEn.toLowerCase().includes(q) ||
        t.criticalPerspective.toLowerCase().includes(q) ||
        t.interviewPoint.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [theories, selectedModule, bookmarkedOnly, topologyFilter, searchQuery, bookmarks]);

  const startEditing = (t: TheoryConcept) => {
    setEditingId(t.id);
    setEditTitleKo(t.titleKo);
    setEditTitleEn(t.titleEn);
    setEditCritical(t.criticalPerspective);
    setEditInterview(t.interviewPoint);
  };

  const handleSaveEdit = async (theoryId: string) => {
    await onUpdateTheoryContent(theoryId, {
      titleKo: editTitleKo,
      titleEn: editTitleEn,
      criticalPerspective: editCritical,
      interviewPoint: editInterview
    });
    setEditingId(null);
    setSavedToastId(theoryId);
    window.setTimeout(() => setSavedToastId(null), 2000);
  };

  const handleCreateTheorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleKo.trim()) return;
    const item: TheoryConcept = {
      id: `${newModId}-theory-custom-${Date.now()}`,
      moduleId: newModId,
      titleKo: newTitleKo.trim(),
      titleEn: newTitleEn.trim() || 'Custom Educational Psychology Theory',
      sourceMapping: 'User Custom Archive',
      tags: ['사용자 추가 이론', newModId.toUpperCase()],
      textbookDefinition: newDefText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      criticalPerspective:
        newCritical.trim() || '과학자-실무자 관점 보충 설명',
      interviewPoint: newInterview.trim() || '면접 핵심 구술 포인트',
      userNote: ''
    };
    await onCreateTheory(newModId, item);
    setNewTitleKo('');
    setNewTitleEn('');
    setNewDefText('');
    setNewCritical('');
    setNewInterview('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5">
      {/* 상단 필터 & 컨트롤 헤더 */}
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-extrabold text-indigo-900">
              <BookOpen className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span>핵심 이론 &amp; 8대 시각 도식 비교기</span>
            </span>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
              핵심 이론 아카이브 &amp; 과학자-실무자 비판적 재해석 ({filteredTheories.length}개)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-900/[0.08]">
              <button
                type="button"
                onClick={() => setViewMode('combined')}
                className={`min-h-[32px] rounded-lg px-3 py-1 text-xs font-extrabold transition-colors ${
                  viewMode === 'combined'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                도식 + 원서·비판 통합
              </button>
              <button
                type="button"
                onClick={() => setViewMode('visual-only')}
                className={`min-h-[32px] rounded-lg px-3 py-1 text-xs font-extrabold transition-colors ${
                  viewMode === 'visual-only'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                8대 시각 도식만 집중
              </button>
            </div>

            <button
              type="button"
              onClick={() => setBookmarkedOnly((prev) => !prev)}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold border transition-colors ${
                bookmarkedOnly
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-slate-700 border-slate-900/[0.08] hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 shrink-0" />
              <span>북마크만 보기</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-extrabold text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>신규 이론 추가</span>
            </button>
          </div>
        </div>

        {/* 검색창 + 8대 토폴로지 칩 필터 */}
        <div className="space-y-3 pt-2 border-t border-slate-900/[0.06]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이론명, 학자(Piaget, Vygotsky, CHC, Sweller, Barkley, Bandura, Weiner, Deci), 면접 키워드 검색..."
              className="w-full rounded-xl bg-slate-50 border border-slate-900/[0.08] pl-10 pr-4 py-2.5 text-base sm:text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div className="chip-scroll-row flex items-center gap-1.5">
            {TOPOLOGY_FILTERS.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTopologyFilter(tf.id)}
                className={`min-h-[30px] rounded-lg px-2.5 py-1 text-xs font-bold border shrink-0 transition-colors ${
                  topologyFilter === tf.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-900/[0.08] hover:bg-slate-100'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* 신규 이론 추가 폼 */}
        {showAddForm && (
          <form
            onSubmit={handleCreateTheorySubmit}
            className="rounded-2xl bg-indigo-50/70 border border-indigo-200 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-950">
                + 새 교육심리 이론 노드 추가 (로컬 DB 자동 영구 저장 및 지식 그래프 연결)
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <select
                value={newModId}
                onChange={(e) => setNewModId(e.target.value as ModuleId)}
                className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-base sm:text-xs font-bold text-slate-800"
              >
                <option value="mod1">Module 1 (발달)</option>
                <option value="mod2">Module 2 (다양성·CHC·CLT)</option>
                <option value="mod3">Module 3 (행동주의·FBA/PBS)</option>
                <option value="mod4">Module 4 (인지·자기조절)</option>
                <option value="mod5">Module 5 (동기·학급경영)</option>
              </select>
              <input
                type="text"
                required
                value={newTitleKo}
                onChange={(e) => setNewTitleKo(e.target.value)}
                placeholder="한국어 이론 제목"
                className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
              />
              <input
                type="text"
                value={newTitleEn}
                onChange={(e) => setNewTitleEn(e.target.value)}
                placeholder="영문 이론 명칭"
                className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
              />
            </div>

            <textarea
              rows={2}
              value={newDefText}
              onChange={(e) => setNewDefText(e.target.value)}
              placeholder="교과서 핵심 명제 (줄바꿈으로 구분)"
              className="w-full rounded-xl border border-indigo-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <textarea
                rows={2}
                value={newCritical}
                onChange={(e) => setNewCritical(e.target.value)}
                placeholder="과학자-실무자 비판적 관점"
                className="rounded-xl border border-indigo-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
              />
              <textarea
                rows={2}
                value={newInterview}
                onChange={(e) => setNewInterview(e.target.value)}
                placeholder="대학원 면접 구술 포인트"
                className="rounded-xl border border-indigo-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-extrabold text-white"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span>이론 아카이브에 저장</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 이론 카드 리스트 */}
      <div className="space-y-6">
        {filteredTheories.map((theory) => {
          const blueprint = getTheoryVisualBlueprint(theory);
          const mapping = THEORY_GRAPH_MAPPING[theory.id];
          const isBookmarked = bookmarks.includes(theory.id);
          const mastery = masteryMap[theory.id] ?? 'unseen';
          const isEditing = editingId === theory.id;
          const noteValue =
            noteDrafts[theory.id] !== undefined
              ? noteDrafts[theory.id]
              : theory.userNote ?? '';

          return (
            <article
              key={theory.id}
              id={`workspace-theory-${theory.id}`}
              className="surface-card overflow-hidden"
            >
              {/* 카드 상단 바 */}
              <div className="bg-slate-50/90 border-b border-slate-900/[0.08] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-extrabold text-white uppercase tabular-nums">
                      {theory.moduleId.toUpperCase()}
                    </span>
                    <span className="rounded-md bg-white border border-slate-900/[0.08] px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      {theory.sourceMapping}
                    </span>
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800 uppercase">
                      {mastery}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900 [overflow-wrap:anywhere]">
                    {theory.titleKo}
                  </h4>
                  <p className="text-xs text-slate-500 [overflow-wrap:anywhere]">
                    {theory.titleEn}
                  </p>
                </div>

                {/* 우측 액션 버튼들 */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onJumpToStory(theory.moduleId, theory.id)}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-extrabold text-white transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span>스토리 맥락 보기</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onInspectNode(theory.id)}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-900/[0.08] px-3 py-1.5 text-xs font-extrabold text-slate-800 transition-colors"
                  >
                    <Network className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>그래프 연결망</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      isEditing ? setEditingId(null) : startEditing(theory)
                    }
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-900/[0.08] px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 shrink-0" />
                    <span>{isEditing ? '편집 취소' : '본문 수정'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(theory.id)}
                    aria-label="북마크 토글"
                    className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg bg-white hover:bg-slate-100 border border-slate-900/[0.08] transition-colors"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        isBookmarked
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* 본문 수정 폼 */}
                {isEditing && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                    <span className="text-xs font-extrabold text-amber-950 block">
                      이론 아카이브 본문 직접 수정 (로컬 JSON DB 반영)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={editTitleKo}
                        onChange={(e) => setEditTitleKo(e.target.value)}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-base sm:text-xs font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        value={editTitleEn}
                        onChange={(e) => setEditTitleEn(e.target.value)}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={editCritical}
                      onChange={(e) => setEditCritical(e.target.value)}
                      className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-base sm:text-xs text-slate-900"
                    />
                    <textarea
                      rows={2}
                      value={editInterview}
                      onChange={(e) => setEditInterview(e.target.value)}
                      className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-base sm:text-xs text-slate-900"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(theory.id)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-1.5 text-xs font-extrabold text-white"
                      >
                        <Save className="w-3.5 h-3.5 shrink-0" />
                        <span>수정 내용 저장</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 8대 시각 아키텍처 도식 렌더러 */}
                <TheoryVisualRenderer blueprint={blueprint} />

                {/* 원서 명제 + 과학자-실무자 재해석 + 면접 포인트 + 개인 노트 */}
                {viewMode === 'combined' && (
                  <div className="space-y-4">
                    {/* 모바일(< lg): 상단 도식과 동시에 한 화면에서 좌우 대조하는 비교 캐러셀 */}
                    <ComparisonCarousel
                      ariaLabel={`${theory.titleKo} 명제·비판·면접 포인트 비교`}
                      className="lg:hidden"
                      slides={[
                        {
                          id: `${theory.id}-ws-def`,
                          tabLabel: '① 교과서 명제',
                          badge: `${theory.textbookDefinition.length}`,
                          activeTabClass:
                            'bg-indigo-600 text-white border-indigo-600 shadow-xs',
                          content: (
                            <div className="surface-subtle p-4 space-y-2.5 h-full">
                              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>원서·교과서 핵심 명제</span>
                              </span>
                              <ul className="space-y-2">
                                {theory.textbookDefinition.map((def, dIdx) => (
                                  <li
                                    key={dIdx}
                                    className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 leading-relaxed"
                                  >
                                    <span className="mt-0.5 w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">
                                      {dIdx + 1}
                                    </span>
                                    <span className="[overflow-wrap:anywhere]">
                                      {def}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        },
                        {
                          id: `${theory.id}-ws-crit`,
                          tabLabel: '② 비판적 재해석',
                          activeTabClass:
                            'bg-slate-900 text-white border-slate-900 shadow-xs',
                          content: (
                            <div className="rounded-xl bg-slate-900 text-white p-4 space-y-1.5 h-full">
                              <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 shrink-0" />
                                <span>과학자-실무자 비판적 재해석</span>
                              </span>
                              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed [overflow-wrap:anywhere]">
                                {theory.criticalPerspective}
                              </p>
                            </div>
                          )
                        },
                        {
                          id: `${theory.id}-ws-intv`,
                          tabLabel: '③ 면접 90초',
                          activeTabClass:
                            'bg-amber-600 text-white border-amber-600 shadow-xs',
                          content: (
                            <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-1.5 h-full">
                              <span className="text-xs font-extrabold text-amber-950 block">
                                대학원 면접 90초 구술 핵심 포인트
                              </span>
                              <p className="text-xs sm:text-sm font-medium text-amber-950 leading-relaxed [overflow-wrap:anywhere]">
                                {theory.interviewPoint}
                              </p>
                            </div>
                          )
                        }
                      ]}
                    />

                    {/* 데스크톱(lg+): 좌우 2컬럼 동시 비교 */}
                    <div className="hidden lg:grid lg:grid-cols-2 gap-4">
                      <div className="surface-subtle p-4 space-y-2.5">
                        <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>원서·교과서 핵심 명제</span>
                        </span>
                        <ul className="space-y-2">
                          {theory.textbookDefinition.map((def, dIdx) => (
                            <li
                              key={dIdx}
                              className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 leading-relaxed"
                            >
                              <span className="mt-0.5 w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums">
                                {dIdx + 1}
                              </span>
                              <span className="[overflow-wrap:anywhere]">
                                {def}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-xl bg-slate-900 text-white p-4 space-y-1.5">
                          <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                            <Stethoscope className="w-4 h-4 shrink-0" />
                            <span>과학자-실무자 비판적 재해석</span>
                          </span>
                          <p className="text-xs sm:text-sm text-slate-100 leading-relaxed [overflow-wrap:anywhere]">
                            {theory.criticalPerspective}
                          </p>
                        </div>

                        <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-1">
                          <span className="text-xs font-extrabold text-amber-950 block">
                            대학원 면접 90초 구술 핵심 포인트
                          </span>
                          <p className="text-xs sm:text-sm font-medium text-amber-950 leading-relaxed [overflow-wrap:anywhere]">
                            {theory.interviewPoint}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 지식 그래프 연결 노드 빠른 이동 칩 */}
                    {mapping && (
                      <div className="surface-subtle p-3.5 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>연결된 하위 용어·사례·면접 노드:</span>
                        </span>
                        {[
                          ...mapping.flashcards,
                          ...mapping.cases,
                          ...mapping.questions
                        ].map((childId) => {
                          const childNode = nodeMap[childId];
                          if (!childNode) return null;
                          return (
                            <button
                              key={childId}
                              type="button"
                              onClick={() => onInspectNode(childId)}
                              className="inline-flex items-center gap-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-900/[0.08] hover:border-indigo-300 px-2.5 py-1 text-xs font-bold text-slate-800 transition-colors"
                            >
                              <span className="text-[10px] font-extrabold text-indigo-600 uppercase">
                                {childNode.kind === 'flashcard'
                                  ? 'FC'
                                  : childNode.kind === 'case'
                                  ? 'CASE'
                                  : 'Q'}
                              </span>
                              <span className="truncate max-w-[200px]">
                                {childNode.titleKo}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 개인 비판적 노트 저장 바 */}
                    <div className="rounded-xl bg-indigo-50/50 border border-indigo-200/80 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <input
                        type="text"
                        value={noteValue}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [theory.id]: e.target.value
                          }))
                        }
                        placeholder="이 이론에 대한 나만의 구술 요약 문장이나 연구 아이디어를 메모하세요..."
                        className="flex-1 rounded-lg border border-indigo-200 bg-white px-3.5 py-2 text-base sm:text-xs text-slate-900 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateNote(theory.id, noteValue);
                          setSavedToastId(theory.id);
                          window.setTimeout(() => setSavedToastId(null), 2000);
                        }}
                        className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-extrabold text-white shrink-0 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {savedToastId === theory.id ? '저장됨' : '노트 저장'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
