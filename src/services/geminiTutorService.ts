import {
  GeminiTutorModelId,
  NormalizedTutorApiError,
  TutorChatMessage,
  TutorCoverageStatus,
  TutorPassOneSchemaPayload,
  TutorPassTwoSchemaPayload,
  TutorStructuredAnswer,
  WebCitationItem
} from '../types/aiTutor';
import { KnowledgeGraphEdge } from '../types/graph';
import {
  IndexedCorpusDocument,
  resolveTextbookCitations,
  retrieveTextbookPassages
} from './textbookRetriever';

export const GEMINI_API_KEY_STORAGE_KEY = 'edupsych_gemini_api_key_v1';
export const GEMINI_MODEL_STORAGE_KEY = 'edupsych_gemini_model_v1';
export const DEFAULT_GEMINI_TUTOR_MODEL: GeminiTutorModelId = 'gemini-3.8-flash';

const MAX_RECENT_HISTORY_TURNS = 4;
const MAX_WEB_SOURCES_DISPLAY = 5;
const MAX_KEY_ACADEMIC_POINTS = 4;
const KEY_PING_MAX_OUTPUT_TOKENS = 8;

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const HTTP_TOO_MANY_REQUESTS = 429;

export const GEMINI_TUTOR_MODEL_OPTIONS: Array<{
  id: GeminiTutorModelId;
  label: string;
  description: string;
}> = [
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash (권장)',
    description: '빠른 응답 속도와 정교한 교재 근거 판별·외부 검색 결합'
  },
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash-Lite (초고속)',
    description: '단답형 학술 용어 뜻풀이에 최적화된 경량 모델'
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon (심층 추론)',
    description: '복합 이론 비교 및 압박 면접 방어 논리 정교화'
  }
];

export class TutorServiceError extends Error {
  public readonly normalized: NormalizedTutorApiError;

  constructor(normalized: NormalizedTutorApiError) {
    super(`${normalized.titleKo}: ${normalized.messageKo}`);
    this.name = 'TutorServiceError';
    this.normalized = normalized;
  }
}

interface GoogleRpcErrorDetail {
  '@type'?: string;
  reason?: string;
  domain?: string;
  metadata?: Record<string, string>;
}

interface GoogleRpcErrorBody {
  code?: number;
  message?: string;
  status?: string;
  details?: GoogleRpcErrorDetail[];
}

