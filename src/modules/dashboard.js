import './dashboard.css'
import { state, update, on } from '../state.js'
import { adminAction, getPublicData, uploadPhoto } from '../supabase.js'
import { initExport } from './export.js'
import { escapeHtml, escapeAttr } from '../utils.js'
import { enablePlacementMode, disablePlacementMode, renderMarkers } from './markers.js'

let overlay = null
let pendingPlacement = null
let expandedSections = { visited: true, stops: true, notes: false, exportSection: false }

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
        <div class="dashboard-top-actions">
          <button class="dash-logout-btn">log out</button>
          <button class="dashboard-close" aria-label="Close">&times;</button>
        </div>
      </div>
    </div>
    <div class="dashboard-content" id="dash-content"></div>
  `

  panel.querySelector('.dashboard-close').addEventListener('click', closeDashboard)
  panel.querySelector('.dash-logout-btn').addEventListener('click', () => {
    update('isAdmin', false)
    update('passphrase', null)
    closeDashboard()
  })

  const content = panel.querySelector('#dash-content')
  renderCurrentSection(content)
  renderVisitedSection(content)
  renderStopsSection(content)
  renderNotesSection(content)
  renderExportSection(content)
}

function startPlacement(formType, container) {
  disablePlacementMode()

  const panel = overlay.querySelector('.dashboard-panel')
  if (panel) panel.classList.add('collapsed')
  const backdrop = overlay.querySelector('.dashboard-backdrop')
  if (backdrop) backdrop.style.display = 'none'
  overlay.classList.add('placement-active')

  enablePlacementMode((x_pct, y_pct) => {
    disablePlacementMode()

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

function createSectionHeader(title, count, sectionKey, accentClass) {
  const isExpanded = expandedSections[sectionKey]
  const header = document.createElement('button')
  header.className = `dash-section-header ${accentClass || ''} ${isExpanded ? 'expanded' : ''}`
  header.innerHTML = `
    <span class="dash-section-header-text">${escapeHtml(title)}${count != null ? ` <span class="dash-section-count">(${count})</span>` : ''}</span>
    <span class="dash-section-chevron">${isExpanded ? '&#9650;' : '&#9660;'}</span>
  `
  return header
}

function createCollapsibleBody(sectionKey) {
  const body = document.createElement('div')
  body.className = `dash-section-body ${expandedSections[sectionKey] ? 'expanded' : ''}`
  return body
}

function toggleSection(sectionKey, header, body) {
  expandedSections[sectionKey] = !expandedSections[sectionKey]
  const isExpanded = expandedSections[sectionKey]
  header.classList.toggle('expanded', isExpanded)
  body.classList.toggle('expanded', isExpanded)
  header.querySelector('.dash-section-chevron').innerHTML = isExpanded ? '&#9650;' : '&#9660;'
}

/* ---- Section 1: Where we are now ---- */

function renderCurrentSection(container) {
  const section = document.createElement('div')
  section.className = 'dash-section dash-section--current'

  const loc = state.currentLocation || {}
  section.innerHTML = `
    <div class="dash-current-card">
      <div class="dash-current-pin-icon">
        <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="34">
          <path d="M18 0.5C8.5 0.5 0.8 8 0.8 17.3C0.8 30 18 43.5 18 43.5S35.2 30 35.2 17.3C35.2 8 27.5 0.5 18 0.5Z" fill="#c0392b"/>
          <circle cx="18" cy="16" r="7" fill="#fdf6e3" opacity="0.9"/>
          <path d="M18 11.5C16.5 11.5 15.2 12.3 14.5 13.5C13.8 14.7 13.8 16 14.5 17.2L18 22L21.5 17.2C22.2 16 22.2 14.7 21.5 13.5C20.8 12.3 19.5 11.5 18 11.5Z" fill="#c0392b" opacity="0.85"/>
        </svg>
      </div>
      <div class="dash-current-info">
        <div class="dash-current-label">where we are now</div>
        <div class="dash-current-city">${loc.city ? escapeHtml(loc.city) : 'not set'}</div>
        <div class="dash-current-country">${loc.country ? escapeHtml(loc.country) : ''}</div>
      </div>
    </div>
    <div id="dash-move-form" class="dash-move-form" style="display:none;">
      <div class="dash-form-row">
        <div class="dash-form-group">
          <label for="dash-move-city">city</label>
          <input type="text" id="dash-move-city" placeholder="city..." />
        </div>
        <div class="dash-form-group">
          <label for="dash-move-country">country</label>
          <input type="text" id="dash-move-country" placeholder="country..." />
        </div>
      </div>
      <input type="hidden" id="dash-move-x" />
      <input type="hidden" id="dash-move-y" />
      <div id="dash-placement-status-move"></div>
      <div class="dash-form-actions">
        <button type="button" class="dash-btn dash-btn--secondary" id="dash-move-place">place on map</button>
        <button type="button" class="dash-btn" id="dash-move-save">save</button>
        <button type="button" class="dash-btn dash-btn--ghost" id="dash-move-cancel">cancel</button>
      </div>
      <div id="dash-move-status"></div>
    </div>
    <button class="dash-btn dash-btn--move" id="dash-we-moved">we moved!</button>
    <div id="dash-current-status"></div>
  `

  container.appendChild(section)

  const moveBtn = section.querySelector('#dash-we-moved')
  const moveForm = section.querySelector('#dash-move-form')

  moveBtn.addEventListener('click', () => {
    moveBtn.style.display = 'none'
    moveForm.style.display = 'block'
  })

  section.querySelector('#dash-move-cancel').addEventListener('click', () => {
    moveForm.style.display = 'none'
    moveBtn.style.display = 'block'
  })

  section.querySelector('#dash-move-place').addEventListener('click', () => {
    startPlacement('move', section)
  })

  section.querySelector('#dash-move-save').addEventListener('click', async () => {
    const city = section.querySelector('#dash-move-city').value.trim()
    const country = section.querySelector('#dash-move-country').value.trim()
    const x_pct = parseFloat(section.querySelector('#dash-move-x').value)
    const y_pct = parseFloat(section.querySelector('#dash-move-y').value)
    const status = section.querySelector('#dash-move-status')

    if (!city || !country || isNaN(x_pct) || isNaN(y_pct)) {
      status.innerHTML = '<div class="dash-error">fill in city & country, then place on map</div>'
      return
    }

    const btn = section.querySelector('#dash-move-save')
    btn.disabled = true
    btn.textContent = 'saving...'

    try {
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

      await adminAction('update_location', state.passphrase, { data: { city, country, x_pct, y_pct } })

      const freshData = await getPublicData()
      update('currentLocation', freshData.currentLocation)
      update('visitedPlaces', freshData.visitedPlaces)
      renderDashboard()
    } catch (err) {
      status.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed')}</div>`
      btn.disabled = false
      btn.textContent = 'save'
    }
  })
}

