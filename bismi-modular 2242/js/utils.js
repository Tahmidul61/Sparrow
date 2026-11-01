// ═══════════════════════════════════════════════════════════════
// utils.js — Shared utilities: language, toast, photo URL fix
// No DOM dependencies except #toast. Safe to load first.
// ═══════════════════════════════════════════════════════════════

var currentLang = localStorage.getItem('bismiLang') ||
  (navigator.language && navigator.language.startsWith('pt') ? 'pt' : 'en');

// Translate helper
function t(en, pt) { return currentLang === 'pt' ? pt : en; }

// Fix any photo URL to use the /uploads/ proxy path
function fixPhotoUrl(url) {
  if (!url) return url;
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return url;
  if (url.startsWith('/')) return url;
  // Convert ANY T3 storage URL to our proxy (works for both old and new buckets)
  if (url.indexOf('storageapi') >= 0 || url.indexOf('t3.storage') >= 0) {
    var m = url.match(/\.dev\/(.+)/);
    if (m) return '/uploads/' + m[1];
  }
  // Other http URLs — return as-is
  if (url.startsWith('http')) return url;
  // Bare filename — assume product photo
  if (url.indexOf('/') < 0) return '/uploads/photos/' + url;
  return '/uploads/' + url;
}

// Fix order photo URL (served from orders bucket via proxy)
function fixOrderPhotoUrl(url) {
  if (!url) return url;
  if (url.startsWith('/uploads/orders/')) return url;
  if (url.startsWith('data:')) return url;
  if (url.indexOf('storageapi') >= 0) {
    var m = url.match(/\.dev\/(.+)/);
    if (m) return '/uploads/' + m[1];
  }
  if (url.indexOf('/') < 0) return '/uploads/orders/' + url;
  return url;
}

// Toast notification
function showToast(msg, type) {
  var el = document.getElementById('toast');
  if (!el) return;
  var icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
  var colors = { success: '#16a34a', warning: '#d97706', error: '#dc2626', info: '#2563eb' };
  var tp = type || 'info';
  el.innerHTML = '<span style="margin-right:6px">' + (icons[tp] || 'ℹ️') + '</span>' + msg;
  el.style.background = colors[tp] || colors.info;
  el.classList.add('show');
  clearTimeout(el._tmr);
  el._tmr = setTimeout(function () { el.classList.remove('show'); }, 2800);
}

// Announcement bar (below hero)
function showAnnouncement(text) {
  var bar = document.createElement('div');
  bar.className = 'announcement-bar';
  bar.innerHTML = text +
    '<button onclick="this.parentElement.remove()" class="ann-close">&times;</button>';
  var hero = document.getElementById('heroSection');
  if (hero) hero.parentNode.insertBefore(bar, hero.nextSibling);
}

// Scroll reveal (IntersectionObserver)
function initScrollReveal() {
  if (!window.IntersectionObserver) {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
}

// Hide page loader
function hideLoader() {
  setTimeout(function () {
    var loader = document.getElementById('pageLoader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(function () { loader.style.display = 'none'; }, 500);
    }
  }, 600);
}

// Scroll-to-top button visibility
window.addEventListener('scroll', function () {
  var btn = document.getElementById('scrollTopBtn');
  if (btn) btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
});