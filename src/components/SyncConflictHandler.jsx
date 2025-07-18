import React, { useState, useEffect } from 'react';
import ConflictResolutionModal from './ConflictResolutionModal';

function SyncConflictHandler() {
  const [conflicts, setConflicts] = useState([]);
  const [resolveCallback, setResolveCallback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleSyncConflicts = (event) => {
      const { conflicts, resolve } = event.detail;
      setConflicts(conflicts);
      setResolveCallback(() => resolve);
      setShowModal(true);
    };

    window.addEventListener('syncConflicts', handleSyncConflicts);
    return () => window.removeEventListener('syncConflicts', handleSyncConflicts);
  }, []);

  const handleResolve = (resolutions) => {
    if (resolveCallback) {
      resolveCallback(resolutions);
    }
    setShowModal(false);
    setConflicts([]);
    setResolveCallback(null);
  };

  const handleClose = () => {
    if (resolveCallback) {
      // Cancel sync by resolving with empty object
      resolveCallback({});
    }
    setShowModal(false);
    setConflicts([]);
    setResolveCallback(null);
  };

  if (!showModal || conflicts.length === 0) {
    return null;
  }

  return (
    <ConflictResolutionModal
      conflicts={conflicts}
      onResolve={handleResolve}
      onClose={handleClose}
    />
  );
}

export default SyncConflictHandler;