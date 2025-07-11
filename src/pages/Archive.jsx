import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useTask } from '../contexts/TaskContext';
import { useProject } from '../contexts/ProjectContext';
import { useCategory } from '../contexts/CategoryContext';
import TaskCard from '../components/TaskCard';
import ProjectCard from '../components/ProjectCard';
import TaskModal from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';
import ProjectDetailsModal from '../components/ProjectDetailsModal';
import { format, parseISO } from 'date-fns';

const { FiArchive, FiTrash2, FiFilter, FiCalendar, FiSearch, FiBriefcase, FiList, FiRotateCcw, FiFileText } = FiIcons;

function Archive() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [groupByDate, setGroupByDate] = useState(true);
  
  // Task-related states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Project-related states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const { tasks, deleteTask, toggleTaskStatus, updateTask } = useTask();
  const { 
    projects, 
    deleteProject, 
    restoreProject, 
    updateProject,
    getArchivedProjects,
    PROJECT_STATUSES 
  } = useProject();
  const { categories } = useCategory();

  // Get archived data
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const archivedProjects = getArchivedProjects();

  // Apply filters to tasks
  const filteredTasks = completedTasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filter
    const matchesCategory = selectedCategory === 'all' ||
      (selectedCategory === 'uncategorized' 
        ? !task.categories || task.categories.length === 0
        : task.categories && task.categories.includes(selectedCategory));

    // Priority filter
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;

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

  // Apply filters to projects
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

  // Group projects by archived date if groupByDate is true
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
  const sortedTaskDates = Object.keys(groupedTasks).sort((a, b) => new Date(b) - new Date(a));
  const sortedProjectDates = Object.keys(groupedProjects).sort((a, b) => new Date(b) - new Date(a));

  // Task handlers
  const handleDeleteTask = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this task?')) {
      deleteTask(id);
    }
  };

  const handleRestoreTask = (id) => {
    toggleTaskStatus(id);
  };

  const handleTaskClick = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowTaskModal(true);
    }
  };

  const handleUpdateTask = (id, updates) => {
    updateTask(id, updates);
    setSelectedTask(null);
    setShowTaskModal(false);
  };

  // Project handlers
  const handleDeleteProject = (id) => {
    const project = archivedProjects.find(p => p.id === id);
    if (window.confirm(`Are you sure you want to permanently delete "${project.title}"?`)) {
      deleteProject(id);
    }
  };

  const handleRestoreProject = (id) => {
    const project = archivedProjects.find(p => p.id === id);
    if (window.confirm(`Are you sure you want to restore "${project.title}" from archive?`)) {
      restoreProject(id);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleViewProjectDetails = (project) => {
    setSelectedProject(project);
    setShowProjectDetailsModal(true);
  };

  const handleUpdateProject = (id, updates) => {
    updateProject(id, updates);
    setEditingProject(null);
    setShowProjectModal(false);
    setShowProjectDetailsModal(false);
  };

  // Clear all handlers
  const handleClearAllTasks = () => {
    if (window.confirm('Are you sure you want to permanently delete ALL archived tasks? This cannot be undone.')) {
      completedTasks.forEach(task => deleteTask(task.id));
    }
  };

  const handleClearAllProjects = () => {
    if (window.confirm('Are you sure you want to permanently delete ALL archived projects? This cannot be undone.')) {
      archivedProjects.forEach(project => deleteProject(project.id));
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedPriority('all');
    setSelectedStatus('all');
    setSelectedPeriod('all');
  };

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: FiList, count: completedTasks.length },
    { id: 'projects', label: 'Projects', icon: FiBriefcase, count: archivedProjects.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archive</h1>
          <p className="text-gray-600">
            View and manage your archived tasks and projects
            {activeTab === 'tasks' && filteredTasks.length !== completedTasks.length && (
              <span className="ml-2 text-sm text-blue-600">
                ({filteredTasks.length} of {completedTasks.length} tasks shown)
              </span>
            )}
            {activeTab === 'projects' && filteredProjects.length !== archivedProjects.length && (
              <span className="ml-2 text-sm text-blue-600">
                ({filteredProjects.length} of {archivedProjects.length} projects shown)
              </span>
            )}
          </p>
        </div>
        {((activeTab === 'tasks' && completedTasks.length > 0) || 
          (activeTab === 'projects' && archivedProjects.length > 0)) && (
          <button
            onClick={activeTab === 'tasks' ? handleClearAllTasks : handleClearAllProjects}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <SafeIcon icon={FiTrash2} className="text-lg" />
            <span>Clear All {activeTab === 'tasks' ? 'Tasks' : 'Projects'}</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border">
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
                  {tab.count > 0 && (
                    <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        {((activeTab === 'tasks' && completedTasks.length > 0) || 
          (activeTab === 'projects' && archivedProjects.length > 0)) && (
          <div className="p-4">
            <div className="flex flex-col space-y-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search archived ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap gap-3">
                {/* Task-specific filters */}
                {activeTab === 'tasks' && (
                  <>
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
                  </>
                )}

                {/* Project-specific filters */}
                {activeTab === 'projects' && (
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value={PROJECT_STATUSES.IDEA}>Idea</option>
                    <option value={PROJECT_STATUSES.PREPARATION}>In Preparation</option>
                    <option value={PROJECT_STATUSES.ACTIVE}>Active</option>
                    <option value={PROJECT_STATUSES.WAITING}>Waiting</option>
                    <option value={PROJECT_STATUSES.COMPLETED}>Completed</option>
                    <option value={PROJECT_STATUSES.ON_HOLD}>On Hold</option>
                  </select>
                )}

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
                {(searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all' || 
                  selectedStatus !== 'all' || selectedPeriod !== 'all') && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    <SafeIcon icon={FiFilter} className="text-sm" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {filteredTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <SafeIcon icon={FiArchive} className="text-gray-300 text-6xl mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {completedTasks.length === 0 
                      ? 'No archived tasks found' 
                      : 'No tasks match your filters'}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {completedTasks.length === 0 
                      ? "Tasks will appear here once they're marked as completed"
                      : 'Try adjusting your filters to see more results'}
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
                sortedTaskDates.map(date => (
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
                        onEdit={handleTaskClick}
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
                    onEdit={handleTaskClick}
                  />
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {filteredProjects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <SafeIcon icon={FiBriefcase} className="text-gray-300 text-6xl mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {archivedProjects.length === 0 
                      ? 'No archived projects found' 
                      : 'No projects match your filters'}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {archivedProjects.length === 0 
                      ? "Projects will appear here once they're archived"
                      : 'Try adjusting your filters to see more results'}
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
                sortedProjectDates.map(date => (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedProjects[date].map(project => (
                        <ProjectArchiveCard
                          key={project.id}
                          project={project}
                          onDelete={handleDeleteProject}
                          onRestore={handleRestoreProject}
                          onEdit={handleEditProject}
                          onViewDetails={handleViewProjectDetails}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map(project => (
                    <ProjectArchiveCard
                      key={project.id}
                      project={project}
                      onDelete={handleDeleteProject}
                      onRestore={handleRestoreProject}
                      onEdit={handleEditProject}
                      onViewDetails={handleViewProjectDetails}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedTask(null);
          }}
          onSave={handleUpdateTask}
        />
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onSave={handleUpdateProject}
        />
      )}

      {/* Project Details Modal */}
      {showProjectDetailsModal && selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => {
            setShowProjectDetailsModal(false);
            setSelectedProject(null);
          }}
          onEdit={handleEditProject}
        />
      )}
    </div>
  );
}

// Task Archive Card Component
function TaskArchiveCard({ task, onDelete, onRestore, onEdit }) {
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
            title="Restore Task"
          >
            <SafeIcon icon={FiRotateCcw} className="text-sm" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 
              className="font-medium text-gray-500 line-through cursor-pointer hover:text-gray-700"
              onClick={() => onEdit(task.id)}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm mb-2 text-gray-400 line-clamp-2">
                {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                {task.description.length > 100 && '...'}
              </p>
            )}
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
              <span>
                Completed: {format(parseISO(task.updatedAt || task.createdAt), 'MMM dd, yyyy')}
              </span>
              <span>•</span>
              <span
                className={`px-2 py-1 rounded-full ${
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
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete Permanently"
        >
          <SafeIcon icon={FiTrash2} className="text-sm" />
        </button>
      </div>
    </motion.div>
  );
}

// Project Archive Card Component
function ProjectArchiveCard({ project, onDelete, onRestore, onEdit, onViewDetails }) {
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow opacity-80"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full opacity-60" 
            style={{ backgroundColor: project.color || '#3B82F6' }} 
          />
          <h3 
            className="font-medium text-gray-500 line-through cursor-pointer hover:text-gray-700 truncate"
            onClick={() => onViewDetails(project)}
          >
            {project.title}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onRestore(project.id)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
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

      {/* Status */}
      <div className="mb-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-100">
          {getStatusLabel(project.status)}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Archive info */}
      <div className="text-xs text-gray-400">
        <div>Archived: {format(parseISO(project.archivedAt), 'MMM dd, yyyy')}</div>
        {project.linkedTasks && project.linkedTasks.length > 0 && (
          <div className="mt-1">
            {project.linkedTasks.length} linked task{project.linkedTasks.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Archive;