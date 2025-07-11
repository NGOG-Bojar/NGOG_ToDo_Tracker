import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isToday, isFuture, isWithinInterval } from 'date-fns';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useEvent, PARTICIPATION_TYPES, CHECKLIST_ITEMS } from '../../contexts/EventContext';
import DOMPurify from 'dompurify';

const {
  FiX, FiEdit3, FiTrash2, FiCalendar, FiMapPin, FiCheck, FiClock,
  FiUser, FiUsers, FiMic, FiPackage, FiInfo, FiClipboard, FiFileText,
  FiDollarSign, FiCreditCard, FiHome, FiTruck, FiShield, FiCheckCircle
} = FiIcons;

function EventDetailsModal({ event, onClose, onEdit, onDelete }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { toggleChecklistItem, getEventById } = useEvent();

  if (!event) return null;

  // Get the latest event data to ensure we have up-to-date checklist status
  const currentEvent = getEventById(event.id) || event;
  
  // Calculate progress
  const completedItems = currentEvent.checklist.filter(item => item.completed).length;
  const progress = Math.round((completedItems / currentEvent.checklist.length) * 100);

  // Determine event status
  const today = new Date();
  const startDate = new Date(currentEvent.startDate);
  const endDate = new Date(currentEvent.endDate);
  let statusText = 'Upcoming';
  let statusColor = 'text-green-600 bg-green-100';

  if (isWithinInterval(today, { start: startDate, end: endDate })) {
    statusText = 'Ongoing';
    statusColor = 'text-blue-600 bg-blue-100';
  } else if (isPast(endDate)) {
    statusText = 'Past';
    statusColor = 'text-gray-600 bg-gray-100';
  }

  // Get participation type text
  let participationText = 'Exhibitor';
  let participationColor = 'text-blue-600 bg-blue-100';

  if (currentEvent.participationType === PARTICIPATION_TYPES.SPEAKER) {
    participationText = 'Speaker';
    participationColor = 'text-green-600 bg-green-100';
  } else if (currentEvent.participationType === PARTICIPATION_TYPES.BOTH) {
    participationText = 'Exhibitor & Speaker';
    participationColor = 'text-purple-600 bg-purple-100';
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiInfo },
    { id: 'participants', label: 'Participants', icon: FiUsers },
  ];

  // Map checklist items to icons - using direct icon references
  const getChecklistIcon = (itemId) => {
    switch (itemId) {
      case 'registration': return FiCheckCircle;
      case 'invoice_received': return FiDollarSign;
      case 'invoice_paid': return FiCreditCard;
      case 'hotel_booked': return FiHome;
      case 'rental_car_booked': return FiTruck;
      case 'insurance_arranged': return FiShield;
      default: return FiInfo;
    }
  };
  
  // Handle checklist item toggle with event propagation stopped
  const handleChecklistItemToggle = (eventId, itemId, e) => {
    // Stop the event from bubbling up to parent elements
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    toggleChecklistItem(eventId, itemId);
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
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">{currentEvent.title}</h2>
              <div className="flex space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                  {statusText}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${participationColor}`}>
                  {participationText}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(currentEvent)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <SafeIcon icon={FiEdit3} className="text-lg" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-4 px-1 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={tab.icon} className="text-lg" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                    <div className="space-y-4">
                      {/* Dates */}
                      <div className="flex items-start space-x-3">
                        <SafeIcon icon={FiCalendar} className="text-gray-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Dates</h4>
                          <p className="text-sm text-gray-600">
                            {format(new Date(currentEvent.startDate), 'MMM d, yyyy')} to{' '}
                            {format(new Date(currentEvent.endDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      {/* Location */}
                      {currentEvent.location && (
                        <div className="flex items-start space-x-3">
                          <SafeIcon icon={FiMapPin} className="text-gray-400 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Location</h4>
                            <p className="text-sm text-gray-600">{currentEvent.location}</p>
                          </div>
                        </div>
                      )}

                      {/* Preparation Icons */}
                      <div className="flex items-start space-x-3 mt-6">
                        <div className="mt-0.5">
                          <SafeIcon icon={FiClipboard} className="text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Preparation Checklist</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {currentEvent.checklist.map(item => {
                              const IconComponent = getChecklistIcon(item.id);
                              return (
                                <div 
                                  key={item.id} 
                                  className="flex flex-col items-center"
                                  onClick={(e) => handleChecklistItemToggle(currentEvent.id, item.id, e)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className={`p-2 rounded-full ${item.completed ? 'bg-green-100' : 'bg-gray-100'} hover:bg-opacity-80 transition-all`}>
                                    <SafeIcon 
                                      icon={IconComponent} 
                                      className={`text-lg ${item.completed ? 'text-green-600' : 'text-gray-400'}`} 
                                    />
                                  </div>
                                  <span className="text-xs mt-1 text-center">
                                    {item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">Preparation Progress</span>
                          <span className="text-sm font-medium text-gray-700">{progress}%</span>
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
                    </div>
                  </div>

                  {/* Speaker Information - if applicable */}
                  <div>
                    {(currentEvent.participationType === PARTICIPATION_TYPES.SPEAKER ||
                      currentEvent.participationType === PARTICIPATION_TYPES.BOTH) ? (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="text-md font-medium text-green-800 mb-3 flex items-center">
                          <SafeIcon icon={FiMic} className="mr-2" />
                          Speaker Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Talk Title</h4>
                            <p className="text-sm text-gray-600">{currentEvent.talkTitle || 'Not specified'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Talk Date</h4>
                              <p className="text-sm text-gray-600">
                                {currentEvent.talkDate
                                  ? format(new Date(currentEvent.talkDate), 'MMM d, yyyy')
                                  : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Talk Time</h4>
                              <p className="text-sm text-gray-600">{currentEvent.talkTime || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-md font-medium text-blue-800 mb-3 flex items-center">
                          <SafeIcon icon={FiPackage} className="mr-2" />
                          Exhibitor Information
                        </h3>
                        <p className="text-sm text-gray-600">
                          Participating as an exhibitor at this event.
                        </p>
                      </div>
                    )}

                    {/* Notes Section */}
                    {currentEvent.notes && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Information & Notes</h3>
                        <div
                          className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg border border-gray-200"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentEvent.notes) }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
                {currentEvent.participants && currentEvent.participants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentEvent.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <SafeIcon icon={FiUser} className="text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{participant.name}</h4>
                            {participant.role && (
                              <p className="text-sm text-gray-500">{participant.role}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                    <SafeIcon icon={FiUsers} className="mx-auto text-gray-300 text-3xl mb-2" />
                    <p className="text-gray-500">No team members added yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t">
            <button
              onClick={() => onDelete(currentEvent.id)}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <SafeIcon icon={FiTrash2} className="text-sm" />
              <span>Delete Event</span>
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => onEdit(currentEvent)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Event
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default EventDetailsModal;