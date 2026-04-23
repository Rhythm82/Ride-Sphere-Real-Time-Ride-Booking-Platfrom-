import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSocket } from "../../context/SocketContext.jsx";

import LiveTracking from "../../components/LiveTracking.jsx";

const UserRiding = () => {
  const location = useLocation();
  const ride = location.state?.ride;

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const socket = useSocket();
  const navigate = useNavigate();

  // ================= GET COORDINATES =================
  useEffect(() => {
    if (!ride) return;

    const fetchCoords = async () => {
      try {
        const [pickupRes, destRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get/coordinates`, {
            params: { address: ride.pickup },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }),
          axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get/coordinates`, {
            params: { address: ride.destination },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          }),
        ]);

        setPickupCoords({
          lat: pickupRes.data.lat,
          lng: pickupRes.data.lng,
        });

        setDestinationCoords({
          lat: destRes.data.lat,
          lng: destRes.data.lng,
        });
      } catch (err) {
        console.log(err);
      }
    };

    fetchCoords();
  }, [ride]);

  // ================= GET DISTANCE =================
  useEffect(() => {
    if (!pickupCoords || !destinationCoords) return;

    const fetchDistance = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/maps/get/distance/time`,
          {
            params: {
              origin: ride.pickup,
              destination: ride.destination,
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          },
        );

        setDistance(res.data.distance.text);
        setDuration(res.data.duration.text);
      } catch (err) {
        console.log(err);
      }
    };

    fetchDistance();
  }, [pickupCoords, destinationCoords]);

  useEffect(() => {
    if (!socket) return;

    const handleRideEnded = (data) => {
      console.log("🔥 RIDE ENDED RECEIVED:", data);

      navigate("/user/finish/ride", {
        state: { ride: data },
      });
    };

    socket.on("ride-ended", handleRideEnded);

    return () => {
      socket.off("ride-ended", handleRideEnded);
    };
  }, [socket, navigate]);

  if (!ride) return <div>No ride data</div>;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* MAP */}
      <div className="h-[65%]">
        <LiveTracking
          mode="riding"
          ride={ride}
          pickupCoords={pickupCoords}
          destinationCoords={destinationCoords}
        />
      </div>

      {/* DETAILS */}
      <div className="h-[35%] p-5 bg-white shadow-xl rounded-t-3xl">
        {/* DRIVER */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">
              {ride?.captain?.fullname?.firstname}
            </h2>
            <p className="text-gray-500 text-sm">
              {ride?.captain?.vehicle?.name}
            </p>
          </div>

          <div className="text-right">
            <h3 className="text-xl font-bold">
              {ride?.captain?.vehicle?.plate}
            </h3>
            <p className="text-gray-500 text-sm">
              {ride?.captain?.vehicle?.color}
            </p>
          </div>
        </div>

        {/* ROUTE INFO */}
        <div className="mt-6 bg-blue-50 p-4 rounded-xl flex justify-between">
          <div>
            <p className="text-gray-500 text-sm">Distance</p>
            <h3 className="font-semibold">{distance || "..."}</h3>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Time</p>
            <h3 className="font-semibold">{duration || "..."}</h3>
          </div>
        </div>

        {/* DESTINATION */}
        <div className="mt-4">
          <p className="text-gray-500 text-sm">Destination</p>
          <h3 className="font-semibold">{ride.destination}</h3>
        </div>

        {/* STATUS */}
        <div className="mt-4 text-center text-blue-600 font-semibold">
          Ride in progress
        </div>
      </div>
    </div>
  );
};

export default UserRiding;