export function sanitizeGeminiApiKey(raw: string): string {
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^['"`]+|['"`]+$/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function extractRpcErrorEnvelope(rawBody: unknown): GoogleRpcErrorBody | null {
  if (!rawBody) return null;

  let parsed: unknown = rawBody;
  if (typeof rawBody === 'string') {
    const trimmed = rawBody.trim();
    if (!trimmed) return null;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  // Google /v1beta/interactions 엔드포인트는 오류를 최상위 JSON 배열 [{ error: {...} }]로 반환함
  if (Array.isArray(parsed) && parsed.length > 0) {
    const first = parsed[0] as { error?: GoogleRpcErrorBody } | undefined;
    if (first && typeof first === 'object' && first.error) {
      return first.error;
    }
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as {
      error?: GoogleRpcErrorBody | string;
      errorBody?: unknown;
    };
    if (obj.errorBody) {
      const nested = extractRpcErrorEnvelope(obj.errorBody);
      if (nested) return nested;
    }
    if (obj.error && typeof obj.error === 'object') {
      return obj.error;
    }
  }

  return null;
}

export function normalizeGeminiApiError(err: unknown): NormalizedTutorApiError {
  if (err instanceof TutorServiceError) {
    return err.normalized;
  }

  const sdkErr = err as {
    statusCode?: number;
    status?: number;
    body?: unknown;
    message?: string;
    name?: string;
  } | null;

  const rpcError = extractRpcErrorEnvelope(sdkErr?.body);
  const httpStatus =
    typeof rpcError?.code === 'number'
      ? rpcError.code
      : typeof sdkErr?.statusCode === 'number'
        ? sdkErr.statusCode
        : typeof sdkErr?.status === 'number'
          ? sdkErr.status
          : null;

  const rpcReason =
    rpcError?.details?.find((d) => typeof d.reason === 'string')?.reason ??
    rpcError?.status;
  const rpcMessage = (rpcError?.message ?? '').trim();
  const rawErrMessage =
    typeof sdkErr?.message === 'string' ? sdkErr.message.trim() : '';

  const combinedLower = `${rpcReason ?? ''} ${rpcMessage} ${rawErrMessage}`.toLowerCase();

  // 1. API 키 누락
  if (combinedLower.includes('키가 설정되지 않았습니다')) {
    return {
      code: 'API_KEY_MISSING',
      httpStatus,
      titleKo: 'Gemini API 키가 아직 등록되지 않았습니다',
      messageKo: '질문을 전송하려면 먼저 개인 Gemini API 키를 연결해야 합니다.',
      actionHintKo:
        '상단 [API 키 설정] 버튼을 눌러 Google AI Studio에서 발급한 키(AIza...)를 저장해 주세요.',
      requiresKeyReconfig: true,
      suggestLiteModel: false,
      rawReason: rpcReason
    };
  }

  // 2. 잘못되었거나 만료·오타가 포함된 API 키 (API_KEY_INVALID)
  if (
    rpcReason === 'API_KEY_INVALID' ||
    combinedLower.includes('api key not valid') ||
    combinedLower.includes('api_key_invalid') ||
    combinedLower.includes('api key expired') ||
    httpStatus === HTTP_UNAUTHORIZED
  ) {
    return {
      code: 'API_KEY_INVALID',
      httpStatus: httpStatus ?? HTTP_BAD_REQUEST,
      titleKo: '유효하지 않은 Gemini API 키입니다',
      messageKo:
        '현재 브라우저에 저장된 API 키가 오타·공백을 포함하고 있거나 Google AI Studio에서 비활성화·만료되었습니다.',
      actionHintKo:
        'Google AI Studio(aistudio.google.com/apikey)에서 새 API 키를 복사한 뒤 [API 키 설정]에 다시 저장해 주세요.',
      requiresKeyReconfig: true,
      suggestLiteModel: false,
      rawReason: rpcReason ?? 'API_KEY_INVALID'
    };
  }

  // 3. HTTP 리퍼러(웹사이트 도메인) 제한 또는 서비스 차단 (403 PERMISSION_DENIED)
  if (
    rpcReason === 'API_KEY_HTTP_REFERRER_BLOCKED' ||
    rpcReason === 'API_KEY_SERVICE_BLOCKED' ||
    combinedLower.includes('referer') ||
    combinedLower.includes('referrer') ||
    httpStatus === HTTP_FORBIDDEN
  ) {
    return {
      code: 'REFERRER_RESTRICTED',
      httpStatus: httpStatus ?? HTTP_FORBIDDEN,
      titleKo: 'API 키의 도메인(HTTP 리퍼러) 제한으로 차단되었습니다',
      messageKo:
        'Google Cloud / AI Studio에서 이 API 키에 웹사이트 제한이 설정되어 현재 도메인에서의 호출이 거부되었습니다.',
      actionHintKo:
        'API 키 설정에서 애플리케이션 제한을 [없음]으로 두거나 허용 웹사이트에 https://thd-oss.github.io/* 를 추가해 주세요.',
      requiresKeyReconfig: true,
      suggestLiteModel: false,
      rawReason: rpcReason
    };
  }

  // 4. 할당량 초과 / 분당 호출 한도 (429 RESOURCE_EXHAUSTED)
  if (
    httpStatus === HTTP_TOO_MANY_REQUESTS ||
    rpcError?.status === 'RESOURCE_EXHAUSTED' ||
    combinedLower.includes('quota') ||
    combinedLower.includes('rate limit') ||
    combinedLower.includes('resource_exhausted')
  ) {
    return {
      code: 'QUOTA_EXCEEDED',
      httpStatus: httpStatus ?? HTTP_TOO_MANY_REQUESTS,
      titleKo: 'API 호출 한도(할당량)를 초과했습니다',
      messageKo:
        '무료 티어 분당/일일 요청 한도에 도달했거나 선택한 모델의 잔여 쿼터가 부족합니다.',
      actionHintKo:
        '잠시 후 다시 질문하거나, [API 키 설정]에서 경량 모델(Gemini 3.5 Flash-Lite)로 전환해 보세요.',
      requiresKeyReconfig: false,
      suggestLiteModel: true,
      rawReason: rpcReason ?? rpcError?.status
    };
  }

  // 5. 네트워크 단절 / 오프라인 / CORS 차단
  if (
    combinedLower.includes('failed to fetch') ||
    combinedLower.includes('networkerror') ||
    combinedLower.includes('load failed')
  ) {
    return {
      code: 'NETWORK_ERROR',
      httpStatus: null,
      titleKo: '네트워크 연결을 확인할 수 없습니다',
      messageKo:
        '인터넷 연결이 불안정하거나 사내·학교 방화벽에서 Gemini API(generativelanguage.googleapis.com) 접속을 차단했습니다.',
      actionHintKo: 'Wi-Fi 또는 모바일 데이터 연결 상태를 확인한 뒤 다시 전송해 주세요.',
      requiresKeyReconfig: false,
      suggestLiteModel: false
    };
  }

  // 6. 모델 미지원 또는 요청 파라미터 오류 (400 / 404)
  if (
    httpStatus === HTTP_BAD_REQUEST ||
    httpStatus === HTTP_NOT_FOUND ||
    rpcError?.status === 'INVALID_ARGUMENT' ||
    rpcError?.status === 'NOT_FOUND'
  ) {
    const cleanServerDetail = rpcMessage
      ? ` (서버 상세: ${rpcMessage})`
      : '';
    return {
      code: 'MODEL_OR_PARAM_ERROR',
      httpStatus: httpStatus ?? HTTP_BAD_REQUEST,
      titleKo: 'AI 모델 요청 처리 중 형식 오류가 발생했습니다',
      messageKo: `선택한 모델 또는 API 키 권한에서 요청을 처리하지 못했습니다.${cleanServerDetail}`,
      actionHintKo:
        '[API 키 설정]에서 등록된 키가 정상인지 다시 확인하거나 기본 권장 모델(Gemini 3.8 Flash)로 전환해 보세요.',
      requiresKeyReconfig: true,
      suggestLiteModel: true,
      rawReason: rpcReason ?? rpcError?.status
    };
  }

  // 7. 기타 예외 (절대 빈 {"httpMeta":...} 문자열을 그대로 노출하지 않음)
  const sanitizedFallback =
    rpcMessage ||
    (rawErrMessage.includes('{"httpMeta"')
      ? 'Gemini API 서버에서 오류 응답이 반환되었습니다.'
      : rawErrMessage) ||
    '질문 처리 중 일시적인 오류가 발생했습니다.';

  return {
    code: 'UNKNOWN_API_ERROR',
    httpStatus,
    titleKo: 'AI 응답 생성에 실패했습니다',
    messageKo: sanitizedFallback,
    actionHintKo:
      '상단 [API 키 설정]에서 키 연결 상태를 점검한 뒤 다시 시도해 주세요.',
    requiresKeyReconfig: false,
    suggestLiteModel: false,
    rawReason: rpcReason
  };
}

const PASS_ONE_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    coverageStatus: {
      type: 'string',
      enum: [
        'TEXTBOOK_SUFFICIENT',
        'PARTIAL_NEEDS_SUPPLEMENT',
        'NOT_IN_TEXTBOOK'
      ],
      description:
        '교재 코퍼스만으로 답변이 충분하면 TEXTBOOK_SUFFICIENT, 핵심 개념은 있으나 세부 용어·학자·비교 보충이 불가피하면 PARTIAL_NEEDS_SUPPLEMENT, 수록 교재에 없는 개념이면 NOT_IN_TEXTBOOK'
    },
    termHeader: {
      type: 'object',
      properties: {
        termKo: {
          type: 'string',
          description: '질문 대상 핵심 한국어 학술 용어 또는 주제명'
        },
        termEn: {
          type: 'string',
          description: '대응하는 영문 학술 용어 (불명확 시 빈 문자열)'
        },
        oneLineDefinition: {
          type: 'string',
          description:
            '핵심 개념을 1문장으로 압축한 정의 (교재 미수록 시 교재 미수록 사실 명시)'
        }
      },
      required: ['termKo', 'termEn', 'oneLineDefinition']
    },
    textbookSection: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description:
            '오직 제공된 <TEXTBOOK_CORPUS>에 근거한 설명만 한국어로 서술. 교재 코퍼스에 없는 외부 지식을 절대 이 필드에 섞지 말 것. NOT_IN_TEXTBOOK인 경우 수록 교재(Woolfolk 13판 · Seifert & Sutton 90노드)에 직접 수록되지 않은 용어임을 명시하고, 가장 인접한 교재 내 개념이 있으면 그 연결점만 안내.'
        },
        citedNodeIds: {
          type: 'array',
          items: { type: 'string' },
          description:
            '실제 근거로 인용한 <PASSAGE nodeId="...">의 정확한 nodeId 배열 (근거가 없으면 빈 배열)'
        },
        interviewPoint: {
          type: ['string', 'null'],
          description:
            '교재 코퍼스에 근거한 학교상담 대학원 면접 적용 팁 1~2문장 (근거가 없으면 null)'
        }
      },
      required: ['summary', 'citedNodeIds', 'interviewPoint']
    },
    externalSearchDirective: {
      type: 'object',
      properties: {
        needed: {
          type: 'boolean',
          description:
            'coverageStatus가 TEXTBOOK_SUFFICIENT이면 반드시 false, PARTIAL_NEEDS_SUPPLEMENT 또는 NOT_IN_TEXTBOOK이면 반드시 true'
        },
        triggerReason: {
          type: 'string',
          description:
            '추가 외부 검색이 왜 불가피한지 사용자에게 투명하게 밝히는 1문장 사유 (불필요 시 빈 문자열)'
        },
        searchQuery: {
          type: 'string',
          description:
            'Google Search로 검증할 구체적인 교육심리·상담학 학술 검색어 (한/영 병기 권장, 불필요 시 빈 문자열)'
        }
      },
      required: ['needed', 'triggerReason', 'searchQuery']
    }
  },
  required: [
    'coverageStatus',
    'termHeader',
    'textbookSection',
    'externalSearchDirective'
  ]
};

