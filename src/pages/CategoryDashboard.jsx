import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTask } from '../contexts/TaskContext';
import { useCategory } from '../contexts/CategoryContext';
import TaskModal from '../components/TaskModal';
import TaskCard from '../components/TaskCard';

const { FiPlus, FiFilter, FiTag, FiGrid } = FiIcons;

function CategoryDashboard() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('open'); // Default to showing only open tasks
  const { tasks, addTask, updateTask, deleteTask, toggleTaskStatus } = useTask();
  const { categories } = useCategory();

  // Get tasks with no categories
  const uncategorizedTasks = tasks.filter(
    task => 
      (!task.categories || task.categories.length === 0) && 
      (filterStatus === 'all' || task.status === filterStatus)
  );

  // Get tasks for each category
  const getTasksByCategory = (categoryId) => {
    return tasks.filter(
      task => 
        task.categories && 
        task.categories.includes(categoryId) && 
        (filterStatus === 'all' || task.status === filterStatus)
    );
  };

  const handleCreateTask = (taskData) => {
    addTask(taskData);
    setShowTaskModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Dashboard</h1>
          <p className="text-gray-600">View tasks organized by category</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="open">Open Tasks</option>
            <option value="completed">Completed Tasks</option>
            <option value="all">All Tasks</option>
          </select>
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <SafeIcon icon={FiPlus} className="text-lg" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map through categories */}
        {categories.map(category => {
          const categoryTasks = getTasksByCategory(category.id);
          
          if (categoryTasks.length === 0 && filterStatus !== 'all') {
            return null; // Don't show empty categories when filtering
          }
          
          return (
            <motion.div
              key={category.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border overflow-hidden"
            >
              <div 
                className="p-4 flex items-center justify-between border-b" 
                style={{ backgroundColor: `${category.color}20` }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <span className="text-sm text-gray-500">{categoryTasks.length} tasks</span>
                </div>
              </div>
              
              <div className="p-4 max-h-[500px] overflow-y-auto">
                <AnimatePresence>
                  {categoryTasks.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <SafeIcon icon={FiTag} className="text-gray-300 text-4xl mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No tasks in this category</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {categoryTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggle={toggleTaskStatus}
                          onDelete={deleteTask}
                          onUpdate={updateTask}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
        
        {/* Uncategorized Tasks */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border overflow-hidden"
        >
          <div className="p-4 flex items-center justify-between border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <h3 className="font-semibold text-gray-900">Uncategorized</h3>
              <span className="text-sm text-gray-500">{uncategorizedTasks.length} tasks</span>
            </div>
          </div>
          
          <div className="p-4 max-h-[500px] overflow-y-auto">
            <AnimatePresence>
              {uncategorizedTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <SafeIcon icon={FiTag} className="text-gray-300 text-4xl mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No uncategorized tasks</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {uncategorizedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={toggleTaskStatus}
                      onDelete={deleteTask}
                      onUpdate={updateTask}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal 
          onClose={() => setShowTaskModal(false)} 
          onSave={handleCreateTask} 
        />
      )}
    </div>
  );
}

export default CategoryDashboard;