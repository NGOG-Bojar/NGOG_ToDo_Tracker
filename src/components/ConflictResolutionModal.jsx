import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, parseISO } from 'date-fns';

const { FiAlertTriangle, FiX, FiCheck, FiClock, FiUser, FiDatabase, FiSmartphone } = FiIcons;

function ConflictResolutionModal({ conflicts, onResolve, onClose }) {
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [resolutions, setResolutions] = useState({});

  if (!conflicts || conflicts.length === 0) return null;

  const currentConflict = conflicts[currentConflictIndex];
  const isLastConflict = currentConflictIndex === conflicts.length - 1;

  const handleResolve = (resolution) => {
    const newResolutions = {
      ...resolutions,
      [currentConflict.id]: resolution
    };
    setResolutions(newResolutions);

    if (isLastConflict) {
      // All conflicts resolved, apply resolutions
      onResolve(newResolutions);
    } else {
      // Move to next conflict
      setCurrentConflictIndex(currentConflictIndex + 1);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      return format(parseISO(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  const getConflictType = (conflict) => {
    if (conflict.local && conflict.remote) {
      return 'modification';
    } else if (conflict.local && !conflict.remote) {
      return 'local_only';
    } else if (!conflict.local && conflict.remote) {
      return 'remote_only';
    }
    return 'unknown';
  };

  const renderDataComparison = (local, remote, field) => {
    const localValue = local?.[field];
    const remoteValue = remote?.[field];
    
    if (localValue === remoteValue) return null;

    return (
      <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">{field}</h5>
          <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded border">
            {localValue || <span className="text-gray-400 italic">empty</span>}
          </p>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-1">{field}</h5>
          <p className="text-sm text-gray-900 bg-green-50 p-2 rounded border">
            {remoteValue || <span className="text-gray-400 italic">empty</span>}
          </p>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <SafeIcon icon={FiAlertTriangle} className="text-red-600 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sync Conflict Detected</h2>
                <p className="text-sm text-gray-600">
                  Conflict {currentConflictIndex + 1} of {conflicts.length} - Choose which version to keep
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-2 bg-gray-50 border-b">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentConflictIndex + 1) / conflicts.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Conflict Details */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Conflict Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  {currentConflict.table} - {currentConflict.local?.title || currentConflict.remote?.title || 'Unnamed Item'}
                </h3>
                <p className="text-sm text-yellow-700">
                  This item has been modified in multiple places. Choose which version to keep.
                </p>
              </div>

              {/* Version Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Local Version */}
                <div className="border border-blue-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 p-4 border-b border-blue-200">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiSmartphone} className="text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Local Version (This Device)</h4>
                    </div>
                    {currentConflict.local?.updated_at && (
                      <p className="text-xs text-blue-600 mt-1">
                        <SafeIcon icon={FiClock} className="inline mr-1" />
                        Modified: {formatTimestamp(currentConflict.local.updated_at)}
                      </p>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    {currentConflict.local ? (
                      <>
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">Title</h5>
                          <p className="text-sm text-gray-900">{currentConflict.local.title}</p>
                        </div>
                        {currentConflict.local.description && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Description</h5>
                            <p className="text-sm text-gray-900 line-clamp-3">{currentConflict.local.description}</p>
                          </div>
                        )}
                        {currentConflict.local.priority && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Priority</h5>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              currentConflict.local.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                              currentConflict.local.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                              currentConflict.local.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {currentConflict.local.priority}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 italic">Item deleted locally</p>
                    )}
                  </div>
                  <div className="p-4 border-t bg-gray-50">
                    <button
                      onClick={() => handleResolve('local')}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Keep Local Version
                    </button>
                  </div>
                </div>

                {/* Remote Version */}
                <div className="border border-green-200 rounded-lg overflow-hidden">
                  <div className="bg-green-50 p-4 border-b border-green-200">
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiDatabase} className="text-green-600" />
                      <h4 className="font-semibold text-green-800">Remote Version (Cloud)</h4>
                    </div>
                    {currentConflict.remote?.updated_at && (
                      <p className="text-xs text-green-600 mt-1">
                        <SafeIcon icon={FiClock} className="inline mr-1" />
                        Modified: {formatTimestamp(currentConflict.remote.updated_at)}
                      </p>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    {currentConflict.remote ? (
                      <>
                        <div>
                          <h5 className="text-sm font-medium text-gray-700">Title</h5>
                          <p className="text-sm text-gray-900">{currentConflict.remote.title}</p>
                        </div>
                        {currentConflict.remote.description && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Description</h5>
                            <p className="text-sm text-gray-900 line-clamp-3">{currentConflict.remote.description}</p>
                          </div>
                        )}
                        {currentConflict.remote.priority && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Priority</h5>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              currentConflict.remote.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                              currentConflict.remote.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                              currentConflict.remote.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {currentConflict.remote.priority}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 italic">Item deleted remotely</p>
                    )}
                  </div>
                  <div className="p-4 border-t bg-gray-50">
                    <button
                      onClick={() => handleResolve('remote')}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Keep Remote Version
                    </button>
                  </div>
                </div>
              </div>

              {/* Field-by-field differences */}
              {currentConflict.local && currentConflict.remote && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Detailed Differences</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center font-medium text-blue-600">Local (This Device)</div>
                      <div className="text-center font-medium text-green-600">Remote (Cloud)</div>
                    </div>
                    {renderDataComparison(currentConflict.local, currentConflict.remote, 'title')}
                    {renderDataComparison(currentConflict.local, currentConflict.remote, 'description')}
                    {renderDataComparison(currentConflict.local, currentConflict.remote, 'priority')}
                    {renderDataComparison(currentConflict.local, currentConflict.remote, 'status')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {currentConflictIndex > 0 && (
                <button
                  onClick={() => setCurrentConflictIndex(currentConflictIndex - 1)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Previous Conflict
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel Sync
              </button>
              
              {/* Auto-resolve options */}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Auto-resolve all remaining conflicts with local version
                    const autoResolutions = {};
                    conflicts.slice(currentConflictIndex).forEach(conflict => {
                      autoResolutions[conflict.id] = 'local';
                    });
                    onResolve({ ...resolutions, ...autoResolutions });
                  }}
                  className="px-3 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors text-sm"
                >
                  Keep All Local
                </button>
                <button
                  onClick={() => {
                    // Auto-resolve all remaining conflicts with remote version
                    const autoResolutions = {};
                    conflicts.slice(currentConflictIndex).forEach(conflict => {
                      autoResolutions[conflict.id] = 'remote';
                    });
                    onResolve({ ...resolutions, ...autoResolutions });
                  }}
                  className="px-3 py-2 text-green-600 border border-green-300 rounded-md hover:bg-green-50 transition-colors text-sm"
                >
                  Keep All Remote
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ConflictResolutionModal;