import express from 'express';
import { createServer } from 'http';
import { initSocket } from './server/socket';
import cors from 'cors';

const app = express();
const server = createServer(app);

// Initialize Socket.io
initSocket(server);

// Enable CORS
app.use(cors());

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
