import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { LANGUAGES, ensureLanguage, type LanguageCode } from '@/i18n'

export function LanguageToggle() {
  const { i18n, t } = useTranslation()

  const handleLanguageChange = async (code: LanguageCode) => {
    await ensureLanguage(code)
    await i18n.changeLanguage(code)
    localStorage.setItem('it-toolbox-language', code)
    document.documentElement.lang = code
  }

  return (
    <div className="relative group">
      <button
        className="flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-raised transition-colors"
        aria-label={t('language.title')}
      >
        <Globe className="w-5 h-5" />
      </button>
      <div className="absolute right-0 top-full mt-1 py-1 bg-bg-surface border border-border-base rounded-lg shadow-theme-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 min-w-[120px] z-20">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full px-3 py-2 text-left text-sm transition-colors
              ${i18n.language === lang.code
                ? 'text-accent bg-accent/10'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'
              }`}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    </div>
  )
}
