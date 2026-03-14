import { LoadScript } from '@react-google-maps/api'
import type { ReactNode } from 'react'
import { QueryProvider } from './query-provider'
import { ThemeProvider } from './theme-provider'
import { PreferencesProvider } from '@/features/preferences'
import { AuthProvider } from '@/features/auth'

const LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"]

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''

  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <PreferencesProvider>
        <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={LIBRARIES}>
          <AuthProvider>
            <QueryProvider>{children}</QueryProvider>
          </AuthProvider>
        </LoadScript>
      </PreferencesProvider>
    </ThemeProvider>
  )
}

