import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle sign in event
      if (event === 'SIGNED_IN' && session?.user) {
        // Initialize user data if this is their first time
        await initializeUserData(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Initialize default data for new users
  const initializeUserData = async (userId) => {
    try {
      // Try to call the database function to create default categories and settings
      const { data, error } = await supabase.functions.invoke('setup-database', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })
      
      if (error) {
        console.error('Error initializing user data via edge function:', error)
        
        // Fallback: try direct RPC call
        const { error: rpcError } = await supabase.rpc('initialize_user_data', {
          user_id: userId
        })
        
        if (rpcError) {
          console.error('Error with direct RPC call:', rpcError)
          // Don't throw error - user can still use the app
        }
      } else {
        console.log('User data initialized successfully:', data)
      }
    } catch (error) {
      console.error('Error initializing user data:', error)
      // Don't throw error - user can still use the app without default data
    }
  }

  // Sign up with email and password
  const signUp = async (email, password, options = {}) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          ...options
        }
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign in with email and password
  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update password
  const updatePassword = async (password) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}