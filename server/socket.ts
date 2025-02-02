import { Server } from 'socket.io';

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    transports: ['websocket'],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
    }
  });

  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join user's personal room
    socket.on('join_user', (userId: string) => {
      socket.join(userId);
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
      console.log('Connected users:', Array.from(connectedUsers.entries()));
    });

    // Handle new messages
    socket.on('send_message', (message) => {
      console.log('New message:', message);
      
      // Broadcast to everyone in sender's room (including sender)
      io.to(message.senderId).emit('new_message', {
        ...message,
        received: true
      });
      
      // Broadcast to everyone in receiver's room
      io.to(message.receiverId).emit('new_message', {
        ...message,
        received: true
      });

      // Log delivery status
      const receiverSocketId = connectedUsers.get(message.receiverId);
      console.log(`Message delivered to receiver ${message.receiverId} via socket ${receiverSocketId}`);
    });

    // Handle typing status
    socket.on('typing_start', ({ senderId, receiverId }) => {
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverId).emit('user_typing', { 
          userId: senderId, 
          isTyping: true 
        });
        console.log(`Typing indicator sent to ${receiverId}`);
      }
    });

    socket.on('typing_stop', ({ senderId, receiverId }) => {
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverId).emit('user_typing', { 
          userId: senderId, 
          isTyping: false 
        });
      }
    });

    socket.on('disconnect', () => {
      // Remove user from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
      console.log('Connected users after disconnect:', Array.from(connectedUsers.entries()));
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};