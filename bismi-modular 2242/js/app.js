// ═══════════════════════════════════════════════════════════════
// app.js — Bootstrap: loads data from MongoDB, applies biz config,
//          registers service worker, PWA install prompt
// This is the ONLY file that talks to the server.
// ═══════════════════════════════════════════════════════════════

// ── MONGODB DATA LOAD ─────────────────────────────────────────
function loadCatalogueData() {
  console.log('[Bismi] Loading catalogue from MongoDB...');
  fetch('/api/catalogue', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d) return;
      if (d.cakes && d.cakes.length > 0) {
        CAKES = d.cakes;
        console.log('[Bismi] Loaded', d.cakes.length, 'cakes');
      }
      if (d.accessories && d.accessories.length > 0) ACCESSORIES = d.accessories;
      if (d.flavours    && d.flavours.length    > 0) FLAVOURS    = d.flavours;
      if (d.allergens   && d.allergens.length   > 0) ALLERGENS   = d.allergens;
      if (d.business) { BIZ = Object.assign(BIZ, d.business); applyBizData(); }
      if (d.announcement && d.announcement.enabled && d.announcement.text) {
        showAnnouncement(d.announcement.text);
      }
      renderAll();
      // Re-apply current view after data loads
      if(typeof _currentView !== 'undefined'){
        if(_currentView==='home') showHomeView();
        else if(_currentView==='cakes') showCakesView();
      }
      if(d.updatedAt) updateLastUpdatedDisplay(d.updatedAt);
      else if(d.business && d.business.updatedAt) updateLastUpdatedDisplay(d.business.updatedAt);
    })
    .catch(function (err) {
      console.warn('[Bismi] MongoDB load failed, using defaults:', err);
      CAKES = DEFAULT_CAKES.slice();
      renderAll();
      if(typeof showHomeView === 'function') showHomeView();
    });
}

// ── APPLY BUSINESS CONFIG ─────────────────────────────────────
function applyBizData() {
  // Hero banner
  if (BIZ.heroImg) {
    var hi = document.getElementById('heroImg');
    if (hi) { hi.src = fixPhotoUrl(BIZ.heroImg); hi.style.display = 'block'; }
  }
  // Logo
  if (BIZ.logoImg) {
    var logoUrl = fixPhotoUrl(BIZ.logoImg);
    var hl = document.getElementById('headerLogo');  if (hl) hl.src = logoUrl;
    var sl = document.getElementById('sidenavLogo'); if (sl) sl.src = logoUrl;
  }
  // Custom Orders banner image
  if (BIZ.customOrdersBannerImg) {
    var bannerImg = document.getElementById('customOrdersBannerImg');
    var bannerEmoji = document.getElementById('customOrdersEmoji');
    if (bannerImg) {
      bannerImg.src = fixPhotoUrl(BIZ.customOrdersBannerImg);
      bannerImg.style.display = 'block';
      if (bannerEmoji) bannerEmoji.style.display = 'none';
    }
  }
  // Button colour
  if (BIZ.buttonColor) {
    document.documentElement.style.setProperty('--acc', BIZ.buttonColor);
  }
}

// ── PWA INSTALL PROMPT ────────────────────────────────────────
var _deferredInstall = null;

window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  _deferredInstall = e;
  // Show install banner after 30 seconds
  setTimeout(function () { if (_deferredInstall) showInstallBanner(); }, 30000);
});

function showInstallBanner() {
  if (document.getElementById('pwaInstallBanner')) return;
  var b = document.createElement('div');
  b.id = 'pwaInstallBanner';
  b.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:9999;' +
    'background:rgba(255,255,255,.96);backdrop-filter:blur(20px);' +
    'border-top:1px solid rgba(201,169,110,.3);padding:14px 16px;' +
    'display:flex;align-items:center;gap:12px;' +
    'box-shadow:0 -4px 24px rgba(0,0,0,.1);animation:slideUp .3s ease';
  var logoSrc = document.getElementById('headerLogo') ?
    document.getElementById('headerLogo').src : '';
  b.innerHTML =
    (logoSrc ? '<img src="' + logoSrc + '" style="width:42px;height:42px;border-radius:10px;flex-shrink:0">' : '') +
    '<div style="flex:1">' +
    '<div style="font-size:.86rem;font-weight:700;color:#1a1a2e">Install Bismi Treats</div>' +
    '<div style="font-size:.72rem;color:#6a6a8a">Add to home screen for the best experience</div>' +
    '</div>' +
    '<button onclick="installPWA()" style="background:linear-gradient(135deg,#C9A96E,#A07840);color:white;border:none;padding:9px 18px;border-radius:9999px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">Install</button>' +
    '<button onclick="document.getElementById(\'pwaInstallBanner\').remove()" style="background:none;border:none;color:#9a9ab0;cursor:pointer;font-size:1.2rem;padding:4px">&times;</button>';
  document.body.appendChild(b);
}

function installPWA() {
  if (!_deferredInstall) return;
  _deferredInstall.prompt();
  _deferredInstall.userChoice.then(function (r) {
    _deferredInstall = null;
    var b = document.getElementById('pwaInstallBanner');
    if (b) b.remove();
    if (r.outcome === 'accepted') showToast('App installed! 🎉', 'success');
  });
}

window.addEventListener('appinstalled', function () {
  showToast('Bismi Treats installed!', 'success');
  _deferredInstall = null;
});

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  console.log('[Bismi] App initialising...');

  // Apply embedded logo
  var logoEl = document.getElementById('headerLogo');
  var sideLogoEl = document.getElementById('sidenavLogo');
  if (typeof LOGO_B64 !== 'undefined' && LOGO_B64) {
    if (logoEl)     logoEl.src     = LOGO_B64;
    if (sideLogoEl) sideLogoEl.src = LOGO_B64;
  }

  // Grid UI
  setGridUI(gridCols);

  // Language
  setLang(currentLang, true);

  // Restore cart
  try {
    var sc = localStorage.getItem('bismiCart');
    if (sc) cart = JSON.parse(sc);
  } catch(e) {}
  updateCartUI();

  // Render with defaults first (instant)
  renderAll();

  // Then load from MongoDB (updates display when ready)
  loadCatalogueData();

  // Welcome popup after 1s
  setTimeout(showWelcomePopup, 1000);

  // Scroll reveal
  initScrollReveal();

  // Service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }

  // Hide loader
  showHomeView();
  hideLoader();

  // Load likes from MongoDB for consistent Top 3 across devices
  setTimeout(function(){ try{loadLikesFromServer();}catch(e){}; }, 1000);
  console.log('[Bismi] App ready.');

  // Deep link handler — open product from shared URL
  // e.g. bismitreats.com/?product=BP-001 or ?product=P3
  setTimeout(function(){
    try {
      var params = new URLSearchParams(window.location.search);
      var productRef = params.get('product') || params.get('cake');
      if (productRef) {
        var allItems = (CAKES||[]).concat(ACCESSORIES||[]);
        var found = allItems.find(function(c){
          return c.code === productRef ||
                 c.id === productRef ||
                 String(c.num) === productRef.replace(/^P/,'');
        });
        if (found) {
          showCakesView();
          setTimeout(function(){ openDetail(found.id); }, 300);
        }
      }
    } catch(e) {}
  }, 800);
});
// Show bottom install prompt after 30s if PWA not installed
setTimeout(function(){
  var prompt = document.getElementById('bottomInstallPrompt');
  if(prompt && window._deferredInstall){
    prompt.style.display = 'flex';
  }
}, 30000);