/* ---- Section 2: Where we've been ---- */

function renderVisitedSection(container) {
  const section = document.createElement('div')
  section.className = 'dash-section dash-section--visited'

  const places = state.visitedPlaces || []
  const header = createSectionHeader("where we've been", places.length, 'visited', 'dash-accent--visited')
  const body = createCollapsibleBody('visited')

  header.addEventListener('click', () => toggleSection('visited', header, body))

  if (places.length === 0) {
    body.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">&#127758;</div>no places visited yet</div>`
  } else {
    places.forEach(place => {
      const card = document.createElement('div')
      card.className = 'dash-visited-card'
      card.dataset.id = place.id

      let dateStr = ''
      if (place.date_from) {
        dateStr = place.date_from === place.date_to
          ? escapeHtml(place.date_from)
          : `${escapeHtml(place.date_from)}${place.date_to ? ' - ' + escapeHtml(place.date_to) : ''}`
      }

      let thumbsHtml = ''
      if (place.image_urls && place.image_urls.length > 0) {
        thumbsHtml = `<div class="dash-visited-thumbs">${place.image_urls.slice(0, 4).map(url =>
          `<img src="${escapeHtml(url)}" alt="photo" class="dash-visited-thumb" />`
        ).join('')}</div>`
      }

      card.innerHTML = `
        <div class="dash-visited-info">
          <div class="dash-visited-city">${escapeHtml(place.city)}</div>
          <div class="dash-visited-country">${escapeHtml(place.country)}</div>
          ${dateStr ? `<div class="dash-visited-dates">${dateStr}</div>` : ''}
          ${thumbsHtml}
        </div>
        <div class="dash-visited-edit-area" style="display:none;">
          <div class="dash-form-row">
            <div class="dash-form-group">
              <label>from</label>
              <input type="text" class="dash-visited-from" value="${escapeAttr(place.date_from || '')}" placeholder="March 2026" />
            </div>
            <div class="dash-form-group">
              <label>to</label>
              <input type="text" class="dash-visited-to" value="${escapeAttr(place.date_to || '')}" placeholder="April 2026" />
            </div>
          </div>
          <div class="dash-form-actions">
            <button class="dash-btn dash-btn--small dash-visited-save-btn">save</button>
            <button class="dash-btn dash-btn--ghost dash-btn--small dash-visited-cancel-btn">cancel</button>
          </div>
          <div class="dash-visited-edit-status"></div>
        </div>
        <div class="dash-visited-actions">
          <button class="dash-btn dash-btn--small dash-btn--secondary dash-visited-edit-btn">edit</button>
          <button class="dash-btn dash-btn--small dash-btn--secondary dash-visited-photo-btn">add photos</button>
          <button class="dash-btn dash-btn--small dash-btn--danger dash-visited-remove-btn">remove</button>
        </div>
        <input type="file" class="dash-visited-file-input" multiple accept="image/*" style="display:none;" />
        <div class="dash-visited-upload-status"></div>
      `

      body.appendChild(card)

      card.querySelector('.dash-visited-edit-btn').addEventListener('click', () => {
        card.querySelector('.dash-visited-edit-area').style.display = 'block'
        card.querySelector('.dash-visited-actions').style.display = 'none'
      })

      card.querySelector('.dash-visited-cancel-btn').addEventListener('click', () => {
        card.querySelector('.dash-visited-edit-area').style.display = 'none'
        card.querySelector('.dash-visited-actions').style.display = ''
      })

      card.querySelector('.dash-visited-save-btn').addEventListener('click', async () => {
        const from = card.querySelector('.dash-visited-from').value.trim()
        const to = card.querySelector('.dash-visited-to').value.trim()
        const statusEl = card.querySelector('.dash-visited-edit-status')
        const btn = card.querySelector('.dash-visited-save-btn')
        btn.disabled = true
        btn.textContent = '...'

        try {
          await adminAction('update_visited', state.passphrase, {
            data: { id: place.id, date_from: from, date_to: to }
          })
          const freshData = await getPublicData()
          update('visitedPlaces', freshData.visitedPlaces)
          renderDashboard()
        } catch (err) {
          statusEl.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed')}</div>`
          btn.disabled = false
          btn.textContent = 'save'
        }
      })

      card.querySelector('.dash-visited-remove-btn').addEventListener('click', async () => {
        const btn = card.querySelector('.dash-visited-remove-btn')
        btn.disabled = true
        btn.textContent = '...'
        try {
          await adminAction('delete_visited', state.passphrase, { data: { id: place.id } })
          const freshData = await getPublicData()
          update('visitedPlaces', freshData.visitedPlaces)
          renderDashboard()
        } catch (err) {
          btn.disabled = false
          btn.textContent = 'remove'
        }
      })

      const fileInput = card.querySelector('.dash-visited-file-input')
      card.querySelector('.dash-visited-photo-btn').addEventListener('click', () => {
        fileInput.click()
      })

      fileInput.addEventListener('change', async () => {
        const files = fileInput.files
        if (!files || files.length === 0) return
        const uploadStatus = card.querySelector('.dash-visited-upload-status')
        uploadStatus.innerHTML = '<div class="dash-info">uploading...</div>'

        try {
          const urls = []
          for (const file of files) {
            const reader = new FileReader()
            const base64 = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result.split(',')[1])
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
            const result = await uploadPhoto(state.passphrase, place.id, base64, file.name, file.type)
            if (result.url) urls.push(result.url)
          }

          const freshData = await getPublicData()
          update('visitedPlaces', freshData.visitedPlaces)
          uploadStatus.innerHTML = `<div class="dash-success">${urls.length} photo${urls.length !== 1 ? 's' : ''} uploaded!</div>`
          setTimeout(() => renderDashboard(), 1200)
        } catch (err) {
          uploadStatus.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'upload failed')}</div>`
        }
      })
    })
  }

  section.appendChild(header)
  section.appendChild(body)
  container.appendChild(section)
}

/* ---- Section 3: Where we're going ---- */

function renderStopsSection(container) {
  const section = document.createElement('div')
  section.className = 'dash-section dash-section--stops'

  const stops = state.potentialStops || []
  const header = createSectionHeader("where we're going", stops.length, 'stops', 'dash-accent--stops')
  const body = createCollapsibleBody('stops')

  header.addEventListener('click', () => toggleSection('stops', header, body))

  if (stops.length === 0) {
    body.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">&#127759;</div>no stops planned yet</div>`
  } else {
    stops.forEach(stop => {
      const card = document.createElement('div')
      card.className = 'dash-stop-card'
      card.innerHTML = `
        <div class="dash-stop-info">
          <strong>${escapeHtml(stop.city)}</strong>, ${escapeHtml(stop.country)}
          ${stop.note ? `<div class="dash-stop-note">"${escapeHtml(stop.note)}"</div>` : ''}
        </div>
        <div class="dash-stop-edit-area" style="display:none;">
          <div class="dash-form-row">
            <div class="dash-form-group">
              <label>city</label>
              <input type="text" class="dash-stop-edit-city" value="${escapeAttr(stop.city)}" />
            </div>
            <div class="dash-form-group">
              <label>country</label>
              <input type="text" class="dash-stop-edit-country" value="${escapeAttr(stop.country)}" />
            </div>
          </div>
          <div class="dash-form-group">
            <label>note</label>
            <input type="text" class="dash-stop-edit-note" value="${escapeAttr(stop.note || '')}" />
          </div>
          <div class="dash-form-actions">
            <button class="dash-btn dash-btn--small dash-stop-save-edit">save</button>
            <button class="dash-btn dash-btn--ghost dash-btn--small dash-stop-cancel-edit">cancel</button>
          </div>
          <div class="dash-stop-edit-status"></div>
        </div>
        <div class="dash-stop-actions">
          <button class="dash-btn dash-btn--arrive dash-btn--small dash-arrive-stop" data-id="${stop.id}">we're here!</button>
          <button class="dash-btn dash-btn--small dash-btn--secondary dash-stop-edit-btn">edit</button>
          <button class="dash-btn dash-btn--danger dash-btn--small dash-remove-stop" data-id="${stop.id}">remove</button>
        </div>
      `
      body.appendChild(card)

      card.querySelector('.dash-stop-edit-btn').addEventListener('click', () => {
        card.querySelector('.dash-stop-edit-area').style.display = 'block'
        card.querySelector('.dash-stop-actions').style.display = 'none'
      })

      card.querySelector('.dash-stop-cancel-edit').addEventListener('click', () => {
        card.querySelector('.dash-stop-edit-area').style.display = 'none'
        card.querySelector('.dash-stop-actions').style.display = ''
      })

      card.querySelector('.dash-stop-save-edit').addEventListener('click', async () => {
        const city = card.querySelector('.dash-stop-edit-city').value.trim()
        const country = card.querySelector('.dash-stop-edit-country').value.trim()
        const note = card.querySelector('.dash-stop-edit-note').value.trim()
        const statusEl = card.querySelector('.dash-stop-edit-status')

        if (!city || !country) {
          statusEl.innerHTML = '<div class="dash-error">city and country required</div>'
          return
        }

        const btn = card.querySelector('.dash-stop-save-edit')
        btn.disabled = true
        btn.textContent = '...'

        try {
          await adminAction('remove_stop', state.passphrase, { data: { id: stop.id } })
          await adminAction('add_stop', state.passphrase, {
            data: { city, country, x_pct: stop.x_pct, y_pct: stop.y_pct, note }
          })
          const freshData = await getPublicData()
          update('potentialStops', freshData.potentialStops)
          renderDashboard()
        } catch (err) {
          statusEl.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed')}</div>`
          btn.disabled = false
          btn.textContent = 'save'
        }
      })

      card.querySelector('.dash-arrive-stop').addEventListener('click', async () => {
        const btn = card.querySelector('.dash-arrive-stop')
        btn.disabled = true
        btn.textContent = 'moving...'

        try {
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

          await adminAction('update_location', state.passphrase, {
            data: {
              city: stop.city,
              country: stop.country,
              x_pct: stop.x_pct,
              y_pct: stop.y_pct,
            }
          })

          await adminAction('remove_stop', state.passphrase, { data: { id: stop.id } })

          const freshData = await getPublicData()
          update('currentLocation', freshData.currentLocation)
          update('visitedPlaces', freshData.visitedPlaces)
          update('potentialStops', freshData.potentialStops)
          renderDashboard()
        } catch (err) {
          console.error('Failed to arrive:', err)
          btn.disabled = false
          btn.textContent = "we're here!"
        }
      })

      card.querySelector('.dash-remove-stop').addEventListener('click', async () => {
        const btn = card.querySelector('.dash-remove-stop')
        btn.disabled = true
        btn.textContent = '...'

        try {
          await adminAction('remove_stop', state.passphrase, { data: { id: stop.id } })
          const freshData = await getPublicData()
          update('potentialStops', freshData.potentialStops)
          renderDashboard()
        } catch (err) {
          btn.disabled = false
          btn.textContent = 'remove'
        }
      })
    })
  }

  const addStopForm = document.createElement('div')
  addStopForm.className = 'dash-add-stop-area'
  addStopForm.innerHTML = `
    <button class="dash-btn dash-btn--add" id="dash-show-add-stop">add a stop</button>
    <div id="dash-add-stop-form" style="display:none;">
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
        <button type="button" class="dash-btn" id="dash-stop-add-save">add stop</button>
        <button type="button" class="dash-btn dash-btn--ghost" id="dash-stop-add-cancel">cancel</button>
      </div>
      <div id="dash-stop-status"></div>
    </div>
  `
  body.appendChild(addStopForm)

  section.appendChild(header)
  section.appendChild(body)
  container.appendChild(section)

  const showBtn = addStopForm.querySelector('#dash-show-add-stop')
  const formEl = addStopForm.querySelector('#dash-add-stop-form')

  showBtn.addEventListener('click', () => {
    showBtn.style.display = 'none'
    formEl.style.display = 'block'
  })

  addStopForm.querySelector('#dash-stop-add-cancel').addEventListener('click', () => {
    formEl.style.display = 'none'
    showBtn.style.display = ''
  })

  addStopForm.querySelector('#dash-stop-place').addEventListener('click', () => {
    startPlacement('stop', section)
  })

  addStopForm.querySelector('#dash-stop-add-save').addEventListener('click', async () => {
    const city = section.querySelector('#dash-stop-city').value.trim()
    const country = section.querySelector('#dash-stop-country').value.trim()
    const x_pct = parseFloat(section.querySelector('#dash-stop-x').value)
    const y_pct = parseFloat(section.querySelector('#dash-stop-y').value)
    const note = section.querySelector('#dash-stop-note').value.trim()
    const status = section.querySelector('#dash-stop-status')

    if (!city || !country || isNaN(x_pct) || isNaN(y_pct)) {
      status.innerHTML = '<div class="dash-error">city, country, and position required (use "place on map")</div>'
      return
    }

    const btn = addStopForm.querySelector('#dash-stop-add-save')
    btn.disabled = true
    btn.textContent = 'adding...'

    try {
      await adminAction('add_stop', state.passphrase, { data: { city, country, x_pct, y_pct, note } })
      const freshData = await getPublicData()
      update('potentialStops', freshData.potentialStops)
      renderDashboard()
    } catch (err) {
      status.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed')}</div>`
      btn.disabled = false
      btn.textContent = 'add stop'
    }
  })
}

/* ---- Section 4: Notes from friends ---- */

function renderNotesSection(container) {
  const section = document.createElement('div')
  section.className = 'dash-section dash-section--notes'

  const header = createSectionHeader('notes from friends', null, 'notes', 'dash-accent--notes')
  const body = createCollapsibleBody('notes')

  header.addEventListener('click', () => {
    toggleSection('notes', header, body)
    if (expandedSections.notes && body.querySelector('.dash-notes-loading')) {
      loadNotes(body)
    }
  })

  body.innerHTML = `
    <div class="dash-notes-loading">
      <div class="dash-empty"><div class="dash-empty-icon">&#9993;</div>click to load notes</div>
    </div>
  `

  if (expandedSections.notes) {
    loadNotes(body)
  }

  section.appendChild(header)
  section.appendChild(body)
  container.appendChild(section)
}

async function loadNotes(body) {
  body.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">&#9993;</div>loading notes...</div>`

  try {
    const result = await adminAction('get_notes', state.passphrase)
    const notes = result.notes || []

    if (notes.length === 0) {
      body.innerHTML = `<div class="dash-empty"><div class="dash-empty-icon">&#128140;</div>no notes yet - share the site!</div>`
      return
    }

    const searchWrap = document.createElement('div')
    searchWrap.className = 'dash-notes-search'
    searchWrap.innerHTML = `
      <input type="text" class="dash-notes-search-input" placeholder="filter by person..." />
    `
    body.innerHTML = ''
    body.appendChild(searchWrap)

    const listEl = document.createElement('div')
    listEl.className = 'dash-notes-list'
    body.appendChild(listEl)

    function renderNoteCards(filter) {
      const filtered = filter
        ? notes.filter(n => n.author_name.toLowerCase().includes(filter.toLowerCase()))
        : notes

      listEl.innerHTML = filtered.map(note => {
        const date = new Date(note.created_at)
        const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        return `
          <div class="dash-note-card">
            <div class="dash-note-author">${escapeHtml(note.author_name)}</div>
            <div class="dash-note-message">${escapeHtml(note.message)}</div>
            <div class="dash-note-meta">
              <span>${timeStr}</span>
              ${note.location_context ? `<span class="dash-note-location">&#128205; ${escapeHtml(note.location_context)}</span>` : ''}
            </div>
          </div>
        `
      }).join('')
    }

    renderNoteCards()

    searchWrap.querySelector('.dash-notes-search-input').addEventListener('input', (e) => {
      renderNoteCards(e.target.value.trim())
    })
  } catch (err) {
    body.innerHTML = `<div class="dash-error">${escapeHtml(err.message || 'failed to load notes')}</div>`
  }
}

/* ---- Section 5: Export ---- */

function renderExportSection(container) {
  const section = document.createElement('div')
  section.className = 'dash-section dash-section--export'

  const header = createSectionHeader('export', null, 'exportSection', 'dash-accent--export')
  const body = createCollapsibleBody('exportSection')

  header.addEventListener('click', () => toggleSection('exportSection', header, body))

  if (expandedSections.exportSection) {
    initExport(body)
  } else {
    body.innerHTML = '<div class="dash-empty">expand to access export tools</div>'
    const observer = new MutationObserver(() => {
      if (body.classList.contains('expanded') && body.querySelector('.dash-empty')) {
        body.innerHTML = ''
        initExport(body)
        observer.disconnect()
      }
    })
    observer.observe(body, { attributes: true, attributeFilter: ['class'] })
  }

  section.appendChild(header)
  section.appendChild(body)
  container.appendChild(section)
}
