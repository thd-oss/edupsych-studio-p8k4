import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  MessageSquareWarning,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Timer,
  X
} from 'lucide-react';
import { analyzeInterviewKeywords } from '../../store/useStudyGraphStore';
import { ModuleId, StoryScrollRequest } from '../../types/graph';
import {
  InterviewDraftRecord,
  InterviewQuestion
} from '../../types/study';

interface InterviewDefenseTabProps {
  questions: InterviewQuestion[];
  selectedModule: ModuleId | 'all';
  bookmarks: string[];
  interviewDrafts: Record<string, InterviewDraftRecord>;
  focusRequest?: StoryScrollRequest | null;
  onConsumeFocusRequest?: () => void;
  onToggleBookmark: (questionId: string) => void;
  onSaveDraft: (
    questionId: string,
    mainAnswer: string,
    followUpAnswer: string,
    requiredKeywords: string[]
  ) => InterviewDraftRecord;
  onCreateQuestion: (
    moduleId: ModuleId,
    item: InterviewQuestion
  ) => Promise<void>;
  onJumpToConceptContext: (nodeId: string) => void;
  onOpenTextbookPassage: (nodeId: string) => void;
}

const DEFAULT_TIMER_SECONDS = 90;
const WARNING_THRESHOLD_SECONDS = 20;
const SCROLL_FOCUS_DELAY_MS = 60;
const SCRIPT_TAB_ORDER: Array<'main' | 'followup'> = ['main', 'followup'];