const PASS_ONE_SYSTEM_INSTRUCTION = `당신은 학교상담·교육심리 대학원 입시 스튜디오(EduPsych Interactive Studio)의 '교재 우선 탐색 AI 튜터'입니다.
반드시 아래의 엄격한 스키마 원칙을 준수하여 JSON으로 응답하세요:

1. [교재 최우선 탐색 원칙]: 먼저 <TEXTBOOK_CORPUS>에 제공된 수록 교재 구절(Woolfolk 교육심리학 13판 · Seifert & Sutton 교육심리학 기반 90개 노드)만 정밀 대조하세요.
2. [외부 지식 혼입 절대 금지]: textbookSection.summary와 interviewPoint에는 오직 <TEXTBOOK_CORPUS>에서 직접 확인되는 명제만 작성하세요. 당신의 사전학습 지식이라도 <TEXTBOOK_CORPUS>에 적혀 있지 않다면 textbookSection에 절대 섞어 쓰지 마세요.
3. [충분성 3단계 판정]:
   - 질문한 용어/개념이 <TEXTBOOK_CORPUS>만으로 충분히 설명되면 coverageStatus = "TEXTBOOK_SUFFICIENT", externalSearchDirective.needed = false로 설정하세요.
   - 핵심 상위 이론은 교재에 있으나 질문한 세부 하위 용어·학자·최신 진단기준·비교 대상이 교재 구절에 빠져 있어 추가 검색이 불가피하면 coverageStatus = "PARTIAL_NEEDS_SUPPLEMENT", externalSearchDirective.needed = true로 설정하세요.
   - 질문한 용어가 <TEXTBOOK_CORPUS>와 직접 관련이 없거나 미수록 개념이면 coverageStatus = "NOT_IN_TEXTBOOK", externalSearchDirective.needed = true로 설정하고, textbookSection.summary에는 "현재 앱에 수록된 Woolfolk · Seifert & Sutton 핵심 코퍼스에는 직접 등장하지 않는 개념입니다."라고 투명하게 안내하세요.
4. citedNodeIds에는 실제로 참조한 <PASSAGE>의 정확한 nodeId 속성값만 기입하세요.`;

