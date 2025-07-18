import { supabase } from '../lib/supabase'

/**
 * Database Service Layer
 * Provides a unified interface for all database operations
 * Handles both online (Supabase) and offline (localStorage) scenarios
 */
class DatabaseService {
  constructor() {
    this.isOnline = navigator.onLine
    this.setupConnectionListeners()
  }

  setupConnectionListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('Database: Back online')
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('Database: Gone offline')
    })
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    } catch (error) {
      return false
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      return null
    }
  }

  /**
   * Generic CRUD Operations
   */

  // CREATE
  async create(table, data) {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth && this.isOnline) {
      try {
        const user = await this.getCurrentUser()
        const { data: result, error } = await supabase
          .from(table)
          .insert({ ...data, user_id: user.id })
          .select()
          .single()
        
        if (error) throw error
        
        // Also save to localStorage as backup
        this.saveToLocalStorage(table, result)
        return result
      } catch (error) {
        console.error(`Error creating ${table}:`, error)
        // Fallback to localStorage
        return this.createOffline(table, data)
      }
    } else {
      // Offline mode
      return this.createOffline(table, data)
    }
  }

  // READ
  async read(table, filters = {}) {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth && this.isOnline) {
      try {
        let query = supabase.from(table).select('*')
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
        
        const { data, error } = await query
        if (error) throw error
        
        // Cache in localStorage
        this.cacheToLocalStorage(table, data)
        return data || []
      } catch (error) {
        console.error(`Error reading ${table}:`, error)
        // Fallback to localStorage
        return this.readOffline(table, filters)
      }
    } else {
      // Offline mode
      return this.readOffline(table, filters)
    }
  }

  // UPDATE
  async update(table, id, updates) {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth && this.isOnline) {
      try {
        const { data, error } = await supabase
          .from(table)
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        
        // Update localStorage
        this.updateLocalStorage(table, id, updates)
        return data
      } catch (error) {
        console.error(`Error updating ${table}:`, error)
        // Fallback to localStorage
        return this.updateOffline(table, id, updates)
      }
    } else {
      // Offline mode
      return this.updateOffline(table, id, updates)
    }
  }

  // DELETE
  async delete(table, id) {
    const isAuth = await this.isAuthenticated()
    
    if (isAuth && this.isOnline) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        // Remove from localStorage
        this.deleteFromLocalStorage(table, id)
        return true
      } catch (error) {
        console.error(`Error deleting ${table}:`, error)
        // Fallback to localStorage
        return this.deleteOffline(table, id)
      }
    } else {
      // Offline mode
      return this.deleteOffline(table, id)
    }
  }

  /**
   * Offline Operations (localStorage)
   */

  createOffline(table, data) {
    const items = this.getFromLocalStorage(table)
    const newItem = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      local_id: crypto.randomUUID() // For sync mapping
    }
    items.push(newItem)
    localStorage.setItem(this.getStorageKey(table), JSON.stringify(items))
    return newItem
  }

  readOffline(table, filters = {}) {
    let items = this.getFromLocalStorage(table)
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        items = items.filter(item => item[key] === value)
      }
    })
    
    return items
  }

  updateOffline(table, id, updates) {
    const items = this.getFromLocalStorage(table)
    const index = items.findIndex(item => item.id === id)
    
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      localStorage.setItem(this.getStorageKey(table), JSON.stringify(items))
      return items[index]
    }
    return null
  }

  deleteOffline(table, id) {
    const items = this.getFromLocalStorage(table)
    const filteredItems = items.filter(item => item.id !== id)
    localStorage.setItem(this.getStorageKey(table), JSON.stringify(filteredItems))
    return true
  }

  /**
   * localStorage Utilities
   */

  getStorageKey(table) {
    const keyMap = {
      tasks: 'todoTasks',
      categories: 'todoCategories',
      projects: 'todoProjects',
      activity_log_categories: 'todoActivityLogCategories',
      events: 'todoEvents',
      user_settings: 'todoSettings'
    }
    return keyMap[table] || `todo${table}`
  }

  getFromLocalStorage(table) {
    try {
      const data = localStorage.getItem(this.getStorageKey(table))
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Error reading ${table} from localStorage:`, error)
      return []
    }
  }

  saveToLocalStorage(table, item) {
    const items = this.getFromLocalStorage(table)
    const existingIndex = items.findIndex(existing => existing.id === item.id)
    
    if (existingIndex !== -1) {
      items[existingIndex] = item
    } else {
      items.push(item)
    }
    
    localStorage.setItem(this.getStorageKey(table), JSON.stringify(items))
  }

  cacheToLocalStorage(table, data) {
    localStorage.setItem(this.getStorageKey(table), JSON.stringify(data))
  }

  updateLocalStorage(table, id, updates) {
    const items = this.getFromLocalStorage(table)
    const index = items.findIndex(item => item.id === id)
    
    if (index !== -1) {
      items[index] = { ...items[index], ...updates }
      localStorage.setItem(this.getStorageKey(table), JSON.stringify(items))
    }
  }

  deleteFromLocalStorage(table, id) {
    const items = this.getFromLocalStorage(table)
    const filteredItems = items.filter(item => item.id !== id)
    localStorage.setItem(this.getStorageKey(table), JSON.stringify(filteredItems))
  }

  /**
   * Real-time Subscriptions
   */

  subscribe(table, callback) {
    if (!this.isOnline) return null
    
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe()
  }

  unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }

  /**
   * Sync Operations
   */

  async syncToCloud() {
    const isAuth = await this.isAuthenticated()
    if (!isAuth || !this.isOnline) return false

    try {
      // This would implement the sync logic
      // For now, we'll implement this in Phase 4
      console.log('Sync to cloud - to be implemented in Phase 4')
      return true
    } catch (error) {
      console.error('Sync error:', error)
      return false
    }
  }

  /**
   * Migration Utilities
   */

  async migrateFromLocalStorage() {
    const isAuth = await this.isAuthenticated()
    if (!isAuth) return false

    try {
      const user = await this.getCurrentUser()
      const tables = ['tasks', 'categories', 'projects', 'activity_log_categories', 'events']
      
      for (const table of tables) {
        const localData = this.getFromLocalStorage(table)
        
        if (localData.length > 0) {
          // Add user_id to all items
          const dataWithUserId = localData.map(item => ({
            ...item,
            user_id: user.id,
            local_id: item.id // Keep original ID for reference
          }))
          
          // Batch insert to Supabase
          const { error } = await supabase
            .from(table)
            .insert(dataWithUserId)
          
          if (error) {
            console.error(`Migration error for ${table}:`, error)
          } else {
            console.log(`Migrated ${localData.length} ${table} items`)
          }
        }
      }
      
      return true
    } catch (error) {
      console.error('Migration error:', error)
      return false
    }
  }
}

// Create singleton instance
export const db = new DatabaseService()
export default DatabaseService