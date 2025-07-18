import { db } from './database'
import { supabase } from '../lib/supabase'

/**
 * Sync Service
 * Handles offline queue and synchronization between local and remote data
 */
class SyncService {
  constructor() {
    this.offlineQueue = this.loadOfflineQueue()
    this.isOnline = navigator.onLine
    this.syncInProgress = false
    this.setupConnectionListeners()
  }

  setupConnectionListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processPendingOperations()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  /**
   * Queue an operation when offline
   */
  queueOperation(operation) {
    const queueItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...operation
    }
    
    this.offlineQueue.push(queueItem)
    this.saveOfflineQueue()
    
    console.log('Queued operation:', queueItem)
    return queueItem
  }

  /**
   * Process all pending operations when back online
   */
  async processPendingOperations() {
    if (!this.isOnline || this.syncInProgress || this.offlineQueue.length === 0) {
      return
    }

    this.syncInProgress = true
    console.log(`Processing ${this.offlineQueue.length} pending operations...`)

    const processedOperations = []
    const failedOperations = []

    for (const operation of this.offlineQueue) {
      try {
        await this.executeOperation(operation)
        processedOperations.push(operation)
      } catch (error) {
        console.error('Failed to process operation:', operation, error)
        failedOperations.push(operation)
      }
    }

    // Remove successfully processed operations
    this.offlineQueue = failedOperations
    this.saveOfflineQueue()

    console.log(`Processed ${processedOperations.length} operations, ${failedOperations.length} failed`)
    this.syncInProgress = false

    // Trigger a full sync if there were any operations
    if (processedOperations.length > 0) {
      this.triggerDataRefresh()
    }
    
    // Update last sync time
    localStorage.setItem('lastSyncTime', new Date().toISOString())
    
    return {
      processed: processedOperations.length,
      failed: failedOperations.length,
      total: processedOperations.length + failedOperations.length
    }
  }

  /**
   * Execute a queued operation
   */
  async executeOperation(operation) {
    const { type, table, data, id, updates } = operation

    switch (type) {
      case 'create':
        return await db.create(table, data)
      case 'update':
        return await db.update(table, id, updates)
      case 'delete':
        return await db.delete(table, id)
      default:
        throw new Error(`Unknown operation type: ${type}`)
    }
  }

  /**
   * Conflict Resolution
   */
  async resolveConflicts(localData, remoteData) {
    // Enhanced conflict resolution with user interaction
    
    const conflicts = []
    const resolved = []

    localData.forEach(localItem => {
      const remoteItem = remoteData.find(r => r.id === localItem.id)
      
      if (remoteItem) {
        const localTime = new Date(localItem.updated_at)
        const remoteTime = new Date(remoteItem.updated_at)
        
        if (localTime > remoteTime) {
          // Local is newer, keep local
          resolved.push(localItem)
        } else if (remoteTime > localTime) {
          // Remote is newer, keep remote
          resolved.push(remoteItem)
        } else {
          // Same timestamp or significant differences, mark as conflict
          conflicts.push({ 
            id: localItem.id,
            table: 'unknown', // Will be set by caller
            local: localItem, 
            remote: remoteItem 
          })
        }
      } else {
        // Only exists locally
        resolved.push(localItem)
      }
    })

    // Add remote items that don't exist locally
    remoteData.forEach(remoteItem => {
      if (!localData.find(l => l.id === remoteItem.id)) {
        resolved.push(remoteItem)
      }
    })

    return { resolved, conflicts }
  }

  /**
   * Show conflict resolution UI
   */
  async showConflictResolution(conflicts) {
    return new Promise((resolve) => {
      // Dispatch custom event for conflict resolution UI
      window.dispatchEvent(new CustomEvent('syncConflicts', {
        detail: { conflicts, resolve }
      }))
    })
  }

  /**
   * Full bidirectional sync
   */
  async performFullSync() {
    const isAuth = await db.isAuthenticated()
    if (!isAuth || !this.isOnline) return false

    try {
      console.log('Starting full sync...')
      
      const tables = ['categories', 'tasks', 'projects', 'activity_log_categories', 'events']
      
      for (const table of tables) {
        await this.syncTable(table)
      }
      
      console.log('Full sync completed')
      return true
    } catch (error) {
      console.error('Full sync failed:', error)
      return false
    }
  }

  /**
   * Sync a specific table
   */
  async syncTable(table) {
    try {
      // Get local data
      const localData = db.getFromLocalStorage(table)
      
      // Get remote data
      const remoteData = await db.read(table)
      
      // Resolve conflicts
      const { resolved, conflicts } = await this.resolveConflicts(localData, remoteData)
      
      // If there are conflicts, show resolution UI
      if (conflicts.length > 0) {
        console.log(`Found ${conflicts.length} conflicts in ${table}`)
        const resolutions = await this.showConflictResolution(
          conflicts.map(c => ({ ...c, table }))
        )
        
        // Apply user resolutions
        Object.entries(resolutions).forEach(([conflictId, resolution]) => {
          const conflict = conflicts.find(c => c.id === conflictId)
          if (conflict) {
            if (resolution === 'local') {
              resolved.push(conflict.local)
            } else if (resolution === 'remote') {
              resolved.push(conflict.remote)
            }
          }
        })
      }
      
      // Update localStorage with resolved data
      db.cacheToLocalStorage(table, resolved)
      
      console.log(`Synced ${table}: ${resolved.length} items resolved`)
    } catch (error) {
      console.error(`Error syncing ${table}:`, error)
    }
  }

  /**
   * Trigger data refresh in contexts
   */
  triggerDataRefresh() {
    // Dispatch custom event that contexts can listen to
    window.dispatchEvent(new CustomEvent('dataRefresh', {
      detail: { source: 'sync' }
    }))
  }

  /**
   * Queue management
   */
  loadOfflineQueue() {
    try {
      const queue = localStorage.getItem('todoOfflineQueue')
      return queue ? JSON.parse(queue) : []
    } catch (error) {
      console.error('Error loading offline queue:', error)
      return []
    }
  }

  saveOfflineQueue() {
    try {
      localStorage.setItem('todoOfflineQueue', JSON.stringify(this.offlineQueue))
    } catch (error) {
      console.error('Error saving offline queue:', error)
    }
  }

  clearOfflineQueue() {
    this.offlineQueue = []
    this.saveOfflineQueue()
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.offlineQueue.length,
      syncInProgress: this.syncInProgress,
      lastSync: localStorage.getItem('lastSyncTime'),
      hasConflicts: this.offlineQueue.some(op => op.hasConflict),
      nextAutoSync: this.getNextAutoSyncTime()
    }
  }

  /**
   * Get next auto-sync time
   */
  getNextAutoSyncTime() {
    const lastSync = localStorage.getItem('lastSyncTime')
    if (!lastSync) return null
    
    const syncInterval = parseInt(localStorage.getItem('syncInterval') || '30000')
    return new Date(new Date(lastSync).getTime() + syncInterval)
  }

  /**
   * Enable/disable auto-sync
   */
  setAutoSync(enabled) {
    localStorage.setItem('autoSyncEnabled', enabled.toString())
  }

  /**
   * Check if auto-sync is enabled
   */
  isAutoSyncEnabled() {
    return localStorage.getItem('autoSyncEnabled') !== 'false'
  }

  /**
   * Set sync interval
   */
  setSyncInterval(interval) {
    localStorage.setItem('syncInterval', interval.toString())
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    return {
      totalSyncs: parseInt(localStorage.getItem('totalSyncs') || '0'),
      successfulSyncs: parseInt(localStorage.getItem('successfulSyncs') || '0'),
      failedSyncs: parseInt(localStorage.getItem('failedSyncs') || '0'),
      lastSyncDuration: parseInt(localStorage.getItem('lastSyncDuration') || '0'),
      averageSyncTime: parseInt(localStorage.getItem('averageSyncTime') || '0')
    }
  }

  /**
   * Record sync statistics
   */
  recordSyncStats(success, duration) {
    const stats = this.getSyncStats()
    
    stats.totalSyncs++
    if (success) {
      stats.successfulSyncs++
    } else {
      stats.failedSyncs++
    }
    
    stats.lastSyncDuration = duration
    stats.averageSyncTime = Math.round(
      (stats.averageSyncTime * (stats.totalSyncs - 1) + duration) / stats.totalSyncs
    )
    
    // Save updated stats
    Object.entries(stats).forEach(([key, value]) => {
      localStorage.setItem(key, value.toString())
    })
  }
  /**
   * Manual sync trigger
   */
  async manualSync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }

    const startTime = Date.now()
    let success = false
    
    try {
      await this.processPendingOperations()
      await this.performFullSync()
      success = true
    } catch (error) {
      console.error('Manual sync failed:', error)
      throw error
    } finally {
      const duration = Date.now() - startTime
      this.recordSyncStats(success, duration)
    }
    
    localStorage.setItem('lastSyncTime', new Date().toISOString())
  }
}

// Create singleton instance
export const syncService = new SyncService()
export default SyncService