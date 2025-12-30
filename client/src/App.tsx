import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import Verify from "./components/pages/Verify";
import VerifyOtp from "./components/pages/VerifyOtp";
import Loading from "./Loading";

import { useAppData } from "./context/AppContext";

const App = () => {
  const { isAuth, loading } = useAppData();
  console.log({ loading, isAuth });

  if (loading) {
    return <Loading />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuth ? <Home /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/token/:token" element={<Verify />} />
        <Route
          path="/verify-otp"
          element={isAuth ? <VerifyOtp /> : <Login />}
        />
      </Routes>

      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
