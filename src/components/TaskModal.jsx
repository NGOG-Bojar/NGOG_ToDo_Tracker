import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useCategory } from '../contexts/CategoryContext';
import { useProject } from '../contexts/ProjectContext';
import { format, addDays, addWeeks } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { FiX, FiPlus, FiTrash2, FiCheck, FiCalendar, FiArrowUp, FiArrowDown, FiMove, FiLink } = FiIcons;

function TaskModal({ task, onClose, onSave }) {
  const { categories } = useCategory();
  const { projects, linkTaskToProject } = useProject();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    categories: [],
    notes: '',
    checklist: [],
    linkedProject: ''
  });
  
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate || '',
        priority: task.priority || 'medium',
        categories: task.categories || [],
        notes: task.notes || '',
        checklist: task.checklist || [],
        linkedProject: task.linkedProject || ''
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const taskData = {
      ...formData,
      title: formData.title.trim(),
      notes: formData.notes.trim()
    };

    if (task) {
      onSave(task.id, taskData);
    } else {
      const newTask = onSave(taskData);
      
      // Link to project if selected
      if (formData.linkedProject && newTask) {
        linkTaskToProject(formData.linkedProject, newTask.id || Date.now(), taskData.title);
      }
    }
    
    onClose();
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const addChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, { id: Date.now(), text: '', completed: false }]
    }));
  };

  const updateChecklistItem = (id, updates) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const removeChecklistItem = (id) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  // Move checklist item up
  const moveItemUp = (id) => {
    setFormData(prev => {
      const checklist = [...prev.checklist];
      const index = checklist.findIndex(item => item.id === id);
      if (index > 0) {
        [checklist[index - 1], checklist[index]] = [checklist[index], checklist[index - 1]];
      }
      return { ...prev, checklist };
    });
  };

  // Move checklist item down
  const moveItemDown = (id) => {
    setFormData(prev => {
      const checklist = [...prev.checklist];
      const index = checklist.findIndex(item => item.id === id);
      if (index < checklist.length - 1) {
        [checklist[index], checklist[index + 1]] = [checklist[index + 1], checklist[index]];
      }
      return { ...prev, checklist };
    });
  };

  // Improved drag and drop functionality
  const handleDragStart = (e, id) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, id) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== id) {
      setDragOverItem(id);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear drag over if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverItem(null);
    }
  };

  const handleDrop = (e, dropId) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === dropId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    setFormData(prev => {
      const checklist = [...prev.checklist];
      const draggedIndex = checklist.findIndex(item => item.id === draggedItem);
      const dropIndex = checklist.findIndex(item => item.id === dropId);

      if (draggedIndex === -1 || dropIndex === -1) return prev;

      // Remove the dragged item
      const [draggedItemData] = checklist.splice(draggedIndex, 1);
      // Insert it at the drop position
      checklist.splice(dropIndex, 0, draggedItemData);

      return { ...prev, checklist };
    });

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Rich text editor modules configuration
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'
  ];

  // Quick date setter functions
  const setQuickDate = (daysToAdd) => {
    const targetDate = addDays(new Date(), daysToAdd);
    setFormData(prev => ({
      ...prev,
      dueDate: format(targetDate, 'yyyy-MM-dd')
    }));
  };

  const setQuickWeekDate = (weeksToAdd) => {
    const targetDate = addWeeks(new Date(), weeksToAdd);
    setFormData(prev => ({
      ...prev,
      dueDate: format(targetDate, 'yyyy-MM-dd')
    }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="rich-text-editor">
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                  modules={modules}
                  formats={formats}
                  className="bg-white rounded-md"
                  style={{ height: '150px', marginBottom: '40px' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <div className="space-y-3">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Quick Date Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickDate(1)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      <SafeIcon icon={FiCalendar} className="text-xs" />
                      <span>Tomorrow</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickWeekDate(1)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                    >
                      <SafeIcon icon={FiCalendar} className="text-xs" />
                      <span>1 Week</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickWeekDate(2)}
                      className="flex items-center space-x-1 px-3 py-1 text-xs bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      <SafeIcon icon={FiCalendar} className="text-xs" />
                      <span>2 Weeks</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.categories.includes(category.id)
                        ? 'text-white'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: formData.categories.includes(category.id) 
                        ? category.color 
                        : undefined
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Linking */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link to Project
              </label>
              <select
                value={formData.linkedProject}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedProject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No project selected</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Checklist <span className="text-xs text-gray-500">(drag to reorder)</span>
                </label>
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <SafeIcon icon={FiPlus} className="text-sm" />
                  <span>Add Item</span>
                </button>
              </div>
              <div className="space-y-2">
                {formData.checklist.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center space-x-2 p-3 border rounded-md transition-all duration-200 ${
                      draggedItem === item.id
                        ? 'border-blue-300 bg-blue-50 opacity-50'
                        : dragOverItem === item.id
                        ? 'border-blue-400 bg-blue-50 border-dashed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, item.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, item.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="cursor-move text-gray-400 hover:text-gray-600 p-1">
                      <SafeIcon icon={FiMove} className="text-sm" />
                    </div>
                    <button
                      type="button"
                      onClick={() => updateChecklistItem(item.id, { completed: !item.completed })}
                      className={`flex-shrink-0 p-1 rounded transition-colors ${
                        item.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                      }`}
                    >
                      <SafeIcon icon={FiCheck} className="text-sm" />
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateChecklistItem(item.id, { text: e.target.value })}
                      className={`flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        item.completed ? 'line-through text-gray-500' : ''
                      }`}
                      placeholder="Checklist item..."
                    />
                    <div className="flex space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveItemUp(item.id)}
                        disabled={index === 0}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                          index === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-blue-600'
                        }`}
                        title="Move Up"
                      >
                        <SafeIcon icon={FiArrowUp} className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItemDown(item.id)}
                        disabled={index === formData.checklist.length - 1}
                        className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                          index === formData.checklist.length - 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-400 hover:text-blue-600'
                        }`}
                        title="Move Down"
                      >
                        <SafeIcon icon={FiArrowDown} className="text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(item.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove Item"
                      >
                        <SafeIcon icon={FiTrash2} className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TaskModal;