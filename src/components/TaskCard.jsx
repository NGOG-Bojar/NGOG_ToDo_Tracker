import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isPast, parseISO } from 'date-fns';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useCategory } from '../contexts/CategoryContext';
import { useProject } from '../contexts/ProjectContext';
import TaskModal from './TaskModal';
import DOMPurify from 'dompurify';

const {
  FiCheck, FiClock, FiAlertTriangle, FiEdit3, FiTrash2, FiCalendar,
  FiZap, FiChevronDown, FiChevronUp, FiFileText, FiBriefcase, FiLink
} = FiIcons;

function TaskCard({ task, onToggle, onDelete, onUpdate, condensed = false }) {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { getCategoryById } = useCategory();
  const { projects, getProjectById } = useProject();

  const isOverdue = task.dueDate && 
    isPast(parseISO(task.dueDate)) && 
    !isToday(parseISO(task.dueDate)) && 
    task.status === 'open';
    
  const isDueToday = task.dueDate && 
    isToday(parseISO(task.dueDate)) && 
    task.status === 'open';
    
  const isUrgent = task.priority === 'urgent' && task.status === 'open';
  const isHighPriority = task.priority === 'high' && task.status === 'open';

  // Get linked project if it exists
  const linkedProject = task.linkedProject ? 
    getProjectById(task.linkedProject) : null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    return status === 'completed' ? 'text-green-600' : 'text-gray-600';
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return FiZap;
      case 'high': return FiAlertTriangle;
      case 'medium': return FiClock;
      case 'low': return FiClock;
      default: return FiClock;
    }
  };

  // Sanitize HTML content for safe rendering
  const sanitizedDescription = task.description ? DOMPurify.sanitize(task.description) : '';
  
  // Check if description is long enough to need truncation
  const hasLongDescription = sanitizedDescription && sanitizedDescription.length > 120;
  
  // Create a truncated version for condensed view
  const truncatedDescription = hasLongDescription ? 
    `${sanitizedDescription.replace(/<[^>]*>/g, '').substring(0, 120)}...` : '';

  const handleCardClick = (e) => {
    // Only expand if we're in condensed mode and not clicking a button
    if (condensed && !e.target.closest('button')) {
      setShowModal(true);
    }
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
          task.status === 'completed' ? 'opacity-75' : ''
        } ${condensed ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(task.id);
              }}
              className={`mt-1 p-1 rounded-full transition-colors ${
                task.status === 'completed'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
              }`}
            >
              <SafeIcon icon={FiCheck} className="text-sm" />
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3
                  className={`font-medium ${
                    task.status === 'completed'
                      ? 'line-through text-gray-500'
                      : isUrgent
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </h3>
                
                {/* Priority indicators - Only urgent tasks get the flashing icon */}
                {isUrgent && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <SafeIcon icon={FiZap} className="text-red-600 text-xl" />
                  </motion.div>
                )}
                
                {/* Static icon for high priority */}
                {(isHighPriority && !isUrgent) && (
                  <div>
                    <SafeIcon icon={FiAlertTriangle} className="text-red-500 text-sm" />
                  </div>
                )}
                
                {/* Static icon for overdue but not urgent or high priority */}
                {(isOverdue && !isUrgent && !isHighPriority) && (
                  <div>
                    <SafeIcon icon={FiAlertTriangle} className="text-red-500 text-sm" />
                  </div>
                )}
              </div>
              
              {/* Project badge - Show the linked project if available */}
              {linkedProject && (
                <div className="mb-2">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600"
                    >
                      <SafeIcon icon={FiBriefcase} className="text-xs" />
                      <span>Project: {linkedProject.title}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Description - conditional rendering based on condensed mode */}
              {sanitizedDescription && !condensed && (
                <>
                  {hasLongDescription && !expanded ? (
                    <div className="mb-2">
                      <div
                        className={`text-sm ${
                          task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {truncatedDescription}
                      </div>
                      <button
                        onClick={toggleExpand}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
                      >
                        Show more <SafeIcon icon={FiChevronDown} className="ml-1" />
                      </button>
                    </div>
                  ) : hasLongDescription ? (
                    <div className="mb-2">
                      <div
                        className={`text-sm mb-1 ${
                          task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                        } rich-text-content`}
                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                      />
                      <button
                        onClick={toggleExpand}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center"
                      >
                        Show less <SafeIcon icon={FiChevronUp} className="ml-1" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`text-sm mb-2 ${
                        task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'
                      } rich-text-content`}
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  )}
                </>
              )}

              {/* In condensed mode, only show a preview indicator if there's a description */}
              {sanitizedDescription && condensed && (
                <div className="text-xs text-gray-500 mb-2 flex items-center">
                  <SafeIcon icon={FiFileText} className="mr-1" />
                  Has description
                </div>
              )}

              <div className="flex items-center space-x-4 text-sm">
                {task.dueDate && (
                  <div
                    className={`flex items-center space-x-1 ${
                      isOverdue
                        ? 'text-red-600'
                        : isDueToday
                        ? 'text-yellow-600'
                        : 'text-gray-500'
                    }`}
                  >
                    <SafeIcon icon={FiCalendar} className="text-xs" />
                    <span>{format(parseISO(task.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  <SafeIcon icon={getPriorityIcon(task.priority)} className="text-xs" />
                  <span>{task.priority}</span>
                </div>
                
                <span className={`text-xs ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
              
              {task.categories && task.categories.length > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  {task.categories.map(categoryId => {
                    const category = getCategoryById(categoryId);
                    if (!category) return null;
                    
                    return (
                      <span
                        key={categoryId}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <SafeIcon icon={FiEdit3} className="text-sm" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <SafeIcon icon={FiTrash2} className="text-sm" />
            </button>
          </div>
        </div>
      </motion.div>
      
      {showModal && (
        <TaskModal
          task={task}
          onClose={() => setShowModal(false)}
          onSave={onUpdate}
        />
      )}
    </>
  );
}

export default TaskCard;