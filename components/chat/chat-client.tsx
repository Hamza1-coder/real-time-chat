'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/hooks/useSocket";
import { useTyping } from "@/hooks/useTyping";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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
  sender: User;
  receiver: User;
}

export default function ChatClient() {
  const searchParams = useSearchParams();
  const friendId = searchParams.get('friendId');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friend, setFriend] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const socket = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (!currentUser || !friendId) return;

    const fetchFriendAndMessages = async () => {
      try {
        const friendResponse = await fetch(`/api/users/${friendId}`);
        if (!friendResponse.ok) throw new Error('Failed to fetch friend details');
        const friendData = await friendResponse.json();
        setFriend(friendData);

        const messagesResponse = await fetch(`/api/chat/messages?senderId=${currentUser.id}&receiverId=${friendId}`);
        if (!messagesResponse.ok) throw new Error('Failed to fetch messages');
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat data',
          variant: 'destructive',
        });
      }
    };

    fetchFriendAndMessages();
  }, [currentUser, friendId, toast]);

  useEffect(() => {
    if (!socket || !currentUser || !friendId) return;

    socket.on('chat:message', (message: ChatMessage) => {
      if (
        (message.senderId === currentUser.id && message.receiverId === friendId) ||
        (message.senderId === friendId && message.receiverId === currentUser.id)
      ) {
        setMessages(prev => [...prev, message]);
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    socket.on('typing:update', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === friendId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socket.off('chat:message');
      socket.off('typing:update');
    };
  }, [socket, currentUser, friendId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (socket && currentUser && friendId) {
      socket.emit('typing:start', { userId: currentUser.id, friendId });
    }
  };

  const handleSendMessage = async () => {
    if (!socket || !newMessage.trim() || !currentUser || !friendId) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          senderId: currentUser.id,
          receiverId: friendId,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const message = await response.json();
      socket.emit('chat:message', message);
      setNewMessage('');
      socket.emit('typing:stop', { userId: currentUser.id, friendId });
    } catch (error) {
      console.error('Error:', error);
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

      <div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="flex items-end space-x-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Write a message..."
            className="rounded-full border-muted-foreground/20"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="m22 2-7 20-4-9-9-4Z"/>
              <path d="M22 2 11 13"/>
            </svg>
          </Button>
        </div>
      </div>
    </>
  );
}
