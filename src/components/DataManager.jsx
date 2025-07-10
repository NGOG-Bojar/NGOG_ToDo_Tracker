import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTask } from '../contexts/TaskContext';
import { useCategory } from '../contexts/CategoryContext';
import { useProject } from '../contexts/ProjectContext';
import { useActivityLogCategory } from '../contexts/ActivityLogCategoryContext';
import { format } from 'date-fns';

const { FiDownload, FiUpload, FiFileText, FiAlertTriangle, FiCheck, FiX } = FiIcons;

function DataManager({ isOpen, onClose }) {
  const [importStatus, setImportStatus] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);

  const { tasks } = useTask();
  const { categories } = useCategory();
  const { projects } = useProject();
  const { activityLogCategories } = useActivityLogCategory();

  const exportData = () => {
    try {
      // Get all data from localStorage
      const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        appName: "NGOG ToDo Tracker",
        data: {
          tasks: tasks,
          categories: categories,
          projects: projects,
          activityLogCategories: activityLogCategories, // Include activity log categories
          // Include any other settings or data
          settings: {
            theme: localStorage.getItem('todoTheme') || 'default',
            notifications: localStorage.getItem('todoNotifications') !== 'false'
          }
        },
        metadata: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          openTasks: tasks.filter(t => t.status === 'open').length,
          totalCategories: categories.length,
          customCategories: categories.filter(c => !c.predefined).length,
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
          completedProjects: projects.filter(p => p.status === 'completed').length,
          projectsWithTasks: projects.filter(p => p.linkedTasks && p.linkedTasks.length > 0).length,
          totalActivityLogCategories: activityLogCategories.length,
          customActivityLogCategories: activityLogCategories.filter(c => !c.predefined).length
        }
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ngog-todo-tracker-backup-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportStatus({
        type: 'success',
        message: 'Data exported successfully!'
      });
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Failed to export data: ' + error.message
      });
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        // Validate file structure - now including projects and activity log categories
        if (!importData.data || !importData.data.tasks || !importData.data.categories) {
          throw new Error('Invalid backup file format');
        }

        // Validate version compatibility (you can add version checking here)
        if (importData.version && !isVersionCompatible(importData.version)) {
          throw new Error('Backup file version is not compatible with current app version');
        }

        setPendingImportData(importData);
        setShowConfirmDialog(true);
      } catch (error) {
        setImportStatus({
          type: 'error',
          message: 'Failed to read backup file: ' + error.message
        });
        setTimeout(() => setImportStatus(null), 5000);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const confirmImport = () => {
    try {
      const { data } = pendingImportData;

      // Clear existing data and import new data
      localStorage.removeItem('todoTasks');
      localStorage.removeItem('todoCategories');
      localStorage.removeItem('todoProjects');
      localStorage.removeItem('todoActivityLogCategories'); // Clear activity log categories

      // Import tasks
      if (data.tasks && Array.isArray(data.tasks)) {
        localStorage.setItem('todoTasks', JSON.stringify(data.tasks));
      }

      // Import categories
      if (data.categories && Array.isArray(data.categories)) {
        localStorage.setItem('todoCategories', JSON.stringify(data.categories));
      }

      // Import projects
      if (data.projects && Array.isArray(data.projects)) {
        localStorage.setItem('todoProjects', JSON.stringify(data.projects));
      }

      // Import activity log categories
      if (data.activityLogCategories && Array.isArray(data.activityLogCategories)) {
        localStorage.setItem('todoActivityLogCategories', JSON.stringify(data.activityLogCategories));
      }

      // Import settings
      if (data.settings) {
        if (data.settings.theme) {
          localStorage.setItem('todoTheme', data.settings.theme);
        }
        if (typeof data.settings.notifications === 'boolean') {
          localStorage.setItem('todoNotifications', data.settings.notifications.toString());
        }
      }

      setImportStatus({
        type: 'success',
        message: 'Data imported successfully! Please refresh the page to see changes.'
      });
      setShowConfirmDialog(false);
      setPendingImportData(null);

      // Auto-refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Failed to import data: ' + error.message
      });
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const cancelImport = () => {
    setShowConfirmDialog(false);
    setPendingImportData(null);
  };

  const isVersionCompatible = (version) => {
    // Add version compatibility logic here
    // For now, accept all versions
    return true;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Export Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Export Data</h3>
              <p className="text-sm text-gray-600">
                Download a backup file containing all your tasks, categories, projects, activity log categories, and settings.
              </p>
              <button
                onClick={exportData}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiDownload} className="text-lg" />
                <span>Export All Data</span>
              </button>
            </div>

            {/* Import Section */}
            <div className="space-y-3 pt-6 border-t">
              <h3 className="text-lg font-medium text-gray-900">Import Data</h3>
              <p className="text-sm text-gray-600">
                Restore your data from a previously exported backup file.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <SafeIcon icon={FiAlertTriangle} className="text-yellow-600 text-sm mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This will replace all current data. Make sure to export your current data first if needed.
                  </p>
                </div>
              </div>
              <label className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                <SafeIcon icon={FiUpload} className="text-lg" />
                <span>Import Data</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Data Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-900">Current Data Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Tasks:</span>
                  <span className="ml-2 font-medium">{tasks.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Categories:</span>
                  <span className="ml-2 font-medium">{categories.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Projects:</span>
                  <span className="ml-2 font-medium">{projects.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Activity Categories:</span>
                  <span className="ml-2 font-medium">{activityLogCategories.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Completed:</span>
                  <span className="ml-2 font-medium">{tasks.filter(t => t.status === 'completed').length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Active Projects:</span>
                  <span className="ml-2 font-medium">{projects.filter(p => p.status === 'active').length}</span>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            <AnimatePresence>
              {importStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-lg border ${
                    importStatus.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <SafeIcon
                      icon={importStatus.type === 'success' ? FiCheck : FiAlertTriangle}
                      className="text-sm"
                    />
                    <span className="text-sm">{importStatus.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <SafeIcon icon={FiAlertTriangle} className="text-red-600 text-2xl" />
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Data Import</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    This will replace all your current data with the imported data. This action cannot be undone.
                  </p>
                  {pendingImportData && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <h4 className="font-medium text-gray-900">Import Summary:</h4>
                      <div className="text-sm space-y-1">
                        <div>Tasks: {pendingImportData.metadata?.totalTasks || 0}</div>
                        <div>Categories: {pendingImportData.metadata?.totalCategories || 0}</div>
                        <div>Projects: {pendingImportData.metadata?.totalProjects || 0}</div>
                        <div>Activity Categories: {pendingImportData.metadata?.totalActivityLogCategories || 0}</div>
                        <div>
                          Export Date: {
                            pendingImportData.exportDate
                              ? format(new Date(pendingImportData.exportDate), 'MMM dd, yyyy HH:mm')
                              : 'Unknown'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      onClick={cancelImport}
                      className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmImport}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Import Data
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

export default DataManager;