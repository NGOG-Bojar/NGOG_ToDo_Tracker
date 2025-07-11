import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useProject } from '../contexts/ProjectContext';
import { format, parseISO } from 'date-fns';
import ProjectCard from '../components/ProjectCard';
import ProjectDetailsModal from '../components/ProjectDetailsModal';
import ProjectModal from '../components/ProjectModal';

const { FiArchive, FiTrash2, FiFilter, FiCalendar, FiSearch, FiBriefcase, FiRotateCcw } = FiIcons;

function ProjectArchive() {
  const { getArchivedProjects, deleteProject, restoreProject, updateProject } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [groupByDate, setGroupByDate] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Get only archived projects
  const archivedProjects = getArchivedProjects();

  // Apply filters
  const filteredProjects = archivedProjects.filter(project => {
    // Search filter
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;

    // Time period filter
    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      const archivedDate = new Date(project.archivedAt);
      const now = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchesPeriod = archivedDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          matchesPeriod = archivedDate >= monthAgo;
          break;
        case 'quarter':
          const quarterAgo = new Date();
          quarterAgo.setMonth(now.getMonth() - 3);
          matchesPeriod = archivedDate >= quarterAgo;
          break;
        default:
          matchesPeriod = true;
      }
    }

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Group projects by archive date if groupByDate is true
  const groupedProjects = {};
  if (groupByDate && filteredProjects.length > 0) {
    filteredProjects.forEach(project => {
      const dateStr = format(parseISO(project.archivedAt), 'yyyy-MM-dd');
      if (!groupedProjects[dateStr]) {
        groupedProjects[dateStr] = [];
      }
      groupedProjects[dateStr].push(project);
    });
  }

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedProjects).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const handleDeleteProject = (id) => {
    const project = archivedProjects.find(p => p.id === id);
    if (window.confirm(`Are you sure you want to permanently delete "${project.title}"? This cannot be undone.`)) {
      deleteProject(id);
    }
  };

  const handleRestoreProject = (id) => {
    const project = archivedProjects.find(p => p.id === id);
    if (window.confirm(`Are you sure you want to restore "${project.title}" from archive?`)) {
      restoreProject(id);
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'Are you sure you want to permanently delete ALL archived projects? This cannot be undone.'
      )
    ) {
      archivedProjects.forEach(project => deleteProject(project.id));
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedPeriod('all');
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleUpdateProject = (id, updates) => {
    updateProject(id, updates);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setSelectedProject(null);
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'idea', label: 'Idea' },
    { value: 'preparation', label: 'In Preparation' },
    { value: 'active', label: 'Active' },
    { value: 'waiting', label: 'Waiting for Feedback' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Archive</h1>
          <p className="text-gray-600">
            View and manage your archived projects
            {filteredProjects.length !== archivedProjects.length && (
              <span className="ml-2 text-sm text-blue-600">
                ({filteredProjects.length} of {archivedProjects.length} projects shown)
              </span>
            )}
          </p>
        </div>
        {archivedProjects.length > 0 && (
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
      {archivedProjects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-col space-y-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search archived projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
              {(searchTerm || selectedStatus !== 'all' || selectedPeriod !== 'all') && (
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
            {(searchTerm || selectedStatus !== 'all' || selectedPeriod !== 'all') && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm text-gray-500">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                  </span>
                )}
                {selectedStatus !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Status: {statusOptions.find(s => s.value === selectedStatus)?.label}
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

      {/* Project List */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <SafeIcon icon={FiArchive} className="text-gray-300 text-6xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {archivedProjects.length === 0 ? 'No archived projects found' : 'No projects match your filters'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {archivedProjects.length === 0 
                  ? "Projects will appear here once they're archived"
                  : 'Try adjusting your filters to see more results'
                }
              </p>
              {archivedProjects.length > 0 && filteredProjects.length === 0 && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProjects[date].map(project => (
                    <ProjectArchiveCard
                      key={project.id}
                      project={project}
                      onDelete={handleDeleteProject}
                      onRestore={handleRestoreProject}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <ProjectArchiveCard
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteProject}
                  onRestore={handleRestoreProject}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Project Details Modal */}
      {showDetailsModal && selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProject(null);
          }}
          onEdit={handleEditProject}
        />
      )}

      {/* Project Edit Modal */}
      {showEditModal && selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
          }}
          onSave={handleUpdateProject}
        />
      )}
    </div>
  );
}

// Special version of ProjectCard for archived projects
function ProjectArchiveCard({ project, onDelete, onRestore, onViewDetails }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow opacity-80"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={() => onViewDetails(project)}>
          <div 
            className="w-4 h-4 rounded-full opacity-60" 
            style={{ backgroundColor: project.color || '#3B82F6' }} 
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-500 line-through truncate">{project.title}</h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mt-1">
              Archived
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onRestore(project.id)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Restore Project"
          >
            <SafeIcon icon={FiRotateCcw} className="text-sm" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete Permanently"
          >
            <SafeIcon icon={FiTrash2} className="text-sm" />
          </button>
        </div>
      </div>

      {/* Project info */}
      <div className="space-y-2">
        {project.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{project.description}</p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            {project.participants && project.participants.length > 0 && (
              <span>{project.participants.length} participant{project.participants.length > 1 ? 's' : ''}</span>
            )}
            {project.linkedTasks && project.linkedTasks.length > 0 && (
              <span>{project.linkedTasks.length} linked task{project.linkedTasks.length > 1 ? 's' : ''}</span>
            )}
          </div>
          <span>
            Archived: {format(parseISO(project.archivedAt), 'MMM dd, yyyy')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default ProjectArchive;