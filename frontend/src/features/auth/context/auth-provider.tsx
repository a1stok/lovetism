import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../types'
import { AuthContext } from './use-auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Derive user from session — single source of truth, never out of sync
  const user = useMemo(() => session?.user ?? null, [session])

  // Stable reference for fetching profile — used both during auth init
  // and when components call refreshProfile after an update.
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let initialised = false

    // Safety timeout — if onAuthStateChange never fires INITIAL_SESSION,
    // force loading to end so the app never hangs indefinitely.
    const timeout = setTimeout(() => {
      if (!initialised) {
        console.warn('Auth: session init timed out, forcing isLoading=false')
        initialised = true
        setIsLoading(false)
      }
    }, 5000)

    // onAuthStateChange fires INITIAL_SESSION immediately on subscribe,
    // which restores the session from localStorage / refreshes the token.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (session?.access_token) {
        localStorage.setItem('auth_token', session.access_token)
      } else {
        localStorage.removeItem('auth_token')
      }

      if (session?.user) {
        // Fire-and-forget — never block isLoading on the profile query
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }

      // Only flip isLoading on the first event (INITIAL_SESSION).
      // Subsequent events (TOKEN_REFRESHED, SIGNED_OUT, etc.) don't
      // need to touch isLoading since the app is already rendered.
      if (!initialised) {
        initialised = true
        clearTimeout(timeout)
        setIsLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      // onAuthStateChange will handle clearing session/profile via SIGNED_OUT event
    } catch (e) {
      console.error('Error signing out:', e)
      // If signOut API fails, manually clear to ensure user isn't stuck
      setSession(null)
      setProfile(null)
    }
  }

  // Allow components to re-fetch the profile after updating it
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  const value = {
    session,
    user,
    profile,
    isLoading,
    signOut,
    refreshProfile,
  }

  // Always render children immediately.
  // ProtectedRoute handles showing a spinner for protected pages.
  // Unprotected pages (Landing, etc.) load instantly without waiting.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
