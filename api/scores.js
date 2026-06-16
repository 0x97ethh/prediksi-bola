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
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    const data = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard');
    const matches = data.events?.map(event => {
      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      
      return {
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        date: event.date,
        status: event.status?.type?.description || 'Scheduled',
        statusCode: event.status?.type?.state || 'pre',
        period: event.status?.period || 0,
        clock: event.status?.displayClock || '0:00',
        home: {
          name: home?.team?.displayName || 'TBD',
          shortName: home?.team?.shortDisplayName || 'TBD',
          abbreviation: home?.team?.abbreviation || 'TBD',
          logo: home?.team?.logo || '',
          score: home?.score || '0',
          record: home?.records?.[0]?.summary || '0-0-0'
        },
        away: {
          name: away?.team?.displayName || 'TBD',
          shortName: away?.team?.shortDisplayName || 'TBD',
          abbreviation: away?.team?.abbreviation || 'TBD',
          logo: away?.team?.logo || '',
          score: away?.score || '0',
          record: away?.records?.[0]?.summary || '0-0-0'
        },
        venue: comp?.venue?.fullName || 'TBD',
        league: event.season?.slug || 'fifa-world'
      };
    }) || [];
    
    res.status(200).json({ matches, lastUpdate: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scores', message: error.message });
  }
};
