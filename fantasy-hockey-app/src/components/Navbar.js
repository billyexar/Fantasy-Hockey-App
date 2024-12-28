import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="nav-bar">
      <Link to="/">Games</Link>
      <Link to="/myteam">My Team</Link>
      <Link to="/lineup">Build Lineup</Link>
      <Link to="/daily-lineup">Daily Lineup</Link>
    </nav>
  );
}

export default Navbar; 