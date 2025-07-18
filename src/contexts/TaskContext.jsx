import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isToday, isPast, parseISO } from 'date-fns';
import { db } from '../services/database';
import { syncService } from '../services/syncService';
import { useAuth } from './AuthContext';
import useRealtime from '../hooks/useRealtime';

const TaskContext = createContext();

const initialState = {
  tasks: [],
  searchTerm: '',
  sortBy: 'dueDate',
  sortOrder: 'asc',
  filterStatus: 'all',
  filterPriority: 'all',
  filterCategory: 'all'
};

function taskReducer(state, action) {
  switch (action.type) {
    case 'LOAD_TASKS':
      return {
        ...state,
        tasks: action.payload
      };
    case 'ADD_TASK':
      const newTask = {
        ...action.payload.taskData,
        id: action.payload.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'open'
      };
      return {
        ...state,
        tasks: [...state.tasks, newTask]
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload, updatedAt: new Date().toISOString() }
            : task
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case 'TOGGLE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? {
                ...task,
                status: task.status === 'open' ? 'completed' : 'open',
                updatedAt: new Date().toISOString()
              }
            : task
        )
      };
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload
      };
    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder
      };
    case 'SET_FILTER':
      return {
        ...state,
        [action.payload.type]: action.payload.value
      };
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { user } = useAuth();

  // Real-time subscription for tasks
  useRealtime('tasks', (payload) => {
    console.log('Real-time task update:', payload);
    
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && !state.tasks.find(t => t.id === payload.new.id)) {
          dispatch({
            type: 'ADD_TASK',
            payload: { taskData: payload.new, id: payload.new.id }
          });
        }
        break;
      case 'UPDATE':
        if (payload.new) {
          dispatch({
            type: 'UPDATE_TASK',
            payload: { id: payload.new.id, ...payload.new }
          });
        }
        break;
      case 'DELETE':
        if (payload.old) {
          dispatch({
            type: 'DELETE_TASK',
            payload: payload.old.id
          });
        }
        break;
    }
  }, [state.tasks]);

  // Load tasks from database on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Listen for data refresh events from sync service
  useEffect(() => {
    const handleDataRefresh = () => {
      loadTasks();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, []);

  // Load tasks from database
  const loadTasks = async () => {
    try {
      const tasks = await db.read('tasks');
      dispatch({
        type: 'LOAD_TASKS',
        payload: tasks
      });
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const addTask = async (taskData) => {
    try {
      const newTask = await db.create('tasks', {
        ...taskData,
        status: 'open'
      });
      
      dispatch({
        type: 'ADD_TASK',
        payload: { taskData: newTask, id: newTask.id }
      });
      
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      // If online operation fails, queue for later
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'create',
          table: 'tasks',
          data: { ...taskData, status: 'open' }
        });
      }
      throw error;
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const updatedTask = await db.update('tasks', id, updates);
      dispatch({
        type: 'UPDATE_TASK',
        payload: { id, ...updates }
      });
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      // If online operation fails, queue for later
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'tasks',
          id,
          updates
        });
      }
      throw error;
    }
  };

  const deleteTask = async (id) => {
    try {
      await db.delete('tasks', id);
      dispatch({
        type: 'DELETE_TASK',
        payload: id
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      // If online operation fails, queue for later
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'delete',
          table: 'tasks',
          id
        });
      }
      throw error;
    }
  };

  const toggleTaskStatus = async (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'open' ? 'completed' : 'open';
    await updateTask(id, { status: newStatus });
  };

  const setSearchTerm = (term) => {
    dispatch({
      type: 'SET_SEARCH_TERM',
      payload: term
    });
  };

  const setSort = (sortBy, sortOrder) => {
    dispatch({
      type: 'SET_SORT',
      payload: { sortBy, sortOrder }
    });
  };

  const setFilter = (type, value) => {
    dispatch({
      type: 'SET_FILTER',
      payload: { type, value }
    });
  };

  // Get filtered and sorted tasks
  const getFilteredTasks = () => {
    let filtered = state.tasks;

    // Apply search filter
    if (state.searchTerm) {
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(state.searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (state.filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === state.filterStatus);
    }

    // Apply priority filter
    if (state.filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === state.filterPriority);
    }

    // Apply category filter
    if (state.filterCategory !== 'all') {
      filtered = filtered.filter(
        task => task.categories && task.categories.includes(state.filterCategory)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (state.sortBy) {
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  // Get overdue tasks
  const getOverdueTasks = () => {
    return state.tasks.filter(
      task =>
        task.status === 'open' &&
        task.dueDate &&
        isPast(parseISO(task.dueDate)) &&
        !isToday(parseISO(task.dueDate))
    );
  };

  // Get tasks due today
  const getTasksDueToday = () => {
    return state.tasks.filter(
      task => task.status === 'open' && task.dueDate && isToday(parseISO(task.dueDate))
    );
  };

  // Get urgent priority tasks
  const getUrgentTasks = () => {
    return state.tasks.filter(task => task.status === 'open' && task.priority === 'urgent');
  };

  // Get high priority tasks
  const getHighPriorityTasks = () => {
    return state.tasks.filter(task => task.status === 'open' && task.priority === 'high');
  };

  const value = {
    ...state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    setSearchTerm,
    setSort,
    setFilter,
    getFilteredTasks,
    getOverdueTasks,
    getTasksDueToday,
    getUrgentTasks,
    getHighPriorityTasks
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function TaskConsumer({ children }) {
  return <TaskContext.Consumer>{children}</TaskContext.Consumer>;
}

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};