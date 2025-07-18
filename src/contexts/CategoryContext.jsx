import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
            id: uuidv4(),
            name: action.payload.name,
            color: action.payload.color,
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

  // Load categories from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem('todoCategories');
    if (savedCategories) {
      dispatch({ type: 'LOAD_CATEGORIES', payload: JSON.parse(savedCategories) });
    }
  }, []);

  // Save categories to localStorage whenever categories change
  useEffect(() => {
    localStorage.setItem('todoCategories', JSON.stringify(state.categories));
  }, [state.categories]);

  const addCategory = (name, color) => {
    dispatch({
      type: 'ADD_CATEGORY',
      payload: { name, color }
    });
  };

  const updateCategory = (id, updates) => {
    dispatch({
      type: 'UPDATE_CATEGORY',
      payload: { id, updates }
    });
  };

  const deleteCategory = (id) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  };

  const restoreCategory = (id) => {
    dispatch({ type: 'RESTORE_CATEGORY', payload: id });
  };

  const permanentlyDeleteCategory = (id) => {
    dispatch({ type: 'PERMANENTLY_DELETE_CATEGORY', payload: id });
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