import './passphrase.css'
import { state, update } from '../state.js'
import { adminAction } from '../supabase.js'
import { openDashboard } from './dashboard.js'

let overlay = null
let adminBtn = null
let mode = 'login'
let isSetup = null

function showAdminButton() {
  if (adminBtn) return
  adminBtn = document.createElement('button')
  adminBtn.className = 'admin-journal-btn'
  adminBtn.setAttribute('aria-label', 'Open journal')
  adminBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="13" y2="11"/></svg>`
  document.body.appendChild(adminBtn)
  adminBtn.addEventListener('click', () => openDashboard())
  requestAnimationFrame(() => adminBtn.classList.add('visible'))
}

export function initPassphrase(container) {
  overlay = document.createElement('div')
  overlay.className = 'passphrase-overlay'
  container.appendChild(overlay)

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePassphrase()
  })

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '5') {
      e.preventDefault()
      if (state.isAdmin) {
        openDashboard()
      } else {
        openPassphrase()
      }
    }
  })
}

async function checkSetup() {
  try {
    const result = await adminAction('check_setup', null)
    isSetup = result.is_setup
  } catch {
    isSetup = false
  }
}

function openPassphrase() {
  checkSetup().then(() => {
    mode = isSetup ? 'login' : 'setup'
    renderForm()
    overlay.classList.add('open')
    setTimeout(() => {
      overlay.querySelector('input')?.focus()
    }, 400)
  })
}

function closePassphrase() {
  overlay.classList.remove('open')
}

function renderForm() {
  const card = overlay.querySelector('.passphrase-card')
  if (card) {
    card.classList.add('passphrase-card--exit')
    setTimeout(() => {
      renderModeContent()
      const newCard = overlay.querySelector('.passphrase-card')
      if (newCard) {
        newCard.style.opacity = '0'
        newCard.style.transform = 'translateY(8px) rotate(-0.5deg)'
        requestAnimationFrame(() => {
          newCard.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out'
          newCard.style.opacity = '1'
          newCard.style.transform = 'translateY(0) rotate(-0.5deg)'
        })
      }
    }, 200)
  } else {
    renderModeContent()
  }
}

function renderModeContent() {
  if (mode === 'setup') {
    renderSetup()
  } else if (mode === 'recover') {
    renderRecover()
  } else {
    renderLogin()
  }
}

function renderLogin() {
  overlay.innerHTML = `
    <div class="passphrase-card">
      <div class="passphrase-tape passphrase-tape--second"></div>
      <div class="passphrase-header">
        <button class="passphrase-close" aria-label="Close">&times;</button>
        <div class="passphrase-lock">&#128274;</div>
        <div class="passphrase-title">hey, it's me</div>
        <div class="passphrase-subtitle">enter your secret passphrase</div>
      </div>
      <form class="passphrase-form" id="passphrase-form">
        <div class="passphrase-field" id="pp-field">
          <label for="pp-input">passphrase</label>
          <input type="password" id="pp-input" placeholder="shhh..." autocomplete="off" />
        </div>
        <div id="pp-error"></div>
        <button type="submit" class="passphrase-submit">unlock</button>
        <button type="button" class="passphrase-mode-link" id="pp-forgot">forgot it?</button>
      </form>
      <div class="passphrase-doodle">&#9728;</div>
    </div>
  `

  overlay.querySelector('.passphrase-close').addEventListener('click', closePassphrase)
  overlay.querySelector('#pp-forgot').addEventListener('click', () => {
    mode = 'recover'
    renderForm()
  })
  overlay.querySelector('#passphrase-form').addEventListener('submit', handleLogin)
}

function renderSetup() {
  overlay.innerHTML = `
    <div class="passphrase-card">
      <div class="passphrase-tape passphrase-tape--second"></div>
      <div class="passphrase-header">
        <button class="passphrase-close" aria-label="Close">&times;</button>
        <div class="passphrase-lock">&#128274;</div>
        <div class="passphrase-title">Welcome, Marlowe!</div>
        <div class="passphrase-subtitle">set up your secret passphrase & a recovery phrase</div>
      </div>
      <form class="passphrase-form" id="passphrase-form">
        <div class="passphrase-field">
          <label for="pp-new">passphrase</label>
          <input type="password" id="pp-new" placeholder="your secret phrase..." autocomplete="off" />
        </div>
        <div class="passphrase-field">
          <label for="pp-recovery">recovery phrase</label>
          <input type="text" id="pp-recovery" placeholder="in case you forget..." autocomplete="off" />
        </div>
        <div id="pp-error"></div>
        <button type="submit" class="passphrase-submit">set it up</button>
      </form>
      <div class="passphrase-doodle">&#9997;</div>
    </div>
  `

  overlay.querySelector('.passphrase-close').addEventListener('click', closePassphrase)
  overlay.querySelector('#passphrase-form').addEventListener('submit', handleSetup)
}

function renderRecover() {
  overlay.innerHTML = `
    <div class="passphrase-card">
      <div class="passphrase-tape passphrase-tape--second"></div>
      <div class="passphrase-header">
        <button class="passphrase-close" aria-label="Close">&times;</button>
        <div class="passphrase-lock">&#128275;</div>
        <div class="passphrase-title">reset passphrase</div>
        <div class="passphrase-subtitle">enter your recovery phrase + a new passphrase</div>
      </div>
      <form class="passphrase-form" id="passphrase-form">
        <div class="passphrase-field">
          <label for="pp-rec-phrase">recovery phrase</label>
          <input type="text" id="pp-rec-phrase" placeholder="the one you set up..." autocomplete="off" />
        </div>
        <div class="passphrase-field">
          <label for="pp-rec-new">new passphrase</label>
          <input type="password" id="pp-rec-new" placeholder="pick something new..." autocomplete="off" />
        </div>
        <div id="pp-error"></div>
        <button type="submit" class="passphrase-submit">reset it</button>
        <button type="button" class="passphrase-mode-link" id="pp-back">back to login</button>
      </form>
      <div class="passphrase-doodle">&#128260;</div>
    </div>
  `

  overlay.querySelector('.passphrase-close').addEventListener('click', closePassphrase)
  overlay.querySelector('#pp-back').addEventListener('click', () => {
    mode = 'login'
    renderForm()
  })
  overlay.querySelector('#passphrase-form').addEventListener('submit', handleRecover)
}

function showError(msg) {
  const el = document.getElementById('pp-error')
  if (el) {
    const div = document.createElement('div')
    div.className = 'passphrase-error'
    div.textContent = msg
    el.innerHTML = ''
    el.appendChild(div)
  }
}

async function handleLogin(e) {
  e.preventDefault()
  const passphrase = document.getElementById('pp-input').value.trim()
  if (!passphrase) {
    document.getElementById('pp-field')?.classList.add('error')
    return
  }

  const btn = overlay.querySelector('.passphrase-submit')
  btn.disabled = true
  btn.textContent = 'checking...'

  try {
    await adminAction('verify', passphrase)
    update('passphrase', passphrase)
    update('isAdmin', true)
    showAdminButton()
    closePassphrase()
    openDashboard()
  } catch (err) {
    showError(err.message || 'wrong passphrase')
    btn.disabled = false
    btn.textContent = 'unlock'
  }
}

async function handleSetup(e) {
  e.preventDefault()
  const passphrase = document.getElementById('pp-new').value.trim()
  const recovery = document.getElementById('pp-recovery').value.trim()

  if (!passphrase || !recovery) {
    showError('both fields are needed')
    return
  }

  const btn = overlay.querySelector('.passphrase-submit')
  btn.disabled = true
  btn.textContent = 'setting up...'

  try {
    await adminAction('setup', null, { passphrase, recovery_phrase: recovery })
    update('passphrase', passphrase)
    update('isAdmin', true)
    isSetup = true
    showAdminButton()
    closePassphrase()
    openDashboard()
  } catch (err) {
    showError(err.message || 'something went wrong')
    btn.disabled = false
    btn.textContent = 'set it up'
  }
}

async function handleRecover(e) {
  e.preventDefault()
  const recovery = document.getElementById('pp-rec-phrase').value.trim()
  const newPass = document.getElementById('pp-rec-new').value.trim()

  if (!recovery || !newPass) {
    showError('both fields are needed')
    return
  }

  const btn = overlay.querySelector('.passphrase-submit')
  btn.disabled = true
  btn.textContent = 'resetting...'

  try {
    await adminAction('recover', null, { recovery_phrase: recovery, passphrase: newPass })
    update('passphrase', newPass)
    update('isAdmin', true)
    showAdminButton()
    closePassphrase()
    openDashboard()
  } catch (err) {
    showError(err.message || 'invalid recovery phrase')
    btn.disabled = false
    btn.textContent = 'reset it'
  }
}
