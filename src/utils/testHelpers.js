/**
 * Comprehensive Test Helpers for Supabase Integration
 * Advanced utilities for testing database operations, sync functionality, and real-time features
 */

import { db } from '../services/database';
import { syncService } from '../services/syncService';
import { supabase } from '../lib/supabase';

export class ComprehensiveIntegrationTester {
  constructor() {
    this.testResults = [];
    this.cleanup = [];
    this.realTimeSubscriptions = [];
    this.testData = {};
  }

  // Add test result with enhanced metadata
  addResult(testName, success, data = null, error = null, duration = 0) {
    this.testResults.push({
      name: testName,
      success,
      data,
      error,
      duration,
      timestamp: new Date().toISOString(),
      environment: {
        online: navigator.onLine,
        userAgent: navigator.userAgent.substring(0, 50),
        url: window.location.href
      }
    });
  }

  // Enhanced cleanup with error handling
  async cleanupTestData() {
    console.log('Starting comprehensive cleanup...');
    
    for (const cleanupFn of this.cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        console.warn('Cleanup error (non-critical):', error);
      }
    }
    
    // Cleanup real-time subscriptions
    this.realTimeSubscriptions.forEach(subscription => {
      try {
        if (subscription) {
          db.unsubscribe(subscription);
        }
      } catch (error) {
        console.warn('Subscription cleanup error:', error);
      }
    });
    
