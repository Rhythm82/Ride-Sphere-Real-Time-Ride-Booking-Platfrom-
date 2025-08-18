import React, { useEffect, createContext } from "react";
import { io } from "socket.io-client";

export const SocketDataContext = createContext();

const socket = io("http://localhost:8080");

const SocketContext = ({ children }) => {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
  }, []);

  return (
    <SocketDataContext.Provider value={{ socket }}>
      {children}
    </SocketDataContext.Provider>
  );
};

export default SocketContext;
