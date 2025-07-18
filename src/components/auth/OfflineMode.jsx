import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SafeIcon from '../../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'
import AuthModal from './AuthModal'

const { FiWifiOff, FiCloud, FiX, FiInfo } = FiIcons

export default function OfflineMode({ children }) {
  const [showBanner, setShowBanner] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-3 shadow-md"
          >
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <SafeIcon icon={FiWifiOff} className="text-lg" />
                  <div>
                    <span className="font-medium">Offline Mode</span>
                    <span className="ml-2 text-gray-200">
                      Your data is stored locally on this device only.
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <SafeIcon icon={FiCloud} className="text-sm" />
                    <span>Enable Sync</span>
                  </button>
                  
                  <button
                    onClick={() => setShowBanner(false)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <SafeIcon icon={FiX} className="text-lg" />
                  </button>
                  <li>• Automatic backups</li>
                  <li>• Manual backups only</li>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Indicator in Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <SafeIcon icon={FiWifiOff} className="text-gray-400" />
              <span>Offline Mode Active</span>
            </div>
            
            {!showBanner && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Enable Cloud Sync
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main App Content */}
      {children}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signin"
      />

      {/* Offline Info Modal - Could be triggered by a help button */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg max-w-xs">
          <div className="flex items-start space-x-2">
            <SafeIcon icon={FiInfo} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium mb-1">Offline Mode</p>
              <p className="text-gray-300">
                Your tasks are saved locally. Create an account to sync across devices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}