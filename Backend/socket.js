const socketIo = require("socket.io");
const userModel = require("./Models/user.model.js");
const captainModel = require("./Models/captain.model.js");

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join", async (data) => {
      const { userId, userType } = data;
      console.log(`User ${userId}, join as ${userType}`);

      if (userType === "user") {
        await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
      } else if (userType === "captain") {
        await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
      }
    });

    socket.on("update-location-captain", async (data) => {
      const { captainId, lat, lng } = data;
      console.log(
        `Captain ${captainId} updated location: lat=${lat}, lng=${lng}`
      );
      if (typeof lat !== "number" || typeof lng !== "number") {
        return socket.emit("error", { message: "Invalid location data" });
      }

      try {
        await captainModel.findByIdAndUpdate(
          captainId,
          { location: { type: "Point", coordinates: [lng, lat] } },
          { new: true }
        );

        console.log(` Captain ${captainId} location saved in DB`);
      } catch (err) {
        console.error(" Error updating captain location:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

const sendMessageToSocketId = (socketId, messageObject) => {
  console.log(messageObject);

  if (io) {
    io.to(socketId).emit(messageObject.event, messageObject.data);
  } else {
    console.log("Socket.io not initialized.");
  }
};

module.exports = { initializeSocket, sendMessageToSocketId };
