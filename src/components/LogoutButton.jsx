import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiLogOut, FiAlertTriangle } = FiIcons;

function LogoutButton({ onLogout }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    // Clear authentication
    sessionStorage.removeItem('todoAppAuthenticated');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    onLogout();
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    handleLogout();
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        title="Logout"
      >
        <SafeIcon icon={FiLogOut} className="text-sm" />
        <span>Logout</span>
      </button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <SafeIcon icon={FiAlertTriangle} className="text-red-600 text-2xl" />
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Are you sure you want to logout? You'll need to enter the password again to access the application.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default LogoutButton;