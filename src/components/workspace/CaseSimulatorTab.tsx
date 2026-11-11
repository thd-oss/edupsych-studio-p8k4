import React, { useMemo, useState } from 'react';
import {
  Activity,
  Bookmark,
  Brain,
  Compass,
  Eye,
  EyeOff,
  HeartHandshake,
  Layers,
  Network,
  Plus,
  Save,
  X
} from 'lucide-react';
import { ModuleId } from '../../types/graph';
import { CaseLenses, ClassroomCase } from '../../types/study';
import { ComparisonCarousel } from '../shared/ComparisonCarousel';
import {
  CaseLensVisualRenderer,
  TriLensSummaryMatrix
} from '../visuals/CaseLensVisualRenderer';

interface CaseSimulatorTabProps {
  cases: ClassroomCase[];
  selectedModule: ModuleId | 'all';
  bookmarks: string[];
  userNotes: Record<string, string>;
  onToggleBookmark: (caseId: string) => void;
  onUpdateCaseNote: (caseId: string, note: string) => void;
  onCreateCase: (moduleId: ModuleId, item: ClassroomCase) => Promise<void>;
  onInspectNode: (nodeId: string) => void;
  onJumpToStory: (moduleId: ModuleId, nodeId: string) => void;
}

const LENS_META: Array<{
  key: keyof CaseLenses;
  title: string;
  subtitle: string;
  badgeClass: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'behavioral',
    title: '① 행동주의(FBA / PBS) 렌즈 처방도',
    subtitle: 'A-B-C 기능적 유관 분석 · 사전교정(Precorrection) · 대체행동(FCT)',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: <Activity className="w-4 h-4 text-emerald-700 shrink-0" />
  },
  {
    key: 'cognitive',
    title: '② 인지·신경심리(CLT / 보철) 렌즈 처방도',
    subtitle: '작업기억·실행기능 병목 진단 · 수행 시점 외적 보철 · 자기교수법',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    icon: <Brain className="w-4 h-4 text-indigo-700 shrink-0" />
  },
  {
    key: 'motivational',
    title: '③ 동기·정서·상담(SDT / 자기가치) 렌즈 처방도',
    subtitle: '기본심리욕구·귀인·자기가치 보호 분석 · 회복적 서클 및 학교상담',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
    icon: <HeartHandshake className="w-4 h-4 text-amber-700 shrink-0" />
  }
];

