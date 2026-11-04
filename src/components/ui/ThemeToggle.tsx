import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore, type ThemeMode } from '@/store/app'

export function ThemeToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const themeMode = useAppStore((s) => s.themeMode)
const resolvedTheme = useAppStore((s) => s.resolvedTheme)
const setThemeMode = useAppStore((s) => s.setThemeMode)
  const { t } = useTranslation()

  const themeOptions = [
    { value: 'light' as ThemeMode, label: t('theme.light'), icon: Sun },
    { value: 'dark' as ThemeMode, label: t('theme.dark'), icon: Moon },
    { value: 'system' as ThemeMode, label: t('theme.system'), icon: Monitor },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(!isOpen)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const currentIndex = themeOptions.findIndex(opt => opt.value === themeMode)
      const nextIndex = (currentIndex + 1) % themeOptions.length
      setThemeMode(themeOptions[nextIndex].value)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const currentIndex = themeOptions.findIndex(opt => opt.value === themeMode)
      const prevIndex = (currentIndex - 1 + themeOptions.length) % themeOptions.length
      setThemeMode(themeOptions[prevIndex].value)
    }
  }

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="theme-toggle-btn flex items-center gap-1"
        aria-label={t('theme.toggle')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="theme-menu"
      >
        <CurrentIcon className="w-5 h-5" aria-hidden="true" />
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id="theme-menu"
          role="listbox"
          aria-label={t('theme.select')}
          className="absolute right-0 mt-2 w-36 py-1 bg-bg-surface border border-border-base rounded-lg shadow-theme-lg animate-slide-up z-50"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon
            const isSelected = themeMode === option.value
            
            return (
              <button
                key={option.value}
                onClick={() => {
                  setThemeMode(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                           transition-colors duration-150
                           ${isSelected 
                             ? 'text-accent bg-accent/10' 
                             : 'text-text-secondary hover:text-text-primary hover:bg-bg-raised'
                           }`}
                role="option"
                aria-selected={isSelected}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{option.label}</span>
                {isSelected && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ThemeToggleSimple() {
  const themeMode = useAppStore((s) => s.themeMode)
const resolvedTheme = useAppStore((s) => s.resolvedTheme)
const setThemeMode = useAppStore((s) => s.setThemeMode)
  const { t } = useTranslation()

  const handleToggle = () => {
    if (themeMode === 'system') {
      setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setThemeMode(themeMode === 'dark' ? 'light' : 'dark')
    }
  }

  const Icon = resolvedTheme === 'dark' ? Moon : Sun
  const label = resolvedTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')

  return (
    <button
      onClick={handleToggle}
      className="theme-toggle-btn"
      aria-label={label}
      title={label}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
    </button>
  )
}
