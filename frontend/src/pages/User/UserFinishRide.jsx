import axios from "axios";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LiveTracking from "../../components/LiveTracking.jsx";

const UserFinishRide = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const ride = location.state?.ride;

  const [paid, setPaid] = useState(false);
  const [paymentId, setPaymentId] = useState(null);

  // 🔥 Razorpay Payment
  const handlePayment = async () => {
    try {
      // 1️⃣ create order
      const { data: order } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/payment/create-order`,
        {
          amount: ride.fare,
        },
      );

      // 2️⃣ open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "RideSphere",
        description: "Ride Payment",
        order_id: order.id,

        handler: async function (response) {
          // 3️⃣ verify
          const { data } = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/payment/verify`,
            {
              ...response,
              rideId: ride._id,
            },
          );

          if (data.success) {
            setPaid(true);
            setPaymentId(data.paymentId);
          }
        },

        theme: {
          color: "#2563eb",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.log("Payment error:", err);
    }
  };

  const handleCashPayment = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/payment/cash`, {
        rideId: ride._id,
      });

      setPaid(true);
      setPaymentId("CASH");
    } catch (err) {
      console.log(err);
    }
  };

  if (!ride) return <div>No ride data</div>;

  return (
    <div className="h-screen flex flex-col">
      {/* 🗺️ MAP (ONLY DESTINATION) */}
      <div className="h-1/2">
        <LiveTracking
          mode="destinationOnly"
          destinationCoords={null} // optional if you convert address later
        />
      </div>

      {/* 💳 PAYMENT UI */}
      <div className="h-1/2 bg-white p-5 rounded-t-2xl shadow-lg">
        {!paid ? (
          <>
            <h2 className="text-xl font-semibold text-center mb-4">
              Complete Payment
            </h2>

            <div className="flex justify-between mb-2">
              <span className="text-gray-500">Driver</span>
              <span className="font-medium">
                {ride?.captain?.fullname?.firstname}
              </span>
            </div>

            <div className="flex justify-between mb-4">
              <span className="text-gray-500">Fare</span>
              <span className="font-bold text-lg">₹{ride?.fare}</span>
            </div>

            <div className="space-y-3 mt-4">
              {/* RAZORPAY */}
              <button
                onClick={handlePayment}
                className="w-full bg-blue-600 text-white p-3 rounded-xl"
              >
                Pay with Razorpay
              </button>

              {/* CASH */}
              <button
                onClick={handleCashPayment}
                className="w-full bg-gray-200 text-black p-3 rounded-xl"
              >
                Pay Cash
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-green-600 text-center mb-3">
              ✅ Payment Successful
            </h2>

            <p className="text-center text-gray-500 mb-4">Transaction ID:</p>

            <p className="text-center font-mono text-sm mb-5">{paymentId}</p>

            <button
              onClick={() => navigate("/home")}
              className="w-full bg-black text-white p-3 rounded-xl"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserFinishRide;
