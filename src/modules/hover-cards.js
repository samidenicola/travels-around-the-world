import './hover-cards.css'
import { escapeHtml } from '../utils.js'
import { getMapContainer } from './map-surface.js'

let layer = null
let currentCard = null
let isPinned = false
let hideTimeout = null
let galleryOverlay = null

const WASHI_COLORS = ['--washi-purple', '--washi-pink', '--washi-blue', '--tape-yellow']

function sanitizeUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return encodeURI(decodeURI(url))
    }
    return ''
  } catch {
    return ''
  }
}

export function initHoverCards(container) {
  layer = document.createElement('div')
  layer.className = 'hover-card-layer'
  container.appendChild(layer)

  galleryOverlay = document.createElement('div')
  galleryOverlay.className = 'photo-gallery-overlay'
  container.appendChild(galleryOverlay)

  galleryOverlay.addEventListener('click', (e) => {
    if (e.target === galleryOverlay) closeGallery()
  })

  document.addEventListener('click', (e) => {
    if (isPinned && currentCard && !currentCard.contains(e.target)) {
      removeCard()
    }
  })
}

function removeCard() {
  if (currentCard) {
    currentCard.style.animation = 'flyAway 0.3s ease-in forwards'
    const old = currentCard
    setTimeout(() => old.remove(), 300)
    currentCard = null
    isPinned = false
  }
}

function createPhotoCorners() {
  const positions = [
    { className: 'hover-card-corner hover-card-corner--tl' },
    { className: 'hover-card-corner hover-card-corner--tr' },
    { className: 'hover-card-corner hover-card-corner--bl' },
    { className: 'hover-card-corner hover-card-corner--br' }
  ]
  const frag = document.createDocumentFragment()
  positions.forEach(pos => {
    const corner = document.createElement('div')
    corner.className = pos.className
    frag.appendChild(corner)
  })
  return frag
}

