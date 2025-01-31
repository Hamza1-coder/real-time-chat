export interface User {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
  reactions?: Record<string, string[]>; // emoji -> userId[]
}

export interface TypingStatus {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export type Reaction = {
  emoji: string;
  userId: string;
  messageId: string;
};
