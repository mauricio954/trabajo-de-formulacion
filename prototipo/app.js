/* ═══════════════════════════════════════════
   Roma Bag's — Prototipo Fase 1 · Lógica
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── Data Store (simula BD Odoo) ───
  const PRODUCTS = [
    { id: 1, name: 'Cartera Negra Mod. A', sku: 'RB-CNA-001', stock: 12, price: 45, cost: 22, emoji: '👜' },
    { id: 2, name: 'Cartera Marrón Mod. B', sku: 'RB-CMB-002', stock: 8, price: 55, cost: 28, emoji: '👜' },
    { id: 3, name: 'Bolso Crema Mod. C', sku: 'RB-BCC-003', stock: 3, price: 65, cost: 30, emoji: '👝' },
    { id: 4, name: 'Mochila Negra Mod. D', sku: 'RB-MND-004', stock: 15, price: 40, cost: 18, emoji: '🎒' },
    { id: 5, name: 'Cartera Roja Mod. E', sku: 'RB-CRE-005', stock: 1, price: 50, cost: 25, emoji: '👜' },
    { id: 6, name: 'Bolso Beige Mod. F', sku: 'RB-BBF-006', stock: 20, price: 48, cost: 23, emoji: '👝' },
  ];

  const CLIENTS = [
    { id: 1, name: 'Mayorista Lima Norte', type: 'Mayorista' },
    { id: 2, name: 'Mayorista Gamarra', type: 'Mayorista' },
    { id: 3, name: 'Cliente Minorista', type: 'Minorista' },
  ];

  const MOVEMENTS = [
    { productId: 1, type: 'sale', qty: -2, date: '01 Jul', client: 'Mayorista Lima Norte' },
    { productId: 1, type: 'sale', qty: -1, date: '30 Jun', client: 'Cliente Minorista' },
    { productId: 1, type: 'entry', qty: +10, date: '28 Jun', client: 'Producción' },
    { productId: 2, type: 'sale', qty: -3, date: '01 Jul', client: 'Mayorista Gamarra' },
    { productId: 2, type: 'entry', qty: +5, date: '29 Jun', client: 'Producción' },
  ];

  let currentUser = null;
  let selectedProduct = null;
  let salesLog = [];

  // ─── DOM Helpers ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  }

  function showToast(msg, isError) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast' + (isError ? ' error' : '');
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  function stockClass(qty) {
    if (qty <= 2) return 'critical';
    if (qty <= 5) return 'low';
    return 'ok';
  }

  // ─── Render Functions ───
  function renderHome() {
    const greeting = currentUser === 'gerencia' ? 'Natalie' : currentUser === 'ventas' ? 'Vendedor' : 'Producción';
    $('#home-name').textContent = `Hola, ${greeting}`;

    const totalStock = PRODUCTS.reduce((s, p) => s + p.stock, 0);
    const lowStock = PRODUCTS.filter(p => p.stock <= 5).length;
    const todaySales = salesLog.length;

    $('#stat-total').textContent = totalStock;
    $('#stat-low').textContent = lowStock;
    $('#stat-sales').textContent = todaySales;
  }

  function renderInventory() {
    const container = $('#product-list');
    const search = ($('#search-input') || {}).value || '';
    const filtered = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    );

    container.innerHTML = filtered.map(p => `
      <div class="product-card" data-pid="${p.id}">
        <div class="product-thumb">${p.emoji}</div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-sku">${p.sku}</div>
        </div>
        <div class="product-stock">
          <div class="stock-num ${stockClass(p.stock)}">${p.stock}</div>
          <div class="stock-label">unidades</div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedProduct = PRODUCTS.find(p => p.id === parseInt(card.dataset.pid));
        renderProductDetail();
        showScreen('scr-detail');
      });
    });
  }

  function renderProductDetail() {
    if (!selectedProduct) return;
    const p = selectedProduct;
    $('#detail-emoji').textContent = p.emoji;
    $('#detail-name').textContent = p.name;
    $('#detail-sku').textContent = p.sku;
    $('#detail-stock').textContent = p.stock;
    $('#detail-stock').className = 'd-stat-val ' + stockClass(p.stock);
    $('#detail-price').textContent = 'S/.' + p.price;
    $('#detail-cost').textContent = 'S/.' + p.cost;

    const movs = MOVEMENTS.filter(m => m.productId === p.id);
    const movContainer = $('#movement-list');
    movContainer.innerHTML = movs.map(m => `
      <div class="mov-item">
        <div>
          <span class="mov-type ${m.type}">${m.type === 'sale' ? '↓ Venta' : '↑ Ingreso'}</span>
          <span style="margin-left:.4rem;color:var(--text2)">${m.client}</span>
        </div>
        <div>
          <span style="font-weight:600">${m.qty > 0 ? '+' : ''}${m.qty}</span>
          <span class="mov-date" style="margin-left:.3rem">${m.date}</span>
        </div>
      </div>
    `).join('');
  }

  function renderSalesForm() {
    const sel = $('#sale-product');
    sel.innerHTML = '<option value="">Seleccionar modelo...</option>' +
      PRODUCTS.filter(p => p.stock > 0).map(p =>
        `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`
      ).join('');

    const clientSel = $('#sale-client');
    clientSel.innerHTML = '<option value="">Seleccionar cliente...</option>' +
      CLIENTS.map(c => `<option value="${c.id}">${c.name} — ${c.type}</option>`).join('');

    $('#sale-qty').value = '1';
    updateSaleSummary();
  }

  function updateSaleSummary() {
    const pid = parseInt($('#sale-product').value);
    const qty = parseInt($('#sale-qty').value) || 0;
    const p = PRODUCTS.find(pr => pr.id === pid);
    const summary = $('#sale-summary');

    if (!p || qty <= 0) {
      summary.innerHTML = '<span style="color:var(--text3)">Seleccione producto y cantidad</span>';
      return;
    }
    if (qty > p.stock) {
      summary.innerHTML = `<span style="color:var(--danger)">⚠ Stock insuficiente (disponible: ${p.stock})</span>`;
      return;
    }
    const total = qty * p.price;
    summary.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:.2rem">
        <span>${p.name} × ${qty}</span>
        <span style="font-weight:700">S/. ${total}</span>
      </div>
      <div style="font-size:.6rem;color:var(--success)">
        ✓ Stock disponible: ${p.stock} → quedará: ${p.stock - qty}
      </div>
    `;
  }

  function processSale() {
    const pid = parseInt($('#sale-product').value);
    const qty = parseInt($('#sale-qty').value) || 0;
    const cid = parseInt($('#sale-client').value);
    const p = PRODUCTS.find(pr => pr.id === pid);
    const c = CLIENTS.find(cl => cl.id === cid);

    if (!p) return showToast('Seleccione un producto', true);
    if (!c) return showToast('Seleccione un cliente', true);
    if (qty <= 0) return showToast('Cantidad inválida', true);
    if (qty > p.stock) return showToast('Stock insuficiente', true);

    // Descuento automático de stock
    p.stock -= qty;
    const total = qty * p.price;

    // Log
    salesLog.push({ product: p.name, qty, client: c.name, total, time: new Date().toLocaleTimeString() });
    MOVEMENTS.unshift({ productId: p.id, type: 'sale', qty: -qty, date: 'Hoy', client: c.name });

    showToast(`✓ Venta registrada: ${p.name} × ${qty} = S/.${total}`);
    renderSalesForm();
    renderHome();
  }

  function renderUserScreen() {
    const roles = {
      gerencia: {
        name: 'Natalie (Gerencia)', initials: 'NG', role: 'Administradora',
        perms: [
          { label: 'Ver inventario completo', ok: true },
          { label: 'Registrar ventas', ok: true },
          { label: 'Ver costos y márgenes', ok: true },
          { label: 'Gestionar usuarios', ok: true },
          { label: 'Exportar a Excel', ok: true },
        ]
      },
      ventas: {
        name: 'Equipo de Ventas', initials: 'EV', role: 'Vendedor',
        perms: [
          { label: 'Ver inventario (stock)', ok: true },
          { label: 'Registrar ventas', ok: true },
          { label: 'Ver costos y márgenes', ok: false },
          { label: 'Gestionar usuarios', ok: false },
          { label: 'Exportar a Excel', ok: false },
        ]
      },
      produccion: {
        name: 'Socio de Producción', initials: 'SP', role: 'Producción (Solo lectura)',
        perms: [
          { label: 'Ver inventario (stock)', ok: true },
          { label: 'Registrar ventas', ok: false },
          { label: 'Ver costos y márgenes', ok: false },
          { label: 'Gestionar usuarios', ok: false },
          { label: 'Ver qué se vendió hoy', ok: true },
        ]
      }
    };

    const r = roles[currentUser] || roles.gerencia;
    $('#profile-initials').textContent = r.initials;
    $('#profile-name').textContent = r.name;
    $('#profile-role').textContent = r.role;
    $('#perm-list').innerHTML = r.perms.map(p => `
      <div class="perm-item">
        <span class="${p.ok ? 'perm-check' : 'perm-cross'}">${p.ok ? '✓' : '✕'}</span>
        <span>${p.label}</span>
      </div>
    `).join('');
  }

  // ─── Event Binding ───
  function init() {
    // Role selection (login)
    $$('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentUser = btn.dataset.role;
        renderHome();
        showScreen('scr-home');
      });
    });

    // Module cards navigation
    $$('[data-goto]').forEach(el => {
      el.addEventListener('click', () => {
        const target = el.dataset.goto;
        if (target === 'scr-inventory') renderInventory();
        if (target === 'scr-sales') renderSalesForm();
        if (target === 'scr-users') renderUserScreen();
        showScreen(target);
      });
    });

    // Back buttons
    $$('[data-back]').forEach(el => {
      el.addEventListener('click', () => {
        const target = el.dataset.back;
        if (target === 'scr-home') renderHome();
        if (target === 'scr-inventory') renderInventory();
        showScreen(target);
      });
    });

    // Search
    const searchInput = $('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => renderInventory());
    }

    // Sale form events
    const saleProd = $('#sale-product');
    const saleQty = $('#sale-qty');
    if (saleProd) saleProd.addEventListener('change', updateSaleSummary);
    if (saleQty) saleQty.addEventListener('input', updateSaleSummary);

    const saleBtn = $('#btn-sale');
    if (saleBtn) saleBtn.addEventListener('click', processSale);

    // Bottom nav
    $$('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const target = item.dataset.goto;
        if (target === 'scr-inventory') renderInventory();
        if (target === 'scr-sales') renderSalesForm();
        if (target === 'scr-users') renderUserScreen();
        if (target === 'scr-home') renderHome();
        showScreen(target);
      });
    });

    // Logout
    const logoutBtn = $('#btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        currentUser = null;
        showScreen('scr-login');
      });
    }

    // Excel export simulation
    const excelBtn = $('#btn-excel');
    if (excelBtn) {
      excelBtn.addEventListener('click', () => {
        showToast('📊 Exportación a Excel simulada — datos sincronizados');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
