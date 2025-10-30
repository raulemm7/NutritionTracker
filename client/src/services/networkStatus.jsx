import { createContext, useContext, useEffect, useState } from 'react';
import React from 'react';

const NetworkStatusContext = createContext({
  isOnline: true,
  lastOnlineAt: null,
  lastOfflineAt: null,
});

export const NetworkStatusProvider = ({ children }) => {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    lastOnlineAt: navigator.onLine ? new Date() : null,
    lastOfflineAt: navigator.onLine ? null : new Date(),
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        lastOnlineAt: new Date(),
      }));
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        lastOfflineAt: new Date(),
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={status}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

export const useNetworkStatus = () => useContext(NetworkStatusContext);