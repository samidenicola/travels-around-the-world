const listeners = {}

export const state = {
  currentLocation: null,
  visitedPlaces: [],
  potentialStops: [],
  isAdmin: false,
  passphrase: null,
  notes: [],
  dataLoaded: false,
}

export function on(event, fn) {
  if (!listeners[event]) listeners[event] = []
  listeners[event].push(fn)
}

export function off(event, fn) {
  if (!listeners[event]) return
  listeners[event] = listeners[event].filter(f => f !== fn)
}

export function emit(event, data) {
  if (!listeners[event]) return
  listeners[event].forEach(fn => fn(data))
}

export function update(key, value) {
  state[key] = value
  emit(key, value)
  emit('change', { key, value })
}
