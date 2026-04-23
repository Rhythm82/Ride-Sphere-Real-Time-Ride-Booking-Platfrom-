const express = require("express");
const router = express.Router();
const paymentController = require("../Controllers/payment.controller");

router.post("/create-order", paymentController.createOrder);
router.post("/verify", paymentController.verifyPayment);
router.post("/cash", paymentController.cashPayment);
module.exports = router;