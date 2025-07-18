import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import CategoryManager from './CategoryManager';
import ActivityLogCategoryManager from './ActivityLogCategoryManager';
import DataManager from '../components/DataManager';
import TestIntegration from '../components/TestIntegration';
import SyncSettingsModal from '../components/SyncSettingsModal';

const { 
  FiSettings, FiLock, FiTag, FiDatabase, FiEye, FiEyeOff, FiCheck, FiX, 
  FiKey, FiShield, FiMessageSquare, FiRefreshCw 
} = FiIcons;

function Settings() {
  const [activeTab, setActiveTab] = useState('password');
  const [showDataManager, setShowDataManager] = useState(false);
  const [showTestIntegration, setShowTestIntegration] = useState(false);
  const [showSyncSettings, setShowSyncSettings] = useState(false);

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Get current password from localStorage or use default
  const getCurrentPassword = () => {
    return localStorage.getItem('todoAppPassword') || 'todo2024';
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Simulate delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate current password
    if (currentPassword !== getCurrentPassword()) {
      setPasswordError('Current password is incorrect.');
      setIsChangingPassword(false);
      return;
    }

    // Validate new password
    if (newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      setIsChangingPassword(false);
      return;
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setIsChangingPassword(false);
      return;
    }

    // Check if new password is different from current
    if (newPassword === getCurrentPassword()) {
      setPasswordError('New password must be different from current password.');
      setIsChangingPassword(false);
      return;
    }

    // Save new password
    localStorage.setItem('todoAppPassword', newPassword);
    setPasswordSuccess('Password changed successfully!');

    // Clear form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);

    // Clear success message after 3 seconds
    setTimeout(() => {
      setPasswordSuccess('');
    }, 3000);
  };

  const clearPasswordMessages = () => {
    setPasswordError('');
    setPasswordSuccess('');
  };

  const tabs = [
    { id: 'password', label: 'Password', icon: FiLock },
    { id: 'categories', label: 'Task Categories', icon: FiTag },
    { id: 'activityCategories', label: 'Activity Categories', icon: FiMessageSquare },
    { id: 'data', label: 'Data Management', icon: FiDatabase },
    { id: 'sync', label: 'Sync Settings', icon: FiRefreshCw },
    { id: 'testing', label: 'Integration Tests', icon: FiSettings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your application settings and preferences</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-4 px-1 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={tab.icon} className="text-lg" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="max-w-md">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <SafeIcon icon={FiShield} className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                      <p className="text-sm text-gray-600">Update your application password</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            clearPasswordMessages();
                          }}
                          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter current password"
                          required
                          disabled={isChangingPassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          disabled={isChangingPassword}
                        >
                          <SafeIcon icon={showCurrentPassword ? FiEyeOff : FiEye} className="text-lg" />
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <SafeIcon icon={FiKey} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            clearPasswordMessages();
                          }}
                          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new password"
                          required
                          minLength={4}
                          disabled={isChangingPassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          disabled={isChangingPassword}
                        >
                          <SafeIcon icon={showNewPassword ? FiEyeOff : FiEye} className="text-lg" />
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <SafeIcon icon={FiKey} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            clearPasswordMessages();
                          }}
                          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Confirm new password"
                          required
                          disabled={isChangingPassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          disabled={isChangingPassword}
                        >
                          <SafeIcon icon={showConfirmPassword ? FiEyeOff : FiEye} className="text-lg" />
                        </button>
                      </div>
                    </div>

                    {/* Error/Success Messages */}
                    <AnimatePresence>
                      {passwordError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
                        >
                          <SafeIcon icon={FiX} className="text-sm flex-shrink-0" />
                          <span className="text-sm">{passwordError}</span>
                        </motion.div>
                      )}
                      {passwordSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700"
                        >
                          <SafeIcon icon={FiCheck} className="text-sm flex-shrink-0" />
                          <span className="text-sm">{passwordSuccess}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className={`w-full py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                        isChangingPassword || !currentPassword || !newPassword || !confirmPassword
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {isChangingPassword ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Changing Password...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <SafeIcon icon={FiCheck} className="text-lg" />
                          <span>Change Password</span>
                        </div>
                      )}
                    </button>
                  </form>

                  {/* Password Requirements */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Minimum 4 characters</li>
                      <li>• Must be different from current password</li>
                      <li>• Can contain letters, numbers, and special characters</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CategoryManager />
              </motion.div>
            )}

            {activeTab === 'activityCategories' && (
              <motion.div
                key="activityCategories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ActivityLogCategoryManager />
              </motion.div>
            )}

            {activeTab === 'data' && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <SafeIcon icon={FiDatabase} className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Data Management</h3>
                      <p className="text-sm text-gray-600">Export and import your tasks, categories, and projects</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDataManager(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiDatabase} className="text-lg" />
                    <span>Open Data Manager</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'sync' && (
              <motion.div
                key="sync"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <SafeIcon icon={FiRefreshCw} className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Sync Settings</h3>
                      <p className="text-sm text-gray-600">Configure how your data syncs across devices</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Sync Features:</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Real-time synchronization across all devices</li>
                      <li>• Automatic conflict resolution</li>
                      <li>• Offline queue for when you're disconnected</li>
                      <li>• Customizable sync intervals and preferences</li>
                      <li>• Detailed sync statistics and monitoring</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => setShowSyncSettings(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiRefreshCw} className="text-lg" />
                    <span>Open Sync Settings</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'testing' && (
              <motion.div
                key="testing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <SafeIcon icon={FiSettings} className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Integration Testing</h3>
                      <p className="text-sm text-gray-600">Test Supabase connectivity and data operations</p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Test Coverage:</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Authentication status and session validation</li>
                      <li>• Database connection and user permissions</li>
                      <li>• CRUD operations (Create, Read, Update, Delete)</li>
                      <li>• Offline functionality and sync queue</li>
                      <li>• Real-time subscriptions and updates</li>
                      <li>• Error handling and fallback mechanisms</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => setShowTestIntegration(true)}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <SafeIcon icon={FiSettings} className="text-lg" />
                    <span>Run Integration Tests</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Data Manager Modal */}
      <DataManager
        isOpen={showDataManager}
        onClose={() => setShowDataManager(false)}
      />

      {/* Test Integration Modal */}
      {showTestIntegration && (
        <TestIntegration
          onClose={() => setShowTestIntegration(false)}
        />
      )}

      {/* Sync Settings Modal */}
      <SyncSettingsModal
        isOpen={showSyncSettings}
        onClose={() => setShowSyncSettings(false)}
      />
    </div>
  );
}

export default Settings;