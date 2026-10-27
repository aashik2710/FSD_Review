import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { alertAPI } from '../services/api';
import { useAuth } from './AuthContext';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await alertAPI.getAll({ isResolved: 'false' });
      setAlerts(res.data.data);
      setUnresolvedCount(res.data.unresolvedCount || res.data.data.length);
      setCriticalCount(res.data.criticalCount || res.data.data.filter(a => a.severity === 'Critical').length);
    } catch (err) {
      console.error('[AlertContext] Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 45000); // 45s periodic telemetry check
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const resolveAlert = async (id) => {
    try {
      await alertAPI.resolve(id);
      await fetchAlerts();
    } catch (err) {
      console.error('[AlertContext] Failed to resolve alert', err);
      throw err;
    }
  };

  const triggerScan = async () => {
    try {
      await alertAPI.triggerScan();
      await fetchAlerts();
    } catch (err) {
      console.error('[AlertContext] Failed to run alert scan', err);
      throw err;
    }
  };

  return (
    <AlertContext.Provider
      value={{
        alerts,
        unresolvedCount,
        criticalCount,
        loading,
        fetchAlerts,
        resolveAlert,
        triggerScan
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
