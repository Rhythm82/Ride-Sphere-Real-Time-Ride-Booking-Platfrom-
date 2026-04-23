const Razorpay = require("razorpay");
const crypto = require("crypto");
const rideModel = require("../Models/ride.model.js");
const captainModel = require("../Models/captain.model.js");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔥 CREATE ORDER
module.exports.createOrder = async (req, res) => {
  const { amount } = req.body;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
    });

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔥 VERIFY PAYMENT
module.exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rideId } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  // ✅ PAYMENT VERIFIED

  const ride = await rideModel.findById(rideId).populate("captain");

  // 🔥 UPDATE RIDE
  ride.paymentStatus = "paid";
  ride.paymentId = razorpay_payment_id;
  await ride.save();

  // 🔥 UPDATE CAPTAIN EARNINGS
  await captainModel.findByIdAndUpdate(ride.captain._id, {
    $inc: {
      "stats.totalEarnings": ride.fare,
      "stats.totalRides": 1,
    },
  });

  res.status(200).json({
    success: true,
    paymentId: razorpay_payment_id,
  });
};

module.exports.cashPayment = async (req, res) => {
  const { rideId } = req.body;

  const ride = await rideModel.findById(rideId).populate("captain");

  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  // ✅ mark paid
  ride.paymentStatus = "paid";
  ride.paymentID = "CASH";

  await ride.save();

  // ✅ update captain earnings
  await captainModel.findByIdAndUpdate(ride.captain._id, {
    $inc: {
      "stats.totalEarnings": ride.fare,
      "stats.totalRides": 1,
    },
  });

  res.status(200).json({ success: true });
};
