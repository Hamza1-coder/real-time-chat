import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { TypingStatus } from '@/types/chat';

export const useTyping = (socket: Socket | null) => {
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket) return;

    const handleTypingUpdate = (status: TypingStatus) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== status.userId);
        if (status.isTyping) {
          return [...filtered, status];
        }
        return filtered;
      });
    };

    socket.on('typing:update', handleTypingUpdate);

    return () => {
      socket.off('typing:update', handleTypingUpdate);
    };
  }, [socket]);

  const startTyping = () => {
    if (!socket) return;

    socket.emit('typing:start');

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop');
    }, 2000);
  };

  const stopTyping = () => {
    if (!socket) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing:stop');
  };

  return {
    typingUsers,
    startTyping,
    stopTyping
  };
};
