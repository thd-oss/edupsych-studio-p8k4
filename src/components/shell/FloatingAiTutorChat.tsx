import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  Globe,
  KeyRound,
  Loader2,
  MessageCircleQuestion,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import {
  askTextbookFirstTutor,
  checkLocalServerAiStatus,
  GEMINI_TUTOR_MODEL_OPTIONS,
  loadStoredGeminiApiKey,
  loadStoredGeminiModel,
  normalizeGeminiApiError,
  sanitizeGeminiApiKey,
  saveStoredGeminiApiKey,
  saveStoredGeminiModel,
  verifyGeminiApiKeyConnection
} from '../../services/geminiTutorService';
import { buildCorpusIndex } from '../../services/textbookRetriever';
import {
  ApiKeyConnectionState,
  GeminiTutorModelId,
  NormalizedTutorApiError,
  TutorChatMessage,
  TutorCoverageStatus
} from '../../types/aiTutor';
import { KnowledgeGraphEdge, KnowledgeGraphNode } from '../../types/graph';
import { ModulePayload } from '../../types/study';

interface FloatingAiTutorChatProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  mobileTriggerRef: React.RefObject<HTMLButtonElement>;
  modules: ModulePayload[];
  edges: KnowledgeGraphEdge[];
  nodeMap: Record<string, KnowledgeGraphNode>;
  activeNodeId: string | null;
  isServerConnected: boolean;
  onInspectNode: (nodeId: string) => void;
}

const MOBILE_MEDIA_QUERY = '(max-width: 1023px)';
const IME_PROCESS_KEYCODE = 229;
const IME_COMPOSITION_GUARD_WINDOW_MS = 50;
const TAIL_MIN_INSET_PX = 30;
const EXIT_ANIMATION_SAFETY_TIMEOUT_MS = 340;
const NOTICE_AUTOHIDE_MS = 3200;
const CHAT_HISTORY_STORAGE_KEY = 'edupsych_ai_tutor_history_v1';
const MAX_PERSISTED_MESSAGES = 24;

const COVERAGE_BADGE_META: Record<
  TutorCoverageStatus,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  TEXTBOOK_SUFFICIENT: {
    label: '교재 탐색 완료 · 100% 수록 교재 근거',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-500'
  },
  PARTIAL_NEEDS_SUPPLEMENT: {
    label: '1차 교재 탐색 + 부족 맥락 추가 검색 보충',
    badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    dotClass: 'bg-indigo-500'
  },
  NOT_IN_TEXTBOOK: {
    label: '수록 교재 미등장 · 외부 학술 검색 구성',
    badgeClass: 'bg-amber-50 text-amber-950 border-amber-300',
    dotClass: 'bg-amber-500'
  }
};

function sanitizeLegacyHistoryMessage(msg: TutorChatMessage): TutorChatMessage {
  if (
    msg.errorMessage &&
    !msg.errorDetail &&
    msg.errorMessage.includes('{"httpMeta"')
  ) {
    const fallbackDetail: NormalizedTutorApiError = {
      code: 'MODEL_OR_PARAM_ERROR',
      httpStatus: 400,
      titleKo: '이전 요청에서 API 오류가 발생했습니다',
      messageKo:
        '저장된 API 키가 유효하지 않거나 이전 요청 형식 충돌이 있었습니다.',
      actionHintKo:
        '상단 [API 키 설정]에서 키 연결을 검증한 뒤 다시 질문해 주세요.',
      requiresKeyReconfig: true,
      suggestLiteModel: false
    };
    return {
      ...msg,
      errorMessage: fallbackDetail.messageKo,
      errorDetail: fallbackDetail
    };
  }
  return msg;
}

function loadInitialHistory(): TutorChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TutorChatMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => !m.isPending)
      .slice(-MAX_PERSISTED_MESSAGES)
      .map(sanitizeLegacyHistoryMessage);
  } catch {
    return [];
  }
}