function openGallery(data) {
  if (!galleryOverlay) return
  const images = (data.image_urls || []).map(u => sanitizeUrl(u)).filter(Boolean)
  if (images.length === 0) return

  let dateStr = ''
  if (data.date_from) {
    dateStr = data.date_from === data.date_to
      ? escapeHtml(data.date_from)
      : `${escapeHtml(data.date_from)}${data.date_to ? ' - ' + escapeHtml(data.date_to) : ''}`
  }

  galleryOverlay.innerHTML = `
    <div class="photo-gallery">
      <button class="photo-gallery-close" aria-label="Close">&times;</button>
      <div class="photo-gallery-header">
        <div class="photo-gallery-city">${escapeHtml(data.city)}</div>
        <div class="photo-gallery-country">${escapeHtml(data.country)}</div>
        ${dateStr ? `<div class="photo-gallery-dates">${dateStr}</div>` : ''}
      </div>
      <div class="photo-gallery-grid">
        ${images.map((url, i) => `
          <div class="photo-gallery-frame" style="transform: rotate(${(Math.random() - 0.5) * 6}deg)">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(data.city)} photo ${i + 1}" loading="lazy" />
            <div class="photo-gallery-frame-border"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `

  galleryOverlay.classList.add('open')
  galleryOverlay.querySelector('.photo-gallery-close').addEventListener('click', closeGallery)
}

function closeGallery() {
  if (galleryOverlay) {
    galleryOverlay.classList.remove('open')
  }
}

export function showHoverCard(data, type, point, pin = false) {
  if (isPinned && !pin) return
  clearTimeout(hideTimeout)

  if (currentCard) {
    currentCard.remove()
    currentCard = null
  }

  const card = document.createElement('div')
  card.className = `hover-card hover-card--${escapeHtml(type)}` + (pin ? ' pinned' : '')

  const washiColor = WASHI_COLORS[Math.floor(Math.random() * WASHI_COLORS.length)]
  const tapeAngle = -2 + (Math.random() * 4)
  card.style.setProperty('--washi-tape-color', `var(${washiColor})`)
  card.style.setProperty('--tape-angle', tapeAngle + 'deg')

  card.appendChild(createPhotoCorners())

  if (pin) {
    const dismissBtn = document.createElement('button')
    dismissBtn.className = 'hover-card-dismiss'
    dismissBtn.setAttribute('aria-label', 'Close')
    dismissBtn.innerHTML = '&times;'
    card.appendChild(dismissBtn)
  }

  const body = document.createElement('div')
  body.className = 'hover-card-body'

  if (type === 'current') {
    body.innerHTML = `
      <div class="hover-card-badge">We're here!</div>
      <div class="hover-card-city">${escapeHtml(data.city)}</div>
      <div class="hover-card-country">${escapeHtml(data.country)}</div>
    `
  } else if (type === 'visited') {
    let html = `
      <div class="hover-card-city">${escapeHtml(data.city)}</div>
      <div class="hover-card-country">${escapeHtml(data.country)}</div>
    `
    if (data.date_from) {
      const dateStr = data.date_from === data.date_to
        ? escapeHtml(data.date_from)
        : `${escapeHtml(data.date_from)} - ${escapeHtml(data.date_to)}`
      html += `<div class="hover-card-dates">${dateStr}</div>`
    }
    if (data.image_urls && data.image_urls.length > 0) {
      html += '<div class="hover-card-polaroid-stack">'
      data.image_urls.slice(0, 3).forEach((url, i) => {
        const safeUrl = sanitizeUrl(url)
        if (safeUrl) {
          const rot = (Math.random() - 0.5) * 8
          html += `<div class="hover-card-polaroid" style="transform: rotate(${rot}deg); z-index: ${3 - i};">
            <img src="${escapeHtml(safeUrl)}" alt="${escapeHtml(data.city)}" loading="lazy" />
          </div>`
        }
      })
      html += '</div>'
      if (data.image_urls.length > 0) {
        html += '<button class="hover-card-view-photos">view photos</button>'
      }
    }
    body.innerHTML = html
  } else if (type === 'stop') {
    let html = `
      <div class="hover-card-city">${escapeHtml(data.city)}</div>
      <div class="hover-card-country">${escapeHtml(data.country)}</div>
    `
    if (data.note) {
      html += `<div class="hover-card-note">"${escapeHtml(data.note)}"</div>`
    }
    html += '<div class="hover-card-maybe">maybe next?</div>'
    body.innerHTML = html
  }

  card.appendChild(body)

  const mapContainer = getMapContainer()
  const containerRect = mapContainer
    ? mapContainer.getBoundingClientRect()
    : layer.getBoundingClientRect()
  const layerRect = layer.getBoundingClientRect()

  let left = point.x + (mapContainer ? mapContainer.offsetLeft - layer.offsetLeft : 0) + 20
  let top = point.y + (mapContainer ? mapContainer.offsetTop - layer.offsetTop : 0) - 40

  if (left + 280 > layerRect.width) {
    left = left - 320
  }
  if (top + 200 > layerRect.height) {
    top = layerRect.height - 220
  }
  if (top < 80) top = 80
  if (left < 10) left = 10

  card.style.left = left + 'px'
  card.style.top = top + 'px'

  const randRot = (Math.random() - 0.5) * 4
  card.style.setProperty('--card-rot', randRot + 'deg')
  card.style.transform = `rotate(${randRot}deg)`

  layer.appendChild(card)
  currentCard = card
  isPinned = pin

  if (pin) {
    card.querySelector('.hover-card-dismiss')?.addEventListener('click', (e) => {
      e.stopPropagation()
      removeCard()
    })
  }

  const viewPhotosBtn = card.querySelector('.hover-card-view-photos')
  if (viewPhotosBtn) {
    viewPhotosBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      openGallery(data)
    })
  }
}

export function hideHoverCard() {
  if (isPinned) return
  hideTimeout = setTimeout(() => {
    if (!isPinned && currentCard) {
      removeCard()
    }
  }, 200)
}
