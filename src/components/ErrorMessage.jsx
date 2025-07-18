import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiAlertTriangle, FiX, FiRefreshCw } = FiIcons;

function ErrorMessage({ error, onDismiss, onRetry, className = '' }) {
  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start space-x-3">
          <SafeIcon icon={FiAlertTriangle} className="text-red-600 text-lg flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-800">
              Something went wrong
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {typeof error === 'string' ? error : error.message || 'An unexpected error occurred'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Retry"
              >
                <SafeIcon icon={FiRefreshCw} className="text-sm" />
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Dismiss"
              >
                <SafeIcon icon={FiX} className="text-sm" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ErrorMessage;