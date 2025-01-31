import { Server } from 'socket.io';
import { Message, Reaction, TypingStatus, User } from '@/types/chat';

let io: Server;
const users = new Map<string, User>();
const typingUsers = new Set<string>();

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user registration
    socket.on('user:register', (user: User) => {
      users.set(socket.id, user);
      io.emit('users:update', Array.from(users.values()));
    });

    // Handle messages with reactions
    socket.on('message', (message: Message) => {
      const user = users.get(socket.id);
      io.emit('message', {
        ...message,
        userName: user?.name || 'Anonymous',
        reactions: {},
      });
    });

    // Handle typing status
    socket.on('typing:start', () => {
      const user = users.get(socket.id);
      if (user && !typingUsers.has(socket.id)) {
        typingUsers.add(socket.id);
        const typingStatus: TypingStatus = {
          userId: socket.id,
          userName: user.name,
          isTyping: true
        };
        socket.broadcast.emit('typing:update', typingStatus);
      }
    });

    socket.on('typing:stop', () => {
      const user = users.get(socket.id);
      if (user && typingUsers.has(socket.id)) {
        typingUsers.delete(socket.id);
        const typingStatus: TypingStatus = {
          userId: socket.id,
          userName: user.name,
          isTyping: false
        };
        socket.broadcast.emit('typing:update', typingStatus);
      }
    });

    // Handle reactions
    socket.on('reaction:add', (reaction: Reaction) => {
      io.emit('reaction:update', reaction);
    });

    socket.on('reaction:remove', (reaction: Reaction) => {
      io.emit('reaction:update', { ...reaction, remove: true });
    });

    socket.on('disconnect', () => {
      const user = users.get(socket.id);
      if (user) {
        users.delete(socket.id);
        typingUsers.delete(socket.id);
        io.emit('users:update', Array.from(users.values()));
      }
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};