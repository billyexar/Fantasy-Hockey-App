const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// API Base URLs
const NHL_WEB_API = 'https://api-web.nhle.com';
const NHL_STATS_API = 'https://api.nhle.com/stats/rest';

// Get current schedule/scores
app.get('/api/games', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const response = await axios.get(`${NHL_WEB_API}/v1/score/${date}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

// Get specific game details with team stats
app.get('/api/games/:id', async (req, res) => {
    try {
        // First get the game data
        const gameResponse = await axios.get(`${NHL_WEB_API}/v1/gamecenter/${req.params.id}/landing`);
        const gameData = gameResponse.data;

        // For live or finished games, fetch boxscore data
        if (gameData.gameState === 'LIVE' || gameData.gameState === 'FINAL' || gameData.gameState === 'OFF') {
            try {
                const boxscoreResponse = await axios.get(`${NHL_WEB_API}/v1/gamecenter/${req.params.id}/boxscore`);
                const boxscoreData = boxscoreResponse.data;

                // Add boxscore data to game data
                gameData.boxscore = {
                    awayTeam: {
                        ...gameData.awayTeam,
                        players: boxscoreData.playerByGameStats.awayTeam
                    },
                    homeTeam: {
                        ...gameData.homeTeam,
                        players: boxscoreData.playerByGameStats.homeTeam
                    },
                    situation: boxscoreData.situation,
                    summary: boxscoreData.summary || {}
                };
            } catch (boxscoreError) {
                console.error('Error fetching boxscore:', boxscoreError);
            }
        }
        // For future games, fetch rosters and stats
        else if (gameData.gameState === 'FUT' || gameData.gameState === 'PRE') {
            try {
                // Get rosters using team abbreviations
                const [awayRosterResponse, homeRosterResponse] = await Promise.all([
                    axios.get(`${NHL_WEB_API}/v1/roster/${gameData.awayTeam.abbrev}/current`),
                    axios.get(`${NHL_WEB_API}/v1/roster/${gameData.homeTeam.abbrev}/current`)
                ]);

                // Process away team players
                const awayPlayers = [...awayRosterResponse.data.forwards, ...awayRosterResponse.data.defensemen]
                    .slice(0, 12); // Get top 12 players first

                // Process home team players
                const homePlayers = [...homeRosterResponse.data.forwards, ...homeRosterResponse.data.defensemen]
                    .slice(0, 12); // Get top 12 players first

                // Fetch individual player stats
                const awayPlayerStats = await Promise.all(
                    awayPlayers.map(player => 
                        axios.get(`${NHL_WEB_API}/v1/player/${player.id}/landing`)
                    )
                );

                const homePlayerStats = await Promise.all(
                    homePlayers.map(player => 
                        axios.get(`${NHL_WEB_API}/v1/player/${player.id}/landing`)
                    )
                );

                // Process away team player stats
                gameData.awayTeam.players = awayPlayers.map((player, index) => {
                    const stats = awayPlayerStats[index].data.featuredStats?.season === 20242025 
                        ? awayPlayerStats[index].data.featuredStats.regularSeason.subSeason 
                        : { gamesPlayed: 0, goals: 0, assists: 0, points: 0, plusMinus: 0 };
                    
                    return {
                        id: player.id,
                        firstName: player.firstName,
                        lastName: player.lastName,
                        position: player.positionCode,
                        headshot: player.headshot,
                        gamesPlayed: stats.gamesPlayed || 0,
                        goals: stats.goals || 0,
                        assists: stats.assists || 0,
                        points: stats.points || 0,
                        plusMinus: stats.plusMinus || 0
                    };
                }).sort((a, b) => b.points - a.points);

                // Process home team player stats
                gameData.homeTeam.players = homePlayers.map((player, index) => {
                    const stats = homePlayerStats[index].data.featuredStats?.season === 20242025 
                        ? homePlayerStats[index].data.featuredStats.regularSeason.subSeason 
                        : { gamesPlayed: 0, goals: 0, assists: 0, points: 0, plusMinus: 0 };
                    
                    return {
                        id: player.id,
                        firstName: player.firstName,
                        lastName: player.lastName,
                        position: player.positionCode,
                        headshot: player.headshot,
                        gamesPlayed: stats.gamesPlayed || 0,
                        goals: stats.goals || 0,
                        assists: stats.assists || 0,
                        points: stats.points || 0,
                        plusMinus: stats.plusMinus || 0
                    };
                }).sort((a, b) => b.points - a.points);

            } catch (rosterError) {
                console.error('Error fetching rosters/stats:', {
                    error: rosterError.message,
                    awayTeam: gameData.awayTeam.abbrev,
                    homeTeam: gameData.homeTeam.abbrev
                });
            }
        }

        res.json(gameData);
    } catch (error) {
        console.error('Error fetching game details:', error);
        res.status(500).json({ error: 'Failed to fetch game details' });
    }
});

// Get game boxscore
app.get('/api/games/:id/boxscore', async (req, res) => {
    try {
        const response = await axios.get(`${NHL_WEB_API}/v1/gamecenter/${req.params.id}/boxscore`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching boxscore:', error);
        res.status(500).json({ error: 'Failed to fetch boxscore' });
    }
});

// Get play by play
app.get('/api/games/:id/play-by-play', async (req, res) => {
    try {
        const response = await axios.get(`${NHL_WEB_API}/v1/gamecenter/${req.params.id}/play-by-play`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching play by play:', error);
        res.status(500).json({ error: 'Failed to fetch play by play' });
    }
});

// Get schedule calendar
app.get('/api/schedule/calendar', async (req, res) => {
    try {
        const response = await axios.get(`${NHL_WEB_API}/v1/schedule-calendar/now`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching schedule calendar:', error);
        res.status(500).json({ error: 'Failed to fetch schedule calendar' });
    }
});

// Get standings
app.get('/api/standings', async (req, res) => {
    try {
        const response = await axios.get(`${NHL_WEB_API}/v1/standings/now`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching standings:', error);
        res.status(500).json({ error: 'Failed to fetch standings' });
    }
});

// Get team stats
app.get('/api/teams/:id/stats', async (req, res) => {
    try {
        const response = await axios.get(`${NHL_WEB_API}/v1/club-stats/${req.params.id}/now`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching team stats:', error);
        res.status(500).json({ error: 'Failed to fetch team stats' });
    }
});

// Get team roster
app.get('/api/teams/:id/roster', async (req, res) => {
    try {
        const response = await axios.get(`${NHL_WEB_API}/v1/roster/${req.params.id}/now`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching team roster:', error);
        res.status(500).json({ error: 'Failed to fetch team roster' });
    }
});

// Get all players with stats
app.get('/api/players', async (req, res) => {
    try {
        // First get all teams
        const teamsResponse = await axios.get(`${NHL_WEB_API}/v1/standings/now`);
        const teams = teamsResponse.data.standings;
        
        let allPlayers = [];
        
        // Get rosters for each team
        for (const team of teams) {
            try {
                const rosterResponse = await axios.get(`${NHL_WEB_API}/v1/roster/${team.teamAbbrev.default}/current`);
                
                // Get all players: forwards, defensemen, and goalies
                const players = [
                    ...rosterResponse.data.forwards,
                    ...rosterResponse.data.defensemen,
                    ...rosterResponse.data.goalies
                ];
                
                // Get stats for each player
                const playerPromises = players.map(async (player) => {
                    try {
                        const statsResponse = await axios.get(`${NHL_WEB_API}/v1/player/${player.id}/landing`);
                        const currentSeasonStats = statsResponse.data.featuredStats?.season === 20242025
                            ? statsResponse.data.featuredStats.regularSeason.subSeason
                            : player.positionCode === 'G' 
                                ? {
                                    gamesPlayed: 0,
                                    wins: 0,
                                    losses: 0,
                                    otLosses: 0,
                                    goalsAgainstAvg: 0,
                                    savePctg: 0,
                                    shutouts: 0
                                }
                                : { gamesPlayed: 0, goals: 0, assists: 0, points: 0 };

                        return {
                            id: player.id,
                            name: `${player.firstName.default} ${player.lastName.default}`,
                            position: player.positionCode,
                            team: team.teamAbbrev.default,
                            price: Math.floor(Math.random() * 30) + 20,
                            headshot: statsResponse.data.headshot,
                            stats: player.positionCode === 'G' 
                                ? {
                                    gamesPlayed: currentSeasonStats.gamesPlayed || 0,
                                    wins: currentSeasonStats.wins || 0,
                                    losses: currentSeasonStats.losses || 0,
                                    otLosses: currentSeasonStats.otLosses || 0,
                                    goalsAgainstAvg: parseFloat(currentSeasonStats.goalsAgainstAvg?.toFixed(2)) || 0,
                                    savePercentage: parseFloat(currentSeasonStats.savePctg?.toFixed(3)) || 0,
                                    shutouts: currentSeasonStats.shutouts || 0
                                }
                                : {
                                    goals: currentSeasonStats.goals || 0,
                                    assists: currentSeasonStats.assists || 0,
                                    points: currentSeasonStats.points || 0,
                                    gamesPlayed: currentSeasonStats.gamesPlayed || 0
                                }
                        };
                    } catch (error) {
                        console.error(`Error fetching stats for player ${player.id}:`, error);
                        return null;
                    }
                });

                const teamPlayers = (await Promise.all(playerPromises)).filter(player => player !== null);
                allPlayers = [...allPlayers, ...teamPlayers];
            } catch (error) {
                console.error(`Error fetching roster for team ${team.teamAbbrev.default}:`, error);
            }
        }

        // Sort players by points (for skaters) or wins (for goalies)
        allPlayers.sort((a, b) => {
            if (a.position === 'G' && b.position === 'G') {
                return (b.stats.wins || 0) - (a.stats.wins || 0);
            } else if (a.position === 'G') {
                return 1; // Move goalies to the end
            } else if (b.position === 'G') {
                return -1; // Move goalies to the end
            } else {
                return (b.stats.points || 0) - (a.stats.points || 0);
            }
        });
        
        // Add cache control headers
        res.set({
            'Cache-Control': 'private, max-age=3600',
            'ETag': `"${Date.now()}"` // Simple ETag implementation
        });
        
        res.json(allPlayers);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// Optional: Add an endpoint to force-refresh the cache
app.post('/api/players/refresh', async (req, res) => {
    try {
        // Clear the server-side cache if you have any
        // ... cache clearing logic ...

        // Return success response
        res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});

// Get daily players
app.get('/api/daily-players', async (req, res) => {
    try {
        const { date } = req.query;
        
        // Validate date format
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // First get games for the specified date
        const gamesResponse = await axios.get(`${NHL_WEB_API}/v1/score/${date}`);
        const games = gamesResponse.data.games || [];

        // If no games on this date
        if (games.length === 0) {
            return res.json({ 
                games: [],
                players: [],
                message: 'No games scheduled for this date' 
            });
        }

        let allPlayers = [];
        
        // For each game, get rosters for both teams
        for (const game of games) {
            try {
                // Get rosters using team abbreviations
                const [awayRosterResponse, homeRosterResponse] = await Promise.all([
                    axios.get(`${NHL_WEB_API}/v1/roster/${game.awayTeam.abbrev}/current`),
                    axios.get(`${NHL_WEB_API}/v1/roster/${game.homeTeam.abbrev}/current`)
                ]);

                // Process away team players
                const awayPlayers = [
                    ...awayRosterResponse.data.forwards,
                    ...awayRosterResponse.data.defensemen,
                    ...awayRosterResponse.data.goalies
                ];

                // Process home team players
                const homePlayers = [
                    ...homeRosterResponse.data.forwards,
                    ...homeRosterResponse.data.defensemen,
                    ...homeRosterResponse.data.goalies
                ];

                // Fetch stats for away team players
                const awayPlayerStats = await Promise.all(
                    awayPlayers.map(player => 
                        axios.get(`${NHL_WEB_API}/v1/player/${player.id}/landing`)
                    )
                );

                // Fetch stats for home team players
                const homePlayerStats = await Promise.all(
                    homePlayers.map(player => 
                        axios.get(`${NHL_WEB_API}/v1/player/${player.id}/landing`)
                    )
                );

                // Process away team players with stats
                const processedAwayPlayers = awayPlayers.map((player, index) => {
                    const stats = awayPlayerStats[index].data.featuredStats?.season === 20242025
                        ? awayPlayerStats[index].data.featuredStats.regularSeason.subSeason
                        : { gamesPlayed: 0, goals: 0, assists: 0, points: 0 };

                    return {
                        id: player.id,
                        name: `${player.firstName.default} ${player.lastName.default}`,
                        position: player.positionCode,
                        team: game.awayTeam.name.default,
                        opponent: game.homeTeam.name.default,
                        isHome: false,
                        gameTime: game.startTimeUTC,
                        headshot: player.headshot,
                        goals: stats.goals || 0,
                        assists: stats.assists || 0,
                        points: stats.points || 0,
                        gameId: game.id
                    };
                });

                // Process home team players with stats
                const processedHomePlayers = homePlayers.map((player, index) => {
                    const stats = homePlayerStats[index].data.featuredStats?.season === 20242025
                        ? homePlayerStats[index].data.featuredStats.regularSeason.subSeason
                        : { gamesPlayed: 0, goals: 0, assists: 0, points: 0 };

                    return {
                        id: player.id,
                        name: `${player.firstName.default} ${player.lastName.default}`,
                        position: player.positionCode,
                        team: game.homeTeam.name.default,
                        opponent: game.awayTeam.name.default,
                        isHome: true,
                        gameTime: game.startTimeUTC,
                        headshot: player.headshot,
                        goals: stats.goals || 0,
                        assists: stats.assists || 0,
                        points: stats.points || 0,
                        gameId: game.id
                    };
                });

                allPlayers = [...allPlayers, ...processedAwayPlayers, ...processedHomePlayers];

            } catch (error) {
                console.error(`Error processing game ${game.id}:`, error);
            }
        }

        res.json({
            games,
            players: allPlayers,
            message: `Found ${allPlayers.length} players in ${games.length} games`
        });

    } catch (error) {
        console.error('Error fetching daily players:', error);
        res.status(500).json({ error: 'Failed to fetch daily players' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 