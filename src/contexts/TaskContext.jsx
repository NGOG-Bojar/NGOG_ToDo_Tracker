import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { taskService } from '../services/api';
import { isToday, isPast, parseISO } from 'date-fns';
import supabase from '../lib/supabase';

const TaskContext = createContext();

const initialState = {
  tasks: [],
  searchTerm: '',
  sortBy: 'due_date',
  sortOrder: 'asc',
  filterStatus: 'all',
  filterPriority: 'all',
  filterCategory: 'all',
  isLoading: false,
  error: null
};

function taskReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOAD_TASKS':
      return { ...state, tasks: action.payload, isLoading: false, error: null };
    case 'ADD_TASK':
      // Ensure we don't add duplicate tasks
      if (state.tasks.some(task => task.id === action.payload.id)) {
        return state;
      }
      return { ...state, tasks: [action.payload, ...state.tasks], isLoading: false, error: null };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload } : task
        ),
        isLoading: false,
        error: null
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        isLoading: false,
        error: null
      };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
    case 'SET_FILTER':
      return { ...state, [action.payload.type]: action.payload.value };
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Load tasks on initial mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        console.log('Loading tasks from Supabase...');
        const tasks = await taskService.getAllTasks();
        console.log('Tasks loaded successfully:', tasks);
        dispatch({ type: 'LOAD_TASKS', payload: tasks });
      } catch (error) {
        console.error('Error loading tasks:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load tasks' });
      }
    };

    loadTasks();
  }, []);

  // Set up Supabase real-time subscription
  useEffect(() => {
    console.log('Setting up Supabase real-time subscription...');
    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks_ng19v3' }, (payload) => {
        console.log('INSERT event received:', payload);
        dispatch({ type: 'ADD_TASK', payload: payload.new });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks_ng19v3' }, (payload) => {
        console.log('UPDATE event received:', payload);
        dispatch({ type: 'UPDATE_TASK', payload: payload.new });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks_ng19v3' }, (payload) => {
        console.log('DELETE event received:', payload);
        dispatch({ type: 'DELETE_TASK', payload: payload.old.id });
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up Supabase subscription');
      channel.unsubscribe();
    };
  }, []);

  const addTask = async (taskData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      console.log('Adding new task with data:', taskData);
      
      // Prepare task data with correct structure
      const taskToCreate = {
        title: taskData.title,
        description: taskData.description || null,
        due_date: taskData.due_date || null,
        priority: taskData.priority || 'medium',
        status: 'open',
        categories: Array.isArray(taskData.categories) ? taskData.categories : [],
        notes: taskData.notes || null,
        checklist: Array.isArray(taskData.checklist) ? taskData.checklist : [],
        linked_project: taskData.linked_project || null,
      };

      // Create task in Supabase
      const newTask = await taskService.createTask(taskToCreate);
      console.log('Task created successfully:', newTask);

      // Update local state
      dispatch({ type: 'ADD_TASK', payload: newTask });
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to add task' });
      return null;
    }
  };

  const updateTask = async (id, updates) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      console.log(`Updating task ${id} with:`, updates);
      
      // Update task in Supabase
      const updatedTask = await taskService.updateTask(id, updates);
      console.log('Task updated successfully:', updatedTask);

      // Update local state
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update task' });
      return null;
    }
  };

  const deleteTask = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      console.log(`Deleting task ${id}`);
      
      // Delete task from Supabase
      await taskService.deleteTask(id);
      console.log('Task deleted successfully');

      // Update local state
      dispatch({ type: 'DELETE_TASK', payload: id });
    } catch (error) {
      console.error('Error deleting task:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete task' });
    }
  };

  const toggleTaskStatus = async (id) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) {
      console.error(`Task with id ${id} not found`);
      return;
    }

    const newStatus = task.status === 'open' ? 'completed' : 'open';
    console.log(`Toggling task ${id} status from ${task.status} to ${newStatus}`);

    try {
      await updateTask(id, { status: newStatus });
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const setSearchTerm = (term) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  };

  const setSort = (sortBy, sortOrder) => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
  };

  const setFilter = (type, value) => {
    dispatch({ type: 'SET_FILTER', payload: { type, value } });
  };

  const getFilteredTasks = () => {
    let filtered = state.tasks;

    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    if (state.filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === state.filterStatus);
    }

    if (state.filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === state.filterPriority);
    }

    if (state.filterCategory !== 'all') {
      filtered = filtered.filter(
        task => task.categories && task.categories.includes(state.filterCategory)
      );
    }

    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (state.sortBy) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
          bValue = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      return state.sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    return filtered;
  };

  const getOverdueTasks = () => {
    return state.tasks.filter(
      task =>
        task.status === 'open' &&
        task.due_date &&
        isPast(parseISO(task.due_date)) &&
        !isToday(parseISO(task.due_date))
    );
  };

  const getTasksDueToday = () => {
    return state.tasks.filter(
      task => task.status === 'open' && task.due_date && isToday(parseISO(task.due_date))
    );
  };

  const getUrgentTasks = () => {
    return state.tasks.filter(task => task.status === 'open' && task.priority === 'urgent');
  };

  const getHighPriorityTasks = () => {
    return state.tasks.filter(task => task.status === 'open' && task.priority === 'high');
  };

  const value = {
    ...state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    clearError,
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

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};