const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");

const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const userRoutes = require("./Routes/user.routes.js");
const captainRoutes = require("./Routes/captain.routes.js");
const mapsRoutes = require("./Routes/maps.routes.js");
const rideRoutes = require("./Routes/ride.routes.js");

const http = require('http');
const { initializeSocket } = require('./socket');

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGO_URL;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/user", userRoutes);
app.use("/captain", captainRoutes);
app.use("/maps", mapsRoutes);
app.use("/rides", rideRoutes);

app.get("/", (req, res) => {
  res.send("Hi from server");
});


//database connection
mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("\n-> Connected to MongoDB");

    // Create HTTP server
    const server = http.createServer(app);

    // Attach Socket.IO
    initializeSocket(server);

    server.listen(PORT, () => {
      console.log(`-> Server is running in localhost:${PORT}`);
    });
  })

  .catch((err) => {
    console.error(" MongoDB connection error:", err);
  });

module.exports = app;
