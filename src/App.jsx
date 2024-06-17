import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import Home from './pages/Home/Home';
import Create from './pages/Create/Create';
import RedirectToHome from "./components/RedirectToHome/RedirectToHome";

function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        <Route path="/join" element={<RedirectToHome />} />
      </Routes>
    </Router>
  )
}

export default App