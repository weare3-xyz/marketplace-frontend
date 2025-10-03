/// <reference types="vite/client" />

import type { Buffer as BufferType } from 'buffer'

declare global {
  interface Window {
    Buffer: typeof BufferType
  }
}

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID: string
  readonly VITE_BICONOMY_MEE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
