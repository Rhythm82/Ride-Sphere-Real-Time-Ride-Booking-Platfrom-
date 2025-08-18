import React, { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import Start from "./pages/Start.jsx";
import Home from "./pages/User/Home.jsx";
import UserLogin from "./pages/User/UserLogin.jsx";
import UserSignup from "./pages/User/UserSignup.jsx";
import UserLogout from "./pages/User/UserLogout.jsx";
import UserProtectWrapper from "./pages/User/UserProtectWrapper.jsx";

import CaptainLogin from "./pages/Captain/CaptainLogin.jsx";
import CaptainSignup from "./pages/Captain/CaptainSignup.jsx";
import CaptainHome from "./pages/Captain/CaptainHome.jsx";
import CaptainLogout from "./pages/Captain/CaptainLogout.jsx";
import CaptainProtectWrapper from "./pages/Captain/CaptainProtectWrapper.jsx";
import Riding from "./pages/User/Riding.jsx";
import CaptainRiding from "./pages/Captain/CaptainRiding.jsx";
const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<UserSignup />} />
        <Route path="/captain/login" element={<CaptainLogin />} />
        <Route path="/captain/signup" element={<CaptainSignup />} />
        <Route
          path="/home"
          element={
            <UserProtectWrapper>
              <Home />
            </UserProtectWrapper>
          }
        />
        <Route path="/riding" element={<Riding />} />
        <Route
          path="/logout"
          element={
            <UserProtectWrapper>
              <UserLogout />
            </UserProtectWrapper>
          }
        />

        <Route
          path="/captain/home"
          element={
            <CaptainProtectWrapper>
              <CaptainHome />
            </CaptainProtectWrapper>
          }
        />

        <Route path="/captain/riding" element={<CaptainRiding />} />

        <Route
          path="/captain/logout"
          element={
            <CaptainProtectWrapper>
              <CaptainLogout />
            </CaptainProtectWrapper>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