export const CaseSimulatorTab: React.FC<CaseSimulatorTabProps> = ({
  cases,
  selectedModule,
  bookmarks,
  userNotes,
  onToggleBookmark,
  onUpdateCaseNote,
  onCreateCase,
  onInspectNode,
  onJumpToStory
}) => {
  const [openLensesMap, setOpenLensesMap] = useState<
    Record<string, Record<keyof CaseLenses, boolean>>
  >({});
  const [showMatrixMap, setShowMatrixMap] = useState<Record<string, boolean>>(
    {}
  );
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({});
  const [savedToastId, setSavedToastId] = useState<string | null>(null);

  // 신규 사례 추가 폼
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModId, setNewModId] = useState<ModuleId>('mod1');
  const [newTitle, setNewTitle] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newScenario, setNewScenario] = useState('');
  const [newBeh, setNewBeh] = useState('');
  const [newCog, setNewCog] = useState('');
  const [newMot, setNewMot] = useState('');

  const filteredCases = useMemo(() => {
    if (selectedModule === 'all') return cases;
    return cases.filter((c) => c.moduleId === selectedModule);
  }, [cases, selectedModule]);

  const toggleLens = (caseId: string, lensKey: keyof CaseLenses) => {
    setOpenLensesMap((prev) => {
      const current = prev[caseId] ?? {
        behavioral: false,
        cognitive: false,
        motivational: false
      };
      return {
        ...prev,
        [caseId]: {
          ...current,
          [lensKey]: !current[lensKey]
        }
      };
    });
  };

  const toggleAllLensesForCase = (caseId: string) => {
    const current = openLensesMap[caseId] ?? {
      behavioral: false,
      cognitive: false,
      motivational: false
    };
    const allOpen =
      current.behavioral && current.cognitive && current.motivational;
    setOpenLensesMap((prev) => ({
      ...prev,
      [caseId]: {
        behavioral: !allOpen,
        cognitive: !allOpen,
        motivational: !allOpen
      }
    }));
    setShowMatrixMap((prev) => ({ ...prev, [caseId]: !allOpen }));
  };

  const handleSaveDraft = (caseId: string) => {
    const val =
      draftInputs[caseId] !== undefined
        ? draftInputs[caseId]
        : userNotes[caseId] ?? '';
    onUpdateCaseNote(caseId, val);
    setSavedToastId(caseId);
    window.setTimeout(() => setSavedToastId(null), 2000);
  };

  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newScenario.trim()) return;
    const item: ClassroomCase = {
      id: `${newModId}-case-custom-${Date.now()}`,
      moduleId: newModId,
      title: newTitle.trim(),
      studentGrade: newGrade.trim() || '중학교 2학년',
      scenario: newScenario.trim(),
      lenses: {
        behavioral: newBeh.trim() || '[A-B-C 분석] 기능적 유관 및 PBS 사전교정 처방',
        cognitive: newCog.trim() || '[인지·작업기억 분석] 환경적 보철 및 스키마 지원 처방',
        motivational: newMot.trim() || '[동기·상담 분석] 자율성 지지 및 재귀인 상담 처방'
      }
    };
    await onCreateCase(newModId, item);
    setNewTitle('');
    setNewGrade('');
    setNewScenario('');
    setNewBeh('');
    setNewCog('');
    setNewMot('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5">
      {/* 상단 헤더 */}
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-xs font-extrabold text-violet-900">
              <Brain className="w-3.5 h-3.5 text-violet-700 shrink-0" />
              <span>교실 사례 3중 렌즈 시뮬레이터 ({filteredCases.length}개 사례)</span>
            </span>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
              교실 임상 사례 블라인드 처방 훈련 &amp; 3중 렌즈(행동·인지·동기) 비교 시뮬레이터
            </h3>
            <p className="text-xs text-slate-600">
              모범 렌즈를 열기 전에 나만의 3중 개입안을 먼저 작성하여 능동적 전이(Transfer)를 훈련하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-violet-700 hover:bg-violet-600 px-3.5 py-1.5 text-xs font-extrabold text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>신규 교실 사례 추가</span>
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleCreateCaseSubmit}
            className="rounded-2xl bg-violet-50/70 border border-violet-200 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-violet-950">
                + 새 교실 임상 사례 추가
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
                className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-base sm:text-xs font-bold text-slate-800"
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
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="사례 제목"
                className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
              />
              <input
                type="text"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                placeholder="학생 학년/특성 (예: 초등 5학년 남학생)"
                className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
              />
            </div>
            <textarea
              rows={2}
              required
              value={newScenario}
              onChange={(e) => setNewScenario(e.target.value)}
              placeholder="교실 문제 상황 시나리오"
              className="w-full rounded-xl border border-violet-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <textarea
                rows={2}
                value={newBeh}
                onChange={(e) => setNewBeh(e.target.value)}
                placeholder="① 행동주의(FBA/PBS) 처방"
                className="rounded-xl border border-violet-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
              />
              <textarea
                rows={2}
                value={newCog}
                onChange={(e) => setNewCog(e.target.value)}
                placeholder="② 인지·신경심리(CLT/보철) 처방"
                className="rounded-xl border border-violet-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
              />
              <textarea
                rows={2}
                value={newMot}
                onChange={(e) => setNewMot(e.target.value)}
                placeholder="③ 동기·상담(SDT/귀인) 처방"
                className="rounded-xl border border-violet-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-violet-700 hover:bg-violet-600 px-4 py-1.5 text-xs font-extrabold text-white"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span>사례 저장</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 사례 리스트 */}
      <div className="space-y-6">
        {filteredCases.map((c, idx) => {
          const lensState = openLensesMap[c.id] ?? {
            behavioral: false,
            cognitive: false,
            motivational: false
          };
          const showMatrix = Boolean(showMatrixMap[c.id]);
          const draftVal =
            draftInputs[c.id] !== undefined
              ? draftInputs[c.id]
              : userNotes[c.id] ?? '';

          return (
            <article
              key={c.id}
              id={`workspace-case-${c.id}`}
              className="surface-card overflow-hidden"
            >
              {/* 상단 헤더 */}
              <div className="bg-slate-50/90 border-b border-slate-900/[0.08] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-extrabold text-white uppercase tabular-nums">
                      {c.moduleId.toUpperCase()} · CASE 0{idx + 1}
                    </span>
                    <span className="rounded-md bg-white border border-slate-900/[0.08] px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      대상: {c.studentGrade}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900 [overflow-wrap:anywhere]">
                    {c.title}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onJumpToStory(c.moduleId, c.id)}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-extrabold text-white transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span>스토리 맥락 보기</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onInspectNode(c.id)}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-900/[0.08] px-3 py-1.5 text-xs font-extrabold text-slate-800 transition-colors"
                  >
                    <Network className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>그래프 연결망</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAllLensesForCase(c.id)}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-extrabold text-white transition-colors"
                  >
                    {lensState.behavioral &&
                    lensState.cognitive &&
                    lensState.motivational ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                        <span>전체 렌즈 접기</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>3중 렌즈 전체 펼치기</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleBookmark(c.id)}
                    aria-label="북마크"
                    className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg bg-white hover:bg-slate-100 border border-slate-900/[0.08] transition-colors"
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        bookmarks.includes(c.id)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* 시나리오 원문 박스 */}
                <div className="surface-subtle p-4 sm:p-5 space-y-2">
                  <span className="text-xs font-extrabold text-indigo-700 block">
                    교실 임상 시나리오 원문
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium [overflow-wrap:anywhere]">
                    {c.scenario}
                  </p>
                </div>

                {/* Step 1: 블라인드 개입안 초안 작성 */}
                <div className="rounded-xl bg-violet-50/50 border border-violet-200 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor={`ws-case-draft-${c.id}`}
                      className="text-xs font-extrabold text-violet-950"
                    >
                      Step 1. 블라인드 처방 초안 작성 (모범 렌즈를 열기 전에 행동·인지·동기 개입안을 먼저 구성해 보세요)
                    </label>
                    {savedToastId === c.id && (
                      <span className="text-xs font-extrabold text-emerald-700">
                        저장 완료 (노드 숙련도 반영됨)
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <textarea
                      id={`ws-case-draft-${c.id}`}
                      rows={2}
                      value={draftVal}
                      onChange={(e) =>
                        setDraftInputs((prev) => ({
                          ...prev,
                          [c.id]: e.target.value
                        }))
                      }
                      placeholder="예: [행동] 과제 난이도 조절로 도피 기능 사전교정 + 도움을 요청하는 FCT 가르치기 / [인지] 수행 시점 시각 체크리스트 보철 제공 / [동기] 통제 가능한 전략 귀인 피드백..."
                      className="flex-1 rounded-lg border border-violet-200 bg-white p-3 text-base sm:text-xs text-slate-900 focus:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveDraft(c.id)}
                      className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-extrabold text-white shrink-0 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5 shrink-0" />
                      <span>내 처방안 저장</span>
                    </button>
                  </div>
                </div>

                {/* Step 2: 3중 렌즈 검증 (모바일은 내 초안 바로 아래 가로 스와이프 탭 비교, 데스크톱은 개별 아코디언) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-800">
                      Step 2. 과학자-실무자 3대 이론 렌즈 개입안 검증:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setShowMatrixMap((prev) => ({
                          ...prev,
                          [c.id]: !prev[c.id]
                        }))
                      }
                      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-1 text-xs font-extrabold text-white"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                      <span>
                        {showMatrix
                          ? '3중 렌즈 비교 매트릭스 닫기'
                          : '3중 렌즈 요약 매트릭스'}
                      </span>
                    </button>
                  </div>

                  {showMatrix && <TriLensSummaryMatrix classroomCase={c} />}

                  {/* 모바일(< lg): 세로 3단 적층 대신 가로 스와이프 & 세그먼트 탭으로 내 초안과 즉시 대조 */}
                  <div className="lg:hidden">
                    {lensState.behavioral ||
                    lensState.cognitive ||
                    lensState.motivational ? (
                      <ComparisonCarousel
                        ariaLabel={`${c.title} 행동·인지·동기 3중 렌즈 처방 비교`}
                        slides={[
                          {
                            id: `${c.id}-lens-beh`,
                            tabLabel: '① 행동 FBA',
                            activeTabClass:
                              'bg-emerald-700 text-white border-emerald-700 shadow-xs',
                            content: (
                              <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-2.5">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                  <Activity className="w-4 h-4 text-emerald-700 shrink-0" />
                                  <div>
                                    <span className="text-xs font-extrabold text-slate-900 block">
                                      행동주의(FBA / PBS) 렌즈 처방도
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      A-B-C 기능 분석 · 사전교정 · 대체행동(FCT)
                                    </span>
                                  </div>
                                </div>
                                <CaseLensVisualRenderer
                                  lensType="behavioral"
                                  rawText={c.lenses.behavioral}
                                  caseId={c.id}
                                />
                              </div>
                            )
                          },
                          {
                            id: `${c.id}-lens-cog`,
                            tabLabel: '② 인지·보철',
                            activeTabClass:
                              'bg-indigo-600 text-white border-indigo-600 shadow-xs',
                            content: (
                              <div className="rounded-2xl border border-indigo-200 bg-white p-4 space-y-2.5">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                  <Brain className="w-4 h-4 text-indigo-700 shrink-0" />
                                  <div>
                                    <span className="text-xs font-extrabold text-slate-900 block">
                                      인지·신경심리(CLT / 보철) 렌즈 처방도
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      작업기억 병목 완화 · 실행기능 외부 보철
                                    </span>
                                  </div>
                                </div>
                                <CaseLensVisualRenderer
                                  lensType="cognitive"
                                  rawText={c.lenses.cognitive}
                                  caseId={c.id}
                                />
                              </div>
                            )
                          },
                          {
                            id: `${c.id}-lens-mot`,
                            tabLabel: '③ 동기·상담',
                            activeTabClass:
                              'bg-rose-600 text-white border-rose-600 shadow-xs',
                            content: (
                              <div className="rounded-2xl border border-rose-200 bg-white p-4 space-y-2.5">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                  <HeartHandshake className="w-4 h-4 text-rose-600 shrink-0" />
                                  <div>
                                    <span className="text-xs font-extrabold text-slate-900 block">
                                      동기·정서·상담(SDT / 귀인) 렌즈 처방도
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      심리적 욕구 지지 · 통제 가능 전략 귀인
                                    </span>
                                  </div>
                                </div>
                                <CaseLensVisualRenderer
                                  lensType="motivational"
                                  rawText={c.lenses.motivational}
                                  caseId={c.id}
                                />
                              </div>
                            )
                          }
                        ]}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleAllLensesForCase(c.id)}
                        className="w-full min-h-[46px] rounded-2xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-3 text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Eye className="w-4 h-4 shrink-0" />
                        <span>
                          3중 렌즈(행동·인지·동기) 가로 스와이프 처방 비교 열기
                        </span>
                      </button>
                    )}
                  </div>

                  {/* 데스크톱(lg+): 개별 아코디언 토글 유지 */}
                  <div className="hidden lg:block space-y-3">
                    {LENS_META.map((meta) => {
                      const isOpen = lensState[meta.key];
                      return (
                        <div
                          key={meta.key}
                          className="rounded-2xl border border-slate-200 overflow-hidden bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => toggleLens(c.id, meta.key)}
                            className="w-full text-left px-4 py-3.5 bg-slate-50 hover:bg-slate-100 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              {meta.icon}
                              <div>
                                <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                                  {meta.title}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {meta.subtitle}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`rounded-lg border px-2.5 py-1 text-xs font-extrabold ${meta.badgeClass}`}
                            >
                              {isOpen ? '▲ 렌즈 접기' : '▼ 처방 도식 열기'}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/40">
                              <CaseLensVisualRenderer
                                lensType={meta.key}
                                rawText={c.lenses[meta.key]}
                                caseId={c.id}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
