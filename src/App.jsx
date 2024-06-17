import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Home from './pages/Home/Home';
import Create from './pages/Create/Create';
import RedirectToHome from "./components/RedirectToHome/RedirectToHome";
import Game from "./pages/Game/Game";

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/join" element={<RedirectToHome />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </Router>
  )
}

export default App