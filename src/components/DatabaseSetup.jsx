import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const { FiDatabase, FiCheck, FiAlertTriangle, FiLoader, FiPlay } = FiIcons;

function DatabaseSetup({ onComplete }) {
  const [isSetupRunning, setIsSetupRunning] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null); // 'success', 'error', null
  const [setupMessage, setSetupMessage] = useState('');
  const { session } = useAuth();

  const runDatabaseSetup = async () => {
    setIsSetupRunning(true);
    setSetupStatus(null);
    setSetupMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-database`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSetupStatus('success');
        setSetupMessage('Database setup completed successfully!');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setSetupStatus('error');
        setSetupMessage(result.error || 'Setup failed');
      }
    } catch (error) {
      setSetupStatus('error');
      setSetupMessage('Failed to connect to setup service');
    } finally {
      setIsSetupRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <SafeIcon icon={FiDatabase} className="text-3xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">Database Setup</h1>
          <p className="text-blue-100 text-center mt-2">
            Initialize your personal workspace
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              We need to set up your personal database tables and default categories.
            </p>

            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="text-sm font-medium text-blue-900 mb-2">This will create:</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Your personal task and project tables</li>
                <li>• Default categories (Work, Personal, Urgent, Ideas)</li>
                <li>• Activity log categories</li>
                <li>• Security policies for data protection</li>
                <li>• Performance optimizations</li>
              </ul>
            </div>

            {/* Setup Button */}
            <button
              onClick={runDatabaseSetup}
              disabled={isSetupRunning || setupStatus === 'success'}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                isSetupRunning || setupStatus === 'success'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isSetupRunning ? (
                <div className="flex items-center justify-center space-x-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <SafeIcon icon={FiLoader} className="text-lg" />
                  </motion.div>
                  <span>Setting up database...</span>
                </div>
              ) : setupStatus === 'success' ? (
                <div className="flex items-center justify-center space-x-2">
                  <SafeIcon icon={FiCheck} className="text-lg" />
                  <span>Setup Complete!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <SafeIcon icon={FiPlay} className="text-lg" />
                  <span>Initialize Database</span>
                </div>
              )}
            </button>

            {/* Status Messages */}
            <AnimatePresence>
              {setupMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-lg border ${
                    setupStatus === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <SafeIcon 
                      icon={setupStatus === 'success' ? FiCheck : FiAlertTriangle} 
                      className="text-sm flex-shrink-0" 
                    />
                    <span className="text-sm">{setupMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {setupStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-500"
              >
                Redirecting to your dashboard...
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default DatabaseSetup;