import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on("connect", () => {
  console.log("✅ Connected to backend");
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from backend");
});

export default socket;
