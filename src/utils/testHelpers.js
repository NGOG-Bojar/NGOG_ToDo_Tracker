/**
 * Test Helpers for Supabase Integration
 * Utilities for testing database operations and sync functionality
 */

import { db } from '../services/database';
import { syncService } from '../services/syncService';

export class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.cleanup = [];
  }

  // Add test result
  addResult(testName, success, data = null, error = null) {
    this.testResults.push({
      name: testName,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // Clean up test data
  async cleanupTestData() {
    console.log('Cleaning up test data...');
    
    for (const cleanupFn of this.cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    }
    
    this.cleanup = [];
  }

  // Test database connection
  async testDatabaseConnection() {
    try {
      const isAuth = await db.isAuthenticated();
      const user = await db.getCurrentUser();
      
      this.addResult('Database Connection', true, {
        authenticated: isAuth,
        userEmail: user?.email,
        online: navigator.onLine
      });
      
      return true;
    } catch (error) {
      this.addResult('Database Connection', false, null, error.message);
      return false;
    }
  }

  // Test CRUD operations
  async testCRUDOperations() {
    const testData = {
      categories: { name: 'Test Category', color: '#FF5733' },
      tasks: { 
        title: 'Test Task', 
        description: 'Test Description', 
        priority: 'medium' 
      },
      projects: { 
        title: 'Test Project', 
        description: 'Test Project Description',
        status: 'idea' 
      }
    };

    for (const [table, data] of Object.entries(testData)) {
      try {
        // CREATE
        const created = await db.create(table, data);
        this.addResult(`Create ${table}`, true, { id: created.id });
        
        // Add to cleanup
        this.cleanup.push(() => db.delete(table, created.id));
        
        // READ
        const items = await db.read(table, { id: created.id });
        this.addResult(`Read ${table}`, items.length > 0, { count: items.length });
        
        // UPDATE
        const updateData = table === 'categories' 
          ? { name: 'Updated Test Category' }
          : table === 'tasks'
          ? { title: 'Updated Test Task' }
          : { title: 'Updated Test Project' };
          
        const updated = await db.update(table, created.id, updateData);
        this.addResult(`Update ${table}`, !!updated, { updated: true });
        
      } catch (error) {
        this.addResult(`CRUD ${table}`, false, null, error.message);
      }
    }
  }

  // Test offline functionality
  async testOfflineMode() {
    try {
      // Test offline creation
      const offlineItem = await db.createOffline('tasks', {
        title: 'Offline Test Task',
        description: 'Created in offline mode',
        priority: 'low'
      });
      
      this.addResult('Offline Create', true, {
        id: offlineItem.id,
        hasLocalId: !!offlineItem.local_id
      });
      
      // Add to cleanup
      this.cleanup.push(() => {
        const items = db.getFromLocalStorage('tasks');
        const filtered = items.filter(item => item.id !== offlineItem.id);
        localStorage.setItem('todoTasks', JSON.stringify(filtered));
      });
      
      // Test offline read
      const offlineItems = db.readOffline('tasks');
      this.addResult('Offline Read', Array.isArray(offlineItems), {
        count: offlineItems.length
      });
      
      return true;
    } catch (error) {
      this.addResult('Offline Mode', false, null, error.message);
      return false;
    }
  }

  // Test sync functionality
  async testSyncService() {
    try {
      const status = syncService.getSyncStatus();
      this.addResult('Sync Status', true, status);
      
      // Test queue operation
      const queueItem = syncService.queueOperation({
        type: 'create',
        table: 'tasks',
        data: { title: 'Queued Task', priority: 'low' }
      });
      
      this.addResult('Queue Operation', !!queueItem.id, {
        queueId: queueItem.id,
        queueLength: syncService.getSyncStatus().queueLength
      });
      
      return true;
    } catch (error) {
      this.addResult('Sync Service', false, null, error.message);
      return false;
    }
  }

  // Test localStorage operations
  async testLocalStorage() {
    try {
      const testKey = 'todoTestData';
      const testData = [{ id: '1', name: 'Test Item' }];
      
      // Test write
      localStorage.setItem(testKey, JSON.stringify(testData));
      
      // Test read
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '[]');
      
      // Cleanup
      localStorage.removeItem(testKey);
      
      this.addResult('localStorage Operations', retrieved.length === 1, {
        written: testData.length,
        retrieved: retrieved.length
      });
      
      return true;
    } catch (error) {
      this.addResult('localStorage Operations', false, null, error.message);
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('Starting integration tests...');
    this.testResults = [];
    this.cleanup = [];
    
    try {
      await this.testDatabaseConnection();
      await this.testLocalStorage();
      await this.testOfflineMode();
      await this.testSyncService();
      await this.testCRUDOperations();
      
      console.log('All tests completed');
      return this.testResults;
    } catch (error) {
      console.error('Test suite error:', error);
      this.addResult('Test Suite', false, null, error.message);
      return this.testResults;
    } finally {
      // Always cleanup
      await this.cleanupTestData();
    }
  }

  // Get test summary
  getTestSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;
    
    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0
    };
  }
}

// Export singleton instance
export const integrationTester = new IntegrationTester();

// Helper functions for specific tests
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await db.supabase.from('categories').select('count').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
};

export const testRealTimeSubscription = (table, callback) => {
  return db.subscribe(table, callback);
};

export const simulateOfflineMode = () => {
  // Temporarily override navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false
  });
  
  // Restore after 5 seconds
  setTimeout(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  }, 5000);
};

export default IntegrationTester;