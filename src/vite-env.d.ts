/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_LLM_AVAILABLE: string
  readonly VITE_WEBSOCKET_URL: string
  readonly VITE_AGENT_ENDPOINT: string
  readonly VITE_DATABASE_PATH: string
  readonly VITE_DEBUG_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}