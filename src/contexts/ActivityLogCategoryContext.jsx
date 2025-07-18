import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database';
import { syncService } from '../services/syncService';
import { useAuth } from './AuthContext';
import useRealtime from '../hooks/useRealtime';

const ActivityLogCategoryContext = createContext();

const initialState = {
  activityLogCategories: []
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
            id: action.payload.id,
            name: action.payload.name,
            color: action.payload.color,
            predefined: false,
            deleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
  const { user } = useAuth();

  // Real-time subscription for activity log categories
  useRealtime('activity_log_categories', (payload) => {
    console.log('Real-time activity log category update:', payload);
    
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && !state.activityLogCategories.find(c => c.id === payload.new.id)) {
          dispatch({
            type: 'ADD_ACTIVITY_LOG_CATEGORY',
            payload: { id: payload.new.id, name: payload.new.name, color: payload.new.color }
          });
        }
        break;
      case 'UPDATE':
        if (payload.new) {
          dispatch({
            type: 'UPDATE_ACTIVITY_LOG_CATEGORY',
            payload: { id: payload.new.id, updates: payload.new }
          });
        }
        break;
      case 'DELETE':
        if (payload.old) {
          dispatch({
            type: 'PERMANENTLY_DELETE_ACTIVITY_LOG_CATEGORY',
            payload: payload.old.id
          });
        }
        break;
    }
  }, [state.activityLogCategories]);

  // Load categories from database on mount
  useEffect(() => {
    loadActivityLogCategories();
  }, []);

  // Listen for data refresh events
  useEffect(() => {
    const handleDataRefresh = () => {
      loadActivityLogCategories();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, []);

  // Load categories from database
  const loadActivityLogCategories = async () => {
    try {
      const categories = await db.read('activity_log_categories');
      dispatch({ type: 'LOAD_ACTIVITY_LOG_CATEGORIES', payload: categories });
    } catch (error) {
      console.error('Error loading activity log categories:', error);
    }
  };

  const addActivityLogCategory = async (name, color) => {
    try {
      const newCategory = await db.create('activity_log_categories', {
        name,
        color,
        predefined: false,
        deleted: false
      });
      
      dispatch({
        type: 'ADD_ACTIVITY_LOG_CATEGORY',
        payload: { id: newCategory.id, name, color }
      });
      
      return newCategory;
    } catch (error) {
      console.error('Error adding activity log category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'create',
          table: 'activity_log_categories',
          data: { name, color, predefined: false, deleted: false }
        });
      }
      throw error;
    }
  };

  const updateActivityLogCategory = async (id, updates) => {
    try {
      await db.update('activity_log_categories', id, updates);
      dispatch({
        type: 'UPDATE_ACTIVITY_LOG_CATEGORY',
        payload: { id, updates }
      });
    } catch (error) {
      console.error('Error updating activity log category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'activity_log_categories',
          id,
          updates
        });
      }
      throw error;
    }
  };

  const deleteActivityLogCategory = async (id) => {
    try {
      // Soft delete - mark as deleted instead of removing
      await db.update('activity_log_categories', id, { 
        deleted: true, 
        deleted_at: new Date().toISOString() 
      });
      dispatch({ type: 'DELETE_ACTIVITY_LOG_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error deleting activity log category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'activity_log_categories',
          id,
          updates: { deleted: true, deleted_at: new Date().toISOString() }
        });
      }
      throw error;
    }
  };

  const restoreActivityLogCategory = async (id) => {
    try {
      await db.update('activity_log_categories', id, { 
        deleted: false, 
        deleted_at: null 
      });
      dispatch({ type: 'RESTORE_ACTIVITY_LOG_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error restoring activity log category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'activity_log_categories',
          id,
          updates: { deleted: false, deleted_at: null }
        });
      }
      throw error;
    }
  };

  const permanentlyDeleteActivityLogCategory = async (id) => {
    try {
      await db.delete('activity_log_categories', id);
      dispatch({ type: 'PERMANENTLY_DELETE_ACTIVITY_LOG_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error permanently deleting activity log category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'delete',
          table: 'activity_log_categories',
          id
        });
      }
      throw error;
    }
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