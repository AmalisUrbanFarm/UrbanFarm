import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthCtxType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: () => boolean
  isStaff: () => boolean
  isSocio: () => boolean
  signOut: () => void
}

export const AuthCtx = createContext<AuthCtxType>({} as AuthCtxType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(uid: string, token: string) {
    console.log('loadProfile start', uid)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}&select=*`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const data = await res.json()
      console.log('loadProfile result', data)
      setProfile(data?.[0] ?? null)
    } catch (e) {
      console.error('loadProfile error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('timeout, forcing loading=false')
      setLoading(false)
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('auth event:', event, session?.user?.id)
      clearTimeout(timeout)
      if (session?.user && session.access_token) {
        setUser(session.user)
        await loadProfile(session.user.id, session.access_token)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthCtx.Provider value={{
      user,
      profile,
      loading,
      isAdmin: () => profile?.ruolo === 'admin',
      isStaff: () => ['admin', 'agronomo', 'operatore'].includes(profile?.ruolo ?? ''),
      isSocio: () => !!profile?.soci,
      signOut: () => supabase.auth.signOut()
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  return useContext(AuthCtx)
}