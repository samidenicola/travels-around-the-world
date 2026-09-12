import './markers.css'
import { state, on } from '../state.js'
import { getMapContainer } from './map-surface.js'
import { showHoverCard, hideHoverCard } from './hover-cards.js'
import { escapeHtml } from '../utils.js'

const rotations = [-3, 1, -1.5, 2.5, -0.5, 3, -2, 1.5]

const PIN_SVG_CURRENT = `<svg viewBox="0 0 40 58" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="20" y1="22" x2="20" y2="57" stroke="#a0a0a0" stroke-width="4" stroke-linecap="round"/>
  <circle cx="20" cy="16" r="15.5" fill="#c0392b"/>
  <circle cx="15" cy="10" r="4.5" fill="#e74c3c" opacity="0.45"/>
  <circle cx="20" cy="16" r="5.5" fill="#fdf6e3" opacity="0.3"/>
</svg>`

const PIN_SVG_VISITED = `<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="12" y1="14" x2="12" y2="35" stroke="#a8a8a8" stroke-width="3" stroke-linecap="round"/>
  <circle cx="12" cy="11" r="10.5" fill="#cc7722"/>
  <circle cx="9" cy="7.5" r="3" fill="#e8943a" opacity="0.4"/>
</svg>`

const PIN_SVG_STOP = `<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="12" y1="14" x2="12" y2="35" stroke="#a8a8a8" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 2"/>
  <circle cx="12" cy="11" r="10.5" fill="#4a9ea6"/>
  <circle cx="9" cy="7.5" r="3" fill="#6bbac2" opacity="0.35"/>
</svg>`

let placementMode = null
let placementCallback = null
let contextMenu = null

function createCurrentPin(loc) {
  const safeCity = escapeHtml(loc.city)
  const pin = document.createElement('div')
  pin.className = 'map-pin map-pin--current'
  pin.style.left = `${loc.x_pct}%`
  pin.style.top = `${loc.y_pct}%`
  pin.innerHTML = `
    <div class="marker-current">
      <div class="marker-current-ring"></div>
      <div class="marker-current-ring"></div>
      <div class="marker-current-pin">${PIN_SVG_CURRENT}</div>
      <div class="marker-current-label">${safeCity}</div>
    </div>
  `
  return pin
}

function createVisitedPin(place, index) {
  const safeCity = escapeHtml(place.city)
  const rot = rotations[index % rotations.length]
  const pin = document.createElement('div')
  pin.className = 'map-pin map-pin--visited'
  pin.style.left = `${place.x_pct}%`
  pin.style.top = `${place.y_pct}%`
  pin.innerHTML = `
    <div class="marker-visited" style="--float-delay: ${index * 0.5}s; --rot: ${rot}deg">
      <div class="marker-visited-pin">${PIN_SVG_VISITED}</div>
      <div class="marker-visited-label">${safeCity}</div>
    </div>
  `
  return pin
}

function createStopPin(stop, index) {
  const safeCity = escapeHtml(stop.city)
  const delay = index * 0.8
  const pin = document.createElement('div')
  pin.className = 'map-pin map-pin--stop'
  pin.style.left = `${stop.x_pct}%`
  pin.style.top = `${stop.y_pct}%`
  pin.innerHTML = `
    <div class="marker-stop" style="--bob-delay: ${delay}s">
      <div class="marker-stop-pin">${PIN_SVG_STOP}</div>
      <div class="marker-stop-label">${safeCity}</div>
    </div>
  `
  return pin
}

function bindPinEvents(pinEl, data, type) {
  const inner = pinEl.querySelector('.marker-current, .marker-visited, .marker-stop')
  if (!inner) return

  inner.addEventListener('mouseenter', (e) => {
    const containerRect = getMapContainer().getBoundingClientRect()
    const pinRect = inner.getBoundingClientRect()
    const point = {
      x: pinRect.left - containerRect.left + pinRect.width / 2,
      y: pinRect.top - containerRect.top,
    }
    showHoverCard(data, type, point)
  })

  inner.addEventListener('mouseleave', () => {
    hideHoverCard()
  })

  inner.addEventListener('click', (e) => {
    e.stopPropagation()
    const containerRect = getMapContainer().getBoundingClientRect()
    const pinRect = inner.getBoundingClientRect()
    const point = {
      x: pinRect.left - containerRect.left + pinRect.width / 2,
      y: pinRect.top - containerRect.top,
    }
    showHoverCard(data, type, point, true)
  })
}

