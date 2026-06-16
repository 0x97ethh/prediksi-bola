// State
let currentTab = 'matches';
let matchesData = [];
let darkMode = localStorage.getItem('darkMode') !== 'false';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  loadData();
  
  // Auto-refresh every 60 seconds
  setInterval(loadData, 60000);
});

// Theme
function initTheme() {
  if (!darkMode) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  updateThemeButton();
}

function toggleTheme() {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  if (darkMode) {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById('theme-toggle');
  btn.textContent = darkMode ? '☀️' : '🌙';
}

// Tabs
function initTabs() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tab);
  });
}

// Data Loading
async function loadData() {
  try {
    await Promise.all([
      loadMatches(),
      loadStandings(),
      loadStreams()
    ]);
    updateLastUpdate();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

async function loadMatches() {
  try {
    const response = await fetch('/api/scores');
    const data = await response.json();
    
    matchesData = data.matches || [];
    renderMatches(matchesData);
    renderPredictions(matchesData);
    updateLiveCount(matchesData);
  } catch (error) {
    console.error('Error loading matches:', error);
    document.getElementById('matches-list').innerHTML = 
      '<div class="loading">Error loading matches. Retrying...</div>';
  }
}

async function loadStandings() {
  try {
    const response = await fetch('/api/standings');
    const data = await response.json();
    
    renderStandings(data.standings || []);
  } catch (error) {
    console.error('Error loading standings:', error);
    document.getElementById('standings-list').innerHTML = 
      '<div class="loading">Error loading standings</div>';
  }
}

async function loadStreams() {
  try {
    const response = await fetch('/api/streams');
    const data = await response.json();
    
    renderStreams(data.streams || [], data.iptv || {});
  } catch (error) {
    console.error('Error loading streams:', error);
    document.getElementById('streams-list').innerHTML = 
      '<div class="loading">Error loading streams</div>';
  }
}

// Render Functions
function renderMatches(matches) {
  const container = document.getElementById('matches-list');
  
  if (!matches || matches.length === 0) {
    container.innerHTML = '<div class="loading">No matches scheduled today</div>';
    return;
  }
  
  container.innerHTML = matches.map(match => {
    const isLive = match.statusCode === 'in';
    const isFinished = match.statusCode === 'post';
    const statusClass = isLive ? 'live' : (isFinished ? 'finished' : 'upcoming');
    const statusText = isLive ? `🔴 LIVE ${match.clock}` : (isFinished ? 'FT' : formatTime(match.date));
    
    return `
      <div class="match-card ${isLive ? 'live' : ''}">
        <div class="match-header">
          <span class="league">${match.league}</span>
          <span class="status ${statusClass}">${statusText}</span>
        </div>
        <div class="teams">
          <div class="team">
            <img class="team-logo" src="${match.home.logo}" alt="${match.home.shortName}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>⚽</text></svg>'">
            <span class="team-name">${match.home.shortName}</span>
          </div>
          <div class="score">
            ${isLive || isFinished ? `${match.home.score} - ${match.away.score}` : '<span class="vs">VS</span>'}
          </div>
          <div class="team">
            <img class="team-logo" src="${match.away.logo}" alt="${match.away.shortName}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>⚽</text></svg>'">
            <span class="team-name">${match.away.shortName}</span>
          </div>
        </div>
        <div class="match-footer">
          <span class="venue">📍 ${match.venue}</span>
          <button class="btn-icon" onclick="showPrediction('${match.home.name}', '${match.away.name}')" title="View prediction">🎯</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderPredictions(matches) {
  const container = document.getElementById('predictions-list');
  
  if (!matches || matches.length === 0) {
    container.innerHTML = '<div class="loading">No matches to predict</div>';
    return;
  }
  
  // Generate predictions for each match
  const predictions = matches.map(match => {
    const homeStrength = getTeamStrength(match.home.name);
    const awayStrength = getTeamStrength(match.away.name);
    
    const homeWinProb = Math.min(70, Math.max(20, 45 + (homeStrength - awayStrength) * 5 + 10));
    const drawProb = Math.min(35, Math.max(15, 28 - Math.abs(homeStrength - awayStrength) * 3));
    const awayWinProb = 100 - homeWinProb - drawProb;
    
    const expectedGoals = Math.min(4, Math.max(1.5, 2.5 + (homeStrength + awayStrength) / 20));
    
    return {
      match: match,
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
      }
    };
  });
  
  container.innerHTML = predictions.map(pred => `
    <div class="prediction-card">
      <div class="prediction-header">
        <h3>${pred.match.home.shortName} vs ${pred.match.away.shortName}</h3>
        <span class="status upcoming">${formatTime(pred.match.date)}</span>
      </div>
      
      <div class="probabilities">
        <div class="prob-item">
          <div class="prob-value">${pred.prediction.homeWin}%</div>
          <div class="prob-label">🏠 Home Win</div>
        </div>
        <div class="prob-item">
          <div class="prob-value">${pred.prediction.draw}%</div>
          <div class="prob-label">🤝 Draw</div>
        </div>
        <div class="prob-item">
          <div class="prob-value">${pred.prediction.awayWin}%</div>
          <div class="prob-label">✈️ Away Win</div>
        </div>
      </div>
      
      <div class="goals-section">
        <h4>⚽ Goals Prediction</h4>
        <div class="goals-grid">
          <div class="goal-item">
            <div class="goal-value">${pred.goals.over25}%</div>
            <div class="goal-label">Over 2.5</div>
          </div>
          <div class="goal-item">
            <div class="goal-value">${pred.goals.under25}%</div>
            <div class="goal-label">Under 2.5</div>
          </div>
          <div class="goal-item">
            <div class="goal-value">${pred.goals.bttsYes}%</div>
            <div class="goal-label">BTTS Yes</div>
          </div>
          <div class="goal-item">
            <div class="goal-value">${pred.goals.expectedTotal}</div>
            <div class="goal-label">Expected Goals</div>
          </div>
        </div>
      </div>
      
      <div class="advice">
        <h4>💡 Advice</h4>
        <ul>
          ${generateAdvice(pred.prediction.homeWin, pred.prediction.draw, pred.prediction.awayWin, parseFloat(pred.goals.expectedTotal)).map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');
}

function renderStandings(standings) {
  const container = document.getElementById('standings-list');
  
  if (!standings || standings.length === 0) {
    container.innerHTML = '<div class="loading">No standings available</div>';
    return;
  }
  
  container.innerHTML = standings.map(group => `
    <div class="standings-group">
      <h3>${group.name}</h3>
      <table class="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          ${group.standings.map((team, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>
                <div class="team-cell">
                  <img src="${team.logo}" alt="${team.shortName}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>⚽</text></svg>'">
                  <span>${team.name}</span>
                </div>
              </td>
              <td>${team.played}</td>
              <td>${team.wins}</td>
              <td>${team.draws}</td>
              <td>${team.losses}</td>
              <td>${team.goalDiff > 0 ? '+' : ''}${team.goalDiff}</td>
              <td class="points">${team.points}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}

function renderStreams(streams, iptv) {
  const container = document.getElementById('streams-list');
  
  let html = streams.map(stream => `
    <div class="stream-card">
      <div class="stream-info">
        <h3>${stream.name}</h3>
        <div class="stream-meta">
          <span>📺 ${stream.quality}</span>
          <span>🌐 ${stream.language}</span>
        </div>
      </div>
      <a href="${stream.url}" target="_blank" rel="noopener" class="stream-btn">Watch</a>
    </div>
  `).join('');
  
  // Add IPTV section
  if (iptv && iptv.playlists) {
    html += `
      <div class="iptv-section">
        <h3>📡 IPTV Playlists (Copy to VLC)</h3>
        <p style="margin-bottom: 1rem; color: var(--text-secondary);">
          Copy M3U link and paste into VLC → Media → Open Network Stream
        </p>
        <div class="iptv-links">
          <div class="iptv-link">
            <div>
              <strong>All Sports Channels</strong><br>
              <small style="color: var(--text-secondary)">All sports channels worldwide</small>
            </div>
            <button class="copy-btn" onclick="copyToClipboard('${iptv.playlists[0]?.url || ''}')">📋 Copy</button>
          </div>
          <div class="iptv-link">
            <div>
              <strong>Full Playlist (All Channels)</strong><br>
              <small style="color: var(--text-secondary)">8000+ channels worldwide</small>
            </div>
            <button class="copy-btn" onclick="copyToClipboard('${iptv.fullPlaylist || ''}')">📋 Copy</button>
          </div>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// Helper Functions
function formatTime(dateString) {
  if (!dateString) return 'TBD';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 0) return 'Started';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  
  return date.toLocaleDateString('id-ID', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function updateLiveCount(matches) {
  const liveCount = matches.filter(m => m.statusCode === 'in').length;
  const badge = document.getElementById('live-count');
  badge.textContent = `${liveCount} LIVE`;
  badge.style.display = liveCount > 0 ? 'block' : 'none';
}

function updateLastUpdate() {
  const now = new Date().toLocaleTimeString('id-ID');
  document.getElementById('last-update').textContent = `Last update: ${now}`;
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

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Link copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
    // Fallback
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    alert('Link copied!');
  });
}

// Event Listeners
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
document.getElementById('refresh-btn').addEventListener('click', () => {
  document.getElementById('refresh-btn').textContent = '⏳';
  loadData().then(() => {
    document.getElementById('refresh-btn').textContent = '🔄';
  });
});
