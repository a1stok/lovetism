import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { PreferencesModal } from './preferences-modal'

export const BUDGET_RANGES = [
  { id: 'under50', label: 'Under $50', max: 50 },
  { id: '50-100', label: '$50-100', max: 100 },
  { id: '100-150', label: '$100-150', max: 150 },
  { id: 'splurge', label: 'Splurge', max: 200 },
] as const

export interface DatePreferences {
  vibes: string[]
  transport: string
  indoorOutdoor: string
  budgetRange: string
}

const DEFAULT: DatePreferences = {
  vibes: [],
  transport: 'transit',
  indoorOutdoor: 'both',
  budgetRange: '50-100',
}

const STORAGE_KEY = 'lovetism_date_preferences'

function load(): DatePreferences {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) return { ...DEFAULT, ...JSON.parse(s) }
  } catch {}
  return DEFAULT
}

function save(p: DatePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

interface PreferencesContextValue {
  preferences: DatePreferences
  setPreferences: (p: DatePreferences | ((prev: DatePreferences) => DatePreferences)) => void
  updatePreferences: (updates: Partial<DatePreferences>) => void
  openPreferences: () => void
}

const Context = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setState] = useState<DatePreferences>(load)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const openPreferences = useCallback(() => setPrefsOpen(true), [])

  const setPreferences = useCallback((p: DatePreferences | ((prev: DatePreferences) => DatePreferences)) => {
    setState((prev) => {
      const next = typeof p === 'function' ? p(prev) : p
      save(next)
      return next
    })
  }, [])

  const updatePreferences = useCallback((updates: Partial<DatePreferences>) => {
    setState((prev) => {
      const next = { ...prev, ...updates }
      save(next)
      return next
    })
  }, [])

  return (
    <Context.Provider value={{ preferences, setPreferences, updatePreferences, openPreferences }}>
      {children}
      <PreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </Context.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
