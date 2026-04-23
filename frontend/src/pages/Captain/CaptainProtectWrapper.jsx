import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaptainDataContext } from "../../context/CaptainContext";
import axios from "axios";

const CaptainProtectWrapper = ({ children }) => {
  const token = localStorage.getItem("captainToken");
  const navigate = useNavigate();
  const { captain, setCaptain } = useContext(CaptainDataContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/captain/login");
      return; // 🔥 IMPORTANT
    }

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/captain/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCaptain(res.data.captain);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log("Auth error:", err);
        localStorage.removeItem("captainToken");
        navigate("/captain/login");
      });
  }, [token]);

  if (isLoading) return <div>Loading...</div>;

  return children;
};

export default CaptainProtectWrapper;
