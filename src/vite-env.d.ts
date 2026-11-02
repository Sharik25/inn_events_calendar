/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" in the Playwright build: show the support button's placeholder (see SupportLink). */
  readonly VITE_SUPPORT_PREVIEW?: string;
}
