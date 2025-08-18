import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";

const UserLogout = () => {
  const token = localStorage.getItem("token");
  const navigate=useNavigate()
  try {
    axios.get(`${import.meta.env.VITE_BASE_URL}/user/logout`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res)=>{
        if (res.status===200) {
            localStorage.removeItem('token')
            navigate('/login')
        }
    })
  } catch (error) {}
  return (
    <div>UserLogout</div>
  );
};

export default UserLogout;
