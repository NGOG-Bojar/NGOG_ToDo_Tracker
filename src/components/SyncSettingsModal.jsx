import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { syncService } from '../services/syncService';
import { format } from 'date-fns';

const { 
  FiX, FiSettings, FiClock, FiWifi, FiDatabase, FiBarChart3, 
  FiRefreshCw, FiCheck, FiAlertTriangle, FiInfo 
} = FiIcons;

function SyncSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 30000,
    enableRealtime: true,
    enableConflictResolution: true,
    maxRetries: 3
  });
  const [stats, setStats] = useState({});
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadStats();
    }
  }, [isOpen]);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('syncSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const loadStats = () => {
    const syncStats = syncService.getSyncStats();
    setStats(syncStats);
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('syncSettings', JSON.stringify(newSettings));
    
    // Apply settings to sync service
    if (key === 'autoSync') {
      syncService.setAutoSync(value);
    } else if (key === 'syncInterval') {
      syncService.setSyncInterval(value);
    }
  };

  const resetStats = async () => {
    setIsResetting(true);
    
    // Clear all sync statistics
    const statKeys = [
      'totalSyncs', 'successfulSyncs', 'failedSyncs', 
      'lastSyncDuration', 'averageSyncTime'
    ];
    
    statKeys.forEach(key => localStorage.removeItem(key));
    
    // Reload stats
    setTimeout(() => {
      loadStats();
      setIsResetting(false);
    }, 500);
  };

  const clearOfflineQueue = () => {
    if (window.confirm('Are you sure you want to clear all pending sync operations? This cannot be undone.')) {
      syncService.clearOfflineQueue();
      loadStats();
    }
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getSuccessRate = () => {
    if (stats.totalSyncs === 0) return 0;
    return Math.round((stats.successfulSyncs / stats.totalSyncs) * 100);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiSettings} className="text-2xl" />
              <div>
                <h2 className="text-xl font-semibold">Sync Settings</h2>
                <p className="text-blue-100 text-sm">Configure synchronization preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Sync Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Synchronization</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Auto-sync</h4>
                      <p className="text-sm text-gray-600">Automatically sync changes in the background</p>
                    </div>
                    <button
                      onClick={() => updateSetting('autoSync', !settings.autoSync)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.autoSync ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.autoSync ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Real-time updates</h4>
                      <p className="text-sm text-gray-600">Receive live updates from other devices</p>
                    </div>
                    <button
                      onClick={() => updateSetting('enableRealtime', !settings.enableRealtime)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.enableRealtime ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.enableRealtime ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Conflict resolution</h4>
                      <p className="text-sm text-gray-600">Show UI when sync conflicts occur</p>
                    </div>
                    <button
                      onClick={() => updateSetting('enableConflictResolution', !settings.enableConflictResolution)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.enableConflictResolution ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.enableConflictResolution ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sync interval</h4>
                    <select
                      value={settings.syncInterval}
                      onChange={(e) => updateSetting('syncInterval', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5000}>5 seconds</option>
                      <option value={10000}>10 seconds</option>
                      <option value={30000}>30 seconds</option>
                      <option value={60000}>1 minute</option>
                      <option value={300000}>5 minutes</option>
                      <option value={600000}>10 minutes</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Max retry attempts</h4>
                    <select
                      value={settings.maxRetries}
                      onChange={(e) => updateSetting('maxRetries', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 retry</option>
                      <option value={3}>3 retries</option>
                      <option value={5}>5 retries</option>
                      <option value={10}>10 retries</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sync Statistics */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
                  <button
                    onClick={resetStats}
                    disabled={isResetting}
                    className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                  >
                    {isResetting ? 'Resetting...' : 'Reset Stats'}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiRefreshCw} className="text-blue-600" />
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Total Syncs</p>
                        <p className="text-lg font-bold text-blue-800">{stats.totalSyncs || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiCheck} className="text-green-600" />
                      <div>
                        <p className="text-xs text-green-600 font-medium">Success Rate</p>
                        <p className="text-lg font-bold text-green-800">{getSuccessRate()}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiClock} className="text-yellow-600" />
                      <div>
                        <p className="text-xs text-yellow-600 font-medium">Avg Time</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {formatDuration(stats.averageSyncTime || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiAlertTriangle} className="text-red-600" />
                      <div>
                        <p className="text-xs text-red-600 font-medium">Failed</p>
                        <p className="text-lg font-bold text-red-800">{stats.failedSyncs || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {stats.lastSyncDuration && (
                  <div className="mt-4 text-sm text-gray-600">
                    Last sync took {formatDuration(stats.lastSyncDuration)}
                  </div>
                )}
              </div>

              {/* Queue Management */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Management</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Offline Queue</h4>
                      <p className="text-sm text-gray-600">
                        {syncService.getSyncStatus().queueLength} operations pending
                      </p>
                    </div>
                    <button
                      onClick={clearOfflineQueue}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear Queue
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="border-t pt-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <SafeIcon icon={FiInfo} className="text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">How Sync Works</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Changes are synced automatically when online</li>
                        <li>• Offline changes are queued and synced when reconnected</li>
                        <li>• Real-time updates appear instantly across devices</li>
                        <li>• Conflicts are resolved through user-friendly dialogs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SyncSettingsModal;