"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  username: string;
  email: string;
  profileImage: string | null;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
}

interface ChatPreview {
  friend: User;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export default function ChatSidebar() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const socket = useSocket();
  const selectedFriendId = searchParams.get('friendId');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Fetch friends and their last messages
  useEffect(() => {
    if (!currentUser) return;

    const fetchChats = async () => {
      try {
        // Get user's friends
        const response = await fetch(`/api/friends/list?userId=${currentUser.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }
        const friends: User[] = await response.json();

        // Get last message and unread count for each friend
        const chatPreviews = await Promise.all(
          friends.map(async (friend) => {
            const messagesResponse = await fetch(
              `/api/chat/messages?senderId=${currentUser.id}&receiverId=${friend.id}`
            );
            if (!messagesResponse.ok) {
              throw new Error('Failed to fetch messages');
            }
            const messages: ChatMessage[] = await messagesResponse.json();
            
            const unreadCount = messages.filter(
              msg => msg.senderId === friend.id && !msg.read
            ).length;

            return {
              friend,
              lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
              unreadCount,
            };
          })
        );

        setChats(chatPreviews);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, [currentUser]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewMessage = (message: ChatMessage) => {
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.friend.id === message.senderId || chat.friend.id === message.receiverId) {
            return {
              ...chat,
              lastMessage: message,
              unreadCount: chat.friend.id === message.senderId ? chat.unreadCount + 1 : chat.unreadCount
            };
          }
          return chat;
        });
      });
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [socket, currentUser]);

  const handleChatSelect = (friendId: string) => {
    router.push(`/chat?friendId=${friendId}`);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-muted/30">
      {/* Search header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search chats..."
              className="w-full px-3 py-2 bg-background rounded-md border"
            />
          </div>
        </div>
      </div>

      {/* Chat list */}
      <div className="overflow-y-auto h-[calc(100vh-73px)]">
        {chats.map(({ friend, lastMessage, unreadCount }) => (
          <button
            key={friend.id}
            onClick={() => handleChatSelect(friend.id)}
            className={cn(
              "w-full p-4 flex items-start space-x-3 hover:bg-muted/50 transition-colors relative",
              selectedFriendId === friend.id && "bg-muted"
            )}
          >
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-full">
              {friend.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="font-medium truncate">{friend.username}</h3>
                {lastMessage && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {lastMessage?.content || 'No messages yet'}
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                {unreadCount}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
