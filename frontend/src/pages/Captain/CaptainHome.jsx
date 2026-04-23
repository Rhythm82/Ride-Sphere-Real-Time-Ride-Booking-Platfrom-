import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CaptainDataContext } from "../../context/CaptainContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import RidePopUp from "../../components/RidePopUp.jsx";
import LiveTracking from "../../components/LiveTracking.jsx";
import axios from "axios";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const CaptainHome = () => {
  const navigate = useNavigate();

  const { captain } = useContext(CaptainDataContext);
  const socket = useSocket();

  const [ride, setRide] = useState(null);
  const [ridePopupPanel, setRidePopupPanel] = useState(false);

  const [view, setView] = useState("account");
  const [ridesHistory, setRidesHistory] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);

  const [hoursOnline, setHoursOnline] = useState(0);

  const ridePopupPanelRef = useRef(null);

  // ================= LOCATION =================
  useEffect(() => {
    if (!captain?._id) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      socket.emit("join", {
        userId: captain._id,
        userType: "captain",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        socket.emit("update-location-captain", {
          captainId: captain._id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [captain]);

  // ================= TIMER =================
  useEffect(() => {
    const start = Date.now();

    const interval = setInterval(() => {
      const diff = Date.now() - start;
      setHoursOnline((diff / (1000 * 60 * 60)).toFixed(1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ================= SOCKET =================
  useEffect(() => {
    socket.on("new-ride", (data) => {
      setRide(data);
      setRidePopupPanel(true);
    });

    socket.on("ride-started", (data) => {
      navigate("/captain/riding", { state: { ride: data } });
    });

    return () => {
      socket.off("new-ride");
      socket.off("ride-started");
    };
  }, []);

  // ================= FETCH HISTORY =================
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/captain/rides`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("captainToken")}`,
            },
          },
        );

        setRidesHistory(res.data);
        setFilteredRides(res.data);
      } catch (err) {
        console.log(err);
      }
    }

    fetchHistory();
  }, []);

  // ================= FILTER =================
  const filterByDate = (date) => {
    if (!date) {
      setFilteredRides(ridesHistory);
      return;
    }

    const filtered = ridesHistory.filter((r) => {
      const rideDate = new Date(r.createdAt).toDateString();
      return rideDate === new Date(date).toDateString();
    });

    setFilteredRides(filtered);
  };

  // ================= CONFIRM RIDE =================
  async function confirmRide() {
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
        { rideId: ride._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("captainToken")}`,
          },
        },
      );

      setRidePopupPanel(false);

      // 🚀 REDIRECT TO WAITING SCREEN
      navigate("/captain/waiting", { state: { ride } });
    } catch (err) {
      console.log(err);
    }
  }

  // ================= ANIMATION =================
  useGSAP(() => {
    gsap.to(ridePopupPanelRef.current, {
      transform: ridePopupPanel ? "translateY(0)" : "translateY(100%)",
    });
  }, [ridePopupPanel]);

  // ================= TOTAL EARNINGS =================
  const totalEarnings = filteredRides.reduce((sum, r) => sum + r.fare, 0);

  return (
    <div className="h-screen flex flex-col">
      {/* HEADER */}
      <div className="fixed top-0 left-0 w-full z-20 backdrop-blur-xl bg-white/40 border-b border-white/20 px-5 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">RideSphere </h1>
        <Link to="/captain/logout">
          {" "}
          <h2 className="">Logout</h2>
        </Link>
      </div>

      {/* MAP (ONLY ACCOUNT VIEW) */}
      {view === "account" && (
        <div className="h-3/5">
          <LiveTracking mode="captain" />
        </div>
      )}

      {/* PANEL */}
      <div className="flex-1 bg-white rounded-t-3xl p-5 shadow-xl mt-10">
        {/* TOGGLE */}
        <div className="flex bg-gray-200 rounded-full p-1 mb-4">
          <button
            onClick={() => setView("account")}
            className={`flex-1 py-2 rounded-full ${
              view === "account" ? "bg-blue-500 text-white" : ""
            }`}
          >
            Account
          </button>

          <button
            onClick={() => setView("history")}
            className={`flex-1 py-2 rounded-full ${
              view === "history" ? "bg-blue-500 text-white" : ""
            }`}
          >
            History
          </button>
        </div>

        {/* ACCOUNT */}
        {view === "account" && (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img
                  src={captain?.profileImage || "https://cdn-icons-png.freepik.com/512/8583/8583437.png"}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h2 className="font-semibold">
                    {captain?.fullname?.firstname}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {captain?.vehicle?.model}
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-green-600">
                ₹{captain?.stats?.totalEarnings}
              </h2>
            </div>

            <div className="mt-5 bg-gray-100 p-4 rounded-xl text-center">
              <h3 className="text-2xl font-bold">{hoursOnline}</h3>
              <p className="text-gray-500">Hours Online</p>
            </div>
          </>
        )}

        {/* HISTORY */}
        {view === "history" && (
          <div className="overflow-y-auto h-full">
            {/* TOTAL */}
            <h2 className="text-xl font-bold mb-3">Total ₹{totalEarnings}</h2>

            {/* FILTER */}
            <input
              type="date"
              className="border p-2 rounded mb-3 w-full"
              onChange={(e) => filterByDate(e.target.value)}
            />

            {/* LIST */}
            {filteredRides.map((r) => (
              <div
                key={r._id}
                className="p-3 border rounded-lg mb-2 flex justify-between"
              >
                <div>
                  <p>{r.destination}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <p className="font-semibold text-green-600">₹{r.fare}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POPUPS */}
      <div
        ref={ridePopupPanelRef}
        className="fixed bottom-0 w-full bg-white translate-y-full z-50"
      >
        <RidePopUp
          ride={ride}
          confirmRide={confirmRide}
          setRidePopupPanel={setRidePopupPanel}
        />
      </div>
    </div>
  );
};

export default CaptainHome;
