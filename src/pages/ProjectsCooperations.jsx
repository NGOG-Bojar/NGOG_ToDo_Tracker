import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useProject } from '../contexts/ProjectContext';
import ProjectCard from '../components/ProjectCard';
import ProjectModal from '../components/ProjectModal';
import ProjectDetailsModal from '../components/ProjectDetailsModal';

const { FiPlus, FiFilter, FiGrid, FiBriefcase, FiUsers, FiActivity } = FiIcons;

function ProjectsCooperations() {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const { 
    projects, 
    addProject, 
    updateProject, 
    deleteProject, 
    getProjectsByStatus,
    PROJECT_STATUSES,
    STATUS_COLORS 
  } = useProject();

  const filteredProjects = filterStatus === 'all' 
    ? projects 
    : getProjectsByStatus(filterStatus);

  const handleCreateProject = (projectData) => {
    addProject(projectData);
    setShowProjectModal(false);
  };

  const handleUpdateProject = (id, updates) => {
    updateProject(id, updates);
    setEditingProject(null);
    setShowProjectModal(false);
    setShowDetailsModal(false);
  };

  const handleDeleteProject = (id) => {
    const project = projects.find(p => p.id === id);
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      deleteProject(id);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProject(null);
  };

  const statusOptions = [
    { value: 'all', label: 'All Projects' },
    { value: PROJECT_STATUSES.IDEA, label: 'Ideas' },
    { value: PROJECT_STATUSES.PREPARATION, label: 'In Preparation' },
    { value: PROJECT_STATUSES.ACTIVE, label: 'Active' },
    { value: PROJECT_STATUSES.WAITING, label: 'Waiting' },
    { value: PROJECT_STATUSES.ON_HOLD, label: 'On Hold' },
    { value: PROJECT_STATUSES.COMPLETED, label: 'Completed' }
  ];

  // Stats calculation
  const stats = {
    total: projects.length,
    active: getProjectsByStatus(PROJECT_STATUSES.ACTIVE).length,
    completed: getProjectsByStatus(PROJECT_STATUSES.COMPLETED).length,
    waiting: getProjectsByStatus(PROJECT_STATUSES.WAITING).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects & Cooperations</h1>
          <p className="text-gray-600">Track your projects and collaborative efforts</p>
        </div>
        <button
          onClick={() => setShowProjectModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <SafeIcon icon={FiPlus} className="text-lg" />
          <span>New Project</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <SafeIcon icon={FiBriefcase} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <SafeIcon icon={FiActivity} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <SafeIcon icon={FiActivity} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Waiting</p>
              <p className="text-2xl font-bold text-red-600">{stats.waiting}</p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <SafeIcon icon={FiActivity} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <SafeIcon icon={FiGrid} className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <SafeIcon icon={FiBriefcase} className="text-gray-300 text-6xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {filterStatus === 'all' 
                  ? 'No projects found'
                  : `No projects with status "${statusOptions.find(s => s.value === filterStatus)?.label}"`
                }
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Create your first project to get started
              </p>
            </motion.div>
          ) : (
            filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Project Creation/Edit Modal */}
      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onSave={editingProject ? handleUpdateProject : handleCreateProject}
        />
      )}

      {/* Project Details Modal */}
      {showDetailsModal && selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={handleCloseDetailsModal}
          onEdit={handleEditProject}
        />
      )}
    </div>
  );
}

export default ProjectsCooperations;