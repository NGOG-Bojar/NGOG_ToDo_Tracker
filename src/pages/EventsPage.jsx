import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useEvent } from '../contexts/EventContext';
import EventCard from '../components/events/EventCard';
import EventModal from '../components/events/EventModal';
import EventDetailsModal from '../components/events/EventDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { format, isAfter, isBefore, isWithinInterval } from 'date-fns';

const { FiPlus, FiCalendar, FiSearch, FiFilter, FiClock, FiCheckSquare, FiMapPin, FiUser, FiUsers, FiMic, FiPackage, FiGrid, FiList } = FiIcons;

function EventsPage() {
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const {
    events,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    getFilteredEvents,
    setSearchTerm,
    searchTerm,
    setFilter,
    filterStatus,
    filterParticipationType,
    setSort,
    sortBy,
    sortOrder,
    PARTICIPATION_TYPES,
    clearError
  } = useEvent();

  const filteredEvents = getFilteredEvents();

  // Get current date
  const today = new Date();

  // Stats calculation
  const stats = {
    total: events.length,
    upcoming: events.filter(event => isAfter(new Date(event.startDate), today)).length,
    ongoing: events.filter(event => 
      isWithinInterval(today, { 
        start: new Date(event.startDate), 
        end: new Date(event.endDate) 
      })
    ).length,
    past: events.filter(event => isBefore(new Date(event.endDate), today)).length,
  };

  const handleCreateEvent = async (eventData) => {
    await addEvent(eventData);
    setShowEventModal(false);
  };

  const handleUpdateEvent = async (id, updates) => {
    await updateEvent(id, updates);
    setEditingEvent(null);
    setShowEventModal(false);
    setShowDetailsModal(false);
  };

  const handleDeleteEvent = async (id) => {
    const event = events.find(e => e.id === id);
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      await deleteEvent(id);
      if (showDetailsModal && selectedEvent?.id === id) {
        setShowDetailsModal(false);
        setSelectedEvent(null);
      }
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventModal(true);
    if (showDetailsModal) {
      setShowDetailsModal(false);
    }
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSort(newSortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(newSortBy, 'asc');
    }
  };

  const participationTypes = [
    { value: 'all', label: 'All Types', icon: FiUsers },
    { value: PARTICIPATION_TYPES.EXHIBITOR, label: 'Exhibitor', icon: FiPackage },
    { value: PARTICIPATION_TYPES.SPEAKER, label: 'Speaker', icon: FiMic },
    { value: PARTICIPATION_TYPES.BOTH, label: 'Exhibitor & Speaker', icon: FiUser }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Events', icon: FiCalendar },
    { value: 'upcoming', label: 'Upcoming', icon: FiClock },
    { value: 'ongoing', label: 'Ongoing', icon: FiCheckSquare },
    { value: 'past', label: 'Past', icon: FiCalendar }
  ];

  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conferences & Events</h1>
          <p className="text-gray-600">Track conferences, events, and speaking engagements</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowEventModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <SafeIcon icon={FiPlus} className="text-lg" />
          <span>New Event</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage
          error={error}
          onDismiss={clearError}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <SafeIcon icon={FiCalendar} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-green-600">{stats.upcoming}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <SafeIcon icon={FiClock} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ongoing</p>
              <p className="text-2xl font-bold text-purple-600">{stats.ongoing}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <SafeIcon icon={FiCheckSquare} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Past</p>
              <p className="text-2xl font-bold text-gray-600">{stats.past}</p>
            </div>
            <div className="p-3 rounded-full bg-gray-500">
              <SafeIcon icon={FiCalendar} className="text-white text-xl" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilter('filterStatus', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Participation Type Filter */}
            <select
              value={filterParticipationType}
              onChange={(e) => setFilter('filterParticipationType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {participationTypes.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSortChange('start_date')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                sortBy === 'start_date' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Date {sortBy === 'start_date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('title')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                sortBy === 'title' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSortChange('progress')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                sortBy === 'progress' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Progress {sortBy === 'progress' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            {/* View Mode Toggles */}
            <div className="flex ml-2 border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-500'}`}
              >
                <SafeIcon icon={FiGrid} className="text-lg" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-500'}`}
              >
                <SafeIcon icon={FiList} className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-center py-12"
            >
              <SafeIcon icon={FiCalendar} className="text-gray-300 text-6xl mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No events found</p>
              <p className="text-gray-400 text-sm mt-2">
                Create your first event or adjust your filters
              </p>
            </motion.div>
          ) : (
            filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Event Creation/Edit Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          onSave={editingEvent ? 
            (updates) => handleUpdateEvent(editingEvent.id, updates) : 
            handleCreateEvent
          }
        />
      )}

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEvent(null);
          }}
          onEdit={() => handleEditEvent(selectedEvent)}
          onDelete={() => handleDeleteEvent(selectedEvent.id)}
        />
      )}
    </div>
  );
}

export default EventsPage;