function removeContextMenu() {
  if (contextMenu) {
    contextMenu.remove()
    contextMenu = null
  }
}

function showContextMenu(x_pct, y_pct, clickX, clickY) {
  removeContextMenu()

  const container = getMapContainer()
  const menu = document.createElement('div')
  menu.className = 'map-context-menu'

  const containerRect = container.getBoundingClientRect()
  let left = clickX - containerRect.left
  let top = clickY - containerRect.top

  if (left + 180 > containerRect.width) left = containerRect.width - 190
  if (top + 140 > containerRect.height) top = containerRect.height - 150
  if (left < 10) left = 10
  if (top < 10) top = 10

  menu.style.left = left + 'px'
  menu.style.top = top + 'px'

  menu.innerHTML = `
    <div class="map-context-title">what is this?</div>
    <button class="map-context-option" data-type="current">current location</button>
    <button class="map-context-option" data-type="visited">visited place</button>
    <button class="map-context-option" data-type="stop">potential stop</button>
  `

  container.appendChild(menu)
  contextMenu = menu

  menu.querySelectorAll('.map-context-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const type = btn.dataset.type
      removeContextMenu()
      if (placementCallback) {
        placementCallback(type, x_pct, y_pct)
      }
    })
  })

  const dismiss = (e) => {
    if (!menu.contains(e.target)) {
      removeContextMenu()
      document.removeEventListener('click', dismiss)
    }
  }
  setTimeout(() => document.addEventListener('click', dismiss), 0)
}

export function enablePlacementMode(callback) {
  placementMode = true
  placementCallback = callback
  const container = getMapContainer()
  if (container) container.classList.add('placement-mode')
}

export function disablePlacementMode() {
  placementMode = false
  placementCallback = null
  removeContextMenu()
  const container = getMapContainer()
  if (container) container.classList.remove('placement-mode')
}

export function renderMarkers() {
  const container = getMapContainer()
  if (!container) return

  const pinsContainer = container.querySelector('.map-pins')
  if (!pinsContainer) return

  pinsContainer.innerHTML = ''

  if (state.currentLocation && state.currentLocation.x_pct != null && state.currentLocation.y_pct != null) {
    const pin = createCurrentPin(state.currentLocation)
    bindPinEvents(pin, state.currentLocation, 'current')
    pinsContainer.appendChild(pin)
  }

  state.visitedPlaces.forEach((place, i) => {
    if (place.x_pct == null || place.y_pct == null) return
    const pin = createVisitedPin(place, i)
    bindPinEvents(pin, place, 'visited')
    pinsContainer.appendChild(pin)
  })

  state.potentialStops.forEach((stop, i) => {
    if (stop.x_pct == null || stop.y_pct == null) return
    const pin = createStopPin(stop, i)
    bindPinEvents(pin, stop, 'stop')
    pinsContainer.appendChild(pin)
  })
}

export function initMarkers() {
  on('dataLoaded', () => renderMarkers())
  on('currentLocation', () => renderMarkers())
  on('visitedPlaces', () => renderMarkers())
  on('potentialStops', () => renderMarkers())

  const container = getMapContainer()
  if (!container) return

  const mapImage = container.querySelector('.map-image')
  if (!mapImage) return

  container.addEventListener('click', (e) => {
    if (!state.isAdmin) return
    if (!placementMode) return

    const rect = mapImage.getBoundingClientRect()
    const x_pct = ((e.clientX - rect.left) / rect.width) * 100
    const y_pct = ((e.clientY - rect.top) / rect.height) * 100

    if (x_pct < 0 || x_pct > 100 || y_pct < 0 || y_pct > 100) return

    if (placementCallback) {
      placementCallback(x_pct, y_pct)
    }
  })
}
