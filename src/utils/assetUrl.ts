/**
 * 서브경로(GitHub Pages 등) 배포 환경과 로컬 루트 환경을 모두 지원하기 위한 정적 에셋 경로 리졸버
 */
export function resolveAssetUrl(assetPath: string): string {
  const cleanPath = assetPath.replace(/^\/+/, '');
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${cleanPath}`;
}

/**
 * 로컬 Node/Vite API 서버 실행 환경 여부 판별
 */
export function isLocalRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}