// Pass 2는 Google Search 도구와 JSON Schema 제약 디코딩 간 충돌(400 INVALID_ARGUMENT)을 원천 방지하기 위해
// 스키마 제약 없이 텍스트 계약(본문 단락 + '• ' 핵심 포인트 불릿)으로 응답받아 결정론적으로 파싱합니다.
const PASS_TWO_SYSTEM_INSTRUCTION = `당신은 교육심리학·상담심리학 전문 학술 연구 보조 AI입니다.
사용자의 질문 중 수록 교재 코퍼스만으로는 답변할 수 없어 불가피하게 요청된 보충 영역만 Google Search 도구를 사용해 검증된 학술·전문 자료 기반으로 한국어로 명쾌하게 보충하세요.
이미 1단계 교재 섹션에서 다룬 내용을 불필요하게 반복하지 말고, 반드시 아래 출력 형식을 지켜 작성하세요:

1. 첫 번째 단락(3~5문장): 교재에 빠져 있던 핵심 정의·대표 학자·진단/구분 기준을 자연스러운 줄글로 명확히 서술합니다(마크다운 제목 기호 # 사용 금지).
2. 줄바꿈 후 핵심 학술 포인트 2~3개를 각각 '• ' 기호로 시작하는 한 줄 요약 불릿으로 정리합니다.`;

