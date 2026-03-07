import React, { useState, useImperativeHandle, forwardRef } from 'react';
import LocationPermissionModal from './LocationPermissionModal';

const LocationPermissionHandler = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [callbacks, setCallbacks] = useState({});

  useImperativeHandle(ref, () => ({
    show: ({ onGranted, onDenied }) => {
      setCallbacks({ onGranted, onDenied });
      setVisible(true);
    }
  }));

  const handleClose = () => {
    setVisible(false);
    callbacks.onDenied?.();
  };

  const handleGranted = () => {
    setVisible(false);
    callbacks.onGranted?.();
  };

  return (
    <LocationPermissionModal
      visible={visible}
      onClose={handleClose}
      onGranted={handleGranted}
    />
  );
});

export default LocationPermissionHandler;