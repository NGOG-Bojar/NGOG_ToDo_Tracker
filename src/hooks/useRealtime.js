import { useEffect, useRef } from 'react'
import { db } from '../services/database'
import { useAuth } from '../contexts/AuthContext'

/**
 * Custom hook for real-time subscriptions
 * Automatically manages subscriptions based on authentication state
 */
export function useRealtime(table, callback, dependencies = [], options = {}) {
  const { user } = useAuth()
  const subscriptionRef = useRef(null)
  const { enabled = true, filter = null } = options

  useEffect(() => {
    // Only subscribe if user is authenticated, online, and enabled
    if (!user || !navigator.onLine || !enabled) {
      return
    }

    // Check if real-time is enabled in settings
    const syncSettings = JSON.parse(localStorage.getItem('syncSettings') || '{}')
    if (syncSettings.enableRealtime === false) {
      return
    }
    // Create subscription
    const subscription = db.subscribe(table, (payload) => {
      console.log(`Real-time update for ${table}:`, payload)
      
      // Only process changes for the current user's data
      if (payload.new?.user_id === user.id || payload.old?.user_id === user.id || !payload.new?.user_id) {
        // Apply filter if provided
        if (filter && !filter(payload)) {
          return
        }
        
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
    
    subscriptionRef.current = subscription

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        db.unsubscribe(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [user, table, enabled, ...dependencies])

  // Return subscription status
  return {
    isSubscribed: !!subscriptionRef.current,
    subscription: subscriptionRef.current,
    reconnect: () => {
      if (subscriptionRef.current) {
        db.unsubscribe(subscriptionRef.current)
        subscriptionRef.current = null
      }
      // Trigger re-subscription by updating dependencies
    }
  }
}

/**
 * Hook for subscribing to multiple tables
 */
export function useMultipleRealtime(subscriptions, options = {}) {
  const { user } = useAuth()
  const subscriptionsRef = useRef([])
  const { enabled = true } = options

  useEffect(() => {
    if (!user || !navigator.onLine || !enabled) {
      return
    }

    // Check if real-time is enabled in settings
    const syncSettings = JSON.parse(localStorage.getItem('syncSettings') || '{}')
    if (syncSettings.enableRealtime === false) {
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
  }, [user, enabled, JSON.stringify(subscriptions)])

  return {
    subscriptions: subscriptionsRef.current,
    isSubscribed: subscriptionsRef.current.length > 0
  }
}

/**
 * Hook for selective real-time updates
 * Only subscribes to specific types of changes
 */
export function useSelectiveRealtime(table, eventTypes = ['INSERT', 'UPDATE', 'DELETE'], callback, dependencies = []) {
  return useRealtime(
    table, 
    callback, 
    dependencies,
    {
      filter: (payload) => eventTypes.includes(payload.eventType)
    }
  )
}
export default useRealtime