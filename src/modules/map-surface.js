import './map-surface.css'

let mapContainer = null

export function getMapContainer() {
  return mapContainer
}

const LEGEND_PIN_CURRENT = `<svg viewBox="0 0 20 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="10" y1="12" x2="10" y2="29" stroke="#a0a0a0" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="10" cy="9" r="8.5" fill="#c0392b"/>
  <circle cx="7.5" cy="6" r="2.5" fill="#e74c3c" opacity="0.4"/>
</svg>`

const LEGEND_PIN_VISITED = `<svg viewBox="0 0 20 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="10" y1="12" x2="10" y2="29" stroke="#a8a8a8" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="10" cy="9" r="8.5" fill="#cc7722"/>
  <circle cx="7.5" cy="6" r="2.5" fill="#e8943a" opacity="0.35"/>
</svg>`

const LEGEND_PIN_STOP = `<svg viewBox="0 0 20 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="10" y1="12" x2="10" y2="29" stroke="#a8a8a8" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 2"/>
  <circle cx="10" cy="9" r="8.5" fill="#4a9ea6"/>
  <circle cx="7.5" cy="6" r="2.5" fill="#6bbac2" opacity="0.3"/>
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
