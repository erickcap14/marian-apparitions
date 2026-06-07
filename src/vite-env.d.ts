/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  // 'true' in the public static build; absent/anything else for the private LAN build.
  readonly VITE_PUBLIC_BUILD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
