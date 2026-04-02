// scripts/app.js — Yummy Wellness shared JS
// Nav active states, feed toggle logic, global panel logic

// ── Nav active state ──────────────────────────────────────────────
(function setNavActive() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href').replace(/\/$/, '') || '/';
    if (href === path || (path === '/' && href === '/index.html') || (path === '/index.html' && href === '/')) {
      link.classList.add('active');
    }
  });
})();

// ── Feed toggle ───────────────────────────────────────────────────
function toggleCard(row, card) {
  const isOpen = card.classList.contains('open');

  // Close all
  document.querySelectorAll('.topic-row.open').forEach(r => r.classList.remove('open'));
  document.querySelectorAll('.claim-card.open').forEach(c => c.classList.remove('open'));

  // Open clicked one (if it was closed)
  if (!isOpen) {
    row.classList.add('open');
    card.classList.add('open');
    // Scroll into view after animation
    setTimeout(() => {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}

// ── Global panel ──────────────────────────────────────────────────
const stanceMap = {
  mainstream: 'mainstream',
  legal:      'legal',
  restricted: 'restricted',
  banned:     'banned',
  fringe:     'fringe',
  contested:  'contested',
};

function openGlobal(claims, index) {
  const c = claims[index];

  document.getElementById('panelClaimTitle').textContent = c.title || c.claim || '';

  const marker = document.getElementById('consensusMarker');
  marker.style.left        = c.consensusPos  || `${c.scoreVal || c.score || 50}%`;
  marker.style.borderColor = c.consensusBorder || '#ef9f27';

  // Stats: fallback data has stats[], live data has sources[]
  if (c.stats && c.stats.length) {
    document.getElementById('panelStats').innerHTML = c.stats.map(s => `
      <div class="stat-box">
        <div class="stat-number">${s.val}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');
  } else if (c.sources && c.sources.length) {
    document.getElementById('panelStats').innerHTML = c.sources.map(s => `
      <div class="stat-box source-stat">
        <div class="stat-number">📄</div>
        <div class="stat-label">${s}</div>
      </div>
    `).join('');
  } else {
    document.getElementById('panelStats').innerHTML = '';
  }

  // Opinions: fallback data has opinions[], live data has global_opinion string
  if (c.opinions && c.opinions.length) {
    document.getElementById('panelOpinions').innerHTML = c.opinions.map(o => `
      <div class="opinion-card">
        <div class="opinion-header">
          <div class="opinion-region">
            <span class="opinion-flag">${o.flag}</span>${o.region}
          </div>
          <span class="stance-pill stance-${stanceMap[o.stance] || o.stance}">${o.stanceLabel}</span>
        </div>
        <p class="opinion-note">${o.note}</p>
      </div>
    `).join('');
  } else if (c.global_opinion) {
    document.getElementById('panelOpinions').innerHTML = `
      <div class="global-opinion-text">
        <p>${c.global_opinion}</p>
      </div>
    `;
  } else {
    document.getElementById('panelOpinions').innerHTML = '';
  }

  document.getElementById('panelFooter').textContent = c.footer || 'Powered by Yummy Wellness. Updated daily.';
  document.getElementById('overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGlobal() {
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('overlay')) closeGlobal();
}

// Close panel on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeGlobal();
});

// ── Trending pills ────────────────────────────────────────────────
function initTrendingPills() {
  document.querySelectorAll('.trend-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      const active = this.classList.contains('active');
      document.querySelectorAll('.trend-pill').forEach(p => p.classList.remove('active'));
      if (!active) this.classList.add('active');
    });
  });
}

document.addEventListener('DOMContentLoaded', initTrendingPills);
