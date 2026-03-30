// admin/review.js — Editorial review dashboard logic
//
// Loads data/scored_claims.json, renders each claim,
// lets editors approve or reject, then writes the updated file.
//
// In production this runs against the GitHub API to read/write files.
// For local use it reads from the relative data/ path.

const LANGS = ['en', 'de', 'fr', 'ja', 'es', 'pt', 'ko', 'hi']
const LANG_LABELS = { en:'EN', de:'DE', fr:'FR', ja:'JA', es:'ES', pt:'PT', ko:'KO', hi:'HI' }

let allClaims = []
let filterRegion = 'ALL'
let filterStatus = 'ALL'
let activeLang = 'en'

// ── Boot ──────────────────────────────────────────────────────────

async function init() {
  renderLoading()
  try {
    const resp = await fetch('../data/scored_claims.json')
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    allClaims = data.claims || []
    renderStats(data)
    render()
  } catch (err) {
    document.getElementById('claims-container').innerHTML =
      `<div class="empty"><h2>Could not load scored_claims.json</h2>
       <p>Run the pipeline first, or check that data/scored_claims.json exists.</p>
       <p style="margin-top:8px;font-size:12px;color:#C0B8B0">${err.message}</p></div>`
  }
}

// ── Rendering ─────────────────────────────────────────────────────

function renderLoading() {
  document.getElementById('claims-container').innerHTML =
    '<div class="loading">Loading claims…</div>'
}

function renderStats(data) {
  const stats = data.global_stats || {}
  const approved = allClaims.filter(c => c.editorial_approved === true).length
  const rejected = allClaims.filter(c => c.editorial_approved === false && c._rejected).length
  const pending  = allClaims.length - approved - rejected

  document.getElementById('stats-bar').innerHTML = `
    <div class="stat-chip">Total: <strong>${allClaims.length}</strong></div>
    <div class="stat-chip">Approved: <strong>${approved}</strong></div>
    <div class="stat-chip">Pending: <strong>${pending}</strong></div>
    <div class="stat-chip">Misleading: <strong>${stats.misleading_pct || '—'}</strong></div>
    <div class="stat-chip">Most active: <strong>${stats.most_active_region || '—'}</strong></div>
    <div class="stat-chip headline">${data.week_headline?.en || ''}</div>
  `
  updatePublishBar()
}

function render() {
  const filtered = allClaims.filter(c => {
    if (filterRegion !== 'ALL' && c.primary_region !== filterRegion) return false
    if (filterStatus === 'APPROVED' && c.editorial_approved !== true) return false
    if (filterStatus === 'PENDING'  && (c.editorial_approved === true || c._rejected)) return false
    if (filterStatus === 'REJECTED' && !c._rejected) return false
    return true
  })

  if (!filtered.length) {
    document.getElementById('claims-container').innerHTML =
      '<div class="empty"><h2>No claims match this filter</h2></div>'
    return
  }

  document.getElementById('claims-container').innerHTML =
    filtered.map(c => renderCard(c)).join('')
}

function renderCard(claim) {
  const t   = claim.translations?.[activeLang] || claim.translations?.en || {}
  const score = claim.score || 0
  const scoreType = claim.score_type || 'mixed'
  const status = claim.editorial_approved === true ? 'approved'
               : claim._rejected ? 'rejected' : 'pending'
  const statusLabel = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending review'

  const langStrip = LANGS.map(l => {
    const hasTranslation = claim.translations?.[l]
    return `<span class="lang-pill ${l === activeLang ? 'active' : ''} ${hasTranslation ? '' : 'missing'}"
              onclick="setLang('${l}', ${claim.rank})">${LANG_LABELS[l]}</span>`
  }).join('')

  const sources = (t.sources || []).map(s =>
    `<span class="source-chip">${s}</span>`).join('')

  const regionScores = Object.entries(claim.regional_scores || {}).map(([r, d]) =>
    `<span class="claim-region">${r} ${d.score}</span>`).join('')

  return `
    <div class="claim-card ${status}" id="card-${claim.rank}" data-rank="${claim.rank}">
      <div class="card-header">
        <div class="claim-meta">
          <span class="claim-tag">${claim.claim_tag || ''}</span>
          <span class="claim-region">${claim.primary_region || 'GLOBAL'}</span>
          <span class="claim-source">${claim.platform || ''} · ${claim.hours_ago || 0}h ago</span>
        </div>
        <div class="score-badge ${scoreType}">
          <span class="score-num">${score}</span>
          <span class="score-label">${t.score_label || ''}</span>
        </div>
      </div>

      <div class="lang-strip">${langStrip}</div>

      <div class="claim-text">${t.claim_display || claim.claim || ''}</div>
      <div class="verdict">${t.verdict || ''}</div>

      ${t.brit_take ? `
        <div class="brit-take">
          <div class="brit-take-label">Brit Take</div>
          ${t.brit_take}
        </div>` : ''}

      <div class="sources">${sources}</div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;font-size:11px">
        ${regionScores}
      </div>

      <div class="card-actions">
        <button class="btn btn-approve" onclick="approve(${claim.rank})">Approve</button>
        <button class="btn btn-reject"  onclick="reject(${claim.rank})">Reject</button>
        ${claim.url ? `<a class="btn btn-link" href="${claim.url}" target="_blank" rel="noopener">Source</a>` : ''}
        <span class="status-badge ${status}">${statusLabel}</span>
      </div>
    </div>
  `
}

// ── Actions ───────────────────────────────────────────────────────

function approve(rank) {
  const claim = allClaims.find(c => c.rank === rank)
  if (!claim) return
  claim.editorial_approved = true
  delete claim._rejected
  refreshCard(rank)
  updatePublishBar()
}

function reject(rank) {
  const claim = allClaims.find(c => c.rank === rank)
  if (!claim) return
  claim.editorial_approved = false
  claim._rejected = true
  refreshCard(rank)
  updatePublishBar()
}

function refreshCard(rank) {
  const claim = allClaims.find(c => c.rank === rank)
  if (!claim) return
  const el = document.getElementById(`card-${rank}`)
  if (!el) return
  const tmp = document.createElement('div')
  tmp.innerHTML = renderCard(claim)
  el.replaceWith(tmp.firstElementChild)
}

function setLang(lang, rank) {
  activeLang = lang
  // Only re-render the specific card if rank is given, otherwise re-render all
  if (rank) {
    refreshCard(rank)
  } else {
    render()
  }
  // Update filter lang pills
  document.querySelectorAll('.filter-lang').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === lang)
  })
}

function setFilter(type, value) {
  if (type === 'region') filterRegion = value
  if (type === 'status') filterStatus = value
  document.querySelectorAll(`.filter-${type}`).forEach(el => {
    el.classList.toggle('active', el.dataset.value === value)
  })
  render()
}

function updatePublishBar() {
  const approved = allClaims.filter(c => c.editorial_approved === true).length
  document.getElementById('publish-summary').innerHTML =
    `<strong>${approved}</strong> of <strong>${allClaims.length}</strong> claims approved`
  document.getElementById('btn-publish').disabled = approved === 0
}

async function publishApproved() {
  const approved = allClaims.filter(c => c.editorial_approved === true)
  if (!approved.length) return alert('No approved claims to publish.')

  const json = JSON.stringify({ claims: allClaims }, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'scored_claims.json'
  a.click()
  URL.revokeObjectURL(url)

  alert(`Downloaded scored_claims.json with ${approved.length} approved claims.\n\nReplace data/scored_claims.json in the repo and run build_json.py to publish.`)
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init)
