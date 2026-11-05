import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import API from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [pendingIncomingCount, setPendingIncomingCount] = useState(0);
  const seenRequestIdsRef = useRef(new Set());
  const isInitialFetchRef = useRef(true);
  const pollIntervalRef = useRef(null);

  // Storage key specific to the logged-in student
  const studentId = user?.id || user?._id;
  const storageKey = studentId ? `skillswap_seen_requests_${studentId}` : null;

  // Load seen IDs from storage when student changes
  useEffect(() => {
    if (storageKey) {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
          seenRequestIdsRef.current = new Set(JSON.parse(stored));
        } else {
          seenRequestIdsRef.current = new Set();
        }
      } catch (e) {
        seenRequestIdsRef.current = new Set();
      }
    } else {
      seenRequestIdsRef.current = new Set();
      setPendingIncomingCount(0);
    }
    isInitialFetchRef.current = true;
  }, [storageKey]);

  const saveSeenIds = useCallback(
    (idsSet) => {
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(Array.from(idsSet)));
        } catch (e) {}
      }
    },
    [storageKey]
  );

  const fetchNotifications = useCallback(
    async (isPolling = false) => {
      if (!user || user.role === 'admin') {
        setPendingIncomingCount(0);
        return;
      }

      try {
        const res = await API.get('/api/requests/notifications');
        const count = typeof res.count === 'number' ? res.count : 0;
        const requestIds = res.requestIds || [];

        setPendingIncomingCount(count);

        // On initial fetch after login/mount, mark all current pending IDs as seen so we don't spam toasts
        if (isInitialFetchRef.current) {
          requestIds.forEach((id) => seenRequestIdsRef.current.add(id));
          saveSeenIds(seenRequestIdsRef.current);
          isInitialFetchRef.current = false;
          return;
        }

        // Check for any new request ID not yet in seenRequestIdsRef
        const newIncomingIds = requestIds.filter((id) => !seenRequestIdsRef.current.has(id));

        if (newIncomingIds.length > 0) {
          // Add to seen IDs immediately to avoid duplicate notifications
          newIncomingIds.forEach((id) => seenRequestIdsRef.current.add(id));
          saveSeenIds(seenRequestIdsRef.current);

          // Display toast notification with click-to-navigate to Requests Hub -> Incoming
          showToast(
            'info',
            'New skill request received!',
            6000,
            () => navigate('/requests?tab=incoming')
          );
        }
      } catch (err) {
        // Silently catch polling errors
        console.warn('Failed to poll notifications:', err.message);
      }
    },
    [user, showToast, navigate, saveSeenIds]
  );

  // Set up polling interval (every 15 seconds) when student is logged in
  useEffect(() => {
    if (!user || user.role === 'admin') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setPendingIncomingCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications(false);

    // Polling interval
    pollIntervalRef.current = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [user, fetchNotifications]);

  const refreshNotifications = useCallback(() => {
    return fetchNotifications(false);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        pendingIncomingCount,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return { pendingIncomingCount: 0, refreshNotifications: () => {} };
  }
  return context;
};

export default NotificationContext;