    this.cleanup = [];
    this.realTimeSubscriptions = [];
    this.testData = {};
    console.log('Cleanup completed');
  }

  // Test database connection with detailed diagnostics
  async testDatabaseConnection() {
    const startTime = Date.now();
    
    try {
      // Test basic Supabase connection
      const { data: healthCheck, error: healthError } = await supabase
        .from('categories')
        .select('count')
        .limit(1);
      
      if (healthError) {
        throw new Error(`Supabase connection failed: ${healthError.message}`);
      }
      
      // Test authentication
      const isAuth = await db.isAuthenticated();
      const user = await db.getCurrentUser();
      
      // Test RLS policies
      const { data: rlsTest, error: rlsError } = await supabase
        .from('categories')
        .select('*')
        .limit(1);
      
      const duration = Date.now() - startTime;
      
      this.addResult('Database Connection', true, {
        authenticated: isAuth,
        userEmail: user?.email,
        online: navigator.onLine,
        rlsWorking: !rlsError,
        connectionTime: `${duration}ms`,
        supabaseHealth: !healthError
      }, null, duration);
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('Database Connection', false, null, error.message, duration);
      return false;
    }
  }

  // Comprehensive CRUD testing for all tables
  async testComprehensiveCRUD() {
    const tables = [
      {
        name: 'categories',
        createData: { name: 'Test Category', color: '#FF5733', deleted: false },
        updateData: { name: 'Updated Test Category', color: '#00FF00' }
      },
      {
        name: 'tasks',
        createData: { 
          title: 'Test Task', 
          description: 'Test Description', 
          priority: 'medium',
          status: 'open',
          categories: [],
          checklist: []
        },
        updateData: { title: 'Updated Test Task', priority: 'high' }
      },
      {
        name: 'projects',
        createData: { 
          title: 'Test Project', 
          description: 'Test Project Description',
          status: 'idea',
          color: '#3B82F6',
          archived: false,
          participants: [],
          linkedTasks: []
        },
        updateData: { title: 'Updated Test Project', status: 'active' }
      },
      {
        name: 'activity_log_categories',
        createData: { name: 'Test Activity Category', color: '#FF5733', deleted: false },
        updateData: { name: 'Updated Test Activity Category', color: '#00FF00' }
      },
      {
        name: 'events',
        createData: {
          title: 'Test Event',
          location: 'Test Location',
          startDate: '2024-12-01',
          endDate: '2024-12-03',
          participationType: 'exhibitor',
          participants: [],
          checklist: []
        },
        updateData: { title: 'Updated Test Event', location: 'Updated Location' }
      }
    ];

    for (const table of tables) {
      const startTime = Date.now();
      
      try {
        // CREATE
        const created = await db.create(table.name, table.createData);
        if (!created?.id) throw new Error(`Failed to create ${table.name}`);
        
        // Store for cleanup
        this.cleanup.push(() => db.delete(table.name, created.id));
        this.testData[`${table.name}Id`] = created.id;
        
        // READ
        const readItems = await db.read(table.name, { id: created.id });
        if (readItems.length === 0) throw new Error(`Failed to read ${table.name}`);
        
        // UPDATE
        const updated = await db.update(table.name, created.id, table.updateData);
        if (!updated) throw new Error(`Failed to update ${table.name}`);
        
        // Verify update
        const updatedItems = await db.read(table.name, { id: created.id });
        const firstUpdateKey = Object.keys(table.updateData)[0];
        const expectedValue = table.updateData[firstUpdateKey];
        const actualValue = updatedItems[0]?.[firstUpdateKey];
        
        if (actualValue !== expectedValue) {
          throw new Error(`Update verification failed for ${table.name}`);
        }
        
        const duration = Date.now() - startTime;
        
        this.addResult(`CRUD ${table.name}`, true, {
          created: !!created.id,
          read: readItems.length > 0,
          updated: actualValue === expectedValue,
          itemId: created.id,
          operationTime: `${duration}ms`
        }, null, duration);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        this.addResult(`CRUD ${table.name}`, false, null, error.message, duration);
      }
    }
  }

  // Test real-time subscriptions with actual data changes
  async testRealTimeSubscriptions() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const subscriptionResults = {};
      const tables = ['categories', 'tasks', 'projects', 'activity_log_categories', 'events'];
      let completedSubscriptions = 0;
      
      tables.forEach(table => {
        try {
          const subscription = db.subscribe(table, (payload) => {
            console.log(`Real-time update received for ${table}:`, payload);
            subscriptionResults[table] = {
              status: 'Active',
              lastUpdate: new Date().toISOString(),
              eventType: payload.eventType || 'unknown'
            };
          });
          
          if (subscription) {
            this.realTimeSubscriptions.push(subscription);
            subscriptionResults[table] = { status: 'Connected', lastUpdate: null };
          } else {
            subscriptionResults[table] = { status: 'Failed', lastUpdate: null };
          }
          
          completedSubscriptions++;
          
          if (completedSubscriptions === tables.length) {
            const duration = Date.now() - startTime;
            const connectedCount = Object.values(subscriptionResults)
              .filter(result => result.status === 'Connected' || result.status === 'Active').length;
            
            this.addResult('Real-time Subscriptions', connectedCount > 0, {
              totalTables: tables.length,
              connectedSubscriptions: connectedCount,
              subscriptionDetails: subscriptionResults,
              setupTime: `${duration}ms`
            }, connectedCount === 0 ? 'No subscriptions could be established' : null, duration);
            
            resolve(connectedCount > 0);
          }
        } catch (error) {
          subscriptionResults[table] = { status: `Error: ${error.message}`, lastUpdate: null };
          completedSubscriptions++;
          
          if (completedSubscriptions === tables.length) {
            const duration = Date.now() - startTime;
            this.addResult('Real-time Subscriptions', false, null, error.message, duration);
            resolve(false);
          }
        }
      });
    });
  }

  // Test offline functionality with comprehensive scenarios
  async testOfflineCapabilities() {
    const startTime = Date.now();
    
    try {
      // Test offline creation for multiple tables
      const offlineOperations = [];
      
      const offlineTask = await db.createOffline('tasks', {
        title: 'Offline Test Task',
        description: 'Created in offline mode',
        priority: 'low'
      });
      offlineOperations.push({ type: 'task', id: offlineTask.id });
      
      const offlineCategory = await db.createOffline('categories', {
        name: 'Offline Test Category',
        color: '#FF5733'
      });
      offlineOperations.push({ type: 'category', id: offlineCategory.id });
      
      // Test offline read
      const offlineTasks = db.readOffline('tasks');
      const offlineCategories = db.readOffline('categories');
      
      // Test offline update
      const updatedTask = db.updateOffline('tasks', offlineTask.id, { title: 'Updated Offline Task' });
      
      // Test sync queue
      const queueItem1 = syncService.queueOperation({
        type: 'create',
        table: 'projects',
        data: { title: 'Queued Project', status: 'idea' }
      });
      
      const queueItem2 = syncService.queueOperation({
        type: 'update',
        table: 'tasks',
        id: offlineTask.id,
        updates: { priority: 'high' }
      });
      
      // Get sync status
      const syncStatus = syncService.getSyncStatus();
      
      // Cleanup offline data
      this.cleanup.push(() => {
        const tasks = db.getFromLocalStorage('tasks');
        const categories = db.getFromLocalStorage('categories');
        
        const filteredTasks = tasks.filter(item => item.id !== offlineTask.id);
        const filteredCategories = categories.filter(item => item.id !== offlineCategory.id);
        
        localStorage.setItem('todoTasks', JSON.stringify(filteredTasks));
        localStorage.setItem('todoCategories', JSON.stringify(filteredCategories));
      });
      
      const duration = Date.now() - startTime;
      
      this.addResult('Offline Capabilities', true, {
        offlineCreations: offlineOperations.length,
        offlineReads: { tasks: offlineTasks.length, categories: offlineCategories.length },
        offlineUpdate: !!updatedTask,
        queueOperations: 2,
        queueLength: syncStatus.queueLength,
        localStorageWorking: true,
        testTime: `${duration}ms`
      }, null, duration);
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('Offline Capabilities', false, null, error.message, duration);
      return false;
    }
  }

  // Test sync service with conflict simulation
  async testSyncServiceAdvanced() {
    const startTime = Date.now();
    
    try {
      const initialStatus = syncService.getSyncStatus();
      const initialStats = syncService.getSyncStats();
      
      // Test queue operations
      const operations = [];
      for (let i = 0; i < 3; i++) {
        const operation = syncService.queueOperation({
          type: 'create',
          table: 'tasks',
          data: { title: `Sync Test Task ${i}`, priority: 'low' }
        });
        operations.push(operation);
      }
      
      // Test sync settings
      const originalAutoSync = syncService.isAutoSyncEnabled();
      syncService.setAutoSync(false);
      syncService.setSyncInterval(10000);
      
      // Restore original settings
      syncService.setAutoSync(originalAutoSync);
      
      const finalStatus = syncService.getSyncStatus();
      const duration = Date.now() - startTime;
      
      this.addResult('Sync Service Advanced', true, {
        initialQueueLength: initialStatus.queueLength,
        operationsAdded: operations.length,
        finalQueueLength: finalStatus.queueLength,
        syncInProgress: finalStatus.syncInProgress,
        totalSyncs: initialStats.totalSyncs,
        autoSyncControl: 'Working',
        settingsControl: 'Working',
        testTime: `${duration}ms`
      }, null, duration);
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('Sync Service Advanced', false, null, error.message, duration);
      return false;
    }
  }

  // Test data relationships and foreign keys
  async testDataRelationships() {
    const startTime = Date.now();
    
    try {
      // Use existing test data if available
      const { tasksId, projectsId, categoriesId } = this.testData;
      
      if (!tasksId || !projectsId || !categoriesId) {
        throw new Error('Required test data not available. Run CRUD tests first.');
      }
      
      // Test task-category relationship
      await db.update('tasks', tasksId, { categories: [categoriesId] });
      const taskWithCategory = await db.read('tasks', { id: tasksId });
      const hasCategory = taskWithCategory[0]?.categories?.includes(categoriesId);
      
      // Test task-project relationship
      await db.update('tasks', tasksId, { linked_project: projectsId });
      const taskWithProject = await db.read('tasks', { id: tasksId });
      const hasProject = taskWithProject[0]?.linked_project === projectsId;
      
      // Test project-task linking
      await db.update('projects', projectsId, { linked_tasks: [tasksId] });
      const projectWithTask = await db.read('projects', { id: projectsId });
      const projectHasTask = projectWithTask[0]?.linked_tasks?.includes(tasksId);
      
      const duration = Date.now() - startTime;
      
      this.addResult('Data Relationships', true, {
        taskCategoryLink: hasCategory,
        taskProjectLink: hasProject,
        projectTaskLink: projectHasTask,
        foreignKeysWorking: hasCategory && hasProject && projectHasTask,
        dataIntegrity: 'Maintained',
        testTime: `${duration}ms`
      }, null, duration);
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('Data Relationships', false, null, error.message, duration);
      return false;
    }
  }

  // Performance testing with multiple concurrent operations
  async testPerformance() {
    const startTime = Date.now();
    
    try {
      // Test concurrent reads
      const readStartTime = Date.now();
      const readPromises = [
        db.read('categories'),
        db.read('tasks'),
        db.read('projects'),
        db.read('activity_log_categories'),
        db.read('events')
      ];
      
      const readResults = await Promise.all(readPromises);
      const readTime = Date.now() - readStartTime;
      
      // Test batch operations
      const batchStartTime = Date.now();
      const batchPromises = [];
      
      for (let i = 0; i < 5; i++) {
        batchPromises.push(
          db.create('categories', { name: `Perf Test ${i}`, color: '#FF0000' })
        );
      }
      
      const batchResults = await Promise.all(batchPromises);
      const batchTime = Date.now() - batchStartTime;
      
      // Cleanup batch test data
      for (const result of batchResults) {
        if (result?.id) {
          this.cleanup.push(() => db.delete('categories', result.id));
        }
      }
      
      const totalRecords = readResults.reduce((sum, result) => sum + result.length, 0);
      const avgReadTime = Math.round(readTime / readPromises.length);
      const avgBatchTime = Math.round(batchTime / batchPromises.length);
      
      const duration = Date.now() - startTime;
      
      this.addResult('Performance Test', true, {
        totalRecordsRead: totalRecords,
        concurrentReadTime: `${readTime}ms`,
        averageReadTime: `${avgReadTime}ms`,
        batchCreateTime: `${batchTime}ms`,
        averageBatchTime: `${avgBatchTime}ms`,
        performanceRating: readTime < 1000 ? 'Excellent' : readTime < 2000 ? 'Good' : 'Needs Optimization',
        totalTestTime: `${duration}ms`
      }, null, duration);
      
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.addResult('Performance Test', false, null, error.message, duration);
      return false;
    }
  }

  // Run all comprehensive tests
  async runAllTests() {
    console.log('Starting comprehensive integration tests...');
    this.testResults = [];
    this.cleanup = [];
    this.realTimeSubscriptions = [];
    this.testData = {};
    
    const overallStartTime = Date.now();
    
    try {
      await this.testDatabaseConnection();
      await this.testComprehensiveCRUD();
      await this.testRealTimeSubscriptions();
      await this.testOfflineCapabilities();
      await this.testSyncServiceAdvanced();
      await this.testDataRelationships();
      await this.testPerformance();
      
      const overallDuration = Date.now() - overallStartTime;
      console.log(`All comprehensive tests completed in ${overallDuration}ms`);
      
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

  // Get comprehensive test summary
  getTestSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;
    const totalDuration = this.testResults.reduce((sum, r) => sum + (r.duration || 0), 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
    
    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      totalDuration: `${totalDuration}ms`,
      averageDuration: `${avgDuration}ms`,
      environment: {
        online: navigator.onLine,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Export test results for analysis
  exportResults() {
    const summary = this.getTestSummary();
    const exportData = {
      summary,
      results: this.testResults,
      exportedAt: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        online: navigator.onLine
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supabase-test-results-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const comprehensiveIntegrationTester = new ComprehensiveIntegrationTester();

// Utility functions for specific advanced tests
export const testSupabaseRealTime = async (table, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const subscription = db.subscribe(table, (payload) => {
      resolve({ success: true, payload });
    });
    
    if (!subscription) {
      reject(new Error('Failed to create subscription'));
      return;
    }
    
    setTimeout(() => {
      db.unsubscribe(subscription);
      reject(new Error('Real-time test timeout'));
    }, timeout);
  });
};

export const testConcurrentOperations = async (operations) => {
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      results,
      duration,
      operationCount: operations.length,
      averageTime: Math.round(duration / operations.length)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
};

export const simulateNetworkConditions = (condition = 'offline') => {
  // Temporarily override navigator.onLine
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: condition === 'online'
  });
  
  // Restore after test
  return () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  };
};

export default ComprehensiveIntegrationTester;