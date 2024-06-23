import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Home from './pages/Home/Home';
import Create from './pages/Create/Create';
import Join from './pages/Join/Join';
import GameHandler from './pages/GameHandler/GameHandler';
import { UsernameProvider } from "./context/UsernameContext";
import ProtectedLayout from "./components/ProtectedLayout/ProtectedLayout";
import RedirectToHome from "./components/RedirectToHome/RedirectToHome";

function App() {
  return (
    <UsernameProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route exact path="/" element={<Home />} />
            <Route path="/create" element={<Create />} />
            <Route path="/join" element={<Join />} />
            <Route path="/game/:gameCode" element={<GameHandler />} />
          </Route>
          <Route path="*" element={<RedirectToHome />} />
        </Routes>
      </Router>
    </UsernameProvider>
  );
}

export default App;