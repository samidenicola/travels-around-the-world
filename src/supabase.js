import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const functionUrl = import.meta.env.VITE_SUPABASE_FUNCTION_URL

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isDemo = !supabase

function getDemoData() {
  return {
    currentLocation: {
      id: 'demo-current',
      city: 'Barcelona',
      country: 'Spain',
      lat: 41.3874,
      lng: 2.1686,
      x_pct: 51,
      y_pct: 35,
      updated_at: new Date().toISOString(),
    },
    visitedPlaces: [],
    potentialStops: [
      { id: 'demo-s1', city: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194, x_pct: 12, y_pct: 34, note: 'Bay Area -- Aug 30 - Sept 7 & Nov 1-14', created_at: '2026-08-27T00:00:00Z' },
      { id: 'demo-s2', city: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393, x_pct: 45, y_pct: 37, note: 'Sept 8-10', created_at: '2026-08-27T01:00:00Z' },
      { id: 'demo-s3', city: 'Ponta Delgada', country: 'Portugal', lat: 37.7483, lng: -25.6666, x_pct: 38, y_pct: 36, note: 'Sao Miguel Island -- Sept 11-14', created_at: '2026-08-27T02:00:00Z' },
      { id: 'demo-s4', city: 'Porto', country: 'Portugal', lat: 41.1579, lng: -8.6291, x_pct: 45, y_pct: 35, note: 'Sept 14-16', created_at: '2026-08-27T03:00:00Z' },
      { id: 'demo-s5', city: 'San Diego', country: 'United States', lat: 32.7157, lng: -117.1611, x_pct: 13, y_pct: 38, note: 'Oct 11-31', created_at: '2026-08-27T04:00:00Z' },
      { id: 'demo-s6', city: 'Portland', country: 'United States', lat: 45.5152, lng: -122.6784, x_pct: 11, y_pct: 28, note: 'Oregon -- Nov 15-29', created_at: '2026-08-27T05:00:00Z' },
      { id: 'demo-s7', city: 'Seattle', country: 'United States', lat: 47.6062, lng: -122.3321, x_pct: 11, y_pct: 26, note: 'Washington State -- Nov 30 - Dec 12', created_at: '2026-08-27T06:00:00Z' },
      { id: 'demo-s8', city: "Coeur d'Alene", country: 'United States', lat: 47.6777, lng: -116.7805, x_pct: 14, y_pct: 27, note: 'Idaho (+ Moscow) -- Dec 13-27', created_at: '2026-08-27T07:00:00Z' },
      { id: 'demo-s9', city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, x_pct: 50, y_pct: 30, note: 'France -- Dec 28 - Jan 31', created_at: '2026-08-27T08:00:00Z' },
      { id: 'demo-s10', city: 'London', country: 'England', lat: 51.5074, lng: -0.1278, x_pct: 49, y_pct: 27, note: 'England -- Dec 28 - Jan 31', created_at: '2026-08-27T09:00:00Z' },
    ],
  }
}

function getDemoNotes() {
  return [
    {
      id: 'demo-n1',
      author_name: 'Mom',
      message: 'Having the best time following your adventures! Stay safe and eat lots of tapas for me!',
      location_context: 'Barcelona, Spain',
      created_at: '2026-08-25T14:30:00Z',
    },
    {
      id: 'demo-n2',
      author_name: 'Jake',
      message: 'Dude you HAVE to check out the Gothic Quarter. Best churros of my life were there.',
      location_context: 'Barcelona, Spain',
      created_at: '2026-08-20T09:15:00Z',
    },
    {
      id: 'demo-n3',
      author_name: 'Sarah',
      message: 'Miss you guys! When you get to Lisbon try TimeOut Market - you won\'t regret it.',
      location_context: 'Barcelona, Spain',
      created_at: '2026-08-18T22:00:00Z',
    },
  ]
}

export async function getPublicData() {
  if (!supabase) return getDemoData()
  const [loc, visited, stops] = await Promise.all([
    supabase.from('current_location').select('*').single(),
    supabase.from('visited_places').select('*').order('created_at', { ascending: false }),
    supabase.from('potential_stops').select('*').order('created_at', { ascending: false }),
  ])
  return {
    currentLocation: loc.data,
    visitedPlaces: visited.data || [],
    potentialStops: stops.data || [],
  }
}

export async function submitNote(authorName, message, locationContext) {
  if (!supabase) {
    console.log('Demo mode: note submitted', { authorName, message })
    return { success: true }
  }
  const { error } = await supabase.from('notes').insert({
    author_name: authorName,
    message,
    location_context: locationContext,
  })
  if (error) throw error
  return { success: true }
}

export async function adminAction(action, passphrase, data = {}) {
  if (!functionUrl) {
    console.log('Demo mode:', action, data)
    if (action === 'check_setup') return { is_setup: true }
    if (action === 'verify') return { success: true }
    if (action === 'get_notes') return { notes: getDemoNotes() }
    if (action === 'export_notes') {
      const notes = getDemoNotes()
      return { notes, count: notes.length }
    }
    if (action === 'upload_photo') return { url: '', success: true }
    return { success: true }
  }
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': publishableKey || supabaseAnonKey,
    },
    body: JSON.stringify({ action, passphrase, ...data }),
  })
  const result = await res.json()
  if (!res.ok || result?.error) throw new Error(result?.error || `HTTP ${res.status}`)
  return result
}

export async function uploadPhoto(passphrase, locationId, base64Data, fileName, mimeType) {
  return adminAction('upload_photo', passphrase, {
    data: {
      location_id: locationId,
      image_base64: base64Data,
      file_name: fileName,
      mime_type: mimeType,
    }
  })
}
