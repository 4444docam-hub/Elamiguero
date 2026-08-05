import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { messagesAPI, friendsAPI, realtimeAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const reqSubRef = useRef(null);

  const refreshCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [msgCount, reqCount] = await Promise.all([
        messagesAPI.getUnreadCount(user.id),
        friendsAPI.getPendingRequestsCount(user.id)
      ]);
      setUnreadMessages(msgCount);
      setPendingRequests(reqCount);
    } catch (error) {
      console.error('Error refreshing notification counts:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    refreshCounts();

    const sub = realtimeAPI.subscribeToFriendRequests(user.id, () => {
      refreshCounts();
    });
    reqSubRef.current = sub;

    return () => {
      if (reqSubRef.current) {
        realtimeAPI.unsubscribeFromFriendRequests(reqSubRef.current);
        reqSubRef.current = null;
      }
    };
  }, [user, refreshCounts]);

  return (
    <NotificationContext.Provider value={{ unreadMessages, pendingRequests, refreshCounts }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
