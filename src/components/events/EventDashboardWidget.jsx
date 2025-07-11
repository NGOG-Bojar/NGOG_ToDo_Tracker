import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isPast, isToday, isFuture, isWithinInterval, addDays } from 'date-fns';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useEvent, PARTICIPATION_TYPES } from '../../contexts/EventContext';
import EventDetailsModal from './EventDetailsModal';

const { 
  FiCalendar, FiClock, FiMapPin, FiMic, FiPackage, 
  FiUsers, FiChevronRight, FiInfo 
} = FiIcons;

function EventDashboardWidget() {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const { getUpcomingEvents, getOngoingEvents } = useEvent();
  
  const ongoingEvents = getOngoingEvents();
  const upcomingEvents = getUpcomingEvents().slice(0, 3); // Limit to 3 upcoming events
  
  const today = new Date();
  const nextThirtyDays = addDays(today, 30);
  
  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <SafeIcon icon={FiCalendar} className="text-blue-600 mr-2" />
          Upcoming Events
        </h3>
        <Link 
          to="/events"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          View All <SafeIcon icon={FiChevronRight} className="ml-1" />
        </Link>
      </div>
      
      <div className="divide-y divide-gray-100">
        {/* Current/Ongoing Events */}
        {ongoingEvents.length > 0 && (
          <div className="p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <SafeIcon icon={FiClock} className="mr-1" /> 
              Currently Happening
            </h4>
            
            <div className="space-y-3">
              {ongoingEvents.map(event => {
                // Get participation type icon
                let ParticipationIcon = FiPackage;
                let participationColor = 'text-blue-600 bg-blue-100';
                
                if (event.participationType === PARTICIPATION_TYPES.SPEAKER) {
                  ParticipationIcon = FiMic;
                  participationColor = 'text-green-600 bg-green-100';
                } else if (event.participationType === PARTICIPATION_TYPES.BOTH) {
                  ParticipationIcon = FiUsers;
                  participationColor = 'text-purple-600 bg-purple-100';
                }
                
                return (
                  <div 
                    key={event.id}
                    className="p-3 bg-white rounded-lg border border-blue-200 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => handleViewDetails(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{event.title}</h5>
                        
                        <div className="flex flex-wrap gap-2 mt-1 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${participationColor}`}>
                            <ParticipationIcon className="mr-1 text-xs" />
                            {event.participationType === PARTICIPATION_TYPES.EXHIBITOR
                              ? 'Exhibitor'
                              : event.participationType === PARTICIPATION_TYPES.SPEAKER
                              ? 'Speaker'
                              : 'Exhibitor & Speaker'}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <SafeIcon icon={FiCalendar} className="mr-1 text-gray-400" />
                          <span>
                            {format(new Date(event.startDate), 'MMM d')} - {format(new Date(event.endDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <SafeIcon icon={FiMapPin} className="mr-1 text-gray-400" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="flex flex-col items-center">
                        {event.checklist && (
                          <div className="relative w-10 h-10">
                            <svg className="w-10 h-10">
                              <circle
                                className="text-gray-200"
                                strokeWidth="4"
                                stroke="currentColor"
                                fill="transparent"
                                r="16"
                                cx="20"
                                cy="20"
                              />
                              <circle
                                className="text-blue-600"
                                strokeWidth="4"
                                strokeDasharray={100}
                                strokeDashoffset={100 - (event.checklist.filter(item => item.completed).length / event.checklist.length) * 100}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="16"
                                cx="20"
                                cy="20"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                              {Math.round((event.checklist.filter(item => item.completed).length / event.checklist.length) * 100)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Upcoming Events */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Coming Up</h4>
          
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <SafeIcon icon={FiInfo} className="mx-auto text-gray-300 text-3xl mb-2" />
              <p>No upcoming events</p>
              <Link 
                to="/events"
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                Schedule an event
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => {
                const eventDate = new Date(event.startDate);
                const isWithinMonth = isWithinInterval(eventDate, { start: today, end: nextThirtyDays });
                
                return (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${
                      isWithinMonth ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'
                    }`}
                    onClick={() => handleViewDetails(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{event.title}</h5>
                        
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <SafeIcon icon={FiCalendar} className="mr-1 text-gray-400" />
                          <span>
                            {format(eventDate, 'MMM d, yyyy')}
                            {event.startDate !== event.endDate && ` - ${format(new Date(event.endDate), 'MMM d, yyyy')}`}
                          </span>
                          
                          {isWithinMonth && (
                            <span className="ml-2 text-yellow-600 font-medium">
                              {Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))} days away
                            </span>
                          )}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <SafeIcon icon={FiMapPin} className="mr-1 text-gray-400" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Event type */}
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          event.participationType === PARTICIPATION_TYPES.EXHIBITOR
                            ? 'text-blue-600 bg-blue-100'
                            : event.participationType === PARTICIPATION_TYPES.SPEAKER
                            ? 'text-green-600 bg-green-100'
                            : 'text-purple-600 bg-purple-100'
                        }`}>
                          {event.participationType === PARTICIPATION_TYPES.EXHIBITOR
                            ? 'Exhibitor'
                            : event.participationType === PARTICIPATION_TYPES.SPEAKER
                            ? 'Speaker'
                            : 'Both'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {upcomingEvents.length < getUpcomingEvents().length && (
                <Link 
                  to="/events"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center p-2 bg-gray-50 rounded-lg border border-dashed"
                >
                  {getUpcomingEvents().length - upcomingEvents.length} more upcoming events
                  <SafeIcon icon={FiChevronRight} className="ml-1" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEvent(null);
          }}
          onEdit={() => {}} // No edit functionality from widget
          onDelete={() => {}} // No delete functionality from widget
        />
      )}
    </div>
  );
}

export default EventDashboardWidget;