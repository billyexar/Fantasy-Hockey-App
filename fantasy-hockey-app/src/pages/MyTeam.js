import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MyTeam.css';

function MyTeam() {
  const [teamStats, setTeamStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedLineup = localStorage.getItem('savedLineup');
    if (!savedLineup) {
      navigate('/lineup');
      return;
    }
    setTeamStats(JSON.parse(savedLineup));
  }, [navigate]);

  if (!teamStats) {
    return <div>Loading...</div>;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlayersByPosition = (position) => {
    return teamStats.players.filter(player => 
      position === 'F' 
        ? ['C', 'LW', 'RW', 'L', 'R'].includes(player.position)
        : player.position === position
    );
  };

  const forwards = getPlayersByPosition('F');
  const defensemen = getPlayersByPosition('D');
  const goalies = getPlayersByPosition('G');

  const renderPlayerCard = (player, position) => (
    <div key={player.id} className={`player-card ${position.toLowerCase()}`}>
      <div className="player-headshot">
        <img 
          src={player.headshot}
          alt={player.name}
          onError={(e) => {
            e.target.src = '/default-player.png';
            e.target.onerror = null;
          }}
        />
      </div>
      <div className="player-info">
        <div className="player-header">
          <span className="player-name">{player.name}</span>
        </div>
        <div className="player-team">{player.team}</div>
        <div className="player-stats-container">
          {player.position === 'G' ? (
            <div className="goalie-stats">
              <div className="stat">
                <span className="stat-value">{player.stats.wins}-{player.stats.losses}-{player.stats.otLosses}</span>
              </div>
              <div className="stat">
                <span className="stat-value">{player.stats.savePercentage}</span>
              </div>
            </div>
          ) : (
            <div className="skater-stats">
              <div className="stat">
                <span className="stat-value">{player.stats.goals}G {player.stats.assists}A</span>
              </div>
              <div className="stat">
                <span className="stat-value">{player.stats.points} PTS</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="my-team">
      <div className="team-header">
        <h1>My Team</h1>
        <div className="team-info">
          <div className="budget-info">
            <div>Total Budget: ${teamStats.totalBudget}</div>
            <div>Remaining: ${teamStats.remainingBudget}</div>
          </div>
          <div className="last-updated">
            Last Updated: {formatDate(teamStats.lastUpdated)}
          </div>
        </div>
      </div>

      <div className="hockey-rink">
        <div className="forwards-row">
          {forwards.map(player => renderPlayerCard(player, 'Forward'))}
        </div>
        <div className="defense-row">
          {defensemen.map(player => renderPlayerCard(player, 'Defense'))}
        </div>
        <div className="goalie-row">
          {goalies.map(player => renderPlayerCard(player, 'Goalie'))}
        </div>
      </div>

      <button 
        className="edit-lineup-button"
        onClick={() => navigate('/lineup')}
      >
        Edit Lineup
      </button>
    </div>
  );
}

export default MyTeam; 