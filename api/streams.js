const STREAMING_LINKS = {
  us: [
    { name: 'FOX Sports', url: 'https://www.foxsports.com/live', region: 'US', free: false },
    { name: 'Telemundo', url: 'https://www.telemundo.com/deportes', region: 'US', free: true },
    { name: 'Peacock', url: 'https://www.peacocktv.com/sports', region: 'US', free: false },
  ],
  uk: [
    { name: 'BBC iPlayer', url: 'https://www.bbc.co.uk/iplayer', region: 'UK', free: true },
    { name: 'ITVX', url: 'https://www.itvx.com', region: 'UK', free: true },
  ],
  global: [
    { name: 'FIFA+', url: 'https://www.fifa.com/fifaplus', region: 'Global', free: true },
  ],
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

  const region = (req.query.region || 'global').toLowerCase();
  const streams = [...(STREAMING_LINKS[region] || []), ...STREAMING_LINKS.global];

  return res.status(200).json({ region, streams });
}