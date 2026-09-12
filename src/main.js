import './style.css'
import { state, update, on } from './state.js'
import { getPublicData } from './supabase.js'
import { initMapSurface } from './modules/map-surface.js'
import { initMarkers } from './modules/markers.js'
import { initHoverCards } from './modules/hover-cards.js'
import { initNoteFlow } from './modules/note-flow.js'
import { initPassphrase } from './modules/passphrase.js'
import { initDashboard } from './modules/dashboard.js'
import { initJourneySummary } from './modules/journey-summary.js'

const app = document.querySelector('#app')

initMapSurface(app)
initHoverCards(app)
initNoteFlow(app)
initPassphrase(app)
initDashboard(app)
initMarkers()
initJourneySummary()

async function loadData() {
  try {
    const data = await getPublicData()
    update('currentLocation', data.currentLocation)
    update('visitedPlaces', data.visitedPlaces)
    update('potentialStops', data.potentialStops)
    update('dataLoaded', true)
  } catch (err) {
    console.error('Failed to load data:', err)
  }
}

loadData()
