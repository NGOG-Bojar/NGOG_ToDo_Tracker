import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useEvent, PARTICIPATION_TYPES } from '../../contexts/EventContext';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { 
  FiX, FiPlus, FiTrash2, FiUser, FiCalendar, FiMapPin, FiMic, 
  FiPackage, FiUsers, FiClock, FiInfo 
} = FiIcons;

function EventModal({ event, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    participationType: PARTICIPATION_TYPES.EXHIBITOR,
    talkTitle: '',
    talkDate: '',
    talkTime: '',
    participants: [],
    notes: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        location: event.location || '',
        startDate: event.startDate || format(new Date(), 'yyyy-MM-dd'),
        endDate: event.endDate || format(new Date(), 'yyyy-MM-dd'),
        participationType: event.participationType || PARTICIPATION_TYPES.EXHIBITOR,
        talkTitle: event.talkTitle || '',
        talkDate: event.talkDate || '',
        talkTime: event.talkTime || '',
        participants: event.participants || [],
        notes: event.notes || ''
      });
    }
  }, [event]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const eventData = {
      ...formData,
      title: formData.title.trim(),
      location: formData.location.trim(),
      // If this is a speaker event but no talk date is set, default to the event start date
      talkDate: formData.talkDate || 
        ((formData.participationType === PARTICIPATION_TYPES.SPEAKER || 
          formData.participationType === PARTICIPATION_TYPES.BOTH) ? 
          formData.startDate : '')
    };

    onSave(eventData);
  };

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [
        ...prev.participants,
        {
          id: Date.now(),
          name: '',
          role: ''
        }
      ]
    }));
  };

  const updateParticipant = (id, updates) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(participant => 
        participant.id === id ? { ...participant, ...updates } : participant
      )
    }));
  };

  const removeParticipant = (id) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(participant => participant.id !== id)
    }));
  };

  // Rich text editor configurations
  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link'
  ];

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
              {event ? 'Edit Event' : 'Create New Event'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Conference or event name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <SafeIcon 
                    icon={FiMapPin} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City, venue, or address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <SafeIcon 
                    icon={FiCalendar} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <div className="relative">
                  <SafeIcon 
                    icon={FiCalendar} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={formData.startDate}
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participation Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      participationType: PARTICIPATION_TYPES.EXHIBITOR 
                    }))}
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${
                      formData.participationType === PARTICIPATION_TYPES.EXHIBITOR
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <SafeIcon icon={FiPackage} className="text-xl mb-2" />
                    <span className="text-sm">Exhibitor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      participationType: PARTICIPATION_TYPES.SPEAKER 
                    }))}
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${
                      formData.participationType === PARTICIPATION_TYPES.SPEAKER
                        ? 'border-green-500 bg-green-50 text-green-600'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <SafeIcon icon={FiMic} className="text-xl mb-2" />
                    <span className="text-sm">Speaker</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      participationType: PARTICIPATION_TYPES.BOTH
                    }))}
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${
                      formData.participationType === PARTICIPATION_TYPES.BOTH
                        ? 'border-purple-500 bg-purple-50 text-purple-600'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <SafeIcon icon={FiUsers} className="text-xl mb-2" />
                    <span className="text-sm">Both</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Speaker Information - conditionally shown */}
            {(formData.participationType === PARTICIPATION_TYPES.SPEAKER || 
              formData.participationType === PARTICIPATION_TYPES.BOTH) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-green-50 p-4 rounded-lg border border-green-200"
              >
                <h3 className="text-md font-medium text-green-800 mb-3 flex items-center">
                  <SafeIcon icon={FiMic} className="mr-2" />
                  Speaker Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Talk Title
                    </label>
                    <input
                      type="text"
                      value={formData.talkTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, talkTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your presentation title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Talk Date
                    </label>
                    <div className="relative">
                      <SafeIcon 
                        icon={FiCalendar} 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                      />
                      <input
                        type="date"
                        value={formData.talkDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, talkDate: e.target.value }))}
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={formData.startDate}
                        max={formData.endDate}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Defaults to event start date if not specified
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Talk Time
                    </label>
                    <div className="relative">
                      <SafeIcon 
                        icon={FiClock} 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                      />
                      <input
                        type="time"
                        value={formData.talkTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, talkTime: e.target.value }))}
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Participants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Participants
                </label>
                <button
                  type="button"
                  onClick={addParticipant}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <SafeIcon icon={FiPlus} className="text-sm" />
                  <span>Add Team Member</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.participants && formData.participants.length > 0 ? (
                  formData.participants.map(participant => (
                    <div
                      key={participant.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <SafeIcon icon={FiUser} className="text-gray-400" />
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <SafeIcon icon={FiTrash2} className="text-sm" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={participant.name}
                            onChange={(e) => updateParticipant(participant.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Name"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={participant.role}
                            onChange={(e) => updateParticipant(participant.id, { role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Role (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 border border-dashed rounded-lg text-gray-500">
                    <SafeIcon icon={FiUser} className="mx-auto text-gray-300 text-2xl mb-2" />
                    <p className="text-sm">No participants added yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Information & Notes
              </label>
              <div className="rich-text-editor">
                <ReactQuill
                  theme="snow"
                  value={formData.notes}
                  onChange={(content) => setFormData(prev => ({ ...prev, notes: content }))}
                  modules={modules}
                  formats={formats}
                  className="bg-white rounded-md"
                  style={{ height: '150px', marginBottom: '40px' }}
                  placeholder="Add additional details, links, or specific instructions..."
                />
              </div>
            </div>

            {/* Form Actions */}
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
                {event ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default EventModal;