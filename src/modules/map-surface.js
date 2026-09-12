import './map-surface.css'

let mapContainer = null

export function getMapContainer() {
  return mapContainer
}

const LEGEND_PIN_CURRENT = `<svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 0.5C8.5 0.5 0.8 8 0.8 17.3C0.8 30 18 43.5 18 43.5S35.2 30 35.2 17.3C35.2 8 27.5 0.5 18 0.5Z" fill="#c0392b"/>
  <circle cx="18" cy="16" r="6" fill="#fdf6e3" opacity="0.9"/>
</svg>`

const LEGEND_PIN_VISITED = `<svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 0.5C5.8 0.5 0.8 5.3 0.8 11.3C0.8 19.8 12 31.5 12 31.5S23.2 19.8 23.2 11.3C23.2 5.3 18.2 0.5 12 0.5Z" fill="#c8884d"/>
  <circle cx="12" cy="10.5" r="4" fill="#fdf6e3" opacity="0.7"/>
</svg>`

const LEGEND_PIN_STOP = `<svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 0.5C5.8 0.5 0.8 5.3 0.8 11.3C0.8 19.8 12 31.5 12 31.5S23.2 19.8 23.2 11.3C23.2 5.3 18.2 0.5 12 0.5Z" fill="#9ba8b7" stroke="#8895a5" stroke-width="0.5" stroke-dasharray="2 1.5"/>
  <circle cx="12" cy="10.5" r="4" fill="#fdf6e3" opacity="0.5"/>
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
          <div class="map-legend-item">
            <span class="map-legend-icon map-legend-icon--stop">${LEGEND_PIN_STOP}</span>
            <span class="map-legend-text map-legend-text--stop">up next</span>
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
