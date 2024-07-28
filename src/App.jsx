import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import Home from './pages/Home/Home';
import Profile from "./pages/Profile/Profile";
import Create from './pages/Create/Create';
import Join from './pages/Join/Join';
import GameHandler from './pages/GameHandler/GameHandler';
import LobbyClosed from "./pages/LobbyClosed/LobbyClosed";
import { AuthProvider } from "./context/AuthContext";
import ProtectedLayout from "./components/ProtectedLayout/ProtectedLayout";
import RedirectToHome from "./components/RedirectToHome/RedirectToHome";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route element={<ProtectedLayout />}>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/profile" element={<Profile />} />
            <Route path="/create" element={<Create />} />
            <Route path="/join" element={<Join />} />
            <Route path="/game/:gameCode" element={<GameHandler />} />
            <Route path="/no-lobby" element={<LobbyClosed />} />
          </Route>
          <Route path="*" element={<RedirectToHome />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;