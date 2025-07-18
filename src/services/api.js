import supabase from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Define table names
const TABLES = {
  TASKS: 'tasks_ng19v3',
  CATEGORIES: 'categories_ng19v3',
  PROJECTS: 'projects_ng19v3',
  EVENTS: 'events_ng19v3'
};

// Task service
export const taskService = {
  getAllTasks: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllTasks:', error);
      throw error;
    }
  },

  createTask: async (taskData) => {
    try {
      console.log('Creating task with data:', taskData);
      
      const preparedTask = {
        title: taskData.title,
        description: taskData.description || null,
        due_date: taskData.due_date || null,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'open',
        categories: taskData.categories || [],
        notes: taskData.notes || null,
        checklist: taskData.checklist || [],
        linked_project: taskData.linked_project || null
      };

      console.log('Prepared task data:', preparedTask);

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .insert([preparedTask])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating task:', error);
        throw error;
      }

      console.log('Task created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in createTask:', error);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateTask:', error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      const { error } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      throw error;
    }
  }
};

// Project service
export const projectService = {
  getAllProjects: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getAllProjects:', error);
      throw error;
    }
  },

  createProject: async (projectData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createProject:', error);
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateProject:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      const { error } = await supabase
        .from(TABLES.PROJECTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteProject:', error);
      throw error;
    }
  },

  archiveProject: async (id) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .update({
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in archiveProject:', error);
      throw error;
    }
  },

  restoreProject: async (id) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .update({
          archived: false,
          archived_at: null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in restoreProject:', error);
      throw error;
    }
  }
};

// Category service
export const categoryService = {
  getAllCategories: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      throw error;
    }
  },

  createCategory: async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createCategory:', error);
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateCategory:', error);
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      throw error;
    }
  },

  restoreCategory: async (id) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CATEGORIES)
        .update({ deleted: false, deleted_at: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in restoreCategory:', error);
      throw error;
    }
  }
};

// Event service
export const eventService = {
  getAllEvents: async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getAllEvents:', error);
      throw error;
    }
  },

  createEvent: async (eventData) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createEvent:', error);
      throw error;
    }
  },

  updateEvent: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.EVENTS)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateEvent:', error);
      throw error;
    }
  },

  deleteEvent: async (id) => {
    try {
      const { error } = await supabase
        .from(TABLES.EVENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      throw error;
    }
  }
};

// Data management service
export const dataService = {
  exportData: async () => {
    try {
      const [tasks, categories, projects, events] = await Promise.all([
        taskService.getAllTasks(),
        categoryService.getAllCategories(),
        projectService.getAllProjects(),
        eventService.getAllEvents()
      ]);

      return {
        version: '1.0',
        exportDate: new Date().toISOString(),
        metadata: {
          totalTasks: tasks.length,
          totalCategories: categories.length,
          totalProjects: projects.length,
          totalEvents: events.length
        },
        data: {
          tasks,
          categories,
          projects,
          events
        }
      };
    } catch (error) {
      console.error('Error in exportData:', error);
      throw error;
    }
  },

  importData: async (importData) => {
    try {
      // Validate import data structure
      if (!importData.data || !importData.version) {
        throw new Error('Invalid import data format');
      }

      // For now, just handle tasks import
      if (importData.data.tasks && importData.data.tasks.length > 0) {
        const { error } = await supabase
          .from(TABLES.TASKS)
          .insert(importData.data.tasks);
        
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in importData:', error);
      throw error;
    }
  }
};