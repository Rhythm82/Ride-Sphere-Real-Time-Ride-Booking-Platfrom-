import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import LiveTracking from "../../components/LiveTracking.jsx";
import FinishRide from "../../components/FinishRide.jsx";

const CaptainRiding = () => {
  const location = useLocation();
  const rideData = location.state?.ride;

  const [pickupCoords, setPickupCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);

  const [finishRidePanel, setFinishRidePanel] = useState(false);
  const finishRidePanelRef = useRef(null);

  // ================= PANEL ANIMATION =================
  useGSAP(() => {
    gsap.to(finishRidePanelRef.current, {
      transform: finishRidePanel ? "translateY(0)" : "translateY(100%)",
    });
  }, [finishRidePanel]);

  // ================= GET COORDINATES =================
  useEffect(() => {
    if (!rideData) return;

    // pickup coords
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/maps/get/coordinates`, {
        params: { address: rideData.pickup },
      })
      .then((res) => {
        setPickupCoords({
          lat: res.data.lat,
          lng: res.data.lng,
        });
      });

    // destination coords
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/maps/get/coordinates`, {
        params: { address: rideData.destination },
      })
      .then((res) => {
        setDestinationCoords({
          lat: res.data.lat,
          lng: res.data.lng,
        });
      });
  }, [rideData]);

  // ================= REAL DISTANCE (GOOGLE API) =================
  useEffect(() => {
    if (!rideData?.pickup || !rideData?.destination) return;

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/maps/get/distance/time`, {
        params: {
          origin: rideData.pickup,
          destination: rideData.destination,
        },
      })
      .then((res) => {
        setDistance(res.data.distance.text); // "21.3 km"
        setEta(res.data.duration.text); // "38 mins"
      })
      .catch((err) => console.log("Distance error:", err));
  }, [rideData]);

  if (!rideData) return <div>No Ride Found</div>;

  const user = rideData.user;

  return (
    <div className="h-screen w-full relative bg-gray-100 overflow-hidden">
      {/* ================= MAP ================= */}
      <div className="h-[65%]">
        <LiveTracking
          mode="riding"
          pickupCoords={pickupCoords}
          destinationCoords={destinationCoords}
        />
      </div>

      {/* ================= TOP BAR ================= */}
      <div className="absolute top-0 w-full flex justify-between items-center p-4">
        {/* 🔥 Branding */}
        <h1 className="text-xl font-bold text-gray-800">RideSphere</h1>

        {/* 🔥 Logout */}
        <button
          onClick={() => {
            localStorage.removeItem("captainToken");
            window.location.href = "/captain/login";
          }}
          className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow"
        >
          <i className="ri-logout-box-r-line text-lg"></i>
        </button>
      </div>

      {/* ================= BOTTOM CARD ================= */}
      <div className="absolute bottom-0 w-full bg-white/80 backdrop-blur-xl rounded-t-3xl p-4 shadow-xl">
        {/* USER INFO */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <img
              src="https://tse1.mm.bing.net/th/id/OIP.kS3fIKOfgPE244974kmsBgHaHa?pid=ImgDet&w=203&h=203&c=7&o=7&rm=3"
              className="h-12 w-12 rounded-full"
            />
            <div>
              <h2 className="font-semibold capitalize">
                {user?.fullname?.firstname}
              </h2>
              <p className="text-xs text-gray-500">{rideData.pickup}</p>
            </div>
          </div>

          <div className="text-right">
            <h3 className="font-bold text-lg">₹{rideData.fare}</h3>
          </div>
        </div>

        {/* DISTANCE + ETA */}
        <div className="mt-4 bg-blue-50 p-3 rounded-xl flex justify-between">
          <span className="text-gray-600">Trip Progress</span>
          <span className="font-semibold">
            {distance && eta ? `${distance} • ${eta}` : "Calculating..."}
          </span>
        </div>

        {/* DESTINATION */}
        <div className="mt-4">
          <p className="text-gray-500 text-sm">Destination</p>
          <h3 className="font-semibold">{rideData.destination}</h3>
        </div>

        {/* COMPLETE BUTTON */}
        <button
          onClick={() => setFinishRidePanel(true)}
          className="w-full mt-5 bg-green-600 text-white font-semibold p-3 rounded-xl"
        >
          Complete Ride
        </button>
      </div>

      {/* ================= FINISH PANEL ================= */}
      <div
        ref={finishRidePanelRef}
        className="fixed bottom-0 w-full bg-white translate-y-full z-50 p-5 rounded-t-3xl"
      >
        <FinishRide ride={rideData} setFinishRidePanel={setFinishRidePanel} />
      </div>
    </div>
  );
};

export default CaptainRiding;
