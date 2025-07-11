import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isPast, isToday, isFuture, isWithinInterval } from 'date-fns';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useEvent, PARTICIPATION_TYPES } from '../../contexts/EventContext';

const {
  FiEdit3, FiTrash2, FiCalendar, FiMapPin, FiClock, FiCheckCircle,
  FiUsers, FiMoreVertical, FiPackage, FiMic, FiInfoCircle,
  FiDollarSign, FiCreditCard, FiHome, FiTruck, FiShield
} = FiIcons;

function EventCard({ event, onEdit, onDelete, onViewDetails }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { calculateEventProgress, toggleChecklistItem, getEventById } = useEvent();
  
  // Get the latest event data to ensure we have up-to-date checklist status
  const currentEvent = getEventById(event.id) || event;
  const progress = calculateEventProgress(currentEvent.id);

  // Determine event status and color
  const today = new Date();
  const startDate = new Date(currentEvent.startDate);
  const endDate = new Date(currentEvent.endDate);
  let statusColor = 'bg-green-500';
  let statusText = 'Upcoming';
  let StatusIcon = FiClock;

  if (isWithinInterval(today, { start: startDate, end: endDate })) {
    statusColor = 'bg-blue-500';
    statusText = 'Ongoing';
    StatusIcon = FiCalendar;
  } else if (isPast(endDate)) {
    statusColor = 'bg-gray-500';
    statusText = 'Past';
    StatusIcon = FiCheckCircle;
  }

  // Get participation type icon
  let ParticipationIcon = FiPackage;
  let participationColor = 'text-blue-600 bg-blue-100';
  let participationText = 'Exhibitor';

  if (currentEvent.participationType === PARTICIPATION_TYPES.SPEAKER) {
    ParticipationIcon = FiMic;
    participationColor = 'text-green-600 bg-green-100';
    participationText = 'Speaker';
  } else if (currentEvent.participationType === PARTICIPATION_TYPES.BOTH) {
    ParticipationIcon = FiUsers;
    participationColor = 'text-purple-600 bg-purple-100';
    participationText = 'Exhibitor & Speaker';
  }

  // Function to get the appropriate icon for each checklist item
  const getChecklistIcon = (itemId) => {
    switch (itemId) {
      case 'registration': return FiCheckCircle;
      case 'invoice_received': return FiDollarSign;
      case 'invoice_paid': return FiCreditCard;
      case 'hotel_booked': return FiHome;
      case 'rental_car_booked': return FiTruck;
      case 'insurance_arranged': return FiShield;
      default: return FiInfoCircle;
    }
  };

  // Handle checklist item toggle
  const handleChecklistItemToggle = (e, itemId) => {
    e.stopPropagation(); // Prevent the card click event
    toggleChecklistItem(currentEvent.id, itemId);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={() => onViewDetails(currentEvent)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {currentEvent.title}
            </h3>
            {currentEvent.location && (
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <SafeIcon icon={FiMapPin} className="mr-1 text-gray-400" />
                {currentEvent.location}
              </p>
            )}
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SafeIcon icon={FiMoreVertical} className="text-sm" />
            </button>
            {/* Dropdown Menu */}
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(currentEvent);
                      setShowDropdown(false);
                    }}
                    className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <SafeIcon icon={FiEdit3} className="text-sm" />
                    <span>Edit Event</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(currentEvent.id);
                      setShowDropdown(false);
                    }}
                    className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <SafeIcon icon={FiTrash2} className="text-sm" />
                    <span>Delete Event</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Event Type and Status */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${participationColor}`}>
            <SafeIcon icon={ParticipationIcon} className="mr-1 text-xs" />
            {participationText}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${statusColor}`}>
            <SafeIcon icon={StatusIcon} className="mr-1 text-xs" />
            {statusText}
          </span>
        </div>

        {/* Dates */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <SafeIcon icon={FiCalendar} className="mr-2 text-gray-400" />
          <div>
            <div>{format(new Date(currentEvent.startDate), 'MMM d, yyyy')}</div>
            <div>to {format(new Date(currentEvent.endDate), 'MMM d, yyyy')}</div>
          </div>
        </div>

        {/* Speaker Information - if applicable */}
        {(currentEvent.participationType === PARTICIPATION_TYPES.SPEAKER || 
          currentEvent.participationType === PARTICIPATION_TYPES.BOTH) && 
          currentEvent.talkTitle && (
          <div className="border-t border-gray-100 pt-3 mb-3">
            <div className="text-sm">
              <span className="text-blue-600 font-medium">Talk: </span>
              {currentEvent.talkTitle}
            </div>
            {currentEvent.talkDate && (
              <div className="text-xs text-gray-500 mt-1">
                {format(new Date(currentEvent.talkDate), 'MMM d, yyyy')}
                {currentEvent.talkTime && ` at ${currentEvent.talkTime}`}
              </div>
            )}
          </div>
        )}

        {/* Checklist Icons Row - Without Text */}
        <div className="flex items-center justify-between mb-3 mt-4">
          {currentEvent.checklist.map((item) => {
            const isComplete = item.completed;
            const IconComponent = getChecklistIcon(item.id);
            
            return (
              <div 
                key={item.id} 
                className="flex items-center" 
                title={item.label}
                onClick={(e) => handleChecklistItemToggle(e, item.id)}
              >
                <div className={`p-1.5 rounded-full ${isComplete ? 'bg-green-100' : 'bg-gray-100'} hover:bg-opacity-80 transition-colors cursor-pointer`}>
                  <SafeIcon 
                    icon={IconComponent} 
                    className={`text-sm ${isComplete ? 'text-green-600' : 'text-gray-400'}`} 
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Preparation Progress</span>
            <span className="text-xs font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                progress > 75 ? 'bg-green-600' : 
                progress > 50 ? 'bg-blue-600' : 
                progress > 25 ? 'bg-yellow-500' : 
                'bg-red-600'
              }`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Participants Summary (if any) */}
        {currentEvent.participants && currentEvent.participants.length > 0 && (
          <div className="flex items-center mt-4 text-sm text-gray-500">
            <SafeIcon icon={FiUsers} className="mr-2 text-gray-400" />
            <span>{currentEvent.participants.length} participant{currentEvent.participants.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default EventCard;