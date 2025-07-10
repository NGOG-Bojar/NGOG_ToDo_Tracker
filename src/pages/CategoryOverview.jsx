import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTask } from '../contexts/TaskContext';
import { useCategory } from '../contexts/CategoryContext';
import TaskModal from '../components/TaskModal';
import TaskCard from '../components/TaskCard';
import { format, isToday, isPast, parseISO } from 'date-fns';

const { FiPlus, FiFilter, FiTag, FiGrid, FiClock, FiAlertTriangle, FiZap, FiCheck, FiCalendar, FiFileText } = FiIcons;

function CategoryOverview() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('open'); // Default to showing only open tasks
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    getOverdueTasks,
    getTasksDueToday,
    getUrgentTasks,
    getHighPriorityTasks
  } = useTask();
  const { categories, getCategoryById } = useCategory();

  // Get priority task lists
  const overdueTasks = getOverdueTasks();
  const tasksDueToday = getTasksDueToday();
  const urgentTasks = getUrgentTasks();
  const highPriorityTasks = getHighPriorityTasks();

  // Get tasks with no categories
  const uncategorizedTasks = tasks.filter(
    task => (!task.categories || task.categories.length === 0) && (filterStatus === 'all' || task.status === filterStatus)
  );

  // Get tasks for each category
  const getTasksByCategory = (categoryId) => {
    return tasks.filter(
      task => task.categories && task.categories.includes(categoryId) && (filterStatus === 'all' || task.status === filterStatus)
    );
  };

  const handleCreateTask = (taskData) => {
    addTask(taskData);
    setShowTaskModal(false);
  };

  // Compact Task Item Component
  const CompactTaskItem = ({ task, onToggle, onDelete, onUpdate }) => {
    const [showModal, setShowModal] = useState(false);
    const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && task.status === 'open';
    const isDueToday = task.dueDate && isToday(parseISO(task.dueDate)) && task.status === 'open';
    const isUrgent = task.priority === 'urgent' && task.status === 'open';
    const isHighPriority = task.priority === 'high' && task.status === 'open';
    const hasDescription = task.description && task.description.trim() !== '';

    return (
      <>
        <motion.div
          layout
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className={`flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer ${
            task.status === 'completed' ? 'opacity-60' : ''
          }`}
          onClick={() => setShowModal(true)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
            className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.status === 'completed'
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {task.status === 'completed' && <SafeIcon icon={FiCheck} className="text-white text-xs" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span
                className={`text-sm font-medium truncate ${
                  task.status === 'completed'
                    ? 'line-through text-gray-500'
                    : isUrgent
                    ? 'text-red-600'
                    : 'text-gray-900'
                }`}
              >
                {task.title}
              </span>

              {/* Priority indicators */}
              {isUrgent && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <SafeIcon icon={FiZap} className="text-red-600 text-xs" />
                </motion.div>
              )}
              {isHighPriority && !isUrgent && <SafeIcon icon={FiAlertTriangle} className="text-red-500 text-xs" />}
              {isOverdue && !isUrgent && !isHighPriority && (
                <SafeIcon icon={FiAlertTriangle} className="text-red-500 text-xs" />
              )}
              
              {/* Description indicator */}
              {hasDescription && <SafeIcon icon={FiFileText} className="text-gray-400 text-xs" />}
            </div>

            {/* Due date and priority info */}
            <div className="flex items-center space-x-2 mt-1">
              {task.dueDate && (
                <span
                  className={`text-xs flex items-center space-x-1 ${
                    isOverdue ? 'text-red-600' : isDueToday ? 'text-yellow-600' : 'text-gray-500'
                  }`}
                >
                  <SafeIcon icon={FiCalendar} className="text-xs" />
                  <span>{format(parseISO(task.dueDate), 'MMM dd')}</span>
                </span>
              )}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  task.priority === 'urgent'
                    ? 'bg-red-100 text-red-600'
                    : task.priority === 'high'
                    ? 'bg-red-100 text-red-600'
                    : task.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-green-100 text-green-600'
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>
        </motion.div>
        
        {showModal && (
          <TaskModal 
            task={task} 
            onClose={() => setShowModal(false)} 
            onSave={(updates) => onUpdate(task.id, updates)} 
          />
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-600">Tasks by category and priority</p>
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

      {/* Priority Task Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Urgent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <SafeIcon icon={FiZap} className="text-red-600 mr-2" />
              Urgent Tasks
            </h3>
            <span className="text-sm font-medium bg-red-100 text-red-600 px-2 py-1 rounded-full">
              {urgentTasks.length}
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {urgentTasks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No urgent tasks</p>
            ) : (
              <div className="space-y-2">
                {urgentTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      const taskToEdit = tasks.find(t => t.id === task.id);
                      if (taskToEdit) {
                        setShowTaskModal(true);
                      }
                    }}
                  >
                    <motion.div
                      className="w-3 h-3 bg-red-600 rounded-full flex-shrink-0"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <span className="text-sm text-red-600 font-medium truncate">{task.title}</span>
                  </div>
                ))}
                {urgentTasks.length > 5 && (
                  <Link to="/tasks" className="text-blue-600 text-xs hover:underline block text-center mt-2">
                    View all {urgentTasks.length} urgent tasks
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Due Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <SafeIcon icon={FiClock} className="text-yellow-500 mr-2" />
              Due Today
            </h3>
            <span className="text-sm font-medium bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
              {tasksDueToday.length}
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {tasksDueToday.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No tasks due today</p>
            ) : (
              <div className="space-y-2">
                {tasksDueToday.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      const taskToEdit = tasks.find(t => t.id === task.id);
                      if (taskToEdit) {
                        setShowTaskModal(true);
                      }
                    }}
                  >
                    <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 truncate">{task.title}</span>
                  </div>
                ))}
                {tasksDueToday.length > 5 && (
                  <Link to="/tasks" className="text-blue-600 text-xs hover:underline block text-center mt-2">
                    View all {tasksDueToday.length} tasks due today
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Overdue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <SafeIcon icon={FiAlertTriangle} className="text-red-500 mr-2" />
              Overdue
            </h3>
            <span className="text-sm font-medium bg-red-100 text-red-600 px-2 py-1 rounded-full">
              {overdueTasks.length}
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {overdueTasks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No overdue tasks</p>
            ) : (
              <div className="space-y-2">
                {overdueTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      const taskToEdit = tasks.find(t => t.id === task.id);
                      if (taskToEdit) {
                        setShowTaskModal(true);
                      }
                    }}
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 truncate">{task.title}</span>
                  </div>
                ))}
                {overdueTasks.length > 5 && (
                  <Link to="/tasks" className="text-blue-600 text-xs hover:underline block text-center mt-2">
                    View all {overdueTasks.length} overdue tasks
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* High Priority */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border p-4"
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <SafeIcon icon={FiAlertTriangle} className="text-orange-500 mr-2" />
              High Priority
            </h3>
            <span className="text-sm font-medium bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
              {highPriorityTasks.length}
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {highPriorityTasks.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No high priority tasks</p>
            ) : (
              <div className="space-y-2">
                {highPriorityTasks.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      const taskToEdit = tasks.find(t => t.id === task.id);
                      if (taskToEdit) {
                        setShowTaskModal(true);
                      }
                    }}
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 truncate">{task.title}</span>
                  </div>
                ))}
                {highPriorityTasks.length > 5 && (
                  <Link to="/tasks" className="text-blue-600 text-xs hover:underline block text-center mt-2">
                    View all {highPriorityTasks.length} high priority tasks
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Categories Grid - Compact View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                className="p-3 flex items-center justify-between border-b"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                  <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                  <span className="text-xs text-gray-500">{categoryTasks.length}</span>
                </div>
              </div>
              <div className="p-3 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {categoryTasks.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                      <SafeIcon icon={FiTag} className="text-gray-300 text-2xl mx-auto mb-1" />
                      <p className="text-gray-500 text-xs">No tasks</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-1">
                      {categoryTasks.map(task => (
                        <CompactTaskItem
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
          <div className="p-3 flex items-center justify-between border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <h3 className="font-medium text-gray-900 text-sm">Uncategorized</h3>
              <span className="text-xs text-gray-500">{uncategorizedTasks.length}</span>
            </div>
          </div>
          <div className="p-3 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {uncategorizedTasks.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                  <SafeIcon icon={FiTag} className="text-gray-300 text-2xl mx-auto mb-1" />
                  <p className="text-gray-500 text-xs">No tasks</p>
                </motion.div>
              ) : (
                <div className="space-y-1">
                  {uncategorizedTasks.map(task => (
                    <CompactTaskItem
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
      {showTaskModal && <TaskModal onClose={() => setShowTaskModal(false)} onSave={handleCreateTask} />}
    </div>
  );
}

export default CategoryOverview;