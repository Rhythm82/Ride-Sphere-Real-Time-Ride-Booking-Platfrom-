import React, { useContext } from "react";
import { CaptainDataContext } from "../context/CaptainContext.jsx";

const CaptainDetails = () => {
  const { captain } = useContext(CaptainDataContext);

  if (!captain || !captain.fullname) {
    return <div>Loading...</div>; 
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start gap-3">
          <img
            className="h-10 w-10 rounded-full object-cover"
            src="https://cdn-icons-png.freepik.com/512/8583/8583437.png"
            alt=""
          />
          <h4 className="text-lg font-medium capitalize">
            {captain?.fullname?.firstname} {captain?.fullname?.lastname}
          </h4>
        </div>
        <div>
          <h4 className="text-xl font-semibold">₹720</h4>
          <p className="text-sm text-gray-600">Earned</p>
        </div>
      </div>
      <div className="flex p-3 mt-8 bg-gray-100 rounded-xl justify-center gap-5 items-start">
        <div className="text-center">
          <i className="text-3xl mb-2 font-thin ri-timer-2-line"></i>
          <h5 className="text-lg font-medium">5.7</h5>
          <p className="text-sm text-gray-600">Hours Online</p>
        </div>
      </div>
    </div>
  );
};

export default CaptainDetails;
