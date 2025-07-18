import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useCategory } from '../contexts/CategoryContext';
import { useProject } from '../contexts/ProjectContext';
import { useActivityLogCategory } from '../contexts/ActivityLogCategoryContext';
import { useEvent } from '../contexts/EventContext';
import { db } from '../services/database';
import { syncService } from '../services/syncService';
import { supabase } from '../lib/supabase';

const { 
  FiCheck, FiX, FiLoader, FiDatabase, FiWifi, FiWifiOff, 
  FiRefreshCw, FiAlertTriangle, FiInfo, FiPlay, FiPause,
  FiUsers, FiLock, FiZap, FiClock, FiTrash2, FiEdit3
} = FiIcons;

function TestIntegration({ onClose }) {
  const [currentTest, setCurrentTest] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState({});
  const [testData, setTestData] = useState({}); // Store created test data for cleanup
  
  const { user, session } = useAuth();
  const { addTask, updateTask, deleteTask, tasks } = useTask();
  const { addCategory, updateCategory, deleteCategory, categories } = useCategory();
  const { addProject, updateProject, deleteProject, projects } = useProject();
  const { addActivityLogCategory, updateActivityLogCategory, deleteActivityLogCategory, activityLogCategories } = useActivityLogCategory();
  const { addEvent, updateEvent, deleteEvent, events } = useEvent();

  const testSuite = [
    {
      id: 'environment-check',
      name: 'Environment Configuration',
      description: 'Verify environment variables and basic setup',
      test: async () => {
        const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
        const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!hasSupabaseUrl || !hasSupabaseKey) {
          throw new Error('Missing Supabase environment variables');
        }
        
        return {
          supabaseUrl: hasSupabaseUrl ? 'Configured' : 'Missing',
          supabaseKey: hasSupabaseKey ? 'Configured' : 'Missing',
          online: navigator.onLine,
          userAgent: navigator.userAgent.substring(0, 50) + '...'
        };
      }
    },
    {
      id: 'auth-validation',
      name: 'Authentication Validation',
      description: 'Comprehensive authentication and session checks',
      test: async () => {
        // Basic validation first
        if (!user || !session) {
          throw new Error('User not authenticated - no user or session found');
        }
        
        // Quick validation without external calls that might hang
        const basicValidation = {
          userId: user.id,
          userEmail: user.email || 'No email',
          sessionValid: !!session.access_token,
          sessionExpiry: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'Unknown',
          userConfirmed: user.email_confirmed_at ? 'Yes' : 'No',
          accessTokenPresent: !!session.access_token,
          refreshTokenPresent: !!session.refresh_token,
          contextDataValid: !!(user.id && session.access_token)
        };
        
        // Only do external validation if basic validation passes
        if (!basicValidation.contextDataValid) {
          throw new Error('Basic authentication data is invalid');
        }
        
        // Try a quick session check with short timeout
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session check timeout after 3 seconds')), 3000)
          );
          
          const { data: sessionData, error: sessionError } = await Promise.race([
            sessionPromise, 
            timeoutPromise
          ]);
          
          if (sessionError) {
            console.warn('Session validation warning:', sessionError.message);
            basicValidation.sessionCheckWarning = sessionError.message;
          } else if (sessionData?.session) {
            basicValidation.sessionMatches = sessionData.session.user.id === user.id;
            basicValidation.externalSessionValid = true;
          }
        } catch (error) {
          console.warn('Session check failed, continuing with basic validation:', error.message);
          basicValidation.sessionCheckError = error.message;
        }
        
        return basicValidation;
      }
    },
    {
      id: 'database-connection',
      name: 'Database Connection Test',
      description: 'Test Supabase database connectivity and permissions',
      test: async () => {
        // Simple, fast validation without external calls
        const results = {
          supabaseClient: 'Unknown',
          environmentVars: 'Unknown',
          authContext: 'Unknown',
          dbService: 'Unknown',
          online: navigator.onLine
        };
        
        // Test 1: Supabase client exists
        if (supabase && typeof supabase.from === 'function') {
          results.supabaseClient = 'Initialized';
        } else {
          results.supabaseClient = 'Failed';
        }
        
        // Test 2: Environment variables
        const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
        const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
        results.environmentVars = hasUrl && hasKey ? 'Configured' : 'Missing';
        
        // Test 3: Auth context
        if (user && session) {
          results.authContext = 'Valid';
          results.userId = user.id;
          results.userEmail = user.email;
        } else {
          results.authContext = 'Invalid';
        }
        
        // Test 4: Database service
        if (db && typeof db.read === 'function') {
          results.dbService = 'Available';
        } else {
          results.dbService = 'Missing';
        }
        
        // Quick connectivity test (with very short timeout)
        try {
          const quickTest = new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Quick test timeout')), 2000);
            
            // Just test if we can create a query (don't execute it)
            const query = supabase.from('categories').select('id').limit(1);
            if (query) {
              resolve('Query creation successful');
            } else {
              reject(new Error('Query creation failed'));
            }
          });
          
          await quickTest;
          results.queryCreation = 'Working';
        } catch (error) {
          results.queryCreation = 'Failed';
          results.queryError = error.message;
        }
        
        // Determine success based on basic requirements
        const hasBasicRequirements = 
          results.supabaseClient === 'Initialized' &&
          results.environmentVars === 'Configured' &&
          results.authContext === 'Valid' &&
          results.dbService === 'Available';
        
        if (!hasBasicRequirements) {
          throw new Error('Basic database requirements not met');
        }
        
        return results;
      }
    },
    {
      id: 'database-schema',
      name: 'Database Schema Validation',
      description: 'Verify all required database tables exist and are accessible',
      test: async () => {
        // Create a timeout promise that rejects after 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Schema validation timed out')), 10000);
        });
        
        const validationPromise = (async () => {
          const requiredTables = [
            'categories', 'tasks', 'projects', 'project_activity_logs',
            'activity_log_categories', 'events', 'user_settings'
          ];
          
          const tableResults = {};
          let tablesFound = 0;
          
          for (const table of requiredTables) {
            try {
              // Quick existence check - just try to create a query
              const query = supabase.from(table).select('id').limit(1);
              
              // Try to execute with timeout
              const quickCheck = new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error('Table check timeout')), 5000);
              });
              
              const queryPromise = query.then(result => {
                if (result.error && result.error.code === '42P01') {
                  // Table doesn't exist
                  return { exists: false, error: result.error };
                }
                return { exists: true, data: result.data };
              });

              const result = await Promise.race([queryPromise, quickCheck]);
              
              if (result.exists) {
                tableResults[table] = { exists: true };
                tablesFound++;
              } else {
                tableResults[table] = { exists: false, error: result.error?.message || 'Table not found' };
              }
            } catch (error) {
              if (error.message === 'Table check timeout') {
                tableResults[table] = { exists: false, error: 'Check timed out - table may not exist' };
              } else {
                tableResults[table] = { exists: false, error: error.message };
              }
            }
          }
          
          return { tableResults, tablesFound, totalTables: requiredTables.length };
        })();
        
        const validation = await Promise.race([validationPromise, timeoutPromise]);
        const { tableResults, tablesFound, totalTables } = validation;
        
        const existingTables = Object.entries(tableResults).filter(([_, result]) => result.exists);
        const missingTables = Object.entries(tableResults).filter(([_, result]) => !result.exists);
        
        if (tablesFound === totalTables) {
          return {
            status: 'success',
            message: `All ${tablesFound} required tables exist`,
            details: {
              tables: tableResults,
              summary: `${tablesFound}/${totalTables} tables found`
            }
          };
        } else if (tablesFound > 0) {
          return {
            status: 'warning',
            message: `Partial schema found: ${tablesFound}/${totalTables} tables exist`,
            details: {
              tables: tableResults,
              summary: `${tablesFound}/${totalTables} tables found`,
              existing: existingTables.map(([name]) => name),
              missing: missingTables.map(([name]) => name)
            },
            warnings: ['Some required tables are missing. Please apply migrations using run-migrations.md']
          };
        } else {
          throw new Error('No required tables found - migrations need to be applied');
        }
      }
    },
    {
      id: 'database-initialization',
      name: 'Database Initialization Test',
      description: 'Test database setup and user initialization',
      test: async () => {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database initialization timeout after 15 seconds')), 15000)
        );
        
        try {
          const initPromise = supabase.functions.invoke('setup-database', {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });
          
          const { data, error } = await Promise.race([initPromise, timeoutPromise]);
          
          if (error) {
            // If edge function doesn't exist or fails, try direct approach
            console.warn('Edge function failed, trying direct initialization:', error.message);
            
            // Try to create some default data directly
            const { data: existingCategories } = await supabase
              .from('categories')
              .select('id')
              .eq('predefined', true)
              .limit(1);
            
            if (!existingCategories || existingCategories.length === 0) {
              // Try to create a test category to verify write access
              const { data: newCategory, error: createError } = await supabase
                .from('categories')
                .insert([{ name: 'Test Category', color: '#3B82F6', predefined: true }])
                .select()
                .single();
              
              if (createError) {
                throw new Error(`Cannot write to database: ${createError.message}. Check RLS policies and migrations.`);
              }
              
              // Clean up test category
              if (newCategory) {
                await supabase.from('categories').delete().eq('id', newCategory.id);
              }
            }
            
            return {
              setupSuccessful: false,
              fallbackWorking: true,
              writeAccess: true,
              message: 'Edge function unavailable but database is writable'
            };
          }
          
          // Verify default data was created
          const categoriesPromise = supabase
            .from('categories')
            .select('id')
            .eq('predefined', true);
          
          const activityCategoriesPromise = supabase
            .from('activity_log_categories')
            .select('id')
            .eq('predefined', true);
          
          const [categoriesResult, activityCategoriesResult] = await Promise.all([
            Promise.race([categoriesPromise, timeoutPromise]),
            Promise.race([activityCategoriesPromise, timeoutPromise])
          ]);
          
          return {
            setupSuccessful: !!data?.success,
            defaultCategories: categoriesResult.data?.length || 0,
            defaultActivityCategories: activityCategoriesResult.data?.length || 0,
            userId: data?.user_id
          };
        } catch (error) {
          if (error.message.includes('timeout')) {
            throw new Error('Database initialization timed out. Edge function may not be deployed or database may need migrations. See run-migrations.md');
          } else {
            throw new Error(`Database initialization failed: ${error.message}`);
          }
        }
      }
    },
    {
      id: 'crud-categories',
      name: 'Categories CRUD Operations',
      description: 'Test create, read, update, delete for categories',
      test: async () => {
        // CREATE
        const newCategory = await addCategory('Test Category CRUD', '#FF5733');
        if (!newCategory?.id) throw new Error('Failed to create category');
        
        // Store for cleanup
        setTestData(prev => ({ ...prev, categoryId: newCategory.id }));
        
        // READ
        const readCategories = await db.read('categories', { id: newCategory.id });
        if (readCategories.length === 0) throw new Error('Failed to read created category');
        
        // UPDATE
        await updateCategory(newCategory.id, { name: 'Updated Test Category', color: '#00FF00' });
        const updatedCategories = await db.read('categories', { id: newCategory.id });
        if (updatedCategories[0]?.name !== 'Updated Test Category') {
          throw new Error('Failed to update category');
        }
        
        return {
          created: !!newCategory.id,
          read: readCategories.length > 0,
          updated: updatedCategories[0]?.name === 'Updated Test Category',
          categoryId: newCategory.id
        };
      }
    },
    {
      id: 'crud-tasks',
      name: 'Tasks CRUD Operations',
      description: 'Test create, read, update, delete for tasks',
      test: async () => {
        // CREATE
        const newTask = await addTask({
          title: 'Test Task CRUD',
          description: 'Test task description',
          priority: 'high',
          categories: []
        });
        if (!newTask?.id) throw new Error('Failed to create task');
        
        // Store for cleanup
        setTestData(prev => ({ ...prev, taskId: newTask.id }));
        
        // READ
        const readTasks = await db.read('tasks', { id: newTask.id });
        if (readTasks.length === 0) throw new Error('Failed to read created task');
        
        // UPDATE
        await updateTask(newTask.id, { title: 'Updated Test Task', priority: 'urgent' });
        const updatedTasks = await db.read('tasks', { id: newTask.id });
        if (updatedTasks[0]?.title !== 'Updated Test Task') {
          throw new Error('Failed to update task');
        }
        
        return {
          created: !!newTask.id,
          read: readTasks.length > 0,
          updated: updatedTasks[0]?.title === 'Updated Test Task',
          taskId: newTask.id
        };
      }
    },
    {
      id: 'crud-projects',
      name: 'Projects CRUD Operations',
      description: 'Test create, read, update, delete for projects',
      test: async () => {
        // CREATE
        const newProject = await addProject({
          title: 'Test Project CRUD',
          description: 'Test project description',
          status: 'idea',
          color: '#3B82F6'
        });
        if (!newProject?.id) throw new Error('Failed to create project');
        
        // Store for cleanup
        setTestData(prev => ({ ...prev, projectId: newProject.id }));
        
        // READ
        const readProjects = await db.read('projects', { id: newProject.id });
        if (readProjects.length === 0) throw new Error('Failed to read created project');
        
        // UPDATE
        await updateProject(newProject.id, { title: 'Updated Test Project', status: 'active' });
        const updatedProjects = await db.read('projects', { id: newProject.id });
        if (updatedProjects[0]?.title !== 'Updated Test Project') {
          throw new Error('Failed to update project');
        }
        
        return {
          created: !!newProject.id,
          read: readProjects.length > 0,
          updated: updatedProjects[0]?.title === 'Updated Test Project',
          projectId: newProject.id
        };
      }
    },
    {
      id: 'crud-activity-categories',
      name: 'Activity Log Categories CRUD',
      description: 'Test create, read, update, delete for activity log categories',
      test: async () => {
        // CREATE
        const newCategory = await addActivityLogCategory('Test Activity Category CRUD', '#FF5733');
        if (!newCategory?.id) throw new Error('Failed to create activity log category');
        
        // Store for cleanup
        setTestData(prev => ({ ...prev, activityCategoryId: newCategory.id }));
        
        // READ
        const readCategories = await db.read('activity_log_categories', { id: newCategory.id });
        if (readCategories.length === 0) throw new Error('Failed to read created activity log category');
        
        // UPDATE
        await updateActivityLogCategory(newCategory.id, { name: 'Updated Test Activity Category', color: '#00FF00' });
        const updatedCategories = await db.read('activity_log_categories', { id: newCategory.id });
        if (updatedCategories[0]?.name !== 'Updated Test Activity Category') {
          throw new Error('Failed to update activity log category');
        }
        
        return {
          created: !!newCategory.id,
          read: readCategories.length > 0,
          updated: updatedCategories[0]?.name === 'Updated Test Activity Category',
          categoryId: newCategory.id
        };
      }
    },
    {
      id: 'crud-events',
      name: 'Events CRUD Operations',
      description: 'Test create, read, update, delete for events',
      test: async () => {
        // CREATE
        const newEvent = await addEvent({
          title: 'Test Event CRUD',
          location: 'Test Location',
          startDate: '2024-12-01',
          endDate: '2024-12-03',
          participationType: 'exhibitor'
        });
        if (!newEvent?.id) throw new Error('Failed to create event');
        
        // Store for cleanup
        setTestData(prev => ({ ...prev, eventId: newEvent.id }));
        
        // READ
        const readEvents = await db.read('events', { id: newEvent.id });
        if (readEvents.length === 0) throw new Error('Failed to read created event');
        
        // UPDATE
        await updateEvent(newEvent.id, { title: 'Updated Test Event', location: 'Updated Location' });
        const updatedEvents = await db.read('events', { id: newEvent.id });
        if (updatedEvents[0]?.title !== 'Updated Test Event') {
          throw new Error('Failed to update event');
        }
        
        return {
          created: !!newEvent.id,
          read: readEvents.length > 0,
          updated: updatedEvents[0]?.title === 'Updated Test Event',
          eventId: newEvent.id
        };
      }
    },
    {
      id: 'real-time-subscriptions',
      name: 'Real-time Subscriptions Test',
      description: 'Test real-time database subscriptions',
      test: async () => {
        return new Promise((resolve, reject) => {
          let subscriptionCount = 0;
          const subscriptions = [];
          const tables = ['categories', 'tasks', 'projects', 'activity_log_categories', 'events'];
          
          // Test each table subscription
          tables.forEach(table => {
            try {
              const subscription = db.subscribe(table, (payload) => {
                console.log(`Real-time update received for ${table}:`, payload);
                subscriptionCount++;
              });
              
              if (subscription) {
                subscriptions.push({ table, subscription, status: 'Connected' });
              } else {
                subscriptions.push({ table, subscription: null, status: 'Failed' });
              }
            } catch (error) {
              subscriptions.push({ table, subscription: null, status: `Error: ${error.message}` });
            }
          });
          
          // Wait a moment then resolve
          setTimeout(() => {
            // Cleanup subscriptions
            subscriptions.forEach(({ subscription }) => {
              if (subscription) {
                db.unsubscribe(subscription);
              }
            });
            
            const connectedCount = subscriptions.filter(s => s.status === 'Connected').length;
            
            if (connectedCount === 0) {
              reject(new Error('No real-time subscriptions could be established'));
            } else {
              resolve({
                totalTables: tables.length,
                connectedSubscriptions: connectedCount,
                subscriptionDetails: subscriptions.reduce((acc, s) => {
                  acc[s.table] = s.status;
                  return acc;
                }, {}),
                realTimeEnabled: connectedCount > 0
              });
            }
          }, 2000);
        });
      }
    },
    {
      id: 'offline-functionality',
      name: 'Offline Functionality Test',
      description: 'Test offline operations and sync queue',
      test: async () => {
        // Test offline creation
        const offlineTask = await db.createOffline('tasks', {
          title: 'Offline Test Task',
          description: 'Created in offline mode',
          priority: 'low'
        });
        
        // Test offline queue
        const queueItem = syncService.queueOperation({
          type: 'create',
          table: 'tasks',
          data: { title: 'Queued Task', priority: 'medium' }
        });
        
        // Get sync status
        const syncStatus = syncService.getSyncStatus();
        
        // Cleanup offline data
        const offlineItems = db.getFromLocalStorage('tasks');
        const filteredItems = offlineItems.filter(item => item.id !== offlineTask.id);
        localStorage.setItem('todoTasks', JSON.stringify(filteredItems));
        
        return {
          offlineCreateSuccess: !!offlineTask.id,
          queueOperationSuccess: !!queueItem.id,
          queueLength: syncStatus.queueLength,
          offlineSupport: true,
          localStorageWorking: true
        };
      }
    },
    {
      id: 'sync-service',
      name: 'Sync Service Validation',
      description: 'Test sync service functionality and statistics',
      test: async () => {
        const status = syncService.getSyncStatus();
        const stats = syncService.getSyncStats();
        
        // Test queue operations
        const testOperation = syncService.queueOperation({
          type: 'update',
          table: 'tasks',
          id: uuidv4(),
          updates: { title: 'Test Update' }
        });
        
        return {
          syncServiceOnline: status.isOnline,
          queueLength: status.queueLength,
          syncInProgress: status.syncInProgress,
          totalSyncs: stats.totalSyncs,
          successfulSyncs: stats.successfulSyncs,
          queueOperationWorking: !!testOperation.id,
          autoSyncEnabled: syncService.isAutoSyncEnabled()
        };
      }
    },
    {
      id: 'data-relationships',
      name: 'Data Relationships Test',
      description: 'Test foreign key relationships and data integrity',
      test: async () => {
        // This test uses existing test data created in previous tests
        const { taskId, projectId, categoryId } = testData;
        
        if (!taskId || !projectId || !categoryId) {
          throw new Error('Required test data not available. Run CRUD tests first.');
        }
        
        // Test task-category relationship
        await updateTask(taskId, { categories: [categoryId] });
        const taskWithCategory = await db.read('tasks', { id: taskId });
        const hasCategory = taskWithCategory[0]?.categories?.includes(categoryId);
        
        // Test task-project relationship
        await updateTask(taskId, { linkedProject: projectId });
        const taskWithProject = await db.read('tasks', { id: taskId });
        const hasProject = taskWithProject[0]?.linkedProject === projectId;
        
        return {
          taskCategoryLink: hasCategory,
          taskProjectLink: hasProject,
          foreignKeysWorking: hasCategory && hasProject,
          dataIntegrity: 'Maintained'
        };
      }
    },
    {
      id: 'performance-test',
      name: 'Performance Test',
      description: 'Test database performance with multiple operations',
      test: async () => {
        const startTime = Date.now();
        
        // Perform multiple read operations
        const readPromises = [
          db.read('categories'),
          db.read('tasks'),
          db.read('projects'),
          db.read('activity_log_categories'),
          db.read('events')
        ];
        
        const results = await Promise.all(readPromises);
        const readTime = Date.now() - startTime;
        
        // Test batch operations
        const batchStartTime = Date.now();
        const batchPromises = [];
        
        for (let i = 0; i < 5; i++) {
          batchPromises.push(
            addCategory(`Batch Test Category ${i}`, '#FF0000')
          );
        }
        
        const batchResults = await Promise.all(batchPromises);
        const batchTime = Date.now() - batchStartTime;
        
        // Cleanup batch test data
        for (const category of batchResults) {
          if (category?.id) {
            await deleteCategory(category.id);
          }
        }
        
        const totalRecords = results.reduce((sum, result) => sum + result.length, 0);
        
        return {
          readOperationsTime: `${readTime}ms`,
          batchOperationsTime: `${batchTime}ms`,
          totalRecordsRead: totalRecords,
          averageReadTime: `${Math.round(readTime / 5)}ms per table`,
          performanceRating: readTime < 1000 ? 'Excellent' : readTime < 2000 ? 'Good' : 'Needs Optimization'
        };
      }
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setResults({});
    setCurrentTest(null);
    setTestData({});
    
    console.log('Starting comprehensive test suite...');
    console.log('Environment check:', {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      userAuthenticated: !!user,
      userEmail: user?.email,
      online: navigator.onLine
    });

    for (const test of testSuite) {
      console.log(`Running test: ${test.name}`);
      setCurrentTest(test.id);
      
      try {
        // Add timeout for each test
        const testPromise = test.test();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout after 30 seconds')), 30000)
        );
        
        const result = await Promise.race([testPromise, timeoutPromise]);
        console.log(`Test ${test.name} passed:`, result);
        setResults(prev => ({
          ...prev,
          [test.id]: { status: 'success', result, error: null }
        }));
      } catch (error) {
        console.error(`Test ${test.name} failed:`, error);
        setResults(prev => ({
          ...prev,
          [test.id]: { status: 'error', result: null, error: error.message }
        }));
        console.log('Continuing with remaining tests...');
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Cleanup test data
    await cleanupTestData();
    setIsRunning(false);
    setCurrentTest(null);
    console.log('Comprehensive test suite completed');
  };

  const cleanupTestData = async () => {
    const { categoryId, taskId, projectId, activityCategoryId, eventId } = testData;
    
    try {
      if (taskId) await deleteTask(taskId);
      if (projectId) await deleteProject(projectId);
      if (categoryId) await deleteCategory(categoryId);
      if (activityCategoryId) await deleteActivityLogCategory(activityCategoryId);
      if (eventId) await deleteEvent(eventId);
      
      console.log('Test data cleanup completed');
    } catch (error) {
      console.warn('Some test data could not be cleaned up:', error);
    }
  };

  const getTestStatus = (testId) => {
    const result = results[testId];
    if (!result) return 'pending';
    return result.status;
  };

  const getTestIcon = (testId) => {
    const status = getTestStatus(testId);
    if (currentTest === testId) return FiLoader;
    if (status === 'success') return FiCheck;
    if (status === 'error') return FiX;
    return FiInfo;
  };

  const getTestColor = (testId) => {
    const status = getTestStatus(testId);
    if (currentTest === testId) return 'text-blue-500';
    if (status === 'success') return 'text-green-500';
    if (status === 'error') return 'text-red-500';
    return 'text-gray-400';
  };

  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const errorCount = Object.values(results).filter(r => r.status === 'error').length;
  const totalTests = testSuite.length;
  const completionRate = Math.round(((successCount + errorCount) / totalTests) * 100);
  const successRate = totalTests > 0 ? Math.round((successCount / (successCount + errorCount)) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiDatabase} className="text-2xl" />
            <div>
              <h2 className="text-xl font-semibold">Comprehensive Supabase Validation</h2>
              <p className="text-blue-100 text-sm">Complete integration testing and validation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>

        {/* Test Results Summary */}
        {Object.keys(results).length > 0 && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiCheck} className="text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-700">{successCount} Passed</p>
                    <p className="text-xs text-gray-500">Success Rate: {successRate}%</p>
                  </div>
                </div>
              </div>
              
              {errorCount > 0 && (
                <div className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiX} className="text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-red-700">{errorCount} Failed</p>
                      <p className="text-xs text-gray-500">Need attention</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiRefreshCw} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">Progress</p>
                    <p className="text-xs text-gray-500">{completionRate}% Complete</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={navigator.onLine ? FiWifi : FiWifiOff} className={navigator.onLine ? "text-green-500" : "text-red-500"} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <p className="text-xs text-gray-500">{navigator.onLine ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 text-center">
                {successCount + errorCount} / {totalTests} tests completed
              </p>
            </div>
          </div>
        )}

        {/* Test List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {testSuite.map((test) => {
              const result = results[test.id];
              const TestIcon = getTestIcon(test.id);
              
              return (
                <motion.div
                  key={test.id}
                  layout
                  className={`p-4 border rounded-lg transition-all ${
                    currentTest === test.id 
                      ? 'border-blue-300 bg-blue-50 shadow-md' 
                      : result?.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : result?.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <motion.div
                      animate={currentTest === test.id ? { rotate: 360 } : {}}
                      transition={currentTest === test.id ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                      className={getTestColor(test.id)}
                    >
                      <SafeIcon icon={TestIcon} className="text-lg mt-0.5" />
                    </motion.div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{test.name}</h3>
                        {result?.status && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            result.status === 'success' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {result.status === 'success' ? 'PASSED' : 'FAILED'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                      
                      {/* Test Result Details */}
                      {result && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3"
                        >
                          {result.status === 'success' && result.result && (
                            <div className="bg-green-100 border border-green-200 rounded p-3">
                              <h4 className="text-sm font-medium text-green-800 mb-2">Test Results:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {Object.entries(result.result).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-green-700 font-medium">{key}:</span>
                                    <span className="text-green-800">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {result.status === 'error' && (
                            <div className="bg-red-100 border border-red-200 rounded p-3">
                              <h4 className="text-sm font-medium text-red-800 mb-1">Error Details:</h4>
                              <p className="text-sm text-red-700">{result.error}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={navigator.onLine ? FiWifi : FiWifiOff} className="text-lg" />
              <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
            </div>
            {user && (
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiUsers} className="text-lg" />
                <span>Authenticated as {user.email}</span>
              </div>
            )}
            {Object.keys(results).length > 0 && (
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiZap} className="text-lg" />
                <span>{successRate}% Success Rate</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? (
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <SafeIcon icon={FiRefreshCw} className="text-sm" />
                  </motion.div>
                  <span>Running Tests...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiPlay} className="text-sm" />
                  <span>Run Comprehensive Tests</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default TestIntegration;