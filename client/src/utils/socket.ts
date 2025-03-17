import { io } from "socket.io-client";

const socket = io('http://localhost:4000', {
  reconnection: true,
  reconnectionAttempts: 5,
  transports: ['websocket']
});

export default socket;