export const FloatingAiTutorChat: React.FC<FloatingAiTutorChatProps> = ({
  isOpen,
  onToggleOpen,
  onClose,
  mobileTriggerRef,
  modules,
  edges,
  nodeMap,
  activeNodeId,
  isServerConnected,
  onInspectNode
}) => {
  const headingId = useId();
  const inputId = useId();
  const apiKeyInputId = useId();
  const modelSelectId = useId();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const desktopTriggerRef = useRef<HTMLButtonElement>(null);
  const closeGenerationRef = useRef<number>(0);
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollListRef = useRef<HTMLDivElement | null>(null);
  const lastCompositionEndAtRef = useRef<number | null>(null);

  const [apiKey, setApiKey] = useState<string>(() => loadStoredGeminiApiKey());
  const [draftApiKey, setDraftApiKey] = useState<string>(() =>
    loadStoredGeminiApiKey()
  );
  const [selectedModel, setSelectedModel] = useState<GeminiTutorModelId>(() =>
    loadStoredGeminiModel()
  );
  const [hasServerApiKey, setHasServerApiKey] = useState<boolean>(false);
  const [keyConnectionState, setKeyConnectionState] =
    useState<ApiKeyConnectionState>(() =>
      loadStoredGeminiApiKey() ? 'verified' : 'unconfigured'
    );
  const [keyValidationError, setKeyValidationError] =
    useState<NormalizedTutorApiError | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [keySavedNotice, setKeySavedNotice] = useState<string | null>(null);

  const [questionInput, setQuestionInput] = useState<string>('');
  const [messages, setMessages] = useState<TutorChatMessage[]>(() =>
    loadInitialHistory()
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const corpusIndex = useMemo(
    () => buildCorpusIndex(modules, edges),
    [modules, edges]
  );

  const activeNode = activeNodeId ? nodeMap[activeNodeId] ?? null : null;
  const isReadyToAsk =
    (Boolean(apiKey.trim()) && keyConnectionState !== 'invalid') ||
    hasServerApiKey;

  useEffect(() => {
    if (!isServerConnected) {
      setHasServerApiKey(false);
      return;
    }
    let cancelled = false;
    void checkLocalServerAiStatus().then((ready) => {
      if (!cancelled) {
        setHasServerApiKey(ready);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isServerConnected]);

  // 키가 없거나 검증 실패 상태이면 채팅창 열릴 때 자동으로 설정 패널 펼침
  useEffect(() => {
    if (isOpen && (!isReadyToAsk || keyConnectionState === 'invalid')) {
      setIsSettingsOpen(true);
    }
  }, [isOpen, isReadyToAsk, keyConnectionState]);

  // 대화 이력 로컬 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const serializable = messages
        .filter((m) => !m.isPending)
        .slice(-MAX_PERSISTED_MESSAGES);
      window.localStorage.setItem(
        CHAT_HISTORY_STORAGE_KEY,
        JSON.stringify(serializable)
      );
    } catch {
      // ignore storage error
    }
  }, [messages]);

  // 새 메시지 도착 시 하단 자동 스크롤
  useEffect(() => {
    if (!isOpen) return;
    const container = scrollListRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isOpen]);

  // 현재 뷰포트의 활성 [AI 질문] 버튼 중심 좌표를 실측하여 말풍선 탄성 원점(--ai-origin-x/y)과 꼬리 위치(--ai-tail-x)를 동기화
  const syncBubbleOriginAndTail = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof window === 'undefined') return;

    const isMobileViewport = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
    const triggerEl = isMobileViewport
      ? mobileTriggerRef.current
      : desktopTriggerRef.current;
    if (!triggerEl) return;

    const dialogRect = dialog.getBoundingClientRect();
    const triggerRect = triggerEl.getBoundingClientRect();
    if (dialogRect.width <= 0 || triggerRect.width <= 0) return;

    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const triggerCenterY = triggerRect.top + triggerRect.height / 2;
    const originX = triggerCenterX - dialogRect.left;
    const originY = triggerCenterY - dialogRect.top;
    const tailCenterX = Math.max(
      TAIL_MIN_INSET_PX,
      Math.min(dialogRect.width - TAIL_MIN_INSET_PX, originX)
    );

    dialog.style.setProperty('--ai-origin-x', `${originX.toFixed(1)}px`);
    dialog.style.setProperty('--ai-origin-y', `${originY.toFixed(1)}px`);
    dialog.style.setProperty('--ai-tail-x', `${tailCenterX.toFixed(1)}px`);
  }, [mobileTriggerRef]);

  // 비모달 말풍선 <dialog> 열기/닫기: 등장 시 버튼 중심에서 스프링으로 튀어나오고, 닫을 때 data-closing + getAnimations()로 버튼 속으로 다시 수축 (iOS Safari/Firefox 완벽 호환)
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      closeGenerationRef.current += 1;
      dialog.removeAttribute('data-closing');
      if (!dialog.open) {
        dialog.show();
      }
      syncBubbleOriginAndTail();

      const isDesktopViewport =
        typeof window !== 'undefined' &&
        !window.matchMedia(MOBILE_MEDIA_QUERY).matches;
      if (isDesktopViewport && isReadyToAsk) {
        textareaRef.current?.focus();
      }
      return;
    }

    if (!dialog.open) {
      return;
    }

    const closeToken = ++closeGenerationRef.current;
    syncBubbleOriginAndTail();
    dialog.setAttribute('data-closing', '');

    const runAnimatedClose = async () => {
      const animations = dialog.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((anim) => anim.finished)),
          new Promise<void>((resolve) =>
            window.setTimeout(resolve, EXIT_ANIMATION_SAFETY_TIMEOUT_MS)
          )
        ]);
      }
      if (closeGenerationRef.current !== closeToken) {
        return;
      }
      dialog.removeAttribute('data-closing');
      if (dialog.open) {
        dialog.close();
      }
    };

    void runAnimatedClose();
  }, [isOpen, isReadyToAsk, syncBubbleOriginAndTail]);

  // 화면 회전·키보드 높이 변화 시에도 말풍선 꼬리가 [AI 질문] 버튼 정중앙을 가리키도록 실시간 보정
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const handleViewportUpdate = () => syncBubbleOriginAndTail();

    window.addEventListener('resize', handleViewportUpdate);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', handleViewportUpdate);
    return () => {
      window.removeEventListener('resize', handleViewportUpdate);
      vv?.removeEventListener('resize', handleViewportUpdate);
    };
  }, [isOpen, syncBubbleOriginAndTail]);

  // 비모달 말풍선 상태에서 다른 모달 드로어/검색창이 열려 있지 않을 때 Esc로 부드럽게 수축 종료
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('dialog:modal')) {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (keyConnectionState === 'validating') return;

    const cleanedKey = sanitizeGeminiApiKey(draftApiKey);
    setDraftApiKey(cleanedKey);
    saveStoredGeminiModel(selectedModel);
    setKeyValidationError(null);

    if (!cleanedKey) {
      saveStoredGeminiApiKey('');
      setApiKey('');
      setKeyConnectionState('unconfigured');
      setKeySavedNotice(
        hasServerApiKey
          ? '브라우저 키를 비우고 로컬 서버 키를 사용합니다.'
          : '저장된 API 키가 삭제되었습니다.'
      );
      if (hasServerApiKey) {
        setIsSettingsOpen(false);
      }
      window.setTimeout(() => setKeySavedNotice(null), NOTICE_AUTOHIDE_MS);
      return;
    }

    setKeyConnectionState('validating');
    const checkResult = await verifyGeminiApiKeyConnection({
      apiKey: cleanedKey,
      model: selectedModel
    });

    if (!checkResult.ok) {
      // 할당량 초과(429)인 경우 키 자체는 유효하므로 저장하되 경고만 표시
      if (checkResult.error.code === 'QUOTA_EXCEEDED') {
        saveStoredGeminiApiKey(cleanedKey);
        setApiKey(cleanedKey);
        setKeyConnectionState('verified');
        setKeySavedNotice(
          'API 키가 확인되었으나 현재 모델 호출 한도에 근접했습니다.'
        );
        setIsSettingsOpen(false);
        window.setTimeout(() => setKeySavedNotice(null), NOTICE_AUTOHIDE_MS);
        return;
      }

      setKeyConnectionState('invalid');
      setKeyValidationError(checkResult.error);
      return;
    }

    saveStoredGeminiApiKey(cleanedKey);
    setApiKey(cleanedKey);
    setKeyConnectionState('verified');
    setKeyValidationError(null);
    setKeySavedNotice('API 키 연결 검증 완료 · 기기 브라우저에만 안전하게 저장됨');
    setIsSettingsOpen(false);
    window.setTimeout(() => setKeySavedNotice(null), NOTICE_AUTOHIDE_MS);
  };

  const handleClearKey = () => {
    setDraftApiKey('');
    setApiKey('');
    setKeyConnectionState('unconfigured');
    setKeyValidationError(null);
    saveStoredGeminiApiKey('');
    setKeySavedNotice('기기 브라우저에서 API 키가 삭제되었습니다.');
    window.setTimeout(() => setKeySavedNotice(null), NOTICE_AUTOHIDE_MS);
  };

  const submitQuestion = useCallback(
    async (rawText: string, overrideModel?: GeminiTutorModelId) => {
      const trimmed = rawText.trim();
      if (!trimmed || isSubmitting) return;

      const cleanKey = sanitizeGeminiApiKey(apiKey);
      if (!cleanKey && !hasServerApiKey) {
        setIsSettingsOpen(true);
        return;
      }

      const targetModel = overrideModel ?? selectedModel;
      const contextId = activeNode?.id ?? null;
      const contextTitle = activeNode?.titleKo ?? null;
      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `ai-${Date.now() + 1}`;
      const nowIso = new Date().toISOString();

      const userMessage: TutorChatMessage = {
        id: userMsgId,
        role: 'user',
        questionText: trimmed,
        contextNodeId: contextId,
        contextNodeTitle: contextTitle,
        createdAt: nowIso
      };

      const pendingAssistant: TutorChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        questionText: trimmed,
        contextNodeId: contextId,
        contextNodeTitle: contextTitle,
        isPending: true,
        pendingStageLabel:
          '① 수록 교재 코퍼스(Woolfolk · Seifert 90노드) 우선 탐색 중...',
        createdAt: nowIso
      };

      setQuestionInput('');
      setIsSubmitting(true);
      setMessages((prev) => [...prev, userMessage, pendingAssistant]);

      try {
        const structuredAnswer = await askTextbookFirstTutor({
          question: trimmed,
          activeNodeId: contextId,
          activeNodeTitle: contextTitle,
          corpusIndex,
          edges,
          chatHistory: messages,
          apiKey: cleanKey,
          useServerProxy: !cleanKey && hasServerApiKey,
          model: targetModel,
          onStageChange: (stageLabel) => {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantMsgId
                  ? { ...item, pendingStageLabel: stageLabel }
                  : item
              )
            );
          }
        });

        if (cleanKey) {
          setKeyConnectionState('verified');
          setKeyValidationError(null);
        }

        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantMsgId
              ? {
                  ...item,
                  isPending: false,
                  pendingStageLabel: undefined,
                  answer: structuredAnswer
                }
              : item
          )
        );
      } catch (err) {
        const normalizedErr = normalizeGeminiApiError(err);
        if (
          normalizedErr.code === 'API_KEY_INVALID' ||
          normalizedErr.code === 'REFERRER_RESTRICTED'
        ) {
          setKeyConnectionState('invalid');
          setKeyValidationError(normalizedErr);
        }

        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantMsgId
              ? {
                  ...item,
                  isPending: false,
                  pendingStageLabel: undefined,
                  errorMessage: normalizedErr.messageKo,
                  errorDetail: normalizedErr
                }
              : item
          )
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      activeNode,
      apiKey,
      corpusIndex,
      edges,
      hasServerApiKey,
      isSubmitting,
      messages,
      selectedModel
    ]
  );

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitQuestion(questionInput);
  };

  // 한국어 IME 조합 안전 Enter 전송 (Modern Web Guidance: ime-safe-enter-submit)
  const handleTextareaKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      if (
        event.nativeEvent.isComposing ||
        event.nativeEvent.keyCode === IME_PROCESS_KEYCODE
      ) {
        return;
      }

      if (
        lastCompositionEndAtRef.current !== null &&
        Math.abs(event.timeStamp - lastCompositionEndAtRef.current) <
          IME_COMPOSITION_GUARD_WINDOW_MS
      ) {
        return;
      }

      formRef.current?.requestSubmit();
    }
  };

  const quickPrompts = useMemo(() => {
    if (activeNode) {
      return [
        {
          label: '현재 개념 핵심 요약',
          prompt: `지금 보고 있는 '${activeNode.titleKo}' 개념의 핵심 정의와 메커니즘을 교재 기준으로 쉽게 설명해줘.`
        },
        {
          label: '유사 용어 비교',
          prompt: `'${activeNode.titleKo}'와(과) 면접에서 가장 헷갈리기 쉬운 유사·대조 개념을 비교해줘.`
        },
        {
          label: '면접 방어 포인트',
          prompt: `'${activeNode.titleKo}' 개념이 학교상담 대학원 압박 면접에 나오면 어떤 논리로 방어해야 해?`
        }
      ];
    }
    return [
      {
        label: '동화 vs 조절',
        prompt: '피아제의 동화(Assimilation)와 조절(Accommodation)의 차이를 예시와 함께 설명해줘.'
      },
      {
        label: '비계설정과 용암',
        prompt: '비고츠키 비계설정(Scaffolding)에서 점진적 용암(Fading)이 왜 중요한지 알려줘.'
      },
      {
        label: '교재 외 용어 예시(DBT)',
        prompt: '청소년 자해·정서조절 상담에서 쓰이는 변증법적 행동치료(DBT)의 핵심 기법은 뭐야?'
      }
    ];
  }, [activeNode]);

  const statusButtonLabel =
    keyConnectionState === 'validating'
      ? '검증 중'
      : keyConnectionState === 'invalid'
        ? '키 재설정'
        : isReadyToAsk
          ? '키 검증됨'
          : 'API 키 설정';

  const statusButtonToneClass = isSettingsOpen
    ? 'bg-[#0071e3] text-white border-[#66b2ff]/60'
    : keyConnectionState === 'invalid'
      ? 'bg-rose-500/20 text-rose-200 border-rose-400/50 hover:bg-rose-500/30'
      : isReadyToAsk
        ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25'
        : 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30';

  return (
    <>
      {/* 모바일에서 현재 열람 페이지를 선명히 비춰주며 바깥 영역 탭 시 말풍선을 버튼 속으로 닫아주는 경량 베일 (하단 독 아래 레이어) */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`no-print print:hidden lg:hidden fixed inset-0 z-[35] bg-slate-950/15 transition-opacity duration-200 ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 데스크톱(lg+) 전용 우하단 플로팅 말풍선 런처 버튼 (모바일은 하단 독의 독립형 [AI 질문] 캡슐 사용) */}
      <button
        ref={desktopTriggerRef}
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        aria-label="교재 우선 탐색 AI 용어·개념 질문 말풍선 열기 (⌘J)"
        title="2-Hop 지식 그래프 기반 교재 우선 AI 질문 말풍선 (⌘J / Ctrl+J)"
        className={`no-print print:hidden hidden lg:inline-flex fixed bottom-5 right-6 z-40 min-h-[48px] items-center gap-2.5 rounded-full px-4.5 py-2.5 text-sm font-semibold shadow-[var(--shadow-elevated)] border transition-all active:scale-95 ${
          isOpen
            ? 'bg-white text-[#1d1d1f] border-black/10 shadow-[0_0_0_3px_rgba(0,113,227,0.32)]'
            : 'bg-[#1d1d1f] hover:bg-[#2c2c2e] text-white border-white/12'
        }`}
      >
        {isOpen ? (
          <>
            <X
              className="w-4 h-4 shrink-0 text-[var(--accent-solid)]"
              aria-hidden="true"
            />
            <span>AI 말풍선 접기</span>
          </>
        ) : (
          <>
            <Sparkles
              className="w-4 h-4 shrink-0 text-[#66b2ff]"
              aria-hidden="true"
            />
            <span>교재 AI 질문</span>
            <kbd className="rounded-full bg-white/12 border border-white/15 px-2 py-0.5 text-[10px] font-mono text-white/80">
              ⌘J
            </kbd>
          </>
        )}
      </button>

      {/* 비모달 말풍선 <dialog>: 현재 페이지 위에 가볍게 떠서 버튼으로부터 스프링 등장·수축 */}
      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        onClose={() => {
          if (dialogRef.current) {
            dialogRef.current.returnValue = '';
          }
          onClose();
        }}
        className="ai-tutor-dialog no-print print:hidden"
      >
        <div className="ai-tutor-bubble relative flex flex-col w-full h-full rounded-[24px] bg-white border border-black/[0.1] shadow-[var(--shadow-overlay)]">
          <div className="flex flex-col w-full h-full rounded-[23px] overflow-hidden bg-white text-[#1d1d1f]">
            {/* 상단 헤더 (모바일 390px에서도 제목 '교재 AI 질문'이 절대 잘리지 않는 2행 타이틀 + 고정 폭 우측 액션군) */}
            <div className="bg-[#1d1d1f] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-white/10 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-solid)] flex items-center justify-center shrink-0">
                    <MessageCircleQuestion
                      className="w-4 h-4 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2
                      id={headingId}
                      className="text-[13px] sm:text-sm font-bold tracking-tight text-white whitespace-nowrap leading-tight"
                    >
                      교재 AI 질문
                    </h2>
                    <p className="text-[10.5px] text-white/70 truncate leading-tight mt-0.5">
                      <span className="font-semibold text-[#66b2ff]">
                        2-Hop Graph-RAG
                      </span>
                      <span> · 90노드 우선 탐색</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMessages([])}
                      aria-label="대화 기록 비우기"
                      title="대화 기록 비우기"
                      className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen((prev) => !prev)}
                    aria-expanded={isSettingsOpen}
                    aria-label="Gemini API 키 및 모델 설정"
                    title="Gemini API 키 및 모델 설정"
                    className={`min-h-[34px] inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-bold border whitespace-nowrap ${statusButtonToneClass}`}
                  >
                    {keyConnectionState === 'validating' ? (
                      <Loader2
                        className="w-3.5 h-3.5 shrink-0 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Settings2
                        className="w-3.5 h-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span>{statusButtonLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="AI 질문창 닫기"
                    className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-slate-200"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {keySavedNotice && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 rounded-lg bg-emerald-950/90 border border-emerald-600/50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{keySavedNotice}</span>
                </div>
              )}
            </div>

            {/* 접이식 API 키 보관함 & 모델 설정 */}
            {isSettingsOpen && (
              <form
                onSubmit={(e) => void handleSaveSettings(e)}
                className="bg-slate-50 border-b border-slate-200 px-4 py-3 space-y-2.5 shrink-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-slate-700 leading-relaxed min-w-0">
                    <span className="font-extrabold text-slate-900 inline-flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>기기 전용 Gemini API 키 보관함</span>
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 korean-keep-all">
                      입력한 키는 공백·숨김문자를 자동 정제하여 실시간 연결 검증 후 현재
                      브라우저에만 안전하게 보관됩니다.
                    </p>
                  </div>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 rounded-md bg-white border border-slate-300 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 whitespace-nowrap"
                  >
                    <span>키 발급</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>

                {keyValidationError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-xs text-rose-950 space-y-1"
                  >
                    <div className="font-extrabold flex items-center gap-1.5 text-rose-800">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{keyValidationError.titleKo}</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed korean-keep-all">
                      {keyValidationError.messageKo}
                    </p>
                    <p className="text-[11px] font-semibold text-rose-800 korean-keep-all">
                      해결 방법: {keyValidationError.actionHintKo}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor={apiKeyInputId}
                    className="block text-[11px] font-bold text-slate-700 mb-1"
                  >
                    Gemini API Key
                  </label>
                  <input
                    id={apiKeyInputId}
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={draftApiKey}
                    onChange={(e) => {
                      setDraftApiKey(e.target.value);
                      if (keyValidationError) {
                        setKeyValidationError(null);
                      }
                    }}
                    placeholder={
                      hasServerApiKey
                        ? '로컬 서버 .env.local 키가 감지됨 (비워두면 서버 키 사용)'
                        : 'AIzaSy... 형식의 개인 Gemini API 키 입력'
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor={modelSelectId}
                    className="block text-[11px] font-bold text-slate-700 mb-1"
                  >
                    추론 모델 선택
                  </label>
                  <select
                    id={modelSelectId}
                    value={selectedModel}
                    onChange={(e) => {
                      const nextModel = e.target.value as GeminiTutorModelId;
                      setSelectedModel(nextModel);
                      saveStoredGeminiModel(nextModel);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    {GEMINI_TUTOR_MODEL_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label} — {opt.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-0.5">
                  {(apiKey || draftApiKey) && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      disabled={keyConnectionState === 'validating'}
                      className="min-h-[34px] rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      키 삭제
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={keyConnectionState === 'validating'}
                    className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 px-3.5 py-1 text-xs font-extrabold text-white"
                  >
                    {keyConnectionState === 'validating' ? (
                      <>
                        <Loader2
                          className="w-3.5 h-3.5 animate-spin shrink-0"
                          aria-hidden="true"
                        />
                        <span>키 연결 검증 중...</span>
                      </>
                    ) : (
                      <span>설정 저장 및 검증</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 현재 열람 노드 컨텍스트 & 원터치 빠른 질문 스트립 */}
            <div className="bg-slate-50/90 border-b border-slate-200 px-3.5 py-2 shrink-0 space-y-1.5">
              {activeNode && (
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-600 truncate">
                    현재 열람 맥락:{' '}
                    <strong className="font-extrabold text-indigo-800">
                      {activeNode.titleKo}
                    </strong>
                  </span>
                  <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800 whitespace-nowrap">
                    자동 연동됨
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {quickPrompts.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void submitQuestion(chip.prompt)}
                    className="shrink-0 min-h-[30px] rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-indigo-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 메시지 스크롤 영역 */}
            <div
              ref={scrollListRef}
              aria-live="polite"
              className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3.5 bg-slate-50/40"
            >
              {messages.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs text-slate-600 leading-relaxed">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-[13px]">
                    <BookOpenCheck
                      className="w-4 h-4 text-indigo-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span>궁금한 학술 용어나 개념을 바로 물어보세요</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-slate-600">
                    <li>
                      먼저 앱 내 <strong>Woolfolk 13판 · Seifert &amp; Sutton</strong>{' '}
                      90개 학습 노드 코퍼스를 정밀 탐색해 답변합니다.
                    </li>
                    <li>
                      교재만으로 충분하면 외부 웹 정보를 섞지 않고{' '}
                      <strong className="text-emerald-700">100% 교재 근거</strong>와
                      원문 카드 바로가기 칩을 제시합니다.
                    </li>
                    <li>
                      교재에 없는 파생 용어·세부 개념일 때만 불가피하게{' '}
                      <strong className="text-amber-800">Google 학술·웹 검색</strong>을
                      수행해 별도 보충 카드로 분리 표시합니다.
                    </li>
                  </ol>
                </div>
              ) : (
                messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[86%] rounded-2xl rounded-br-sm bg-slate-900 text-white px-3.5 py-2.5 text-xs leading-relaxed shadow-xs">
                          {msg.contextNodeTitle && (
                            <div className="text-[10px] font-semibold text-indigo-300 mb-1 truncate">
                              열람 중: {msg.contextNodeTitle}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.questionText}</p>
                        </div>
                      </div>
                    );
                  }

                  if (msg.isPending) {
                    return (
                      <div
                        key={msg.id}
                        className="rounded-2xl rounded-bl-sm border border-indigo-200 bg-indigo-50/70 px-3.5 py-3 text-xs text-indigo-950 flex items-center gap-2.5"
                      >
                        <Loader2
                          className="w-4 h-4 text-indigo-600 animate-spin shrink-0"
                          aria-hidden="true"
                        />
                        <span className="font-bold">
                          {msg.pendingStageLabel ?? '교재 코퍼스 탐색 중...'}
                        </span>
                      </div>
                    );
                  }

                  if (msg.errorMessage || msg.errorDetail) {
                    const detail = msg.errorDetail;
                    return (
                      <div
                        key={msg.id}
                        className="rounded-2xl rounded-bl-sm border border-rose-300 bg-rose-50 px-3.5 py-3 text-xs text-rose-950 space-y-2"
                      >
                        <div className="font-extrabold flex items-center gap-1.5 text-rose-800">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{detail?.titleKo ?? '응답 생성 실패'}</span>
                        </div>
                        <p className="leading-relaxed korean-keep-all">
                          {detail?.messageKo ?? msg.errorMessage}
                        </p>
                        {detail?.actionHintKo && (
                          <p className="rounded-lg bg-white/80 border border-rose-200 px-2.5 py-1.5 text-[11px] font-semibold text-rose-900 leading-relaxed korean-keep-all">
                            {detail.actionHintKo}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {(detail?.requiresKeyReconfig ?? true) && (
                            <button
                              type="button"
                              onClick={() => setIsSettingsOpen(true)}
                              className="inline-flex min-h-[30px] items-center gap-1 rounded-full bg-rose-700 hover:bg-rose-600 px-3 py-1 text-[11px] font-bold text-white"
                            >
                              <KeyRound className="w-3 h-3 shrink-0" />
                              <span>API 키 설정 열기</span>
                            </button>
                          )}
                          {detail?.suggestLiteModel &&
                            selectedModel !== 'gemini-3.5-flash-lite' && (
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                  setSelectedModel('gemini-3.5-flash-lite');
                                  saveStoredGeminiModel('gemini-3.5-flash-lite');
                                  void submitQuestion(
                                    msg.questionText,
                                    'gemini-3.5-flash-lite'
                                  );
                                }}
                                className="inline-flex min-h-[30px] items-center gap-1 rounded-full bg-white hover:bg-rose-100 border border-rose-300 px-3 py-1 text-[11px] font-bold text-rose-900 disabled:opacity-50"
                              >
                                <span>경량 모델(3.5 Flash-Lite)로 재시도</span>
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  }

                  if (!msg.answer) return null;

                  const { answer } = msg;
                  const badgeMeta = COVERAGE_BADGE_META[answer.coverageStatus];

                  return (
                    <article
                      key={msg.id}
                      className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white p-3.5 shadow-xs space-y-3 text-xs"
                    >
                      {/* 스키마 판정 상태 배지 */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-extrabold ${badgeMeta.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeMeta.dotClass}`}
                            aria-hidden="true"
                          />
                          <span>{badgeMeta.label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          교재매칭 {answer.retrievalMeta.retrievedCount}건
                        </span>
                      </div>

                      {/* 용어 헤더 요약 */}
                      <div className="border-b border-slate-100 pb-2.5">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {answer.termHeader.termKo}
                          </h3>
                          {answer.termHeader.termEn && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              {answer.termHeader.termEn}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-indigo-900 leading-snug">
                          {answer.termHeader.oneLineDefinition}
                        </p>
                      </div>

                      {/* [영역 A] 수록 교재 기반 핵심 답변 */}
                      <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800">
                          <BookOpenCheck
                            className="w-3.5 h-3.5 text-indigo-600 shrink-0"
                            aria-hidden="true"
                          />
                          <span>수록 교재 기반 설명 (Woolfolk · Seifert &amp; Sutton)</span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {answer.textbookSection.summary}
                        </p>

                        {answer.textbookSection.interviewPoint && (
                          <div className="rounded-lg bg-indigo-50/80 border border-indigo-200 px-2.5 py-2 text-[11.5px] text-indigo-950 leading-relaxed">
                            <strong className="font-extrabold">면접 연결 포인트: </strong>
                            {answer.textbookSection.interviewPoint}
                          </div>
                        )}

                        {answer.textbookSection.citations.length > 0 && (
                          <div className="pt-1 space-y-1">
                            <div className="text-[10.5px] font-bold text-slate-500">
                              인용된 앱 내 교재 노드 (터치하여 원문 열기)
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {answer.textbookSection.citations.map((cit) => (
                                <button
                                  key={cit.nodeId}
                                  type="button"
                                  onClick={() => onInspectNode(cit.nodeId)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white hover:bg-indigo-50 border border-indigo-200 px-2 py-1 text-[11px] font-bold text-indigo-800 text-left transition-colors"
                                >
                                  <span className="truncate max-w-[180px]">
                                    {cit.nodeTitle}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-normal shrink-0">
                                    · {cit.sourceMapping.split('/')[0].trim()}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* [영역 B] 불가피한 경우에만 분리 렌더링되는 추가 검색 보충 섹션 */}
                      {answer.externalSupplement && (
                        <div className="rounded-xl bg-amber-50/75 border border-amber-300/90 p-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-950">
                            <Globe
                              className="w-3.5 h-3.5 text-amber-700 shrink-0"
                              aria-hidden="true"
                            />
                            <span>교재 외 추가 검색 보충 (Google Search 검증)</span>
                          </div>

                          <p className="text-[11px] text-amber-900/90 bg-amber-100/70 rounded-md px-2 py-1 font-medium">
                            보충 사유: {answer.externalSupplement.triggerReason}
                          </p>

                          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                            {answer.externalSupplement.supplementBody}
                          </p>

                          {answer.externalSupplement.keyAcademicPoints.length > 0 && (
                            <ul className="list-disc list-inside space-y-1 text-[11.5px] text-slate-700">
                              {answer.externalSupplement.keyAcademicPoints.map(
                                (pt, idx) => (
                                  <li key={idx} className="leading-relaxed">
                                    {pt}
                                  </li>
                                )
                              )}
                            </ul>
                          )}

                          {answer.externalSupplement.webSources.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <div className="text-[10.5px] font-bold text-amber-900/80">
                                참고 외부 웹 출처
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {answer.externalSupplement.webSources.map((src) => (
                                  <a
                                    key={src.uri}
                                    href={src.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-md bg-white hover:bg-amber-50 border border-amber-300 px-2 py-0.5 text-[10.5px] font-semibold text-amber-950"
                                  >
                                    <span className="truncate max-w-[160px]">
                                      {src.title}
                                    </span>
                                    <ExternalLink
                                      className="w-2.5 h-2.5 shrink-0"
                                      aria-hidden="true"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>

            {/* 하단 질문 입력 폼 (IME-safe Enter 전송 + 명시적 Submit 버튼) */}
            <form
              ref={formRef}
              onSubmit={handleFormSubmit}
              className="bg-white border-t border-slate-200 px-3 py-2.5 shrink-0"
            >
              <div className="flex items-end gap-2">
                <label htmlFor={inputId} className="sr-only">
                  질문할 교육심리·상담 용어 또는 개념 입력
                </label>
                <textarea
                  ref={textareaRef}
                  id={inputId}
                  rows={1}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onCompositionEnd={(e) => {
                    lastCompositionEndAtRef.current = e.timeStamp;
                  }}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder={
                    isReadyToAsk
                      ? '궁금한 용어·개념 입력 (Enter 전송, Shift+Enter 줄바꿈)'
                      : '먼저 상단 [API 키 설정]에 개인 Gemini 키를 입력해 주세요'
                  }
                  className="ai-tutor-textarea flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 focus:bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !questionInput.trim()}
                  aria-label="질문 전송"
                  className="min-h-[42px] min-w-[44px] shrink-0 inline-flex items-center justify-center gap-1 rounded-full bg-[var(--accent-solid)] hover:bg-[var(--accent-solid-hover)] disabled:bg-slate-300 text-white px-3.5 py-2 text-xs font-bold transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 하단 [AI 질문] 런처 버튼을 정확히 가리키는 애플 팝오버 스타일 곡선 말풍선 꼬리(Pointer Tail) */}
          <svg
            aria-hidden="true"
            width="26"
            height="12"
            viewBox="0 0 26 12"
            style={{
              left: 'var(--ai-tail-x, calc(100% - 2.25rem))'
            }}
            className="pointer-events-none absolute -bottom-[11px] -translate-x-1/2 z-20 drop-shadow-[0_4px_5px_rgba(0,0,0,0.10)]"
          >
            <path
              d="M 0 0 L 26 0 L 26 1 C 22 1 19.5 3 16.2 8.2 Q 13 12.2 9.8 8.2 C 6.5 3 4 1 0 1 Z"
              fill="#ffffff"
            />
            <path
              d="M 0 1 C 4 1 6.5 3 9.8 8.2 Q 13 12.2 16.2 8.2 C 19.5 3 22 1 26 1"
              fill="none"
              stroke="rgba(0, 0, 0, 0.1)"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </dialog>
    </>
  );
};
