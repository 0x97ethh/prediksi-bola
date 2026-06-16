const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  try {
    const { dates, matchday } = req.query;
    let url = ESPN_BASE;
    const params = [];
    if (dates) params.push(`dates=${dates}`);
    if (matchday) params.push(`matchday=${matchday}`);
    if (params.length) url += '?' + params.join('&');

    const resp = await fetch(url);
    if (!resp.ok) return res.status(resp.status).json({ error: 'ESPN API error' });
    const data = await resp.json();

    const matches = (data.events || []).map(ev => {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const home = competitors.find(c => c.homeAway === 'home');
      const away = competitors.find(c => c.homeAway === 'away');
      return {
        id: ev.id,
        name: ev.name,
        date: ev.date,
        status: ev.status?.type?.description || 'Unknown',
        statusCode: ev.status?.type?.state || 'unknown',
        home: {
          name: home?.team?.displayName || 'TBD',
          abbreviation: home?.team?.abbreviation || '',
          score: home?.score || '0',
          logo: home?.team?.logo || '',
        },
        away: {
          name: away?.team?.displayName || 'TBD',
          abbreviation: away?.team?.abbreviation || '',
          score: away?.score || '0',
          logo: away?.team?.logo || '',
        },
        venue: comp?.venue?.fullName || '',
        matchday: ev.season?.slug || '',
      };
    });

    return res.status(200).json({ matches, season: data.season, leagues: data.leagues });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch scores', details: err.message });
  }
}