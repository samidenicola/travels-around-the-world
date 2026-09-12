import './journey-summary.css'
import { state, on } from '../state.js'
import { getMapContainer } from './map-surface.js'
import { escapeHtml } from '../utils.js'

let summaryEl = null

function getChronologicalPoints() {
  const visited = [...state.visitedPlaces].filter(p => p.x_pct != null && p.y_pct != null)

  visited.sort((a, b) => {
    if (a.date_from && b.date_from) return a.date_from.localeCompare(b.date_from)
    if (a.date_from) return -1
    if (b.date_from) return 1
    return 0
  })

  const points = visited.map(p => ({ x: p.x_pct, y: p.y_pct }))

  if (state.currentLocation && state.currentLocation.x_pct != null && state.currentLocation.y_pct != null) {
    points.push({ x: state.currentLocation.x_pct, y: state.currentLocation.y_pct })
  }

  return points
}

function countUniqueCountries() {
  const countries = new Set()
  state.visitedPlaces.forEach(p => {
    if (p.country) countries.add(p.country)
  })
  if (state.currentLocation?.country) {
    countries.add(state.currentLocation.country)
  }
  return countries.size
}

function getDateRange() {
  const dates = []
  state.visitedPlaces.forEach(p => {
    if (p.date_from) dates.push(p.date_from)
    if (p.date_to) dates.push(p.date_to)
  })
  if (dates.length === 0) return null

  dates.sort()
  const earliest = dates[0]
  const latest = dates[dates.length - 1]

  if (earliest === latest) return earliest
  return `${earliest} - ${latest}`
}

function drawTrailLine() {
  const container = getMapContainer()
  if (!container) return

  const svg = container.querySelector('.map-trail')
  if (!svg) return

  svg.innerHTML = ''

  const points = getChronologicalPoints()
  if (points.length < 2) return

  const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ')

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline')
  polyline.setAttribute('points', pointsStr)
  polyline.setAttribute('stroke', '#a0522d')
  polyline.setAttribute('stroke-width', '0.3')
  polyline.setAttribute('stroke-dasharray', '1,0.8')
  polyline.setAttribute('fill', 'none')
  polyline.setAttribute('opacity', '0.45')
  polyline.setAttribute('stroke-linecap', 'round')
  polyline.setAttribute('stroke-linejoin', 'round')
  polyline.classList.add('journey-trail')

  svg.appendChild(polyline)
}

function createSummaryCard() {
  const container = getMapContainer()
  if (!container) return

  if (summaryEl) {
    summaryEl.remove()
    summaryEl = null
  }

  const cityCount = state.visitedPlaces.length + (state.currentLocation ? 1 : 0)
  const countryCount = countUniqueCountries()

  if (cityCount === 0) return

  const dateRange = getDateRange()
  const dateHtml = dateRange
    ? `<div class="journey-summary-dates">${escapeHtml(dateRange)}</div>`
    : ''

  const el = document.createElement('div')
  el.className = 'journey-summary-control'
  el.innerHTML = `
    <div class="journey-summary-card">
      <span class="journey-summary-corner--tl"></span>
      <span class="journey-summary-corner--br"></span>
      <div class="journey-summary-label">journey so far</div>
      <div class="journey-summary-stats">
        <div class="journey-stat">
          <span class="journey-stat-number">${cityCount}</span>
          <span class="journey-stat-label">${cityCount === 1 ? 'city' : 'cities'}</span>
        </div>
        <span class="journey-stat-divider"></span>
        <div class="journey-stat">
          <span class="journey-stat-number">${countryCount}</span>
          <span class="journey-stat-label">${countryCount === 1 ? 'country' : 'countries'}</span>
        </div>
      </div>
      ${dateHtml}
    </div>
  `

  container.parentElement.appendChild(el)
  summaryEl = el
}

function refresh() {
  if (!state.dataLoaded) return
  drawTrailLine()
  createSummaryCard()
}

export function initJourneySummary() {
  on('dataLoaded', refresh)
  on('currentLocation', refresh)
  on('visitedPlaces', refresh)
}
