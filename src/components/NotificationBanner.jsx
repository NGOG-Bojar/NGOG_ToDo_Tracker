import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTask } from '../contexts/TaskContext';

const { FiAlertTriangle, FiClock, FiX } = FiIcons;

function NotificationBanner({ show, onClose }) {
  const { getOverdueTasks, getTasksDueToday } = useTask();
  
  const overdueTasks = getOverdueTasks();
  const tasksDueToday = getTasksDueToday();

  if (!show || (overdueTasks.length === 0 && tasksDueToday.length === 0)) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-gradient-to-r from-red-50 to-yellow-50 border-l-4 border-red-500 p-4 shadow-md"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {overdueTasks.length > 0 && (
                <div className="flex items-center space-x-2 text-red-600">
                  <SafeIcon icon={FiAlertTriangle} className="text-lg animate-pulse" />
                  <span className="font-medium">
                    {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {tasksDueToday.length > 0 && (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <SafeIcon icon={FiClock} className="text-lg" />
                  <span className="font-medium">
                    {tasksDueToday.length} task{tasksDueToday.length > 1 ? 's' : ''} due today
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <SafeIcon icon={FiX} className="text-lg" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default NotificationBanner;