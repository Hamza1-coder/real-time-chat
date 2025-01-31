const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('message', (message) => {
    io.emit('message', message);
  });

  socket.on('typing:start', () => {
    socket.broadcast.emit('typing:update', {
      userId: socket.id,
      userName: socket.data.userName || 'Anonymous',
      isTyping: true
    });
  });

  socket.on('typing:stop', () => {
    socket.broadcast.emit('typing:update', {
      userId: socket.id,
      userName: socket.data.userName || 'Anonymous',
      isTyping: false
    });
  });

  socket.on('user:register', (user) => {
    socket.data.userName = user.name;
    socket.broadcast.emit('user:joined', user);
  });

  socket.on('reaction:add', (reaction) => {
    io.emit('reaction:update', reaction);
  });

  socket.on('reaction:remove', (reaction) => {
    io.emit('reaction:update', { ...reaction, remove: true });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socket.broadcast.emit('user:left', { userId: socket.id });
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
