import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CaptainDataContext } from "../../context/CaptainContext.jsx";
import axios from "axios";

const CaptainSignup = () => {
const navigate = useNavigate();
const { setCaptain } = useContext(CaptainDataContext);

const [form, setForm] = useState({
firstName: "",
lastName: "",
email: "",
password: "",
phone: "",
license: "",
vehicleColor: "",
vehiclePlate: "",
vehicleCapacity: "",
vehicleType: "",
vehicleModel: ""
});

const handleChange = (e) => {
setForm({ ...form, [e.target.name]: e.target.value });
};

const submitHandler = async (e) => {
e.preventDefault();

 
const captainData = {
  fullname: {
    firstname: form.firstName,
    lastname: form.lastName,
  },
  email: form.email,
  password: form.password,

  phone: form.phone,
  licenseNumber: form.license,

  vehicle: {
    name: form.vehicleModel,        // 🔥 IMPORTANT
    model: form.vehicleModel,       // 🔥 IMPORTANT
    color: form.vehicleColor,
    plate: form.vehiclePlate,
    capacity: form.vehicleCapacity,
    vehicleType: form.vehicleType,
  },
};

try {
  const res = await axios.post(
    `${import.meta.env.VITE_BASE_URL}/captain/register`,
    captainData
  );

  if (res.status === 201) {
    setCaptain(res.data.captain);
    localStorage.setItem("captainToken", res.data.token);
    navigate("/captain/home");
  }
} catch (err) {
  console.log(err);
  alert("Signup failed");
}
 

};

return ( <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-white to-gray-100">

 
  <div className="w-[95%] max-w-md backdrop-blur-xl bg-white/60 shadow-2xl rounded-2xl p-6 border border-white/40">

    <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
      Ride<span className="text-blue-600">Sphere</span>
    </h1>

    <p className="text-center text-gray-500 text-sm mb-6">
      Become a driver partner 🚗
    </p>

    <form onSubmit={submitHandler} className="space-y-4">

      <div className="flex gap-3">
        <input
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          placeholder="First Name"
          className="input"
          required
        />
        <input
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          placeholder="Last Name"
          className="input"
          required
        />
      </div>

      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="input"
        required
      />

      <input
        name="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Password"
        type="password"
        className="input"
        required
      />

      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Phone Number"
        className="input"
      />

      <input
        name="license"
        value={form.license}
        onChange={handleChange}
        placeholder="Driving License Number"
        className="input"
      />

      <div className="flex gap-3">
        <input
          name="vehicleColor"
          value={form.vehicleColor}
          onChange={handleChange}
          placeholder="Color"
          className="input"
          required
        />
        <input
          name="vehiclePlate"
          value={form.vehiclePlate}
          onChange={handleChange}
          placeholder="Plate"
          className="input"
          required
        />
      </div>

      <div className="flex gap-3">
        <input
          name="vehicleCapacity"
          value={form.vehicleCapacity}
          onChange={handleChange}
          placeholder="Capacity"
          type="number"
          className="input"
          required
        />

        <select
          name="vehicleType"
          value={form.vehicleType}
          onChange={handleChange}
          className="input"
          required
        >
          <option value="">Type</option>
          <option value="car">Car</option>
          <option value="auto">Auto</option>
          <option value="motorcycle">Bike</option>
        </select>
      </div>

      <input
        name="vehicleModel"
        value={form.vehicleModel}
        onChange={handleChange}
        placeholder="Car Model (e.g. Swift, Alto)"
        className="input"
      />

      <button className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-900 transition">
        Create Account
      </button>
    </form>

    <p className="text-center mt-4 text-sm">
      Already have account?{" "}
      <Link to="/captain/login" className="text-blue-600">
        Login
      </Link>
    </p>

    <div className="text-[11px] text-gray-500 mt-6 space-y-1">
      <p>• Please enter valid driving license</p>
      <p>• Vehicle must be registered</p>
      <p>• Your profile will be verified before activation</p>
    </div>

  </div>

  <style>{`
    .input {
      width: 100%;
      padding: 10px;
      border-radius: 10px;
      background: rgba(255,255,255,0.6);
      border: 1px solid rgba(0,0,0,0.1);
      outline: none;
    }
  `}</style>
</div>
 

);
};

export default CaptainSignup;