interface RawInteractionStep {
  type?: string;
  content?: Array<{
    type?: string;
    text?: string;
    annotations?: Array<{
      type?: string;
      url?: string;
      title?: string;
    }>;
  }>;
}

interface RawInteractionResult {
  outputText: string;
  steps: RawInteractionStep[];
}

export function loadStoredGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return sanitizeGeminiApiKey(
      window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) ?? ''
    );
  } catch {
    return '';
  }
}

export function saveStoredGeminiApiKey(apiKey: string): string {
  const sanitized = sanitizeGeminiApiKey(apiKey);
  if (typeof window === 'undefined') return sanitized;
  try {
    if (sanitized) {
      window.localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, sanitized);
    } else {
      window.localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
  } catch {
    // storage quota or private mode fallback
  }
  return sanitized;
}

export function loadStoredGeminiModel(): GeminiTutorModelId {
  if (typeof window === 'undefined') return DEFAULT_GEMINI_TUTOR_MODEL;
  try {
    const raw = window.localStorage.getItem(GEMINI_MODEL_STORAGE_KEY);
    if (
      raw === 'gemini-3.8-flash' ||
      raw === 'gemini-3.5-flash-lite' ||
      raw === 'gemini-4-argon'
    ) {
      return raw;
    }
  } catch {
    // ignore storage read error
  }
  return DEFAULT_GEMINI_TUTOR_MODEL;
}

export function saveStoredGeminiModel(model: GeminiTutorModelId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model);
  } catch {
    // ignore storage write error
  }
}

export async function checkLocalServerAiStatus(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/ai/status', { method: 'GET' });
    if (!res.ok) return false;
    const data = (await res.json()) as { hasServerApiKey?: boolean };
    return Boolean(data.hasServerApiKey);
  } catch {
    return false;
  }
}

export async function verifyGeminiApiKeyConnection(params: {
  apiKey: string;
  model: GeminiTutorModelId;
}): Promise<{ ok: true } | { ok: false; error: NormalizedTutorApiError }> {
  const cleanKey = sanitizeGeminiApiKey(params.apiKey);
  if (!cleanKey) {
    return {
      ok: false,
      error: normalizeGeminiApiError(
        new Error('Gemini API 키가 설정되지 않았습니다.')
      )
    };
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: cleanKey });
    await client.interactions.create({
      model: params.model,
      input: 'ping',
      generation_config: {
        max_output_tokens: KEY_PING_MAX_OUTPUT_TOKENS
      },
      store: false
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: normalizeGeminiApiError(err)
    };
  }
}

