import React from 'react'
import { useTheme } from './ThemeContext.jsx'
import { useToast } from './Toast.jsx'

export default function ThemeToggle() {
  const { theme, toggleTheme, isLight, isDark } = useTheme()
  const toast = useToast()

  const handleToggle = () => {
    toggleTheme()
    const newTheme = isLight ? 'dark' : 'light'
    toast.info(`Switched to ${newTheme} mode ${newTheme === 'dark' ? '🌙' : '☀️'}`)
  }

  return (
    <button
      className={`theme-toggle ${theme}`}
      onClick={handleToggle}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <div className="theme-toggle__track">
        <div className="theme-toggle__thumb">
          <span className="theme-toggle__icon">
            {isLight ? '☀️' : '🌙'}
          </span>
        </div>
      </div>
      <span className="theme-toggle__label">
        {isLight ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}

// Alternative compact version
export function CompactThemeToggle() {
  const { toggleTheme, isLight } = useTheme()
  const toast = useToast()

  const handleToggle = () => {
    toggleTheme()
    const newTheme = isLight ? 'dark' : 'light'
    toast.info(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme} mode`)
  }

  return (
    <button
      className="compact-theme-toggle"
      onClick={handleToggle}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      {isLight ? '🌙' : '☀️'}
    </button>
  )
}
