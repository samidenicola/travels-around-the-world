import './dashboard.css'
import { state, update, on } from '../state.js'
import { adminAction, getPublicData } from '../supabase.js'
import { initExport } from './export.js'
import { escapeHtml, escapeAttr } from '../utils.js'
import { enablePlacementMode, disablePlacementMode, renderMarkers } from './markers.js'

let overlay = null
let currentTab = 'notes'
let pendingPlacement = null

export function initDashboard(container) {
  overlay = document.createElement('div')
  overlay.className = 'dashboard-overlay'
  overlay.innerHTML = `
    <div class="dashboard-backdrop"></div>
    <div class="dashboard-panel"></div>
  `
  container.appendChild(overlay)

  overlay.querySelector('.dashboard-backdrop').addEventListener('click', closeDashboard)
}

export function openDashboard() {
  currentTab = 'notes'
  renderDashboard()
  overlay.classList.add('open')
}

export function closeDashboard() {
  disablePlacementMode()
  pendingPlacement = null
  overlay.classList.remove('placement-active')
  overlay.classList.add('closing')
  const onEnd = () => {
    overlay.classList.remove('open')
    overlay.classList.remove('closing')
    overlay.removeEventListener('transitionend', onEnd)
  }
  overlay.addEventListener('transitionend', onEnd)
  setTimeout(() => {
    overlay.classList.remove('open')
    overlay.classList.remove('closing')
  }, 500)
}

function renderDashboard() {
  const panel = overlay.querySelector('.dashboard-panel')
  panel.innerHTML = `
    <div class="dashboard-top">
      <div class="dashboard-title-row">
        <div class="dashboard-title">your journal</div>
        <button class="dashboard-close" aria-label="Close">&times;</button>
      </div>
      <div class="dashboard-tabs">
        <button class="dashboard-tab ${currentTab === 'notes' ? 'active' : ''}" data-tab="notes">notes</button>
        <button class="dashboard-tab ${currentTab === 'location' ? 'active' : ''}" data-tab="location">location</button>
        <button class="dashboard-tab ${currentTab === 'visited' ? 'active' : ''}" data-tab="visited">visited</button>
        <button class="dashboard-tab ${currentTab === 'stops' ? 'active' : ''}" data-tab="stops">next stops</button>
        <button class="dashboard-tab ${currentTab === 'export' ? 'active' : ''}" data-tab="export">export</button>
      </div>
    </div>
    <div class="dashboard-content" id="dash-content"></div>
  `

  panel.querySelector('.dashboard-close').addEventListener('click', closeDashboard)

  panel.querySelectorAll('.dashboard-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTab = tab.dataset.tab
      renderDashboard()
    })
  })

  const content = panel.querySelector('#dash-content')
  switch (currentTab) {
    case 'notes': renderNotes(content); break
    case 'location': renderLocation(content); break
    case 'visited': renderVisited(content); break
    case 'stops': renderStops(content); break
    case 'export': initExport(content); break
  }

  const logoutWrap = document.createElement('div')
  logoutWrap.className = 'dash-logout'
  logoutWrap.innerHTML = '<button class="dash-logout-btn">log out & tuck away</button>'
  content.appendChild(logoutWrap)
  logoutWrap.querySelector('.dash-logout-btn').addEventListener('click', () => {
    update('isAdmin', false)
    update('passphrase', null)
    closeDashboard()
  })
}

async function renderNotes(container) {
  container.innerHTML = `
    <div class="dash-section-title">notes from friends</div>
    <div id="dash-notes-list"><div class="dash-empty"><div class="dash-empty-icon">&#9993;</div>loading notes...</div></div>
  `

  try {
    const result = await adminAction('get_notes', state.passphrase)
    const notes = result.notes || []
    const list = container.querySelector('#dash-notes-list')

    if (notes.length === 0) {
      list.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">&#128140;</div>no notes yet - share the site!</div>`
      return
    }

    list.innerHTML = notes.map(note => {
      const date = new Date(note.created_at)
      const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      return `
        <div class="dash-note-card">
          <div class="dash-note-author">${escapeHtml(note.author_name)}</div>
          <div class="dash-note-message">${escapeHtml(note.message)}</div>
          <div class="dash-note-meta">
            <span>${timeStr}</span>
            ${note.location_context ? `<span>${escapeHtml(note.location_context)}</span>` : ''}
          </div>
        </div>
      `
    }).join('')
  } catch (err) {
    const list = container.querySelector('#dash-notes-list')
    list.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed to load notes')}</div>`
  }
}