async function executeProxyOrSdkInteraction(params: {
  apiKey: string;
  useServerProxy: boolean;
  model: GeminiTutorModelId;
  systemInstruction: string;
  input: string;
  schema: Record<string, unknown> | null;
  enableGoogleSearch: boolean;
}): Promise<RawInteractionResult> {
  const {
    apiKey,
    useServerProxy,
    model,
    systemInstruction,
    input,
    schema,
    enableGoogleSearch
  } = params;

  const cleanKey = sanitizeGeminiApiKey(apiKey);

  if (!cleanKey && useServerProxy) {
    let response: Response;
    try {
      response = await fetch('/api/ai/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          systemInstruction,
          input,
          schema,
          enableGoogleSearch
        })
      });
    } catch (netErr) {
      throw new TutorServiceError(normalizeGeminiApiError(netErr));
    }

    if (!response.ok) {
      const errPayload = (await response.json().catch(() => ({}))) as {
        error?: string;
        errorBody?: unknown;
        statusCode?: number;
      };
      throw new TutorServiceError(
        normalizeGeminiApiError({
          statusCode: errPayload.statusCode ?? response.status,
          body: errPayload.errorBody ?? errPayload,
          message:
            errPayload.error ||
            `로컬 AI 프록시 호출 실패 (HTTP ${response.status})`
        })
      );
    }
    return (await response.json()) as RawInteractionResult;
  }

  if (!cleanKey) {
    throw new TutorServiceError(
      normalizeGeminiApiError(
        new Error('Gemini API 키가 설정되지 않았습니다.')
      )
    );
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: cleanKey });
    const interaction = await client.interactions.create({
      model,
      system_instruction: systemInstruction,
      input,
      ...(enableGoogleSearch
        ? { tools: [{ type: 'google_search' as const }] }
        : {}),
      ...(schema
        ? {
            response_format: {
              type: 'text',
              mime_type: 'application/json',
              schema
            }
          }
        : {}),
      store: false
    });

    return {
      outputText: interaction.output_text ?? '',
      steps: (interaction.steps ?? []) as unknown as RawInteractionStep[]
    };
  } catch (sdkErr) {
    throw new TutorServiceError(normalizeGeminiApiError(sdkErr));
  }
}

async function runPassOneStructuredCall(params: {
  apiKey: string;
  useServerProxy: boolean;
  model: GeminiTutorModelId;
  input: string;
}): Promise<RawInteractionResult> {
  return executeProxyOrSdkInteraction({
    apiKey: params.apiKey,
    useServerProxy: params.useServerProxy,
    model: params.model,
    systemInstruction: PASS_ONE_SYSTEM_INSTRUCTION,
    input: params.input,
    schema: PASS_ONE_JSON_SCHEMA,
    enableGoogleSearch: false
  });
}

async function runPassTwoSearchGroundingCall(params: {
  apiKey: string;
  useServerProxy: boolean;
  model: GeminiTutorModelId;
  input: string;
}): Promise<RawInteractionResult> {
  return executeProxyOrSdkInteraction({
    apiKey: params.apiKey,
    useServerProxy: params.useServerProxy,
    model: params.model,
    systemInstruction: PASS_TWO_SYSTEM_INSTRUCTION,
    input: params.input,
    schema: null,
    enableGoogleSearch: true
  });
}

function parseJsonSafely<T>(rawText: string): T {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('AI 모델로부터 빈 응답이 반환되었습니다.');
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch && fencedMatch[1]) {
      return JSON.parse(fencedMatch[1].trim()) as T;
    }
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error('AI 구조화 스키마(JSON) 파싱에 실패했습니다.');
  }
}

function parseGroundedSupplementOutput(rawText: string): TutorPassTwoSchemaPayload {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      supplementBody: '외부 학술 검색 응답이 비어 있습니다.',
      keyAcademicPoints: []
    };
  }

  // 혹시 JSON 포맷으로 반환된 경우 하위 호환 파싱
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<TutorPassTwoSchemaPayload>;
      if (typeof parsed.supplementBody === 'string') {
        return {
          supplementBody: parsed.supplementBody.trim(),
          keyAcademicPoints: Array.isArray(parsed.keyAcademicPoints)
            ? parsed.keyAcademicPoints
                .map((s) => String(s).trim())
                .filter(Boolean)
                .slice(0, MAX_KEY_ACADEMIC_POINTS)
            : []
        };
      }
    } catch {
      // 텍스트 파서로 진행
    }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const paragraphLines: string[] = [];
  const bulletPoints: string[] = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^(?:[•\-*]|\d+[.)])\s+(.+)$/);
    if (bulletMatch && bulletMatch[1]) {
      const cleanedBullet = bulletMatch[1]
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .trim();
      if (cleanedBullet) {
        bulletPoints.push(cleanedBullet);
      }
    } else if (!line.startsWith('#')) {
      paragraphLines.push(line.replace(/\*\*([^*]+)\*\*/g, '$1').trim());
    }
  }

  const supplementBody =
    paragraphLines.join('\n\n').trim() ||
    bulletPoints.join(' ') ||
    trimmed;

  return {
    supplementBody,
    keyAcademicPoints: bulletPoints.slice(0, MAX_KEY_ACADEMIC_POINTS)
  };
}

