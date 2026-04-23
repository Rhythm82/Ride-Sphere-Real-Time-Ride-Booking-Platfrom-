import React, { useEffect, createContext, useContext } from "react";
import { io } from "socket.io-client";

export const SocketDataContext = createContext(null);

// ✅ create socket ONCE
const socket = io(import.meta.env.VITE_BASE_URL, {
  transports: ["websocket"],
});

const SocketContext = ({ children }) => {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <SocketDataContext.Provider value={socket}>
      {children}
    </SocketDataContext.Provider>
  );
};

export default SocketContext;

// ✅ cleaner hook
export const useSocket = () => {
  return useContext(SocketDataContext);
};
