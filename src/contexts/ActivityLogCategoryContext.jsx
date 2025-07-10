import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ActivityLogCategoryContext = createContext();

const initialState = {
  activityLogCategories: [
    // Default categories
    { id: 'general', name: 'General', color: '#6B7280', predefined: true },
    { id: 'milestone', name: 'Milestone', color: '#10B981', predefined: true },
    { id: 'update', name: 'Update', color: '#3B82F6', predefined: true },
    { id: 'issue', name: 'Issue', color: '#EF4444', predefined: true },
    { id: 'meeting', name: 'Meeting', color: '#8B5CF6', predefined: true },
    { id: 'decision', name: 'Decision', color: '#F59E0B', predefined: true }
  ]
};

function activityLogCategoryReducer(state, action) {
  switch (action.type) {
    case 'LOAD_ACTIVITY_LOG_CATEGORIES':
      return { ...state, activityLogCategories: action.payload };
    case 'ADD_ACTIVITY_LOG_CATEGORY':
      return {
        ...state,
        activityLogCategories: [
          ...state.activityLogCategories,
          {
            id: uuidv4(),
            name: action.payload.name,
            color: action.payload.color,
            predefined: false,
            deleted: false
          }
        ]
      };
    case 'UPDATE_ACTIVITY_LOG_CATEGORY':
      return {
        ...state,
        activityLogCategories: state.activityLogCategories.map(category =>
          category.id === action.payload.id
            ? { ...category, ...action.payload.updates }
            : category
        )
      };
    case 'DELETE_ACTIVITY_LOG_CATEGORY':
      return {
        ...state,
        activityLogCategories: state.activityLogCategories.map(category =>
          category.id === action.payload
            ? { ...category, deleted: true, deletedAt: new Date().toISOString() }
            : category
        )
      };
    case 'RESTORE_ACTIVITY_LOG_CATEGORY':
      return {
        ...state,
        activityLogCategories: state.activityLogCategories.map(category =>
          category.id === action.payload
            ? { ...category, deleted: false, deletedAt: null }
            : category
        )
      };
    case 'PERMANENTLY_DELETE_ACTIVITY_LOG_CATEGORY':
      return {
        ...state,
        activityLogCategories: state.activityLogCategories.filter(category =>
          category.id !== action.payload
        )
      };
    default:
      return state;
  }
}

export function ActivityLogCategoryProvider({ children }) {
  const [state, dispatch] = useReducer(activityLogCategoryReducer, initialState);

  // Load categories from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('todoActivityLogCategories');
    if (savedCategories) {
      dispatch({ type: 'LOAD_ACTIVITY_LOG_CATEGORIES', payload: JSON.parse(savedCategories) });
    }
  }, []);

  // Save categories to localStorage whenever categories change
  useEffect(() => {
    localStorage.setItem('todoActivityLogCategories', JSON.stringify(state.activityLogCategories));
  }, [state.activityLogCategories]);

  const addActivityLogCategory = (name, color) => {
    dispatch({ type: 'ADD_ACTIVITY_LOG_CATEGORY', payload: { name, color } });
  };

  const updateActivityLogCategory = (id, updates) => {
    dispatch({ type: 'UPDATE_ACTIVITY_LOG_CATEGORY', payload: { id, updates } });
  };

  const deleteActivityLogCategory = (id) => {
    dispatch({ type: 'DELETE_ACTIVITY_LOG_CATEGORY', payload: id });
  };

  const restoreActivityLogCategory = (id) => {
    dispatch({ type: 'RESTORE_ACTIVITY_LOG_CATEGORY', payload: id });
  };

  const permanentlyDeleteActivityLogCategory = (id) => {
    dispatch({ type: 'PERMANENTLY_DELETE_ACTIVITY_LOG_CATEGORY', payload: id });
  };

  const getActivityLogCategoryById = (id) => {
    return state.activityLogCategories.find(category => category.id === id);
  };

  const getActiveActivityLogCategories = () => {
    return state.activityLogCategories.filter(category => !category.deleted);
  };

  const value = {
    ...state,
    addActivityLogCategory,
    updateActivityLogCategory,
    deleteActivityLogCategory,
    restoreActivityLogCategory,
    permanentlyDeleteActivityLogCategory,
    getActivityLogCategoryById,
    getActiveActivityLogCategories
  };

  return (
    <ActivityLogCategoryContext.Provider value={value}>
      {children}
    </ActivityLogCategoryContext.Provider>
  );
}

export const useActivityLogCategory = () => {
  const context = useContext(ActivityLogCategoryContext);
  if (!context) {
    throw new Error('useActivityLogCategory must be used within an ActivityLogCategoryProvider');
  }
  return context;
};