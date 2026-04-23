import React from "react";

const VehiclePanel = (props) => {
  const VehicleCard = ({ type, title, capacity, description, image, fare }) => (
    <div
      onClick={() => {
        props.setConfirmRidePanel(true);
        props.selectVehicle(type);
      }}
      className="flex items-center justify-between p-4 mb-3 rounded-2xl 
      bg-white/70 backdrop-blur-lg border border-white/30 shadow-md 
      hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 cursor-pointer"
    >
      {/* IMAGE */}
      <img className="h-12 w-16 object-contain" src={image} alt={title} />

      {/* DETAILS */}
      <div className="flex-1 ml-3">
        <h4 className="font-semibold text-base">
          {title}{" "}
          <span className="text-sm text-gray-600">
            <i className="ri-user-3-fill"></i> {capacity}
          </span>
        </h4>

        <p className="text-xs text-gray-500">{description}</p>
      </div>

      {/* PRICE */}
      <h2 className="text-lg font-bold text-blue-600">₹{fare || "--"}</h2>
    </div>
  );

  return (
    <div className="relative">
      {/* CLOSE */}
      <h5
        className="text-center mb-2"
        onClick={() => props.setVehiclePanel(false)}
      >
        <i className="text-3xl text-gray-400 ri-arrow-down-wide-line"></i>
      </h5>

      <h3 className="text-xl font-semibold mb-4 text-center">
        Choose your ride
      </h3>

      {/* CAR */}
      <VehicleCard
        type="car"
        title="Car"
        capacity={3}
        description="Affordable, comfortable and compact rides"
        image="https://tse1.mm.bing.net/th/id/OIP.ejYfigA6l3yHmUvFS4Tg1AHaFt?pid=ImgDet&w=203&h=156&c=7&o=7&rm=3"
        fare={props.fare?.car}
      />

      {/* MOTORCYCLE (FIXED) */}
      <VehicleCard
        type="motorcycle"
        title="Bike"
        capacity={1}
        description="Quick bike rides"
        image="https://th.bing.com/th/id/OIP.laqBbHMsdyIw5cLqgUNDVQHaFF?w=291&h=200&c=7&r=0&o=7&pid=1.7&rm=3"
        fare={props.fare?.motorcycle} // 🔥 FIX HERE
      />

      {/* AUTO */}
      <VehicleCard
        type="auto"
        title="Auto"
        capacity={3}
        description="Affordable auto rides"
        image="https://cdn.dribbble.com/users/1845565/screenshots/6414076/000.gif"
        fare={props.fare?.auto}
      />

      {/* NOTE */}
      <p className="text-center text-xs text-gray-400 mt-3">
        Driver will arrive shortly after booking 🚗
      </p>
    </div>
  );
};

export default VehiclePanel;
