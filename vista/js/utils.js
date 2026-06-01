/* ═══════════════════════════════════════════
   S.E.N.A.P — SHARED UTILITIES
   utils.js
═══════════════════════════════════════════ */

'use strict';

/* ── THEME ── */
const THEME_KEY = 'agri_theme';
let currentTheme = localStorage.getItem(THEME_KEY) || 'light';

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll('[data-theme-icon]').forEach(el => {
    el.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  });
  const dm = document.getElementById('pref-darkmode');
  if (dm) dm.checked = theme === 'dark';
}
function toggleTheme() { applyTheme(currentTheme === 'light' ? 'dark' : 'light'); }

// Aplicar tema de inmediato (antes del DOMContentLoaded)
applyTheme(currentTheme);

/* ── TOAST ── */
let toastId = 0;
function toast(title, message = '', type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const id = ++toastId;
  const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.id = `toast-${id}`;
  el.innerHTML = `
    <div class="toast-icon"><span class="icon material-symbols-rounded">${icons[type] || 'check_circle'}</span></div>
    <div style="flex:1;min-width:0">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="closeToast(${id})">
      <span class="icon material-symbols-rounded">close</span>
    </button>`;
  container.appendChild(el);
  requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('show')); });
  const timer = setTimeout(() => closeToast(id), duration);
  el._timer = timer;
  return id;
}
function closeToast(id) {
  const el = document.getElementById(`toast-${id}`);
  if (!el) return;
  clearTimeout(el._timer);
  el.classList.add('hide');
  setTimeout(() => el.remove(), 350);
}

/* ── PUSH NOTIFICATION ── */
let pushId = 0;
function pushNotif(title, body = '', type = 'success', duration = 5000) {
  const container = document.getElementById('pushContainer');
  if (!container) return;
  const id = ++pushId;
  const icons = { success: 'notifications_active', error: 'error_outline', warning: 'warning_amber', info: 'info_outline' };
  const el = document.createElement('div');
  el.className = `push-card push-${type}`;
  el.id = `push-${id}`;
  const time = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  el.innerHTML = `
    <span class="icon material-symbols-rounded push-icon">${icons[type]}</span>
    <div class="push-content">
      <div class="push-title">${title}</div>
      ${body ? `<div class="push-body">${body}</div>` : ''}
      <div class="push-time"><span class="icon material-symbols-rounded" style="font-size:13px">schedule</span>${time}</div>
    </div>
    <button class="push-close" onclick="closePush(${id})">
      <span class="icon material-symbols-rounded">close</span>
    </button>`;
  container.appendChild(el);
  requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('show')); });
  if (duration > 0) setTimeout(() => closePush(id), duration);
  return id;
}
function closePush(id) {
  const el = document.getElementById(`push-${id}`);
  if (!el) return;
  el.classList.remove('show');
  setTimeout(() => el.remove(), 400);
}

/* ── SESSION / AUTH ── */
const SESSION_KEY = 'agri_session';
function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('agri_remember');
}
function requireAuth() {
  const sess = getSession();
  if (!sess) { window.location.href = 'login.html'; return null; }
  return sess;
}
function logout() {
  if (!confirm('¿Seguro que deseas cerrar sesión?')) return;
  clearSession();
  toast('Sesión cerrada', 'Hasta pronto!', 'info', 2000);
  setTimeout(() => window.location.href = 'login.html', 700);
}

/* ── FORMAT HELPERS ── */
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtMoney(n) {
  return '$' + Number(n).toLocaleString('es', { minimumFractionDigits: 0 });
}
function escHtml(s) {
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

/* ── MODAL HELPERS ── */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
  m.querySelector('[autofocus]')?.focus();
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}
// Close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});
// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});

/* ── CONFIRM DIALOG ── */
function confirmDialog(message, onConfirm, onCancel) {
  const modal = document.getElementById('confirmModal');
  if (!modal) { if (confirm(message)) onConfirm(); return; }
  document.getElementById('confirmMsg').textContent = message;
  openModal('confirmModal');
  document.getElementById('confirmOkBtn').onclick = () => { closeModal('confirmModal'); onConfirm(); };
  document.getElementById('confirmCancelBtn').onclick = () => { closeModal('confirmModal'); if (onCancel) onCancel(); };
}

/* ── SIDEBAR TOGGLE ── */
function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburger');
  if (!sidebar) return;
  hamburger?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay?.classList.toggle('open');
  });
  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
  // highlight active nav
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[data-page]').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });
}

/* ── FILL USER UI ── */
function fillUserUI(user) {
  if (!user) return;
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name || '');
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email || '');
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = user.role || 'Gerente de Finca');
  document.querySelectorAll('[data-user-avatar]').forEach(el => el.src = user.avatar || 'https://i.pravatar.cc/80?img=11');
  const wm = document.getElementById('welcomeMsg');
  if (wm) wm.textContent = `¡Hola, ${(user.name || '').split(' ')[0]}! 🌿`;
}

/* ── DOM READY ── */
document.addEventListener('DOMContentLoaded', () => {
  // Re-aplicar tema para actualizar iconos de botones ya renderizados
  applyTheme(currentTheme);

  // Theme buttons
  document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
  // Sidebar
  initSidebar();
});
