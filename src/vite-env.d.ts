/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Reserved for future VITE_-prefixed client env vars.
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
