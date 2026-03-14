import type { Session, User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  nickname?: string | null
  avatar_url: string | null
  updated_at: string
}

export interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}
