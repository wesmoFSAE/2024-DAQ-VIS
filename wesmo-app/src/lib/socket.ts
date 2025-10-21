import { io, Socket } from "socket.io-client";

const WS_URL = import.meta?.env?.VITE_WS_URL ?? "http://localhost:5001";
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, { transports: ["websocket"], autoConnect: true });
  }
  return socket;
}