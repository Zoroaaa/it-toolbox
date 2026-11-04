import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zhCN from './locales/zh-CN.json'

const resources = {
  'zh-CN': { translation: zhCN },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'en-US'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'it-toolbox-language',
      caches: ['localStorage'],
    },
  })

export default i18n

const loaded = new Set<string>(['zh-CN'])

/**
 * 英文词典按需加载；中文作为默认语言直接内置，避免首屏多一次请求。
 */
export async function ensureLanguage(language: string): Promise<'zh-CN' | 'en-US'> {
  const code = language.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN'
  if (loaded.has(code)) return code

  const module = await import('./locales/en-US.json')
  i18n.addResourceBundle(code, 'translation', module.default, true, true)
  loaded.add(code)
  return code
}

export const LANGUAGES = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']
