"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  // Mock data for chat list
  const chatList = [
    {
      id: "1",
      name: "David Moore",
      lastMessage: "You don't remember anything 😄",
      time: "5 mins ago",
      avatar: "👤"
    },
    {
      id: "2",
      name: "Office Chat",
      lastMessage: "Lewis: All done mate ⭐️",
      time: "17:08",
      avatar: "👥"
    },
    {
      id: "3",
      name: "Emily Dorson",
      lastMessage: "Table for four, 5PM. Be there.",
      time: "17:42",
      avatar: "👤"
    },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        {/* Search header */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-muted rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <line x1="4" x2="20" y1="12" y2="12"/>
                <line x1="4" x2="20" y1="6" y2="6"/>
                <line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            </button>
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search"
                className="w-full px-3 py-2 bg-background rounded-md border"
              />
            </div>
          </div>
        </div>

        {/* Chat list */}
        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          {chatList.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={cn(
                "w-full p-4 flex items-start space-x-3 hover:bg-muted/50 transition-colors",
                selectedChat === chat.id && "bg-muted"
              )}
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary text-primary-foreground rounded-full">
                {chat.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium truncate">{chat.name}</h3>
                  <span className="text-xs text-muted-foreground">{chat.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
