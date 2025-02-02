import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const socketInitialized = useRef(false);

  useEffect(() => {
    if (!socketInitialized.current) {
      // Initialize socket connection if not already done
      if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
          console.log('Socket connected:', socket?.id);
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });
      }
      socketInitialized.current = true;
    }

    return () => {
      if (socketInitialized.current) {
        socket?.disconnect();
        socket = null;
        socketInitialized.current = false;
      }
    };
  }, []);

  return socket;
}
