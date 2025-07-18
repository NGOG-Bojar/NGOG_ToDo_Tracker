import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database';
import { syncService } from '../services/syncService';
import { useAuth } from './AuthContext';
import useRealtime from '../hooks/useRealtime';

const ProjectContext = createContext();

const initialState = {
  projects: []
};

const PROJECT_STATUSES = {
  IDEA: 'idea',
  PREPARATION: 'preparation',
  ACTIVE: 'active',
  WAITING: 'waiting',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold'
};

const STATUS_COLORS = {
  idea: '#6B7280',
  preparation: '#F59E0B',
  active: '#10B981',
  waiting: '#EF4444',
  completed: '#059669',
  on_hold: '#8B5CF6'
};

function projectReducer(state, action) {
  switch (action.type) {
    case 'LOAD_PROJECTS':
      return { ...state, projects: action.payload };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [
          ...state.projects,
          {
            id: action.payload.id,
            ...action.payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archived: false,
            activityLog: [
              {
                id: action.payload.activityLogId || uuidv4(),
                type: 'created',
                message: 'Project created',
                timestamp: new Date().toISOString(),
                auto: true,
                category: 'general'
              }
            ]
          }
        ]
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.id) {
            const updatedProject = {
              ...project,
              ...action.payload.updates,
              updatedAt: new Date().toISOString()
            };

            // Add activity log entry for status changes
            if (action.payload.updates.status && action.payload.updates.status !== project.status) {
              const statusChangeEntry = {
                id: uuidv4(),
                type: 'status_change',
                message: `Status changed from ${project.status} to ${action.payload.updates.status}`,
                timestamp: new Date().toISOString(),
                auto: true,
                category: 'update'
              };
              updatedProject.activityLog = [...(project.activityLog || []), statusChangeEntry];
            }

            return updatedProject;
          }
          return project;
        })
      };

    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload)
      };

    case 'ARCHIVE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload) {
            return {
              ...project,
              archived: true,
              archivedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              activityLog: [
                ...(project.activityLog || []),
                {
                  id: uuidv4(),
                  type: 'archived',
                  message: 'Project archived',
                  timestamp: new Date().toISOString(),
                  auto: true,
                  category: 'general'
                }
              ]
            };
          }
          return project;
        })
      };

    case 'RESTORE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload) {
            return {
              ...project,
              archived: false,
              archivedAt: null,
              updatedAt: new Date().toISOString(),
              activityLog: [
                ...(project.activityLog || []),
                {
                  id: uuidv4(),
                  type: 'restored',
                  message: 'Project restored from archive',
                  timestamp: new Date().toISOString(),
                  auto: true,
                  category: 'general'
                }
              ]
            };
          }
          return project;
        })
      };

    case 'ADD_ACTIVITY_LOG':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.projectId) {
            return {
              ...project,
              activityLog: [
                ...(project.activityLog || []),
                {
                  id: uuidv4(),
                  ...action.payload.entry,
                  timestamp: new Date().toISOString()
                }
              ]
            };
          }
          return project;
        })
      };

    case 'DELETE_ACTIVITY_LOG':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.projectId) {
            return {
              ...project,
              activityLog: (project.activityLog || []).filter(
                entry => entry.id !== action.payload.entryId
              )
            };
          }
          return project;
        })
      };

    case 'LINK_TASK_TO_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.projectId) {
            const linkedTasks = project.linkedTasks || [];
            if (!linkedTasks.includes(action.payload.taskId)) {
              return {
                ...project,
                linkedTasks: [...linkedTasks, action.payload.taskId],
                activityLog: [
                  ...(project.activityLog || []),
                  {
                    id: uuidv4(),
                    type: 'task_linked',
                    message: `Task "${action.payload.taskTitle}" linked to project`,
                    timestamp: new Date().toISOString(),
                    auto: true,
                    category: 'update'
                  }
                ]
              };
            }
          }
          return project;
        })
      };

    case 'UNLINK_TASK_FROM_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project => {
          if (project.id === action.payload.projectId) {
            return {
              ...project,
              linkedTasks: (project.linkedTasks || []).filter(
                taskId => taskId !== action.payload.taskId
              ),
              activityLog: [
                ...(project.activityLog || []),
                {
                  id: uuidv4(),
                  type: 'task_unlinked',
                  message: `Task "${action.payload.taskTitle}" unlinked from project`,
                  timestamp: new Date().toISOString(),
                  auto: true,
                  category: 'update'
                }
              ]
            };
          }
          return project;
        })
      };

    default:
      return state;
  }
}

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { user } = useAuth();

  // Load projects from database on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Listen for data refresh events
  useEffect(() => {
    const handleDataRefresh = () => {
      loadProjects();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, []);

  // Real-time subscription for projects
  useRealtime('projects', (payload) => {
    console.log('Real-time project update:', payload);
    
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && !state.projects.find(p => p.id === payload.new.id)) {
          dispatch({ 
            type: 'ADD_PROJECT', 
            payload: { 
              ...payload.new, 
              id: payload.new.id,
              activityLog: [] // Initialize empty activity log for real-time updates
            } 
          });
        }
        break;
      case 'UPDATE':
        if (payload.new) {
          dispatch({ 
            type: 'UPDATE_PROJECT', 
            payload: { id: payload.new.id, updates: payload.new } 
          });
        }
        break;
      case 'DELETE':
        if (payload.old) {
          dispatch({ type: 'DELETE_PROJECT', payload: payload.old.id });
        }
        break;
    }
  }, [state.projects]);

  // Load projects from database
  const loadProjects = async () => {
    try {
      const projects = await db.read('projects');
      dispatch({ type: 'LOAD_PROJECTS', payload: projects });
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const addProject = async (projectData) => {
    try {
      const activityLogId = uuidv4();
      
      // Create project without activityLog (it goes in separate table)
      const newProject = await db.create('projects', {
        ...projectData,
        archived: false
      });
      
      // Create initial activity log entry in separate table
      await db.create('project_activity_logs', {
        project_id: newProject.id,
        type: 'created',
        message: 'Project created',
        auto: true,
        category: 'general'
      });
      
      dispatch({ 
        type: 'ADD_PROJECT', 
        payload: { 
          ...projectData, 
          id: newProject.id,
          activityLogId,
          // Include activityLog for local state (UI expects this)
          activityLog: [
            {
              id: activityLogId,
              type: 'created',
              message: 'Project created',
              timestamp: new Date().toISOString(),
              auto: true,
              category: 'general'
            }
          ]
        } 
      });
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'create',
          table: 'projects',
          data: { ...projectData, archived: false }
        });
      }
      throw error;
    }
  };

  const updateProject = async (id, updates) => {
    try {
      await db.update('projects', id, updates);
      dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
    } catch (error) {
      console.error('Error updating project:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'projects',
          id,
          updates
        });
      }
      throw error;
    }
  };

  const deleteProject = async (id) => {
    try {
      await db.delete('projects', id);
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    } catch (error) {
      console.error('Error deleting project:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'delete',
          table: 'projects',
          id
        });
      }
      throw error;
    }
  };

  const archiveProject = async (id) => {
    try {
      await db.update('projects', id, { 
        archived: true, 
        archived_at: new Date().toISOString() 
      });
      dispatch({ type: 'ARCHIVE_PROJECT', payload: id });
    } catch (error) {
      console.error('Error archiving project:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'projects',
          id,
          updates: { archived: true, archived_at: new Date().toISOString() }
        });
      }
      throw error;
    }
  };

  const restoreProject = async (id) => {
    try {
      await db.update('projects', id, { 
        archived: false, 
        archived_at: null 
      });
      dispatch({ type: 'RESTORE_PROJECT', payload: id });
    } catch (error) {
      console.error('Error restoring project:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'projects',
          id,
          updates: { archived: false, archived_at: null }
        });
      }
      throw error;
    }
  };

  const addActivityLog = (projectId, entry) => {
    dispatch({ type: 'ADD_ACTIVITY_LOG', payload: { projectId, entry } });
  };

  const deleteActivityLog = (projectId, entryId) => {
    dispatch({ type: 'DELETE_ACTIVITY_LOG', payload: { projectId, entryId } });
  };

  const linkTaskToProject = (projectId, taskId, taskTitle) => {
    dispatch({ type: 'LINK_TASK_TO_PROJECT', payload: { projectId, taskId, taskTitle } });
  };

  const unlinkTaskFromProject = (projectId, taskId, taskTitle) => {
    dispatch({ type: 'UNLINK_TASK_FROM_PROJECT', payload: { projectId, taskId, taskTitle } });
  };

  const getProjectById = (id) => {
    return state.projects.find(project => project.id === id);
  };

  const getProjectsByStatus = (status) => {
    return state.projects.filter(project => project.status === status && !project.archived);
  };

  const getActiveProjects = () => {
    return state.projects.filter(project => !project.archived);
  };

  const getArchivedProjects = () => {
    return state.projects.filter(project => project.archived);
  };

  const value = {
    ...state,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    restoreProject,
    addActivityLog,
    deleteActivityLog,
    linkTaskToProject,
    unlinkTaskFromProject,
    getProjectById,
    getProjectsByStatus,
    getActiveProjects,
    getArchivedProjects,
    PROJECT_STATUSES,
    STATUS_COLORS
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};