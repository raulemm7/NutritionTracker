import { io } from "socket.io-client";
import { SOCKET_URL } from "../config";

let socket = null;
let currentToken = null;

export function initializeSocket(token) {
  if (socket && currentToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  currentToken = token;
  socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
    currentToken = null; // Reset token on error
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
    // Don't reset currentToken here as we might want to reconnect with same token
  });

  return socket;
}

export function getSocket() {
  if (!currentToken) return null;

  // If we have a token but no socket, try to reconnect
  if (!socket) {
    return initializeSocket(currentToken);
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
}
