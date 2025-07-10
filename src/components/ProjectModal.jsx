import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useProject } from '../contexts/ProjectContext';

const { FiX, FiPlus, FiTrash2, FiUser, FiMail, FiPhone, FiBriefcase } = FiIcons;

function ProjectModal({ project, onClose, onSave }) {
  const { PROJECT_STATUSES } = useProject();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: PROJECT_STATUSES.IDEA,
    color: '#3B82F6',
    participants: [],
    linkedTasks: []
  });

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        status: project.status || PROJECT_STATUSES.IDEA,
        color: project.color || '#3B82F6',
        participants: project.participants || [],
        linkedTasks: project.linkedTasks || []
      });
    }
  }, [project, PROJECT_STATUSES.IDEA]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const projectData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim()
    };

    if (project) {
      onSave(project.id, projectData);
    } else {
      onSave(projectData);
    }
    
    onClose();
  };

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [
        ...prev.participants,
        {
          id: Date.now(),
          name: '',
          role: '',
          email: '',
          phone: ''
        }
      ]
    }));
  };

  const updateParticipant = (id, updates) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(participant => 
        participant.id === id ? { ...participant, ...updates } : participant
      )
    }));
  };

  const removeParticipant = (id) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(participant => participant.id !== id)
    }));
  };

  const statusOptions = [
    { value: PROJECT_STATUSES.IDEA, label: 'Idea', color: '#6B7280' },
    { value: PROJECT_STATUSES.PREPARATION, label: 'In Preparation', color: '#F59E0B' },
    { value: PROJECT_STATUSES.ACTIVE, label: 'Active', color: '#10B981' },
    { value: PROJECT_STATUSES.WAITING, label: 'Waiting for Feedback', color: '#EF4444' },
    { value: PROJECT_STATUSES.ON_HOLD, label: 'On Hold', color: '#8B5CF6' },
    { value: PROJECT_STATUSES.COMPLETED, label: 'Completed', color: '#059669' }
  ];

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
    '#84CC16', '#F97316', '#EC4899', '#6B7280', '#F43F5E', '#059669'
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
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {project ? 'Edit Project' : 'Create New Project'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: formData.color }}
                  />
                  <div className="flex flex-wrap gap-1">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                          formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project description, scope, and details..."
              />
            </div>

            {/* Participants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Participants
                </label>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <SafeIcon icon={FiPlus} className="text-sm" />
                  <span>Add Participant</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.participants.map((participant) => (
                  <div key={participant.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <SafeIcon icon={FiUser} className="text-gray-400" />
                      <button
                        type="button"
                        onClick={() => removeParticipant(participant.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <SafeIcon icon={FiTrash2} className="text-sm" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => updateParticipant(participant.id, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Name"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={participant.role}
                          onChange={(e) => updateParticipant(participant.id, { role: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Role"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          value={participant.email}
                          onChange={(e) => updateParticipant(participant.id, { email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Email"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          value={participant.phone}
                          onChange={(e) => updateParticipant(participant.id, { phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Phone"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {project ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProjectModal;