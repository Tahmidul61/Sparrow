// ═══════════════════════════════════════════════════════════════
// ranking.js — Likes, views, Top 3, Recently Uploaded, Gallery
// ═══════════════════════════════════════════════════════════════

var LIKES_KEY   = 'bismiLikes2';
var VIEWS_KEY   = 'bismiViews2';
var _galleryMode = false;

// In-memory likes cache (synced from MongoDB)
var _likesCache = null;
var _likesSyncing = false;

function getLikes() {
  if(_likesCache) return _likesCache;
  try { return JSON.parse(localStorage.getItem(LIKES_KEY) || '{}'); } catch(e) { return {}; }
}
function getViews() { try { return JSON.parse(localStorage.getItem(VIEWS_KEY) || '{}'); } catch(e) { return {}; } }

function saveLikes(d) {
  _likesCache = d;
  // Save locally immediately
  try { localStorage.setItem(LIKES_KEY, JSON.stringify(d)); } catch(e) {}
  // Sync to MongoDB (debounced)
  clearTimeout(saveLikes._timer);
  saveLikes._timer = setTimeout(function(){
    fetch('/api/likes', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(d)
    }).catch(function(){});
  }, 500);
}
function saveViews(d) { try { localStorage.setItem(VIEWS_KEY, JSON.stringify(d)); } catch(e) {} }

// Load likes from MongoDB on startup
function loadLikesFromServer(){
  fetch('/api/likes')
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&typeof d==='object'&&Object.keys(d).length>0){
        _likesCache = d;
        try{localStorage.setItem(LIKES_KEY, JSON.stringify(d));}catch(e){}
        // Re-render top3 with server likes
        renderTop3();
      }
    })
    .catch(function(){});
}

function likeProduct(btn, id) {
  var likes  = getLikes();
  var liked  = !!(likes[id] && likes[id].liked);
  if (liked) {
    likes[id] = { count: Math.max(0, (likes[id].count || 1) - 1), liked: false };
  } else {
    likes[id] = { count: ((likes[id] && likes[id].count) || 0) + 1, liked: true };
  }
  saveLikes(likes);
  var isFaved = likes[id].liked;
  document.querySelectorAll('.cake-fav-btn[data-id="' + id + '"]').forEach(function (b) {
    b.classList.toggle('faved', isFaved);
  });
  renderTop3();
  showToast(isFaved ? 'Liked!' : 'Unliked', 'info');
}

function trackView(id) {
  var views = getViews();
  views[id] = (views[id] || 0) + 1;
  saveViews(views);
}

function getTop3() {
  var likes = getLikes();
  return (CAKES || [])
    .filter(function (c) { return c.photos && c.photos.length > 0; })
    .sort(function (a, b) {
      return ((likes[b.id] && likes[b.id].count) || 0) -
             ((likes[a.id] && likes[a.id].count) || 0);
    })
    .slice(0, 3);
}

function renderTop3() {
  var el = document.getElementById('top3Section');
  if (!el) return;
  // Load from server if not yet loaded
  if(!_likesCache) loadLikesFromServer();
  var top3  = getTop3();
  var likes = getLikes();
  if (!top3.length) { el.style.display = 'none'; return; }
  el.style.display = '';
  var ranks = ['#1', '#2', '#3'];
  var parts = ['<div class="most-loved-wrap">',
    '<div class="section-header">',
    '<div><div class="section-heading">' + t('Most Loved','Mais Amados') + '</div>',
    '<div class="section-sub">' + t('The cakes our customers appreciate most','Os bolos mais apreciados') + '</div></div>',
    '</div>',
    '<div class="most-loved-scroll">'];
  top3.forEach(function (cake, i) {
    var name  = (currentLang === 'pt' ? cake.name : cake.nameEn) || cake.name || '';
    var photo = fixPhotoUrl(cake.photos[0]);
    var lc    = (likes[cake.id] && likes[cake.id].count) || 0;
    var cid   = cake.id;
    parts.push(
      '<div class="loved-card" onclick="openDetail(\'' + cid + '\')">',
      '<div class="loved-card-img"><img src="' + photo + '" alt="' + name + '" loading="lazy"></div>',
      '<div class="loved-card-info">',
      '<div class="loved-card-rank">' + ranks[i] + ' Most Loved</div>',
      '<div class="loved-card-name">' + name + '</div>',
      '<div class="loved-card-likes"><i class="fas fa-heart" style="color:#e11d48;font-size:.6rem"></i> ' + lc + ' likes</div>',
      '</div></div>'
    );
  });
  parts.push('</div></div>');
  el.innerHTML = parts.join('');
}

function renderRecentlyUploaded() {
  var el = document.getElementById('recentlyUploadedSection');
  if (!el) return;
  var cakes = (CAKES || [])
    .filter(function (c) { return c.photos && c.photos.length > 0; })
    .sort(function (a, b) { return String(b.id || '').localeCompare(String(a.id || '')); })
    .slice(0, 4);
  if (!cakes.length) { el.style.display = 'none'; return; }
  el.style.display = '';
  var parts = ['<div class="new-arrivals-wrap">',
    '<div class="section-header">',
    '<div><div class="section-heading">' + t('New Arrivals','Novidades') + '</div>',
    '<div class="section-sub">' + t('Freshly baked, beautifully designed','Frescos e lindamente decorados') + '</div></div>',
    '</div>',
    '<div class="new-arrivals-grid">'];
  cakes.forEach(function (cake) {
    var name  = (currentLang === 'pt' ? cake.name : cake.nameEn) || cake.name || '';
    var photo = fixPhotoUrl(cake.photos[0]);
    var price = (cake.price || 19.99).toFixed(2);
    var cid   = cake.id;
    parts.push(
      '<div class="arrival-card" onclick="openDetail(\'' + cid + '\')">',
      '<div class="arrival-card-img"><img src="' + photo + '" alt="' + name + '" loading="lazy"></div>',
      '<div class="arrival-card-info">',
      '<div class="arrival-card-tag">New</div>',
      '<div class="arrival-card-name">' + name + '</div>',
      '<div class="arrival-card-price">From \u20AC' + price + '/kg</div>',
      '</div></div>'
    );
  });
  parts.push('</div></div>');
  el.innerHTML = parts.join('');
  renderGalleryPreview();
}

function renderGalleryPreview() {
  var el   = document.getElementById('galleryPreviewSection');
  var grid = document.getElementById('galleryPreviewGrid');
  if (!el || !grid) return;
  var cakes = (CAKES || [])
    .filter(function(c){ return c.photos && c.photos.length > 0 && c.category !== 'accessories'; })
    .sort(function(a,b){
      var da=a.createdAt||a.updatedAt||String(a.id||'');
      var db=b.createdAt||b.updatedAt||String(b.id||'');
      return da>db?-1:da<db?1:0;
    })
    .slice(0,3);
  if (!cakes.length) { el.style.display = 'none'; return; }
  el.style.display = '';
  grid.innerHTML = cakes.map(function(cake){
    var name  = (currentLang==='pt'?cake.name:cake.nameEn)||cake.name||'';
    var photo = fixPhotoUrl(cake.photos[0]);
    var cid   = cake.id;
    return '<div class="gallery-preview-cell" onclick="openDetail(\'' + cid + '\')">' +
      '<img src="' + photo + '" alt="' + name + '" loading="lazy"></div>';
  }).join('');
}

function toggleGalleryMode() {
  if (_galleryMode) exitGalleryMode(); else enterGalleryMode();
}

function enterGalleryMode() {
  _galleryMode = true;
  document.body.classList.add('gallery-mode');
  var txt = document.getElementById('galleryModeTxt');
  if (txt) txt.textContent = t('Exit Gallery', 'Sair da Galeria');
  var backBtn = document.getElementById('galleryBackBtn');
  if (backBtn) backBtn.classList.add('visible');
  renderPhotoGallery();
  var galleryGrid = document.getElementById('photoGalleryGrid');
  if (galleryGrid) { galleryGrid.style.display = 'grid'; galleryGrid.classList.add('active'); }
  var cakeGrid = document.getElementById('cakeGrid');
  if (cakeGrid) cakeGrid.style.display = 'none';
}

function exitGalleryMode() {
  _galleryMode = false;
  document.body.classList.remove('gallery-mode');
  var txt = document.getElementById('galleryModeTxt');
  if (txt) txt.textContent = t('Gallery', 'Galeria');
  var backBtn = document.getElementById('galleryBackBtn');
  if (backBtn) backBtn.classList.remove('visible');
  var galleryGrid = document.getElementById('photoGalleryGrid');
  if (galleryGrid) { galleryGrid.style.display = 'none'; galleryGrid.classList.remove('active'); }
  var cakeGrid = document.getElementById('cakeGrid');
  if (cakeGrid) cakeGrid.style.display = '';
}

function renderPhotoGallery() {
  var grid = document.getElementById('photoGalleryGrid');
  if (!grid) return;
  var cakes = (CAKES || [])
    .filter(function (c) { return c.photos && c.photos.length > 0 && c.category !== 'accessories'; })
    .sort(function(a,b){
      var da=a.createdAt||a.updatedAt||String(a.id||'');
      var db=b.createdAt||b.updatedAt||String(b.id||'');
      return da>db?-1:da<db?1:0;
    });
  if (cakes.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--t2)">No photos yet.</div>';
    return;
  }
  var html = '';
  cakes.forEach(function (cake) {
    var name = (currentLang === 'pt' ? cake.name : cake.nameEn) || cake.name || '';
    var cid  = cake.id;
    cake.photos.forEach(function (photo) {
      html += '<div class="gallery-photo-cell" onclick="openDetail(\'' + cid + '\')" title="' + name + '">' +
        '<img src="' + fixPhotoUrl(photo) + '" alt="' + name + '" loading="lazy" ' +
        'onerror="this.parentNode.style.display=\'none\'"></div>';
    });
  });
  grid.innerHTML = html;
}
