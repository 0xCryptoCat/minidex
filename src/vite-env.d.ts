/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALLOW_NON_TELEGRAM?: string;
  readonly TELEGRAM_BOT_TOKEN?: string;
  readonly TELEGRAM_GROUP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
