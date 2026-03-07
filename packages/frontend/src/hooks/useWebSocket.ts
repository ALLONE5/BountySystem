import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { Notification } from '../types';
import { logger } from '../utils/logger';

interface UseWebSocketOptions {
  onNotification?: (notification: Notification) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { token, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to store callbacks to avoid re-creating socket on callback changes
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Only connect if authenticated and have token
    if (!isAuthenticated || !token) {
      return;
    }

    // Create socket connection (remove /api suffix from URL)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const wsUrl = apiUrl.replace('/api', '');
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Handle connection
    socket.on('connect', () => {
      logger.info('WebSocket connected successfully');
      setIsConnected(true);
      setError(null);
      
      // Authenticate the socket
      socket.emit('authenticate', token);
      
      if (optionsRef.current.onConnect) {
        optionsRef.current.onConnect();
      }
    });

    // Handle authentication response
    socket.on('authenticated', (data: { success: boolean; userId?: string; error?: string }) => {
      if (data.success) {
        logger.info('WebSocket authenticated for user:', data.userId);
      } else {
        logger.error('WebSocket authentication failed:', data.error);
        setError(new Error(data.error || 'Authentication failed'));
        if (optionsRef.current.onError) {
          optionsRef.current.onError(new Error(data.error || 'Authentication failed'));
        }
      }
    });

    // Handle notifications
    socket.on('notification', (notification: Notification) => {
      logger.info('Received notification:', notification);
      if (optionsRef.current.onNotification) {
        optionsRef.current.onNotification(notification);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('WebSocket disconnected (this is normal when backend is not running):', reason);
      setIsConnected(false);
      if (optionsRef.current.onDisconnect) {
        optionsRef.current.onDisconnect();
      }
    });

    // Handle errors
    socket.on('connect_error', (err) => {
      logger.info('WebSocket connection error (this is normal in development):', err.message);
      setError(err);
      if (optionsRef.current.onError) {
        optionsRef.current.onError(err);
      }
    });

    // Cleanup on unmount
    return () => {
      logger.info('Cleaning up WebSocket connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isAuthenticated]); // Only depend on token and isAuthenticated

  return {
    socket: socketRef.current,
    isConnected,
    error,
  };
};