export const InterviewDefenseTab: React.FC<InterviewDefenseTabProps> = ({
  questions,
  selectedModule,
  bookmarks,
  interviewDrafts,
  focusRequest = null,
  onConsumeFocusRequest,
  onToggleBookmark,
  onSaveDraft,
  onCreateQuestion,
  onJumpToConceptContext,
  onOpenTextbookPassage
}) => {
  const baseId = useId();

  // 90초 실전 압박 타이머 상태
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_TIMER_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 각 문항별 로컬 입력 상태
  const [mainInputs, setMainInputs] = useState<Record<string, string>>({});
  const [followUpInputs, setFollowUpInputs] = useState<Record<string, string>>(
    {}
  );
  const [showModelMap, setShowModelMap] = useState<Record<string, boolean>>({});
  const [mobileScriptTabMap, setMobileScriptTabMap] = useState<
    Record<string, 'main' | 'followup'>
  >({});
  const [savedToastId, setSavedToastId] = useState<string | null>(null);
  const scriptTabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {}
  );

  // 신규 문항 추가 폼
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModId, setNewModId] = useState<ModuleId>('mod1');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newFollowUpText, setNewFollowUpText] = useState('');
  const [newKeywordsText, setNewKeywordsText] = useState('');
  const [newModelAnswerText, setNewModelAnswerText] = useState('');

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const filteredQuestions = useMemo(() => {
    if (selectedModule === 'all') return questions;
    return questions.filter((q) => q.moduleId === selectedModule);
  }, [questions, selectedModule]);

  // 검색·그래프에서 특정 면접 문항 직행 시 해당 카드로 부드럽게 스크롤
  useEffect(() => {
    if (!focusRequest) return;
    const timer = window.setTimeout(() => {
      const targetEl = document.getElementById(
        `workspace-question-${focusRequest.nodeId}`
      );
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      onConsumeFocusRequest?.();
    }, SCROLL_FOCUS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [focusRequest, filteredQuestions.length, onConsumeFocusRequest]);

  const getMainAnswer = (qId: string) =>
    mainInputs[qId] !== undefined
      ? mainInputs[qId]
      : interviewDrafts[qId]?.mainAnswer ?? '';

  const getFollowUpAnswer = (qId: string) =>
    followUpInputs[qId] !== undefined
      ? followUpInputs[qId]
      : interviewDrafts[qId]?.followUpAnswer ?? '';

  const insertMissingKeyword = (qId: string, keyword: string) => {
    const current = getMainAnswer(qId);
    const next = current.trim()
      ? `${current.trim()} [${keyword}] `
      : `[${keyword}] `;
    setMainInputs((prev) => ({ ...prev, [qId]: next }));
  };

  const handleSave = (q: InterviewQuestion) => {
    const main = getMainAnswer(q.id);
    const follow = getFollowUpAnswer(q.id);
    onSaveDraft(q.id, main, follow, q.requiredKeywords);
    setSavedToastId(q.id);
    window.setTimeout(() => setSavedToastId(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    const kwList = newKeywordsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const item: InterviewQuestion = {
      id: `${newModId}-q-custom-${Date.now()}`,
      moduleId: newModId,
      question: newQuestionText.trim(),
      followUpQuestion:
        newFollowUpText.trim() || '이에 대한 구체적인 교실 처방 절차는 무엇입니까?',
      requiredKeywords: kwList.length > 0 ? kwList : ['과학자-실무자 모형'],
      modelAnswer:
        newModelAnswerText.trim() || '모범 구술 스크립트를 입력하세요.'
    };
    await onCreateQuestion(newModId, item);
    setNewQuestionText('');
    setNewFollowUpText('');
    setNewKeywordsText('');
    setNewModelAnswerText('');
    setShowAddForm(false);
  };

  const handleMobileScriptTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    qId: string,
    currentKey: 'main' | 'followup'
  ) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const nextKey: 'main' | 'followup' =
      currentKey === 'main' ? 'followup' : 'main';
    setMobileScriptTabMap((prev) => ({ ...prev, [qId]: nextKey }));
    scriptTabButtonRefs.current[`${qId}-${nextKey}`]?.focus();
  };

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(
    2,
    '0'
  )}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const timerRatio = Math.max(
    0,
    Math.min(1, secondsLeft / DEFAULT_TIMER_SECONDS)
  );

  return (
    <div className="space-y-5">
      {/* 상단 90초 압박 면접 타이머 & 컨트롤 바 */}
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-extrabold text-rose-900">
              <MessageSquareWarning className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>90초 구술 면접 훈련 ({filteredQuestions.length}개 문항)</span>
            </span>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900">
              실전 압박 면접 90초 타이머 &amp; 필수 학술 키워드 자동 채점기
            </h3>
            <p className="text-xs text-slate-600">
              필수 키워드 커버리지 <strong>80% 이상 달성 시 지식그래프 정점이 숙련 완료(Mastered)</strong>로 전환됩니다.
            </p>
          </div>

          {/* 90초 카운트다운 위젯 */}
          <div className="flex flex-wrap items-center gap-2.5 tabular-nums">
            <div
              className={`rounded-xl border px-4 py-2 flex items-center gap-2.5 ${
                secondsLeft === 0
                  ? 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse-twice'
                  : secondsLeft <= WARNING_THRESHOLD_SECONDS
                  ? 'bg-amber-950 border-amber-500/60 text-amber-200'
                  : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              <Timer
                className={`w-4 h-4 shrink-0 ${
                  secondsLeft <= WARNING_THRESHOLD_SECONDS
                    ? 'text-rose-400'
                    : 'text-indigo-400'
                }`}
              />
              <div>
                <div className="text-[10px] font-bold text-slate-400">
                  90초 구술 타이머
                </div>
                <div className="text-lg font-extrabold tracking-wider">
                  {formattedTime}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (secondsLeft === 0) {
                  setSecondsLeft(DEFAULT_TIMER_SECONDS);
                }
                setIsRunning((prev) => !prev);
              }}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold transition-colors ${
                isRunning
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 shrink-0" />
                  <span>일시정지</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>90초 구술 시작</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(DEFAULT_TIMER_SECONDS);
              }}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-900/[0.08] px-3 py-2 text-xs font-bold text-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>리셋</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-extrabold text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>면접 문항 추가</span>
            </button>
          </div>
        </div>

        {/* 타이머 GPU scaleX 진행 바 */}
        <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
          <div
            className={`gpu-progress-bar h-full w-full ${
              secondsLeft <= WARNING_THRESHOLD_SECONDS
                ? 'bg-rose-500'
                : 'bg-indigo-600'
            }`}
            style={{ transform: `scaleX(${timerRatio})` }}
          />
        </div>

        {/* 신규 면접 문항 추가 폼 */}
        {showAddForm && (
          <form
            onSubmit={handleCreateSubmit}
            className="rounded-xl bg-rose-50/70 border border-rose-200 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-950">
                + 새 압박 면접 문항 추가
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                aria-label="문항 추가 폼 닫기"
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
                className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-base sm:text-xs font-bold text-slate-800"
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
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="본 면접 질문"
                className="sm:col-span-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={newFollowUpText}
                onChange={(e) => setNewFollowUpText(e.target.value)}
                placeholder="압박 꼬리질문 (Follow-up Probe)"
                className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
              />
              <input
                type="text"
                value={newKeywordsText}
                onChange={(e) => setNewKeywordsText(e.target.value)}
                placeholder="필수 키워드 (쉼표로 구분)"
                className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-base sm:text-xs text-slate-900"
              />
            </div>
            <textarea
              rows={2}
              value={newModelAnswerText}
              onChange={(e) => setNewModelAnswerText(e.target.value)}
              placeholder="모범 답안 스크립트"
              className="w-full rounded-lg border border-rose-200 bg-white p-2.5 text-base sm:text-xs text-slate-900"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-extrabold text-white"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span>면접 문항 저장</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 문항 리스트 */}
      <div className="space-y-6">
        {filteredQuestions.map((q, idx) => {
          const mainText = getMainAnswer(q.id);
          const followText = getFollowUpAnswer(q.id);
          const combined = `${mainText} ${followText}`;
          const analysis = analyzeInterviewKeywords(
            combined,
            q.requiredKeywords
          );
          const isModelOpen = Boolean(showModelMap[q.id]);
          const activeMobileScriptTab = mobileScriptTabMap[q.id] ?? 'main';

          return (
            <article
              key={q.id}
              id={`workspace-question-${q.id}`}
              data-node-id={q.id}
              className="surface-card overflow-hidden scroll-mt-24"
            >
              {/* 상단 질문 헤더 */}
              <div className="bg-slate-50/90 border-b border-slate-900/[0.08] px-5 py-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 tabular-nums">
                    <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-extrabold text-white uppercase">
                      {q.moduleId.toUpperCase()} · Q{idx + 1}
                    </span>
                    <span
                      className={`rounded-md border px-2.5 py-0.5 text-xs font-extrabold ${
                        analysis.coveragePercent >= 80
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : analysis.coveragePercent >= 50
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : 'bg-rose-50 text-rose-900 border-rose-200'
                      }`}
                    >
                      키워드 충족률: {analysis.coveragePercent}% (
                      {analysis.matchedKeywords.length}/
                      {q.requiredKeywords.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onJumpToConceptContext(q.id)}
                      className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-xs font-extrabold text-white transition-colors"
                    >
                      <BookOpenCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>관련 개념학습 보기</span>
                    </button>

                    <button
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => onOpenTextbookPassage(q.id)}
                      className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 text-xs font-extrabold text-amber-950 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>원문 발췌</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleBookmark(q.id)}
                      aria-label="북마크"
                      className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg bg-white hover:bg-slate-100 border border-slate-900/[0.08] transition-colors"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          bookmarks.includes(q.id)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed [overflow-wrap:anywhere]">
                  Q. {q.question}
                </h4>

                <div className="rounded-xl bg-rose-50/90 border border-rose-200 p-3.5 space-y-1">
                  <span className="text-[11px] font-extrabold text-rose-700">
                    ↳ 압박 꼬리질문 (Follow-Up Probe)
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-rose-950 leading-relaxed [overflow-wrap:anywhere]">
                    “{q.followUpQuestion}”
                  </p>
                </div>
              </div>

              {/* 본문: 실시간 키워드 체크리스트 + 답변 작성 + 모범답안 */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="surface-subtle p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      루브릭 필수 학술 키워드 실시간 감지 (미충족 키워드 터치 시 답안에 자동 삽입):
                    </span>
                    <span className="text-xs font-extrabold text-indigo-700 tabular-nums">
                      {analysis.matchedKeywords.length} /{' '}
                      {q.requiredKeywords.length} 충족
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {q.requiredKeywords.map((kw) => {
                      const isMatched = analysis.matchedKeywords.includes(kw);
                      return (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => {
                            if (!isMatched) insertMissingKeyword(q.id, kw);
                          }}
                          className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-extrabold border transition-colors ${
                            isMatched
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isMatched ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span>{kw}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 모바일(< lg): 모범답안 상단 대조 + 1줄 본질문/꼬리질문 전환 */}
                <div className="lg:hidden space-y-3">
                  {isModelOpen && (
                    <div className="rounded-xl bg-slate-900 text-white p-3.5 space-y-1.5 border border-slate-800 max-h-[24dvh] overflow-y-auto overscroll-contain">
                      <span className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1.5 sticky top-0 bg-slate-900 pb-1">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>상하 동시 대조 · 과학자-실무자 모범 구술 답안</span>
                      </span>
                      <p className="text-xs text-slate-100 leading-relaxed [overflow-wrap:anywhere]">
                        {q.modelAnswer}
                      </p>
                    </div>
                  )}

                  <div
                    role="tablist"
                    aria-label="구술 답변 유형"
                    className="single-row-tablist gap-1 rounded-xl bg-slate-100 border border-slate-900/[0.08] p-1"
                  >
                    {SCRIPT_TAB_ORDER.map((tabKey) => {
                      const isSelected = activeMobileScriptTab === tabKey;
                      const tabDomId = `${baseId}-${q.id}-tab-${tabKey}`;
                      return (
                        <button
                          key={tabKey}
                          ref={(el) => {
                            scriptTabButtonRefs.current[`${q.id}-${tabKey}`] = el;
                          }}
                          id={tabDomId}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() =>
                            setMobileScriptTabMap((prev) => ({
                              ...prev,
                              [q.id]: tabKey
                            }))
                          }
                          onKeyDown={(e) =>
                            handleMobileScriptTabKeyDown(e, q.id, tabKey)
                          }
                          className={`no-press-scale flex-1 min-h-[36px] rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-colors ${
                            isSelected
                              ? tabKey === 'main'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tabKey === 'main'
                            ? '① 본 질문 스크립트'
                            : '② 꼬리질문 방어'}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    role="tabpanel"
                    aria-labelledby={`${baseId}-${q.id}-tab-${activeMobileScriptTab}`}
                  >
                    {activeMobileScriptTab === 'main' ? (
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`mobile-main-ans-${q.id}`}
                          className="text-xs font-extrabold text-slate-800 block"
                        >
                          ① 본 질문 구술 답변 스크립트
                        </label>
                        <textarea
                          id={`mobile-main-ans-${q.id}`}
                          rows={4}
                          value={mainText}
                          onChange={(e) =>
                            setMainInputs((prev) => ({
                              ...prev,
                              [q.id]: e.target.value
                            }))
                          }
                          placeholder="핵심 학술 키워드를 포함하여 본 질문에 대한 과학자-실무자 방어 논리를 서술하세요..."
                          className="w-full rounded-xl border border-slate-900/[0.08] bg-slate-50 p-3.5 text-base text-slate-900 focus:bg-white focus:border-indigo-500"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`mobile-follow-ans-${q.id}`}
                          className="text-xs font-extrabold text-rose-800 block"
                        >
                          ② 압박 꼬리질문 방어 스크립트
                        </label>
                        <textarea
                          id={`mobile-follow-ans-${q.id}`}
                          rows={4}
                          value={followText}
                          onChange={(e) =>
                            setFollowUpInputs((prev) => ({
                              ...prev,
                              [q.id]: e.target.value
                            }))
                          }
                          placeholder="면접관의 압박 꼬리질문에 대한 구체적인 교실·상담 처방 절차를 서술하세요..."
                          className="w-full rounded-xl border border-rose-200 bg-rose-50/30 p-3.5 text-base text-slate-900 focus:bg-white focus:border-rose-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 데스크톱(lg+): 본 질문 & 꼬리질문 좌우 2컬럼 동시 입력 */}
                <div className="hidden lg:grid lg:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`main-ans-${q.id}`}
                      className="text-xs font-extrabold text-slate-800 block"
                    >
                      ① 본 질문 구술 답변 스크립트
                    </label>
                    <textarea
                      id={`main-ans-${q.id}`}
                      rows={4}
                      value={mainText}
                      onChange={(e) =>
                        setMainInputs((prev) => ({
                          ...prev,
                          [q.id]: e.target.value
                        }))
                      }
                      placeholder="핵심 학술 키워드를 포함하여 본 질문에 대한 과학자-실무자 방어 논리를 서술하세요..."
                      className="w-full rounded-xl border border-slate-900/[0.08] bg-slate-50 p-3.5 text-base sm:text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={`follow-ans-${q.id}`}
                      className="text-xs font-extrabold text-rose-800 block"
                    >
                      ② 압박 꼬리질문 방어 스크립트
                    </label>
                    <textarea
                      id={`follow-ans-${q.id}`}
                      rows={4}
                      value={followText}
                      onChange={(e) =>
                        setFollowUpInputs((prev) => ({
                          ...prev,
                          [q.id]: e.target.value
                        }))
                      }
                      placeholder="면접관의 압박 꼬리질문에 대한 구체적인 교실·상담 처방 절차를 서술하세요..."
                      className="w-full rounded-xl border border-rose-200 bg-rose-50/30 p-3.5 text-base sm:text-xs text-slate-900 focus:bg-white focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* 하단 액션 바: 채점 저장 + 모범 답안 토글 */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setShowModelMap((prev) => ({
                        ...prev,
                        [q.id]: !prev[q.id]
                      }))
                    }
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-900/[0.08] px-3.5 py-2 text-xs font-extrabold text-slate-800 transition-colors"
                  >
                    {isModelOpen ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 shrink-0" />
                        <span>모범 구술 스크립트 숨기기</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span className="lg:hidden">
                          내 답안 위 상하 대조로 모범답안 열기
                        </span>
                        <span className="hidden lg:inline">
                          과학자-실무자 모범 구술 답안 비교
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {savedToastId === q.id && (
                      <span className="text-xs font-extrabold text-emerald-700">
                        채점 기록 및 지식그래프 동기화 완료
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSave(q)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-extrabold text-white shadow-xs transition-colors"
                    >
                      <Save className="w-3.5 h-3.5 shrink-0" />
                      <span>답변 저장 &amp; 키워드 채점 기록</span>
                    </button>
                  </div>
                </div>

                {isModelOpen && (
                  <div className="hidden lg:block rounded-xl bg-slate-900 text-white p-4 sm:p-5 space-y-2 border border-slate-800">
                    <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>과학자-실무자 모범 구술 답안 스크립트</span>
                    </span>
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed [overflow-wrap:anywhere]">
                      {q.modelAnswer}
                    </p>
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