function startPlacement(formType, container) {
  disablePlacementMode()

  // Collapse dashboard so user can see and click the map
  const panel = overlay.querySelector('.dashboard-panel')
  if (panel) panel.classList.add('collapsed')
  const backdrop = overlay.querySelector('.dashboard-backdrop')
  if (backdrop) backdrop.style.display = 'none'
  overlay.classList.add('placement-active')

  enablePlacementMode((x_pct, y_pct) => {
    disablePlacementMode()

    // Re-open dashboard
    overlay.classList.remove('placement-active')
    if (panel) panel.classList.remove('collapsed')
    if (backdrop) backdrop.style.display = ''

    pendingPlacement = { x_pct, y_pct }

    const xInput = container.querySelector(`#dash-${formType}-x`)
    const yInput = container.querySelector(`#dash-${formType}-y`)
    if (xInput) xInput.value = x_pct.toFixed(1)
    if (yInput) yInput.value = y_pct.toFixed(1)

    const statusEl = container.querySelector(`#dash-placement-status-${formType}`)
    if (statusEl) {
      statusEl.innerHTML = '<div class="dash-success">pin placed!</div>'
    }
  })
}

function renderLocation(container) {
  const loc = state.currentLocation || {}
  container.innerHTML = `
    <div class="dash-section-title">update current location</div>
    <form id="dash-location-form">
      <div class="dash-form-row">
        <div class="dash-form-group">
          <label for="dash-loc-city">city</label>
          <input type="text" id="dash-loc-city" value="${escapeAttr(loc.city || '')}" placeholder="city..." />
        </div>
        <div class="dash-form-group">
          <label for="dash-loc-country">country</label>
          <input type="text" id="dash-loc-country" value="${escapeAttr(loc.country || '')}" placeholder="country..." />
        </div>
      </div>
      <input type="hidden" id="dash-loc-x" value="${loc.x_pct != null ? loc.x_pct : ''}" />
      <input type="hidden" id="dash-loc-y" value="${loc.y_pct != null ? loc.y_pct : ''}" />
      <div id="dash-placement-status-loc"></div>
      <button type="button" class="dash-btn dash-btn--secondary dash-btn--full" id="dash-loc-place">place on map</button>
      <button type="submit" class="dash-btn dash-btn--full">save update</button>
      <div id="dash-loc-status"></div>
    </form>
    <div class="dash-divider"></div>
    <button type="button" class="dash-btn dash-btn--move" id="dash-loc-to-visited">move current location to visited</button>
  `

  container.querySelector('#dash-loc-place').addEventListener('click', () => {
    startPlacement('loc', container)
  })

  container.querySelector('#dash-loc-to-visited').addEventListener('click', async () => {
    const loc = state.currentLocation
    if (!loc || !loc.city) {
      const status = container.querySelector('#dash-loc-status')
      status.innerHTML = '<div class="dash-error">no current location to move</div>'
      return
    }

    const btn = container.querySelector('#dash-loc-to-visited')
    btn.disabled = true
    btn.textContent = 'moving...'

    try {
      await adminAction('add_visited', state.passphrase, {
        data: {
          city: loc.city,
          country: loc.country,
          x_pct: loc.x_pct,
          y_pct: loc.y_pct,
          date_from: '',
          date_to: '',
          image_urls: [],
        }
      })
      const freshData = await getPublicData()
      update('visitedPlaces', freshData.visitedPlaces)
      const status = container.querySelector('#dash-loc-status')
      status.innerHTML = `<div class="dash-success">${escapeHtml(loc.city)} moved to visited!</div>`
      btn.disabled = false
      btn.textContent = 'move current location to visited'
    } catch (err) {
      const status = container.querySelector('#dash-loc-status')
      status.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed to move')}</div>`
      btn.disabled = false
      btn.textContent = 'move current location to visited'
    }
  })

  container.querySelector('#dash-location-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const city = container.querySelector('#dash-loc-city').value.trim()
    const country = container.querySelector('#dash-loc-country').value.trim()
    const x_pct = parseFloat(container.querySelector('#dash-loc-x').value)
    const y_pct = parseFloat(container.querySelector('#dash-loc-y').value)
    const status = container.querySelector('#dash-loc-status')

    if (!city || !country || isNaN(x_pct) || isNaN(y_pct)) {
      status.innerHTML = '<div class="dash-error">fill in city & country, then place on map</div>'
      return
    }

    const btn = container.querySelector('button[type="submit"]')
    btn.disabled = true
    btn.textContent = 'saving...'

    try {
      await adminAction('update_location', state.passphrase, { data: { city, country, x_pct, y_pct } })
      update('currentLocation', { city, country, x_pct, y_pct, updated_at: new Date().toISOString() })
      status.innerHTML = '<div class="dash-success">location updated!</div>'
      btn.disabled = false
      btn.textContent = 'save update'
    } catch (err) {
      status.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed to update')}</div>`
      btn.disabled = false
      btn.textContent = 'save update'
    }
  })
}

