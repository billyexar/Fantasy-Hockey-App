import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LineupBuilder.css';

function LineupBuilder() {
  const [budget, setBudget] = useState(200);
  const [lineup, setLineup] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const LINEUP_LIMITS = {
    F: 3,  // Forwards
    D: 2,  // Defensemen
    G: 1   // Goalies
  };

  // Helper function to map NHL API position codes to our categories
  const mapPosition = (apiPosition) => {
    const positionMap = {
      'L': 'F',
      'R': 'F',
      'C': 'F',
      'D': 'D',
      'G': 'G'
    };
    return positionMap[apiPosition] || apiPosition;
  };

  // Display original position in cards
  const displayPosition = (apiPosition) => {
    const positionMap = {
      'L': 'LW',
      'R': 'RW',
      'C': 'C',
      'D': 'D',
      'G': 'G'
    };
    return positionMap[apiPosition] || apiPosition;
  };

  const positions = ['ALL', 'F', 'D', 'G'];

  const getPositionCount = (pos) => {
    return lineup.filter(player => mapPosition(player.position) === pos).length;
  };

  const canAddPosition = (position) => {
    const mappedPosition = mapPosition(position);
    return getPositionCount(mappedPosition) < LINEUP_LIMITS[mappedPosition];
  };

  const addPlayerToLineup = (player) => {
    if (budget >= player.price && 
        !lineup.find(p => p.id === player.id) && 
        canAddPosition(player.position)) {
      setLineup([...lineup, player]);
      setBudget(budget - player.price);
    }
  };

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        
        // Check if we have cached data and it's less than 1 hour old
        const cachedData = localStorage.getItem('playerStats');
        const cachedTimestamp = localStorage.getItem('playerStatsTimestamp');
        const ONE_HOUR = 60 * 60 * 1000; // in milliseconds

        if (cachedData && cachedTimestamp) {
          const isDataFresh = (Date.now() - parseInt(cachedTimestamp)) < ONE_HOUR;
          
          if (isDataFresh) {
            setAvailablePlayers(JSON.parse(cachedData));
            setLoading(false);
            return;
          }
        }

        // If no cache or cache is old, fetch new data
        const response = await fetch(`${API_URL}/api/players`);
        const data = await response.json();
        
        // Cache the new data
        localStorage.setItem('playerStats', JSON.stringify(data));
        localStorage.setItem('playerStatsTimestamp', Date.now().toString());
        
        setAvailablePlayers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('Failed to load players');
        
        // If fetch fails, try to use cached data even if it's old
        const cachedData = localStorage.getItem('playerStats');
        if (cachedData) {
          setAvailablePlayers(JSON.parse(cachedData));
          setError('Using cached data - some information may be outdated');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const teams = ['ALL', ...new Set(availablePlayers.map(player => player.team))].sort();

  const filteredPlayers = availablePlayers
    .filter(player => selectedTeam === 'ALL' || player.team === selectedTeam)
    .filter(player => {
      if (selectedPosition === 'ALL') return true;
      return mapPosition(player.position) === selectedPosition;
    })
    .filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const removePlayerFromLineup = (player) => {
    setLineup(lineup.filter(p => p.id !== player.id));
    setBudget(budget + player.price);
  };

  const calculateTotalPoints = () => {
    return lineup.reduce((total, player) => total + player.stats.points, 0);
  };

  const renderPlayerStats = (player) => {
    if (player.position === 'G') {
      return (
        <div className="player-stats goalie-stats">
          <div className="stat">
            <span className="stat-value">{player.stats.wins}-{player.stats.losses}-{player.stats.otLosses}</span>
            <span className="stat-label">Record</span>
          </div>
          <div className="stat">
            <span className="stat-value">{player.stats.savePercentage}</span>
            <span className="stat-label">SV%</span>
          </div>
          <div className="stat">
            <span className="stat-value">{player.stats.goalsAgainstAvg}</span>
            <span className="stat-label">GAA</span>
          </div>
          <div className="stat">
            <span className="stat-value">{player.stats.shutouts}</span>
            <span className="stat-label">SO</span>
          </div>
        </div>
      );
    }

    return (
      <div className="player-stats">
        <div className="stat">
          <span className="stat-value">{player.stats.goals}</span>
          <span className="stat-label">Goals</span>
        </div>
        <div className="stat">
          <span className="stat-value">{player.stats.assists}</span>
          <span className="stat-label">Assists</span>
        </div>
        <div className="stat">
          <span className="stat-value">{player.stats.points}</span>
          <span className="stat-label">Points</span>
        </div>
        <div className="stat">
          <span className="stat-value">{player.stats.gamesPlayed}</span>
          <span className="stat-label">GP</span>
        </div>
      </div>
    );
  };

  const saveLineup = () => {
    // Save lineup to localStorage
    const lineupData = {
      players: lineup,
      totalBudget: 200,
      remainingBudget: budget,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('savedLineup', JSON.stringify(lineupData));
    navigate('/myteam');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-animation">
            <i className="fas fa-hockey-puck"></i>
          </div>
          <h2>Loading Players</h2>
          <p>Getting the latest NHL player stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <i className="fas fa-exclamation-circle"></i>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lineup-builder">
      <div className="lineup-header">
        <h1>Fantasy Lineup Builder</h1>
        <div className="header-controls">
          <div className="budget-display">
            <div className="budget-label">Remaining Budget</div>
            <div className="budget-amount">${budget}</div>
          </div>
          <button 
            className="save-lineup-button"
            onClick={saveLineup}
            disabled={lineup.length < 6} // 3F + 2D + 1G
          >
            Set Lineup
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="available-players">
          <div className="filters">
            <h2>Available Players</h2>
            <div className="filter-controls">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="filter-select"
              >
                {teams.map(team => (
                  <option key={team} value={team}>
                    {team === 'ALL' ? 'All Teams' : team}
                  </option>
                ))}
              </select>

              <select 
                value={selectedPosition} 
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="filter-select"
              >
                {positions.map(position => (
                  <option key={position} value={position}>
                    {position === 'ALL' ? 'All Positions' : 
                     position === 'F' ? 'Forwards' :
                     position === 'D' ? 'Defensemen' : 'Goalies'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="players-grid">
            {filteredPlayers.map(player => (
              <div key={player.id} className="player-card">
                <div className="player-header">
                  <span className="player-position">{displayPosition(player.position)}</span>
                  <span className="player-price">${player.price}</span>
                </div>
                <div className="player-name">{player.name}</div>
                <div className="player-team">{player.team}</div>
                {renderPlayerStats(player)}
                <button 
                  className="add-button"
                  onClick={() => addPlayerToLineup(player)}
                  disabled={budget < player.price || lineup.find(p => p.id === player.id)}
                >
                  Add to Lineup
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="selected-lineup">
          <div className="lineup-summary">
            <h2>Your Lineup</h2>
            <div className="lineup-stats">
              <div className="position-count">
                <span className="count-value">{getPositionCount('F')}/3</span>
                <span className="count-label">Forwards</span>
              </div>
              <div className="position-count">
                <span className="count-value">{getPositionCount('D')}/2</span>
                <span className="count-label">Defensemen</span>
              </div>
              <div className="position-count">
                <span className="count-value">{getPositionCount('G')}/1</span>
                <span className="count-label">Goalies</span>
              </div>
            </div>
          </div>
          <div className="selected-players">
            {lineup.map(player => (
              <div key={player.id} className="selected-player-card">
                <div className="player-info">
                  <div className="player-header">
                    <span className="player-position">{displayPosition(player.position)}</span>
                    <span className="player-name">{player.name}</span>
                    <span className="player-price">${player.price}</span>
                  </div>
                  <div className="player-team">{player.team}</div>
                </div>
                <div className="content-wrapper">
                  {renderPlayerStats(player)}
                  <button 
                    className="remove-button"
                    onClick={() => removePlayerFromLineup(player)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LineupBuilder;
