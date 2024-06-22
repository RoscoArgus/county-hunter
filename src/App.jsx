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
import Lobby from './pages/Lobby/Lobby';
import Join from './pages/Join/Join';

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/join" element={<Join />} />
        <Route path="/game" element={<Game />} />
        <Route path="/lobby/:gameCode" element={<Lobby />} />
        <Route path="*" element={<RedirectToHome />} />
      </Routes>
    </Router>
  )
}

export default App;