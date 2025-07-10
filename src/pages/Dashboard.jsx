import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTask } from '../contexts/TaskContext';
import { useProject } from '../contexts/ProjectContext';
import TaskModal from '../components/TaskModal';
import TaskCompletionStats from '../components/TaskCompletionStats';

const { FiPlus, FiCheckCircle, FiClock, FiAlertTriangle, FiList, FiZap, FiBriefcase } = FiIcons;

function Dashboard() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const { tasks, addTask, updateTask, getOverdueTasks, getTasksDueToday, getUrgentTasks, getHighPriorityTasks } = useTask();
  const { linkTaskToProject, getProjectById } = useProject();
  
  const overdueTasks = getOverdueTasks();
  const tasksDueToday = getTasksDueToday();
  const urgentTasks = getUrgentTasks();
  const highPriorityTasks = getHighPriorityTasks();
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const openTasks = tasks.filter(task => task.status === 'open');

  const stats = [
    {
      label: 'Total Tasks',
      value: tasks.length,
      icon: FiList,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      label: 'Open Tasks',
      value: openTasks.length,
      icon: FiClock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      label: 'Completed',
      value: completedTasks.length,
      icon: FiCheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      label: 'Overdue',
      value: overdueTasks.length,
      icon: FiAlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  const handleCreateTask = (taskData) => {
    const newTask = addTask(taskData);
    
    // Explicitly handle project linking - this ensures the project's linkedTasks array is updated
    if (newTask && taskData.linkedProject) {
      linkTaskToProject(taskData.linkedProject, newTask.id, newTask.title);
    }
    
    setShowTaskModal(false);
    setSelectedTask(null);
    
    // Return the new task so the modal handler can use it
    return newTask;
  };
  
  const handleUpdateTask = (id, updates) => {
    updateTask(id, updates);
    setSelectedTask(null);
    setShowTaskModal(false);
  };
  
  // Handler for clicking on a task in the priority sections
  const handleTaskClick = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowTaskModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your tasks and productivity</p>
        </div>
        <button
          onClick={() => {
            setSelectedTask(null);
            setShowTaskModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <SafeIcon icon={FiPlus} className="text-lg" />
          <span>New Task</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <SafeIcon icon={stat.icon} className="text-white text-xl" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Task Completion Stats */}
      <TaskCompletionStats />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Urgent Tasks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Urgent</h3>
            <SafeIcon icon={FiZap} className="text-red-600 text-xl" />
          </div>
          {urgentTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No urgent tasks</p>
          ) : (
            <div className="space-y-2">
              {urgentTasks.slice(0, 3).map(task => {
                const linkedProject = task.linkedProject ? getProjectById(task.linkedProject) : null;
                
                return (
                  <div 
                    key={task.id} 
                    className="flex items-start space-x-2 hover:bg-gray-50 p-1 rounded cursor-pointer"
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <motion.div
                      className="w-3 h-3 bg-red-600 rounded-full mt-1.5"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <div className="flex-1">
                      <span className="text-sm text-red-600 font-medium truncate block">{task.title}</span>
                      {linkedProject && (
                        <div className="flex items-center mt-1">
                          <SafeIcon icon={FiBriefcase} className="text-blue-600 text-xs mr-1" />
                          <span className="text-xs text-blue-600">{linkedProject.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {urgentTasks.length > 3 && (
                <Link to="/tasks" className="text-blue-600 text-sm hover:underline">
                  View all {urgentTasks.length} tasks
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* Due Today */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Due Today</h3>
            <SafeIcon icon={FiClock} className="text-yellow-500 text-xl" />
          </div>
          {tasksDueToday.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks due today</p>
          ) : (
            <div className="space-y-2">
              {tasksDueToday.slice(0, 3).map(task => {
                const linkedProject = task.linkedProject ? getProjectById(task.linkedProject) : null;
                
                return (
                  <div 
                    key={task.id} 
                    className="flex items-start space-x-2 hover:bg-gray-50 p-1 rounded cursor-pointer"
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <span className="text-sm text-gray-700 truncate block">{task.title}</span>
                      {linkedProject && (
                        <div className="flex items-center mt-1">
                          <SafeIcon icon={FiBriefcase} className="text-blue-600 text-xs mr-1" />
                          <span className="text-xs text-blue-600">{linkedProject.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {tasksDueToday.length > 3 && (
                <Link to="/tasks" className="text-blue-600 text-sm hover:underline">
                  View all {tasksDueToday.length} tasks
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* Overdue */}
        <motion.div
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Overdue</h3>
            <SafeIcon icon={FiAlertTriangle} className="text-red-500 text-xl" />
          </div>
          {overdueTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No overdue tasks</p>
          ) : (
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map(task => {
                const linkedProject = task.linkedProject ? getProjectById(task.linkedProject) : null;
                
                return (
                  <div 
                    key={task.id} 
                    className="flex items-start space-x-2 hover:bg-gray-50 p-1 rounded cursor-pointer"
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mt-1.5"></div>
                    <div className="flex-1">
                      <span className="text-sm text-gray-700 truncate block">{task.title}</span>
                      {linkedProject && (
                        <div className="flex items-center mt-1">
                          <SafeIcon icon={FiBriefcase} className="text-blue-600 text-xs mr-1" />
                          <span className="text-xs text-blue-600">{linkedProject.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {overdueTasks.length > 3 && (
                <Link to="/tasks" className="text-blue-600 text-sm hover:underline">
                  View all {overdueTasks.length} tasks
                </Link>
              )}
            </div>
          )}
        </motion.div>

        {/* High Priority */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">High Priority</h3>
            <SafeIcon icon={FiAlertTriangle} className="text-orange-500 text-xl" />
          </div>
          {highPriorityTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No high priority tasks</p>
          ) : (
            <div className="space-y-2">
              {highPriorityTasks.slice(0, 3).map(task => {
                const linkedProject = task.linkedProject ? getProjectById(task.linkedProject) : null;
                
                return (
                  <div 
                    key={task.id} 
                    className="flex items-start space-x-2 hover:bg-gray-50 p-1 rounded cursor-pointer"
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <span className="text-sm text-gray-700 truncate block">{task.title}</span>
                      {linkedProject && (
                        <div className="flex items-center mt-1">
                          <SafeIcon icon={FiBriefcase} className="text-blue-600 text-xs mr-1" />
                          <span className="text-xs text-blue-600">{linkedProject.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {highPriorityTasks.length > 3 && (
                <Link to="/tasks" className="text-blue-600 text-sm hover:underline">
                  View all {highPriorityTasks.length} tasks
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal 
          task={selectedTask} 
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }} 
          onSave={selectedTask ? handleUpdateTask : handleCreateTask} 
        />
      )}
    </div>
  );
}

export default Dashboard;