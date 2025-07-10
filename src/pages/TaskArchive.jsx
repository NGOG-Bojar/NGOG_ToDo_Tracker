import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTask } from '../contexts/TaskContext';
import { useCategory } from '../contexts/CategoryContext';
import TaskCard from '../components/TaskCard';
import { format, parseISO } from 'date-fns';

const { FiArchive, FiTrash2, FiFilter, FiCalendar, FiSearch } = FiIcons;

function TaskArchive() {
  const { tasks, deleteTask, toggleTaskStatus, updateTask } = useTask();
  const { categories } = useCategory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [groupByDate, setGroupByDate] = useState(true);

  // Get only completed tasks
  const completedTasks = tasks.filter(task => task.status === 'completed');

  // Apply filters
  const filteredTasks = completedTasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filter
    const matchesCategory = selectedCategory === 'all' ||
      (task.categories && task.categories.includes(selectedCategory));

    // Priority filter
    const matchesPriority = selectedPriority === 'all' ||
      task.priority === selectedPriority;

    // Time period filter
    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      const completedDate = new Date(task.updatedAt || task.createdAt);
      const now = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchesPeriod = completedDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          matchesPeriod = completedDate >= monthAgo;
          break;
        case 'quarter':
          const quarterAgo = new Date();
          quarterAgo.setMonth(now.getMonth() - 3);
          matchesPeriod = completedDate >= quarterAgo;
          break;
        default:
          matchesPeriod = true;
      }
    }

    return matchesSearch && matchesCategory && matchesPriority && matchesPeriod;
  });

  // Group tasks by completion date if groupByDate is true
  const groupedTasks = {};
  if (groupByDate && filteredTasks.length > 0) {
    filteredTasks.forEach(task => {
      const dateStr = task.updatedAt 
        ? format(parseISO(task.updatedAt), 'yyyy-MM-dd')
        : format(parseISO(task.createdAt), 'yyyy-MM-dd');
      
      if (!groupedTasks[dateStr]) {
        groupedTasks[dateStr] = [];
      }
      groupedTasks[dateStr].push(task);
    });
  }

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedTasks).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const handleDeleteTask = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this task?')) {
      deleteTask(id);
    }
  };

  const handleRestoreTask = (id) => {
    toggleTaskStatus(id);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to permanently delete ALL archived tasks? This cannot be undone.')) {
      completedTasks.forEach(task => deleteTask(task.id));
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedPriority('all');
    setSelectedPeriod('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Archive</h1>
          <p className="text-gray-600">
            View and manage your completed tasks
            {filteredTasks.length !== completedTasks.length && (
              <span className="ml-2 text-sm text-blue-600">
                ({filteredTasks.length} of {completedTasks.length} tasks shown)
              </span>
            )}
          </p>
        </div>
        {completedTasks.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <SafeIcon icon={FiTrash2} className="text-lg" />
            <span>Clear Archive</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {completedTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-col space-y-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search archived tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="uncategorized">Uncategorized</option>
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Time Period Filter */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
              </select>

              {/* Group by date toggle */}
              <button
                onClick={() => setGroupByDate(!groupByDate)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                  groupByDate
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors`}
              >
                <SafeIcon icon={FiCalendar} className="text-sm" />
                <span>Group by Date</span>
              </button>

              {/* Clear Filters Button */}
              {(searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all' || selectedPeriod !== 'all') && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <SafeIcon icon={FiFilter} className="text-sm" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all' || selectedPeriod !== 'all') && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm text-gray-500">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Category: {selectedCategory === 'uncategorized' ? 'Uncategorized' : categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                )}
                {selectedPriority !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Priority: {selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)}
                  </span>
                )}
                {selectedPeriod !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Period: {selectedPeriod === 'week' ? 'Last Week' : selectedPeriod === 'month' ? 'Last Month' : 'Last Quarter'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <SafeIcon icon={FiArchive} className="text-gray-300 text-6xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {completedTasks.length === 0 ? 'No archived tasks found' : 'No tasks match your filters'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {completedTasks.length === 0 
                  ? 'Tasks will appear here once they\'re marked as completed'
                  : 'Try adjusting your filters to see more results'
                }
              </p>
              {completedTasks.length > 0 && filteredTasks.length === 0 && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </motion.div>
          ) : groupByDate ? (
            sortedDates.map(date => (
              <motion.div
                key={date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-px bg-gray-200 flex-grow"></div>
                  <h3 className="text-sm font-medium text-gray-500">
                    {format(parseISO(date), 'MMMM dd, yyyy')}
                  </h3>
                  <div className="h-px bg-gray-200 flex-grow"></div>
                </div>
                {groupedTasks[date].map(task => (
                  <TaskArchiveCard
                    key={task.id}
                    task={task}
                    onDelete={handleDeleteTask}
                    onRestore={handleRestoreTask}
                    onUpdate={updateTask}
                  />
                ))}
              </motion.div>
            ))
          ) : (
            filteredTasks.map(task => (
              <TaskArchiveCard
                key={task.id}
                task={task}
                onDelete={handleDeleteTask}
                onRestore={handleRestoreTask}
                onUpdate={updateTask}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Special version of TaskCard for archived tasks
function TaskArchiveCard({ task, onDelete, onRestore, onUpdate }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow opacity-80"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onRestore(task.id)}
            className="mt-1 p-1 rounded-full transition-colors bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600"
          >
            <SafeIcon icon={FiArchive} className="text-sm" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-500 line-through">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm mb-2 text-gray-400">{task.description}</p>
            )}
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
              <span>Completed: {format(parseISO(task.updatedAt || task.createdAt), 'MMM dd, yyyy')}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full ${
                task.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                task.priority === 'high' ? 'bg-red-100 text-red-600' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              }`}>
                {task.priority}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        >
          <SafeIcon icon={FiTrash2} className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
}

export default TaskArchive;