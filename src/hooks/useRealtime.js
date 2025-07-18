import { useEffect, useRef } from 'react'
import { db } from '../services/database'
import { useAuth } from '../contexts/AuthContext'

/**
 * Custom hook for real-time subscriptions
 * Automatically manages subscriptions based on authentication state
 */
export function useRealtime(table, callback, dependencies = []) {
  const { user } = useAuth()
  const subscriptionRef = useRef(null)

  useEffect(() => {
    // Only subscribe if user is authenticated and online
    if (!user || !navigator.onLine) {
      return
    }

    // Create subscription
    subscriptionRef.current = db.subscribe(table, (payload) => {
      console.log(`Real-time update for ${table}:`, payload)
      
      // Only process changes for the current user's data
      if (payload.new?.user_id === user.id || payload.old?.user_id === user.id || !payload.new?.user_id) {
        // Transform Supabase payload to our expected format
        const transformedPayload = {
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
          table: payload.table
        }
        callback(transformedPayload)
      }
    })

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        db.unsubscribe(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [user, table, ...dependencies])

  // Return subscription status
  return {
    isSubscribed: !!subscriptionRef.current,
    subscription: subscriptionRef.current
  }
}

/**
 * Hook for subscribing to multiple tables
 */
export function useMultipleRealtime(subscriptions) {
  const { user } = useAuth()
  const subscriptionsRef = useRef([])

  useEffect(() => {
    if (!user || !navigator.onLine) {
      return
    }

    // Create all subscriptions
    subscriptionsRef.current = subscriptions.map(({ table, callback }) => {
      return db.subscribe(table, (payload) => {
        if (payload.new?.user_id === user.id || payload.old?.user_id === user.id) {
          callback(payload)
        }
      })
    })

    // Cleanup function
    return () => {
      subscriptionsRef.current.forEach(subscription => {
        if (subscription) {
          db.unsubscribe(subscription)
        }
      })
      subscriptionsRef.current = []
    }
  }, [user, JSON.stringify(subscriptions)])

  return {
    subscriptions: subscriptionsRef.current,
    isSubscribed: subscriptionsRef.current.length > 0
  }
}

export default useRealtime