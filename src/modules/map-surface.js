import './map-surface.css'

let mapContainer = null

export function getMapContainer() {
  return mapContainer
}

const LEGEND_PIN_CURRENT = `<svg viewBox="0 0 20 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="legendSphere-current" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#e74c3c"/>
      <stop offset="50%" stop-color="#c0392b"/>
      <stop offset="100%" stop-color="#962d22"/>
    </radialGradient>
  </defs>
  <line x1="10" y1="17" x2="10" y2="29" stroke="#aaa" stroke-width="2" stroke-linecap="round"/>
  <circle cx="10" cy="10" r="9" fill="url(#legendSphere-current)"/>
  <ellipse cx="7.5" cy="7" rx="3" ry="2.5" fill="rgba(255,255,255,0.18)"/>
</svg>`

const LEGEND_PIN_VISITED = `<svg viewBox="0 0 20 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="legendSphere-visited" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#e8943a"/>
      <stop offset="50%" stop-color="#cc7722"/>
      <stop offset="100%" stop-color="#a85e15"/>
    </radialGradient>
  </defs>
  <line x1="10" y1="17" x2="10" y2="29" stroke="#b0b0b0" stroke-width="2" stroke-linecap="round"/>
  <circle cx="10" cy="10" r="9" fill="url(#legendSphere-visited)"/>
  <ellipse cx="7.5" cy="7" rx="3" ry="2.5" fill="rgba(255,255,255,0.16)"/>
</svg>`

const LEGEND_PIN_STOP = `<svg viewBox="0 0 20 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="legendSphere-stop" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#6bbac2"/>
      <stop offset="50%" stop-color="#4a9ea6"/>
      <stop offset="100%" stop-color="#387b82"/>
    </radialGradient>
  </defs>
  <line x1="10" y1="17" x2="10" y2="29" stroke="#b0b0b0" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 2"/>
  <circle cx="10" cy="10" r="9" fill="url(#legendSphere-stop)"/>
  <ellipse cx="7.5" cy="7" rx="3" ry="2.5" fill="rgba(255,255,255,0.14)"/>
</svg>`

export function initMapSurface(container) {
  const wrapper = document.createElement('div')
  wrapper.className = 'map-wrapper'

  wrapper.innerHTML = `
    <div class="map-header">
      <div class="header-card">
        <div class="header-pin"></div>
        <div class="header-title">Marlowe & Sebastien</div>
        <div class="header-subtitle">follow our adventures around the world</div>
      </div>
    </div>
    <div class="map-container">
      <img src="/marlowe-map.png" class="map-image" alt="World Map" draggable="false" />
      <svg class="map-trail" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
      <div class="map-pins"></div>
      <div class="map-legend">
        <div class="map-legend-card">
          <div class="map-legend-item">
            <span class="map-legend-icon map-legend-icon--current">${LEGEND_PIN_CURRENT}</span>
            <span class="map-legend-text">here now</span>
          </div>
          <div class="map-legend-item">
            <span class="map-legend-icon map-legend-icon--visited">${LEGEND_PIN_VISITED}</span>
            <span class="map-legend-text map-legend-text--visited">been here</span>
          </div>
        </div>
      </div>
    </div>
    <div class="map-footer">
      <span class="map-footer-text">made with love</span>
    </div>
  `

  container.appendChild(wrapper)
  mapContainer = wrapper.querySelector('.map-container')

  return mapContainer
}
