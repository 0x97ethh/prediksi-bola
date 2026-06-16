module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { home, away } = req.query;
  
  if (!home || !away) {
    return res.status(400).json({ error: 'Missing home or away team parameter' });
  }
  
  // Prediction algorithm based on team strength
  const predictions = generatePrediction(home, away);
  
  res.status(200).json(predictions);
};

function generatePrediction(homeTeam, awayTeam) {
  // Simple prediction logic (can be enhanced with real data)
  const homeStrength = getTeamStrength(homeTeam);
  const awayStrength = getTeamStrength(awayTeam);
  
  const homeWinProb = Math.min(70, Math.max(20, 45 + (homeStrength - awayStrength) * 5 + 10));
  const drawProb = Math.min(35, Math.max(15, 28 - Math.abs(homeStrength - awayStrength) * 3));
  const awayWinProb = 100 - homeWinProb - drawProb;
  
  const expectedGoals = Math.min(4, Math.max(1.5, 2.5 + (homeStrength + awayStrength) / 20));
  
  return {
    match: `${homeTeam} vs ${awayTeam}`,
    prediction: {
      homeWin: Math.round(homeWinProb),
      draw: Math.round(drawProb),
      awayWin: Math.round(awayWinProb)
    },
    goals: {
      over25: Math.round(expectedGoals > 2.5 ? 60 + (expectedGoals - 2.5) * 20 : 40 - (2.5 - expectedGoals) * 20),
      under25: Math.round(expectedGoals > 2.5 ? 40 - (expectedGoals - 2.5) * 20 : 60 + (2.5 - expectedGoals) * 20),
      bttsYes: Math.round(55 + (expectedGoals - 2) * 15),
      bttsNo: Math.round(45 - (expectedGoals - 2) * 15),
      expectedTotal: expectedGoals.toFixed(1)
    },
    advice: generateAdvice(homeWinProb, drawProb, awayWinProb, expectedGoals),
    confidence: Math.round(65 + Math.abs(homeStrength - awayStrength) * 5)
  };
}

function getTeamStrength(team) {
  const rankings = {
    'Brazil': 9, 'France': 9, 'Argentina': 9, 'England': 8.5, 'Spain': 8.5,
    'Germany': 8, 'Netherlands': 8, 'Portugal': 8, 'Belgium': 7.5, 'Croatia': 7.5,
    'Morocco': 7, 'Japan': 7, 'USA': 7, 'Mexico': 6.5, 'Senegal': 6.5,
    'Poland': 6, 'Denmark': 7, 'Switzerland': 7, 'Uruguay': 7, 'Colombia': 7,
    'Australia': 6, 'South Korea': 6.5, 'Ghana': 6, 'Cameroon': 6, 'Serbia': 6.5,
    'Canada': 6, 'Ecuador': 6, 'Tunisia': 5.5, 'Saudi Arabia': 5.5, 'Iran': 5.5,
    'Costa Rica': 5, 'Wales': 6, 'Qatar': 5, 'Iceland': 5.5, 'Italy': 8,
    'Norway': 6.5, 'Scotland': 6, 'Czech Republic': 6, 'Austria': 6, 'Hungary': 6,
    'Algeria': 6, 'Egypt': 6, 'Nigeria': 6, 'Peru': 6, 'Chile': 6.5, 'Paraguay': 5.5,
    'Venezuela': 5, 'Bolivia': 4.5, 'Iraq': 5, 'UAE': 5, 'China PR': 5
  };
  
  return rankings[team] || 5;
}

function generateAdvice(homeWin, draw, awayWin, expectedGoals) {
  const advice = [];
  
  if (homeWin > 50) {
    advice.push(`🏠 ${homeWin}% Home Win — Strong home favorite`);
  } else if (awayWin > 50) {
    advice.push(`✈️ ${awayWin}% Away Win — Strong away favorite`);
  } else if (draw > 30) {
    advice.push(`🤝 ${draw}% Draw — Close match expected`);
  }
  
  if (expectedGoals > 2.8) {
    advice.push(`⚽ Over 2.5 Goals — High-scoring match expected`);
  } else if (expectedGoals < 2.2) {
    advice.push(`🛡️ Under 2.5 Goals — Defensive match expected`);
  }
  
  if (Math.min(homeWin, awayWin) > 35) {
    advice.push(`🎯 BTTS Yes — Both teams likely to score`);
  }
  
  return advice;
}
