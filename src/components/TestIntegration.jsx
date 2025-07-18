import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useCategory } from '../contexts/CategoryContext';
import { useProject } from '../contexts/ProjectContext';
import { db } from '../services/database';
import { syncService } from '../services/syncService';
import { supabase } from '../lib/supabase';

const { 
  FiCheck, FiX, FiLoader, FiDatabase, FiWifi, FiWifiOff, 
  FiRefreshCw, FiAlertTriangle, FiInfo, FiPlay, FiPause 
} = FiIcons;

function TestIntegration({ onClose }) {
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState({});
  
  const { user, session } = useAuth();
  const { addTask, tasks } = useTask();
  const { addCategory, categories } = useCategory();
  const { addProject, projects } = useProject();

  const testSuite = [
    {
      id: 'auth-check',
      name: 'Authentication Status',
      description: 'Verify user authentication and session',
      test: async () => {
        if (!user || !session) {
          throw new Error('User not authenticated');
        }
        return { user: user.email, sessionValid: !!session.access_token };
      }
    },
    {
      id: 'database-connection',
      name: 'Database Connection',
      description: 'Test connection to Supabase',
      test: async () => {
        try {
          console.log('Testing read operations...');
          console.log('Testing project creation...');
          console.log('Testing task creation...');
          console.log('Testing category creation...');
          console.log('Testing database connection...');
          
          // Test basic Supabase connection
          const { data, error } = await supabase.from('categories').select('count').limit(1);
          console.log('Supabase query result:', { data, error });
          
          console.log('Category created:', testCategory);
          console.log('Task created:', testTask);
          console.log('Project created:', testProject);
          if (error) {
            throw new Error(`Supabase connection failed: ${error.message}`);
          }
          
          const isAuth = await db.isAuthenticated();
          console.log('Authentication check:', isAuth);
          
          const currentUser = await db.getCurrentUser();
          console.log('Current user:', currentUser?.email);
          
          console.log('Tasks data:', tasksData);
          return { 
          console.log('Categories data:', categoriesData);
            supabaseConnected: !error,
          console.log('Projects data:', projectsData);
            authenticated: isAuth, 
            userEmail: currentUser?.email,
            online: navigator.onLine,
            hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
            hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
          };
        } catch (error) {
          console.error('Read operations test error:', error);
          throw error;
        } catch (error) {
          console.error('Database connection test error:', error);
          throw error;
        } catch (error) {
          console.error('Category creation test error:', error);
          throw error;
        } catch (error) {
          console.error('Task creation test error:', error);
          throw error;
        } catch (error) {
          console.error('Project creation test error:', error);
          throw error;
        }
      }
    },
    {
      id: 'create-category',
      name: 'Create Category',
      description: 'Test creating a new category',
      test: async () => {
        const testCategory = await addCategory('Test Category', '#FF5733');
        if (!testCategory || !testCategory.id) {
          throw new Error('Failed to create category');
        }
        return { categoryId: testCategory.id, name: testCategory.name };
      }
    },
    {
      id: 'create-task',
      name: 'Create Task',
      description: 'Test creating a new task',
      test: async () => {
        const testTask = await addTask({
          title: 'Test Task',
          description: 'This is a test task',
          priority: 'medium',
          categories: []
        });
        if (!testTask || !testTask.id) {
          throw new Error('Failed to create task');
        }
        return { taskId: testTask.id, title: testTask.title };
      }
    },
    {
      id: 'create-project',
      name: 'Create Project',
      description: 'Test creating a new project',
      test: async () => {
        const testProject = await addProject({
          title: 'Test Project',
          description: 'This is a test project',
          status: 'idea',
          color: '#3B82F6'
        });
        if (!testProject || !testProject.id) {
          throw new Error('Failed to create project');
        }
        return { projectId: testProject.id, title: testProject.title };
      }
    },
    {
      id: 'read-operations',
      name: 'Read Operations',
      description: 'Test reading data from database',
      test: async () => {
        const tasksData = await db.read('tasks');
        const categoriesData = await db.read('categories');
        const projectsData = await db.read('projects');
        
        return {
          tasksCount: tasksData.length,
          categoriesCount: categoriesData.length,
          projectsCount: projectsData.length
        };
      }
    },
    {
      id: 'sync-status',
      name: 'Sync Service',
      description: 'Test sync service functionality',
      test: async () => {
        const status = syncService.getSyncStatus();
        return {
          isOnline: status.isOnline,
          queueLength: status.queueLength,
          syncInProgress: status.syncInProgress
        };
      }
    },
    {
      id: 'offline-simulation',
      name: 'Offline Mode Test',
      description: 'Test offline functionality',
      test: async () => {
        // Simulate offline operation
        const originalOnline = navigator.onLine;
        
        // Create offline operation
        const offlineTask = await db.createOffline('tasks', {
          title: 'Offline Test Task',
          description: 'Created while offline',
          priority: 'low'
        });
        
        return {
          offlineTaskId: offlineTask.id,
          hasLocalId: !!offlineTask.local_id,
          originalOnlineStatus: originalOnline
        };
      }
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setResults({});
    setCurrentTest(null);
    
    console.log('Starting test suite...');
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
        const result = await test.test();
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
      }
      
      // Small delay between tests for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setCurrentTest(null);
    setIsRunning(false);
    console.log('Test suite completed');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiDatabase} className="text-2xl" />
            <div>
              <h2 className="text-xl font-semibold">Supabase Integration Test</h2>
              <p className="text-blue-100 text-sm">Testing database connectivity and operations</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiCheck} className="text-green-500" />
                  <span className="text-sm font-medium text-green-700">{successCount} Passed</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiX} className="text-red-500" />
                    <span className="text-sm font-medium text-red-700">{errorCount} Failed</span>
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  {successCount + errorCount} / {totalTests} completed
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((successCount + errorCount) / totalTests) * 100}%` }}
                />
              </div>
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
                  className={`p-4 border rounded-lg ${
                    currentTest === test.id 
                      ? 'border-blue-300 bg-blue-50' 
                      : result?.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : result?.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white'
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
                      <h3 className="font-medium text-gray-900">{test.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                      
                      {/* Test Result Details */}
                      {result && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3"
                        >
                          {result.status === 'success' && result.result && (
                            <div className="bg-green-100 border border-green-200 rounded p-2">
                              <pre className="text-xs text-green-800 whitespace-pre-wrap">
                                {JSON.stringify(result.result, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {result.status === 'error' && (
                            <div className="bg-red-100 border border-red-200 rounded p-2">
                              <p className="text-sm text-red-800">{result.error}</p>
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
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <SafeIcon icon={navigator.onLine ? FiWifi : FiWifiOff} className="text-lg" />
            <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
            {user && (
              <>
                <span>•</span>
                <span>Authenticated as {user.email}</span>
              </>
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
                  <span>Run All Tests</span>
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