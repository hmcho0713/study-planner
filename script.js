const JSONBIN_KEY = '$2a$10$7sRNguFjn2jUIM4uqOXTRuK3Ptq8BxhC.iZi.BwygKP/aWIxrihC2'
const JSONBIN_ID = '69d056f736566621a8791060'
const PLANNER_BIN_ID = '69d05c7faaba882197c1e515'

const DDAYS = [
  { name: '1학기 중간고사', date: '2026-04-23' },
  { name: '6월 모의고사', date: '2026-06-04'},
  { name: '9월 모의고사', date:'2026-09-03'}
]

const BASE_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`
const PLANNER_URL = `https://api.jsonbin.io/v3/b/${PLANNER_BIN_ID}`
const HEADERS = {
  'Content-Type': 'application/json',
  'X-Master-Key': JSONBIN_KEY
}

let data = { tasks: [], posts: [], studies: [], performances: [] }
let currentUser = null
let overlayIsLogin = true

function getLoggedInUser() {
  const saved = localStorage.getItem('planner-user')
  if (saved) { currentUser = JSON.parse(saved); return currentUser }
  return null
}

function requireLogin() {
  if (!getLoggedInUser()) { showLoginOverlay(); return false }
  return true
}

function createLoginOverlay() {
  const overlay = document.createElement('div')
  overlay.id = 'login-overlay'
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;'
  overlay.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;width:90%;max-width:360px">
      <h2 style="font-size:18px;font-weight:600;margin-bottom:1.5rem;text-align:center" id="overlay-title">로그인</h2>
      <div style="color:#e24b4a;font-size:13px;text-align:center;margin-bottom:8px;min-height:18px" id="overlay-error"></div>
      <input id="overlay-name" placeholder="이름" style="width:100%;height:40px;border:1px solid #e5e5e5;border-radius:8px;padding:0 12px;font-size:14px;margin-bottom:10px;outline:none;background:#f5f5f5;box-sizing:border-box"/>
      <input id="overlay-pw" type="password" placeholder="비밀번호" style="width:100%;height:40px;border:1px solid #e5e5e5;border-radius:8px;padding:0 12px;font-size:14px;margin-bottom:10px;outline:none;background:#f5f5f5;box-sizing:border-box"/>
      <button onclick="handleOverlayAuth()" style="width:100%;height:40px;border-radius:8px;border:none;background:#1a1a2e;color:white;font-size:14px;cursor:pointer;margin-bottom:8px">확인</button>
      <div style="text-align:center;font-size:13px;color:#888;cursor:pointer" onclick="toggleOverlayMode()">계정이 없으신가요? <span style="color:#185FA5" id="overlay-switch">회원가입</span></div>
    </div>
  `
  document.body.appendChild(overlay)
  document.getElementById('overlay-pw').addEventListener('keydown', e => { if (e.key === 'Enter') handleOverlayAuth() })
}

function showLoginOverlay() {
  if (!document.getElementById('login-overlay')) createLoginOverlay()
  document.getElementById('login-overlay').style.display = 'flex'
}

function hideLoginOverlay() {
  const overlay = document.getElementById('login-overlay')
  if (overlay) overlay.style.display = 'none'
}

function toggleOverlayMode() {
  overlayIsLogin = !overlayIsLogin
  document.getElementById('overlay-title').textContent = overlayIsLogin ? '로그인' : '회원가입'
  document.getElementById('overlay-switch').textContent = overlayIsLogin ? '회원가입' : '로그인'
  document.getElementById('overlay-error').textContent = ''
}

async function handleOverlayAuth() {
  const name = document.getElementById('overlay-name').value.trim()
  const pw = document.getElementById('overlay-pw').value.trim()
  if (!name || !pw) { document.getElementById('overlay-error').textContent = '이름과 비밀번호를 입력해줘!'; return }

  // 로딩 표시
  const btn = document.querySelector('#login-overlay button')
  btn.textContent = '확인 중...'
  btn.disabled = true

  const res = await fetch(PLANNER_URL + '/latest', { headers: HEADERS })
  const json = await res.json()
  const pdata = json.record
  const user = pdata.users.find(u => u.name === name)

  if (overlayIsLogin) {
    if (!user) { document.getElementById('overlay-error').textContent = '존재하지 않는 계정이야!'; btn.textContent = '확인'; btn.disabled = false; return }
    if (user.pw !== pw) { document.getElementById('overlay-error').textContent = '비밀번호가 틀렸어!'; btn.textContent = '확인'; btn.disabled = false; return }
    currentUser = user
  } else {
    if (user) { document.getElementById('overlay-error').textContent = '이미 존재하는 이름이야!'; btn.textContent = '확인'; btn.disabled = false; return }
    currentUser = { name, pw }
    pdata.users.push(currentUser)
    await fetch(PLANNER_URL, { method: 'PUT', headers: HEADERS, body: JSON.stringify(pdata) })
  }

  localStorage.setItem('planner-user', JSON.stringify(currentUser))
  hideLoginOverlay()
  if (typeof onLoginSuccess === 'function') onLoginSuccess()
}

function logout() {
  localStorage.removeItem('planner-user')
  currentUser = null
  showLoginOverlay()
}

async function save() {
  await fetch(BASE_URL, { method: 'PUT', headers: HEADERS, body: JSON.stringify(data) })
}