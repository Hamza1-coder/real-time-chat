import { useEffect, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';

interface TypingUser {
  userId: string;
  isTyping: boolean;
}

interface TypingData {
  userId: string;
  friendId: string;
}

export function useTyping(socket: Socket | null, currentUserId: string | undefined, friendId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const startTyping = useCallback((data: TypingData) => {
    if (!socket) return;
    socket.emit('typing:start', data);
  }, [socket]);

  const stopTyping = useCallback((data: TypingData) => {
    if (!socket) return;
    socket.emit('typing:stop', data);
  }, [socket]);

  useEffect(() => {
    if (!socket || !currentUserId || !friendId) return;

    const handleTypingUpdate = (data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId);
        if (data.isTyping) {
          return [...filtered, data];
        }
        return filtered;
      });
    };

    socket.on('typing:update', handleTypingUpdate);

    return () => {
      socket.off('typing:update', handleTypingUpdate);
    };
  }, [socket, currentUserId, friendId]);

  return {
    typingUsers,
    startTyping,
    stopTyping
  };
}
