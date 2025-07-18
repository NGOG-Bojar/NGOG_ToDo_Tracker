import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from './AuthModal'
import LoadingSpinner from './LoadingSpinner'
import OfflineMode from './OfflineMode'
import DatabaseSetup from '../DatabaseSetup'

export default function AuthGuard({ children }) {
  const { user, loading, session } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [useOfflineMode, setUseOfflineMode] = useState(false)
  const [needsDatabaseSetup, setNeedsDatabaseSetup] = useState(false)
  const [checkingDatabase, setCheckingDatabase] = useState(false)

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />
  }

  // If user is authenticated and session is valid, check database setup
  if (user && session) {
    // Check if database is set up (you can implement this check)
    if (needsDatabaseSetup) {
      return (
        <DatabaseSetup 
          onComplete={() => setNeedsDatabaseSetup(false)} 
        />
      )
    }
    return children
  }

  // If user chose offline mode, show the app with offline functionality
  if (useOfflineMode) {
    return <OfflineMode>{children}</OfflineMode>
  }

  // Show authentication options
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <div className="bg-white bg-opacity-20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">NGOG ToDo Tracker</h1>
          <p className="text-blue-100">
            Organize your tasks and sync across devices
          </p>
        </div>

        {/* Options */}
        <div className="p-8 space-y-4">
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Sign In / Create Account
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <button
            onClick={() => setUseOfflineMode(true)}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Continue Offline
          </button>

          {/* Benefits */}
          <div className="mt-8 space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                ☁️ With Account (Recommended)
              </h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Sync across all your devices</li>
                <li>• Never lose your data</li>
                <li>• Access from anywhere</li>
                <li>• Real-time updates</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                📱 Offline Mode
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Works without internet</li>
                <li>• Data stored locally</li>
                <li>• No account required</li>
                <li>• Limited to this device</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}