function renderVisited(container) {
  container.innerHTML = `
    <div class="dash-section-title">add a visited place</div>
    <form id="dash-visited-form">
      <div class="dash-form-row">
        <div class="dash-form-group">
          <label for="dash-vis-city">city</label>
          <input type="text" id="dash-vis-city" placeholder="city..." />
        </div>
        <div class="dash-form-group">
          <label for="dash-vis-country">country</label>
          <input type="text" id="dash-vis-country" placeholder="country..." />
        </div>
      </div>
      <input type="hidden" id="dash-vis-x" />
      <input type="hidden" id="dash-vis-y" />
      <div id="dash-placement-status-vis"></div>
      <div class="dash-form-row">
        <div class="dash-form-group">
          <label for="dash-vis-from">from</label>
          <input type="text" id="dash-vis-from" placeholder="March 2026" />
        </div>
        <div class="dash-form-group">
          <label for="dash-vis-to">to</label>
          <input type="text" id="dash-vis-to" placeholder="April 2026" />
        </div>
      </div>
      <div class="dash-form-actions">
        <button type="button" class="dash-btn dash-btn--secondary" id="dash-vis-place">place on map</button>
        <button type="submit" class="dash-btn">add place</button>
      </div>
      <div id="dash-vis-status"></div>
    </form>
  `

  container.querySelector('#dash-vis-place').addEventListener('click', () => {
    startPlacement('vis', container)
  })

  container.querySelector('#dash-visited-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const city = container.querySelector('#dash-vis-city').value.trim()
    const country = container.querySelector('#dash-vis-country').value.trim()
    const x_pct = parseFloat(container.querySelector('#dash-vis-x').value)
    const y_pct = parseFloat(container.querySelector('#dash-vis-y').value)
    const date_from = container.querySelector('#dash-vis-from').value.trim()
    const date_to = container.querySelector('#dash-vis-to').value.trim()
    const image_urls = []
    const status = container.querySelector('#dash-vis-status')

    if (!city || !country || isNaN(x_pct) || isNaN(y_pct)) {
      status.innerHTML = '<div class="dash-error">city, country, and position are required (use "place on map")</div>'
      return
    }

    const btn = container.querySelector('button[type="submit"]')
    btn.disabled = true
    btn.textContent = 'adding...'

    try {
      await adminAction('add_visited', state.passphrase, { data: { city, country, x_pct, y_pct, date_from, date_to, image_urls } })
      const freshData = await getPublicData()
      update('visitedPlaces', freshData.visitedPlaces)
      status.innerHTML = '<div class="dash-success">place added!</div>'
      container.querySelector('#dash-vis-city').value = ''
      container.querySelector('#dash-vis-country').value = ''
      container.querySelector('#dash-vis-x').value = ''
      container.querySelector('#dash-vis-y').value = ''
      container.querySelector('#dash-vis-from').value = ''
      container.querySelector('#dash-vis-to').value = ''
      btn.disabled = false
      btn.textContent = 'add place'
    } catch (err) {
      status.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed to add')}</div>`
      btn.disabled = false
      btn.textContent = 'add place'
    }
  })
}

