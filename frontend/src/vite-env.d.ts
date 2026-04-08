/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Public site origin, no trailing slash (e.g. https://enarmx.com.mx) */
  readonly VITE_SITE_URL?: string;
  /** Brand name for shares and UI (default ENARMX) */
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