function extractWebCitationsFromSteps(
  steps: RawInteractionStep[]
): WebCitationItem[] {
  const seenUrls = new Set<string>();
  const citations: WebCitationItem[] = [];

  for (const step of steps) {
    if (step.type !== 'model_output' || !Array.isArray(step.content)) {
      continue;
    }
    for (const block of step.content) {
      if (block.type !== 'text' || !Array.isArray(block.annotations)) {
        continue;
      }
      for (const annotation of block.annotations) {
        if (annotation.type !== 'url_citation' || !annotation.url) {
          continue;
        }
        const cleanUrl = annotation.url.trim();
        if (!cleanUrl || seenUrls.has(cleanUrl)) {
          continue;
        }
        seenUrls.add(cleanUrl);
        let fallbackHost = cleanUrl;
        try {
          fallbackHost = new URL(cleanUrl).hostname;
        } catch {
          // keep raw URL string if non-standard
        }
        citations.push({
          title: (annotation.title ?? '').trim() || fallbackHost,
          uri: cleanUrl
        });
        if (citations.length >= MAX_WEB_SOURCES_DISPLAY) {
          return citations;
        }
      }
    }
  }

  return citations;
}

function formatRecentConversationContext(history: TutorChatMessage[]): string {
  const recentCompleted = history
    .filter((m) => !m.isPending && !m.errorMessage)
    .slice(-MAX_RECENT_HISTORY_TURNS);

  if (recentCompleted.length === 0) {
    return '';
  }

  const lines = recentCompleted.map((msg) => {
    if (msg.role === 'user') {
      return `사용자 이전 질문: ${msg.questionText}`;
    }
    const prevSummary = msg.answer?.termHeader.oneLineDefinition ?? '';
    return `튜터 이전 요약(${msg.answer?.termHeader.termKo ?? ''}): ${prevSummary}`;
  });

  return `<RECENT_DIALOGUE>\n${lines.join('\n')}\n</RECENT_DIALOGUE>\n\n`;
}

