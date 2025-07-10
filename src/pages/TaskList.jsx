import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTask } from '../contexts/TaskContext';
import { useProject } from '../contexts/ProjectContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import TaskFilters from '../components/TaskFilters';

const { FiPlus } = FiIcons;

function TaskList() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { addTask, updateTask, deleteTask, toggleTaskStatus, getFilteredTasks } = useTask();
  const { linkTaskToProject } = useProject();
  
  const filteredTasks = getFilteredTasks();

  const handleCreateTask = (taskData) => {
    const newTask = addTask(taskData);
    
    // Explicitly handle project linking - this ensures the project's linkedTasks array is updated
    if (newTask && taskData.linkedProject) {
      linkTaskToProject(taskData.linkedProject, newTask.id, newTask.title);
    }
    
    setShowTaskModal(false);
    
    // Return the new task so the modal handler can use it
    return newTask;
  };

  const handleUpdateTask = (id, updates) => {
    updateTask(id, updates);
  };

  const handleDeleteTask = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
          <p className="text-gray-600">Manage and organize your tasks</p>
        </div>
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <SafeIcon icon={FiPlus} className="text-lg" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters */}
      <TaskFilters />

      {/* Task List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-gray-500 text-lg">No tasks found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your filters or create a new task
              </p>
            </motion.div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTaskStatus}
                onDelete={handleDeleteTask}
                onUpdate={handleUpdateTask}
                condensed={true}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Task Modal */}
      {showTaskModal && <TaskModal onClose={() => setShowTaskModal(false)} onSave={handleCreateTask} />}
    </div>
  );
}

export default TaskList;