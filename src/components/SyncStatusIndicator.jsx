import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const { FiWifi, FiWifiOff, FiCloud, FiCloudOff, FiCheck, FiAlertTriangle, FiRefreshCw } = FiIcons;

function SyncStatusIndicator() {
  const { user, session } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    return 'Online';
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center space-x-2 bg-white rounded-full shadow-lg border px-3 py-2 ${getStatusColor()}`}
      >
        <motion.div
          animate={syncStatus === 'syncing' ? { rotate: 360 } : {}}
          transition={syncStatus === 'syncing' ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          <SafeIcon icon={StatusIcon} className="text-sm" />
        </motion.div>
        <span className="text-xs font-medium">{getStatusText()}</span>
        {lastSyncTime && syncStatus === 'success' && (
          <span className="text-xs text-gray-400">
            {new Date(lastSyncTime).toLocaleTimeString()}
          </span>
        )}
      </motion.div>
    </div>
  );
}

export default SyncStatusIndicator;