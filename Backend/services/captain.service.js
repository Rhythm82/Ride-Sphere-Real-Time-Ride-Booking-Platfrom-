const captainModel = require("../Models/captain.model.js");

module.exports.createCaptain = async ({
  firstname,
  lastname,
  email,
  password,
  phone,
  licenseNumber,
  profileImage,

  vehicleName,
  vehicleModel,
  color,
  plate,
  capacity,
  vehicleType,
  vehicleImage,
}) => {
  // 🔥 Required fields (minimal safe validation)
  if (
    !firstname ||
    !email ||
    !password ||
    !color ||
    !plate ||
    !capacity ||
    !vehicleType
  ) {
    throw new Error("Required fields missing");
  }

  const captain = await captainModel.create({
    fullname: {
      firstname,
      lastname,
    },

    email,
    password,

    // 🆕 optional fields (won’t break old frontend)
    phone: phone || "0000000000",
    licenseNumber: licenseNumber || "TEMP_LICENSE",
    profileImage: profileImage || "",

    vehicle: {
      name: vehicleName || "Unknown Car",
      model: vehicleModel || "",
      color,
      plate,
      capacity,
      vehicleType,
      vehicleImage: vehicleImage || "",
    },

    // stats auto default (no need to pass)
  });

  return captain;
};