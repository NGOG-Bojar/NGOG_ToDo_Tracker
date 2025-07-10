import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useCategory } from '../contexts/CategoryContext';

const { FiPlus, FiEdit3, FiTrash2, FiTag, FiEye, FiEyeOff, FiRotateCcw, FiPalette } = FiIcons;

function CategoryManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });
  const [showDeletedCategories, setShowDeletedCategories] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#3B82F6');

  const { categories, addCategory, updateCategory, deleteCategory, restoreCategory, permanentlyDeleteCategory } = useCategory();

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
    '#84CC16', '#F97316', '#EC4899', '#6B7280', '#F43F5E', '#8B5A2B',
    '#059669', '#7C3AED', '#DC2626'
  ];

  // Separate active and deleted categories
  const activeCategories = categories.filter(cat => !cat.deleted);
  const deletedCategories = categories.filter(cat => cat.deleted);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, formData);
      setEditingCategory(null);
    } else {
      addCategory(formData.name.trim(), formData.color);
    }

    setFormData({ name: '', color: '#3B82F6' });
    setShowForm(false);
    setShowColorPicker(false);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, color: category.color });
    setShowForm(true);
  };

  const handleDelete = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This will move it to deleted categories.`)) {
      deleteCategory(categoryId);
    }
  };

  const handleRestore = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (window.confirm(`Are you sure you want to restore "${category.name}"?`)) {
      restoreCategory(categoryId);
    }
  };

  const handlePermanentDelete = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (window.confirm(`Are you sure you want to permanently delete "${category.name}"? This action cannot be undone.`)) {
      permanentlyDeleteCategory(categoryId);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', color: '#3B82F6' });
    setShowColorPicker(false);
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({ ...prev, color }));
    setShowColorPicker(false);
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    setFormData(prev => ({ ...prev, color }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Manager</h1>
          <p className="text-gray-600">Organize your tasks with custom categories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <SafeIcon icon={FiPlus} className="text-lg" />
          <span>New Category</span>
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="space-y-3">
                  {/* Current Color Display */}
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: formData.color }}
                    />
                    <span className="text-sm text-gray-600">Current: {formData.color}</span>
                  </div>

                  {/* Predefined Colors */}
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    
                    {/* Custom Color Picker Button */}
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className={`w-8 h-8 rounded-full border-2 border-dashed transition-all hover:scale-110 flex items-center justify-center ${
                        showColorPicker ? 'border-blue-500' : 'border-gray-400'
                      }`}
                      title="Custom Color"
                    >
                      <SafeIcon icon={FiPalette} className="text-gray-600 text-sm" />
                    </button>
                  </div>

                  {/* Custom Color Picker */}
                  <AnimatePresence>
                    {showColorPicker && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Color
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={customColor}
                            onChange={handleCustomColorChange}
                            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formData.color}
                            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="#000000"
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Categories Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {activeCategories.map(category => (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Category"
                    >
                      <SafeIcon icon={FiEdit3} className="text-sm" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the card click
                        handleDelete(category.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Category"
                    >
                      <SafeIcon icon={FiTrash2} className="text-sm" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {activeCategories.length === 0 && (
          <div className="text-center py-12">
            <SafeIcon icon={FiTag} className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No active categories yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Create your first category to organize your tasks
            </p>
          </div>
        )}
      </div>

      {/* Deleted Categories Section */}
      {deletedCategories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Deleted Categories</h2>
            <button
              onClick={() => setShowDeletedCategories(!showDeletedCategories)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <SafeIcon icon={showDeletedCategories ? FiEyeOff : FiEye} className="text-sm" />
              <span>{showDeletedCategories ? 'Hide' : 'Show'} Deleted Categories</span>
              <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded-full text-xs">
                {deletedCategories.length}
              </span>
            </button>
          </div>

          <AnimatePresence>
            {showDeletedCategories && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {deletedCategories.map(category => (
                  <motion.div
                    key={category.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full opacity-60"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-gray-700 line-through">
                          {category.name}
                        </span>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                          Deleted
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRestore(category.id)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Restore Category"
                        >
                          <SafeIcon icon={FiRotateCcw} className="text-sm" />
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(category.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Permanently Delete"
                        >
                          <SafeIcon icon={FiTrash2} className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default CategoryManager;