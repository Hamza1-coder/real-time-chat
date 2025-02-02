'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@/hooks/useChat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getInitials, getAvatarColor } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  username: string;
  email: string;
  profileImage: string | null;
}

export default function ChatWindow() {
  const searchParams = useSearchParams();
  const friendId = searchParams.get('friendId');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friend, setFriend] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize chat hook
  const { messages, isTyping, sendMessage, startTyping, stopTyping } = useChat(currentUser, friendId);

  // Load current user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Fetch friend details
  useEffect(() => {
    if (!friendId) return;

    const fetchFriend = async () => {
      try {
        const response = await fetch(`/api/users/${friendId}`);
        if (!response.ok) throw new Error('Failed to fetch friend details');
        const data = await response.json();
        setFriend(data);
      } catch (error) {
        console.error('Error fetching friend:', error);
        toast({
          title: 'Error',
          description: 'Failed to load friend details',
          variant: 'destructive',
        });
      }
    };

    fetchFriend();
  }, [friendId, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Handle typing status with debounce
    startTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(stopTyping, 1000);
  };

  // Handle message submission
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      await sendMessage(messageInput);
      setMessageInput('');
      stopTyping();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  if (!currentUser || !friend) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  return (
    <>
      {/* Chat Header */}
      <div className="flex items-center px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback className={cn(getAvatarColor(friend.username))}>
              {getInitials(friend.username)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{friend.username}</h2>
            <p className="text-sm text-muted-foreground">
              {isTyping ? 'typing...' : 'online'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col",
                message.senderId === currentUser.id ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-end gap-2">
                {message.senderId !== currentUser.id && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={cn(getAvatarColor(friend.username))}>
                      {getInitials(friend.username)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 max-w-[70%] shadow-sm",
                    message.senderId === currentUser.id
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-background rounded-bl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="flex items-end space-x-2">
          <Input
            value={messageInput}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Write a message..."
            className="flex-1 rounded-full border-muted-foreground/20"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="rounded-full"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-4 h-4"
            >
              <path d="m22 2-7 20-4-9-9-4Z"/>
              <path d="M22 2 11 13"/>
            </svg>
          </Button>
        </div>
      </div>
    </>
  );
}
