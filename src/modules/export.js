import './export.css'
import { state } from '../state.js'
import { adminAction } from '../supabase.js'

export function initExport(container) {
  container.innerHTML = `
    <div class="dash-section-title">export notes</div>
    <div class="export-panel">
      <div class="export-filters">
        <div class="dash-form-group">
          <label for="export-filter-type">filter by</label>
          <div class="export-filter-tabs">
            <button class="export-filter-btn active" data-filter="all">all</button>
            <button class="export-filter-btn" data-filter="person">person</button>
            <button class="export-filter-btn" data-filter="location">location</button>
            <button class="export-filter-btn" data-filter="recency">recency</button>
          </div>
        </div>
        <div id="export-filter-input" class="export-filter-input" style="display: none;"></div>
      </div>
      <div class="export-preview">
        <div id="export-count" class="export-count"></div>
        <div class="export-actions">
          <button class="dash-btn" id="export-csv">download CSV</button>
          <button class="dash-btn dash-btn--secondary" id="export-copy">copy to clipboard</button>
        </div>
      </div>
      <div id="export-status"></div>
    </div>
  `

  let activeFilter = 'all'
  let filterValue = ''
  let filterDays = 30
  let cachedNotes = []

  const filterBtns = container.querySelectorAll('.export-filter-btn')
  const filterInput = container.querySelector('#export-filter-input')
  const countEl = container.querySelector('#export-count')
  const statusEl = container.querySelector('#export-status')

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      activeFilter = btn.dataset.filter
      renderFilterInput()
      fetchNotes()
    })
  })

  container.querySelector('#export-csv').addEventListener('click', () => downloadCSV(cachedNotes))
  container.querySelector('#export-copy').addEventListener('click', () => copyToClipboard(cachedNotes, statusEl))

  function renderFilterInput() {
    if (activeFilter === 'all') {
      filterInput.style.display = 'none'
      return
    }

    filterInput.style.display = 'block'

    if (activeFilter === 'person') {
      filterInput.innerHTML = `
        <div class="dash-form-group">
          <label for="export-person-input">person name</label>
          <input type="text" id="export-person-input" placeholder="search by name..." />
        </div>
      `
      filterInput.querySelector('#export-person-input').addEventListener('input', (e) => {
        filterValue = e.target.value.trim()
        fetchNotes()
      })
    } else if (activeFilter === 'location') {
      filterInput.innerHTML = `
        <div class="dash-form-group">
          <label for="export-loc-input">location</label>
          <input type="text" id="export-loc-input" placeholder="search by location..." />
        </div>
      `
      filterInput.querySelector('#export-loc-input').addEventListener('input', (e) => {
        filterValue = e.target.value.trim()
        fetchNotes()
      })
    } else if (activeFilter === 'recency') {
      filterInput.innerHTML = `
        <div class="export-recency-btns">
          <button class="export-recency-btn active" data-days="7">7 days</button>
          <button class="export-recency-btn" data-days="30">30 days</button>
          <button class="export-recency-btn" data-days="90">90 days</button>
        </div>
      `
      filterInput.querySelectorAll('.export-recency-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          filterInput.querySelectorAll('.export-recency-btn').forEach(b => b.classList.remove('active'))
          btn.classList.add('active')
          filterDays = parseInt(btn.dataset.days)
          fetchNotes()
        })
      })
      filterDays = 7
    }
  }

  async function fetchNotes() {
    countEl.textContent = 'loading...'

    try {
      let requestData = {}
      if (activeFilter === 'person' && filterValue) {
        requestData = { data: { filter_by: 'person', value: filterValue } }
      } else if (activeFilter === 'location' && filterValue) {
        requestData = { data: { filter_by: 'location', value: filterValue } }
      } else if (activeFilter === 'recency') {
        requestData = { data: { filter_by: 'recency', days: filterDays } }
      }

      const result = await adminAction('export_notes', state.passphrase, requestData)
      cachedNotes = result.notes || []
      const count = result.count !== undefined ? result.count : cachedNotes.length
      countEl.textContent = `${count} note${count !== 1 ? 's' : ''} found`
    } catch (err) {
      countEl.textContent = 'failed to load'
      console.error('Export fetch failed:', err)
    }
  }

  fetchNotes()
}

function downloadCSV(notes) {
  if (notes.length === 0) return

  const headers = ['Name', 'Message', 'Location', 'Date']
  const rows = notes.map(n => [
    csvEscape(n.author_name),
    csvEscape(n.message),
    csvEscape(n.location_context || ''),
    csvEscape(new Date(n.created_at).toLocaleDateString()),
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `travel-notes-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function copyToClipboard(notes, statusEl) {
  if (notes.length === 0) {
    statusEl.innerHTML = '<div class="dash-error">no notes to copy</div>'
    return
  }

  const text = notes.map(n => {
    const date = new Date(n.created_at).toLocaleDateString()
    return `${n.author_name} (${date}${n.location_context ? ', ' + n.location_context : ''}): ${n.message}`
  }).join('\n\n')

  navigator.clipboard.writeText(text).then(() => {
    statusEl.innerHTML = '<div class="dash-success">copied to clipboard!</div>'
    setTimeout(() => { statusEl.innerHTML = '' }, 2000)
  }).catch(() => {
    statusEl.innerHTML = '<div class="dash-error">failed to copy</div>'
  })
}

function csvEscape(str) {
  if (!str) return '""'
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}
