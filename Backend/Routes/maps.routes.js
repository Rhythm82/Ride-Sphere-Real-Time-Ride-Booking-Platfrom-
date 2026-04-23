const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middlewares/auth.middleware.js");
const mapController = require("../Controllers/maps.controller.js");
const { query } = require("express-validator");

router.get(
  "/get/coordinates",
  query("address").isString().isLength({ min: 3 }),
  mapController.getCoordinates,
);

router.get(
  "/get/distance/time",
  query("origin").isString().isLength({ min: 3 }),
  query("destination").isString().isLength({ min: 3 }),
  mapController.getDistanceTime,
);

router.get(
  "/get/suggestions",
  query("input").isString().isLength({ min: 3 }),
  mapController.getAutoCompleteSuggestions,
);

module.exports = router;
