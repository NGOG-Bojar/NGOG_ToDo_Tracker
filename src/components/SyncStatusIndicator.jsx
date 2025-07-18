import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { syncService } from '../services/syncService';
import { format } from 'date-fns';

const { 
  FiWifi, FiWifiOff, FiCloud, FiCloudOff, FiCheck, FiAlertTriangle, 
  FiRefreshCw, FiSettings, FiX, FiInfo, FiClock 
} = FiIcons;

function SyncStatusIndicator() {
  const { user, session } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [queueLength, setQueueLength] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncInterval: 30000, // 30 seconds
    enableRealtime: true
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update sync status periodically
    const updateSyncStatus = () => {
      const status = syncService.getSyncStatus();
      setQueueLength(status.queueLength);
      setLastSyncTime(status.lastSync);
      
      // Auto-sync if enabled and online
      if (syncSettings.autoSync && isOnline && user && status.queueLength > 0) {
        handleAutoSync();
      }
    };

    const interval = setInterval(updateSyncStatus, syncSettings.syncInterval);
    updateSyncStatus(); // Initial update

    // Load sync settings
    const savedSettings = localStorage.getItem('syncSettings');
    if (savedSettings) {
      setSyncSettings(JSON.parse(savedSettings));
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncSettings.syncInterval, syncSettings.autoSync, isOnline, user]);

  // Auto-sync handler
  const handleAutoSync = async () => {
    if (syncStatus === 'syncing') return; // Prevent multiple syncs
    
    try {
      await syncService.processPendingOperations();
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  };
  // Manual sync handler
  const handleManualSync = async () => {
    if (!isOnline || !user) return;
    
    setSyncStatus('syncing');
    try {
      await syncService.manualSync();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('Manual sync error:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Save sync settings
  const updateSyncSettings = (newSettings) => {
    const updated = { ...syncSettings, ...newSettings };
    setSyncSettings(updated);
    localStorage.setItem('syncSettings', JSON.stringify(updated));
  };
  // Don't show indicator if user is not authenticated
  if (!user || !session) {
    return null;
  }

  const getStatusIcon = () => {
    if (!isOnline) return FiWifiOff;
    if (syncStatus === 'syncing') return FiRefreshCw;
    if (syncStatus === 'error') return FiAlertTriangle;
    if (syncStatus === 'success') return FiCheck;
    return FiCloud;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (syncStatus === 'syncing') return 'text-blue-500';
    if (syncStatus === 'error') return 'text-red-500';
    if (syncStatus === 'success') return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus === 'syncing') return 'Syncing...';
    if (syncStatus === 'error') return 'Sync Error';
    if (syncStatus === 'success') return 'Synced';
    if (queueLength > 0) return `${queueLength} pending`;
    return 'Online';
  };

  const StatusIcon = getStatusIcon();

  return (
    <>
      <div className="fixed bottom-4 left-4 z-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center space-x-2 bg-white rounded-full shadow-lg border px-3 py-2 ${getStatusColor()}`}
        >
          <button
            onClick={handleManualSync}
            className="flex items-center space-x-2 hover:bg-gray-50 rounded-full p-1 transition-colors"
            title={isOnline && user ? 'Click to sync now' : undefined}
          >
            <motion.div
              animate={syncStatus === 'syncing' ? { rotate: 360 } : {}}
              transition={syncStatus === 'syncing' ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            >
              <SafeIcon icon={StatusIcon} className="text-sm" />
            </motion.div>
            <span className="text-xs font-medium">{getStatusText()}</span>
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 hover:bg-gray-50 rounded-full transition-colors"
            title="Sync settings"
          >
            <SafeIcon icon={FiSettings} className="text-xs text-gray-400" />
          </button>
          
          {queueLength > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
              {queueLength}
            </span>
          )}
        </motion.div>
        
        {/* Sync Details Panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border p-4 w-80"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Sync Status</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="text-sm" />
                </button>
              </div>
              
              {/* Status Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Connection:</span>
                  <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Queue:</span>
                  <span className="font-medium text-gray-900">
                    {queueLength} pending operations
                  </span>
                </div>
                
                {lastSyncTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Sync:</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(lastSyncTime), 'HH:mm:ss')}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Sync Settings */}
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Auto-sync</span>
                  <button
                    onClick={() => updateSyncSettings({ autoSync: !syncSettings.autoSync })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      syncSettings.autoSync ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        syncSettings.autoSync ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Real-time updates</span>
                  <button
                    onClick={() => updateSyncSettings({ enableRealtime: !syncSettings.enableRealtime })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      syncSettings.enableRealtime ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        syncSettings.enableRealtime ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Sync Interval</label>
                  <select
                    value={syncSettings.syncInterval}
                    onChange={(e) => updateSyncSettings({ syncInterval: parseInt(e.target.value) })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={10000}>10 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={300000}>5 minutes</option>
                  </select>
                </div>
              </div>
              
              {/* Manual Sync Button */}
              <button
                onClick={handleManualSync}
                disabled={!isOnline || syncStatus === 'syncing'}
                className={`w-full mt-4 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  !isOnline || syncStatus === 'syncing'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default SyncStatusIndicator;