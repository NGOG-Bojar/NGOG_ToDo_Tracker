import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useProject } from '../contexts/ProjectContext';
import { useTask } from '../contexts/TaskContext';
import { useActivityLogCategory } from '../contexts/ActivityLogCategoryContext';
import TaskModal from './TaskModal';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

const { 
  FiX, FiPlus, FiUser, FiMail, FiPhone, FiLink, FiUnlink, FiMessageSquare, 
  FiCalendar, FiActivity, FiEdit3, FiTrash2, FiTag
} = FiIcons;

function ProjectDetailsModal({ project, onClose, onEdit }) {
  const { STATUS_COLORS, addActivityLog, linkTaskToProject, unlinkTaskFromProject, deleteActivityLog } = useProject();
  const { tasks, addTask } = useTask();
  const { getActiveActivityLogCategories, getActivityLogCategoryById } = useActivityLogCategory();
  const [activeTab, setActiveTab] = useState('overview');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityMessage, setActivityMessage] = useState('');
  const [activityCategory, setActivityCategory] = useState('general');
  const [showLinkTaskModal, setShowLinkTaskModal] = useState(false);

  const activeActivityLogCategories = getActiveActivityLogCategories();

  if (!project) return null;

  const getStatusLabel = (status) => {
    const labels = {
      idea: 'Idea',
      preparation: 'In Preparation',
      active: 'Active',
      waiting: 'Waiting for Feedback',
      completed: 'Completed',
      on_hold: 'On Hold'
    };
    return labels[status] || status;
  };

  const linkedTasks = tasks.filter(task => 
    project.linkedTasks && project.linkedTasks.includes(task.id)
  );

  const availableTasksToLink = tasks.filter(task => 
    !project.linkedTasks || !project.linkedTasks.includes(task.id)
  );

  const handleCreateTask = (taskData) => {
    // Create the task and get the returned task object
    const newTask = addTask(taskData);
    
    // Link the new task to the project using the returned task's ID
    linkTaskToProject(project.id, newTask.id, taskData.title);
    
    // Close the modal
    setShowTaskModal(false);
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!activityMessage.trim()) return;

    addActivityLog(project.id, {
      type: 'manual',
      message: activityMessage.trim(),
      auto: false,
      category: activityCategory
    });
    setActivityMessage('');
    setActivityCategory('general');
    setShowActivityForm(false);
  };

  const handleDeleteActivity = (entryId) => {
    if (window.confirm('Are you sure you want to delete this activity log entry?')) {
      deleteActivityLog(project.id, entryId);
    }
  };

  const handleLinkTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      linkTaskToProject(project.id, taskId, task.title);
      setShowLinkTaskModal(false);
    }
  };

  const handleUnlinkTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      unlinkTaskFromProject(project.id, taskId, task.title);
    }
  };

  // Rich text editor modules configuration
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'header', 'list', 'bullet', 'link'
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiActivity },
    { id: 'participants', label: 'Participants', icon: FiUser },
    { id: 'tasks', label: 'Linked Tasks', icon: FiLink },
    { id: 'activity', label: 'Activity Log', icon: FiMessageSquare }
  ];

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
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded-full" 
                style={{ backgroundColor: project.color || '#3B82F6' }} 
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
                <span 
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white mt-1"
                  style={{ backgroundColor: STATUS_COLORS[project.status] || '#6B7280' }}
                >
                  {getStatusLabel(project.status)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(project)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <SafeIcon icon={FiEdit3} className="text-lg" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-4 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={tab.icon} className="text-lg" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">
                    {project.description || 'No description provided.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">Created</h4>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(project.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">Last Updated</h4>
                    <p className="text-sm text-gray-600">
                      {format(parseISO(project.updatedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">Status</h4>
                    <p className="text-sm text-gray-600">
                      {getStatusLabel(project.status)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
                </div>
                {project.participants && project.participants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.participants.map((participant) => (
                      <div key={participant.id} className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <SafeIcon icon={FiUser} className="text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">{participant.name}</h4>
                            <p className="text-sm text-gray-600">{participant.role}</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          {participant.email && (
                            <div className="flex items-center space-x-2">
                              <SafeIcon icon={FiMail} className="text-xs" />
                              <span>{participant.email}</span>
                            </div>
                          )}
                          {participant.phone && (
                            <div className="flex items-center space-x-2">
                              <SafeIcon icon={FiPhone} className="text-xs" />
                              <span>{participant.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No participants added yet.</p>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Linked Tasks</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowLinkTaskModal(true)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <SafeIcon icon={FiLink} className="text-sm" />
                      <span>Link Existing Task</span>
                    </button>
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                    >
                      <SafeIcon icon={FiPlus} className="text-sm" />
                      <span>Create New Task</span>
                    </button>
                  </div>
                </div>
                {linkedTasks.length > 0 ? (
                  <div className="space-y-3">
                    {linkedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <div>
                            <h4 className={`font-medium ${
                              task.status === 'completed' 
                                ? 'line-through text-gray-500' 
                                : 'text-gray-900'
                            }`}>
                              {task.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Priority: {task.priority} • Status: {task.status}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnlinkTask(task.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <SafeIcon icon={FiUnlink} className="text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No tasks linked to this project yet.</p>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
                  <button
                    onClick={() => setShowActivityForm(true)}
                    className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                  >
                    <SafeIcon icon={FiPlus} className="text-sm" />
                    <span>Add Log Entry</span>
                  </button>
                </div>

                {showActivityForm && (
                  <form onSubmit={handleAddActivity} className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={activityCategory}
                          onChange={(e) => setActivityCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {activeActivityLogCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message
                        </label>
                        <div className="rich-text-editor">
                          <ReactQuill
                            theme="snow"
                            value={activityMessage}
                            onChange={setActivityMessage}
                            modules={modules}
                            formats={formats}
                            className="bg-white rounded-md"
                            style={{ height: '120px', marginBottom: '40px' }}
                            placeholder="Add a project update, milestone, or note..."
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowActivityForm(false);
                          setActivityMessage('');
                          setActivityCategory('general');
                        }}
                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Add Entry
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {project.activityLog && project.activityLog.length > 0 ? (
                    project.activityLog
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .map((entry) => {
                        const category = getActivityLogCategoryById(entry.category || 'general');
                        const sanitizedMessage = entry.message ? DOMPurify.sanitize(entry.message) : '';
                        
                        return (
                          <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <SafeIcon icon={FiCalendar} className="text-gray-400 mt-1" />
                              {category && (
                                <span
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: category.color }}
                                >
                                  <SafeIcon icon={FiTag} className="mr-1 text-xs" />
                                  {category.name}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div 
                                className="text-sm text-gray-900 rich-text-content"
                                dangerouslySetInnerHTML={{ __html: sanitizedMessage }}
                              />
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">
                                  {format(parseISO(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                                  {entry.auto && ' • Auto-generated'}
                                </p>
                                {!entry.auto && (
                                  <button
                                    onClick={() => handleDeleteActivity(entry.id)}
                                    className="text-red-600 hover:text-red-700 text-xs"
                                  >
                                    <SafeIcon icon={FiTrash2} className="text-xs" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p className="text-gray-500 text-center py-8">No activity log entries yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {/* Link Task Modal */}
      {showLinkTaskModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
          onClick={() => setShowLinkTaskModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Link Existing Task</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableTasksToLink.length > 0 ? (
                  availableTasksToLink.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleLinkTask(task.id)}
                      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-600">
                        Priority: {task.priority} • Status: {task.status}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No available tasks to link.</p>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowLinkTaskModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProjectDetailsModal;