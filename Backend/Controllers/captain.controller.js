const captainModel = require("../Models/captain.model.js");
const captainService = require("../services/captain.service.js");
const blackListTokenModel = require("../Models/blacklistToken.model.js");
const { validationResult } = require("express-validator");

module.exports.registerCaptain = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    fullname,
    email,
    password,
    phone,
    licenseNumber,
    profileImage,
    vehicle,
  } = req.body;

  const isCaptainAlreadyExist = await captainModel.findOne({ email });

  if (isCaptainAlreadyExist) {
    return res.status(400).json({ message: "Captain already exist" });
  }

  const hashedPassword = await captainModel.hashPassword(password);

  const captain = await captainService.createCaptain({
    firstname: fullname.firstname,
    lastname: fullname.lastname,
    email,
    password: hashedPassword,
    phone,
    licenseNumber,
    profileImage,

    // vehicle
    vehicleName: vehicle?.name,
    vehicleModel: vehicle?.model,
    color: vehicle?.color,
    plate: vehicle?.plate,
    capacity: vehicle?.capacity,
    vehicleType: vehicle?.vehicleType,
    vehicleImage: vehicle?.vehicleImage,
  });

  const token = captain.generateAuthToken();

  res.status(201).json({ token, captain });
};

module.exports.loginCaptain = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  const captain = await captainModel.findOne({ email }).select("+password");

  if (!captain) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await captain.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = captain.generateAuthToken();

  res.cookie("token", token);

  res.status(200).json({ token, captain });
};

module.exports.getCaptainProfile = async (req, res, next) => {
  res.status(200).json({ captain: req.captain });
};

module.exports.logoutCaptain = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  await blackListTokenModel.create({ token });

  res.clearCookie("token");

  res.status(200).json({ message: "Logout successfully" });
};

const rideModel = require("../Models/ride.model.js");

module.exports.getCaptainRides = async (req, res) => {
  try {
    const rides = await rideModel
      .find({ captain: req.captain._id })
      .sort({ createdAt: -1 });

    res.status(200).json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};