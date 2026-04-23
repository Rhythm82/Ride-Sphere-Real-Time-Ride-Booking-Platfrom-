import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import LiveTracking from "../../components/LiveTracking.jsx";
import { motion } from "framer-motion";
import { FaCarSide, FaComments } from "react-icons/fa";
import { useSocket } from "../../context/SocketContext.jsx";

const CaptainWaiting = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();

  const ride = location.state?.ride;

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);

  const [otp, setOtp] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasNewMessage, setHasNewMessage] = useState(false);
  // ================= GET COORDS =================
  useEffect(() => {
    if (!ride) return;

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/maps/get/coordinates`, {
        params: { address: ride.pickup },
      })
      .then((res) => {
        setPickupCoords({
          lat: res.data.lat,
          lng: res.data.lng,
        });
      });

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/maps/get/coordinates`, {
        params: { address: ride.destination },
      })
      .then((res) => {
        setDestinationCoords({
          lat: res.data.lat,
          lng: res.data.lng,
        });
      });
  }, [ride]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition((pos) => {
      setDriverLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ================= DISTANCE =================
  useEffect(() => {
    if (!driverLocation || !pickupCoords) return;

    const driverLat = driverLocation.lat;
    const driverLng = driverLocation.lng;

    const pickupLat = pickupCoords.lat;
    const pickupLng = pickupCoords.lng;

    const R = 6371;
    const dLat = (pickupLat - driverLat) * (Math.PI / 180);
    const dLon = (pickupLng - driverLng) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(driverLat * (Math.PI / 180)) *
        Math.cos(pickupLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;

    const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    const etaMin = Math.max(1, Math.round((dist / 25) * 60));

    setDistance(dist.toFixed(2));
    setEta(etaMin);
  }, [driverLocation, pickupCoords]);

  // ================= START RIDE =================
  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/start/ride`,
        {
          params: {
            rideId: ride._id,
            otp: otp,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("captainToken")}`,
          },
        },
      );

      if (res.status === 200) {
        navigate("/captain/riding", { state: { ride: res.data } });
      }
    } catch (err) {
      console.log("Start ride error:", err);
    }
  };

  useEffect(() => {
    if (!ride?.captain?._id) return;

    // send initial join
    socket.emit("join", {
      userId: ride.captain._id,
      userType: "captain",
    });

    console.log(" Captain joined socket:", ride.captain._id);
  }, [ride, socket]);

  // ================= CHAT =================

  useEffect(() => {
    socket.on("receive-message", (data) => {
      console.log("📩 Captain received:", data);

      setMessages((prev) => [...prev, { from: data.from, text: data.message }]);

      // 🔴 notification
      if (!showChat) {
        setHasNewMessage(true);
      }
    });

    return () => socket.off("receive-message");
  }, [showChat, socket]);

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("send-message", {
      toUserId: ride.user._id,
      message: input,
      from: "captain",
    });

    setMessages((prev) => [...prev, { from: "captain", text: input }]);

    setInput("");
  };

  if (!ride) return <div>No Ride</div>;

  return (
    <div className="h-screen w-full relative bg-gray-100 overflow-hidden">
      {/* ================= MAP ================= */}
      <div className="h-[60%]">
        <LiveTracking
          mode="captain"
          ride={ride}
          pickupCoords={pickupCoords}
          destinationCoords={destinationCoords}
        />
      </div>

      {/* ================= CHAT FULL SCREEN ================= */}
      {showChat && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col p-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setShowChat(false)}>←</button>
            <h2 className="font-semibold">{ride.user.fullname.firstname}</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[70%] ${
                  msg.from === "captain"
                    ? "bg-blue-500 text-white ml-auto"
                    : "bg-gray-200"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
              placeholder="Type message..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* ================= MAIN PANEL ================= */}
      {!showChat && (
        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur-xl rounded-t-3xl p-4 shadow-xl">
          {/* USER + FARE */}
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">
              {ride.user.fullname.firstname}
            </h2>
            <h3 className="font-bold">₹{ride.fare}</h3>
          </div>

          {/* DISTANCE */}
          <div className="mt-2 text-gray-600">
            {distance ? `${distance} km • ${eta} min` : "Calculating..."}
          </div>

          {/* PICKUP */}
          <div className="mt-4 border-b pb-2">
            <p className="text-sm text-gray-500">Pickup</p>
            <p className="font-medium">{ride.pickup}</p>
          </div>

          {/* DESTINATION */}
          <div className="mt-3 border-b pb-2">
            <p className="text-sm text-gray-500">Destination</p>
            <p className="font-medium">{ride.destination}</p>
          </div>

          {/* OTP */}
          <form onSubmit={submitHandler} className="mt-5">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              type="text"
              placeholder="Enter OTP"
              className="w-full p-3 bg-gray-100 rounded-lg text-lg font-mono"
            />

            <button className="w-full mt-4 bg-green-600 text-white p-3 rounded-lg font-semibold">
              Confirm & Start Ride
            </button>
          </form>
        </div>
      )}

      {/* ================= TOGGLE ================= */}
      {!showChat && (
        <div className="absolute bottom-90 left-1/2 -translate-x-1/2 z-50">
          <div className="relative w-60 h-10 bg-white/40 backdrop-blur-xl rounded-full border shadow-lg overflow-hidden">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-1 left-1 w-[48%] h-8 rounded-full bg-blue-500"
              animate={{ x: showChat ? "100%" : "0%" }}
            />

            <div className="relative z-10 flex h-full">
              <button
                onClick={() => setShowChat(false)}
                className="w-1/2 flex items-center justify-center gap-2 text-sm"
              >
                <FaCarSide
                  className={!showChat ? "text-white" : "text-gray-600"}
                />
                <span className={!showChat ? "text-white" : ""}>Waiting</span>
              </button>

              <button
                onClick={() => {
                  setShowChat(true);
                  setHasNewMessage(false); // 🔥 reset dot
                }}
                className="w-1/2 flex items-center justify-center gap-2 text-sm"
              >
                {/* 👇 wrap ONLY the icon */}
                <div className="relative">
                  <FaComments
                    className={showChat ? "text-white" : "text-gray-600"}
                  />

                  {/* 🔴 red dot */}
                  {hasNewMessage && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </div>

                <span className={showChat ? "text-white" : ""}>Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainWaiting;
