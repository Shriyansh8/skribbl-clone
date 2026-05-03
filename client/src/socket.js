import { io } from "socket.io-client";

const socket = io(
  "https://skribbl-backend-uwyy.onrender.com"
);

export default socket;