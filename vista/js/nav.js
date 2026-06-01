/* ═══════════════════════════════════════════
   S.E.N.A.P — SHARED NAV COMPONENT
   nav.js — Injects sidebar + topbar HTML and manages navigation
═══════════════════════════════════════════ */

'use strict';

function buildNav(config = {}) {
  const { activePage = '', title = 'Dashboard', titleIcon = 'dashboard' } = config;

  // Obtener sesión si existe, pero NO redirigir — las vistas son independientes
  const user = getSession() || { name: 'Usuario', email: '', role: 'Operador', avatar: 'https://i.pravatar.cc/80?img=11' };

  // ── SIDEBAR HTML ──
  const sidebarHTML = `
  <div id="sidebar">
    <div class="sidebar-brand">
      <div class="brand-icon"><span class="icon material-symbols-rounded">eco</span></div>
      <div>
        <div class="brand-name">S.E.N.A.P</div>
        <div class="brand-sub">Agrop. el Manantial de las Melinas</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Principal</div>
      <a class="nav-link" data-page="dashboard.html" href="dashboard.html">
        <span class="icon material-symbols-rounded">dashboard</span> Inicio
      </a>
      <a class="nav-link" data-page="modulo.html" href="modulo.html">
        <span class="icon material-symbols-rounded">table_rows</span> Módulo
      </a>

      <div class="nav-section-label" style="margin-top:6px;">Gestión</div>
      <a class="nav-link" href="#" onclick="return false;">
        <span class="icon material-symbols-rounded">sprinkler</span> Cultivos
      </a>
      <a class="nav-link" href="#" onclick="return false;">
        <span class="icon material-symbols-rounded">pets</span> Ganadería
      </a>
      <a class="nav-link" href="#" onclick="return false;">
        <span class="icon material-symbols-rounded">inventory_2</span> Inventario
        <span class="nav-badge">3</span>
      </a>
      <a class="nav-link" href="#" onclick="return false;">
        <span class="icon material-symbols-rounded">build</span> Mantenimiento
      </a>

      <div class="nav-section-label" style="margin-top:6px;">Sistema</div>
      <a class="nav-link" href="#" onclick="return false;">
        <span class="icon material-symbols-rounded">bar_chart</span> Reportes
      </a>
      <a class="nav-link" data-page="perfil.html" href="perfil.html">
        <span class="icon material-symbols-rounded">account_circle</span> Mi Perfil
      </a>
      <a class="nav-link" data-page="configuracion.html" href="configuracion.html">
        <span class="icon material-symbols-rounded">settings</span> Configuración
      </a>
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <img class="sidebar-avatar" data-user-avatar src="https://i.pravatar.cc/80?img=11" alt="Avatar"/>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name" data-user-name>Cargando…</div>
          <div class="sidebar-user-role" data-user-role>Gerente</div>
        </div>
        <button class="logout-btn-icon" onclick="logout()" title="Cerrar sesión">
          <span class="icon material-symbols-rounded">logout</span>
        </button>
      </div>
    </div>
  </div>
  <div class="sidebar-overlay" id="sidebarOverlay"></div>`;

  // ── TOPBAR HTML ──
  const topbarHTML = `
  <div class="topbar">
    <button class="topbar-hamburger" id="hamburger">
      <span class="icon material-symbols-rounded">menu</span>
    </button>
    <div class="topbar-title">
      <span class="icon material-symbols-rounded">${titleIcon}</span>
      ${title}
    </div>
    <div class="topbar-spacer"></div>
    <div class="topbar-search">
      <span class="icon material-symbols-rounded search-icon">search</span>
      <input type="text" placeholder="Buscar…" id="globalSearch"/>
    </div>
    <div class="topbar-actions">
      <button class="btn-icon notif-wrap" id="notifBtn" title="Notificaciones" onclick="triggerDemoNotif()">
        <span class="icon material-symbols-rounded">notifications</span>
        <span class="notif-badge" id="notifDot"></span>
      </button>
      <button class="theme-btn" data-action="toggle-theme" title="Cambiar tema">
        <span class="icon material-symbols-rounded" data-theme-icon>dark_mode</span>
      </button>
      <img class="topbar-avatar" data-user-avatar src="https://i.pravatar.cc/80?img=11" alt="Avatar" onclick="window.location.href='perfil.html'" title="Ver perfil"/>
    </div>
  </div>`;

  // ── INJECT ──
  const shell = document.getElementById('appShell');
  if (shell) {
    shell.insertAdjacentHTML('afterbegin', sidebarHTML);
    const mainContent = shell.querySelector('.main-content');
    if (mainContent) mainContent.insertAdjacentHTML('afterbegin', topbarHTML);
  }

  // ── POST-INIT ──
  fillUserUI(user);
  initSidebar();
  applyTheme(currentTheme);

  // Registrar botones de tema inyectados dinámicamente
  document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
    btn.removeEventListener('click', toggleTheme); // evitar duplicados
    btn.addEventListener('click', toggleTheme);
  });

  // highlight active page
  const page = activePage || location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link[data-page]').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });
}

// Demo notification trigger from bell
let _notifCount = 0;
const _pushMessages = [
  { t:'🌧 Alerta Climática', b:'Lluvia prevista para mañana. Se recomienda adelantar el riego.', type:'warning' },
  { t:'🐄 Revisión Veterinaria', b:'Control pendiente en Sección C — 2 animales requieren atención.', type:'error' },
  { t:'📦 Inventario', b:'Semillas de maíz por debajo del stock mínimo. Solicita reposición.', type:'info' },
  { t:'✅ Ciclo Completado', b:'Riego del Campo 4B completado correctamente.', type:'success' },
  { t:'⚙️ Mantenimiento', b:'Tractor 4 reporta falla hidráulica. Revisar antes de operar.', type:'error' },
];
function triggerDemoNotif() {
  const msg = _pushMessages[_notifCount % _pushMessages.length];
  pushNotif(msg.t, msg.b, msg.type);
  _notifCount++;
  document.getElementById('notifDot')?.style.setProperty('display', 'block');
}