export async function askTextbookFirstTutor(params: {
  question: string;
  activeNodeId: string | null;
  activeNodeTitle: string | null;
  corpusIndex: IndexedCorpusDocument[];
  edges: KnowledgeGraphEdge[];
  chatHistory: TutorChatMessage[];
  apiKey: string;
  useServerProxy: boolean;
  model: GeminiTutorModelId;
  onStageChange?: (stageLabel: string) => void;
}): Promise<TutorStructuredAnswer> {
  const {
    question,
    activeNodeId,
    activeNodeTitle,
    corpusIndex,
    edges,
    chatHistory,
    apiKey,
    useServerProxy,
    model,
    onStageChange
  } = params;

  onStageChange?.('① 수록 교재 코퍼스(Woolfolk · Seifert 90노드) 우선 탐색 중...');

  const retrieval = retrieveTextbookPassages({
    query: question,
    corpusIndex,
    edges,
    activeNodeId
  });

  onStageChange?.(
    retrieval.passages.length > 0
      ? `② 관련 교재 구절 ${retrieval.passages.length}건 대조 및 충분성 판정 중...`
      : '② 일치 교재 구절 없음 — 범위 판정 및 검색 질의 구성 중...'
  );

  const activeContextBanner = activeNodeId
    ? `<ACTIVE_VIEWING_NODE id="${activeNodeId}">${activeNodeTitle ?? activeNodeId}</ACTIVE_VIEWING_NODE>\n\n`
    : '';
  const historyBanner = formatRecentConversationContext(chatHistory);

  const passOnePrompt = [
    historyBanner,
    activeContextBanner,
    retrieval.formattedCorpusXml,
    `\n<USER_QUESTION>\n${question.trim()}\n</USER_QUESTION>`
  ].join('');

  const passOneRaw = await runPassOneStructuredCall({
    apiKey,
    useServerProxy,
    model,
    input: passOnePrompt
  });

  const passOneParsed = parseJsonSafely<TutorPassOneSchemaPayload>(
    passOneRaw.outputText
  );

  // 결정론적 가드: 로컬 역색인 매칭 점수가 0이고 추출 패시지가 비어 있으면 교재 충분 판정을 허용하지 않음
  let finalCoverageStatus: TutorCoverageStatus = passOneParsed.coverageStatus;
  let shouldRunExternalSearch = passOneParsed.externalSearchDirective.needed;

  if (
    retrieval.maxRelevanceScore === 0 &&
    retrieval.passages.length === 0 &&
    finalCoverageStatus === 'TEXTBOOK_SUFFICIENT'
  ) {
    finalCoverageStatus = 'NOT_IN_TEXTBOOK';
    shouldRunExternalSearch = true;
  }

  if (finalCoverageStatus === 'TEXTBOOK_SUFFICIENT') {
    shouldRunExternalSearch = false;
  } else {
    shouldRunExternalSearch = true;
  }

  const resolvedCitations = resolveTextbookCitations(
    passOneParsed.textbookSection.citedNodeIds,
    corpusIndex
  );

  let externalSupplement: TutorStructuredAnswer['externalSupplement'] = null;

  if (shouldRunExternalSearch) {
    const effectiveSearchQuery =
      passOneParsed.externalSearchDirective.searchQuery.trim() ||
      `${question.trim()} 교육심리학 상담심리학 정의`;
    const effectiveTriggerReason =
      passOneParsed.externalSearchDirective.triggerReason.trim() ||
      (finalCoverageStatus === 'NOT_IN_TEXTBOOK'
        ? '수록된 Woolfolk 13판 · Seifert & Sutton 핵심 노드에 직접 수록되지 않은 용어이므로 학술 웹 검색을 통해 답변을 구성했습니다.'
        : '수록 교재의 핵심 개념을 바탕으로 하되, 질문하신 세부 맥락을 정확히 보완하기 위해 추가 검색을 수행했습니다.');

    onStageChange?.(
      '③ 교재 외 보충 필요 판정 — Google Search 학술 근거로 답변 보강 중...'
    );

    const passTwoInput = [
      `<USER_QUESTION>${question.trim()}</USER_QUESTION>`,
      `<TEXTBOOK_COVERAGE_STATUS>${finalCoverageStatus}</TEXTBOOK_COVERAGE_STATUS>`,
      `<TEXTBOOK_ALREADY_COVERED>${passOneParsed.textbookSection.summary}</TEXTBOOK_ALREADY_COVERED>`,
      `<TARGET_SEARCH_QUERY>${effectiveSearchQuery}</TARGET_SEARCH_QUERY>`,
      `위 검색어와 질문을 바탕으로, 교재에 없거나 부족한 부분만 검증된 학술 정의·특징 위주로 명확히 보충해 주세요.`
    ].join('\n\n');

    const passTwoRaw = await runPassTwoSearchGroundingCall({
      apiKey,
      useServerProxy,
      model,
      input: passTwoInput
    });

    const passTwoParsed = parseGroundedSupplementOutput(passTwoRaw.outputText);
    const webSources = extractWebCitationsFromSteps(passTwoRaw.steps);

    externalSupplement = {
      triggerReason: effectiveTriggerReason,
      searchQuery: effectiveSearchQuery,
      supplementBody: passTwoParsed.supplementBody,
      keyAcademicPoints: passTwoParsed.keyAcademicPoints,
      webSources
    };
  }

  return {
    coverageStatus: finalCoverageStatus,
    termHeader: passOneParsed.termHeader,
    textbookSection: {
      summary: passOneParsed.textbookSection.summary,
      citations: resolvedCitations,
      interviewPoint: passOneParsed.textbookSection.interviewPoint
    },
    externalSupplement,
    retrievalMeta: {
      retrievedCount: retrieval.passages.length,
      maxRelevanceScore: retrieval.maxRelevanceScore,
      usedExternalSearch: shouldRunExternalSearch,
      modelId: model
    }
  };
}
