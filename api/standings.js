const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const data = await fetch('https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings');
    const standings = [];
    
    if (data.children) {
      for (const group of data.children) {
        const groupData = {
          name: group.name || group.shortName,
          standings: []
        };
        
        if (group.standings?.entries) {
          for (const entry of group.standings.entries) {
            const team = entry.team;
            const stats = {};
            
            for (const stat of entry.stats || []) {
              stats[stat.name] = stat.value;
            }
            
            groupData.standings.push({
              name: team.displayName,
              shortName: team.shortDisplayName,
              logo: team.logo,
              rank: stats.rank || 0,
              played: stats.matchesPlayed || 0,
              wins: stats.wins || 0,
              draws: stats.ties || 0,
              losses: stats.losses || 0,
              points: stats.points || 0,
              goalsFor: stats.pointsFor || 0,
              goalsAgainst: stats.pointsAgainst || 0,
              goalDiff: stats.pointDifferential || 0
            });
          }
        }
        
        standings.push(groupData);
      }
    }
    
    res.status(200).json({ standings, lastUpdate: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch standings', message: error.message });
  }
};
