const calculatePlayerScore = (stats, position) => {
  // Return 0 if no stats provided
  if (!stats) return 0;

  if (position === 'G') {
    return calculateGoalieScore(stats);
  } else {
    return calculateSkaterScore(stats);
  }
};

const calculateSkaterScore = (stats) => {
  // Point values for each stat
  const SCORING = {
    GOAL: 5,
    ASSIST: 2,
    PIM: 0.5,
    HIT: 0.5,
    BLOCKED: 0.5
  };

  return (
    (stats.goals || 0) * SCORING.GOAL +
    (stats.assists || 0) * SCORING.ASSIST +
    (stats.pim || 0) * SCORING.PIM +
    (stats.hits || 0) * SCORING.HIT +
    (stats.blocked || 0) * SCORING.BLOCKED
  );
};

const calculateGoalieScore = (stats) => {
  // Point values for each stat
  const SCORING = {
    SAVE: 0.2,
    WIN: 4,
    OTL: 1,
    GA: -1
  };

  return (
    (stats.saves || 0) * SCORING.SAVE +
    (stats.wins || 0) * SCORING.WIN +
    (stats.otLosses || 0) * SCORING.OTL +
    (stats.goalsAgainst || 0) * SCORING.GA
  );
};

module.exports = {
  calculatePlayerScore,
  calculateSkaterScore,
  calculateGoalieScore
}; 