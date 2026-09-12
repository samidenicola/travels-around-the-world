import './note-flow.css'
import { state } from '../state.js'
import { submitNote } from '../supabase.js'
import { escapeHtml } from '../utils.js'

let overlay = null

export function initNoteFlow(container) {
  const trigger = document.createElement('button')
  trigger.className = 'note-trigger'
  trigger.innerHTML = `
    <span class="note-trigger-icon">&#9993;</span>
    <span class="note-trigger-text">leave a note</span>
  `
  container.appendChild(trigger)

  overlay = document.createElement('div')
  overlay.className = 'note-overlay'
  container.appendChild(overlay)

  trigger.addEventListener('click', openNoteFlow)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeNoteFlow()
  })

  renderForm()
}

function getLocationContext() {
  if (state.currentLocation) {
    return `${state.currentLocation.city}, ${state.currentLocation.country}`
  }
  return 'on their adventure'
}

function renderForm() {
  const context = getLocationContext()

  overlay.innerHTML = `
    <div class="note-postcard">
      <div class="note-stamp">Air<br/>Mail</div>
      <div class="note-postcard-header">
        <button class="note-postcard-close" aria-label="Close">&times;</button>
        <div class="note-postcard-title" style="font-size: 32px;">Send a postcard</div>
      </div>
      <form class="note-postcard-form" id="note-form">
        <div class="note-context">they're currently in ${escapeHtml(context)}</div>
        <div class="note-field" id="name-field">
          <label for="note-name">Your name</label>
          <input type="text" id="note-name" placeholder="who's writing?" autocomplete="name" required />
        </div>
        <div class="note-field" id="message-field">
          <label for="note-message">Your message</label>
          <textarea id="note-message" placeholder="say something nice..." rows="4" required></textarea>
        </div>
        <button type="submit" class="note-send-btn">
          <span>stamp it</span>
          <svg class="note-send-stamp-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 2L11 13"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
          </svg>
        </button>
      </form>
    </div>
  `

  overlay.querySelector('.note-postcard-close').addEventListener('click', closeNoteFlow)
  overlay.querySelector('#note-form').addEventListener('submit', handleSubmit)
}

function openNoteFlow() {
  renderForm()
  overlay.classList.add('open')
  setTimeout(() => {
    overlay.querySelector('#note-name')?.focus()
  }, 400)
}

function closeNoteFlow() {
  overlay.classList.remove('open')
}

async function handleSubmit(e) {
  e.preventDefault()

  const nameField = document.getElementById('name-field')
  const messageField = document.getElementById('message-field')
  const nameInput = document.getElementById('note-name')
  const messageInput = document.getElementById('note-message')
  const submitBtn = overlay.querySelector('.note-send-btn')

  const name = nameInput.value.trim()
  const message = messageInput.value.trim()

  nameField.classList.remove('error')
  messageField.classList.remove('error')
  const existingNameError = nameField.querySelector('.note-error-msg')
  if (existingNameError) existingNameError.remove()
  const existingMsgError = messageField.querySelector('.note-error-msg')
  if (existingMsgError) existingMsgError.remove()

  if (!name) {
    nameField.classList.add('error')
    const errMsg = document.createElement('div')
    errMsg.className = 'note-error-msg'
    errMsg.textContent = 'we need to know who you are!'
    nameField.appendChild(errMsg)
    nameInput.focus()
    return
  }

  if (!message) {
    messageField.classList.add('error')
    const errMsg = document.createElement('div')
    errMsg.className = 'note-error-msg'
    errMsg.textContent = 'write them something!'
    messageField.appendChild(errMsg)
    messageInput.focus()
    return
  }

  submitBtn.disabled = true
  submitBtn.classList.add('stamping')
  submitBtn.innerHTML = '<span>sending...</span>'

  try {
    const context = getLocationContext()
    await submitNote(name, message, context)
    showSuccess()
  } catch (err) {
    console.error('Failed to submit note:', err)
    submitBtn.disabled = false
    submitBtn.classList.remove('stamping')
    submitBtn.innerHTML = `
      <span>stamp it</span>
      <svg class="note-send-stamp-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 2L11 13"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
      </svg>
    `
    const form = overlay.querySelector('.note-postcard-form')
    const errDiv = document.createElement('div')
    errDiv.className = 'note-error-msg'
    errDiv.style.textAlign = 'center'
    errDiv.style.marginTop = '8px'
    errDiv.textContent = 'something went wrong, try again?'
    form.appendChild(errDiv)
  }
}

function showSuccess() {
  const postcard = overlay.querySelector('.note-postcard')
  postcard.classList.add('sent')

  setTimeout(() => {
    postcard.classList.remove('sent')
    postcard.innerHTML = `
      <div class="note-success">
        <div class="note-success-icon">&#128140;</div>
        <div class="note-success-text">Sent with love!</div>
        <div class="note-success-sub">they'll see your note next time they check in</div>
      </div>
    `
    postcard.style.animation = 'tumbleIn 0.4s ease-out'

    setTimeout(() => closeNoteFlow(), 2500)
  }, 600)
}
