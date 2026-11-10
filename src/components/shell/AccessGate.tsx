import React, { useEffect, useState } from 'react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { isLocalRuntime } from '../../utils/assetUrl';

const ACCESS_STORAGE_KEY = 'edupsych_studio_access_sha256_v1';

// 기본 초대/접근 코드('edu-counsel-2027')의 SHA-256 해시 (평문 미노출)
const DEFAULT_EXPECTED_SHA256 =
  'a1d65f3ca33c1f909a9b981f121c0d86eb313d3f68ca24619cf45d707032c737';

const EXPECTED_SHA256 = (
  import.meta.env.VITE_ACCESS_SHA256 || DEFAULT_EXPECTED_SHA256
)
  .trim()
  .toLowerCase();

async function sha256Hex(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  const encoded = new TextEncoder().encode(normalized);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readInitialGateState(): {
  status: 'granted' | 'checking' | 'locked';
  urlKey: string | null;
} {
  if (typeof window === 'undefined') {
    return { status: 'locked', urlKey: null };
  }

  const params = new URLSearchParams(window.location.search);
  const forceLockPreview = params.get('lock') === '1';

  if (isLocalRuntime() && !forceLockPreview) {
    return { status: 'granted', urlKey: null };
  }

  try {
    const savedHash = window.localStorage.getItem(ACCESS_STORAGE_KEY);
    if (!forceLockPreview && savedHash === EXPECTED_SHA256) {
      return { status: 'granted', urlKey: null };
    }
  } catch {
    // ignore storage errors
  }

  const rawKey = params.get('key');
  if (rawKey && rawKey.trim().length > 0) {
    return { status: 'checking', urlKey: rawKey.trim() };
  }

  return { status: 'locked', urlKey: null };
}

interface AccessGateProps {
  children: React.ReactNode;
}

export const AccessGate: React.FC<AccessGateProps> = ({ children }) => {
  const [initial] = useState(readInitialGateState);
  const [status, setStatus] = useState<'granted' | 'checking' | 'locked'>(
    initial.status
  );
  const [codeInput, setCodeInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 초대 링크(?key=...) 자동 검증 및 주소창 토큰 정리
  useEffect(() => {
    if (initial.status !== 'checking' || !initial.urlKey) {
      return;
    }

    let active = true;
    (async () => {
      try {
        const digest = await sha256Hex(initial.urlKey!);
        if (!active) return;

        if (digest === EXPECTED_SHA256) {
          try {
            window.localStorage.setItem(ACCESS_STORAGE_KEY, EXPECTED_SHA256);
          } catch {
            // ignore quota errors
          }
          const cleanParams = new URLSearchParams(window.location.search);
          cleanParams.delete('key');
          cleanParams.delete('lock');
          const query = cleanParams.toString();
          const nextUrl = query
            ? `${window.location.pathname}?${query}`
            : window.location.pathname;
          window.history.replaceState(null, '', nextUrl);
          setStatus('granted');
        } else {
          setErrorMessage('초대 링크의 접근 코드가 유효하지 않습니다.');
          setStatus('locked');
        }
      } catch {
        if (active) {
          setStatus('locked');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const digest = await sha256Hex(codeInput);
      if (digest === EXPECTED_SHA256) {
        try {
          window.localStorage.setItem(ACCESS_STORAGE_KEY, EXPECTED_SHA256);
        } catch {
          // ignore storage errors
        }
        setStatus('granted');
      } else {
        setErrorMessage('접근 코드가 일치하지 않습니다. 공유받은 코드를 다시 확인해 주세요.');
      }
    } catch {
      setErrorMessage('브라우저 보안 모듈(Web Crypto)을 사용할 수 없습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'granted') {
    return <>{children}</>;
  }

  if (status === 'checking') {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-canvas)] flex items-center justify-center p-4">
        <div className="surface-card p-6 max-w-sm w-full text-center space-y-2">
          <p className="text-sm font-bold text-slate-900">
            초대 링크 권한을 확인하고 있습니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-canvas)] text-[var(--ink-primary)] flex items-center justify-center p-4">
      <div className="surface-card p-6 sm:p-8 max-w-md w-full space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 text-xs font-extrabold text-indigo-900">
            <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>초대 전용 스터디 아카이브</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            교육심리학 스튜디오 접근 확인
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            이 웹앱은 초대 링크를 공유받은 사용자에게만 공개되어 있습니다. 전달받은 전용 초대 링크로 접속하거나 접근 코드를 입력해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="studio-access-code"
              className="block text-xs font-extrabold text-slate-800"
            >
              접근 코드 (Access Code)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="studio-access-code"
                type="password"
                autoComplete="current-password"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={
                  errorMessage ? 'studio-access-error' : 'studio-access-hint'
                }
                placeholder="공유받은 접근 코드 입력"
                className="w-full rounded-xl bg-slate-50 border border-slate-900/[0.12] pl-10 pr-4 py-2.5 text-base sm:text-sm text-slate-900 focus:bg-white focus:border-indigo-500"
              />
            </div>
            {errorMessage ? (
              <p
                id="studio-access-error"
                role="alert"
                className="text-xs font-bold text-rose-600"
              >
                {errorMessage}
              </p>
            ) : (
              <p id="studio-access-hint" className="text-xs text-slate-500">
                최초 1회 인증 후에는 현재 모바일·데스크톱 브라우저에 인증 상태가 자동 유지됩니다.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !codeInput.trim()}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-extrabold text-white transition-colors"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{isSubmitting ? '확인 중...' : '스튜디오 입장하기'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
