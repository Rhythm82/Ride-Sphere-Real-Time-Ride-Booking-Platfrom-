import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// 🔹 Distance helper (used for movement optimization)
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const LiveTracking = ({
  mode = "captain", // default
  ride,
  pickupCoords,
  destinationCoords,
}) => {
  const mapRef = useRef(null);

  const [driverLocation, setDriverLocation] = useState(null);
  const [directions, setDirections] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  // ================= DRIVER INITIAL LOCATION =================
  useEffect(() => {
    if (ride?.captain?.location?.coordinates) {
      setDriverLocation({
        lat: ride.captain.location.coordinates[1],
        lng: ride.captain.location.coordinates[0],
      });
    }
  }, [ride]);

  // ================= LIVE LOCATION TRACK =================
  useEffect(() => {
    if (!navigator.geolocation) return;

    let lastPosition = null;

    const watchId = navigator.geolocation.watchPosition((pos) => {
      const newPos = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      if (!lastPosition) {
        lastPosition = newPos;
        setDriverLocation(newPos);
        return;
      }

      const moved = getDistanceMeters(
        lastPosition.lat,
        lastPosition.lng,
        newPos.lat,
        newPos.lng,
      );

      if (moved > 10) {
        lastPosition = newPos;
        setDriverLocation(newPos);
      }
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ================= ROUTE LOGIC =================
  useEffect(() => {
    if (!isLoaded) return;

    const service = new window.google.maps.DirectionsService();

    // 🚕 DRIVER → PICKUP (USED BY BOTH waiting + captain)
    if (
      (mode === "waiting" || mode === "captain") &&
      driverLocation &&
      pickupCoords
    ) {
      service.route(
        {
          origin: driverLocation,
          destination: pickupCoords,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
          }
        },
      );
    }

    // 🚗 PICKUP → DESTINATION (RIDE STARTED)
    if (mode === "riding" && pickupCoords && destinationCoords) {
      service.route(
        {
          origin: pickupCoords,
          destination: destinationCoords,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
          }
        },
      );
    }
  }, [isLoaded, mode, driverLocation, pickupCoords, destinationCoords]);

  // ================= CENTER =================
  const center = driverLocation ||
    pickupCoords || {
      lat: 26.4775,
      lng: 89.5212,
    };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={(map) => (mapRef.current = map)}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      {/* 🚕 DRIVER MARKER (always show) */}
      {driverLocation && <Marker position={driverLocation} />}

      {/* 📍 PICKUP MARKER (always show if exists) */}
      {pickupCoords && (
        <Marker
          position={pickupCoords}
          icon="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
        />
      )}

      {/* 🎯 DESTINATION MARKER (only when riding) */}
      {mode === "riding" && destinationCoords && (
        <Marker
          position={destinationCoords}
          icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        />
      )}

      {/* 🛣️ ROUTE */}
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
};

export default LiveTracking;
