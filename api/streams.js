module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const streams = [
    {
      name: 'Yalla Shoot',
      url: 'https://yallashoot.com',
      quality: 'HD',
      language: 'Arabic',
      type: 'website'
    },
    {
      name: 'LiveTV',
      url: 'https://livetv.sx',
      quality: 'HD',
      language: 'Multi',
      type: 'website'
    },
    {
      name: 'Stream2Watch',
      url: 'https://stream2watch.com',
      quality: 'SD/HD',
      language: 'English',
      type: 'website'
    },
    {
      name: 'VIPLeague',
      url: 'https://vipleague.com',
      quality: 'SD/HD',
      language: 'Multi',
      type: 'website'
    },
    {
      name: 'CricFree',
      url: 'https://cricfree.org',
      quality: 'SD/HD',
      language: 'English',
      type: 'website'
    },
    {
      name: 'SportRAR',
      url: 'https://sportrar.com',
      quality: 'HD',
      language: 'Multi',
      type: 'website'
    },
    {
      name: 'Rojadirecta',
      url: 'https://rojadirecta.me',
      quality: 'SD/HD',
      language: 'Spanish',
      type: 'website'
    },
    {
      name: 'FBStream',
      url: 'https://fbstream.io',
      quality: 'HD',
      language: 'English',
      type: 'website'
    }
  ];
  
  // IPTV M3U playlists from iptv-org
  const iptvPlaylists = [
    {
      name: 'All Sports Channels',
      url: 'https://iptv-org.github.io/iptv/index.category.m3u',
      description: 'All sports channels worldwide'
    },
    {
      name: 'beIN Sports',
      url: 'https://iptv-org.github.io/iptv/index.m3u',
      description: 'beIN Sports channels'
    }
  ];
  
  res.status(200).json({
    streams,
    iptv: {
      note: 'Copy M3U link and paste into VLC or IPTV player',
      playlists: iptvPlaylists,
      fullPlaylist: 'https://iptv-org.github.io/iptv/index.m3u',
      sportsPlaylist: 'https://iptv-org.github.io/iptv/index.category.m3u'
    }
  });
};
