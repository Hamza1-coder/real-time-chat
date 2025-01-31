import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only create socket on client side
    if (typeof window === 'undefined') return;

    // Connect to the Socket.io server
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnectionDelayMax: 10000,
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};
