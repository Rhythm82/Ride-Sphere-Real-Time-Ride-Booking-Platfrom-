import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SocketDataContext } from "../../context/SocketContext.jsx";
import LiveTracking from "../../components/LiveTracking.jsx";
import { motion } from "framer-motion";
import { FaCarSide, FaComments } from "react-icons/fa";
import { useSocket } from "../../context/SocketContext.jsx";

import axios from "axios";

const UserRide = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const socket = useSocket();
  const [ride, setRide] = useState(location.state?.ride || null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [distance, setDistance] = useState(null);

  const [eta, setEta] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // ================= SOCKET =================

  useEffect(() => {
    if (!socket) return;

    socket.on("ride-confirmed", (data) => {
      console.log("✅ RIDE CONFIRMED:", data);

      navigate("/user/ride", {
        state: { ride: data },
      });
    });

    return () => {
      socket.off("ride-confirmed");
    };
  }, [socket, navigate]);

  useEffect(() => {
    socket.on("ride-ended", () => navigate("/home"));

    return () => {
      socket.off("ride-ended");
    };
  }, []);

  // ================= GET PICKUP COORDS =================
  useEffect(() => {
    if (!ride?.pickup) return;

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/maps/get/coordinates`, {
        params: { address: ride.pickup },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      })
      .then((res) => {
        setPickupCoords({
          lat: res.data.lat,
          lng: res.data.lng,
        });
      })
      .catch(console.log);
  }, [ride]);

  // ================= DISTANCE + ETA =================
  useEffect(() => {
    if (!ride?.captain?.location || !pickupCoords) return;

    const driverLat = ride.captain.location.coordinates[1];
    const driverLng = ride.captain.location.coordinates[0];

    const pickupLat = pickupCoords.lat;
    const pickupLng = pickupCoords.lng;

    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) ** 2;

      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const dist = getDistanceKm(driverLat, driverLng, pickupLat, pickupLng);
    const etaMin = Math.max(1, Math.round((dist / 25) * 60));

    setDistance(dist.toFixed(2));
    setEta(etaMin);
  }, [ride, pickupCoords]);

  useEffect(() => {
    if (!ride?.user?._id) return;

    socket.emit("join", {
      userId: ride.user._id,
      userType: "user",
    });

    console.log("👤 User joined socket:", ride.user._id);
  }, [ride, socket]);

  useEffect(() => {
    socket.on("receive-message", (data) => {
      console.log("📩 Received:", data);

      setMessages((prev) => [...prev, { from: data.from, text: data.message }]);

      // 🔴 show notification if chat closed
      if (!showChat) {
        setHasNewMessage(true);
      }
    });

    return () => {
      socket.off("receive-message");
    };
  }, [showChat, socket]);

  // ================= CHAT =================
  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("send-message", {
      toUserId: ride.captain._id,
      message: input,
      from: "user",
    });

    setMessages((prev) => [...prev, { from: "user", text: input }]);

    setInput("");
  };

  // ================= COPY OTP =================
  const copyOTP = () => {
    navigator.clipboard.writeText(ride.otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!ride) return <div>No Ride</div>;

  const captain = ride.captain;

  //==== redirect to start ride//
  useEffect(() => {
    socket.on("ride-started", (updatedRide) => {
      console.log("🔥 RIDE STARTED:", updatedRide);

      navigate("/user/riding", {
        state: { ride: updatedRide },
      });
    });

    return () => {
      socket.off("ride-started");
    };
  }, [socket, navigate]);

  return (
    <div className="h-screen w-full relative bg-gray-100 overflow-hidden">
      {/* ================= MAP ================= */}
      <div className="h-[60%]">
        <LiveTracking mode="waiting" pickupCoords={pickupCoords} />
      </div>

      {/* ================= CHAT FULL SCREEN ================= */}
      {showChat && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col p-4">
          {/* HEADER */}
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setShowChat(false)}>←</button>
            <img
              src={captain.profileImage || "https://cdn-icons-png.freepik.com/512/8583/8583437.png"}
              className="h-10 w-10 rounded-full object-cover"
            />
            <h2 className="font-semibold">{captain.fullname.firstname}</h2>
          </div>

          {/* CHAT */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[70%] ${
                  msg.from === "user"
                    ? "bg-blue-500 text-white ml-auto"
                    : "bg-gray-200"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* INPUT */}
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

      {/* ================= MAIN CARD ================= */}
      {!showChat && (
        <div className="absolute bottom-0 w-full bg-white/70 backdrop-blur-xl rounded-t-3xl p-4 shadow-xl">
          {/* DRIVER CARD */}
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <img
                src={captain.profileImage || "https://cdn-icons-png.freepik.com/512/8583/8583437.png"}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h2 className="font-semibold">{captain.fullname.firstname}</h2>
                <p className="text-xs text-gray-800">+91 {captain.phone}</p>
                <p className="text-xs text-gray-500">{captain.email}</p>
              </div>
            </div>

            <div className="text-right">
              <h3 className="font-bold">{captain.vehicle.plate}</h3>
              <p className="text-s text-gray-500">
                {captain.vehicle.vehicleType}
              </p>

              <p className="text-s text-gray-500">{captain.vehicle.name}</p>
            </div>
          </div>

          {/* VEHICLE IMAGE */}
          {captain.vehicle.vehicleImage && (
            <img
              src={captain.vehicle.vehicleImage}
              className="w-full h-20 object-cover rounded-xl mt-3"
            />
          )}

          {/* ARRIVAL BAR */}
          <div className="mt-6 bg-blue-50 p-3 rounded-xl flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <span>Driver Arrival</span>
            </div>
            <span className="font-semibold">
              {distance} km • {eta} min
            </span>
          </div>

          {/* OTP CARD */}
          <div className="mt-4 text-center bg-white rounded-xl p-3 shadow">
            <p className="text-xs text-gray-400">
              Do not share OTP before driver arrives
            </p>

            <h1 className="text-3xl font-bold tracking-widest mt-1">
              {ride.otp}
            </h1>

            <button onClick={copyOTP} className="text-blue-500 text-sm mt-1">
              {copied ? "Copied ✓" : "Copy OTP"}
            </button>
          </div>

          {/* DESTINATION */}
          <div className="mt-5">
            <p className="text-gray-500 text-sm">Destination</p>
            <h3 className="font-semibold">{ride.destination}</h3>
          </div>

          {/* FARE */}
          <div className="mt-4 mb-8">
            <p className="text-gray-600 text-sm">Fare</p>
            <h3 className="font-semibold">₹{ride.fare}</h3>
          </div>
        </div>
      )}

      {/* ================= SWITCH ================= */}
      {!showChat && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="relative w-60 h-10 bg-white/40 backdrop-blur-xl rounded-full border border-white/40 shadow-lg overflow-hidden">
            {/* 🔥 Sliding Background */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-1 left-1 w-[48%] h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md"
              animate={{ x: showChat ? "100%" : "0%" }}
            />

            {/* 🔥 Content */}
            <div className="relative z-10 flex h-full">
              {/* WAITING */}
              <button
                onClick={() => setShowChat(false)}
                className="w-1/2 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <motion.div
                  animate={{ x: showChat ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex items-center gap-1"
                >
                  <FaCarSide
                    className={`text-lg ${
                      !showChat ? "text-white" : "text-gray-600"
                    }`}
                  />
                  <span className={!showChat ? "text-white" : "text-gray-700"}>
                    Waiting
                  </span>
                </motion.div>
              </button>

              {/* CHAT */}

              <button
                onClick={() => {
                  setShowChat(true);
                  setHasNewMessage(false); // reset dot
                }}
                className="w-1/2 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <motion.div
                  animate={{ x: showChat ? 0 : -20 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex items-center gap-1"
                >
                  {/* 👇 ONLY CHANGE HERE */}
                  <div className="relative">
                    <FaComments
                      className={`text-lg ${
                        showChat ? "text-white" : "text-gray-600"
                      }`}
                    />

                    {hasNewMessage && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </div>

                  <span className={showChat ? "text-white" : "text-gray-700"}>
                    Chat
                  </span>
                </motion.div>
              </button>
            </div>

            {/* 🔥 Glow effect */}
            <div className="absolute inset-0 rounded-full pointer-events-none shadow-[0_0_25px_rgba(59,130,246,0.3)]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRide;