function renderStops(container) {
  container.innerHTML = `
    <div class="dash-section-title">manage next stops</div>
    <form id="dash-stop-form">
      <div class="dash-form-row">
        <div class="dash-form-group">
          <label for="dash-stop-city">city</label>
          <input type="text" id="dash-stop-city" placeholder="city..." />
        </div>
        <div class="dash-form-group">
          <label for="dash-stop-country">country</label>
          <input type="text" id="dash-stop-country" placeholder="country..." />
        </div>
      </div>
      <input type="hidden" id="dash-stop-x" />
      <input type="hidden" id="dash-stop-y" />
      <div id="dash-placement-status-stop"></div>
      <div class="dash-form-group">
        <label for="dash-stop-note">note</label>
        <input type="text" id="dash-stop-note" placeholder="why here?" />
      </div>
      <div class="dash-form-actions">
        <button type="button" class="dash-btn dash-btn--secondary" id="dash-stop-place">place on map</button>
        <button type="submit" class="dash-btn">add stop</button>
      </div>
      <div id="dash-stop-status"></div>
    </form>
    <div class="dash-divider"></div>
    <div class="dash-section-title">current stops</div>
    <div id="dash-stop-list" class="dash-stop-list"></div>
  `

  container.querySelector('#dash-stop-place').addEventListener('click', () => {
    startPlacement('stop', container)
  })

  container.querySelector('#dash-stop-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const city = container.querySelector('#dash-stop-city').value.trim()
    const country = container.querySelector('#dash-stop-country').value.trim()
    const x_pct = parseFloat(container.querySelector('#dash-stop-x').value)
    const y_pct = parseFloat(container.querySelector('#dash-stop-y').value)
    const note = container.querySelector('#dash-stop-note').value.trim()
    const status = container.querySelector('#dash-stop-status')

    if (!city || !country || isNaN(x_pct) || isNaN(y_pct)) {
      status.innerHTML = '<div class="dash-error">city, country, and position are required (use "place on map")</div>'
      return
    }

    const btn = container.querySelector('#dash-stop-form button[type="submit"]')
    btn.disabled = true
    btn.textContent = 'adding...'

    try {
      await adminAction('add_stop', state.passphrase, { data: { city, country, x_pct, y_pct, note } })
      const freshData = await getPublicData()
      update('potentialStops', freshData.potentialStops)
      status.innerHTML = '<div class="dash-success">stop added!</div>'
      container.querySelector('#dash-stop-city').value = ''
      container.querySelector('#dash-stop-country').value = ''
      container.querySelector('#dash-stop-x').value = ''
      container.querySelector('#dash-stop-y').value = ''
      container.querySelector('#dash-stop-note').value = ''
      btn.disabled = false
      btn.textContent = 'add stop'
      renderStopList(container)
    } catch (err) {
      status.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed to add')}</div>`
      btn.disabled = false
      btn.textContent = 'add stop'
    }
  })

  renderStopList(container)
}

function renderStopList(container) {
  const list = container.querySelector('#dash-stop-list')
  const stops = state.potentialStops

  if (stops.length === 0) {
    list.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">&#127759;</div>no stops planned yet</div>`
    return
  }

  list.innerHTML = stops.map(stop => `
    <div class="dash-stop-item" data-id="${stop.id}">
      <div class="dash-stop-info">
        <strong>${escapeHtml(stop.city)}</strong>, ${escapeHtml(stop.country)}
        ${stop.note ? `<div class="dash-stop-note">"${escapeHtml(stop.note)}"</div>` : ''}
      </div>
      <div class="dash-stop-actions">
        <button class="dash-btn dash-btn--arrive dash-btn--small dash-arrive-stop" data-id="${stop.id}">we're here!</button>
        <button class="dash-btn dash-btn--danger dash-btn--small dash-remove-stop" data-id="${stop.id}">remove</button>
      </div>
    </div>
  `).join('')

  list.querySelectorAll('.dash-arrive-stop').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id
      const stop = state.potentialStops.find(s => s.id === id)
      if (!stop) return

      btn.disabled = true
      btn.textContent = 'moving...'

      try {
        // 1. Move current location to visited
        const loc = state.currentLocation
        if (loc && loc.city) {
          await adminAction('add_visited', state.passphrase, {
            data: {
              city: loc.city,
              country: loc.country,
              x_pct: loc.x_pct,
              y_pct: loc.y_pct,
              date_from: '',
              date_to: '',
              image_urls: [],
            }
          })
        }

        // 2. Set this stop as current location
        await adminAction('update_location', state.passphrase, {
          data: {
            city: stop.city,
            country: stop.country,
            x_pct: stop.x_pct,
            y_pct: stop.y_pct,
          }
        })

        // 3. Remove from stops
        await adminAction('remove_stop', state.passphrase, { data: { id } })

        // 4. Refresh everything
        const freshData = await getPublicData()
        update('currentLocation', freshData.currentLocation)
        update('visitedPlaces', freshData.visitedPlaces)
        update('potentialStops', freshData.potentialStops)
        renderStopList(container)

        const statusEl = container.querySelector('#dash-stop-status')
        if (statusEl) {
          statusEl.innerHTML = `<div class="dash-success">you're in ${escapeHtml(stop.city)}!</div>`
        }
      } catch (err) {
        console.error('Failed to arrive:', err)
        btn.disabled = false
        btn.textContent = "we're here!"
      }
    })
  })

  list.querySelectorAll('.dash-remove-stop').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id
      btn.disabled = true
      btn.textContent = '...'

      try {
        await adminAction('remove_stop', state.passphrase, { data: { id } })
        const freshData = await getPublicData()
        update('potentialStops', freshData.potentialStops)
        renderStopList(container)
      } catch (err) {
        console.error('Failed to remove stop:', err)
        btn.disabled = false
        btn.textContent = 'remove'
      }
    })
  })
}
