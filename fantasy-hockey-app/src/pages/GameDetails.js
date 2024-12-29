import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/GameDetails.css';

function GameDetails() {
  const { id } = useParams();
  const [gameData, setGameData] = useState(null);
  const [boxscore, setBoxscore] = useState(null);
  const [playByPlay, setPlayByPlay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get team name
  const getTeamName = (team) => {
    if (!team) return '';
    if (team.placeName?.default && team.commonName?.default) {
      return `${team.placeName.default} ${team.commonName.default}`;
    }
    return team.name?.default || team.teamName || 'Unknown Team';
  };

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true);
        
        const [gameResponse, boxscoreResponse, playByPlayResponse] = await Promise.all([
          fetch(`${API_URL}/api/games/${id}`),
          fetch(`${API_URL}/api/games/${id}/boxscore`),
          fetch(`${API_URL}/api/games/${id}/play-by-play`)
        ]);

        const [gameData, boxscoreData, playByPlayData] = await Promise.all([
          gameResponse.json(),
          boxscoreResponse.json(),
          playByPlayResponse.json()
        ]);

        console.log('Game Data:', gameData);
        setGameData(gameData);
        setBoxscore(boxscoreData);
        setPlayByPlay(playByPlayData);
        setError(null);
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [id]);

  const renderTeamStats = (team) => {
    if (!team.players) return null;
    
    return (
      <div className="team-stats">
        <h3>{getTeamName(team)}</h3>
        <div className="players-grid">
          {team.players.map(player => (
            <div key={player.id} className="game-details-player-card">
              <img 
                src={player.headshot} 
                alt={`${player.firstName?.default} ${player.lastName?.default}`}
                className="game-details-player-headshot"
                onError={(e) => {
                  e.target.src = 'https://assets.nhle.com/mugs/nhl/default.png';
                }}
              />
              <div className="player-info">
                <div className="player-name">
                  {player.firstName?.default} {player.lastName?.default}
                </div>
                <div className="player-position">{player.position}</div>
                <div className="player-stats">
                  <div className="stat">
                    <span className="label">GP</span>
                    <span className="value">{player.gamesPlayed}</span>
                  </div>
                  <div className="stat">
                    <span className="label">G</span>
                    <span className="value">{player.goals}</span>
                  </div>
                  <div className="stat">
                    <span className="label">A</span>
                    <span className="value">{player.assists}</span>
                  </div>
                  <div className="stat">
                    <span className="label">P</span>
                    <span className="value">{player.points}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const BoxscoreTable = ({ players, title }) => {
    if (!players) return null;
    
    return (
      <div className="boxscore-section">
        <h4>{title}</h4>
        <div className="table-wrapper">
          <table className="boxscore-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>G</th>
                <th>A</th>
                <th>P</th>
                <th>+/-</th>
                <th>PIM</th>
                <th>SOG</th>
                <th>HIT</th>
                <th>BLK</th>
                <th>GVA</th>
                <th>TKA</th>
                <th>FO%</th>
                <th>PPG</th>
                <th>SFT</th>
                <th>TOI</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.playerId}>
                  <td>
                    <div className="player-name">
                      <span className="jersey-number">#{player.sweaterNumber}</span>
                      {player.name.default}
                    </div>
                  </td>
                  <td>{player.goals}</td>
                  <td>{player.assists}</td>
                  <td>{player.points}</td>
                  <td>{player.plusMinus}</td>
                  <td>{player.pim}</td>
                  <td>{player.sog}</td>
                  <td>{player.hits}</td>
                  <td>{player.blockedShots}</td>
                  <td>{player.giveaways}</td>
                  <td>{player.takeaways}</td>
                  <td>{player.faceoffWinningPctg ? (player.faceoffWinningPctg * 100).toFixed(1) : '-'}</td>
                  <td>{player.powerPlayGoals}</td>
                  <td>{player.shifts}</td>
                  <td>{player.toi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const GoalieStats = ({ goalies }) => {
    if (!goalies) return null;
    
    return (
      <div className="boxscore-section">
        <h4>Goalies</h4>
        <div className="table-wrapper">
          <table className="boxscore-table">
            <thead>
              <tr>
                <th>Goalie</th>
                <th>SA</th>
                <th>SV</th>
                <th>SV%</th>
                <th>GA</th>
                <th>EV SV</th>
                <th>PP SV</th>
                <th>SH SV</th>
                <th>TOI</th>
              </tr>
            </thead>
            <tbody>
              {goalies.map(goalie => (
                goalie.toi !== "00:00" && (
                  <tr key={goalie.playerId}>
                    <td>
                      <div className="player-name">
                        <span className="jersey-number">#{goalie.sweaterNumber}</span>
                        {goalie.name.default}
                      </div>
                    </td>
                    <td>{goalie.shotsAgainst}</td>
                    <td>{goalie.saves}</td>
                    <td>{(goalie.savePctg * 100).toFixed(1)}%</td>
                    <td>{goalie.goalsAgainst}</td>
                    <td>{goalie.evenStrengthShotsAgainst}</td>
                    <td>{goalie.powerPlayShotsAgainst}</td>
                    <td>{goalie.shorthandedShotsAgainst}</td>
                    <td>{goalie.toi}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const ThreeStars = ({ summary }) => {
    // Only show if game is final AND three stars are available
    if (!summary?.threeStars?.length) return null;
    
    const renderPlayerStats = (player) => {
      // Check if player is a goalie based on position
      if (player.position === 'G') {
        return (
          <div className="player-stats">
            <div>{player.saves} SV</div>
            <div>{(player.savePctg * 100).toFixed(1)}%</div>
            <div>{player.goalsAgainst} GA</div>
          </div>
        );
      }
      
      // For skaters, show goals, assists, points
      return (
        <div className="player-stats">
          <div>{player.goals}G {player.assists}A {player.points}P</div>
          {player.sog > 0 && <div>{player.sog} Shots</div>}
          {player.toi && <div>{player.toi} TOI</div>}
        </div>
      );
    };
    
    return (
      <div className="three-stars-section">
        <h3>Three Stars</h3>
        <div className="stars-container">
          {summary.threeStars.map((player, index) => (
            <div key={player.playerId} className={`star-card star-${index + 1}`}>
              <div className="star-number">★{index + 1}</div>
              <img 
                src={player.headshot} 
                alt={player.name.default}
                className="player-headshot"
                onError={(e) => {
                  e.target.src = 'https://assets.nhle.com/mugs/nhl/default.png';
                }}
              />
              <div className="player-info">
                <div className="player-name">{player.name.default}</div>
                <div className="player-position">{player.position}</div>
                {renderPlayerStats(player)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="status-message loading">
      <div className="spinner"></div>
      <h2>Loading game details...</h2>
    </div>
  );

  if (error) return (
    <div className="status-message error">
      <i className="fas fa-exclamation-circle"></i>
      <h2>Error loading game</h2>
      <p>{error}</p>
    </div>
  );

  if (!gameData) return (
    <div className="status-message no-game">
      <div className="no-game-content">
        <div className="icon-container">
          <i className="fas fa-hockey-puck"></i>
          <i className="fas fa-calendar-alt"></i>
        </div>
        <h2>No Games Scheduled</h2>
        <p>Check back later for upcoming games and live scores!</p>
        <div className="decoration">
          <i className="fas fa-skating"></i>
          <div className="ice-line"></div>
          <i className="fas fa-hockey-puck"></i>
        </div>
      </div>
    </div>
  );

  // For future games that haven't started
  if (gameData.gameState === 'FUT' || gameData.gameState === 'PRE') {
    return (
      <div className="game-details">
        {/* Game Header */}
        <div className="game-header">
          <div className="game-status">
            <h2>Upcoming Game</h2>
            <p className="game-time">
              {new Date(gameData.startTimeUTC).toLocaleString()}
            </p>
          </div>

          {/* Teams Scoreboard */}
          <div className="scoreboard">
            <div className="team away">
              <img 
                src={gameData.awayTeam.logo}
                alt={getTeamName(gameData.awayTeam)} 
                className="team-logo"
              />
              <h2>{getTeamName(gameData.awayTeam)}</h2>
            </div>
            
            <div className="vs">VS</div>
            
            <div className="team home">
              <img 
                src={gameData.homeTeam.logo}
                alt={getTeamName(gameData.homeTeam)} 
                className="team-logo"
              />
              <h2>{getTeamName(gameData.homeTeam)}</h2>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="team-stats-container">
          <div className="away-stats">
            {renderTeamStats(gameData.awayTeam)}
          </div>
          <div className="home-stats">
            {renderTeamStats(gameData.homeTeam)}
          </div>
        </div>
      </div>
    );
  }

  // Render existing game details for live/completed games
  return (
    <div className="game-details">
      {/* Game Header */}
      <div className="game-header">
        <div className="game-status">
          <h2>{gameData.gameState || 'Status Unknown'}</h2>
          {gameData.periodDescriptor && (
            <p className="period-info">
              Period {gameData.periodDescriptor.number} - {gameData.clock.timeRemaining}
            </p>
          )}
        </div>

        {/* Teams Scoreboard */}
        <div className="scoreboard">
          <div className="team away">
            <img src={gameData.awayTeam.logo} alt={gameData.awayTeam.placeName.default} className="team-logo" />
            <div className="team-info">
              <h2>{gameData.awayTeam.placeName.default}</h2>
              <div className="score">{gameData.awayTeam.score}</div>
            </div>
          </div>

          
        <div className="vs">VS</div>
          

          <div className="team home">
            <div className="team-info">
              <h2>{gameData.homeTeam.placeName.default}</h2>
              <div className="score">{gameData.homeTeam.score}</div>
            </div>
            <img src={gameData.homeTeam.logo} alt={gameData.homeTeam.placeName.default} className="team-logo" />
          </div>
        </div>
      </div>

      {/* Scoring Summary */}
      {gameData.summary?.scoring && (
        <div className="scoring-summary">
          <h3>Scoring Summary</h3>
          {gameData.summary.scoring.map((period, index) => (
            <div key={index} className="period-summary">
              <h4 className="period-header">
                Period {period.periodDescriptor.number}
              </h4>
              {period.goals?.map((goal, goalIndex) => (
                <div key={goalIndex} className="goal-details">
                  <div className="goal-time">{goal.timeInPeriod}</div>
                  <div className="goal-info">
                    <div className="goal-scorer-info">
                      <img 
                        src={goal.headshot} 
                        alt={`${goal.firstName.default} ${goal.lastName.default}`}
                        className="player-headshot"
                      />
                      <div className="goal-text">
                        <div className="goal-team">
                          {goal.teamAbbrev.default} {goal.strength && `(${goal.strength.toUpperCase()})`}
                        </div>
                        <div className="goal-scorer">
                          <strong>{goal.firstName.default} {goal.lastName.default}</strong> ({goal.goalsToDate})
                          {goal.assists?.length > 0 && (
                            <span className="assists">
                              from {goal.assists.map(assist => 
                                `${assist.firstName.default} ${assist.lastName.default}`
                              ).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="goal-score">{goal.awayScore} - {goal.homeScore}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Three Stars */}
      {gameData.summary?.threeStars && (
        <div className="three-stars">
          <h3>Three Stars</h3>
          <div className="stars-container">
            {gameData.summary.threeStars.map((star, index) => (
              <div key={index} className="star-player">
                <div className="star-number">★ {star.star}</div>
                <img 
                  src={star.headshot} 
                  alt={star.name.default}
                  className="player-headshot"
                />
                <div className="player-name">{star.name.default}</div>
                <div className="player-stats">
                  {star.goals}G, {star.assists}A, {star.points}P
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Penalties */}
      {gameData.summary?.penalties && (
        <div className="penalties">
          <h3>Penalties</h3>
          {gameData.summary.penalties.map((period, index) => (
            <div key={index} className="period-penalties">
              <h4>Period {period.periodDescriptor.number}</h4>
              {period.penalties.map((penalty, penaltyIndex) => (
                <div key={penaltyIndex} className="penalty-detail">
                  <span className="penalty-time">{penalty.timeInPeriod}</span>
                  <span className="penalty-team">{penalty.teamAbbrev.default}</span>
                  <span className="penalty-player">{penalty.committedByPlayer}</span>
                  <span className="penalty-type">
                    {penalty.duration} min - {penalty.descKey.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Add Boxscore section after scoring summary */}
      {gameData.boxscore && (
        <div className="boxscore-container">
          <h3>Boxscore</h3>
          
          {/* Away Team */}
          <div className="team-boxscore">
            <h3>{gameData.boxscore.awayTeam.placeName.default}</h3>
            <BoxscoreTable 
              players={gameData.boxscore.awayTeam.players.forwards} 
              title="Forwards" 
            />
            <BoxscoreTable 
              players={gameData.boxscore.awayTeam.players.defense} 
              title="Defense" 
            />
            <GoalieStats 
              goalies={gameData.boxscore.awayTeam.players.goalies} 
            />
          </div>

          {/* Home Team */}
          <div className="team-boxscore">
            <h3>{gameData.boxscore.homeTeam.placeName.default}</h3>
            <BoxscoreTable 
              players={gameData.boxscore.homeTeam.players.forwards} 
              title="Forwards" 
            />
            <BoxscoreTable 
              players={gameData.boxscore.homeTeam.players.defense} 
              title="Defense" 
            />
            <GoalieStats 
              goalies={gameData.boxscore.homeTeam.players.goalies} 
            />
          </div>
        </div>
      )}

      {/* Add Three Stars section after boxscore */}
      {gameData.gameState === 'FINAL' && (
        <ThreeStars summary={gameData.summary} />
      )}
    </div>
  );
}

export default GameDetails; 