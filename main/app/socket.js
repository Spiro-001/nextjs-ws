import { io } from "socket.io-client";

export const socket = io(":5000", {
  autoConnect: false,
}); // Connect to websocket
