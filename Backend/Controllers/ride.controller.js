const rideService = require("../services/ride.service.js");
const { validationResult } = require("express-validator");
const mapService = require("../services/maps.service.js");
const { sendMessageToSocketId } = require("../socket");
const rideModel = require("../Models/ride.model.js");

module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;

  try {
    // ✅ 1. CREATE RIDE
    const ride = await rideService.createRide({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
    });

    // ✅ 2. GET PICKUP COORDINATES
    const pickupCoordinates = await mapService.getAddressCoordinate(pickup);

    // ✅ 3. FIND NEARBY CAPTAINS
    const captainsInRadius = await mapService.getCaptainsInTheRadius(
      pickupCoordinates.lng,
      pickupCoordinates.lat,
      2,
    );

    // ✅ 4. FILTER BY VEHICLE TYPE
    const filteredCaptains = captainsInRadius.filter(
      (captain) => captain.vehicle.vehicleType === vehicleType,
    );

    console.log("Found captains:", filteredCaptains.length);

    // ✅ 5. POPULATE USER
    const rideWithUser = await rideModel.findById(ride._id).populate("user");

    // ✅ 6. SEND SOCKET EVENT
    filteredCaptains.forEach((captain) => {
      if (captain.socketId) {
        sendMessageToSocketId(captain.socketId, {
          event: "new-ride",
          data: rideWithUser,
        });
      }
    });

    // 🔥🔥🔥 MOST IMPORTANT CHANGE
    // ✅ 7. SEND RESPONSE WITH CAPTAINS
    res.status(201).json({
      ride,
      captains: filteredCaptains,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    const fare = await rideService.getFare(pickup, destination);
    return res.status(200).json(fare);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getUserRideHistory = async (req, res) => {
  try {
    const rides = await rideModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain,
    });

    // 🔥 DEBUG START
    console.log("========== CONFIRM RIDE DEBUG ==========");
    console.log("Ride ID:", ride._id);
    console.log("User ID:", ride.user?._id);
    console.log("User socketId:", ride.user?.socketId);
    console.log("Captain:", ride.captain?._id);
    console.log("OTP:", ride.otp);
    console.log("=======================================");
    // 🔥 DEBUG END

    if (!ride.user?.socketId) {
      console.log("❌ ERROR: USER SOCKET ID NOT FOUND");
    } else {
      console.log("✅ Sending ride-confirmed to:", ride.user.socketId);

      sendMessageToSocketId(ride.user.socketId, {
        event: "ride-confirmed",
        data: ride,
      });
    }

    return res.status(200).json(ride);
  } catch (err) {
    console.log("❌ CONFIRM RIDE ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.query;

  try {
    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain,
    });

    console.log(ride);

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-started",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-ended",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
