/**
 * Shared utility functions used across modules.
 * Consolidated here to avoid duplicate implementations.
 */

const _escapeDiv = document.createElement('div')

export function escapeHtml(str) {
  if (!str) return ''
  _escapeDiv.textContent = str
  return _escapeDiv.innerHTML
}

export function escapeAttr(str) {
  if (!str) return ''
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
