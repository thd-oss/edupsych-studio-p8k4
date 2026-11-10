/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACCESS_SHA256?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv & {
    readonly BASE_URL: string;
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
  };
}
