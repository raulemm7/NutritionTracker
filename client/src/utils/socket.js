import { io } from "socket.io-client";

let socket = null;

export function initializeSocket(token) {
  if (socket) {
    socket.disconnect();
  }

  socket = io("http://localhost:4000", {
    auth: {
      token: token,
    },
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}