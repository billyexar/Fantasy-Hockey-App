import { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import '../styles/DailyLineup.css';

function DailyLineup() {
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState({
    F1: null, F2: null, F3: null, F4: null, F5: null,
    D1: null, D2: null, D3: null,
    G1: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date());
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [gamesData, setGamesData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const normalizePosition = (position) => {
    switch (position) {
      case 'L':
        return 'LW';
      case 'R':
        return 'RW';
      default:
        return position;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const formattedDate = format(date, 'yyyy-MM-dd');
        
        // Fetch both games data and players
        const [gamesResponse, playersResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/games?date=${formattedDate}`),
          fetch(`http://localhost:5000/api/daily-players?date=${formattedDate}`)
        ]);

        const gamesData = await gamesResponse.json();
        const playersData = await playersResponse.json();
        
        setGamesData(gamesData);
        setAvailablePlayers(playersData.players || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  const handleGameDayClick = (dayDate) => {
    if (dayDate) {
      const newDate = new Date(dayDate + 'T12:00:00');
      setDate(newDate);
    }
  };

  const openPlayerSelection = (position, slot) => {
    setSelectedPosition(position);
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handlePlayerSelect = (player) => {
    if (selectedSlot) {
      setSelectedPlayers(prev => ({
        ...prev,
        [selectedSlot]: player
      }));
      setShowModal(false);
    }
  };

  const handleSaveLineup = async () => {
    // Check if lineup is complete
    const isLineupComplete = Object.values(selectedPlayers).every(player => player !== null);
    
    if (!isLineupComplete) {
      setSaveMessage('Please fill all lineup positions before saving');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('http://localhost:5000/api/lineups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(date, 'yyyy-MM-dd'),
          players: selectedPlayers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save lineup');
      }

      setSaveMessage('Lineup saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving lineup:', error);
      setSaveMessage('Failed to save lineup');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const PlayerSelectionModal = () => {
    const teams = useMemo(() => {
      const teamSet = new Set(availablePlayers.map(player => player.team));
      return [
        'All Teams',
        ...Array.from(teamSet)
      ].sort((a, b) => {
        if (a === 'All Teams') return -1;
        if (b === 'All Teams') return 1;
        return a.localeCompare(b);
      });
    }, [availablePlayers]);

    if (!showModal) return null;

    const formatGameTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

    const filteredPlayers = availablePlayers
      .filter(player => {
        const playerPosition = normalizePosition(player.position);
        
        const isPlayerSelected = Object.values(selectedPlayers).some(
          selectedPlayer => selectedPlayer && selectedPlayer.id === player.id
        );
        
        const matchesPosition = selectedPosition === 'F' 
          ? ['C', 'LW', 'RW'].includes(playerPosition)
          : playerPosition === selectedPosition;
        
        const matchesTeam = selectedTeam === 'All Teams' || player.team === selectedTeam;
        
        const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesPosition && matchesTeam && matchesSearch && !isPlayerSelected;
      })
      // Sort players by points in descending order
      .sort((a, b) => {
        // Handle cases where points might be undefined
        const pointsA = a.points || 0;
        const pointsB = b.points || 0;
        return pointsB - pointsA;
      });

    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Select {selectedPosition}</h2>
            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
          </div>

          <div className="filters">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="team-filter">
              <select 
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                {teams.map(team => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-players">
            {filteredPlayers.length === 0 ? (
              <div className="no-players">No players found</div>
            ) : (
              filteredPlayers.map(player => (
                <div 
                  key={player.id} 
                  className="player-card"
                  onClick={() => handlePlayerSelect(player)}
                >
                  <img src={player.headshot} alt={player.name} className="player-headshot" />
                  <div className="player-info">
                    <div className="player-header">
                      <div className="name-position">
                        <h3>{player.name}</h3>
                        <span className="position-tag">{normalizePosition(player.position)}</span>
                      </div>
                      <span className="team-tag">{player.team}</span>
                    </div>
                    <div className="player-stats">
                      <div className="stat-item">
                        <span className="stat-value">{player.goals}</span>
                        <span className="stat-label">G</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{player.assists}</span>
                        <span className="stat-label">A</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{player.points}</span>
                        <span className="stat-label">P</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const EmptyPlayerCard = ({ position, slot }) => (
    <div 
      className="empty-player-card"
      onClick={() => openPlayerSelection(position, slot)}
    >
      <div className="empty-player-content">
        <span className="position-label">{position}</span>
        <span className="add-player">+</span>
      </div>
    </div>
  );

  const PlayerCard = ({ player, position, slot }) => {
    const calculateFantasyPoints = (stats, position) => {
      if (!stats) return 0;
      
      if (position === 'G') {
        const SCORING = {
          SAVE: 0.2,
          WIN: 4,
          OTL: 1
        };
        
        return (
          (stats.saves || 0) * SCORING.SAVE +
          (stats.wins || 0) * SCORING.WIN +
          (stats.otLosses || 0) * SCORING.OTL
        );
      } else {
        const SCORING = {
          GOAL: 3,
          ASSIST: 2,
          PIM: 0.2,
          HIT: 0.2,
          BLOCKED: 0.5
        };
        
        return (
          (stats.goals || 0) * SCORING.GOAL +
          (stats.assists || 0) * SCORING.ASSIST +
          (stats.pim || 0) * SCORING.PIM +
          (stats.hits || 0) * SCORING.HIT +
          (stats.blocked || 0) * SCORING.BLOCKED
        );
      }
    };

    const renderStats = () => {
      if (!player.gameStats) return null;
      
      if (position === 'G') {
        return (
          <div className="player-stats">
            <div className="stat-item">
              <span className="stat-value">{player.gameStats.saves || 0}</span>
              <span className="stat-label">SV</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{player.gameStats.goalsAgainst || 0}</span>
              <span className="stat-label">GA</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{player.gameStats.savePercentage || '.000'}</span>
              <span className="stat-label">SV%</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{calculateFantasyPoints(player.gameStats, position).toFixed(1)}</span>
              <span className="stat-label">FP</span>
            </div>
          </div>
        );
      }
      
      return (
        <div className="player-stats">
          <div className="stat-item">
            <span className="stat-value">{player.gameStats.goals || 0}</span>
            <span className="stat-label">G</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{player.gameStats.assists || 0}</span>
            <span className="stat-label">A</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{calculateFantasyPoints(player.gameStats, position).toFixed(1)}</span>
            <span className="stat-label">FP</span>
          </div>
        </div>
      );
    };

    return (
      <div className="filled-player-card">
        <img src={player.headshot} alt={player.name} className="player-headshot" />
        <div className="player-info">
          <h3>{player.name}</h3>
          <p className="team">{player.team}</p>
          <div className="game-info">
            <p>{player.isHome ? 'vs' : '@'} {player.opponent}</p>
            {player.gameStatus && <p className="game-status">{player.gameStatus}</p>}
          </div>
          {renderStats()}
        </div>
      </div>
    );
  };

  const BoxScore = ({ gameData }) => {
    if (!gameData) return null;

    const { homeTeam, awayTeam, clock, periodDescriptor } = gameData;

    return (
      <div className="boxscore">
        <div className="game-header">
          <div className="period-info">
            <span className="period">Period {periodDescriptor.number}</span>
            <span className="time">{clock.timeRemaining}</span>
          </div>
        </div>
        
        <div className="teams-container">
          <div className="team away">
            <img src={awayTeam.logo} alt={awayTeam.placeName.default} className="team-logo" />
            <div className="team-info">
              <h3>{awayTeam.placeName.default}</h3>
              <div className="team-stats">
                <div className="stat">
                  <span className="stat-value">{awayTeam.score}</span>
                  <span className="stat-label">Goals</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{awayTeam.sog}</span>
                  <span className="stat-label">Shots</span>
                </div>
              </div>
            </div>
          </div>

          <div className="game-status">
            {gameData.gameState === 'LIVE' && (
              <div className="live-indicator">LIVE</div>
            )}
          </div>

          <div className="team home">
            <img src={homeTeam.logo} alt={homeTeam.placeName.default} className="team-logo" />
            <div className="team-info">
              <h3>{homeTeam.placeName.default}</h3>
              <div className="team-stats">
                <div className="stat">
                  <span className="stat-value">{homeTeam.score}</span>
                  <span className="stat-label">Goals</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{homeTeam.sog}</span>
                  <span className="stat-label">Shots</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Loading players...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="daily-lineup">
      <h1>Daily Lineup Builder</h1>
      
      {/* Game Week Calendar */}
      <div className="game-week">
        {gamesData?.gameWeek?.map((day) => (
          <div 
            key={day.date} 
            className={`game-day ${day.date === gamesData.currentDate ? 'active' : ''}`}
            onClick={() => handleGameDayClick(day.date)}
          >
            <div className="day-abbrev">{day.dayAbbrev}</div>
            <div className="date-abbrev">
              {format(new Date(day.date + 'T12:00:00'), 'MMM d')}
            </div>
            <div className="game-count">{day.numberOfGames} games</div>
          </div>
        ))}
      </div>

      {message && <div className="message">{message}</div>}

      <div className="hockey-formation">
        <div className="forwards-row">
          {[1, 2, 3, 4, 5].map(num => (
            selectedPlayers[`F${num}`] ? 
              <PlayerCard 
                key={num}
                player={selectedPlayers[`F${num}`]} 
                position="F" 
                slot={`F${num}`} 
              /> :
              <EmptyPlayerCard key={num} position="F" slot={`F${num}`} />
          ))}
        </div>

        <div className="defense-row">
          {[1, 2, 3].map(num => (
            selectedPlayers[`D${num}`] ? 
              <PlayerCard 
                key={num}
                player={selectedPlayers[`D${num}`]} 
                position="D" 
                slot={`D${num}`} 
              /> :
              <EmptyPlayerCard key={num} position="D" slot={`D${num}`} />
          ))}
        </div>

        <div className="goalie-row">
          {selectedPlayers.G1 ? 
            <PlayerCard 
              player={selectedPlayers.G1} 
              position="G" 
              slot="G1" 
            /> :
            <EmptyPlayerCard position="G" slot="G1" />
          }
        </div>
      </div>

      <div className="save-lineup-container">
        <button 
          className="save-lineup-button"
          onClick={handleSaveLineup}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Lineup'}
        </button>
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('success') ? 'success' : 'error'}`}>
            {saveMessage}
          </div>
        )}
      </div>

      <PlayerSelectionModal />

      <BoxScore gameData={gamesData?.currentGame} />
    </div>
  );
}

export default DailyLineup; 