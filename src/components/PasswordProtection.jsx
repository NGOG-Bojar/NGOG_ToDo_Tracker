import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiLock, FiEye, FiEyeOff, FiShield, FiCheck, FiX } = FiIcons;

function PasswordProtection({ onAuthenticate }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [urlPassword, setUrlPassword] = useState('');

  // Get password from localStorage or use default
  const getCorrectPassword = () => {
    return localStorage.getItem('todoAppPassword') || 'todo2024';
  };

  useEffect(() => {
    // Check URL parameters for password
    const urlParams = new URLSearchParams(window.location.search);
    const passwordFromUrl = urlParams.get('password') || urlParams.get('p');
    
    if (passwordFromUrl) {
      setUrlPassword(passwordFromUrl);
      // Auto-authenticate if URL password is correct
      if (passwordFromUrl === getCorrectPassword()) {
        onAuthenticate(true);
        return;
      }
    }

    // Check if user is already authenticated (session storage)
    const isAuthenticated = sessionStorage.getItem('todoAppAuthenticated');
    if (isAuthenticated === 'true') {
      onAuthenticate(true);
    }
  }, [onAuthenticate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === getCorrectPassword()) {
      // Store authentication in session storage
      sessionStorage.setItem('todoAppAuthenticated', 'true');
      onAuthenticate(true);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
    
    setIsLoading(false);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <SafeIcon icon={FiShield} className="text-3xl" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">NGOG ToDo Tracker</h1>
          <p className="text-blue-100 text-center mt-2">
            Enter password to access your tasks
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <SafeIcon 
                  icon={FiLock} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    error 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="text-lg" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
                >
                  <SafeIcon icon={FiX} className="text-sm flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* URL Password Info */}
            {urlPassword && urlPassword !== getCorrectPassword() && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700"
              >
                <SafeIcon icon={FiLock} className="text-sm flex-shrink-0" />
                <span className="text-sm">
                  Password provided in URL is incorrect. Please enter the correct password.
                </span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                isLoading || !password.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <SafeIcon icon={FiCheck} className="text-lg" />
                  <span>Access Application</span>
                </div>
              )}
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Access Options:
              </h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Enter password manually above</li>
                <li>• Use URL parameter: <code className="bg-blue-100 px-1 rounded">?password=your_password</code></li>
                <li>• Use short URL parameter: <code className="bg-blue-100 px-1 rounded">?p=your_password</code></li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default PasswordProtection;