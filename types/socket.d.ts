import { Server } from 'socket.io';

declare global {
  var io: Server;
  interface Message {
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
  }
}

