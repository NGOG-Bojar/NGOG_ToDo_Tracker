import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { projectService } from '../services/api';
import supabase from '../lib/supabase';

const ProjectContext = createContext();

export const PROJECT_STATUSES = {
  IDEA: 'idea',
  PREPARATION: 'preparation',
  ACTIVE: 'active',
  WAITING: 'waiting',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold'
};

export const STATUS_COLORS = {
  [PROJECT_STATUSES.IDEA]: '#6B7280',
  [PROJECT_STATUSES.PREPARATION]: '#F59E0B',
  [PROJECT_STATUSES.ACTIVE]: '#10B981',
  [PROJECT_STATUSES.WAITING]: '#EF4444',
  [PROJECT_STATUSES.COMPLETED]: '#059669',
  [PROJECT_STATUSES.ON_HOLD]: '#8B5CF6'
};

const initialState = {
  projects: [],
  isLoading: false,
  error: null
};

function projectReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_PROJECTS':
      return { ...state, projects: action.payload, isLoading: false, error: null };
    case 'ADD_PROJECT':
      return { ...state, projects: [action.payload, ...state.projects], isLoading: false, error: null };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? { ...project, ...action.payload } : project
        ),
        isLoading: false,
        error: null
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        isLoading: false,
        error: null
      };
    case 'ARCHIVE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? { ...project, archived: true, archived_at: new Date().toISOString() } : project
        ),
        isLoading: false,
        error: null
      };
    case 'RESTORE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? { ...project, archived: false, archived_at: null } : project
        ),
        isLoading: false,
        error: null
      };
    default:
      return state;
  }
}

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const projects = await projectService.getAllProjects();
        
        // Transform the data to use frontend naming conventions
        const transformedProjects = projects.map(project => ({
          ...project,
          // Ensure linkedTasks is available even if the DB field is linked_tasks
          linkedTasks: project.linked_tasks || [],
        }));
        
        dispatch({ type: 'LOAD_PROJECTS', payload: transformedProjects });
      } catch (error) {
        console.error('Error loading projects:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };
    
    loadProjects();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('projects_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'projects_ng19v3' },
        (payload) => {
          // Transform the data to use frontend naming conventions
          const transformedProject = {
            ...payload.new,
            linkedTasks: payload.new.linked_tasks || [],
          };
          
          dispatch({ type: 'ADD_PROJECT', payload: transformedProject });
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'projects_ng19v3' },
        (payload) => {
          // Transform the data to use frontend naming conventions
          const transformedProject = {
            ...payload.new,
            linkedTasks: payload.new.linked_tasks || [],
          };
          
          dispatch({ type: 'UPDATE_PROJECT', payload: transformedProject });
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'projects_ng19v3' },
        (payload) => {
          dispatch({ type: 'DELETE_PROJECT', payload: payload.old.id });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addProject = async (projectData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Transform frontend naming to backend naming
      const projectToCreate = {
        title: projectData.title,
        description: projectData.description || null,
        status: projectData.status || PROJECT_STATUSES.IDEA,
        color: projectData.color || '#3B82F6',
        participants: projectData.participants || [],
        // Use linked_tasks instead of linkedTasks for backend
        linked_tasks: projectData.linkedTasks || [],
        activity_log: [
          {
            id: uuidv4(),
            type: 'created',
            message: 'Project created',
            timestamp: new Date().toISOString(),
            auto: true,
            category: 'general'
          }
        ]
      };
      
      const newProject = await projectService.createProject(projectToCreate);
      
      // Transform back to frontend naming conventions
      const transformedProject = {
        ...newProject,
        linkedTasks: newProject.linked_tasks || [],
      };
      
      dispatch({ type: 'ADD_PROJECT', payload: transformedProject });
      return transformedProject;
    } catch (error) {
      console.error('Error adding project:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateProject = async (id, updates) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Transform frontend naming to backend naming
      const updatesToSend = { ...updates };
      if (updates.linkedTasks !== undefined) {
        updatesToSend.linked_tasks = updates.linkedTasks;
        delete updatesToSend.linkedTasks;
      }
      
      const updatedProject = await projectService.updateProject(id, updatesToSend);
      
      // Transform back to frontend naming
      const transformedProject = {
        ...updatedProject,
        linkedTasks: updatedProject.linked_tasks || [],
      };
      
      dispatch({ type: 'UPDATE_PROJECT', payload: transformedProject });
      return transformedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteProject = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await projectService.deleteProject(id);
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    } catch (error) {
      console.error('Error deleting project:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const archiveProject = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const archivedProject = await projectService.archiveProject(id);
      
      // Transform to frontend naming
      const transformedProject = {
        ...archivedProject,
        linkedTasks: archivedProject.linked_tasks || [],
      };
      
      dispatch({ type: 'ARCHIVE_PROJECT', payload: transformedProject });
      return transformedProject;
    } catch (error) {
      console.error('Error archiving project:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const restoreProject = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const restoredProject = await projectService.restoreProject(id);
      
      // Transform to frontend naming
      const transformedProject = {
        ...restoredProject,
        linkedTasks: restoredProject.linked_tasks || [],
      };
      
      dispatch({ type: 'RESTORE_PROJECT', payload: transformedProject });
      return transformedProject;
    } catch (error) {
      console.error('Error restoring project:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const getProjectById = (id) => {
    return state.projects.find(project => project.id === id);
  };

  const getArchivedProjects = () => {
    return state.projects.filter(project => project.archived);
  };

  const getActiveProjects = () => {
    return state.projects.filter(project => !project.archived);
  };

  const linkTaskToProject = (projectId, taskId, taskTitle) => {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const linkedTasks = [...(project.linkedTasks || [])];
    if (!linkedTasks.includes(taskId)) {
      linkedTasks.push(taskId);
      
      const activityLog = [...(project.activityLog || [])];
      activityLog.push({
        id: uuidv4(),
        type: 'task_linked',
        message: `Task "${taskTitle}" linked to project`,
        timestamp: new Date().toISOString(),
        auto: true,
        category: 'general'
      });
      
      updateProject(projectId, { linkedTasks, activityLog });
    }
  };

  const unlinkTaskFromProject = (projectId, taskId, taskTitle) => {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const linkedTasks = [...(project.linkedTasks || [])];
    const index = linkedTasks.indexOf(taskId);
    if (index !== -1) {
      linkedTasks.splice(index, 1);
      
      const activityLog = [...(project.activityLog || [])];
      activityLog.push({
        id: uuidv4(),
        type: 'task_unlinked',
        message: `Task "${taskTitle}" unlinked from project`,
        timestamp: new Date().toISOString(),
        auto: true,
        category: 'general'
      });
      
      updateProject(projectId, { linkedTasks, activityLog });
    }
  };

  const addActivityLog = (projectId, entry) => {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const activityLog = [...(project.activityLog || [])];
    activityLog.push({
      id: uuidv4(),
      ...entry,
      timestamp: new Date().toISOString()
    });
    
    updateProject(projectId, { activityLog });
  };

  const deleteActivityLog = (projectId, entryId) => {
    const project = getProjectById(projectId);
    if (!project) return;
    
    const activityLog = project.activityLog.filter(entry => entry.id !== entryId);
    updateProject(projectId, { activityLog });
  };

  const value = {
    ...state,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    restoreProject,
    getProjectById,
    getArchivedProjects,
    getActiveProjects,
    linkTaskToProject,
    unlinkTaskFromProject,
    addActivityLog,
    deleteActivityLog,
    PROJECT_STATUSES,
    STATUS_COLORS
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};