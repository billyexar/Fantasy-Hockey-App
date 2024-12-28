import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import '../styles/Games.css';

function Games() {
  const [gamesData, setGamesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const formattedDate = format(date, 'yyyy-MM-dd');
        const response = await fetch(`http://localhost:5000/api/games?date=${formattedDate}`);
        const data = await response.json();
        
        console.log('API Response:', data);
        setGamesData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [date]);

  const handleGameClick = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const handleGameDayClick = (dayDate) => {
    if (dayDate) {
      const newDate = new Date(dayDate + 'T12:00:00');
      setDate(newDate);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-animation">
          <i className="fas fa-hockey-puck"></i>
        </div>
        <h2>Loading Games</h2>
        <p>Getting the latest NHL schedule...</p>
      </div>
    </div>
  );
  if (error) return <div>Error: {error}</div>;
  if (!gamesData) return <div>No data available</div>;

  const currentGames = gamesData.games || [];
  const currentGameDay = gamesData.gameWeek?.find(day => day.date === gamesData.currentDate);

  return (
    <div className="games-container">
      <h1>NHL Games</h1>
      
      <div className="date-display">
        <span>{format(new Date(gamesData.currentDate), 'EEEE, MMMM d')}</span>
      </div>

      {/* Game Week Calendar */}
      <div className="game-week">
        {gamesData.gameWeek?.map((day) => (
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

      {/* Games Grid */}
      <div className="games-grid">
        {currentGames.length === 0 ? (
          <div className="no-games">
            <div className="no-games-content">
              <div className="no-games-icons">
                <i className="fas fa-hockey-puck"></i>
                <i className="fas fa-calendar-alt"></i>
              </div>
              <h2>No Games Today</h2>
              <p>
                There are no NHL games scheduled for {format(new Date(gamesData.currentDate), 'MMMM d, yyyy')}
                {currentGameDay && ` (${currentGameDay.dayAbbrev})`}
              </p>
            </div>
          </div>
        ) : (
          currentGames.map((game) => (
            <div 
              key={game.id} 
              className="game-card"
              onClick={() => handleGameClick(game.id)}
            >
              <div className="game-status">
                {game.gameState || game.gameScheduleState}
              </div>
              <div className="teams-container">
                <div className="team away">
                  <img 
                    src={game.awayTeam.logo || `/team-logos/${game.awayTeam.id}.png`}
                    alt={game.awayTeam.name.default || game.awayTeam.name} 
                    className="team-logo"
                  />
                  <div className="team-name">
                    {game.awayTeam.name.default || game.awayTeam.name}
                  </div>
                  <div className="team-score">
                    {game.awayTeam.score || '0'}
                  </div>
                </div>
                <div className="team home">
                  <img 
                    src={game.homeTeam.logo || `/team-logos/${game.homeTeam.id}.png`}
                    alt={game.homeTeam.name.default || game.homeTeam.name} 
                    className="team-logo"
                  />
                  <div className="team-name">
                    {game.homeTeam.name.default || game.homeTeam.name}
                  </div>
                  <div className="team-score">
                    {game.homeTeam.score || '0'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Games; 