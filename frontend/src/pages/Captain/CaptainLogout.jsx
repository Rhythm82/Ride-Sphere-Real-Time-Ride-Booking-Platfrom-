import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CaptainLogout = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  try {
    axios
      .get(`http://localhost:8080/captain/logout`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        if (res.status === 200) {
          localStorage.removeItem("token");
          navigate("/captain/login");
        }
      });
  } catch (error) {}
  return (
    <div>
      CaptainLogout 
    </div>
  );
};

export default CaptainLogout;
