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
      const { userId, userType, lat, lng } = data;

      console.log("JOIN EVENT:", userId, userType);

      try {
        if (userType === "captain") {
          await captainModel.findByIdAndUpdate(userId, {
            socketId: socket.id,
          });

          console.log("✅ Captain socket saved:", socket.id);

          if (typeof lat === "number" && typeof lng === "number") {
            await captainModel.findByIdAndUpdate(userId, {
              location: {
                type: "Point",
                coordinates: [lng, lat],
              },
            });
          }
        }

        if (userType === "user") {
          await userModel.findByIdAndUpdate(userId, {
            socketId: socket.id,
          });

          console.log("✅ User socket saved:", socket.id);
        }
      } catch (err) {
        console.log("❌ JOIN ERROR:", err);
      }
    });

    socket.on("update-location-captain", async (data) => {
      const { captainId, lat, lng } = data;
      console.log(
        `Captain ${captainId} updated location: lat=${lat}, lng=${lng}`,
      );
      if (
        typeof lat !== "number" ||
        typeof lng !== "number" ||
        isNaN(lat) ||
        isNaN(lng)
      ) {
        return socket.emit("error", { message: "Invalid location data" });
      }

      try {
        await captainModel.findByIdAndUpdate(
          captainId,
          { location: { type: "Point", coordinates: [lng, lat] } },
          { new: true },
        );

        console.log(` Captain ${captainId} location saved in DB`);
      } catch (err) {
        console.error(" Error updating captain location:", err.message);
      }
    });

    // ================= CHAT =================
    socket.on("send-message", async (data) => {
      const { toUserId, message, from } = data;
      console.log("FROM:", from, "TO:", toUserId);
      try {
        let targetUser;

        // 🔥 if sending to user
        targetUser = await userModel.findById(toUserId);

        // 🔥 if not user → maybe captain
        if (!targetUser) {
          targetUser = await captainModel.findById(toUserId);
        }

        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit("receive-message", {
            message,
            from,
          });

          console.log("📩 Message sent:", message);
        } else {
          console.log("⚠️ Target user not online");
        }
      } catch (err) {
        console.log("❌ CHAT ERROR:", err.message);
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
