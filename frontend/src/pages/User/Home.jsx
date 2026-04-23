import React, { useState, useEffect, useContext } from "react";
import LiveTracking from "../../components/LiveTracking.jsx";
import LocationSearchPanel from "../../components/LocationSearchPanel.jsx";
import VehiclePanel from "../../components/VehiclePanel.jsx";
import ConfirmRide from "../../components/ConfirmRide.jsx";
import LookingForDriver from "../../components/LookingFordriver.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import { UserDataContext } from "../../context/UserContext.jsx";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useContext(UserDataContext);

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [activeField, setActiveField] = useState(null);
  const [captains, setCaptains] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [vehiclePanel, setVehiclePanel] = useState(false);
  const [confirmRidePanel, setConfirmRidePanel] = useState(false);
  const [lookingDriver, setLookingDriver] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [fare, setFare] = useState({});
  const [vehicleType, setVehicleType] = useState("");

  // 🔥 NEW: Ride History
  const [rideHistory, setRideHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("account");
  const [showActivity, setShowActivity] = useState(false);
  console.log("USER STATE:", user);

  // ================= SOCKET =================
  useEffect(() => {
    if (!socket) return;
    if (!user) return;

    socket.emit("join", {
      userId: user._id,
      userType: "user",
    });
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;

    const handleRideConfirmed = (data) => {
      setLookingDriver(false);
      navigate("/user/ride", { state: { ride: data } });
    };

    socket.on("ride-confirmed", handleRideConfirmed);

    return () => {
      socket.off("ride-confirmed", handleRideConfirmed);
    };
  }, [socket, navigate]);

  // ================= HISTORY FETCH =================
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/rides/user/history`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          },
        );

        setRideHistory(res.data);
      } catch (err) {
        console.log("History error", err);
      }
    };

    fetchHistory();
  }, []);

  // ================= SUGGESTIONS =================
  const handleSuggestions = async (input) => {
    try {
      if (input.length < 3) {
        setSuggestions([]);
        return;
      }

      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get/suggestions`,
        {
          params: { input },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );

      setSuggestions(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= FIND TRIP =================
  const findTrip = async () => {
    if (!pickup || !destination) return;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/get/fare`,
        {
          params: { pickup, destination },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );

      setFare(res.data);
      setVehiclePanel(true);
    } catch (err) {
      console.log(err);
    }
  };

  // ================= CREATE RIDE =================
  const createRide = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        {
          pickup,
          destination,
          vehicleType,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );

      setCaptains(res.data.captains || []);
      setLookingDriver(true);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    // 🔥 ONLY CHANGE: scroll enabled
    <div className="h-screen overflow-y-auto relative">
      <div className="fixed top-0 left-0 w-full z-20 backdrop-blur-xl bg-white/40 border-b border-white/20 px-5 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">RideSphere </h1>
        <Link to="/login">
          {" "}
          <h2 className="">Logout</h2>
        </Link>
      </div>
      {/* MAP */}
      <div className="h-screen">
        <LiveTracking />
      </div>

      {/* SEARCH PANEL */}
      <div
        className={`absolute bottom-0 w-full bg-white p-5 rounded-t-2xl transition-all duration-300 ${
          panelOpen ? "h-[70%]" : "h-[35%]"
        }`}
      >
        <h2 className="text-lg font-medium text-gray-700">
          Welcome,{" "}
          <span className="font-semibold text-gray-900">
            {user?.fullname?.firstname || "User"}
          </span>
        </h2>

        <h2 className="text-xl font-semibold mb-2 mt-3">Find a trip</h2>
        <input
          value={pickup}
          onFocus={() => {
            setPanelOpen(true);
            setActiveField("pickup");
          }}
          onChange={(e) => {
            setPickup(e.target.value);
            handleSuggestions(e.target.value);
          }}
          className="w-full mb-3 p-3 border rounded-lg"
          placeholder="Add a pick-up location"
        />
        <input
          value={destination}
          onFocus={() => {
            setPanelOpen(true);
            setActiveField("destination");
          }}
          onChange={(e) => {
            setDestination(e.target.value);
            handleSuggestions(e.target.value);
          }}
          className="w-full mb-3 p-3 border rounded-lg"
          placeholder="Enter your destination"
        />
        <button
          onClick={findTrip}
          className="w-full bg-black text-white p-3 rounded-lg"
        >
          Find Trip
        </button>
        {panelOpen && !vehiclePanel && (
          <LocationSearchPanel
            suggestions={suggestions}
            setPickup={setPickup}
            setDestination={setDestination}
            activeField={activeField}
          />
        )}
      </div>

      {/* VEHICLE PANEL */}
      {vehiclePanel && (
        <div className="absolute bottom-0 w-full bg-white p-5 rounded-t-2xl">
          <VehiclePanel
            fare={fare}
            pickup={pickup}
            captains={captains}
            setConfirmRidePanel={setConfirmRidePanel}
            selectVehicle={(type) => {
              setVehicleType(type);
              setVehiclePanel(false);
            }}
          />
        </div>
      )}

      {/* CONFIRM */}
      {confirmRidePanel && (
        <div className="absolute bottom-0 w-full bg-white p-5 rounded-t-2xl">
          <ConfirmRide
            pickup={pickup}
            destination={destination}
            fare={fare}
            vehicleType={vehicleType}
            setConfirmRidePanel={setConfirmRidePanel}
            setVehicleFound={setLookingDriver}
            createRide={createRide}
          />
        </div>
      )}

      {/* LOOKING DRIVER */}
      {lookingDriver && (
        <div className="absolute bottom-0 w-full bg-white p-5 rounded-t-2xl">
          <LookingForDriver
            pickup={pickup}
            destination={destination}
            fare={fare}
            vehicleType={vehicleType}
            setVehicleFound={setLookingDriver}
          />
        </div>
      )}

      {/* Past Ride Section */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 🔹 PAST RIDES */}
        <div className="bg-white pt-4">
          <h2 className="text-lg font-semibold mb-3"> Quick Rebooks</h2>

          <div className="flex gap-3 overflow-x-auto pb-4">
            {rideHistory.map((ride, i) => (
              <div
                key={i}
                onClick={() => {
                  setPickup(ride.pickup);
                  setDestination(ride.destination);
                }}
                className="min-w-[200px] bg-gray-100 rounded-xl p-3 cursor-pointer hover:bg-gray-200 transition"
              >
                <p className="text-xs text-gray-500 mb-3">
                  {new Date(ride.createdAt).toLocaleDateString()}
                </p>

                <p className="text-lg font-medium truncate mb-2">
                  📌 {ride.pickup}
                </p>

                <p className="text-lg text-gray-600 truncate mb-1">
                  → {ride.destination}
                </p>

                <p className="text-sm text-green-600 mt-2 mb-2 font-semibold">
                  ₹{ride.fare}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 🔹 TOGGLE */}
        <div className="bg-gray-200 rounded-full flex p-1 w-fit mx-auto my-6">
          <button
            onClick={() => setActiveTab("account")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition ${
              activeTab === "account"
                ? "bg-blue-500 text-white"
                : "text-gray-700"
            }`}
          >
            Account
          </button>

          <button
            onClick={() => setShowActivity(true)}
            className="px-6 py-2 rounded-full text-sm font-medium transition"
          >
            Ride Activity
          </button>
        </div>

        {/* 🔥 IMPORTANT: PUT ACTIVE TAB HERE */}
        {/* 🔥 ACTIVITY OVERLAY PANEL */}
        {showActivity && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* HEADER */}
            <div className="flex items-center gap-3 p-4 border-b">
              <button
                onClick={() => setShowActivity(false)}
                className="text-xl"
              >
                ←
              </button>
              <h2 className="text-lg font-semibold">Activity</h2>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {rideHistory.length === 0 ? (
                <p className="text-gray-500">No rides yet</p>
              ) : (
                Object.entries(
                  rideHistory.reduce((groups, ride) => {
                    const date = new Date(ride.createdAt).toDateString();
                    if (!groups[date]) groups[date] = [];
                    groups[date].push(ride);
                    return groups;
                  }, {}),
                ).map(([date, rides]) => (
                  <div key={date} className="mb-5">
                    {/* DATE */}
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                      {date}
                    </h3>

                    {/* RIDES */}
                    {rides.map((ride, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setPickup(ride.pickup);
                          setDestination(ride.destination);
                          setShowActivity(false); // close after select
                        }}
                        className="bg-gray-100 rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-200 transition"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{ride.pickup}</span>
                          <span className="text-green-600 font-semibold">
                            ₹{ride.fare}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 truncate">
                          → {ride.destination}
                        </p>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
