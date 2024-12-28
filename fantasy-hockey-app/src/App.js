import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Games from './pages/Games';
import LineupBuilder from './pages/LineupBuilder';
import MyTeam from './pages/MyTeam';
import GameDetails from './pages/GameDetails';
import DailyLineup from './pages/DailyLineup';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Games />} />
          <Route path="/game/:id" element={<GameDetails />} />
          <Route path="/lineup" element={<LineupBuilder />} />
          <Route path="/myteam" element={<MyTeam />} />
          <Route path="/daily-lineup" element={<DailyLineup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
