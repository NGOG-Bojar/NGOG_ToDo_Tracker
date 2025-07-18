import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/database';
import { syncService } from '../services/syncService';
import { useAuth } from './AuthContext';
import useRealtime from '../hooks/useRealtime';

const CategoryContext = createContext();

// Empty initial state - no default categories
const initialState = {
  categories: []
};

function categoryReducer(state, action) {
  switch (action.type) {
    case 'LOAD_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [
          ...state.categories,
          {
            id: action.payload.id,
            name: action.payload.name,
            color: action.payload.color,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deleted: false
          }
        ]
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id
            ? { ...category, ...action.payload.updates }
            : category
        )
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload
            ? { ...category, deleted: true, deletedAt: new Date().toISOString() }
            : category
        )
      };
    case 'RESTORE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload
            ? { ...category, deleted: false, deletedAt: null }
            : category
        )
      };
    case 'PERMANENTLY_DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload)
      };
    default:
      return state;
  }
}

export function CategoryProvider({ children }) {
  const [state, dispatch] = useReducer(categoryReducer, initialState);
  const { user } = useAuth();

  // Real-time subscription for categories
  useRealtime('categories', (payload) => {
    console.log('Real-time category update:', payload);
    
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && !state.categories.find(c => c.id === payload.new.id)) {
          dispatch({
            type: 'ADD_CATEGORY',
            payload: { id: payload.new.id, name: payload.new.name, color: payload.new.color }
          });
        }
        break;
      case 'UPDATE':
        if (payload.new) {
          dispatch({
            type: 'UPDATE_CATEGORY',
            payload: { id: payload.new.id, updates: payload.new }
          });
        }
        break;
      case 'DELETE':
        if (payload.old) {
          dispatch({
            type: 'PERMANENTLY_DELETE_CATEGORY',
            payload: payload.old.id
          });
        }
        break;
    }
  }, [state.categories]);

  // Load categories from database on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Listen for data refresh events
  useEffect(() => {
    const handleDataRefresh = () => {
      loadCategories();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, []);

  // Load categories from database
  const loadCategories = async () => {
    try {
      const categories = await db.read('categories');
      dispatch({ type: 'LOAD_CATEGORIES', payload: categories });
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const addCategory = async (name, color) => {
    try {
      const newCategory = await db.create('categories', {
        name,
        color,
        deleted: false
      });
      
      dispatch({
        type: 'ADD_CATEGORY',
        payload: { id: newCategory.id, name, color }
      });
      
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'create',
          table: 'categories',
          data: { name, color, deleted: false }
        });
      }
      throw error;
    }
  };

  const updateCategory = async (id, updates) => {
    try {
      await db.update('categories', id, updates);
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: { id, updates }
      });
    } catch (error) {
      console.error('Error updating category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'categories',
          id,
          updates
        });
      }
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      // Soft delete - mark as deleted instead of removing
      await db.update('categories', id, { 
        deleted: true, 
        deleted_at: new Date().toISOString() 
      });
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error deleting category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'categories',
          id,
          updates: { deleted: true, deleted_at: new Date().toISOString() }
        });
      }
      throw error;
    }
  };

  const restoreCategory = async (id) => {
    try {
      await db.update('categories', id, { 
        deleted: false, 
        deleted_at: null 
      });
      dispatch({ type: 'RESTORE_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error restoring category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'update',
          table: 'categories',
          id,
          updates: { deleted: false, deleted_at: null }
        });
      }
      throw error;
    }
  };

  const permanentlyDeleteCategory = async (id) => {
    try {
      await db.delete('categories', id);
      dispatch({ type: 'PERMANENTLY_DELETE_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error permanently deleting category:', error);
      if (!navigator.onLine) {
        syncService.queueOperation({
          type: 'delete',
          table: 'categories',
          id
        });
      }
      throw error;
    }
  };

  const getCategoryById = (id) => {
    return state.categories.find(category => category.id === id);
  };

  const value = {
    ...state,
    addCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    permanentlyDeleteCategory,
    getCategoryById
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};