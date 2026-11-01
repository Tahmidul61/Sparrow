// ═══════════════════════════════════════════════════════════════
// catalogue.js — Product grid, detail modal, cart
// Depends on: data.js, utils.js
// Does NOT touch sidenav, auth, ranking, gallery
// ═══════════════════════════════════════════════════════════════

var currentFilter = 'all';
var currentCake   = null;

// Detail modal state
var selBase  = '';
var selComb  = null;
var selExtra = null;
var selSz    = null;
var selDetailCakeTypeId = '';
var selDetailCakePrice  = 19.99;

// Cart state
var cart = [];
try { var _sc = localStorage.getItem('bismiCart'); if (_sc) cart = JSON.parse(_sc); } catch(e) { cart = []; }
function saveCart() { try { localStorage.setItem('bismiCart', JSON.stringify(cart)); } catch(e) {} }

// ── CATALOGUE GRID ────────────────────────────────────────────
function renderCatalogue() {
  var grid = document.getElementById('cakeGrid');
  if (!grid) return;

  var search = '';
  var si = document.getElementById('searchInput');
  if (si) search = si.value.toLowerCase().trim();

  grid.className = 'cake-grid cols-' + gridCols;

  var items = (CAKES||[]).filter(function(c){return c.category!=='accessories';}); // Accessories in bottom sheet
  var filtered = items.filter(function (c) {
    var matchFilter =
      (currentFilter === 'all' && c.category !== 'accessories') ||
      c.category === currentFilter ||
      (currentFilter === 'popular' && c.badge === 'popular');
    var name = (currentLang === 'pt' ? c.name : c.nameEn) || c.name || '';
    var matchSearch = !search ||
      name.toLowerCase().includes(search) ||
      (c.desc || '').toLowerCase().includes(search) ||
      (c.code || '').toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });

  // Sort: new first, popular second, rest by num
  filtered.sort(function (a, b) {
    // Sort by date added (newest first) — id contains timestamp or use createdAt
    var dateA = a.createdAt || a.updatedAt || String(a.id || '');
    var dateB = b.createdAt || b.updatedAt || String(b.id || '');
    // Newer items first
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;
    return (a.num || 999) - (b.num || 999);
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' +
      '<i class="fas fa-search"></i><p>' +
      t('No cakes found', 'Nenhum bolo encontrado') + '</p></div>';
    return;
  }

  grid.innerHTML = filtered.map(function (c) {
    var name    = (currentLang === 'pt' ? c.name : c.nameEn) || c.name || '';
    var desc    = (currentLang === 'pt' ? c.desc : c.descEn) || c.desc || '';
    var hasPhoto = c.photos && c.photos.length > 0;
    var inCart   = cart.some(function (i) { return i.cakeId === c.id; });
    var isAvail  = c.available !== false;

    var imgHtml = hasPhoto
      ? '<img loading="lazy" src="' + fixPhotoUrl(c.photos[0]) + '" alt="' + name +
        '" style="width:100%;height:100%;object-fit:cover;pointer-events:none" ' +
        'onerror="this.parentElement.innerHTML=\'<div class=cake-num>' + c.num + '</div>\'">'
      : '<div class="cake-num">' + c.num + '</div>';

    var badgeHtml = c.badge
      ? '<div class="cake-badge ' + c.badge + '">' + c.badge + '</div>' : '';

    return '<div class="cake-card' + (inCart ? ' in-cart' : '') + (isAvail ? '' : ' unavailable') +
      '" id="cake-' + c.id + '" onclick="openDetail(\'' + c.id + '\')">' +
      '<div class="cake-img">' + imgHtml + badgeHtml + '</div>' +
      '<div class="cake-info">' +
      '<div class="cake-name">' + name + '</div>' +
      (desc ? '<div class="cake-desc-wrap"><div class="cake-desc cake-desc-clamp" id="desc-'+c.id+'">' + desc + '</div>' +
        (desc.length > 80 ? '<button class="read-more-btn" onclick="event.stopPropagation();toggleDesc(\'' + c.id + '\')">' + t('Read more','Ler mais') + '</button>' : '') +
        '</div>' : '') +
      '<div class="cake-price">' + t('From', 'A partir de') + ' €' + (c.price || 19.99).toFixed(2) + '/kg</div>' +
      '<div class="cake-glass-btns">' +
        '<button class="cake-glass-btn cake-fav-btn" data-id="' + c.id + '" ' +
          'onclick="event.stopPropagation();likeProduct(this,\'' + c.id + '\')" aria-label="Like">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
          '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' +
        '</button>' +
        '<button class="cake-glass-btn cake-share-btn" ' +
          'onclick="event.stopPropagation();shareCake(\'' + c.id + '\',\'' + name.replace(/'/g, "\\'") + '\')" aria-label="Share">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
          '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle>' +
          '<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>' +
        '</button>' +
      '</div>' +
      '<button class="gallery-like-btn cake-fav-btn" data-id="' + c.id + '" onclick="event.stopPropagation();likeProduct(this,\'' + c.id + '\')" aria-label="Like">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' +
      '</button>' +
      '</div></div>';
  }).join('');

  // Apply like state
  var likes = getLikes();
  document.querySelectorAll('.cake-fav-btn[data-id]').forEach(function (btn) {
    var ld = likes[btn.dataset.id];
    btn.classList.toggle('faved', !!(ld && ld.liked));
  });
}

// ── FLAVOURS SECTION ──────────────────────────────────────────
function renderFlavours() {
  var grid = document.getElementById('flavoursGrid');
  if (!grid) return;
  grid.innerHTML = '';
  FLAVOURS.forEach(function (f) {
    var div = document.createElement('div');
    div.className = 'flavour-chip';
    div.innerHTML = '<span class="flavour-em">' + (f.emoji || '') + '</span>' +
      '<span class="flavour-name">' + f.name + '</span>';
    grid.appendChild(div);
  });
}

// ── ALLERGENS ─────────────────────────────────────────────────
function renderAllergens(list) {
  var grid = document.getElementById('allergensList');
  if (!grid) return;
  var q = '';
  var as = document.getElementById('allergenSearch');
  if (as) q = as.value.toLowerCase();
  var filtered = (list || ALLERGENS).filter(function (a) {
    return !q || a.name.toLowerCase().includes(q) || (a.desc || '').toLowerCase().includes(q);
  });
  if (filtered.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:20px;color:var(--t3)">No ingredients found</div>';
    return;
  }
  grid.innerHTML = filtered.map(function (a) {
    return '<div class="allergen-card">' +
      '<span class="allergen-icon">' + (a.icon || '⚠️') + '</span>' +
      '<div class="allergen-name">' + a.name + '</div>' +
      '<div class="allergen-desc">' + (a.desc || '') + '</div>' +
      '</div>';
  }).join('');
}

// ── FEATURED SLIDER ───────────────────────────────────────────
function renderFeatured() {
  var slider  = document.getElementById('featSlider');
  var section = document.getElementById('featuredSection');
  if (!slider || !section) return;
  var featured = CAKES.filter(function (c) {
    return (c.badge === 'popular' || c.badge === 'new') && c.photos && c.photos.length > 0;
  }).slice(0, 6);
  if (featured.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  slider.innerHTML = featured.map(function (c) {
    var name  = (currentLang === 'pt' ? c.name : c.nameEn) || c.name || '';
    var photo = fixPhotoUrl(c.photos[0]);
    return '<div class="feat-card" onclick="openDetail(\'' + c.id + '\')">' +
      '<div class="feat-card-img"><img src="' + photo + '" alt="' + name + '" loading="lazy"></div>' +
      '<div class="feat-card-name">' + name + '</div>' +
      '<div class="feat-card-price">€' + (c.price || 19.99).toFixed(2) + '/kg</div></div>';
  }).join('');
}

// ── DETAIL MODAL ──────────────────────────────────────────────
function openDetail(id) {
  var c = CAKES.find(function (x) { return x.id === id; }) ||
          ACCESSORIES.find(function (x) { return x.id === id; });
  if (!c) return;
  currentCake = c;
  selBase = ''; selComb = null; selExtra = null; selSz = null;
  selDetailCakeTypeId = CAKE_TYPES[0].id;
  selDetailCakePrice  = CAKE_TYPES[0].price;

  var name = (currentLang === 'pt' ? c.name : c.nameEn) || c.name || '';

  // Title
  var titleEl = document.getElementById('detailTitle');
  if (titleEl) titleEl.textContent = name;

  // Product code
  var codeEl = document.getElementById('detailCode');
  if (codeEl) { codeEl.textContent = c.code ? 'Code: ' + c.code : ''; codeEl.style.display = c.code ? 'block' : 'none'; }

  // Description
  var descEl = document.getElementById('detailDesc');
  if (descEl) {
    var dt = (currentLang === 'pt' ? c.desc : c.descEn) || c.desc || '';
    descEl.textContent = dt;
    descEl.style.display = dt ? 'block' : 'none';
  }

  // Extra charges
  var ecEl = document.getElementById('detailExtraInfo');
  if (ecEl) {
    if (c.extraCharges && c.extraCharges.length > 0) {
      ecEl.innerHTML = c.extraCharges.map(function (ec) {
        return '<span class="extra-charge-tag">+€' + parseFloat(ec.price).toFixed(2) + ' ' + ec.name + '</span>';
      }).join('');
      ecEl.style.display = 'flex';
    } else { ecEl.style.display = 'none'; }
  }

  // Main image + thumbnail strip
  var imgWrap = document.getElementById('detailImgWrap');
  if (imgWrap) {
    if (c.photos && c.photos.length > 0) {
      imgWrap.style.display = 'block';
      renderDetailPhotos(c.photos, name);
    } else {
      imgWrap.style.display = 'none';
    }
  }

  // Track view
  trackView(id);

  renderDetailBody(c);
  document.getElementById('detailModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function renderDetailPhotos(photos, name) {
  var wrap = document.getElementById('detailImgWrap');
  if (!wrap) return;
  var mainSrc = fixPhotoUrl(photos[0]);
  var parts = ['<div class="detail-main-img-wrap">',
    '<img id="detailMainImg" src="' + mainSrc + '" alt="' + name + '" style="width:100%;height:100%;object-fit:cover;display:block"/>',
    '</div>'];
  if (photos.length > 1) {
    parts.push('<div class="detail-thumbs">');
    photos.forEach(function(p, i) {
      var src = fixPhotoUrl(p);
      parts.push(
        '<div class="detail-thumb' + (i===0?' active':'') + '" onclick="switchDetailPhoto(this)" data-src="' + src + '">',
        '<img src="' + src + '" alt="' + name + ' photo ' + (i+1) + '" loading="lazy"/>',
        '</div>'
      );
    });
    parts.push('</div>');
  }
  wrap.innerHTML = parts.join('');
}


function switchDetailPhoto(thumbEl) {
  var src = thumbEl ? thumbEl.dataset.src : '';
  var mainImg = document.getElementById('detailMainImg');
  if (mainImg && src) {
    mainImg.style.opacity = '0';
    setTimeout(function() { mainImg.src = src; mainImg.style.opacity = '1'; }, 150);
  }
  document.querySelectorAll('.detail-thumb').forEach(function(t) { t.classList.remove('active'); });
  if (thumbEl) thumbEl.classList.add('active');
}

function closeDetail() {
  var m = document.getElementById('detailModal');
  if (m) m.classList.remove('show');
  document.body.style.overflow = '';
  currentCake = null;
}

function renderDetailBody(cake) {
  var body = document.getElementById('detailBody');
  if (!body) return;

  var html = '';

  // Step 1: Cake Type
  html += '<div class="step-title"><span>1</span> ' + t('Cake Type', 'Tipo de Bolo') + '</div>';
  html += '<div class="ct-grid-detail" id="detailCtGrid">';
  CAKE_TYPES.forEach(function (ct) {
    html += '<div class="ct-card-detail' + (selDetailCakeTypeId === ct.id ? ' sel' : '') +
      '" data-id="' + ct.id + '" data-price="' + ct.price + '">' +
      '<div class="ct-name-d">' + ct.name + '</div>' +
      '<div class="ct-price-d">€' + ct.price + '/kg</div></div>';
  });
  html += '</div>';

  // Step 2: Filling
  html += '<div class="step-title"><span>2</span> ' + t('Choose Filling', 'Escolher Recheio') + '</div>';
  html += '<div class="combo-hint">' +
    t('Want Chocolate + Fruit? Select Chocolate or White Chocolate first.',
      'Quer Chocolate + Fruta? Selecione Chocolate ou Chocolate Branco primeiro.') + '</div>';
  html += '<div class="fl-grid" id="detailFlGrid"></div>';
  html += '<div id="detailComboSec" style="display:none;margin-top:8px">' +
    '<div class="sub-label">' + t('Combine with fruit:', 'Combinar com fruta:') + '</div>' +
    '<div class="fl-grid" id="detailComboGrid"></div></div>';

  // Step 3: Size
  html += '<div class="step-title"><span>3</span> ' + t('Choose Size', 'Escolher Tamanho') + '</div>';
  html += '<div id="detailSzGrid"></div>';

  // Step 4: Message
  html += '<div class="step-title"><span>4</span> ' +
    t('Cake Message (optional)', 'Mensagem no Bolo (opcional)') + '</div>';
  html += '<input type="text" id="detailCakeMsg" class="f-inp-d" ' +
    'placeholder="' + t('e.g. Happy Birthday Maria!', 'Ex: Feliz Aniversário Maria!') + '" maxlength="50"/>';

  // Price estimate
  html += '<div class="price-est" id="detailPriceEst" style="display:none">' +
    '<div class="price-big" id="detailPriceBig"></div>' +
    '<div class="price-note" id="detailPriceNote"></div></div>';

  // Add to cart button
  html += '<button class="add-to-cart-btn" id="addToCartBtn" onclick="addToCartFromDetail()">' +
    '<i class="fas fa-shopping-bag"></i> ' + t('Add to Order', 'Adicionar à Encomenda') + '</button>';

  body.innerHTML = html;

  // Attach cake type click handlers
  document.querySelectorAll('.ct-card-detail').forEach(function (el) {
    el.addEventListener('click', function () {
      document.querySelectorAll('.ct-card-detail').forEach(function (c) { c.classList.remove('sel'); });
      el.classList.add('sel');
      selDetailCakeTypeId = el.dataset.id;
      selDetailCakePrice  = parseFloat(el.dataset.price) || 19.99;
      renderDetailSizes(cake);
      updateDetailPrice();
    });
  });

  renderDetailFillings();
  renderDetailSizes(cake);
}

function renderDetailFillings() {
  var grid = document.getElementById('detailFlGrid');
  if (!grid) return;
  grid.innerHTML = '';
  var allFl = FLAVOURS.length > 0 ? FLAVOURS : DEFAULT_FLAVOURS;
  allFl.forEach(function (f) {
    var v  = f.value || f.v;
    var nm = f.name;
    var em = f.emoji || f.em || '';
    var btn = document.createElement('div');
    btn.className = 'fl-btn' + (selBase === v ? ' sel' : '');
    btn.innerHTML = '<span class="fl-em">' + em + '</span><span class="fl-btn-name">' + nm + '</span>';
    (function (fv) { btn.addEventListener('click', function () { pickDetailFl(fv); }); })(v);
    grid.appendChild(btn);
  });
}

function pickDetailFl(v) {
  selBase = v;
  renderDetailFillings();
  // Show combo section for chocolate OR white chocolate
  var isChoco = (v === 'chocolate' || v === 'chocolate-branco' ||
                 v === 'white-chocolate' || v === 'choc-branco' ||
                 (v && (v.toLowerCase().includes('chocolate'))));
  var comboSec = document.getElementById('detailComboSec');
  if (comboSec) {
    if (isChoco) {
      comboSec.style.display = 'block';
      comboSec.style.animation = 'slideUpSmooth .3s ease';
      renderDetailCombo();
    } else {
      comboSec.style.display = 'none';
      selComb = null;
    }
  }
  updateDetailPrice();
}

function renderDetailCombo() {
  var cg = document.getElementById('detailComboGrid');
  if (!cg) return;
  var fruits = FLAVOURS.filter(function (f) {
    var fv = f.value || f.v;
    return fv !== 'chocolate' && fv !== 'chocolate-branco';
  });
  cg.innerHTML = '';
  fruits.forEach(function (f) {
    var fv = f.value || f.v;
    var btn = document.createElement('div');
    btn.className = 'fl-btn' + (selComb === fv ? ' sel' : '');
    btn.innerHTML = '<span class="fl-em">' + (f.emoji || f.em || '') + '</span>' +
      '<span class="fl-btn-name">' + f.name + '</span>';
    (function (val) {
      btn.addEventListener('click', function () {
        selComb = (selComb === val) ? null : val;
        renderDetailCombo();
        updateDetailPrice();
      });
    })(fv);
    cg.appendChild(btn);
  });
}

function renderDetailSizes(cake) {
  var grid = document.getElementById('detailSzGrid');
  if (!grid) return;
  var minSz  = parseFloat((cake && cake.minSize) || '1.0');
  var avail  = SIZE_BRACKETS.filter(function (s) { return parseFloat(s.v) >= minSz; });
  var VISIBLE = 4;
  var showAll = false;

  function doRender() {
    var toShow = showAll ? avail : avail.slice(0, VISIBLE);
    grid.innerHTML = '';
    var szGrid = document.createElement('div');
    szGrid.className = 'sz-grid';
    toShow.forEach(function (s, i) {
      var ppkg = selDetailCakePrice || 19.99;
      var minP = (parseFloat(s.v) * ppkg).toFixed(2);
      var maxP = (parseFloat(s.max) * ppkg).toFixed(2);
      var btn  = document.createElement('div');
      btn.className = 'sz-btn' + (selSz === s.v ? ' sel' : '') + (i === 0 ? ' min-sz' : '');
      btn.innerHTML =
        '<div class="sz-lbl">' + s.v + ' – ' + s.max + ' kg</div>' +
        '<div class="sz-ppl">' + s.p + '</div>' +
        '<div class="sz-price">€' + minP + ' – €' + maxP + '</div>' +
        (i === 0 ? '<div class="sz-badge">' + t('Min size', 'Tamanho min') + '</div>' : '');
      (function (sv) {
        btn.addEventListener('click', function () {
          selSz = sv;
          document.querySelectorAll('#detailSzGrid .sz-btn').forEach(function (b) { b.classList.remove('sel'); });
          btn.classList.add('sel');
          updateDetailPrice();
        });
      })(s.v);
      szGrid.appendChild(btn);
    });
    grid.appendChild(szGrid);
    if (!showAll && avail.length > VISIBLE) {
      var more = document.createElement('button');
      more.className = 'show-more-btn';
      more.textContent = t('Show larger sizes', 'Ver tamanhos maiores') +
        ' (' + (avail.length - VISIBLE) + ' ' + t('more', 'mais') + ')';
      more.addEventListener('click', function () { showAll = true; doRender(); });
      grid.appendChild(more);
    }
  }
  doRender();
}

function updateDetailPrice() {
  var el = document.getElementById('detailPriceEst');
  if (!selBase || !selSz) { if (el) el.style.display = 'none'; return; }
  var ppkg = selDetailCakePrice || 19.99;
  var sz   = SIZE_BRACKETS.find(function (s) { return s.v === selSz; });
  if (!sz) { if (el) el.style.display = 'none'; return; }
  var minP = (parseFloat(sz.v) * ppkg).toFixed(2);
  var maxP = (parseFloat(sz.max) * ppkg).toFixed(2);
  if (el) el.style.display = 'block';
  var pb = document.getElementById('detailPriceBig');
  if (pb) pb.textContent = '€' + minP + ' – €' + maxP;
  var pn = document.getElementById('detailPriceNote');
  if (pn) pn.textContent = sz.v + '–' + sz.max + 'kg × €' + ppkg + '/kg';
}

function addToCartFromDetail() {
  if (!selBase) { showToast(t('Please choose a filling', 'Por favor escolha um recheio'), 'warning'); return; }
  if (!selSz)   { showToast(t('Please choose a size',    'Por favor escolha um tamanho'), 'warning'); return; }
  var cake = currentCake;
  if (!cake) return;
  var name   = (currentLang === 'pt' ? cake.name : cake.nameEn) || cake.name || '';
  var flObj  = FLAVOURS.find(function (f) { return (f.value || f.v) === selBase; });
  var flName = flObj ? flObj.name : selBase;
  if (selComb) {
    var cf = FLAVOURS.find(function (f) { return (f.value || f.v) === selComb; });
    if (cf) flName += ' + ' + cf.name;
  }
  var sz   = SIZE_BRACKETS.find(function (s) { return s.v === selSz; }) ||
             { v: selSz, max: (parseFloat(selSz) + 0.3).toFixed(1) };
  var ppkg = selDetailCakePrice || 19.99;
  var msg  = document.getElementById('detailCakeMsg');
  var item = {
    cakeId: cake.id, cakeTypeId: selDetailCakeTypeId, productCode: cake.code || '',
    cakeName: name, selBase: selBase, selComb: selComb || '', selExtra: '',
    filling: flName, minWeight: sz.v, maxWeight: sz.max,
    cakeMessage: msg ? msg.value.trim() : '', pricePerKg: ppkg,
    minPrice: (parseFloat(sz.v) * ppkg).toFixed(2),
    maxPrice: (parseFloat(sz.max) * ppkg).toFixed(2),
    photos: cake.photos || []
  };
  var existing = cart.findIndex(function (i) { return i.cakeId === cake.id; });
  if (existing >= 0) cart[existing] = item; else cart.push(item);
  saveCart();
  updateCartUI();
  closeDetail();
  showToast(t('Added to order!', 'Adicionado à encomenda!'), 'success');
  openCart();
}

// ── CART ──────────────────────────────────────────────────────
function openCart() {
  renderCartBody();
  document.getElementById('cartModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartModal').classList.remove('show');
  document.body.style.overflow = '';
}

function renderCartBody() {
  var body = document.getElementById('cartBody');
  if (!body) return;
  if (cart.length === 0) {
    body.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>' +
      t('Your order is empty', 'A sua encomenda está vazia') + '</p></div>';
    return;
  }
  var total    = cart.reduce(function (s, i) { return s + parseFloat(i.minPrice || 0); }, 0);
  var maxTotal = cart.reduce(function (s, i) { return s + parseFloat(i.maxPrice || 0); }, 0);
  body.innerHTML = cart.map(function (item, idx) {
    var photo = item.photos && item.photos.length > 0 ? fixPhotoUrl(item.photos[0]) : '';
    return '<div class="cart-item">' +
      '<div class="cart-item-img">' +
      (photo ? '<img src="' + photo + '" alt="' + (item.cakeName || '') + '" style="width:100%;height:100%;object-fit:cover">'
             : '<div style="width:100%;height:100%;background:#f0f2f5;display:flex;align-items:center;justify-content:center;font-size:1.5rem">🎂</div>') +
      '</div>' +
      '<div class="cart-item-info">' +
      '<div class="cart-item-name">' + (item.cakeName || t('Cake', 'Bolo')) + '</div>' +
      '<div class="cart-item-detail">' + (item.filling || '') + ' · ' +
        item.minWeight + '–' + item.maxWeight + 'kg' +
        (item.cakeMessage ? ' · "' + item.cakeMessage + '"' : '') + '</div>' +
      '<div class="cart-item-price">€' + item.minPrice + ' – €' + item.maxPrice + '</div>' +
      '</div>' +
      '<button class="cart-item-remove" onclick="removeFromCart(' + idx + ')"><i class="fas fa-times"></i></button>' +
      '</div>';
  }).join('');
  var totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = '€' + total.toFixed(2) + ' – €' + maxTotal.toFixed(2);
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCartUI();
  renderCartBody();
}

function updateCartUI() {
  var count = cart.length;
  var countEl = document.getElementById('cartCountHeader');
  if (countEl) { countEl.textContent = count; countEl.style.display = count > 0 ? 'block' : 'none'; }
  var stickyCart = document.getElementById('stickyCart');
  if (stickyCart) {
    if (count > 0) {
      stickyCart.classList.add('visible');
      var txt = document.getElementById('stickyCartTxt');
      if (txt) txt.textContent = t('View Order', 'Ver Encomenda') + ' (' + count + ')';
      var price = document.getElementById('stickyCartPrice');
      if (price) {
        var total = cart.reduce(function (s, i) { return s + parseFloat(i.minPrice || 0); }, 0);
        price.textContent = '€' + total.toFixed(2);
      }
    } else { stickyCart.classList.remove('visible'); }
  }
}

function proceedToOrderForm() {
  if (cart.length === 0) { showToast(t('Your cart is empty', 'O seu carrinho está vazio'), 'warning'); return; }
  var firstItem = cart[0];
  var prefill = {
    cakeType: firstItem.cakeTypeId || '',
    filling:  firstItem.selBase    || '',
    combo:    firstItem.selComb    || '',
    extra:    firstItem.selExtra   || '',
    size:     firstItem.minWeight  || '',
    cakeMessage: firstItem.cakeMessage || '',
    productCode: firstItem.productCode || '',
    cakeName:    firstItem.cakeName    || '',
    cartItems:   cart
  };
  try { sessionStorage.setItem('bismiOrderPrefill', JSON.stringify(prefill)); } catch(e) {}
  window.location.href = 'customer-form.html';
}

// ── ACCESSORIES ───────────────────────────────────────────────
function addAccessoryToCart(id) {
  var acc = ACCESSORIES.find(function(a){ return a.id === id; });
  if (!acc) return;
  var name = (currentLang==='pt'?acc.name:acc.nameEn)||acc.name||'';
  var item = {
    cakeId: acc.id, cakeTypeId: 'accessory', productCode: acc.code||'',
    cakeName: name, selBase: '', selComb: '', selExtra: '',
    filling: 'Accessory', minWeight: '1', maxWeight: '1',
    cakeMessage: '', pricePerKg: acc.price||2.99,
    minPrice: (acc.price||2.99).toFixed(2),
    maxPrice: (acc.price||2.99).toFixed(2),
    photos: acc.photos||[], isAccessory: true
  };
  var existing = cart.findIndex(function(i){ return i.cakeId===acc.id; });
  if (existing>=0) cart[existing]=item; else cart.push(item);
  saveCart(); updateCartUI();
  showToast(name + ' ' + t('added!','adicionado!'), 'success');
}

// ── SHARE ─────────────────────────────────────────────────────
function shareCake(id, name) {
  var cake = (CAKES||[]).find(function(c){ return c.id===id; }) ||
             (ACCESSORIES||[]).find(function(c){ return c.id===id; });
  if(!cake) return;
  // Build proper product URL with full slug
  var cakeName = (currentLang==='pt'?cake.name:cake.nameEn)||cake.name||name||'';
  var slug = slugifyShare(cakeName) + (cake.code ? '-' + cake.code.toLowerCase() : '');
  var cat = cake.category==='accessories' ? 'accessories' : 'cakes';
  var url = 'https://bismitreats.com/products/' + cat + '/' + slug;
  var shareText = cakeName + ' — Bismi Treats | bismitreats.com/gallery';
  if (navigator.share) {
    navigator.share({ title: 'Bismi Treats — ' + cakeName, text: shareText, url: url }).catch(function () {});
  } else {
    navigator.clipboard.writeText(url)
      .then(function () { showToast(t('Link copied!', 'Link copiado!'), 'success'); })
      .catch(function () { showToast(url, 'info'); });
  }
}

function slugifyShare(str){
  return (str||'').toLowerCase()
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
    .replace(/[ùúûü]/g,'u').replace(/[ç]/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

// ── DESCRIPTION TOGGLE ───────────────────────────────────────
function toggleDesc(id) {
  var el = document.getElementById('desc-' + id);
  var btn = el ? el.nextElementSibling : null;
  if (!el) return;
  var expanded = el.classList.toggle('cake-desc-expanded');
  if (btn) btn.textContent = expanded ? t('Read less','Ler menos') : t('Read more','Ler mais');
}

// ── RENDER ALL ────────────────────────────────────────────────
function renderAll() {
  renderCatalogue();
  renderFeatured();
  renderFlavours();
  try { renderTop3(); }             catch(e) {}
  try { renderRecentlyUploaded(); } catch(e) {}
  try { renderGalleryPreview(); }   catch(e) {}
}