/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  glob<T = unknown>(pattern: string | string[]): Record<string, () => Promise<T>>
  /** 同步聚合：模块初始化时直接拿到导出（如 registry 汇总各工具 meta） */
  glob<T = unknown>(pattern: string | string[], options: { eager: true }): Record<string, T>
}
