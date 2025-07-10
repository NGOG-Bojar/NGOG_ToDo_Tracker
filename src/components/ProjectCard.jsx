import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useProject } from '../contexts/ProjectContext';

const { FiEdit3, FiTrash2, FiUsers, FiLink, FiCalendar, FiActivity } = FiIcons;

function ProjectCard({ project, onEdit, onDelete, onViewDetails }) {
  const { STATUS_COLORS } = useProject();
  
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

  const getStatusIcon = (status) => {
    const icons = {
      idea: FiActivity,
      preparation: FiCalendar,
      active: FiActivity,
      waiting: FiActivity,
      completed: FiActivity,
      on_hold: FiActivity
    };
    return icons[status] || FiActivity;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onViewDetails(project)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color || '#3B82F6' }}
            />
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {project.title}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <SafeIcon icon={FiEdit3} className="text-sm" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <SafeIcon icon={FiTrash2} className="text-sm" />
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center space-x-2 mb-3">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: STATUS_COLORS[project.status] || '#6B7280' }}
          >
            <SafeIcon icon={getStatusIcon(project.status)} className="mr-1 text-xs" />
            {getStatusLabel(project.status)}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {project.participants && project.participants.length > 0 && (
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiUsers} className="text-xs" />
                <span>{project.participants.length} participant{project.participants.length > 1 ? 's' : ''}</span>
              </div>
            )}
            
            {project.linkedTasks && project.linkedTasks.length > 0 && (
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiLink} className="text-xs" />
                <span>{project.linkedTasks.length} linked task{project.linkedTasks.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <SafeIcon icon={FiCalendar} className="text-xs" />
            <span>
              {format(parseISO(project.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ProjectCard;