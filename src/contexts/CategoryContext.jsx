import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { categoryService } from '../services/api';

const CategoryContext = createContext();

const initialState = {
  categories: [],
  isLoading: false,
  error: null
};

function categoryReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_CATEGORIES':
      return { ...state, categories: action.payload, isLoading: false, error: null };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
        isLoading: false,
        error: null
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? { ...category, ...action.payload } : category
        ),
        isLoading: false,
        error: null
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload ? 
          { ...category, deleted: true, deleted_at: new Date().toISOString() } : 
          category
        ),
        isLoading: false,
        error: null
      };
    case 'RESTORE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload ? 
          { ...category, deleted: false, deleted_at: null } : 
          category
        ),
        isLoading: false,
        error: null
      };
    default:
      return state;
  }
}

export function CategoryProvider({ children }) {
  const [state, dispatch] = useReducer(categoryReducer, initialState);

  // Load categories from Supabase on mount
  useEffect(() => {
    const loadCategories = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const categories = await categoryService.getAllCategories();
        dispatch({ type: 'LOAD_CATEGORIES', payload: categories });
      } catch (error) {
        console.error('Error loading categories:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };

    loadCategories();
  }, []);

  const addCategory = async (name, color) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newCategory = await categoryService.createCategory({ name, color });
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    } catch (error) {
      console.error('Error adding category:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateCategory = async (id, updates) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const updatedCategory = await categoryService.updateCategory(id, updates);
      dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
    } catch (error) {
      console.error('Error updating category:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const deleteCategory = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await categoryService.deleteCategory(id);
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error deleting category:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const restoreCategory = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await categoryService.restoreCategory(id);
      dispatch({ type: 'RESTORE_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error restoring category:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
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