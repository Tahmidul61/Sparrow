// ═══════════════════════════════════════════════════════════════
// navigation.js — Hamburger menu, sidenav, modals, auth, profile
// Completely independent from catalogue.js and ranking.js
// ═══════════════════════════════════════════════════════════════

var CUST_KEY = 'bismiCustomers';
var SESS_KEY  = 'bismiSession';

// ── SIDENAV ──────────────────────────────────────────────────
function openSideNav() {
  document.getElementById('sidenav').classList.add('open');
  document.getElementById('sidenavOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
  updateSidenavProfile();
}

function closeSideNav() {
  var sn = document.getElementById('sidenav');
  var ov = document.getElementById('sidenavOverlay');
  if (sn) sn.classList.remove('open');
  if (ov) ov.classList.remove('show');
  document.body.style.overflow = '';
}

// ── GENERIC MODAL ─────────────────────────────────────────────
function openModal(id) {
  var m = document.getElementById(id);
  if (m) { m.classList.add('show'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  var m = document.getElementById(id);
  if (m) { m.classList.remove('show'); document.body.style.overflow = ''; }
}

// ── SECTION OPENERS ───────────────────────────────────────────
function openAboutUs() {
  closeSideNav();
  var content = document.getElementById('aboutUsContent');
  if (content) {
    var txt = (BIZ && BIZ.aboutUs) ? BIZ.aboutUs : DEFAULT_ABOUT_US;
    content.innerHTML = txt;
  }
  openModal('aboutUsModal');
}

function openContact() {
  closeSideNav();
  openModal('contactUsModal');
}

function openFlavours() {
  closeSideNav();
  // Switch to cakes view first (which shows flavoursSection)
  if(typeof showCakesView === 'function') showCakesView();
  setTimeout(function(){
    var el = document.getElementById('flavoursSection');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}

function openAllergens() {
  closeSideNav();
  renderAllergens(ALLERGENS);
  var s = document.getElementById('allergenSearch');
  if (s) s.value = '';
  openModal('allergensModal');
}

function openHowToOrder() {
  closeSideNav();
  // Switch to cakes view first (which shows howSection)
  if(typeof showCakesView === 'function') showCakesView();
  setTimeout(function(){
    var el = document.getElementById('howSection');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if(typeof openModal === 'function') openModal('howToOrderModal');
  }, 200);
}

function openReviewModal() {
  // Heart burst animation
  var burst = document.getElementById('reviewHeartBurst');
  if (burst) {
    burst.innerHTML = '';
    for (var i = 0; i < 6; i++) {
      var h = document.createElement('span');
      h.className = 'heart-particle';
      h.style.cssText = '--angle:' + (i * 60) + 'deg';
      h.textContent = '♥';
      burst.appendChild(h);
    }
    burst.classList.add('burst-active');
    setTimeout(function () { burst.classList.remove('burst-active'); burst.innerHTML = ''; }, 600);
  }
  window.open('https://g.page/r/CS1eY1P4V0IxEBM/review', '_blank');
}

// ── STAFF PORTAL ──────────────────────────────────────────────
function openStaffPortal() {
  closeSideNav();
  window.location.href = 'login.html';
}

// ── DISMISS WHATSAPP FLOAT ────────────────────────────────────
function dismissWA() {
  var w = document.getElementById('waFloat');
  if (w) {
    w.style.transition = 'all .3s ease';
    w.style.opacity = '0';
    w.style.transform = 'scale(.8)';
    setTimeout(function () { w.style.display = 'none'; }, 300);
  }
}

// ── LANGUAGE ──────────────────────────────────────────────────
function setLang(l, silent) {
  currentLang = l;
  localStorage.setItem('bismiLang', l);
  var btnEN = document.getElementById('btnEN');
  var btnPT = document.getElementById('btnPT');
  if (btnEN) btnEN.classList.toggle('active', l === 'en');
  if (btnPT) btnPT.classList.toggle('active', l === 'pt');
  // Update static text nodes
  _updateStaticText();
  if (!silent) renderAll();
  updateSidenavProfile();
}

function _updateStaticText() {
  var map = {
    'heroBadgeTxt': '<i class="fas fa-star" style="color:#f59e0b"></i> ' +
      t('5 Stars on Google · 90+ Reviews', '5 Estrelas no Google · 90+ Avaliações'),
    'heroOrderTxt': t('Order Now', 'Encomendar'),
    'ctaTitle':     t('Ready to Order?', 'Pronto para Encomendar?'),
    'ctaSub':       t('Fresh artisan cakes delivered to your door. Minimum 24h notice.',
                      'Bolos artesanais frescos entregues à sua porta. Mínimo 24h.'),
    'ctaBtnTxt':    t('Message Us', 'Enviar Mensagem')
  };
  Object.keys(map).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = map[id];
  });
}

// ── GRID SIZE ─────────────────────────────────────────────────
var gridCols = parseInt(localStorage.getItem('bismiGrid') || '2');

function setGridUI(n) {
  ['grid1', 'grid2', 'grid3'].forEach(function (id, i) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('active', i + 1 === n);
  });
}

function setGrid(n) {
  gridCols = n;
  localStorage.setItem('bismiGrid', n);
  setGridUI(n);
  renderCatalogue();
}

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-tab').forEach(function (b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderCatalogue();
  var cs = document.getElementById('catalogueSection');
  if (cs) setTimeout(function () { cs.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
}

// ── AUTH ──────────────────────────────────────────────────────
function getSession()  { try { return JSON.parse(localStorage.getItem(SESS_KEY) || 'null'); } catch(e) { return null; } }
function saveSession(s){ try { localStorage.setItem(SESS_KEY, JSON.stringify(s)); } catch(e) {} }
function clearSession(){ try { localStorage.removeItem(SESS_KEY); } catch(e) {} }
function getCustomers(){ try { return JSON.parse(localStorage.getItem(CUST_KEY) || '[]'); } catch(e) { return []; } }
function saveCustomers(a) {
  try { localStorage.setItem(CUST_KEY, JSON.stringify(a)); } catch(e) {}
  fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(a)
  }).catch(function () {});
}

function openProfile() {
  renderProfileBody();
  openModal('profileModal');
}

function closeProfile() { closeModal('profileModal'); }

function renderProfileBody() {
  var body = document.getElementById('profileBody');
  if (!body) return;
  var session = getSession();
  if (session) {
    body.innerHTML =
      '<div style="text-align:center;margin-bottom:16px">' +
      '<div class="profile-avatar"><i class="fas fa-user" style="font-size:1.5rem;color:var(--acc-d)"></i></div>' +
      '<div class="profile-name">' + session.name + '</div>' +
      '<div class="profile-email">' + session.email + '</div>' +
      '</div>' +
      '<button onclick="clearSession();closeProfile();showToast(\'Signed out\',\'info\');updateSidenavProfile()" class="logout-btn">' +
      '<i class="fas fa-sign-out-alt"></i> ' + t('Sign Out', 'Terminar Sessão') + '</button>';
  } else {
    body.innerHTML =
      '<div class="auth-tabs">' +
      '<button class="auth-tab active" id="tabLogin" onclick="switchAuthTab(\'login\')">' + t('Sign In', 'Entrar') + '</button>' +
      '<button class="auth-tab" id="tabRegister" onclick="switchAuthTab(\'register\')">' + t('Register', 'Registar') + '</button>' +
      '</div><div id="authForm"></div>';
    switchAuthTab('login');
  }
}

function switchAuthTab(tab) {
  var lTab = document.getElementById('tabLogin');
  var rTab = document.getElementById('tabRegister');
  var form = document.getElementById('authForm');
  if (!form) return;
  if (lTab) lTab.classList.toggle('active', tab === 'login');
  if (rTab) rTab.classList.toggle('active', tab === 'register');
  if (tab === 'login') {
    form.innerHTML =
      '<p style="font-size:.78rem;color:#9CA3AF;margin-bottom:12px">' + t('Welcome back! Sign in to your account.','Bem-vindo de volta! Entre na sua conta.') + '</p>' +
      '<input type="email" id="loginEmail" class="auth-input" placeholder="' + t('Email address', 'Endereço de email') + '" autocomplete="email"/>' +
      '<input type="password" id="loginPass" class="auth-input" placeholder="' + t('Password', 'Palavra-passe') + '" autocomplete="current-password"/>' +
      '<button class="auth-btn" onclick="doLogin()">' + t('Sign In', 'Entrar') + '</button>';
  } else {
    form.innerHTML =
      '<p style="font-size:.78rem;color:#9CA3AF;margin-bottom:12px">' + t('Create a free account to track your orders.','Crie uma conta gratuita para acompanhar as suas encomendas.') + '</p>' +
      '<input type="text" id="regName" class="auth-input" placeholder="' + t('Your name', 'O seu nome') + '" autocomplete="name"/>' +
      '<input type="email" id="regEmail" class="auth-input" placeholder="' + t('Email address', 'Endereço de email') + '" autocomplete="email"/>' +
      '<input type="password" id="regPass" class="auth-input" placeholder="' + t('Password', 'Palavra-passe') + '" autocomplete="new-password"/>' +
      '<button class="auth-btn" onclick="doRegister()">' + t('Create Account', 'Criar Conta') + '</button>';
  }
}

function doLogin() {
  var email = document.getElementById('loginEmail');
  var pass  = document.getElementById('loginPass');
  if (!email || !pass) return;
  var customers = getCustomers();
  var user = customers.find(function (c) { return c.email === email.value && c.password === pass.value; });
  if (user) {
    saveSession({ name: user.name, email: user.email, id: user.id });
    closeProfile();
    showToast(t('Welcome back, ', 'Bem-vindo, ') + user.name + '!', 'success');
    updateSidenavProfile();
  } else {
    showToast(t('Invalid email or password', 'Email ou palavra-passe incorretos'), 'error');
  }
}

function doRegister() {
  var name  = document.getElementById('regName');
  var email = document.getElementById('regEmail');
  var pass  = document.getElementById('regPass');
  if (!name || !email || !pass || !name.value || !email.value || !pass.value) {
    showToast(t('Please fill all fields', 'Por favor preencha todos os campos'), 'warning');
    return;
  }
  var customers = getCustomers();
  if (customers.find(function (c) { return c.email === email.value; })) {
    showToast(t('Email already registered', 'Email já registado'), 'warning');
    return;
  }
  var newUser = { id: 'C-' + Date.now(), name: name.value, email: email.value, password: pass.value, createdAt: new Date().toISOString() };
  customers.push(newUser);
  saveCustomers(customers);
  saveSession({ name: newUser.name, email: newUser.email, id: newUser.id });
  closeProfile();
  showToast(t('Account created! Welcome, ', 'Conta criada! Bem-vindo, ') + newUser.name + '!', 'success');
  updateSidenavProfile();
}

function updateSidenavProfile() {
  var session = getSession();
  var nameEl    = document.getElementById('sidenavName');
  var subEl     = document.getElementById('sidenavSub');
  var profileBtn= document.getElementById('sidenavProfile');
  if (session) {
    if (nameEl)     nameEl.textContent = session.name;
    if (subEl)      subEl.textContent  = session.email;
    if (profileBtn) profileBtn.textContent = session.name;
  } else {
    if (nameEl)     nameEl.textContent = 'Bismi Treats';
    if (subEl)      subEl.textContent  = t('Luxury and taste in one bite', 'Luxo e sabor em cada dentada');
    if (profileBtn) profileBtn.textContent = t('Sign In / Register', 'Entrar / Registar');
  }
}

// ── WELCOME POPUP ─────────────────────────────────────────────
function showWelcomePopup() {
  var popup = document.getElementById('welcomePopup');
  if (!popup) return;
  try { if (localStorage.getItem('bismiNoWelcome') === '1') return; } catch(e) {}
  popup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeWelcome() {
  var popup = document.getElementById('welcomePopup');
  if (!popup) return;
  var cb = document.getElementById('dontShowAgain');
  if (cb && cb.checked) { try { localStorage.setItem('bismiNoWelcome', '1'); } catch(e) {} }
  popup.style.display = 'none';
  document.body.style.overflow = '';
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  var dm = document.getElementById('detailModal');
  var cm = document.getElementById('cartModal');
  var pm = document.getElementById('profileModal');
  var sn = document.getElementById('sidenav');
  if (dm && dm.classList.contains('show'))       closeDetail();
  else if (cm && cm.classList.contains('show'))  closeCart();
  else if (pm && pm.classList.contains('show'))  closeModal('profileModal');
  else if (sn && sn.classList.contains('open'))  closeSideNav();
});