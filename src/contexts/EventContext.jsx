import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const EventContext = createContext();

const initialState = {
  events: [],
  searchTerm: '',
  sortBy: 'startDate',
  sortOrder: 'asc',
  filterStatus: 'all',
  filterParticipationType: 'all'
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
    case 'LOAD_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return {
        ...state,
        events: [
          ...state.events,
          {
            id: uuidv4(),
            ...action.payload,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            checklist: CHECKLIST_ITEMS.map(item => ({ ...item, completed: false }))
          }
        ]
      };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event => {
          if (event.id === action.payload.id) {
            return {
              ...event,
              ...action.payload.updates,
              updatedAt: new Date().toISOString()
            };
          }
          return event;
        })
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
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
            
            return {
              ...event,
              checklist: updatedChecklist,
              updatedAt: new Date().toISOString()
            };
          }
          return event;
        })
      };
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        events: state.events.map(event => {
          if (event.id === action.payload.eventId) {
            const participants = event.participants || [];
            return {
              ...event,
              participants: [
                ...participants,
                {
                  id: uuidv4(),
                  name: action.payload.name,
                  role: action.payload.role || ''
                }
              ],
              updatedAt: new Date().toISOString()
            };
          }
          return event;
        })
      };
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        events: state.events.map(event => {
          if (event.id === action.payload.eventId) {
            return {
              ...event,
              participants: (event.participants || []).filter(
                participant => participant.id !== action.payload.participantId
              ),
              updatedAt: new Date().toISOString()
            };
          }
          return event;
        })
      };
    case 'UPDATE_PARTICIPANT':
      return {
        ...state,
        events: state.events.map(event => {
          if (event.id === action.payload.eventId) {
            return {
              ...event,
              participants: (event.participants || []).map(participant => {
                if (participant.id === action.payload.participantId) {
                  return { ...participant, ...action.payload.updates };
                }
                return participant;
              }),
              updatedAt: new Date().toISOString()
            };
          }
          return event;
        })
      };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder
      };
    case 'SET_FILTER':
      return { ...state, [action.payload.type]: action.payload.value };
    default:
      return state;
  }
}

export function EventProvider({ children }) {
  const [state, dispatch] = useReducer(eventReducer, initialState);

  // Load events from localStorage on mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('todoEvents');
    if (savedEvents) {
      dispatch({ type: 'LOAD_EVENTS', payload: JSON.parse(savedEvents) });
    }
  }, []);

  // Save events to localStorage whenever events change
  useEffect(() => {
    localStorage.setItem('todoEvents', JSON.stringify(state.events));
  }, [state.events]);

  // Add a new event
  const addEvent = (eventData) => {
    dispatch({ type: 'ADD_EVENT', payload: eventData });
  };

  // Update an existing event
  const updateEvent = (id, updates) => {
    dispatch({ type: 'UPDATE_EVENT', payload: { id, updates } });
  };

  // Delete an event
  const deleteEvent = (id) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });
  };

  // Toggle a checklist item
  const toggleChecklistItem = (eventId, itemId) => {
    dispatch({ type: 'TOGGLE_CHECKLIST_ITEM', payload: { eventId, itemId } });
  };

  // Add a participant to an event
  const addParticipant = (eventId, name, role) => {
    dispatch({ type: 'ADD_PARTICIPANT', payload: { eventId, name, role } });
  };

  // Remove a participant from an event
  const removeParticipant = (eventId, participantId) => {
    dispatch({ type: 'REMOVE_PARTICIPANT', payload: { eventId, participantId } });
  };

  // Update a participant
  const updateParticipant = (eventId, participantId, updates) => {
    dispatch({
      type: 'UPDATE_PARTICIPANT',
      payload: { eventId, participantId, updates }
    });
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
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
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
    addParticipant,
    removeParticipant,
    updateParticipant,
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