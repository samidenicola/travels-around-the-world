import './map-surface.css'

let mapContainer = null

export function getMapContainer() {
  return mapContainer
}

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
    </div>
    <div class="map-footer">
      <span class="map-footer-text">made with love</span>
    </div>
  `

  container.appendChild(wrapper)
  mapContainer = wrapper.querySelector('.map-container')

  return mapContainer
}
