"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/hooks/useSocket";
import { useReactions } from "@/hooks/useReactions";
import { useTyping } from "@/hooks/useTyping";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const socket = useSocket();
  const { messages, addReaction, removeReaction } = useReactions(socket);
  const { typingUsers, startTyping, stopTyping } = useTyping(socket);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Register user
    const name = prompt("Enter your name:") || "Anonymous";
    setUserName(name);
    if (socket) {
      socket.emit('user:register', { id: socket.id, name });
    }
  }, [socket]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !newMessage.trim()) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      userId: socket.id,
    };

    socket.emit("message", message);
    setNewMessage("");
    stopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    startTyping();
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Chat header */}
      <div className="flex items-center px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarFallback className={cn(getAvatarColor("David Moore"))}>
              {getInitials("David Moore")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">David Moore</h2>
            <p className="text-sm text-muted-foreground">last seen 5 mins ago</p>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <button className="p-2 hover:bg-muted rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
          </button>
          <button className="p-2 hover:bg-muted rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4" style={{ backgroundImage: 'url("/pattern-bg.png")', backgroundSize: '400px' }}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.userId === socket?.id ? "items-end" : "items-start"
              }`}
            >
              <div className="flex items-end gap-2">
                {message.userId !== socket?.id && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={cn(getAvatarColor(message.userName || "Anonymous"))}>
                      {getInitials(message.userName || "Anonymous")}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`group relative rounded-2xl px-4 py-2 max-w-[70%] shadow-sm ${
                    message.userId === socket?.id
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-background rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {/* Reactions */}
                  {message.reactions && Object.entries(message.reactions).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {Object.entries(message.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => removeReaction(message.id, emoji)}
                          className="text-xs bg-background/50 backdrop-blur-sm rounded-full px-1.5 py-0.5"
                        >
                          {emoji} {users.length}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Reaction button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
                        </svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="flex gap-1">
                        {REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(message.id, emoji)}
                            className="text-xl hover:bg-muted p-1 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          ))}
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="flex space-x-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-100">•</span>
                <span className="animate-bounce delay-200">•</span>
              </div>
              <span>
                {typingUsers.map(user => user.userName).join(", ")}
                {typingUsers.length === 1 ? " is " : " are "}
                typing...
              </span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Chat input */}
      <div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="flex items-end space-x-2">
          <button className="p-2 hover:bg-muted rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </button>
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Write a message..."
              className="rounded-full border-muted-foreground/20"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            />
          </div>
          {newMessage.trim() ? (
            <Button
              onClick={sendMessage}
              size="icon"
              className="rounded-full h-10 w-10 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="m5 12 14-7-7 14v-7z"/>
              </svg>
            </Button>
          ) : (
            <Button
              size="icon"
              className="rounded-full h-10 w-10 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
