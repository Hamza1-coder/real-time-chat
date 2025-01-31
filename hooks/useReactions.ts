import { useState, useEffect } from 'react';
import { Message, Reaction } from '@/types/chat';
import { Socket } from 'socket.io-client';

export const useReactions = (socket: Socket | null) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleReaction = (reaction: Reaction & { remove?: boolean }) => {
      setMessages(prev => prev.map(message => {
        if (message.id === reaction.messageId) {
          const reactions = { ...message.reactions } || {};
          const emojiReactions = reactions[reaction.emoji] || [];

          if (reaction.remove) {
            reactions[reaction.emoji] = emojiReactions.filter(id => id !== reaction.userId);
            if (reactions[reaction.emoji].length === 0) {
              delete reactions[reaction.emoji];
            }
          } else {
            if (!emojiReactions.includes(reaction.userId)) {
              reactions[reaction.emoji] = [...emojiReactions, reaction.userId];
            }
          }

          return { ...message, reactions };
        }
        return message;
      }));
    };

    socket.on('message', handleMessage);
    socket.on('reaction:update', handleReaction);

    return () => {
      socket.off('message', handleMessage);
      socket.off('reaction:update', handleReaction);
    };
  }, [socket]);

  const addReaction = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit('reaction:add', { messageId, emoji, userId: socket.id });
  };

  const removeReaction = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit('reaction:remove', { messageId, emoji, userId: socket.id });
  };

  return { messages, addReaction, removeReaction };
};
