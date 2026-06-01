/* ═══════════════════════════════════════════
   S.E.N.A.P — DATATABLE COMPONENT
   datatable.js
═══════════════════════════════════════════ */

'use strict';

class AgriTable {
  /**
   * @param {object} config
   * @param {string}   config.tableId      - ID del <table>
   * @param {Array}    config.columns       - [{key, label, render, sortable, class}]
   * @param {Array}    config.data          - Array of row objects
   * @param {string}   [config.searchId]    - ID del input de búsqueda
   * @param {string}   [config.paginationId]- ID del contenedor de paginación
   * @param {string}   [config.infoId]      - ID del span de info
   * @param {number}   [config.perPage]     - Filas por página (default 8)
   * @param {function} [config.onEdit]      - callback(row)
   * @param {function} [config.onDelete]    - callback(row)
   * @param {string}   [config.emptyTitle]  - Título cuando no hay datos
   * @param {string}   [config.emptyDesc]   - Descripción cuando no hay datos
   */
  constructor(config) {
    this.tableId    = config.tableId;
    this.columns    = config.columns || [];
    this.data       = config.data || [];
    this.searchId   = config.searchId;
    this.paginId    = config.paginationId;
    this.infoId     = config.infoId;
    this.perPage    = config.perPage || 8;
    this.onEdit     = config.onEdit;
    this.onDelete   = config.onDelete;
    this.emptyTitle = config.emptyTitle || 'Sin datos';
    this.emptyDesc  = config.emptyDesc  || 'No hay registros para mostrar.';

    this._filtered  = [...this.data];
    this._page      = 1;
    this._sortCol   = null;
    this._sortDir   = 'asc';
    this._query     = '';
    this._activeFilter = '';

    this._init();
  }

  _init() {
    const table = document.getElementById(this.tableId);
    if (!table) return;

    // Inject thead
    const thead = table.querySelector('thead') || table.createTHead();
    thead.innerHTML = this._buildHead();
    thead.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => this._sort(th.dataset.key));
    });

    // Search
    if (this.searchId) {
      const inp = document.getElementById(this.searchId);
      inp?.addEventListener('input', e => { this._query = e.target.value; this._page = 1; this.render(); });
    }

    this.render();
  }

  _buildHead() {
    return '<tr>' + this.columns.map(col => {
      const sortable = col.sortable !== false ? 'sortable' : '';
      return `<th class="${sortable} ${col.class || ''}" data-key="${col.key}">
        ${col.label}
        ${sortable ? '<span class="icon material-symbols-rounded sort-icon">unfold_more</span>' : ''}
      </th>`;
    }).join('') + '</tr>';
  }

  _sort(key) {
    if (this._sortCol === key) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortCol = key; this._sortDir = 'asc';
    }
    // Update header classes
    document.querySelectorAll(`#${this.tableId} thead th`).forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.key === key) th.classList.add(`sort-${this._sortDir}`);
    });
    this._page = 1;
    this.render();
  }

  _applyFilters() {
    let rows = [...this.data];
    // text search
    if (this._query) {
      const q = this._query.toLowerCase();
      rows = rows.filter(row =>
        this.columns.some(col => String(row[col.key] || '').toLowerCase().includes(q))
      );
    }
    // category filter
    if (this._activeFilter) {
      rows = rows.filter(row => {
        return Object.values(row).some(v => String(v) === this._activeFilter);
      });
    }
    // sort
    if (this._sortCol) {
      rows.sort((a, b) => {
        const va = String(a[this._sortCol] || '').toLowerCase();
        const vb = String(b[this._sortCol] || '').toLowerCase();
        return this._sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    this._filtered = rows;
  }

  render() {
    this._applyFilters();
    const table  = document.getElementById(this.tableId);
    if (!table) return;
    const tbody  = table.querySelector('tbody') || table.createTBody();
    const total  = this._filtered.length;
    const pages  = Math.max(1, Math.ceil(total / this.perPage));
    this._page   = Math.min(this._page, pages);
    const start  = (this._page - 1) * this.perPage;
    const slice  = this._filtered.slice(start, start + this.perPage);

    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="${this.columns.length}">
        <div class="dt-empty">
          <div class="dt-empty-icon"><span class="icon material-symbols-rounded">search_off</span></div>
          <div class="dt-empty-title">${this.emptyTitle}</div>
          <div class="dt-empty-desc">${this.emptyDesc}</div>
        </div>
      </td></tr>`;
    } else {
      tbody.innerHTML = slice.map(row => this._buildRow(row)).join('');
    }

    this._renderPagination(total, start, slice.length, pages);
    this._renderInfo(total, start, slice.length);
  }

  _buildRow(row) {
    const cells = this.columns.map(col => {
      let val;
      if (col.render) { val = col.render(row); }
      else { val = escHtml(String(row[col.key] ?? '')); }
      return `<td class="${col.class || ''}">${val}</td>`;
    });
    return `<tr data-id="${row.id || ''}">${cells.join('')}</tr>`;
  }

  _renderPagination(total, start, count, pages) {
    const el = document.getElementById(this.paginId);
    if (!el) return;
    if (pages <= 1) { el.innerHTML = ''; return; }
    const p = this._page;
    let btns = '';
    btns += `<button class="dt-page-btn" onclick="_dtGoPage('${this.tableId}',${p - 1})" ${p <= 1 ? 'disabled' : ''}>
      <span class="icon material-symbols-rounded" style="font-size:16px">chevron_left</span></button>`;
    for (let i = 1; i <= pages; i++) {
      if (pages > 7 && Math.abs(i - p) > 2 && i !== 1 && i !== pages) {
        if (i === 2 || i === pages - 1) btns += `<span class="dt-page-btn" style="border:none;pointer-events:none;opacity:.4">…</span>`;
        continue;
      }
      btns += `<button class="dt-page-btn ${i === p ? 'active' : ''}" onclick="_dtGoPage('${this.tableId}',${i})">${i}</button>`;
    }
    btns += `<button class="dt-page-btn" onclick="_dtGoPage('${this.tableId}',${p + 1})" ${p >= pages ? 'disabled' : ''}>
      <span class="icon material-symbols-rounded" style="font-size:16px">chevron_right</span></button>`;
    el.innerHTML = btns;
  }

  _renderInfo(total, start, count) {
    const el = document.getElementById(this.infoId);
    if (!el || total === 0) { if (el) el.textContent = ''; return; }
    el.textContent = `Mostrando ${start + 1}–${start + count} de ${total} registros`;
  }

  // Public API
  setFilter(value) { this._activeFilter = value; this._page = 1; this.render(); }
  setData(data) { this.data = data; this._filtered = [...data]; this._page = 1; this.render(); }
  addRow(row) { this.data.unshift(row); this._page = 1; this.render(); }
  updateRow(id, updated) {
    const idx = this.data.findIndex(r => r.id === id);
    if (idx > -1) { this.data[idx] = { ...this.data[idx], ...updated }; this.render(); }
  }
  deleteRow(id) { this.data = this.data.filter(r => r.id !== id); this.render(); }
  getById(id) { return this.data.find(r => r.id === id); }
}

// Global page change helper (called from inline onclick)
const _dtInstances = {};
function _dtGoPage(tableId, page) {
  const inst = _dtInstances[tableId];
  if (inst) { inst._page = page; inst.render(); }
}
