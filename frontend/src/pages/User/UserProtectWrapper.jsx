import React, { useContext, useEffect, useState } from "react";
import { UserDataContext } from "../../context/UserContext.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserProtectWrapper = ({ children }) => {
  const token = localStorage.getItem("userToken");
  const navigate = useNavigate();
  const { setUser } = useContext(UserDataContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/user/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("✅ USER LOADED:", res.data);

        setUser(res.data); // ⚠️ IMPORTANT
        setLoading(false);
      } catch (err) {
        console.log("❌ USER LOAD ERROR:", err);
        localStorage.removeItem("userToken");
        navigate("/login");
      }
    };

    fetchUser();
  }, [token]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
};

export default UserProtectWrapper;
