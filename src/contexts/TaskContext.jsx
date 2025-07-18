import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isToday, isPast, parseISO } from 'date-fns';
import { useProject } from './ProjectContext';

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
        id: action.payload.id || uuidv4(),
        createdAt: new Date().toISOString(),
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

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
      dispatch({
        type: 'LOAD_TASKS',
        payload: JSON.parse(savedTasks)
      });
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('todoTasks', JSON.stringify(state.tasks));
  }, [state.tasks]);

  const addTask = (taskData) => {
    const taskId = uuidv4();
    dispatch({
      type: 'ADD_TASK',
      payload: { taskData, id: taskId }
    });
    
    // Return the task object with the generated ID
    return {
      ...taskData,
      id: taskId,
      createdAt: new Date().toISOString(),
      status: 'open'
    };
  };

  const updateTask = (id, updates) => {
    dispatch({
      type: 'UPDATE_TASK',
      payload: { id, ...updates }
    });
  };

  const deleteTask = (id) => {
    dispatch({
      type: 'DELETE_TASK',
      payload: id
    });
  };

  const toggleTaskStatus = (id) => {
    dispatch({
      type: 'TOGGLE_TASK_STATUS',
      payload: id
    });
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