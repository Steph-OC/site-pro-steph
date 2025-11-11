/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly WP_URL: string;
  readonly VITE_WP_DISABLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
