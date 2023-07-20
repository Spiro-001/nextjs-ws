import { io } from "socket.io-client";

export const socket = io(":5050", {
  autoConnect: false,
}); // Connect to websocket
