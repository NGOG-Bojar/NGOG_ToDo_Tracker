import { useEffect, useRef } from 'react';
import supabase from '../lib/supabase';

export function useSupabaseSubscription(table, callback, dependencies = []) {
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Create new subscription
    subscriptionRef.current = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, dependencies);

  return subscriptionRef.current;
}