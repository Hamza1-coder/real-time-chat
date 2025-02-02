import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
}

export function useChat(currentUser: User | null, friendId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const socket = useSocket();

  // Join user's room when connected
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Join user's personal room
    socket.emit('join_user', currentUser.id);

    return () => {
      if (friendId) {
        socket.emit('typing_stop', { 
          senderId: currentUser.id,
          receiverId: friendId
        });
      }
    };
  }, [socket, currentUser, friendId]);

  // Listen for new messages and typing status
  useEffect(() => {
    if (!socket || !currentUser || !friendId) return;

    const handleNewMessage = (message: Message) => {
      if (
        (message.senderId === currentUser.id && message.receiverId === friendId) ||
        (message.senderId === friendId && message.receiverId === currentUser.id)
      ) {
        setMessages(prev => {
          // Avoid duplicate messages
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    const handleTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (userId === friendId) {
        setIsTyping(isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, currentUser, friendId]);

  // Load chat history
  useEffect(() => {
    if (!currentUser || !friendId) return;

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/messages?senderId=${currentUser.id}&receiverId=${friendId}`);
        if (!response.ok) throw new Error('Failed to load messages');
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadMessages();
  }, [currentUser, friendId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!socket || !currentUser || !friendId || !content.trim()) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          senderId: currentUser.id,
          receiverId: friendId,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const message = await response.json();
      
      // Update local state immediately
      setMessages(prev => [...prev, message]);
      
      // Emit to socket
      socket.emit('send_message', message);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [socket, currentUser, friendId]);

  const startTyping = useCallback(() => {
    if (!socket || !currentUser || !friendId) return;
    socket.emit('typing_start', {
      senderId: currentUser.id,
      receiverId: friendId
    });
  }, [socket, currentUser, friendId]);

  const stopTyping = useCallback(() => {
    if (!socket || !currentUser || !friendId) return;
    socket.emit('typing_stop', {
      senderId: currentUser.id,
      receiverId: friendId
    });
  }, [socket, currentUser, friendId]);

  return {
    messages,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping
  };
}
