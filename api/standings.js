const ESPN_BASE = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    const resp = await fetch(ESPN_BASE);
    if (!resp.ok) return res.status(resp.status).json({ error: 'ESPN API error' });
    const data = await resp.json();

    const groups = (data.children || []).map(group => ({
      name: group.name || group.standings?.entries?.[0]?.team?.displayName || 'Unknown',
      standings: (group.standings?.entries || []).map(entry => ({
        team: entry.team?.displayName || 'TBD',
        abbreviation: entry.team?.abbreviation || '',
        logo: entry.team?.logo || '',
        stats: (entry.stats || []).reduce((acc, s) => {
          acc[s.name] = s.value ?? s.displayValue;
          return acc;
        }, {}),
      })),
    }));

    return res.status(200).json({ groups });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch standings', details: err.message });
  }
}