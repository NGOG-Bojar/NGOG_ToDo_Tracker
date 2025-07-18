import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { eventService } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../lib/supabase';

const EventContext = createContext();

const initialState = {
  events: [],
  searchTerm: '',
  sortBy: 'start_date',
  sortOrder: 'asc',
  filterStatus: 'all',
  filterParticipationType: 'all',
  isLoading: false,
  error: null
};

// Define participation types
export const PARTICIPATION_TYPES = {
  EXHIBITOR: 'exhibitor',
  SPEAKER: 'speaker',
  BOTH: 'exhibitor_speaker'
};

// Define checklist items (standard for all events)
export const CHECKLIST_ITEMS = [
  { id: 'registration', label: 'Registration completed' },
  { id: 'invoice_received', label: 'Invoice received' },
  { id: 'invoice_paid', label: 'Invoice paid' },
  { id: 'hotel_booked', label: 'Hotel booked' },
  { id: 'rental_car_booked', label: 'Rental car booked' },
  { id: 'insurance_arranged', label: 'Insurance arranged' }
];

function eventReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOAD_EVENTS':
      return { ...state, events: action.payload, isLoading: false, error: null };
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload],
        isLoading: false,
        error: null
      };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? { ...event, ...action.payload } : event
        ),
        isLoading: false,
        error: null
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
        isLoading: false,
        error: null
      };
    case 'TOGGLE_CHECKLIST_ITEM':
      return {
        ...state,
        events: state.events.map(event => {
          if (event.id === action.payload.eventId) {
            const updatedChecklist = event.checklist.map(item => {
              if (item.id === action.payload.itemId) {
                return { ...item, completed: !item.completed };
              }
              return item;
            });
            return { ...event, checklist: updatedChecklist };
          }
          return event;
        })
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

export function EventProvider({ children }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  // Load events from Supabase on mount
  useEffect(() => {
    const loadEvents = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const events = await eventService.getAllEvents();
        // Transform the data from Supabase format to our internal format
        const transformedEvents = events.map(event => ({
          ...event,
          startDate: event.start_date,
          endDate: event.end_date,
          participationType: event.participation_type,
          talkTitle: event.talk_title,
          talkDate: event.talk_date,
          talkTime: event.talk_time,
          createdAt: event.created_at,
          updatedAt: event.updated_at,
          checklist: event.checklist || CHECKLIST_ITEMS.map(item => ({ ...item, completed: false }))
        }));
        dispatch({ type: 'LOAD_EVENTS', payload: transformedEvents });
      } catch (error) {
        console.error('Error loading events:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    };

    loadEvents();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const subscription = supabase
      .channel('events_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'events_ng19v3' },
        (payload) => {
          const newEvent = {
            ...payload.new,
            startDate: payload.new.start_date,
            endDate: payload.new.end_date,
            participationType: payload.new.participation_type,
            talkTitle: payload.new.talk_title,
            talkDate: payload.new.talk_date,
            talkTime: payload.new.talk_time,
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at,
            checklist: payload.new.checklist || CHECKLIST_ITEMS.map(item => ({ ...item, completed: false }))
          };
          dispatch({ type: 'ADD_EVENT', payload: newEvent });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events_ng19v3' },
        (payload) => {
          const updatedEvent = {
            ...payload.new,
            startDate: payload.new.start_date,
            endDate: payload.new.end_date,
            participationType: payload.new.participation_type,
            talkTitle: payload.new.talk_title,
            talkDate: payload.new.talk_date,
            talkTime: payload.new.talk_time,
            createdAt: payload.new.created_at,
            updatedAt: payload.new.updated_at,
            checklist: payload.new.checklist || CHECKLIST_ITEMS.map(item => ({ ...item, completed: false }))
          };
          dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'events_ng19v3' },
        (payload) => {
          dispatch({ type: 'DELETE_EVENT', payload: payload.old.id });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add a new event
  const addEvent = async (eventData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Transform data to Supabase format
      const supabaseData = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start_date: eventData.startDate,
        end_date: eventData.endDate,
        participation_type: eventData.participationType,
        talk_title: eventData.talkTitle,
        talk_date: eventData.talkDate,
        talk_time: eventData.talkTime,
        participants: eventData.participants || [],
        checklist: CHECKLIST_ITEMS.map(item => ({ ...item, completed: false })),
        notes: eventData.notes
      };

      const newEvent = await eventService.createEvent(supabaseData);
      
      // Transform back to our format
      const transformedEvent = {
        ...newEvent,
        startDate: newEvent.start_date,
        endDate: newEvent.end_date,
        participationType: newEvent.participation_type,
        talkTitle: newEvent.talk_title,
        talkDate: newEvent.talk_date,
        talkTime: newEvent.talk_time,
        createdAt: newEvent.created_at,
        updatedAt: newEvent.updated_at
      };

      dispatch({ type: 'ADD_EVENT', payload: transformedEvent });
    } catch (error) {
      console.error('Error adding event:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Update an existing event
  const updateEvent = async (id, updates) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Transform data to Supabase format
      const supabaseUpdates = {
        title: updates.title,
        description: updates.description,
        location: updates.location,
        start_date: updates.startDate,
        end_date: updates.endDate,
        participation_type: updates.participationType,
        talk_title: updates.talkTitle,
        talk_date: updates.talkDate,
        talk_time: updates.talkTime,
        participants: updates.participants,
        checklist: updates.checklist,
        notes: updates.notes
      };

      const updatedEvent = await eventService.updateEvent(id, supabaseUpdates);
      
      // Transform back to our format
      const transformedEvent = {
        ...updatedEvent,
        startDate: updatedEvent.start_date,
        endDate: updatedEvent.end_date,
        participationType: updatedEvent.participation_type,
        talkTitle: updatedEvent.talk_title,
        talkDate: updatedEvent.talk_date,
        talkTime: updatedEvent.talk_time,
        createdAt: updatedEvent.created_at,
        updatedAt: updatedEvent.updated_at
      };

      dispatch({ type: 'UPDATE_EVENT', payload: transformedEvent });
    } catch (error) {
      console.error('Error updating event:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Delete an event
  const deleteEvent = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await eventService.deleteEvent(id);
      dispatch({ type: 'DELETE_EVENT', payload: id });
    } catch (error) {
      console.error('Error deleting event:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Toggle a checklist item
  const toggleChecklistItem = async (eventId, itemId) => {
    try {
      const event = state.events.find(e => e.id === eventId);
      if (!event) return;

      const updatedChecklist = event.checklist.map(item => {
        if (item.id === itemId) {
          return { ...item, completed: !item.completed };
        }
        return item;
      });

      await eventService.updateEvent(eventId, { checklist: updatedChecklist });
      
      dispatch({ 
        type: 'TOGGLE_CHECKLIST_ITEM', 
        payload: { eventId, itemId } 
      });
    } catch (error) {
      console.error('Error toggling checklist item:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Get an event by ID
  const getEventById = (id) => {
    return state.events.find(event => event.id === id);
  };

  // Search, sort, and filter functionality
  const setSearchTerm = (term) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  };

  const setSort = (sortBy, sortOrder) => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
  };

  const setFilter = (type, value) => {
    dispatch({ type: 'SET_FILTER', payload: { type, value } });
  };

  // Get filtered and sorted events
  const getFilteredEvents = () => {
    let filtered = state.events;

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(
        event =>
          event.title.toLowerCase().includes(searchLower) ||
          (event.location && event.location.toLowerCase().includes(searchLower)) ||
          (event.talkTitle && event.talkTitle.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter (upcoming, ongoing, past)
    if (state.filterStatus !== 'all') {
      const now = new Date();
      if (state.filterStatus === 'upcoming') {
        filtered = filtered.filter(event => new Date(event.startDate) > now);
      } else if (state.filterStatus === 'ongoing') {
        filtered = filtered.filter(
          event =>
            new Date(event.startDate) <= now && new Date(event.endDate) >= now
        );
      } else if (state.filterStatus === 'past') {
        filtered = filtered.filter(event => new Date(event.endDate) < now);
      }
    }

    // Apply participation type filter
    if (state.filterParticipationType !== 'all') {
      filtered = filtered.filter(
        event => event.participationType === state.filterParticipationType
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (state.sortBy) {
        case 'start_date':
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'end_date':
        case 'endDate':
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'location':
          aValue = (a.location || '').toLowerCase();
          bValue = (b.location || '').toLowerCase();
          break;
        case 'progress':
          // Calculate progress as percentage of completed checklist items
          const aCompleted = a.checklist.filter(item => item.completed).length;
          const bCompleted = b.checklist.filter(item => item.completed).length;
          aValue = (aCompleted / a.checklist.length) * 100;
          bValue = (bCompleted / b.checklist.length) * 100;
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

  // Get upcoming events
  const getUpcomingEvents = () => {
    const now = new Date();
    return state.events
      .filter(event => new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  };

  // Get ongoing events
  const getOngoingEvents = () => {
    const now = new Date();
    return state.events.filter(
      event =>
        new Date(event.startDate) <= now && new Date(event.endDate) >= now
    );
  };

  // Get past events
  const getPastEvents = () => {
    const now = new Date();
    return state.events
      .filter(event => new Date(event.endDate) < now)
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate)); // Sort by most recent
  };

  // Calculate event progress based on checklist
  const calculateEventProgress = (eventId) => {
    const event = getEventById(eventId);
    if (!event || !event.checklist || event.checklist.length === 0) {
      return 0;
    }

    const completedItems = event.checklist.filter(item => item.completed).length;
    return Math.round((completedItems / event.checklist.length) * 100);
  };

  const value = {
    ...state,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleChecklistItem,
    getEventById,
    setSearchTerm,
    setSort,
    setFilter,
    getFilteredEvents,
    getUpcomingEvents,
    getOngoingEvents,
    getPastEvents,
    calculateEventProgress,
    PARTICIPATION_TYPES,
    CHECKLIST_ITEMS
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
}

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};