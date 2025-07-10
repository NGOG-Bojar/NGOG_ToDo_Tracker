import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
      return {
        ...state,
        projects: action.payload
      };
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [
          ...state.projects,
          {
            id: uuidv4(),
            ...action.payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            activityLog: [
              {
                id: uuidv4(),
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

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('todoProjects');
    if (savedProjects) {
      dispatch({
        type: 'LOAD_PROJECTS',
        payload: JSON.parse(savedProjects)
      });
    }
  }, []);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem('todoProjects', JSON.stringify(state.projects));
  }, [state.projects]);

  const addProject = (projectData) => {
    dispatch({
      type: 'ADD_PROJECT',
      payload: projectData
    });
  };

  const updateProject = (id, updates) => {
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: { id, updates }
    });
  };

  const deleteProject = (id) => {
    dispatch({
      type: 'DELETE_PROJECT',
      payload: id
    });
  };

  const addActivityLog = (projectId, entry) => {
    dispatch({
      type: 'ADD_ACTIVITY_LOG',
      payload: { projectId, entry }
    });
  };

  const deleteActivityLog = (projectId, entryId) => {
    dispatch({
      type: 'DELETE_ACTIVITY_LOG',
      payload: { projectId, entryId }
    });
  };

  const linkTaskToProject = (projectId, taskId, taskTitle) => {
    dispatch({
      type: 'LINK_TASK_TO_PROJECT',
      payload: { projectId, taskId, taskTitle }
    });
  };

  const unlinkTaskFromProject = (projectId, taskId, taskTitle) => {
    dispatch({
      type: 'UNLINK_TASK_FROM_PROJECT',
      payload: { projectId, taskId, taskTitle }
    });
  };

  const getProjectById = (id) => {
    return state.projects.find(project => project.id === id);
  };

  const getProjectsByStatus = (status) => {
    return state.projects.filter(project => project.status === status);
  };

  const value = {
    ...state,
    addProject,
    updateProject,
    deleteProject,
    addActivityLog,
    deleteActivityLog,
    linkTaskToProject,
    unlinkTaskFromProject,
    getProjectById,
    getProjectsByStatus,
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