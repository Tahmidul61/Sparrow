'use strict';
// ═══════════════════════════════════════════════════════════════
// BISMI TREATS — ADMIN ENGINE v7.0
// Built completely from scratch — clean architecture
// ═══════════════════════════════════════════════════════════════

// ── CAKE TYPES (editable via settings) ───────────────────────
var CAKE_TYPES = [
  {id:'sponge-chocolate', name:'Chocolate Sponge Cake', price:19.99},
  {id:'sponge-vanilla',   name:'Sponge Cake Vanilla',   price:19.99},
  {id:'sponge-normal',    name:'Sponge Cake Normal',     price:19.99}
];

// ── FLAVOURS (editable via settings) ─────────────────────────
var FLAVOURS = [
  {v:'morango',          l:'Morango 🍓'},
  {v:'chocolate',        l:'Chocolate 🍫'},
  {v:'chocolate-branco', l:'Chocolate Branco 🍫'},
  {v:'limao',            l:'Limão 🍋'},
  {v:'limao-verde',      l:'Limão Verde 🍋'},
  {v:'laranja',          l:'Laranja 🍊'},
  {v:'kiwi',             l:'Kiwi 🥝'},
  {v:'coco',             l:'Coco 🥥'},
  {v:'ananas',           l:'Ananás 🍍'},
  {v:'cereja',           l:'Cereja 🍒'},
  {v:'manga',            l:'Manga 🥭'},
  {v:'framboesa',        l:'Framboesa 🫐'},
  {v:'caramel',          l:'Caramel'},
  {v:'frutos-vermelhos', l:'Frutos Vermelhos'}
];

// ── SIZES ────────────────────────────────────────────────────
var SIZES = [
  {v:'1.0',max:'1.3',p:'7–8 pessoas'},
  {v:'1.3',max:'1.6',p:'9–11 pessoas'},
  {v:'1.6',max:'1.9',p:'12–14 pessoas'},
  {v:'1.9',max:'2.2',p:'15–16 pessoas'},
  {v:'2.2',max:'2.5',p:'17–18 pessoas'},
  {v:'2.5',max:'2.8',p:'19–22 pessoas'},
  {v:'2.8',max:'3.1',p:'23–25 pessoas'},
  {v:'3.1',max:'3.4',p:'26–28 pessoas'},
  {v:'3.4',max:'3.7',p:'29–32 pessoas'},
  {v:'3.7',max:'4.0',p:'33–35 pessoas'},
  {v:'4.0',max:'4.3',p:'36–38 pessoas'},
  {v:'4.3',max:'4.6',p:'39–42 pessoas'},
  {v:'4.6',max:'4.9',p:'43–46 pessoas'},
  {v:'4.9',max:'5.2',p:'47–50 pessoas'}
];

// ── STATUS CONFIG ─────────────────────────────────────────────
var STATUS = {
  new:       {label:'Nova',       color:'#6366f1', bg:'#eef2ff'},
  confirmed: {label:'Confirmado', color:'#2563eb', bg:'#eff6ff'},
  ready:     {label:'Pronto',     color:'#16a34a', bg:'#f0fdf4'},
  delivered: {label:'Entregue',   color:'#6b7280', bg:'#f9fafb'},
  cancelled: {label:'Cancelado',  color:'#dc2626', bg:'#fef2f2'}
};

var PAYMENT_METHODS = ['MBWay','Transferência Bancária','Dinheiro','Cartão (Revolut +1.75%)'];

// ── STATE ─────────────────────────────────────────────────────
var orders = [];
var recycleBin = [];
var customerRequests = [];
var nextOrderNum = 1;
var currentRole = 'admin';
var _search = '';
var _statusFilter = 'active';
var _yearFilter = '';
var _receiptOrderId = null;
var _receiptType = 'confirmation';
var _receiptStyle = 'classic';
var _waOrderId = null;
var _waType = 'confirmation';
var _editOrderId = null;
var _photoOrderId = null;
var _finalWeightOrderId = null;
var _finalDiscount = 0;
var _calOrderId = null;
var _bizCalLevel = 'year';
var _bizCalYear = new Date().getFullYear();
var _bizCalMonth = null;
var _bizCalDay = null;
var _extraProducts = [];
var _refPhotoData = null;

// ── HELPERS ───────────────────────────────────────────────────
function getCTName(id) {
  var ct = CAKE_TYPES.find(function(c){return c.id===id;});
  return ct ? ct.name : (id||'—');
}
function getCTPrice(id) {
  var ct = CAKE_TYPES.find(function(c){return c.id===id;});
  return ct ? ct.price : 19.99;
}
function getFLabel(v) {
  var f = FLAVOURS.find(function(x){return x.v===v;});
  return f ? f.l : (v||'—');
}
function getFlavorDesc(o) {
  var d = getFLabel(o.baseFlavor);
  if (o.combinationFlavor) d += ' + ' + getFLabel(o.combinationFlavor);
  if (o.extraFilling) d += ' c/ recheio extra de ' + getFLabel(o.extraFilling);
  return d || '—';
}
function getWeightDesc(o) {
  if (!o.minWeight) return '—';
  return o.minWeight + '–' + (o.maxWeight||(parseFloat(o.minWeight)+0.3).toFixed(1)) + ' kg';
}
function getPriceDesc(o) {
  if (o.finalPrice) return '€' + parseFloat(o.finalPrice).toFixed(2) + ' (final)';
  if (!o.minWeight||!o.cakeType) return '—';
  var ppkg = getCTPrice(o.cakeType);
  var ef = o.extraFilling ? 1.99 : 0;
  var ex = (o.extraProducts||[]).reduce(function(s,p){return s+parseFloat(p.price||0);},0);
  var mn = parseFloat(o.minWeight), mx = parseFloat(o.maxWeight||(mn+0.3).toFixed(1));
  return '€'+(mn*ppkg+ef+ex).toFixed(2)+'–€'+(mx*ppkg+ef+ex).toFixed(2)+' (est.)';
}
function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d+'T00:00:00').toLocaleDateString('pt-PT'); } catch(e){return d;}
}
function fmtDT(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('pt-PT'); } catch(e){return d;}
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() {
  var d=new Date(); d.setDate(d.getDate()+1);
  return d.toISOString().split('T')[0];
}
function genId() {
  var n = String(nextOrderNum).padStart(6,'0');
  nextOrderNum++;
  return 'BT-'+n;
}
function fixUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:')||url.startsWith('/')) return url;
  if (url.includes('storageapi')) {
    var p=url.split('/photos/');
    if(p.length>1) return '/uploads/photos/'+p[1];
    p=url.split('/logos/');
    if(p.length>1) return '/uploads/logos/'+p[1];
    p=url.split('/hero/');
    if(p.length>1) return '/uploads/hero/'+p[1];
  }
  if (url.startsWith('http')) return url;
  return '/uploads/'+url;
}
function setText(id,v) { var e=document.getElementById(id); if(e)e.textContent=v; }
function showToast(msg,type) {
  var t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.className='toast show '+(type||'success');
  clearTimeout(t._t);
  t._t=setTimeout(function(){t.className='toast';},3500);
}
function openModal(id) {
  var m=document.getElementById(id);
  if(m){m.classList.add('active');document.body.style.overflow='hidden';}
}
function closeModal(id) {
  var m=document.getElementById(id);
  if(m){m.classList.remove('active');document.body.style.overflow='';}
}


// ── ALIASES FOR COMPATIBILITY ─────────────────────────────────
var getCakeTypeName = getCTName;
var getCakeTypePrice = getCTPrice;
var getFlavorName = getFLabel;
var formatDate = fmtDate;
var fixPhotoUrl = fixUrl;
// ── DATA LAYER ────────────────────────────────────────────────
function loadData(cb) {
  fetch('/api/orders')
    .then(function(r){return r.json();})
    .then(function(data){
      if(Array.isArray(data)&&data.length>0){
        orders=data;
        orders.forEach(function(o){
          if(o.orderId){var n=parseInt(o.orderId.replace('BT-',''));if(!isNaN(n)&&n>=nextOrderNum)nextOrderNum=n+1;}
        });
      }
      if(cb)cb();
      refreshViews();
    })
    .catch(function(){if(cb)cb();});
}

function refreshViews() {
  // Only refresh views that exist on current page
  var isAdminPage = !!document.getElementById('orderForm');
  if(isAdminPage){
    if(typeof renderOrdersList==='function')renderOrdersList();
    if(typeof renderDashboard==='function')renderDashboard();
  }
  // Staff pages refresh themselves via their own setInterval
  // But trigger a custom event so they can listen
  try{document.dispatchEvent(new CustomEvent('ordersUpdated'));}catch(e){}
}

function saveOrder(order,cb) {
  var i=orders.findIndex(function(o){return o.id===order.id;});
  if(i>=0)orders[i]=order; else orders.push(order);
  fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)})
    .then(function(r){return r.json();})
    .then(function(saved){var j=orders.findIndex(function(o){return o.id===order.id;});if(j>=0)orders[j]=saved;if(cb)cb(saved);})
    .catch(function(){if(cb)cb(order);});
}

function deleteOrderServer(orderId,cb) {
  orders=orders.filter(function(o){return o.id!==orderId;});
  fetch('/api/orders/'+orderId,{method:'DELETE'}).then(function(){if(cb)cb();}).catch(function(){if(cb)cb();});
}

function loadRequests(cb) {
  fetch('/api/customer-requests')
    .then(function(r){return r.json();})
    .then(function(data){
      if(Array.isArray(data))customerRequests=data;
      updateReqBadge();
      if(cb)cb();
    })
    .catch(function(){if(cb)cb();});
}

// ── REAL-TIME ─────────────────────────────────────────────────
function initRealTime() {
  if(typeof io==='undefined')return;
  var socket=io();
  socket.on('orders-updated',function(){loadData();});
  socket.on('new-order',function(o){
    var i=orders.findIndex(function(x){return x.id===o.id;});
    if(i>=0)orders[i]=o; else orders.push(o);
    refreshViews();
    showToast('🔔 Nova encomenda: '+(o.customerName||''),'info');
  });
  socket.on('order-updated',function(o){
    var i=orders.findIndex(function(x){return x.id===o.id;});
    if(i>=0)orders[i]=o;
    refreshViews();
  });
  socket.on('order-deleted',function(d){
    orders=orders.filter(function(o){return o.id!==d.id;});
    refreshViews();
  });
  socket.on('new-request',function(){
    loadRequests();
    showToast('📩 Novo pedido de cliente!','info');
  });
  setInterval(function(){loadData();loadRequests();},30000);
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  var now=todayStr(), tom=tomorrowStr(), month=now.slice(0,7);
  var todayO=orders.filter(function(o){return o.orderDate===now&&o.status!=='cancelled';});
  var tomO=orders.filter(function(o){return o.orderDate===tom&&o.status!=='cancelled';});
  var monthO=orders.filter(function(o){return (o.orderDate||'').startsWith(month)&&o.status!=='cancelled';});
  var futureO=orders.filter(function(o){return o.orderDate>now&&o.status!=='delivered'&&o.status!=='cancelled';});
  var revenue=todayO.filter(function(o){return o.status==='delivered';}).reduce(function(s,o){return s+parseFloat(o.finalPrice||0);},0);
  setText('dashMonth',monthO.length);
  setText('dashToday',todayO.length);
  setText('dashTomorrow',tomO.length);
  setText('dashRevenue','€'+revenue.toFixed(2));
  setText('dashFuture',futureO.length);
  var agenda=document.getElementById('todayAgenda');
  if(!agenda)return;
  if(todayO.length===0){agenda.innerHTML='<div class="empty-agenda">Sem encomendas para hoje 🎉</div>';return;}
  var sorted=todayO.slice().sort(function(a,b){return (a.orderTime||'').localeCompare(b.orderTime||'');});
  agenda.innerHTML=sorted.map(function(o){
    var sc=STATUS[o.status]||STATUS.new;
    return '<div class="agenda-item"><div class="agenda-time">'+(o.orderTime||'—')+'</div>'
      +'<div class="agenda-info"><div class="agenda-name">'+o.customerName+'</div>'
      +'<div class="agenda-cake">'+getCTName(o.cakeType)+'</div></div>'
      +'<span class="status-badge" style="background:'+sc.bg+';color:'+sc.color+'">'+sc.label+'</span></div>';
  }).join('');
}

// ── ORDER FORM ────────────────────────────────────────────────
function initOrderForm() {
  var form=document.getElementById('orderForm');
  if(!form)return;
  populateCakeTypes();
  populateFlavours();
  populateWeightSelects('minWeight','maxWeight');
  populatePaymentMethods();
  document.querySelectorAll('input[name="deliveryType"]').forEach(function(r){
    r.addEventListener('change',function(){
      var as=document.getElementById('addressSection');
      if(as)as.style.display=r.value==='delivery'?'block':'none';
    });
  });
  document.querySelectorAll('input[name="deliveryOption"]').forEach(function(r){
    r.addEventListener('change',function(){
      var ss=document.getElementById('scheduledSection');
      var es=document.getElementById('expressSection');
      if(ss)ss.style.display=r.value==='scheduled'?'block':'none';
      if(es)es.style.display=r.value==='express'?'block':'none';
    });
  });
  var dateEl=document.getElementById('orderDate');
  if(dateEl)dateEl.min=todayStr();
  var photoInput=document.getElementById('refPhotoInput');
  if(photoInput){
    photoInput.addEventListener('change',function(){
      if(!photoInput.files||!photoInput.files[0])return;
      var reader=new FileReader();
      reader.onload=function(e){
        _refPhotoData=e.target.result;
        var prev=document.getElementById('refPhotoPreview');
        var img=document.getElementById('refPhotoImg');
        if(prev&&img){img.src=e.target.result;prev.style.display='block';}
      };
      reader.readAsDataURL(photoInput.files[0]);
    });
  }
  _extraProducts=[];
  var addBtn=document.getElementById('addExtraBtn');
  if(addBtn)addBtn.addEventListener('click',addExtraProduct);
  form.addEventListener('submit',function(e){e.preventDefault();submitOrder();});
  initCustomerId();
}

function populateCakeTypes() {
  var sel=document.getElementById('cakeType');
  if(!sel)return;
  sel.innerHTML='<option value="">Selecionar tipo...</option>';
  CAKE_TYPES.forEach(function(ct){sel.innerHTML+='<option value="'+ct.id+'">'+ct.name+' (€'+ct.price+'/kg)</option>';});
  sel.addEventListener('change',updatePriceEst);
}

function populateFlavours() {
  ['baseFlavor','combinationFlavor','extraFilling'].forEach(function(id){
    var sel=document.getElementById(id);
    if(!sel)return;
    var isExtra=id==='extraFilling';
    sel.innerHTML='<option value="">'+(isExtra?'Sem recheio extra':'Selecionar sabor...')+'</option>';
    FLAVOURS.forEach(function(f){sel.innerHTML+='<option value="'+f.v+'">'+f.l+(isExtra?' (+€1.99)':'')+'</option>';});
    if(id==='baseFlavor'){
      sel.addEventListener('change',function(){
        var showCombo=['chocolate','chocolate-branco'].includes(sel.value);
        var cs=document.getElementById('combinationSection');
        if(cs)cs.style.display=showCombo?'block':'none';
        updatePriceEst();
      });
    } else {
      sel.addEventListener('change',updatePriceEst);
    }
  });
}

function populateWeightSelects(minId,maxId) {
  var minSel=document.getElementById(minId);
  if(!minSel)return;
  minSel.innerHTML='<option value="">Selecionar peso mínimo...</option>';
  SIZES.forEach(function(s){minSel.innerHTML+='<option value="'+s.v+'">'+s.v+' kg (máx. '+s.max+' kg)</option>';});
  minSel.addEventListener('change',function(){
    var size=SIZES.find(function(s){return s.v===minSel.value;});
    var maxSel=document.getElementById(maxId);
    if(maxSel&&size)maxSel.value=size.max;
    updatePriceEst();
  });
}

function populatePaymentMethods() {
  var sel=document.getElementById('paymentMethod');
  if(!sel)return;
  sel.innerHTML='<option value="">Selecionar...</option>';
  PAYMENT_METHODS.forEach(function(m){sel.innerHTML+='<option value="'+m+'">'+m+'</option>';});
}

function updatePriceEst() {
  var ct=(document.getElementById('cakeType')||{}).value;
  var mw=parseFloat((document.getElementById('minWeight')||{}).value||0);
  var xw=parseFloat((document.getElementById('maxWeight')||{}).value||mw+0.3);
  var ef=(document.getElementById('extraFilling')||{}).value?1.99:0;
  var ex=_extraProducts.reduce(function(s,p){return s+parseFloat(p.price||0);},0);
  var display=document.getElementById('priceEstimate');
  if(!display||!ct||!mw){if(display)display.style.display='none';return;}
  var ppkg=getCTPrice(ct);
  display.style.display='block';
  display.innerHTML='<span class="price-range">€'+(mw*ppkg+ef+ex).toFixed(2)+' – €'+(xw*ppkg+ef+ex).toFixed(2)+'</span>'
    +'<span class="price-note">'+mw+'–'+xw+'kg × €'+ppkg+'/kg'+(ef>0?' + €1.99 recheio':'')+(ex>0?' + €'+ex.toFixed(2)+' extras':'')+'</span>';
}

function addExtraProduct() {
  var idx=_extraProducts.length;
  _extraProducts.push({name:'',price:0});
  var container=document.getElementById('extraProductsList');
  if(!container)return;
  var row=document.createElement('div');
  row.className='extra-row';
  row.innerHTML='<input type="text" placeholder="Nome do produto/serviço" class="form-input" oninput="_extraProducts['+idx+'].name=this.value"/>'
    +'<input type="number" placeholder="€" min="0" step="0.01" class="form-input" style="width:80px" oninput="_extraProducts['+idx+'].price=parseFloat(this.value)||0;updatePriceEst()"/>'
    +'<button type="button" onclick="removeExtra('+idx+')" class="btn-icon-danger"><i class="fas fa-times"></i></button>';
  container.appendChild(row);
}

function removeExtra(idx) {
  _extraProducts.splice(idx,1);
  var c=document.getElementById('extraProductsList');
  if(!c)return;
  c.innerHTML='';
  var copy=_extraProducts.slice();
  _extraProducts=[];
  copy.forEach(function(p){
    var i=_extraProducts.length;
    _extraProducts.push(p);
    var row=document.createElement('div');
    row.className='extra-row';
    row.innerHTML='<input type="text" value="'+p.name+'" class="form-input" oninput="_extraProducts['+i+'].name=this.value"/>'
      +'<input type="number" value="'+p.price+'" min="0" step="0.01" class="form-input" style="width:80px" oninput="_extraProducts['+i+'].price=parseFloat(this.value)||0;updatePriceEst()"/>'
      +'<button type="button" onclick="removeExtra('+i+')" class="btn-icon-danger"><i class="fas fa-times"></i></button>';
    c.appendChild(row);
  });
  updatePriceEst();
}

function submitOrder() {
  var name=(document.getElementById('customerName')||{}).value.trim();
  var ct=(document.getElementById('cakeType')||{}).value;
  var bf=(document.getElementById('baseFlavor')||{}).value;
  var mw=(document.getElementById('minWeight')||{}).value;
  if(!name){showToast('Por favor insira o nome do cliente','error');return;}
  if(!ct){showToast('Por favor selecione o tipo de bolo','error');return;}
  if(!bf){showToast('Por favor selecione o sabor base','error');return;}
  if(!mw){showToast('Por favor selecione o peso','error');return;}
  var size=SIZES.find(function(s){return s.v===mw;});
  var maxW=size?size.max:(parseFloat(mw)+0.3).toFixed(1);
  var dOpt=(document.querySelector('input[name="deliveryOption"]:checked')||{}).value||'scheduled';
  var dType=(document.querySelector('input[name="deliveryType"]:checked')||{}).value||'pickup';
  var order={
    id:Date.now(), orderId:genId(),
    customerId:(document.getElementById('customerId')||{}).value.trim(),
    customerName:name,
    phone:(document.getElementById('phone')||{}).value.trim(),
    nif:(document.getElementById('nif')||{}).value.trim(),
    cakeType:ct, baseFlavor:bf,
    combinationFlavor:(document.getElementById('combinationFlavor')||{}).value,
    extraFilling:(document.getElementById('extraFilling')||{}).value,
    cakeMessage:(document.getElementById('cakeMessage')||{}).value.trim(),
    chefNotes:(document.getElementById('chefNotes')||{}).value.trim(),
    minWeight:mw, maxWeight:maxW,
    deliveryType:dType, deliveryOption:dOpt,
    address:(document.getElementById('address')||{}).value.trim(),
    orderDate:dOpt==='express'?todayStr():(document.getElementById('orderDate')||{}).value,
    orderTime:dOpt==='express'?(document.getElementById('expressTime')||{}).value:(document.getElementById('orderTime')||{}).value,
    paymentMethod:(document.getElementById('paymentMethod')||{}).value,
    extraProducts:_extraProducts.filter(function(p){return p.name&&p.price>0;}),
    photos:_refPhotoData?[_refPhotoData]:[],
    status:'new', createdAt:new Date().toISOString()
  };
  saveOrder(order,function(saved){
    showToast('✅ Encomenda '+saved.orderId+' criada!','success');
    resetForm();
    renderOrdersList();
    renderDashboard();
  });
}

function resetForm() {
  var form=document.getElementById('orderForm');
  if(form)form.reset();
  _extraProducts=[];_refPhotoData=null;
  ['extraProductsList','priceEstimate','combinationSection','addressSection','scheduledSection','expressSection','refPhotoPreview'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.style.display='none';
  });
  initCustomerId();
}

function initCustomerId() {
  var el=document.getElementById('customerId');
  if(!el)return;
  var max=orders.reduce(function(m,o){var n=parseInt((o.customerId||'').replace(/\D/g,''));return isNaN(n)?m:Math.max(m,n);},0);
  el.value='C-'+String(max+1).padStart(3,'0');
}

// ── ORDER LIST ────────────────────────────────────────────────
function renderOrdersList() {
  var container=document.getElementById('ordersList');
  if(!container)return;
  var list=orders.filter(function(o){
    if(_statusFilter==='active')return o.status!=='delivered'&&o.status!=='cancelled';
    if(_statusFilter!=='all')return o.status===_statusFilter;
    return true;
  });
  if(_search){
    var q=_search.toLowerCase();
    list=list.filter(function(o){
      return (o.customerName||'').toLowerCase().includes(q)||(o.orderId||'').toLowerCase().includes(q)||(o.phone||'').includes(q)||(o.nif||'').includes(q)||(o.customerId||'').toLowerCase().includes(q);
    });
  }
  if(_yearFilter)list=list.filter(function(o){return (o.orderDate||'').startsWith(_yearFilter);});
  list.sort(function(a,b){return ((a.orderDate||'9999')+(a.orderTime||'99:99')).localeCompare((b.orderDate||'9999')+(b.orderTime||'99:99'));});
  if(list.length===0){container.innerHTML='<div class="empty-state"><i class="fas fa-box-open"></i><p>Sem encomendas</p></div>';return;}
  container.innerHTML=list.map(function(o){return renderOrderCard(o);}).join('');
}

function renderOrderCard(order) {
  var sc=STATUS[order.status]||STATUS.new;
  var hasPhotos=order.photos&&order.photos.length>0;
  var photoCount=hasPhotos?order.photos.length:0;
  var calDate=(order.orderDate||'').replace(/-/g,'');
  var calTime=(order.orderTime||'18:00').replace(':','')+'00';
  var calTitle=encodeURIComponent('Bismi Treats - '+(order.customerName||'')+' ('+(order.orderId||'')+')');
  var calDetails=encodeURIComponent(getFlavorDesc(order)+' | '+getWeightDesc(order));
  var isAdmin=currentRole==='admin';
  return '<div class="order-card" id="order-'+order.id+'">'
    +'<div class="order-card-header">'
      +'<div class="order-header-left">'
        +'<span class="order-id-badge">'+(order.orderId||('BT-'+String(order.id).slice(-6).padStart(6,'0')))+'</span>'
        +(order.customerId?'<span class="cust-id-badge">'+order.customerId+'</span>':'')
        +'<span class="order-customer">'+order.customerName+'</span>'
      +'</div>'
      +'<div class="order-header-right">'
        +renderStatusDropdown(order.id,order.status)
        +(isAdmin?'<button class="btn-icon" onclick="openEditModal('+order.id+')" title="Editar"><i class="fas fa-edit"></i></button>':'')
      +'</div>'
    +'</div>'
    +'<div class="order-card-body">'
      +'<div class="order-grid">'
        +'<div class="order-info"><i class="fas fa-birthday-cake"></i><span>'+getCTName(order.cakeType)+'</span></div>'
        +'<div class="order-info"><i class="fas fa-tag"></i><span>'+getPriceDesc(order)+'</span></div>'
        +'<div class="order-info full"><i class="fas fa-palette"></i><span>'+getFlavorDesc(order)+'</span></div>'
        +(order.cakeMessage?'<div class="order-info full"><i class="fas fa-comment"></i><span>"'+order.cakeMessage+'"</span></div>':'')
        +'<div class="order-info"><i class="fas fa-weight"></i><span>'+getWeightDesc(order)+'</span></div>'
        +'<div class="order-info"><i class="fas fa-calendar"></i><span>'+fmtDate(order.orderDate)+(order.orderTime?' às '+order.orderTime:'')+'</span></div>'
        +'<div class="order-info full"><i class="fas fa-truck"></i><span>'+(order.deliveryType==='pickup'?'🏪 Recolha':'🚚 Entrega')+(order.address?' — '+order.address:'')+'</span></div>'
        +(order.phone?'<div class="order-info"><i class="fas fa-phone"></i><span>'+order.phone+'</span></div>':'')
        +(order.paymentMethod?'<div class="order-info"><i class="fas fa-credit-card"></i><span>'+order.paymentMethod+'</span></div>':'')
        +(order.chefNotes?'<div class="order-info full chef-note"><i class="fas fa-utensils"></i><span>'+order.chefNotes+'</span></div>':'')
      +'</div>'
    +'</div>'
    +'<div class="order-card-actions">'
      +'<button class="btn-action btn-receipt" onclick="openReceipt('+order.id+')" title="Recibo"><i class="fas fa-receipt"></i> Recibo</button>'
      +'<button class="btn-action btn-whatsapp" onclick="openWAModal('+order.id+')" title="WhatsApp"><i class="fab fa-whatsapp"></i> WhatsApp</button>'
      +(order.deliveryType==='delivery'?'<button class="btn-action btn-delivery" onclick="openDeliveryMsg('+order.id+')" title="Entrega"><i class="fas fa-truck"></i> Entrega</button>':'')
      +'<button class="btn-action btn-cal" onclick="addToCalendar('+order.id+')" title="Calendário"><i class="fas fa-calendar-plus"></i></button>'
      +'<button class="btn-action btn-history" onclick="showCustHistory(\''+order.customerName+'\',\''+order.customerId+'\')" title="Histórico"><i class="fas fa-history"></i></button>'
      +'<button class="btn-action '+(hasPhotos?'btn-photo-has':'btn-photo')+'" onclick="openPhotoMgr('+order.id+')" title="'+(hasPhotos?photoCount+' foto(s)':'Foto')+'"><i class="fas fa-camera"></i>'+(hasPhotos?' ('+photoCount+')':'')+'</button>'
      +(isAdmin?'<button class="btn-action btn-delete" onclick="deleteOrder('+order.id+')" title="Eliminar"><i class="fas fa-trash"></i></button>':'')
    +'</div>'
  +'</div>';
}

function renderStatusDropdown(orderId,currentStatus) {
  var sc=STATUS[currentStatus]||STATUS.new;
  var opts=Object.keys(STATUS).map(function(s){return '<option value="'+s+'"'+(s===currentStatus?' selected':'')+'>'+STATUS[s].label+'</option>';}).join('');
  return '<select class="status-select" style="background:'+sc.bg+';color:'+sc.color+';border-color:'+sc.color+'40" onchange="changeStatus('+orderId+',this.value)">'+opts+'</select>';
}

function changeStatus(orderId,newStatus) {
  var order=orders.find(function(o){return o.id===orderId;});
  if(!order)return;
  var old=order.status;
  order.status=newStatus;
  if(newStatus==='ready'&&old!=='ready')openFinalWeightModal(orderId);
  saveOrder(order,function(){renderOrdersList();renderDashboard();showToast('Status: '+STATUS[newStatus].label,'success');});
}

// ── FINAL WEIGHT ──────────────────────────────────────────────
function openFinalWeightModal(orderId) {
  var order=orders.find(function(o){return o.id===orderId;});
  if(!order)return;
  _finalWeightOrderId=orderId;
  _finalDiscount=0;
  document.querySelectorAll('.discount-btn').forEach(function(b){b.classList.remove('active');});
  var sel=document.getElementById('finalWeightSelect');
  if(sel){
    sel.innerHTML='';
    for(var w=0.8;w<=6.0;w=Math.round((w+0.1)*10)/10)sel.innerHTML+='<option value="'+w.toFixed(1)+'">'+w.toFixed(1)+' kg</option>';
    if(order.minWeight)sel.value=order.minWeight;
  }
  var priceEl=document.getElementById('finalPricePerKg');
  if(priceEl)priceEl.value=getCTPrice(order.cakeType);
  var manualEl=document.getElementById('finalWeightManual');
  if(manualEl)manualEl.value='';
  updateFinalPrice();
  openModal('finalWeightModal');
}

function updateFinalPrice() {
  var order=orders.find(function(o){return o.id===_finalWeightOrderId;});
  if(!order)return;
  var manualEl=document.getElementById('finalWeightManual');
  var weight=manualEl&&manualEl.value?parseFloat(manualEl.value)||0:parseFloat((document.getElementById('finalWeightSelect')||{}).value||0);
  var ppkg=parseFloat((document.getElementById('finalPricePerKg')||{}).value||19.99);
  var ef=order.extraFilling?1.99:0;
  var ex=(order.extraProducts||[]).reduce(function(s,p){return s+parseFloat(p.price||0);},0);
  var sub=weight*ppkg+ef+ex;
  var disc=sub*(_finalDiscount/100);
  var total=sub-disc;
  window._finalTotal=total;
  var display=document.getElementById('finalPriceDisplay');
  if(display){
    display.innerHTML='<div class="price-breakdown">'
      +'<div>'+weight.toFixed(2)+' kg × €'+ppkg+'/kg = €'+(weight*ppkg).toFixed(2)+'</div>'
      +(ef>0?'<div>Recheio extra: +€'+ef.toFixed(2)+'</div>':'')
      +(ex>0?'<div>Extras: +€'+ex.toFixed(2)+'</div>':'')
      +(_finalDiscount>0?'<div class="discount-line">Desconto '+_finalDiscount+'%: -€'+disc.toFixed(2)+'</div>':'')
      +'<div class="total-line">Total: <strong>€'+total.toFixed(2)+'</strong></div>'
    +'</div>';
  }
}

function setDiscount(pct) {
  _finalDiscount=(_finalDiscount===pct)?0:pct;
  document.querySelectorAll('.discount-btn').forEach(function(b){b.classList.toggle('active',parseInt(b.dataset.pct)===_finalDiscount);});
  updateFinalPrice();
}

function confirmFinalWeight() {
  var order=orders.find(function(o){return o.id===_finalWeightOrderId;});
  if(!order)return;
  var manualEl=document.getElementById('finalWeightManual');
  order.finalWeight=manualEl&&manualEl.value?parseFloat(manualEl.value).toFixed(2):(document.getElementById('finalWeightSelect')||{}).value;
  order.finalPrice=(window._finalTotal||0).toFixed(2);
  order.finalPricePerKg=(document.getElementById('finalPricePerKg')||{}).value;
  order.finalDiscount=_finalDiscount;
  saveOrder(order,function(){closeModal('finalWeightModal');renderOrdersList();showToast('✅ Peso final: '+order.finalWeight+' kg | Total: €'+order.finalPrice,'success');});
}

// ── EDIT ORDER ────────────────────────────────────────────────
function openEditModal(orderId) {
  var order=orders.find(function(o){return o.id===orderId;});
  if(!order)return;
  _editOrderId=orderId;
  var fields={editCustomerName:order.customerName,editPhone:order.phone,editNif:order.nif,editCustomerId:order.customerId,editCakeMessage:order.cakeMessage,editChefNotes:order.chefNotes,editAddress:order.address,editOrderDate:order.orderDate,editOrderTime:order.orderTime};
  Object.keys(fields).forEach(function(id){var el=document.getElementById(id);if(el)el.value=fields[id]||'';});
  var ctSel=document.getElementById('editCakeType');
  if(ctSel){ctSel.innerHTML='';CAKE_TYPES.forEach(function(ct){ctSel.innerHTML+='<option value="'+ct.id+'"'+(ct.id===order.cakeType?' selected':'')+'>'+ct.name+'</option>';});}
  ['editBaseFlavor','editCombinationFlavor','editExtraFilling'].forEach(function(id){
    var sel=document.getElementById(id);if(!sel)return;
    var field=id.replace('edit','').replace(/^./,function(c){return c.toLowerCase();});
    sel.innerHTML='<option value="">—</option>';
    FLAVOURS.forEach(function(f){sel.innerHTML+='<option value="'+f.v+'"'+(f.v===order[field]?' selected':'')+'>'+f.l+'</option>';});
  });
  var stSel=document.getElementById('editStatus');
  if(stSel){stSel.innerHTML='';Object.keys(STATUS).forEach(function(s){stSel.innerHTML+='<option value="'+s+'"'+(s===order.status?' selected':'')+'>'+STATUS[s].label+'</option>';});}
  var pmSel=document.getElementById('editPaymentMethod');
  if(pmSel){pmSel.innerHTML='';PAYMENT_METHODS.forEach(function(m){pmSel.innerHTML+='<option value="'+m+'"'+(m===order.paymentMethod?' selected':'')+'>'+m+'</option>';});}
  populateWeightSelects('editMinWeight','editMaxWeight');
  var minSel=document.getElementById('editMinWeight');if(minSel)minSel.value=order.minWeight||'';
  var maxSel=document.getElementById('editMaxWeight');if(maxSel)maxSel.value=order.maxWeight||'';
  openModal('editOrderModal');
}

function saveEditOrder() {
  var order=orders.find(function(o){return o.id===_editOrderId;});
  if(!order)return;
  var fields={customerName:'editCustomerName',phone:'editPhone',nif:'editNif',customerId:'editCustomerId',cakeMessage:'editCakeMessage',chefNotes:'editChefNotes',address:'editAddress',orderDate:'editOrderDate',orderTime:'editOrderTime',cakeType:'editCakeType',baseFlavor:'editBaseFlavor',combinationFlavor:'editCombinationFlavor',extraFilling:'editExtraFilling',paymentMethod:'editPaymentMethod',minWeight:'editMinWeight',maxWeight:'editMaxWeight',status:'editStatus'};
  Object.keys(fields).forEach(function(field){var el=document.getElementById(fields[field]);if(el&&el.value!==undefined)order[field]=el.value;});
  saveOrder(order,function(){closeModal('editOrderModal');renderOrdersList();renderDashboard();showToast('✅ Encomenda atualizada','success');});
}

// ── DELETE ────────────────────────────────────────────────────
function deleteOrder(orderId) {
  if(!confirm('Eliminar esta encomenda? Será movida para a reciclagem.'))return;
  var order=orders.find(function(o){return o.id===orderId;});
  if(order){order.deletedAt=new Date().toISOString();recycleBin.push(order);try{localStorage.setItem('bismiRecycleBin',JSON.stringify(recycleBin));}catch(e){}}
  deleteOrderServer(orderId,function(){renderOrdersList();renderDashboard();showToast('🗑️ Encomenda eliminada','warning');});
}

// ── RECEIPT ───────────────────────────────────────────────────
function openReceipt(orderId) {
  _receiptOrderId=orderId;_receiptType='confirmation';_receiptStyle='classic';
  document.querySelectorAll('.receipt-type-btn,.receipt-style-btn').forEach(function(b){b.classList.remove('active');});
  var cb=document.getElementById('receiptTypeConfirmation');var sb=document.getElementById('receiptStyleClassic');
  if(cb)cb.classList.add('active');if(sb)sb.classList.add('active');
  renderReceipt();openModal('receiptModal');
}

function renderReceipt() {
  var order=orders.find(function(o){return o.id===_receiptOrderId;});
  if(!order)return;
  var container=document.getElementById('receiptContent');
  if(!container)return;
  var fd=getFlavorDesc(order),wd=getWeightDesc(order),pd=getPriceDesc(order),ds=fmtDate(order.orderDate),dl=order.deliveryType==='pickup'?'🏪 Recolha':'🚚 Entrega ao Domicílio',isConf=_receiptType==='confirmation';
  container.innerHTML=_receiptStyle==='modern'?buildModernReceipt(order,fd,wd,pd,ds,dl,isConf):buildClassicReceipt(order,fd,wd,pd,ds,dl,isConf);
}

function buildClassicReceipt(o,fd,wd,pd,ds,dl,isConf) {
  return '<div class="receipt-classic">'
    +'<div class="receipt-header"><div class="receipt-logo">🎂</div><h2>Bismi Treats</h2>'
    +'<p class="receipt-subtitle">'+(isConf?'Confirmação de Encomenda':'Recibo Final')+'</p>'
    +'<p class="receipt-meta">'+(o.orderId||'')+(o.customerId?' · '+o.customerId:'')+'</p>'
    +'<p class="receipt-meta">'+new Date().toLocaleDateString('pt-PT')+'</p></div>'
    +'<div class="receipt-section"><div class="receipt-section-title">Cliente</div>'
    +'<div class="receipt-row"><span>Nome</span><span>'+o.customerName+'</span></div>'
    +(o.phone?'<div class="receipt-row"><span>Telefone</span><span>'+o.phone+'</span></div>':'')
    +(o.nif?'<div class="receipt-row"><span>NIF</span><span>'+o.nif+'</span></div>':'')
    +'</div>'
    +'<div class="receipt-section"><div class="receipt-section-title">Encomenda</div>'
    +'<div class="receipt-row"><span>Tipo</span><span>'+getCTName(o.cakeType)+'</span></div>'
    +'<div class="receipt-row"><span>Sabor</span><span>'+fd+'</span></div>'
    +(o.cakeMessage?'<div class="receipt-row"><span>Mensagem</span><span>"'+o.cakeMessage+'"</span></div>':'')
    +'<div class="receipt-row"><span>Peso</span><span>'+wd+'</span></div>'
    +'</div>'
    +'<div class="receipt-section"><div class="receipt-section-title">Entrega</div>'
    +'<div class="receipt-row"><span>Data</span><span>'+ds+'</span></div>'
    +'<div class="receipt-row"><span>Hora</span><span>'+(o.orderTime||'—')+'</span></div>'
    +'<div class="receipt-row"><span>Tipo</span><span>'+dl+'</span></div>'
    +(o.address?'<div class="receipt-row"><span>Morada</span><span>'+o.address+'</span></div>':'')
    +'<div class="receipt-row"><span>Pagamento</span><span>'+(o.paymentMethod||'—')+'</span></div>'
    +'</div>'
    +'<div class=receipt-total">'+(isConf?'<div class="receipt-row"><span>Preço Estimado</span><span>'+pd+'</span></div>':'<div class="receipt-row"><span>Peso Final</span><span>'+(o.finalWeight||'—')+' kg</span></div>'+'<div class="receipt-row"><span>Preço/kg</span><span>€'+(o.finalPricePerKg||'19.99')+'/kg</span></div>'+(o.finalDiscount>0?'<div class="receipt-row"><span>Desconto</span><span>-'+o.finalDiscount+'%</span></div>':'')+(o.extraFilling?'<div class="receipt-row"><span>Recheio Extra</span><span>+€1.99</span></div>':'')+((o.extraProducts&&o.extraProducts.length>0)?o.extraProducts.map(function(p){return '<div class="receipt-row"><span>'+p.name+'</span><span>+€'+parseFloat(p.price).toFixed(2)+'</span></div>';}).join(''):'')+'<div class="receipt-row total"><span>Total Final</span><span>€'+(o.finalPrice||'—')+'</span></div>')+'</div>'
    +(o.chefNotes?'<div class="receipt-section"><div class="receipt-section-title">Nota Chef</div><p>'+o.chefNotes+'</p></div>':'')
    +'<div class="receipt-footer"><p>📞 934 453 710 · ✉️ bismitreats.pt@gmail.com</p><p>🌐 bismitreats.com · 📸 @bismitreats.pt</p><p>❤️ Feito com amor e carinho pela Bismi Treats</p></div>'
  +'</div>';
}

function buildModernReceipt(o,fd,wd,pd,ds,dl,isConf) {
  return '<div class="receipt-modern">'
    +'<div class="rcpm-header"><div class="rcpm-logo">🎂</div><div class="rcpm-brand">Bismi Treats</div>'
    +'<div class="rcpm-type">'+(isConf?'Confirmação de Encomenda':'Recibo Final')+'</div>'
    +'<div class="rcpm-id">'+(o.orderId||'')+'</div></div>'
    +'<div class="rcpm-grid">'
    +'<div class="rcpm-card"><div class="rcpm-card-title"><i class="fas fa-user"></i> Cliente</div>'
    +'<div class="rcpm-row">'+o.customerName+'</div>'+(o.phone?'<div class="rcpm-row">📞 '+o.phone+'</div>':'')+(o.nif?'<div class="rcpm-row">NIF: '+o.nif+'</div>':'')+'</div>'
    +'<div class="rcpm-card"><div class="rcpm-card-title"><i class="fas fa-birthday-cake"></i> Bolo</div>'
    +'<div class="rcpm-row">'+getCTName(o.cakeType)+'</div><div class="rcpm-row">'+fd+'</div>'+(o.cakeMessage?'<div class="rcpm-row">"'+o.cakeMessage+'"</div>':'')+'<div class="rcpm-row">'+wd+'</div></div>'
    +'<div class="rcpm-card"><div class="rcpm-card-title"><i class="fas fa-truck"></i> Entrega</div>'
    +'<div class="rcpm-row">'+ds+' às '+(o.orderTime||'—')+'</div><div class="rcpm-row">'+dl+'</div>'+(o.address?'<div class="rcpm-row">'+o.address+'</div>':'')+'<div class="rcpm-row">'+(o.paymentMethod||'—')+'</div></div>'
    +'<div class="rcpm-card rcpm-price-card"><div class="rcpm-card-title"><i class="fas fa-tag"></i> '+(isConf?'Preço Estimado':'Total Final')+'</div>'
    +'<div class="rcpm-total">'+(isConf?pd:'€'+(o.finalPrice||'—'))+'</div></div>'
    +'</div><div class="rcpm-footer">📞 934 453 710 · bismitreats.pt@gmail.com · bismitreats.com</div></div>';
}

function printReceipt(size) {
  var content=(document.getElementById('receiptContent')||{}).innerHTML;
  if(!content){showToast('Nenhum recibo para imprimir','error');return;}
  var w=window.open('','_blank');
  var pageSize=size==='a5'?'148mm 210mm':'210mm 297mm';
  var fontSize=size==='a5'?'10px':'12px';
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recibo Bismi Treats</title>'
    +'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>'
    +'<style>@page{size:'+pageSize+';margin:8mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",Georgia,sans-serif;color:#1a1a1a;font-size:'+fontSize+';background:white}'
    +'.receipt-classic,.receipt-modern{max-width:100%}'
    +'.receipt-header{text-align:center;padding-bottom:12px;border-bottom:2px solid #C9A96E;margin-bottom:12px}'
    +'.receipt-logo{font-size:2rem;margin-bottom:4px}.receipt-header h2{font-size:1.2rem;color:#A07840;font-family:Georgia,serif;margin:4px 0}'
    +'.receipt-subtitle{color:#555;font-size:0.8rem;margin:2px 0}.receipt-meta{color:#888;font-size:0.7rem;margin:1px 0}'
    +'.receipt-section{margin-bottom:10px}.receipt-section-title{font-size:0.68rem;font-weight:700;color:#A07840;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid #e8d9c0}'
    +'.receipt-row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dotted #e8d9c0;font-size:0.78rem;color:#555}'
    +'.receipt-row span:last-child{font-weight:500;color:#1a1a1a;text-align:right;max-width:60%}'
    +'.receipt-total{background:#FBF7EF;border:1.5px solid #F5EDD8;border-radius:8px;padding:10px;margin:10px 0;text-align:center}'
    +'.receipt-row.total{font-weight:700;font-size:0.95rem;color:#A07840;border:none;justify-content:center;gap:8px}'
    +'.receipt-footer{text-align:center;margin-top:12px;padding-top:10px;border-top:1px solid #e8d9c0;font-size:0.7rem;color:#888;line-height:1.9}'
    +'.rcpm-header{background:linear-gradient(135deg,#A07840,#C9A96E);color:white;padding:14px;border-radius:8px;text-align:center;margin-bottom:10px}'
    +'.rcpm-logo{font-size:1.8rem;margin-bottom:4px}.rcpm-brand{font-family:Georgia,serif;font-size:1.2rem;font-weight:700}'
    +'.rcpm-type{font-size:0.78rem;opacity:.85;margin-top:2px}.rcpm-id{font-size:0.68rem;opacity:.7;margin-top:2px}'
    +'.rcpm-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
    +'.rcpm-card{background:#FBF7EF;border:1px solid #e8d9c0;border-radius:7px;padding:9px}'
    +'.rcpm-price-card{grid-column:span 2;text-align:center}'
    +'.rcpm-card-title{font-size:0.68rem;font-weight:700;color:#A07840;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}'
    +'.rcpm-row{font-size:0.76rem;padding:2px 0;border-bottom:1px dotted #e8d9c0;color:#333}'
    +'.rcpm-total{font-size:1.1rem;font-weight:700;color:#A07840;margin-top:6px}'
    +'.rcpm-footer{text-align:center;margin-top:10px;font-size:0.7rem;color:#888;padding-top:8px;border-top:1px solid #e8d9c0}'
    +'</style></head><body>'+content+'</body></html>');
  w.document.close();
  setTimeout(function(){w.print();},600);
}

// ── WHATSAPP ──────────────────────────────────────────────────
function openWAModal(orderId) {
  var order=orders.find(function(o){return o.id===orderId;});
  if(!order)return;
  _waOrderId=orderId;_waType='confirmation';
  var cb=document.getElementById('waTypeConfirmation');var fb=document.getElementById('waTypeFinal');
  if(cb)cb.classList.add('active');if(fb)fb.classList.remove('active');
  renderWAMessage();openModal('whatsappModal');
}

function renderWAMessage() {
  var order=orders.find(function(o){return o.id===_waOrderId;});
  if(!order)return;
  var ta=document.getElementById('waMessageText');
  if(ta)ta.value=buildWAMessage(order,_waType);
}

function buildWAMessage(order,type) {
  var fd=getFlavorDesc(order),wd=getWeightDesc(order),pd=getPriceDesc(order),ds=fmtDate(order.orderDate),dl=order.deliveryType==='pickup'?'🏪 Recolha':'🚚 Entrega ao Domicílio',isConf=type!=='final';
  var msg='🎂 BISMI TREATS — '+(isConf?'Confirmação de Encomenda':'Recibo Final')+'\n\n';
  msg+='Olá '+order.customerName+'! 😊\n\n';
  if(isConf)msg+='Muito obrigado por escolher a Bismi Treats!\nA sua encomenda foi confirmada com sucesso.\n\n';
  else msg+='A sua encomenda está pronta! 🎉\n\n';
  msg+='📋 DETALHES DA ENCOMENDA\n━━━━━━━━━━━━━━━━━━━━━━━━\n';
  msg+='🆔 Referência: '+(order.orderId||'')+'\n';
  msg+='🎂 Bolo: '+getCTName(order.cakeType)+'\n';
  msg+='🍓 Sabor: '+fd+'\n';
  if(order.cakeMessage)msg+='💬 Mensagem: "'+order.cakeMessage+'"\n';
  msg+='⚖️ Peso: '+wd+'\n';
  if(order.extraProducts&&order.extraProducts.length>0){msg+='\n📦 EXTRAS:\n';order.extraProducts.forEach(function(p){msg+='• '+p.name+': +€'+parseFloat(p.price).toFixed(2)+'\n';});}
  msg+='\n💰 '+(isConf?'PREÇO ESTIMADO':'TOTAL FINAL')+'\n━━━━━━━━━━━━━━━━━━━━━━━━\n';
  msg+=isConf?pd+'\n(O preço final será calculado após a pesagem)\n':'€'+(order.finalPrice||'—')+'\n';
  msg+='\n🚚 ENTREGA\n━━━━━━━━━━━━━━━━━━━━━━━━\n';
  msg+='Tipo: '+dl+'\nData: '+ds+'\nHora: '+(order.orderTime||'—')+'\n';
  if(order.address)msg+='Morada: '+order.address+'\n';
  msg+='Pagamento: '+(order.paymentMethod||'—')+'\n';
  msg+='\nMuito obrigado pela sua confiança! 🙏\nBismi Treats — Feito com amor e carinho 💕';
  return msg;
}

function copyWAMessage() {
  var ta=document.getElementById('waMessageText');
  if(!ta)return;
  navigator.clipboard.writeText(ta.value).then(function(){showToast('✅ Mensagem copiada!','success');}).catch(function(){ta.select();document.execCommand('copy');showToast('✅ Mensagem copiada!','success');});
}

function sendWA() {
  var order=orders.find(function(o){return o.id===_waOrderId;});
  if(!order)return;
  var msg=(document.getElementById('waMessageText')||{}).value||buildWAMessage(order,_waType);
  var phone=(order.phone||'351934453710').replace(/\D/g,'');
  if(!phone.startsWith('351'))phone='351'+phone;
  window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank');
}

// ── DELIVERY MESSAGE ──────────────────────────────────────────
function openDeliveryMsg(orderId) {
  var order=orders.find(function(o){return o.id===orderId;});
  if(!order)return;
  var msg='🌸 Olá '+order.customerName+'!\n\nO seu pedido já está a caminho 🚚\nEntrega em aproximadamente 30 minutos.\n\n📍 Morada: '+(order.address||'—')+'\n💰 Valor a pagar: €'+(order.finalPrice||'—')+'\n💳 Pagamento: '+(order.paymentMethod||'—')+'\n\nObrigado por escolher a Bismi Treats! 😊';
  var phone=(order.phone||'351934453710').replace(/\D/g,'');
  if(!phone.startsWith('351'))phone='351'+phone;
  window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank');
}

// ── CALENDAR ──────────────────────────────────────────────────
function addToCalendar(orderId) {
  var order=orders.find(function(o){return o.id===orderId;});
  if(!order||!order.orderDate){showToast('Sem data para adicionar ao calendário','warning');return;}
  _calOrderId=orderId;
  openModal('calendarChoiceModal');
}

function openGoogleCal(orderId) {
  var id=orderId||_calOrderId;
  var order=orders.find(function(o){return o.id===id;});
  if(!order)return;
  var calDate=order.orderDate.replace(/-/g,'');
  var calTime=(order.orderTime||'18:00').replace(':','')+'00';
  var title=encodeURIComponent('Bismi Treats - '+order.customerName+' ('+(order.orderId||'')+')');
  var details=encodeURIComponent(getFlavorDesc(order)+' | '+getWeightDesc(order));
  window.open('https://calendar.google.com/calendar/render?action=TEMPLATE&text='+title+'&dates='+calDate+'T'+calTime+'/'+calDate+'T'+calTime+'&details='+details,'_blank');
  closeModal('calendarChoiceModal');
}

function openOutlookCal(orderId) {
  var id=orderId||_calOrderId;
  var order=orders.find(function(o){return o.id===id;});
  if(!order)return;
  var title=encodeURIComponent('Bismi Treats - '+order.customerName);
  var body=encodeURIComponent(getFlavorDesc(order)+' | '+getWeightDesc(order));
  var startDT=order.orderDate+'T'+(order.orderTime||'18:00')+':00';
  window.open('https://outlook.live.com/calendar/0/deeplink/compose?subject='+title+'&body='+body+'&startdt='+startDT,'_blank');
  closeModal('calendarChoiceModal');
}

// ── BUSINESS CALENDAR ─────────────────────────────────────────
function openBusinessCalendar() {
  _bizCalLevel='year';_bizCalYear=new Date().getFullYear();_bizCalMonth=null;_bizCalDay=null;
  renderBizCal();openModal('businessCalModal');
}

function renderBizCal() {
  var container=document.getElementById('bizCalContent');
  if(!container)return;
  if(_bizCalLevel==='year')renderBizCalYear(container);
  else if(_bizCalLevel==='month')renderBizCalMonth(container);
  else renderBizCalDay(container);
}

function renderBizCalYear(container) {
  var months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var html='<div class="biz-cal-header"><button class="biz-cal-nav" onclick="_bizCalYear--;renderBizCal()"><i class="fas fa-chevron-left"></i></button><span class="biz-cal-title">'+_bizCalYear+'</span><button class="biz-cal-nav" onclick="_bizCalYear++;renderBizCal()"><i class="fas fa-chevron-right"></i></button></div><div class="biz-cal-year-grid">';
  months.forEach(function(month,mi){
    var prefix=_bizCalYear+'-'+String(mi+1).padStart(2,'0')+'-';
    var count=orders.filter(function(o){return (o.orderDate||'').startsWith(prefix)&&o.status!=='cancelled';}).length;
    var cls=count===0?'':count<=2?'count-low':count<=5?'count-mid':'count-high';
    html+='<div class="biz-cal-month-cell '+cls+'" onclick="_bizCalMonth='+mi+';_bizCalLevel=\'month\';renderBizCal()"><div class="month-name">'+month+'</div><div class="month-count">'+(count>0?count+' encomenda'+(count!==1?'s':''):'—')+'</div></div>';
  });
  html+='</div>';
  container.innerHTML=html;
}

function renderBizCalMonth(container) {
  var months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var daysInMonth=new Date(_bizCalYear,_bizCalMonth+1,0).getDate();
  var prefix=_bizCalYear+'-'+String(_bizCalMonth+1).padStart(2,'0')+'-';
  var html='<div class="biz-cal-header"><button class="biz-cal-nav" onclick="_bizCalLevel=\'year\';renderBizCal()"><i class="fas fa-arrow-left"></i></button><span class="biz-cal-title">'+months[_bizCalMonth]+' '+_bizCalYear+'</span><button class="biz-cal-nav" onclick="printBizCalMonth()"><i class="fas fa-print"></i></button></div><div class="biz-cal-month-grid">';
  for(var d=1;d<=daysInMonth;d++){
    var dateStr=prefix+String(d).padStart(2,'0');
    var dayOrders=orders.filter(function(o){return o.orderDate===dateStr&&o.status!=='cancelled';});
    var isToday=dateStr===todayStr();
    html+='<div class="biz-cal-day-cell'+(isToday?' today':'')+(dayOrders.length>0?' has-orders':'')+'" onclick="_bizCalDay=\''+dateStr+'\';_bizCalLevel=\'day\';renderBizCal()"><div class="day-num">'+d+'</div>'+(dayOrders.length>0?'<div class="day-count">'+dayOrders.length+'</div>':'')+'</div>';
  }
  html+='</div>';
  container.innerHTML=html;
}

function renderBizCalDay(container) {
  var dayOrders=orders.filter(function(o){return o.orderDate===_bizCalDay&&o.status!=='cancelled';});
  dayOrders.sort(function(a,b){return (a.orderTime||'').localeCompare(b.orderTime||'');});
  var html='<div class="biz-cal-header"><button class="biz-cal-nav" onclick="_bizCalLevel=\'month\';renderBizCal()"><i class="fas fa-arrow-left"></i></button><span class="biz-cal-title">'+fmtDate(_bizCalDay)+'</span><button class="biz-cal-nav" onclick="printDayOrders(\''+_bizCalDay+'\')"><i class="fas fa-print"></i></button></div>';
  if(dayOrders.length===0)html+='<div class="empty-state"><i class="fas fa-calendar-check"></i><p>Sem encomendas neste dia</p></div>';
  else html+='<div class="biz-cal-orders">'+dayOrders.map(function(o){return renderOrderCard(o);}).join('')+'</div>';
  container.innerHTML=html;
}

function printDayOrders(dateStr) {
  var dayOrders=orders.filter(function(o){return o.orderDate===dateStr&&o.status!=='cancelled';});
  printOrderCards(dayOrders,'Encomendas — '+fmtDate(dateStr));
}

function printBizCalMonth() {
  var prefix=_bizCalYear+'-'+String(_bizCalMonth+1).padStart(2,'0')+'-';
  var monthOrders=orders.filter(function(o){return (o.orderDate||'').startsWith(prefix)&&o.status!=='cancelled';});
  monthOrders.sort(function(a,b){return ((a.orderDate+a.orderTime).localeCompare(b.orderDate+b.orderTime));});
  printOrderCards(monthOrders,'Encomendas — '+_bizCalYear);
}

function printOrderCards(orderList,title) {
  if(orderList.length===0){showToast('Sem encomendas para imprimir','warning');return;}
  var w=window.open('','_blank');
  var cards=orderList.map(function(o){
    var sc=STATUS[o.status]||STATUS.new;
    return '<div class="print-card"><div class="print-card-header"><span class="print-order-id">'+(o.orderId||o.id)+'</span>'+(o.customerId?'<span class="print-cust-id">'+o.customerId+'</span>':'')+'<span class="print-status" style="background:'+sc.bg+';color:'+sc.color+'">'+sc.label+'</span></div>'
      +'<div class="print-customer">'+o.customerName+'</div>'+(o.phone?'<div class="print-row">📞 '+o.phone+'</div>':'')
      +'<div class="print-divider"></div>'
      +'<div class="print-row">🎂 '+getCTName(o.cakeType)+'</div>'
      +'<div class="print-row">🍓 '+getFlavorDesc(o)+'</div>'
      +(o.cakeMessage?'<div class="print-row">💬 "'+o.cakeMessage+'"</div>':'')
      +'<div class="print-row">⚖️ '+getWeightDesc(o)+'</div>'
      +'<div class="print-row">💰 '+getPriceDesc(o)+'</div>'
      +'<div class="print-divider"></div>'
      +'<div class="print-row">📅 '+fmtDate(o.orderDate)+' às '+(o.orderTime||'—')+'</div>'
      +'<div class="print-row">'+(o.deliveryType==='pickup'?'🏪 Recolha':'🚚 Entrega')+(o.address?' — '+o.address:'')+'</div>'
      +'<div class="print-row">💳 '+(o.paymentMethod||'—')+'</div>'
      +(o.chefNotes?'<div class="print-row chef">👨‍🍳 '+o.chefNotes+'</div>':'')
      +(o.finalPrice?'<div class="print-total">Total: €'+o.finalPrice+'</div>':'')
    +'</div>';
  }).join('');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+'</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",sans-serif;background:#f5f5f5;padding:16px;color:#1a1a1a}.print-header{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #C9A96E}.print-header h1{font-size:1.3rem;color:#A07840;font-family:Georgia,serif}.print-header p{font-size:0.78rem;color:#888;margin-top:4px}.cards-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.print-card{background:white;border:1.5px solid #e8d9c0;border-radius:10px;padding:12px;page-break-inside:avoid;break-inside:avoid}.print-card-header{display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap}.print-order-id{font-weight:700;color:#A07840;font-size:0.85rem}.print-cust-id{font-size:0.72rem;color:#888;background:#FBF7EF;padding:2px 6px;border-radius:10px}.print-status{font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:auto}.print-customer{font-weight:700;font-size:0.95rem;margin-bottom:6px}.print-divider{border-top:1px dashed #e8d9c0;margin:6px 0}.print-row{font-size:0.78rem;margin-bottom:3px;color:#333}.chef{background:#FBF7EF;border-radius:4px;padding:3px 6px;margin-top:4px}.print-total{margin-top:8px;background:#FBF7EF;border:1.5px solid #C9A96E;border-radius:6px;padding:6px;text-align:center;font-weight:700;color:#A07840}.print-footer{text-align:center;margin-top:16px;padding-top:10px;border-top:1px solid #e8d9c0;font-size:0.72rem;color:#888}@media print{body{background:white;padding:8px}.cards-grid{gap:8px}}</style></head><body>'
    +'<div class="print-header"><h1>🎂 Bismi Treats</h1><p>'+title+' · '+orderList.length+' encomenda'+(orderList.length!==1?'s':'')+'</p><p>'+new Date().toLocaleString('pt-PT')+'</p></div>'
    +'<div class="cards-grid">'+cards+'</div>'
    +'<div class="print-footer">❤️ Bismi Treats · bismitreats.com · 934 453 710 · bismitreats.pt@gmail.com</div>'
    +'</body></html>');
  w.document.close();
  setTimeout(function(){w.print();},500);
}

// ── PHOTO MANAGER ─────────────────────────────────────────────
function openPhotoMgr(orderId) {
  var order=orders.find(function(o){return o.id===orderId;});
  if(!order)return;
  _photoOrderId=orderId;
  var container=document.getElementById('photoManagerContent');
  if(!container)return;
  var photos=order.photos||[];
  if(photos.length===0){container.innerHTML='<div class="empty-state"><i class="fas fa-camera"></i><p>Sem fotos</p></div>';}
  else{container.innerHTML='<div class="photo-grid">'+photos.map(function(p,i){return '<div class="photo-item"><img src="'+fixUrl(p)+'" onclick="viewPhoto(\''+fixUrl(p)+'\')" style="width:100%;height:120px;object-fit:cover;border-radius:8px;cursor:pointer"/><button onclick="deletePhoto('+i+')" class="btn-delete-photo"><i class="fas fa-times"></i></button></div>';}).join('')+'</div>';}
  openModal('photoManagerModal');
}

function viewPhoto(url) {
  var img=document.getElementById('photoViewImg');
  if(img)img.src=url;
  openModal('photoViewModal');
}

function deletePhoto(idx) {
  var order=orders.find(function(o){return o.id===_photoOrderId;});
  if(!order)return;
  order.photos=order.photos||[];
  order.photos.splice(idx,1);
  saveOrder(order,function(){openPhotoMgr(order.id);renderOrdersList();showToast('Foto eliminada','warning');});
}

function uploadOrderPhoto(input) {
  if(!input.files||!input.files[0])return;
  var order=orders.find(function(o){return o.id===_photoOrderId;});
  if(!order)return;
  var formData=new FormData();
  formData.append('photo',input.files[0]);
  showToast('A carregar foto...','info');
  fetch('/api/upload-photo',{method:'POST',body:formData})
    .then(function(r){return r.json();})
    .then(function(res){
      if(res.ok&&res.url){order.photos=order.photos||[];order.photos.push(res.url);saveOrder(order,function(){openPhotoMgr(order.id);renderOrdersList();showToast('✅ Foto carregada!','success');});}
      else showToast('❌ Erro ao carregar foto','error');
    })
    .catch(function(){showToast('❌ Erro ao carregar foto','error');});
  input.value='';
}

// ── CUSTOMER HISTORY ──────────────────────────────────────────
function showCustHistory(name,customerId) {
  var history=orders.filter(function(o){return o.customerName===name||(customerId&&o.customerId===customerId);}).sort(function(a,b){return (b.orderDate||'').localeCompare(a.orderDate||'');});
  var container=document.getElementById('customerHistoryContent');
  if(!container)return;
  var title=document.getElementById('customerHistoryTitle');
  if(title)title.textContent=name+(customerId?' ('+customerId+')':'');
  if(history.length===0){container.innerHTML='<div class="empty-state"><i class="fas fa-history"></i><p>Sem histórico</p></div>';return;}
  container.innerHTML=history.map(function(o){
    var sc=STATUS[o.status]||STATUS.new;
    return '<div class="history-item"><div class="history-header"><span class="history-id">'+(o.orderId||o.id)+'</span><span class="history-date">'+fmtDate(o.orderDate)+'</span><span class="status-badge" style="background:'+sc.bg+';color:'+sc.color+'">'+sc.label+'</span></div><div class="history-detail">'+getCTName(o.cakeType)+' · '+getFlavorDesc(o)+'</div><div class="history-price">'+getPriceDesc(o)+'</div></div>';
  }).join('');
  openModal('customerHistoryModal');
}

// ── CUSTOMER REQUESTS ─────────────────────────────────────────
function updateReqBadge() {
  var pending=customerRequests.filter(function(r){return r.status!=='deleted'&&r.status!=='inserted';}).length;
  var badge=document.getElementById('requestBadge');
  if(badge){badge.textContent=pending;badge.style.display=pending>0?'inline-flex':'none';}
}

function openCustomerRequests() {
  loadRequests(function(){displayRequests('all');openModal('customerRequestsModal');});
}

function displayRequests(filter) {
  var list=customerRequests.filter(function(r){return r.status!=='deleted';});
  if(filter==='sent')list=list.filter(function(r){return r.status==='sent';});
  else if(filter==='copied')list=list.filter(function(r){return r.status==='copied';});
  var container=document.getElementById('customerRequestsList');
  if(!container)return;
  if(list.length===0){container.innerHTML='<div class="empty-state"><i class="fas fa-inbox"></i><p>Sem pedidos</p></div>';return;}
  container.innerHTML=list.map(function(r){
    var dt=new Date(r.submittedAt||r.id);
    var timeStr=dt.toLocaleDateString('pt-PT')+' '+dt.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'});
    var statusLabel=r.status==='sent'?'<span class="req-status sent">✅ Enviado</span>':r.status==='copied'?'<span class="req-status copied">📋 Copiado</span>':'<span class="req-status pending">⏳ Pendente</span>';
    return '<div class="req-card"><div class="req-header"><strong>'+(r.customerName||'—')+'</strong><div>'+statusLabel+'<span class="req-time">'+timeStr+'</span></div></div>'
      +'<div class="req-details"><span>🎂 '+getCTName(r.cakeType)+' — '+(r.baseFlavor?getFLabel(r.baseFlavor):'—')+'</span><span>⚖️ '+(r.minWeight||'—')+'–'+(r.maxWeight||'—')+' kg | 📅 '+fmtDate(r.orderDate)+' '+(r.orderTime||'')+'</span>'+(r.phone?'<span>📞 '+r.phone+'</span>':'')+(r.paymentMethod?'<span>💳 '+r.paymentMethod+'</span>':'')+(r.cakeMessage?'<span>💬 "'+r.cakeMessage+'"</span>':'')+'</div>'
      +'<div class="req-actions"><button class="btn-sm btn-view" onclick="insertRequest('+r.id+')"><i class="fas fa-plus"></i> Inserir</button><button class="btn-sm btn-delete-req" onclick="deleteRequest('+r.id+')"><i class="fas fa-trash"></i></button></div></div>';
  }).join('');
}

function insertRequest(reqId) {
  var req=customerRequests.find(function(r){return r.id===reqId;});
  if(!req)return;
  var fields={customerName:req.customerName,phone:req.phone,nif:req.nif,cakeMessage:req.cakeMessage,chefNotes:req.chefNotes,address:req.address,orderDate:req.orderDate,orderTime:req.orderTime};
  Object.keys(fields).forEach(function(id){var el=document.getElementById(id);if(el&&fields[id])el.value=fields[id];});
  var ctSel=document.getElementById('cakeType');if(ctSel&&req.cakeType){ctSel.value=req.cakeType;ctSel.dispatchEvent(new Event('change'));}
  var bfSel=document.getElementById('baseFlavor');if(bfSel&&req.baseFlavor){bfSel.value=req.baseFlavor;bfSel.dispatchEvent(new Event('change'));}
  var efSel=document.getElementById('extraFilling');if(efSel&&req.extraFilling)efSel.value=req.extraFilling;
  var minSel=document.getElementById('minWeight');if(minSel&&req.minWeight){minSel.value=req.minWeight;minSel.dispatchEvent(new Event('change'));}
  if(req.deliveryType){var r=document.querySelector('input[name="deliveryType"][value="'+req.deliveryType+'"]');if(r){r.checked=true;r.dispatchEvent(new Event('change'));}}
  if(req.deliveryOption){var ro=document.querySelector('input[name="deliveryOption"][value="'+req.deliveryOption+'"]');if(ro){ro.checked=true;ro.dispatchEvent(new Event('change'));}}
  var pmSel=document.getElementById('paymentMethod');if(pmSel&&req.paymentMethod)pmSel.value=req.paymentMethod;
  req.status='inserted';
  fetch('/api/customer-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(req)}).catch(function(){});
  closeModal('customerRequestsModal');
  updatePriceEst();
  showToast('✅ Pedido inserido no formulário','success');
}

function deleteRequest(reqId) {
  if(!confirm('Eliminar este pedido?'))return;
  customerRequests=customerRequests.filter(function(r){return r.id!==reqId;});
  fetch('/api/customer-requests/'+reqId,{method:'DELETE'}).catch(function(){});
  displayRequests('all');
  updateReqBadge();
}

// ── SETTINGS ──────────────────────────────────────────────────
function initSettingsMenu() {
  var btn=document.getElementById('settingsBtn');
  var menu=document.getElementById('settingsMenu');
  if(!btn||!menu)return;
  btn.addEventListener('click',function(e){e.stopPropagation();menu.classList.toggle('open');});
  document.addEventListener('click',function(){menu.classList.remove('open');});
  menu.addEventListener('click',function(e){e.stopPropagation();});
  var items={
    'exportDataSettings':exportData,
    'importDataSettings':function(){document.getElementById('importFileInput').click();},
    'backupSettings':createBackup,
    'recycleBinSettings':openRecycleBin,
    'manageCakeTypesSettings':openManageCakeTypes,
    'manageFlavoursSettings':openManageFlavours,
    'websiteAdminSettings':function(){window.open('website-admin.html','_blank');},
    'profilesSettings':openProfilesSettings,
    'activityLogSettings':function(){showToast('Registo de atividade em desenvolvimento','info');}
  };
  Object.keys(items).forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.addEventListener('click',function(){menu.classList.remove('open');items[id]();});
  });
}

function exportData() {
  var data={orders:orders,customerRequests:customerRequests,exportedAt:new Date().toISOString()};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='bismi-backup-'+todayStr()+'.json';a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Dados exportados','success');
}

function importData(input) {
  if(!input.files||!input.files[0])return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{var data=JSON.parse(e.target.result);if(data.orders){orders=data.orders;fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(orders)}).catch(function(){});renderOrdersList();renderDashboard();showToast('✅ '+orders.length+' encomendas importadas','success');}}
    catch(err){showToast('❌ Erro ao importar ficheiro','error');}
  };
  reader.readAsText(input.files[0]);
  input.value='';
}

function createBackup() {
  fetch('/api/backup',{method:'POST'}).then(function(r){return r.json();}).then(function(res){showToast(res.ok?'✅ Backup criado':'❌ Erro ao criar backup',res.ok?'success':'error');}).catch(function(){showToast('❌ Erro ao criar backup','error');});
}

function openRecycleBin() {
  var container=document.getElementById('recycleBinContent');
  if(!container)return;
  if(recycleBin.length===0){container.innerHTML='<div class="empty-state"><i class="fas fa-trash-restore"></i><p>Reciclagem vazia</p></div>';}
  else{container.innerHTML=recycleBin.map(function(o){return '<div class="recycle-item"><div><strong>'+(o.orderId||o.id)+'</strong> — '+o.customerName+'</div><div style="font-size:0.78rem;color:#888">'+fmtDate(o.orderDate)+' · '+getCTName(o.cakeType)+'</div><div style="font-size:0.72rem;color:#aaa">Eliminado: '+fmtDT(o.deletedAt)+'</div><button onclick="restoreOrder('+o.id+')" class="btn-restore"><i class="fas fa-undo"></i> Restaurar</button></div>';}).join('');}
  openModal('recycleBinModal');
}

function restoreOrder(orderId) {
  var order=recycleBin.find(function(o){return o.id===orderId;});
  if(!order)return;
  delete order.deletedAt;if(order.status==='deleted')order.status='new';
  recycleBin=recycleBin.filter(function(o){return o.id!==orderId;});
  try{localStorage.setItem('bismiRecycleBin',JSON.stringify(recycleBin));}catch(e){}
  saveOrder(order,function(){openRecycleBin();renderOrdersList();showToast('✅ Encomenda restaurada','success');});
}

// ── MANAGE CAKE TYPES & FLAVOURS ──────────────────────────────
function openManageCakeTypes() {
  renderCakeTypesMgmt();openModal('manageCakeTypesModal');
}

function renderCakeTypesMgmt() {
  var container=document.getElementById('cakeTypesMgmtList');
  if(!container)return;
  container.innerHTML=CAKE_TYPES.map(function(ct,i){
    return '<div class="manage-item"><div class="manage-item-info"><span class="manage-item-name">'+ct.name+'</span><span class="manage-item-price">€'+ct.price+'/kg</span></div><button onclick="removeCakeType('+i+')" class="btn-remove-item"><i class="fas fa-times"></i></button></div>';
  }).join('');
}

function removeCakeType(idx) {
  if(!confirm('Remover este tipo de bolo?'))return;
  CAKE_TYPES.splice(idx,1);
  renderCakeTypesMgmt();
  populateCakeTypes();
  showToast('Tipo de bolo removido','warning');
}

function addCakeType() {
  var nameEl=document.getElementById('newCakeTypeName');
  var priceEl=document.getElementById('newCakeTypePrice');
  var name=(nameEl||{}).value.trim();
  var price=parseFloat((priceEl||{}).value||0);
  if(!name){showToast('Por favor insira o nome','error');return;}
  if(!price){showToast('Por favor insira o preço','error');return;}
  var id=name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  CAKE_TYPES.push({id:id,name:name,price:price});
  if(nameEl)nameEl.value='';if(priceEl)priceEl.value='';
  renderCakeTypesMgmt();populateCakeTypes();
  showToast('✅ Tipo de bolo adicionado','success');
}

function openManageFlavours() {
  renderFlavoursMgmt();openModal('manageFlavoursModal');
}

function renderFlavoursMgmt() {
  var container=document.getElementById('flavoursMgmtList');
  if(!container)return;
  container.innerHTML=FLAVOURS.map(function(f,i){
    return '<div class="manage-item"><div class="manage-item-info"><span class="manage-item-name">'+f.l+'</span><span class="manage-item-price" style="color:var(--text3)">'+f.v+'</span></div><button onclick="removeFlavour('+i+')" class="btn-remove-item"><i class="fas fa-times"></i></button></div>';
  }).join('');
}

function removeFlavour(idx) {
  if(!confirm('Remover este sabor?'))return;
  FLAVOURS.splice(idx,1);
  renderFlavoursMgmt();populateFlavours();
  showToast('Sabor removido','warning');
}

function addFlavour() {
  var nameEl=document.getElementById('newFlavourName');
  var name=(nameEl||{}).value.trim();
  if(!name){showToast('Por favor insira o nome','error');return;}
  var value=name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  FLAVOURS.push({v:value,l:name});
  if(nameEl)nameEl.value='';
  renderFlavoursMgmt();populateFlavours();
  showToast('✅ Sabor adicionado','success');
}

// ── PROFILE MANAGEMENT ────────────────────────────────────────
function openProfilesSettings() {
  renderProfilesList();renderLoginHistory();openModal('profilesModal');
}

function switchProfileTab(btn,contentId) {
  ['profilesTabContent','addProfileTabContent','historyTabContent','changepinTabContent'].forEach(function(t){var el=document.getElementById(t);if(el)el.style.display='none';});
  var active=document.getElementById(contentId);if(active)active.style.display='block';
  document.querySelectorAll('.ptab').forEach(function(b){b.classList.remove('active-ptab');});
  if(btn)btn.classList.add('active-ptab');
  if(contentId==='historyTabContent')renderLoginHistory();
  if(contentId==='profilesTabContent')renderProfilesList();
}

function renderProfilesList() {
  var container=document.getElementById('profilesList');
  if(!container)return;
  var profiles=AUTH.getProfiles();
  var colors={admin:'#b5845a',counter:'#2563eb',kitchen:'#16a34a',delivery:'#d97706'};
  var html='';
  profiles.forEach(function(p){
    var sc=colors[p.role]||'#888';
    var dots='';for(var i=0;i<p.pin.length;i++)dots+='\u2022';
    html+='<div class="profile-item"><div class="profile-item-left"><div class="profile-role-badge" style="background:'+sc+'20;color:'+sc+';border:1px solid '+sc+'40">'+p.role+'</div><div><div class="profile-name">'+p.name+'</div><div class="profile-pin">PIN: '+dots+'</div></div></div>'
      +'<div class="profile-item-right"><button onclick="editProfile(\''+p.id+'\')" class="btn-profile-edit"><i class="fas fa-edit"></i></button>'+(p.id!=='admin-1'?'<button onclick="deleteProfile(\''+p.id+'\')" class="btn-profile-delete"><i class="fas fa-trash"></i></button>':'')+'</div></div>';
  });
  container.innerHTML=html;
}

function editProfile(profileId) {
  var profiles=AUTH.getProfiles();
  var p=profiles.find(function(x){return x.id===profileId;});
  if(!p)return;
  var newName=prompt('Name for this profile:',p.name);
  if(newName===null)return;
  if(newName.trim())p.name=newName.trim();
  var newPin=prompt('New PIN (leave blank to keep current):');
  if(newPin===null)return;
  if(newPin.trim()){if(newPin.trim().length<4){showToast('PIN must be at least 4 digits','error');return;}p.pin=newPin.trim();}
  AUTH.saveProfiles(profiles);
  renderProfilesList();
  showToast('✅ Profile updated','success');
}

function deleteProfile(profileId) {
  if(!confirm('Delete this profile?'))return;
  var profiles=AUTH.getProfiles().filter(function(p){return p.id!==profileId;});
  AUTH.saveProfiles(profiles);
  renderProfilesList();
  showToast('Profile deleted','warning');
}

function addNewProfile() {
  var roleEl=document.getElementById('newProfileRole');
  var nameEl=document.getElementById('newProfileName');
  var pinEl=document.getElementById('newProfilePin');
  var role=roleEl?roleEl.value:'counter';
  var name=nameEl?nameEl.value.trim():'';
  var pin=pinEl?pinEl.value.trim():'';
  if(!name){showToast('Please enter a name','error');return;}
  if(!pin||pin.length<4){showToast('PIN must be at least 4 digits','error');return;}
  var profiles=AUTH.getProfiles();
  profiles.push({id:role+'-'+Date.now(),name:name,role:role,pin:pin,active:true,createdAt:new Date().toISOString()});
  AUTH.saveProfiles(profiles);
  if(nameEl)nameEl.value='';if(pinEl)pinEl.value='';
  renderProfilesList();
  showToast('✅ Profile "'+name+'" added','success');
}

function changeStaffPin() {
  var roleEl=document.getElementById('changePinRole');
  var pinEl=document.getElementById('newPinInput');
  var msgEl=document.getElementById('pinChangeMsg');
  var role=roleEl?roleEl.value:'';
  var newPin=pinEl?pinEl.value.trim():'';
  if(!newPin||newPin.length<4){if(msgEl){msgEl.textContent='\u274c PIN must be at least 4 digits';msgEl.style.color='#dc2626';msgEl.style.display='block';}return;}
  var profiles=AUTH.getProfiles();
  var profile=profiles.find(function(p){return p.role===role&&p.active;});
  if(!profile){if(msgEl){msgEl.textContent='\u274c Profile not found';msgEl.style.color='#dc2626';msgEl.style.display='block';}return;}
  profile.pin=newPin;
  AUTH.saveProfiles(profiles);
  if(msgEl){msgEl.textContent='\u2705 PIN updated for '+role+'!';msgEl.style.color='#16a34a';msgEl.style.display='block';}
  if(pinEl)pinEl.value='';
  setTimeout(function(){if(msgEl)msgEl.style.display='none';},3000);
  showToast('\u2705 PIN updated for '+role,'success');
}

function renderLoginHistory() {
  var container=document.getElementById('loginHistoryList');
  if(!container)return;
  var history=AUTH.getLoginHistory?AUTH.getLoginHistory():[];
  if(!history||history.length===0){container.innerHTML='<div style="text-align:center;padding:20px;color:#999;font-size:0.82rem">No login history yet</div>';return;}
  var recent=history.slice().reverse().slice(0,50);
  var colors={admin:'#b5845a',counter:'#2563eb',kitchen:'#16a34a',delivery:'#d97706'};
  var html='';
  recent.forEach(function(h){
    var loginTime=h.loginAt?new Date(h.loginAt).toLocaleString('pt-PT'):'\u2014';
    var logoutTime=h.logoutAt?new Date(h.logoutAt).toLocaleString('pt-PT'):'Still active';
    var duration='';
    if(h.loginAt&&h.logoutAt){var mins=Math.round((new Date(h.logoutAt)-new Date(h.loginAt))/60000);duration=mins<60?mins+'m':Math.floor(mins/60)+'h '+(mins%60)+'m';}
    var sc=colors[h.role]||'#888';
    html+='<div class="history-entry"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="font-weight:600;font-size:0.85rem;color:#1a1a1a">'+(h.profileName||h.role)+'</span><span style="font-size:0.7rem;font-weight:600;padding:2px 7px;border-radius:10px;background:'+sc+'20;color:'+sc+'">'+h.role+'</span>'+(duration?'<span style="font-size:0.7rem;color:#999;margin-left:auto">'+duration+'</span>':'')+'</div><div style="font-size:0.75rem;color:#555">Login: '+loginTime+'</div><div style="font-size:0.75rem;color:#999">Logout: '+logoutTime+'</div></div>';
  });
  container.innerHTML=html;
}

// ── ALL ORDERS ────────────────────────────────────────────────
function openAllOrders() {
  var container=document.getElementById('allOrdersContent');
  if(!container)return;
  var list=orders.slice().sort(function(a,b){return (b.orderDate||'').localeCompare(a.orderDate||'');});
  container.innerHTML=list.length===0?'<div class="empty-state"><i class="fas fa-box-open"></i><p>Sem encomendas</p></div>':list.map(function(o){return renderOrderCard(o);}).join('');
  openModal('allOrdersModal');
}

// ── TOPBAR ────────────────────────────────────────────────────
function initTopbarButtons() {
  var sairBtn=document.getElementById('sairBtn');
  if(sairBtn)sairBtn.addEventListener('click',function(){if(confirm('Terminar sessão?')){fetch('/api/admin-logout',{method:'POST'}).finally(function(){AUTH.logout();window.location.href='login.html';});}});
  var reqBtn=document.getElementById('customerRequestsBtn');
  if(reqBtn)reqBtn.addEventListener('click',openCustomerRequests);
  var pendBtn=document.getElementById('pendingOrdersBtn');
  if(pendBtn)pendBtn.addEventListener('click',function(){_statusFilter='new';renderOrdersList();});
  var calBtn=document.getElementById('calendarBtn');
  if(calBtn)calBtn.addEventListener('click',openBusinessCalendar);
  var allBtn=document.getElementById('viewAllBtn');
  if(allBtn)allBtn.addEventListener('click',openAllOrders);
}

// ── SEARCH & FILTER ───────────────────────────────────────────
function initSearchAndFilter() {
  var searchEl=document.getElementById('searchOrders');
  if(searchEl)searchEl.addEventListener('input',function(){_search=searchEl.value.trim();renderOrdersList();});
  var statusEl=document.getElementById('statusFilter');
  if(statusEl){
    statusEl.innerHTML='<option value="active">Em curso</option><option value="all">Todas</option>'+Object.keys(STATUS).map(function(s){return '<option value="'+s+'">'+STATUS[s].label+'</option>';}).join('');
    statusEl.addEventListener('change',function(){_statusFilter=statusEl.value;renderOrdersList();});
  }
  var yearEl=document.getElementById('yearFilter');
  if(yearEl){
    var cy=new Date().getFullYear();
    yearEl.innerHTML='<option value="">Todos os anos</option>';
    for(var y=cy+1;y>=cy-3;y--)yearEl.innerHTML+='<option value="'+y+'"'+(y===cy?' selected':'')+'>'+y+'</option>';
    yearEl.addEventListener('change',function(){_yearFilter=yearEl.value;renderOrdersList();});
  }
}

// ── MODAL CLOSE BUTTONS ───────────────────────────────────────
function initModalCloseButtons() {
  var pairs=[['closeReceiptModal','receiptModal'],['closeWhatsappModal','whatsappModal'],['closeEditModal','editOrderModal'],['closePhotoModal','photoManagerModal'],['closePhotoViewModal','photoViewModal'],['closeFinalWeightModal','finalWeightModal'],['closeHistoryModal','customerHistoryModal'],['closeRequestsModal','customerRequestsModal'],['closeBizCalModal','businessCalModal'],['closeAllOrdersModal','allOrdersModal'],['closeRecycleBinModal','recycleBinModal'],['closeProfilesModal','profilesModal'],['closeCalChoiceModal','calendarChoiceModal'],['closeManageCakeTypesModal','manageCakeTypesModal'],['closeManageFlavoursModal','manageFlavoursModal']];
  pairs.forEach(function(pair){var btn=document.getElementById(pair[0]);if(btn)btn.addEventListener('click',function(){closeModal(pair[1]);});});
  document.querySelectorAll('.modal-overlay').forEach(function(overlay){overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.classList.remove('active');});});
  // Receipt tabs
  var rcConf=document.getElementById('receiptTypeConfirmation');var rcFinal=document.getElementById('receiptTypeComplete');
  if(rcConf)rcConf.addEventListener('click',function(){_receiptType='confirmation';rcConf.classList.add('active');if(rcFinal)rcFinal.classList.remove('active');renderReceipt();});
  if(rcFinal)rcFinal.addEventListener('click',function(){_receiptType='final';rcFinal.classList.add('active');if(rcConf)rcConf.classList.remove('active');renderReceipt();});
  var rcClassic=document.getElementById('receiptStyleClassic');var rcModern=document.getElementById('receiptStyleModern');
  if(rcClassic)rcClassic.addEventListener('click',function(){_receiptStyle='classic';rcClassic.classList.add('active');if(rcModern)rcModern.classList.remove('active');renderReceipt();});
  if(rcModern)rcModern.addEventListener('click',function(){_receiptStyle='modern';rcModern.classList.add('active');if(rcClassic)rcClassic.classList.remove('active');renderReceipt();});
  var printA4=document.getElementById('printA4Btn');var printA5=document.getElementById('printA5Btn');
  if(printA4)printA4.addEventListener('click',function(){printReceipt('a4');});
  if(printA5)printA5.addEventListener('click',function(){printReceipt('a5');});
  // WhatsApp tabs
  var waConf=document.getElementById('waTypeConfirmation');var waFinal=document.getElementById('waTypeFinal');
  if(waConf)waConf.addEventListener('click',function(){_waType='confirmation';waConf.classList.add('active');if(waFinal)waFinal.classList.remove('active');renderWAMessage();});
  if(waFinal)waFinal.addEventListener('click',function(){_waType='final';waFinal.classList.add('active');if(waConf)waConf.classList.remove('active');renderWAMessage();});
  var copyWa=document.getElementById('copyWaBtn');if(copyWa)copyWa.addEventListener('click',copyWAMessage);
  var sendWa=document.getElementById('sendWaBtn');if(sendWa)sendWa.addEventListener('click',sendWA);
  // Final weight
  var fwSel=document.getElementById('finalWeightSelect');if(fwSel)fwSel.addEventListener('change',updateFinalPrice);
  var fwManual=document.getElementById('finalWeightManual');if(fwManual)fwManual.addEventListener('input',updateFinalPrice);
  var fwPrice=document.getElementById('finalPricePerKg');if(fwPrice)fwPrice.addEventListener('input',updateFinalPrice);
  var confirmFwBtn=document.getElementById('confirmFinalWeightBtn');if(confirmFwBtn)confirmFwBtn.addEventListener('click',confirmFinalWeight);
  document.querySelectorAll('.discount-btn').forEach(function(btn){btn.addEventListener('click',function(){setDiscount(parseInt(btn.dataset.pct));});});
  // Edit order
  var saveEditBtn=document.getElementById('saveEditOrderBtn');if(saveEditBtn)saveEditBtn.addEventListener('click',saveEditOrder);
  // Customer requests tabs
  document.querySelectorAll('.req-tab').forEach(function(tab){tab.addEventListener('click',function(){document.querySelectorAll('.req-tab').forEach(function(t){t.classList.remove('active');});tab.classList.add('active');displayRequests(tab.dataset.filter||'all');});});
  // Calendar choice
  var gcalBtn=document.getElementById('addGoogleCalBtn');if(gcalBtn)gcalBtn.addEventListener('click',function(){openGoogleCal(_calOrderId);});
  var ocalBtn=document.getElementById('addOutlookCalBtn');if(ocalBtn)ocalBtn.addEventListener('click',function(){openOutlookCal(_calOrderId);});
  // Photo upload
  var photoUploadInput=document.getElementById('photoUploadInput');if(photoUploadInput)photoUploadInput.addEventListener('change',function(){uploadOrderPhoto(this);});
}

// ── PANEL CONTROLS ────────────────────────────────────────────
function initPanelControls() {
  document.querySelectorAll('.panel-toggle').forEach(function(btn){
    btn.addEventListener('click',function(){
      var panel=btn.closest('.panel');if(!panel)return;
      panel.classList.toggle('minimized');
      btn.innerHTML=panel.classList.contains('minimized')?'<i class="fas fa-chevron-down"></i>':'<i class="fas fa-chevron-up"></i>';
    });
  });
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  // Only run admin-specific init if admin elements exist
  var isAdminPage = !!document.getElementById('orderForm');
  if(isAdminPage){
    loadData(function(){renderDashboard();renderOrdersList();initCustomerId();});
    initOrderForm();
    initSettingsMenu();
    initTopbarButtons();
    initSearchAndFilter();
    initModalCloseButtons();
    initPanelControls();
    loadRequests();
    try{recycleBin=JSON.parse(localStorage.getItem('bismiRecycleBin')||'[]');}catch(e){recycleBin=[];}
    setInterval(function(){loadData();loadRequests();},30000);
  }
  // Always init real-time sync (for all staff pages)
  initRealTime();
});

// ── MONTHLY SALES REPORT ─────────────────────────────────────
function openMonthlySalesReport(){
  // Close settings menu
  var sm = document.getElementById('settingsMenu');
  if(sm) sm.style.display = 'none';
  
  // Populate year selector
  var yearSel = document.getElementById('salesYear');
  if(yearSel){
    yearSel.innerHTML = '';
    var years = new Set();
    (orders||[]).forEach(function(o){
      if(o.orderDate) years.add(o.orderDate.substring(0,4));
    });
    var currentYear = new Date().getFullYear().toString();
    years.add(currentYear);
    Array.from(years).sort().reverse().forEach(function(y){
      var opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if(y === currentYear) opt.selected = true;
      yearSel.appendChild(opt);
    });
  }
  
  var modal = document.getElementById('monthlySalesModal');
  if(modal){ modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  generateSalesReport();
}

function generateSalesReport(){
  var year = document.getElementById('salesYear').value;
  var month = document.getElementById('salesMonth').value;
  var content = document.getElementById('salesReportContent');
  if(!content) return;
  
  // Filter orders
  var filtered = (orders||[]).filter(function(o){
    if(!o.orderDate) return false;
    if(o.status === 'cancelled') return false;
    var d = new Date(o.orderDate + 'T00:00:00');
    if(d.getFullYear().toString() !== year) return false;
    if(month !== 'all' && d.getMonth().toString() !== month) return false;
    return true;
  });
  
  // Sort by date
  filtered.sort(function(a,b){ return (a.orderDate+a.orderTime||'').localeCompare(b.orderDate+b.orderTime||''); });
  
  // Calculate totals
  var totalRevenue = 0;
  var totalOrders = filtered.length;
  var delivered = filtered.filter(function(o){ return o.status === 'delivered'; }).length;
  var pending = filtered.filter(function(o){ return o.status !== 'delivered' && o.status !== 'cancelled'; }).length;
  
  filtered.forEach(function(o){
    var price = parseFloat(o.finalPrice || o.minPrice || 0);
    totalRevenue += price;
  });
  
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var monthName = month === 'all' ? year : months[parseInt(month)] + ' ' + year;
  
  // Build HTML
  var html = '<div style="margin-bottom:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';
  html += '<div style="background:linear-gradient(135deg,rgba(201,169,110,.12),rgba(255,255,255,.8));border:1px solid rgba(201,169,110,.2);border-radius:10px;padding:12px;text-align:center">';
  html += '<div style="font-size:1.4rem;font-weight:800;color:#A07840">'+totalOrders+'</div>';
  html += '<div style="font-size:.7rem;color:#6a6a8a;margin-top:2px">Total Orders</div></div>';
  html += '<div style="background:linear-gradient(135deg,rgba(22,163,74,.08),rgba(255,255,255,.8));border:1px solid rgba(22,163,74,.2);border-radius:10px;padding:12px;text-align:center">';
  html += '<div style="font-size:1.4rem;font-weight:800;color:#16a34a">€'+totalRevenue.toFixed(2)+'</div>';
  html += '<div style="font-size:.7rem;color:#6a6a8a;margin-top:2px">Total Revenue</div></div>';
  html += '<div style="background:linear-gradient(135deg,rgba(37,99,235,.08),rgba(255,255,255,.8));border:1px solid rgba(37,99,235,.2);border-radius:10px;padding:12px;text-align:center">';
  html += '<div style="font-size:1.4rem;font-weight:800;color:#2563eb">'+delivered+'</div>';
  html += '<div style="font-size:.7rem;color:#6a6a8a;margin-top:2px">Delivered</div></div>';
  html += '</div>';
  
  if(filtered.length === 0){
    html += '<div style="text-align:center;padding:30px;color:#9a9ab0;font-size:.84rem">No orders found for this period.</div>';
  } else {
    html += '<div style="font-size:.72rem;font-weight:700;color:#9a9ab0;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">'+filtered.length+' Orders — '+monthName+'</div>';
    html += '<div style="border:1px solid rgba(0,0,0,.08);border-radius:10px;overflow:hidden">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:.76rem">';
    html += '<thead><tr style="background:rgba(0,0,0,.04)">';
    html += '<th style="padding:8px 10px;text-align:left;font-weight:600;color:#4a4a6a">Order</th>';
    html += '<th style="padding:8px 10px;text-align:left;font-weight:600;color:#4a4a6a">Customer</th>';
    html += '<th style="padding:8px 10px;text-align:left;font-weight:600;color:#4a4a6a">Date</th>';
    html += '<th style="padding:8px 10px;text-align:left;font-weight:600;color:#4a4a6a">Cake</th>';
    html += '<th style="padding:8px 10px;text-align:right;font-weight:600;color:#4a4a6a">Price</th>';
    html += '<th style="padding:8px 10px;text-align:center;font-weight:600;color:#4a4a6a">Status</th>';
    html += '</tr></thead><tbody>';
    
    var statusColors = {new:'#2563eb',confirmed:'#16a34a',ready:'#d97706',delivered:'#6a6a8a',cancelled:'#dc2626'};
    
    filtered.forEach(function(o, i){
      var d = o.orderDate ? new Date(o.orderDate+'T00:00:00').toLocaleDateString('en-GB') : '—';
      var price = parseFloat(o.finalPrice || o.minPrice || 0);
      var cakeName = o.cakeType || '—';
      var sc = statusColors[o.status] || '#6a6a8a';
      var bg = i % 2 === 0 ? 'white' : 'rgba(0,0,0,.02)';
      html += '<tr style="background:'+bg+';border-top:1px solid rgba(0,0,0,.05)">';
      html += '<td style="padding:8px 10px;color:#1a1a2e;font-weight:600">'+(o.id||'—')+'</td>';
      html += '<td style="padding:8px 10px;color:#1a1a2e">'+(o.customerName||'—')+'</td>';
      html += '<td style="padding:8px 10px;color:#4a4a6a">'+d+'</td>';
      html += '<td style="padding:8px 10px;color:#4a4a6a">'+cakeName+'</td>';
      html += '<td style="padding:8px 10px;text-align:right;color:#1a1a2e;font-weight:600">'+(price>0?'€'+price.toFixed(2):'—')+'</td>';
      html += '<td style="padding:8px 10px;text-align:center"><span style="background:'+sc+'18;color:'+sc+';border:1px solid '+sc+'30;border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:600">'+(o.status||'—')+'</span></td>';
      html += '</tr>';
    });
    
    html += '</tbody></table></div>';
  }
  
  content.innerHTML = html;
  window._salesReportData = {filtered: filtered, monthName: monthName, totalOrders: totalOrders, totalRevenue: totalRevenue, delivered: delivered};
}

function printSalesReport(){
  var data = window._salesReportData;
  if(!data){ generateSalesReport(); data = window._salesReportData; }
  if(!data) return;
  
  var win = window.open('', '_blank');
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var statusColors = {new:'#2563eb',confirmed:'#16a34a',ready:'#d97706',delivered:'#6a6a8a',cancelled:'#dc2626'};
  
  var rows = data.filtered.map(function(o, i){
    var d = o.orderDate ? new Date(o.orderDate+'T00:00:00').toLocaleDateString('en-GB') : '—';
    var price = parseFloat(o.finalPrice || o.minPrice || 0);
    var sc = statusColors[o.status] || '#6a6a8a';
    var bg = i % 2 === 0 ? 'white' : '#f8f9fa';
    return '<tr style="background:'+bg+'">'
      + '<td>'+(o.id||'—')+'</td>'
      + '<td>'+(o.customerName||'—')+'</td>'
      + '<td>'+(o.phone||'—')+'</td>'
      + '<td>'+d+' '+(o.orderTime||'')+'</td>'
      + '<td>'+(o.cakeType||'—')+'</td>'
      + '<td>'+(o.deliveryType==='pickup'?'Pickup':'Delivery')+'</td>'
      + '<td style="text-align:right">'+(price>0?'€'+price.toFixed(2):'—')+'</td>'
      + '<td style="text-align:center"><span style="background:'+sc+'18;color:'+sc+';border:1px solid '+sc+'30;border-radius:4px;padding:1px 6px;font-size:.7rem;font-weight:600">'+(o.status||'—')+'</span></td>'
      + '</tr>';
  }).join('');
  
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<title>Bismi Treats — Sales Report '+data.monthName+'</title>'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif;color:#1a1a2e;padding:20px;font-size:12px}'
    + '.header{text-align:center;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #C9A96E}'
    + '.header h1{font-size:1.3rem;color:#A07840;margin-bottom:4px}'
    + '.header p{font-size:.78rem;color:#6a6a8a}'
    + '.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}'
    + '.stat{border:1px solid #e0e0e0;border-radius:8px;padding:10px;text-align:center}'
    + '.stat-val{font-size:1.3rem;font-weight:800;color:#A07840}'
    + '.stat-lbl{font-size:.68rem;color:#6a6a8a;margin-top:2px}'
    + 'table{width:100%;border-collapse:collapse;font-size:.75rem}'
    + 'th{background:#f0f0f0;padding:7px 8px;text-align:left;font-weight:600;color:#4a4a6a;border-bottom:2px solid #ddd}'
    + 'td{padding:6px 8px;border-bottom:1px solid #f0f0f0}'
    + 'tr:last-child td{border-bottom:none}'
    + '.footer{margin-top:16px;text-align:center;font-size:.7rem;color:#9a9ab0;border-top:1px solid #e0e0e0;padding-top:10px}'
    + '@media print{body{padding:10px}.no-print{display:none}}'
    + '</style></head><body>'
    + '<div class="header">'
    + '<h1>🎂 Bismi Treats — Sales Report</h1>'
    + '<p>Period: '+data.monthName+' · Generated: '+new Date().toLocaleString('en-GB')+'</p>'
    + '</div>'
    + '<div class="stats">'
    + '<div class="stat"><div class="stat-val">'+data.totalOrders+'</div><div class="stat-lbl">Total Orders</div></div>'
    + '<div class="stat"><div class="stat-val" style="color:#16a34a">€'+data.totalRevenue.toFixed(2)+'</div><div class="stat-lbl">Total Revenue</div></div>'
    + '<div class="stat"><div class="stat-val" style="color:#2563eb">'+data.delivered+'</div><div class="stat-lbl">Delivered</div></div>'
    + '</div>'
    + '<table><thead><tr>'
    + '<th>Order ID</th><th>Customer</th><th>Phone</th><th>Date & Time</th><th>Cake</th><th>Delivery</th><th style="text-align:right">Price</th><th style="text-align:center">Status</th>'
    + '</tr></thead><tbody>'
    + (rows || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#9a9ab0">No orders for this period</td></tr>')
    + '</tbody></table>'
    + '<div class="footer">Bismi Treats · bismitreats.com · +351 934 453 710 · bismitreats.pt@gmail.com</div>'
    + '</body></html>';
  
  win.document.write(html);
  win.document.close();
  setTimeout(function(){ win.print(); }, 400);
}

// ── ORDER FORM MANAGER ───────────────────────────────────────
var _ofmCurrentTab = 'cake-types';
var _formConfig = {
  cakeTypes: [
    {id:'sponge-chocolate', name:'Chocolate Sponge', nameEn:'Chocolate Sponge', price:19.99, active:true},
    {id:'sponge-vanilla', name:'Vanilla Sponge', nameEn:'Vanilla Sponge', price:19.99, active:true},
    {id:'sponge-normal', name:'Normal Egg Sponge', nameEn:'Normal Egg Sponge', price:19.99, active:true}
  ],
  fillings: [
    {id:'morango', name:'Morango', nameEn:'Strawberry', emoji:'🍓', active:true},
    {id:'chocolate', name:'Chocolate', nameEn:'Chocolate', emoji:'🍫', active:true},
    {id:'chocolate-branco', name:'Chocolate Branco', nameEn:'White Chocolate', emoji:'🍫', active:true},
    {id:'limao', name:'Limão', nameEn:'Lemon', emoji:'🍋', active:true},
    {id:'limao-verde', name:'Limão Verde', nameEn:'Lime', emoji:'🍋', active:true},
    {id:'laranja', name:'Laranja', nameEn:'Orange', emoji:'🍊', active:true},
    {id:'kiwi', name:'Kiwi', nameEn:'Kiwi', emoji:'🥝', active:true},
    {id:'coco', name:'Coco', nameEn:'Coconut', emoji:'🥥', active:true},
    {id:'ananas', name:'Ananás', nameEn:'Pineapple', emoji:'🍍', active:true},
    {id:'cereja', name:'Cereja', nameEn:'Cherry', emoji:'🍒', active:true},
    {id:'manga', name:'Manga', nameEn:'Mango', emoji:'🥭', active:true},
    {id:'framboesa', name:'Framboesa', nameEn:'Raspberry', emoji:'🍓', active:true},
    {id:'caramel', name:'Caramel', nameEn:'Caramel', emoji:'🍯', active:true},
    {id:'frutos-vermelhos', name:'Frutos Vermelhos', nameEn:'Red Fruits', emoji:'🍓', active:true}
  ],
  sizes: [
    {min:'1.0', max:'1.3', people:'7-8', active:true},
    {min:'1.3', max:'1.6', people:'9-11', active:true},
    {min:'1.6', max:'1.9', people:'12-14', active:true},
    {min:'1.9', max:'2.2', people:'15-16', active:true},
    {min:'2.2', max:'2.5', people:'17-18', active:true},
    {min:'2.5', max:'2.8', people:'19-22', active:true},
    {min:'2.8', max:'3.1', people:'23-25', active:true},
    {min:'3.1', max:'3.4', people:'26-28', active:true},
    {min:'3.4', max:'3.7', people:'29-32', active:true},
    {min:'3.7', max:'4.0', people:'33-35', active:true},
    {min:'4.0', max:'4.3', people:'36-38', active:true},
    {min:'4.3', max:'4.6', people:'39-42', active:true},
    {min:'4.6', max:'4.9', people:'43-46', active:true},
    {min:'4.9', max:'5.2', people:'47-50', active:true}
  ],
  delivery: {
    freeDeliveryWeekday: {start:'18:00', end:'22:00'},
    freeDeliveryWeekend: {start:'08:00', end:'22:00'},
    expressAvailable: true,
    expressMinHours: 5,
    uberAvailable: true,
    dailyCapacity: 10,
    extraFillingPrice: 1.99,
    cardFeePercent: 2
  },
  blockedDates: []
};

function openOrderFormManager(){
  var sm = document.getElementById('settingsMenu');
  if(sm) sm.style.display = 'none';
  // Load config from server
  fetch('/api/form-config').then(function(r){return r.json();}).then(function(d){
    if(d && d.cakeTypes) _formConfig = Object.assign(_formConfig, d);
  }).catch(function(){}).finally(function(){
    var modal = document.getElementById('orderFormModal');
    if(modal){ modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    ofmTab('cake-types');
  });
}

function closeOrderFormManager(){
  var modal = document.getElementById('orderFormModal');
  if(modal){ modal.style.display = 'none'; document.body.style.overflow = ''; }
}

function ofmTab(tab){
  _ofmCurrentTab = tab;
  // Update tab styles
  document.querySelectorAll('.ofm-tab').forEach(function(t){
    t.style.color = '#6a6a8a';
    t.style.borderBottom = '2px solid transparent';
    t.style.fontWeight = '500';
  });
  var activeTab = document.getElementById('ofmTab' + tab.split('-').map(function(w){return w[0].toUpperCase()+w.slice(1);}).join(''));
  if(activeTab){
    activeTab.style.color = '#C9A96E';
    activeTab.style.borderBottom = '2px solid #C9A96E';
    activeTab.style.fontWeight = '600';
  }
  var content = document.getElementById('ofmContent');
  if(!content) return;
  if(tab === 'cake-types') renderOFMCakeTypes(content);
  else if(tab === 'fillings') renderOFMFillings(content);
  else if(tab === 'sizes') renderOFMSizes(content);
  else if(tab === 'availability') renderOFMAvailability(content);
  else if(tab === 'delivery') renderOFMDelivery(content);
}

function saveFormConfig(){
  fetch('/api/form-config', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(_formConfig)
  }).then(function(){
    showToast('Form configuration saved!', 'success');
  }).catch(function(){
    showToast('Saved locally (server sync failed)', 'warning');
  });
}

// ── CAKE TYPES TAB ──
function renderOFMCakeTypes(el){
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    + '<div style="font-size:.8rem;font-weight:600;color:#4a4a6a">Manage cake types available in the order form</div>'
    + '<button onclick="ofmAddCakeType()" style="background:linear-gradient(135deg,#C9A96E,#A07840);color:white;border:none;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:.76rem;font-weight:600;font-family:inherit"><i class="fas fa-plus"></i> Add Type</button>'
    + '</div>';
  html += '<div style="display:flex;flex-direction:column;gap:8px" id="cakeTypesList">';
  _formConfig.cakeTypes.forEach(function(ct, i){
    html += '<div style="background:rgba(255,255,255,.8);border:1px solid rgba(0,0,0,.08);border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px">';
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="font-size:.84rem;font-weight:600;color:#1a1a2e">'+ct.name+'</div>';
    html += '<div style="font-size:.72rem;color:#6a6a8a;margin-top:2px">€'+ct.price+'/kg · ID: '+ct.id+'</div>';
    html += '</div>';
    html += '<label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:.74rem;color:#4a4a6a">';
    html += '<input type="checkbox" '+(ct.active?'checked':'')+' onchange="_formConfig.cakeTypes['+i+'].active=this.checked;saveFormConfig()"> Active</label>';
    html += '<button onclick="ofmEditCakeType('+i+')" style="background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.3);color:#A07840;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.72rem;font-family:inherit"><i class="fas fa-edit"></i></button>';
    html += '<button onclick="ofmDeleteCakeType('+i+')" style="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);color:#dc2626;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:.72rem;font-family:inherit"><i class="fas fa-trash"></i></button>';
    html += '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function ofmAddCakeType(){
  var name = prompt('Cake type name (PT):');
  if(!name) return;
  var price = parseFloat(prompt('Price per kg (e.g. 19.99):') || '19.99');
  var id = name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  _formConfig.cakeTypes.push({id:id, name:name, nameEn:name, price:price, active:true});
  saveFormConfig();
  renderOFMCakeTypes(document.getElementById('ofmContent'));
}

function ofmEditCakeType(i){
  var ct = _formConfig.cakeTypes[i];
  var name = prompt('Name:', ct.name);
  if(!name) return;
  var price = parseFloat(prompt('Price per kg:', ct.price) || ct.price);
  _formConfig.cakeTypes[i].name = name;
  _formConfig.cakeTypes[i].nameEn = name;
  _formConfig.cakeTypes[i].price = price;
  saveFormConfig();
  renderOFMCakeTypes(document.getElementById('ofmContent'));
}

function ofmDeleteCakeType(i){
  if(!confirm('Delete "'+_formConfig.cakeTypes[i].name+'"?')) return;
  _formConfig.cakeTypes.splice(i, 1);
  saveFormConfig();
  renderOFMCakeTypes(document.getElementById('ofmContent'));
}

// ── FILLINGS TAB ──
function renderOFMFillings(el){
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    + '<div style="font-size:.8rem;font-weight:600;color:#4a4a6a">Manage available fillings</div>'
    + '<button onclick="ofmAddFilling()" style="background:linear-gradient(135deg,#C9A96E,#A07840);color:white;border:none;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:.76rem;font-weight:600;font-family:inherit"><i class="fas fa-plus"></i> Add Filling</button>'
    + '</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">';
  _formConfig.fillings.forEach(function(f, i){
    var bg = f.active ? 'rgba(255,255,255,.9)' : 'rgba(0,0,0,.04)';
    html += '<div style="background:'+bg+';border:1px solid rgba(0,0,0,.08);border-radius:10px;padding:10px;text-align:center;position:relative">';
    html += '<div style="font-size:1.4rem;margin-bottom:4px">'+f.emoji+'</div>';
    html += '<div style="font-size:.76rem;font-weight:600;color:#1a1a2e">'+f.name+'</div>';
    html += '<div style="font-size:.65rem;color:#9a9ab0;margin-top:1px">'+f.nameEn+'</div>';
    html += '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px">';
    html += '<label style="display:flex;align-items:center;gap:3px;cursor:pointer;font-size:.68rem;color:#4a4a6a"><input type="checkbox" '+(f.active?'checked':'')+' onchange="_formConfig.fillings['+i+'].active=this.checked;saveFormConfig()"> On</label>';
    html += '<button onclick="ofmDeleteFilling('+i+')" style="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);color:#dc2626;padding:2px 7px;border-radius:5px;cursor:pointer;font-size:.65rem;font-family:inherit"><i class="fas fa-trash"></i></button>';
    html += '</div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function ofmAddFilling(){
  var name = prompt('Filling name (PT):');
  if(!name) return;
  var nameEn = prompt('Filling name (EN):', name);
  var emoji = prompt('Emoji:', '🍓');
  var id = name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  _formConfig.fillings.push({id:id, name:name, nameEn:nameEn||name, emoji:emoji||'🍓', active:true});
  saveFormConfig();
  renderOFMFillings(document.getElementById('ofmContent'));
}

function ofmDeleteFilling(i){
  if(!confirm('Delete "'+_formConfig.fillings[i].name+'"?')) return;
  _formConfig.fillings.splice(i, 1);
  saveFormConfig();
  renderOFMFillings(document.getElementById('ofmContent'));
}

// ── SIZES TAB ──
function renderOFMSizes(el){
  var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
    + '<div style="font-size:.8rem;font-weight:600;color:#4a4a6a">Manage available cake sizes</div>'
    + '<button onclick="ofmAddSize()" style="background:linear-gradient(135deg,#C9A96E,#A07840);color:white;border:none;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:.76rem;font-weight:600;font-family:inherit"><i class="fas fa-plus"></i> Add Size</button>'
    + '</div>';
  html += '<div style="border:1px solid rgba(0,0,0,.08);border-radius:10px;overflow:hidden">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:.78rem">';
  html += '<thead><tr style="background:rgba(0,0,0,.04)"><th style="padding:8px 12px;text-align:left;font-weight:600;color:#4a4a6a">Min (kg)</th><th style="padding:8px 12px;text-align:left;font-weight:600;color:#4a4a6a">Max (kg)</th><th style="padding:8px 12px;text-align:left;font-weight:600;color:#4a4a6a">Serves</th><th style="padding:8px 12px;text-align:center;font-weight:600;color:#4a4a6a">Active</th><th style="padding:8px 12px;text-align:center;font-weight:600;color:#4a4a6a">Delete</th></tr></thead><tbody>';
  _formConfig.sizes.forEach(function(s, i){
    var bg = i%2===0?'white':'rgba(0,0,0,.02)';
    html += '<tr style="background:'+bg+';border-top:1px solid rgba(0,0,0,.05)">';
    html += '<td style="padding:8px 12px;font-weight:600;color:#1a1a2e">'+s.min+' kg</td>';
    html += '<td style="padding:8px 12px;color:#4a4a6a">'+s.max+' kg</td>';
    html += '<td style="padding:8px 12px;color:#4a4a6a">'+s.people+' people</td>';
    html += '<td style="padding:8px 12px;text-align:center"><input type="checkbox" '+(s.active?'checked':'')+' onchange="_formConfig.sizes['+i+'].active=this.checked;saveFormConfig()"></td>';
    html += '<td style="padding:8px 12px;text-align:center"><button onclick="ofmDeleteSize('+i+')" style="background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.2);color:#dc2626;padding:3px 8px;border-radius:5px;cursor:pointer;font-size:.7rem;font-family:inherit"><i class="fas fa-trash"></i></button></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  el.innerHTML = html;
}

function ofmAddSize(){
  var min = prompt('Minimum weight (kg, e.g. 5.2):');
  if(!min) return;
  var max = (parseFloat(min)+0.3).toFixed(1);
  var people = prompt('Serves (e.g. 47-50 people):', '');
  _formConfig.sizes.push({min:min, max:max, people:people||'', active:true});
  _formConfig.sizes.sort(function(a,b){return parseFloat(a.min)-parseFloat(b.min);});
  saveFormConfig();
  renderOFMSizes(document.getElementById('ofmContent'));
}

function ofmDeleteSize(i){
  if(!confirm('Delete size '+_formConfig.sizes[i].min+'–'+_formConfig.sizes[i].max+'kg?')) return;
  _formConfig.sizes.splice(i, 1);
  saveFormConfig();
  renderOFMSizes(document.getElementById('ofmContent'));
}

// ── AVAILABILITY TAB ──
function renderOFMAvailability(el){
  var blocked = _formConfig.blockedDates || [];
  var html = '<div style="margin-bottom:12px">';
  html += '<div style="font-size:.8rem;font-weight:600;color:#4a4a6a;margin-bottom:8px">Block specific dates — customers cannot select these in the order form</div>';
  html += '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
  html += '<input type="date" id="ofmBlockDate" style="padding:8px 10px;border:1px solid rgba(0,0,0,.1);border-radius:8px;font-size:.82rem;font-family:inherit;outline:none" min="'+new Date().toISOString().split('T')[0]+'">';
  html += '<input type="text" id="ofmBlockReason" placeholder="Reason (optional)" style="flex:1;min-width:120px;padding:8px 10px;border:1px solid rgba(0,0,0,.1);border-radius:8px;font-size:.82rem;font-family:inherit;outline:none">';
  html += '<button onclick="ofmBlockDate()" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.78rem;font-weight:600;font-family:inherit"><i class="fas fa-ban"></i> Block Date</button>';
  html += '</div>';
  
  if(blocked.length === 0){
    html += '<div style="text-align:center;padding:20px;color:#9a9ab0;font-size:.8rem;background:rgba(0,0,0,.03);border-radius:10px">No dates blocked — all dates available to customers</div>';
  } else {
    html += '<div style="font-size:.72rem;font-weight:700;color:#9a9ab0;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">'+blocked.length+' Blocked Date'+(blocked.length>1?'s':'')+'</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    blocked.sort().forEach(function(d, i){
      var dateStr = typeof d === 'string' ? d : d.date;
      var reason = typeof d === 'object' ? d.reason : '';
      var formatted = new Date(dateStr+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
      html += '<div style="background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.15);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:10px">';
      html += '<i class="fas fa-ban" style="color:#dc2626;font-size:.8rem;flex-shrink:0"></i>';
      html += '<div style="flex:1"><div style="font-size:.8rem;font-weight:600;color:#1a1a2e">'+formatted+'</div>';
      if(reason) html += '<div style="font-size:.7rem;color:#6a6a8a;margin-top:1px">'+reason+'</div>';
      html += '</div>';
      html += '<button data-date="'+dateStr+'" onclick="ofmUnblockDate(this.dataset.date)"' + ' style="background:rgba(22,163,74,.08);border:1px solid rgba(22,163,74,.2);color:#16a34a;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.72rem;font-family:inherit"><i class="fas fa-check"></i> Unblock</button>';
      html += '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  el.innerHTML = html;
}

function ofmBlockDate(){
  var dateEl = document.getElementById('ofmBlockDate');
  var reasonEl = document.getElementById('ofmBlockReason');
  if(!dateEl || !dateEl.value){ showToast('Please select a date','warning'); return; }
  var dateStr = dateEl.value;
  var reason = reasonEl ? reasonEl.value.trim() : '';
  if(!_formConfig.blockedDates) _formConfig.blockedDates = [];
  // Remove if already exists
  _formConfig.blockedDates = _formConfig.blockedDates.filter(function(d){
    return (typeof d === 'string' ? d : d.date) !== dateStr;
  });
  _formConfig.blockedDates.push(reason ? {date:dateStr, reason:reason} : dateStr);
  // Also update reserved-days API
  fetch('/api/reserve-day', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({date:dateStr, reason:reason})}).catch(function(){});
  saveFormConfig();
  dateEl.value = '';
  if(reasonEl) reasonEl.value = '';
  renderOFMAvailability(document.getElementById('ofmContent'));
  showToast('Date blocked: '+dateStr, 'success');
}

function ofmUnblockDate(dateStr){
  _formConfig.blockedDates = (_formConfig.blockedDates||[]).filter(function(d){
    return (typeof d === 'string' ? d : d.date) !== dateStr;
  });
  fetch('/api/reserve-day', {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({date:dateStr})}).catch(function(){});
  saveFormConfig();
  renderOFMAvailability(document.getElementById('ofmContent'));
  showToast('Date unblocked: '+dateStr, 'success');
}

// ── DELIVERY TAB ──
function renderOFMDelivery(el){
  var d = _formConfig.delivery || {};
  var html = '<div style="display:flex;flex-direction:column;gap:14px">';
  
  // Free delivery hours
  html += '<div style="background:rgba(255,255,255,.8);border:1px solid rgba(0,0,0,.08);border-radius:10px;padding:14px">';
  html += '<div style="font-size:.82rem;font-weight:700;color:#1a1a2e;margin-bottom:10px">🚚 Free Delivery Hours</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html += '<div><label style="font-size:.72rem;font-weight:600;color:#6a6a8a;display:block;margin-bottom:4px">Weekday Start</label><input type="time" value="'+(d.freeDeliveryWeekday&&d.freeDeliveryWeekday.start||'18:00')+'" onchange="_formConfig.delivery.freeDeliveryWeekday.start=this.value;saveFormConfig()" style="width:100%;padding:7px 10px;border:1px solid rgba(0,0,0,.1);border-radius:7px;font-size:.82rem;font-family:inherit;outline:none"></div>';
  html += '<div><label style="font-size:.72rem;font-weight:600;color:#6a6a8a;display:block;margin-bottom:4px">Weekday End</label><input type="time" value="'+(d.freeDeliveryWeekday&&d.freeDeliveryWeekday.end||'22:00')+'" onchange="_formConfig.delivery.freeDeliveryWeekday.end=this.value;saveFormConfig()" style="width:100%;padding:7px 10px;border:1px solid rgba(0,0,0,.1);border-radius:7px;font-size:.82rem;font-family:inherit;outline:none"></div>';
  html += '<div><label style="font-size:.72rem;font-weight:600;color:#6a6a8a;display:block;margin-bottom:4px">Weekend Start</label><input type="time" value="'+(d.freeDeliveryWeekend&&d.freeDeliveryWeekend.start||'08:00')+'" onchange="_formConfig.delivery.freeDeliveryWeekend.start=this.value;saveFormConfig()" style="width:100%;padding:7px 10px;border:1px solid rgba(0,0,0,.1);border-radius:7px;font-size:.82rem;font-family:inherit;outline:none"></div>';
  html += '<div><label style="font-size:.72rem;font-weight:600;color:#6a6a8a;display:block;margin-bottom:4px">Weekend End</label><input type="time" value="'+(d.freeDeliveryWeekend&&d.freeDeliveryWeekend.end||'22:00')+'" onchange="_formConfig.delivery.freeDeliveryWeekend.end=this.value;saveFormConfig()" style="width:100%;padding:7px 10px;border:1px solid rgba(0,0,0,.1);border-radius:7px;font-size:.82rem;font-family:inherit;outline:none"></div>';
  html += '</div></div>';
  
  // Express & capacity
  html += '<div style="background:rgba(255,255,255,.8);border:1px solid rgba(0,0,0,.08);border-radius:10px;padding:14px">';
  html += '<div style="font-size:.82rem;font-weight:700;color:#1a1a2e;margin-bottom:10px">⚡ Express & Capacity</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  html += '<div><label style="font-size:.72rem;font-weight:600;color:#6a6a8a;display:block;margin-bottom:4px">Express Min Hours</label><input type="number" value="'+(d.expressMinHours||5)+'" min="1" max="24" onchange="_formConfig.delivery.expressMinHours=parseInt(this.value);saveFormConfig()" style="width:100%;padding:7px 10px;border:1px solid rgba(0,0,0,.1);border-radius:7px;font-size:.82rem;font-family:inherit;outline:none"></div>';
  html += '<div><label style="font-size:.72rem;font-weight:600;color:#6a6a8a;display:block;margin-bottom:4px">Daily Order Capacity</label><input type="number" value="'+(d.dailyCapacity||10)+'" min="1" max="50" onchange="_formConfig.delivery.dailyCapacity=parseInt(this.value);saveFormConfig()" style="width:100%;padding:7px 10px;border:1px solid rgba(0,0,0,.1);border-radius:7px;font-size:.82rem;font-family:inherit;outline:none"></div>';
  html += '<div><label style="font-size:.72rem;font-weight:600;color:#6a6a8a;display:block;margin-bottom:4px">Extra Filling Price (€)</label><input type="number" value="'+(d.extraFillingPrice||1.99)+'" step="0.01" onchange="_formConfig.delivery.extraFillingPrice=parseFloat(this.value);saveFormConfig()" style="width:100%;padding:7px 10px;border:1px solid rgba(0,0,0,.1);border-radius:7px;font-size:.82rem;font-family:inherit;outline:none"></div>';
  html += '<div><label style="font-size:.72rem;font-weight:600;color:#6a6a8a;display:block;margin-bottom:4px">Card Fee (%)</label><input type="number" value="'+(d.cardFeePercent||2)+'" step="0.1" onchange="_formConfig.delivery.cardFeePercent=parseFloat(this.value);saveFormConfig()" style="width:100%;padding:7px 10px;border:1px solid rgba(0,0,0,.1);border-radius:7px;font-size:.82rem;font-family:inherit;outline:none"></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:16px;margin-top:10px">';
  html += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.78rem;color:#4a4a6a"><input type="checkbox" '+(d.expressAvailable?'checked':'')+' onchange="_formConfig.delivery.expressAvailable=this.checked;saveFormConfig()"> Express orders available</label>';
  html += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:.78rem;color:#4a4a6a"><input type="checkbox" '+(d.uberAvailable?'checked':'')+' onchange="_formConfig.delivery.uberAvailable=this.checked;saveFormConfig()"> Uber Package available</label>';
  html += '</div></div>';
  
  html += '</div>';
  el.innerHTML = html;
}

// ── WEBSITE ANALYTICS ────────────────────────────────────────
var _analyticsInterval = null;

function openAnalytics(){
  var sm = document.getElementById('settingsMenu');
  if(sm) sm.style.display = 'none';
  var modal = document.getElementById('analyticsModal');
  if(modal){ modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  loadAnalytics();
  // Live refresh every 30 seconds
  clearInterval(_analyticsInterval);
  _analyticsInterval = setInterval(loadAnalytics, 30000);
}

function loadAnalytics(){
  var days = document.getElementById('analyticsDays');
  var d = days ? days.value : '30';
  var content = document.getElementById('analyticsContent');
  if(!content) return;
  
  fetch('/api/analytics?days='+d, {cache:'no-store'})
    .then(function(r){return r.json();})
    .then(function(data){
      if(data.error){content.innerHTML='<div style="text-align:center;padding:40px;color:#dc2626">Error: '+data.error+'</div>';return;}
      renderAnalytics(data, parseInt(d));
    })
    .catch(function(e){
      content.innerHTML='<div style="text-align:center;padding:40px;color:#dc2626">Failed to load analytics</div>';
    });
}

function renderAnalytics(data, days){
  var content = document.getElementById('analyticsContent');
  if(!content) return;
  
  var now = new Date();
  var timeStr = now.toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  
  // ── STAT CARDS ──
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">';
  
  var stats = [
    {label:'Total Visits', value:data.total||0, icon:'fa-users', color:'#2563eb', bg:'rgba(37,99,235,.08)'},
    {label:'Today', value:data.today||0, icon:'fa-calendar-day', color:'#16a34a', bg:'rgba(22,163,74,.08)'},
    {label:'This Hour', value:data.liveVisits||0, icon:'fa-bolt', color:'#d97706', bg:'rgba(217,119,6,.08)'},
    {label:'Mobile', value:data.totalMobile||0, icon:'fa-mobile-alt', color:'#7c3aed', bg:'rgba(124,58,237,.08)'},
    {label:'Desktop', value:data.totalDesktop||0, icon:'fa-desktop', color:'#0891b2', bg:'rgba(8,145,178,.08)'},
    {label:'Avg/Day', value:days>0?Math.round((data.total||0)/days):0, icon:'fa-chart-bar', color:'#C9A96E', bg:'rgba(201,169,110,.08)'}
  ];
  
  stats.forEach(function(s){
    html += '<div style="background:'+s.bg+';border:1px solid '+s.color+'22;border-radius:12px;padding:14px;text-align:center">';
    html += '<i class="fas '+s.icon+'" style="font-size:1.4rem;color:'+s.color+';margin-bottom:8px;display:block"></i>';
    html += '<div style="font-size:1.6rem;font-weight:800;color:'+s.color+'">'+s.value.toLocaleString()+'</div>';
    html += '<div style="font-size:.68rem;color:#6a6a8a;margin-top:2px;font-weight:500">'+s.label+'</div>';
    html += '</div>';
  });
  html += '</div>';
  
  // ── DAILY CHART ──
  if(data.daily && data.daily.length > 0){
    var maxVisits = Math.max.apply(null, data.daily.map(function(d){return d.visits||0;}));
    if(maxVisits === 0) maxVisits = 1;
    
    html += '<div style="background:white;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:16px;margin-bottom:16px">';
    html += '<div style="font-size:.8rem;font-weight:700;color:#1a1a2e;margin-bottom:14px;display:flex;align-items:center;gap:6px">';
    html += '<i class="fas fa-chart-area" style="color:#C9A96E"></i> Daily Visitors — Last '+days+' Days</div>';
    
    // SVG Chart
    var w = 800; var h = 160; var pad = 40;
    var chartW = w - pad*2; var chartH = h - pad;
    var pts = data.daily;
    var step = pts.length > 1 ? chartW/(pts.length-1) : chartW;
    
    html += '<div style="overflow-x:auto"><svg viewBox="0 0 '+w+' '+h+'" style="width:100%;min-width:300px;height:auto">';
    
    // Grid lines
    for(var gi=0;gi<=4;gi++){
      var gy = pad + (chartH/4)*gi;
      var gv = Math.round(maxVisits*(1-gi/4));
      html += '<line x1="'+pad+'" y1="'+gy+'" x2="'+(w-pad)+'" y2="'+gy+'" stroke="rgba(0,0,0,.06)" stroke-width="1"/>';
      html += '<text x="'+(pad-6)+'" y="'+(gy+4)+'" text-anchor="end" font-size="10" fill="#9a9ab0">'+gv+'</text>';
    }
    
    // Area fill path
    var areaPath = 'M '+pad+' '+(pad+chartH);
    var linePath = '';
    pts.forEach(function(pt, i){
      var x = pad + i*step;
      var y = pad + chartH - (pt.visits/maxVisits)*chartH;
      if(i===0){linePath='M '+x+' '+y; areaPath+=' L '+x+' '+y;}
      else{linePath+=' L '+x+' '+y; areaPath+=' L '+x+' '+y;}
    });
    areaPath += ' L '+(pad+(pts.length-1)*step)+' '+(pad+chartH)+' Z';
    
    html += '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">';
    html += '<stop offset="0%" stop-color="#C9A96E" stop-opacity="0.3"/>';
    html += '<stop offset="100%" stop-color="#C9A96E" stop-opacity="0.02"/>';
    html += '</linearGradient></defs>';
    html += '<path d="'+areaPath+'" fill="url(#areaGrad)"/>';
    html += '<path d="'+linePath+'" fill="none" stroke="#C9A96E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    
    // Dots + labels (show every Nth)
    var showEvery = pts.length > 20 ? Math.ceil(pts.length/10) : 1;
    pts.forEach(function(pt, i){
      var x = pad + i*step;
      var y = pad + chartH - (pt.visits/maxVisits)*chartH;
      html += '<circle cx="'+x+'" cy="'+y+'" r="3" fill="#C9A96E" stroke="white" stroke-width="1.5"/>';
      if(i%showEvery===0||i===pts.length-1){
        var label = pt.date.slice(5); // MM-DD
        html += '<text x="'+x+'" y="'+(pad+chartH+14)+'" text-anchor="middle" font-size="9" fill="#9a9ab0">'+label+'</text>';
      }
    });
    
    html += '</svg></div></div>';
    
    // ── MONTHLY BAR CHART ──
    if(data.monthly && data.monthly.length > 0){
      var maxM = Math.max.apply(null, data.monthly.map(function(m){return m.visits||0;}));
      if(maxM===0)maxM=1;
      
      html += '<div style="background:white;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:16px;margin-bottom:16px">';
      html += '<div style="font-size:.8rem;font-weight:700;color:#1a1a2e;margin-bottom:14px;display:flex;align-items:center;gap:6px">';
      html += '<i class="fas fa-chart-bar" style="color:#2563eb"></i> Monthly Overview</div>';
      html += '<div style="display:flex;align-items:flex-end;gap:8px;height:120px;padding:0 4px">';
      
      data.monthly.forEach(function(m){
        var pct = (m.visits/maxM)*100;
        var monthLabel = m.month.slice(0,7);
        var isCurrentMonth = m.month === new Date().toISOString().slice(0,7);
        html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">';
        html += '<div style="font-size:.68rem;font-weight:700;color:#1a1a2e">'+m.visits+'</div>';
        html += '<div style="width:100%;background:linear-gradient(to top,'+(isCurrentMonth?'#C9A96E':'#2563eb')+','+(isCurrentMonth?'#A07840':'#60a5fa')+');border-radius:4px 4px 0 0;height:'+pct+'%;min-height:4px;transition:height .3s ease"></div>';
        html += '<div style="font-size:.6rem;color:#9a9ab0;white-space:nowrap">'+monthLabel+'</div>';
        html += '</div>';
      });
      html += '</div></div>';
    }
    
    // ── RECENT DAYS TABLE ──
    var recentDays = data.daily.slice(-10).reverse();
    html += '<div style="background:white;border:1px solid rgba(0,0,0,.08);border-radius:12px;overflow:hidden">';
    html += '<div style="padding:12px 16px;border-bottom:1px solid rgba(0,0,0,.06);font-size:.8rem;font-weight:700;color:#1a1a2e;display:flex;align-items:center;gap:6px">';
    html += '<i class="fas fa-list" style="color:#7c3aed"></i> Recent Days</div>';
    html += '<table style="width:100%;border-collapse:collapse;font-size:.78rem">';
    html += '<thead><tr style="background:rgba(0,0,0,.03)"><th style="padding:8px 14px;text-align:left;font-weight:600;color:#4a4a6a">Date</th><th style="padding:8px 14px;text-align:right;font-weight:600;color:#4a4a6a">Visits</th><th style="padding:8px 14px;text-align:right;font-weight:600;color:#4a4a6a">Mobile</th><th style="padding:8px 14px;text-align:right;font-weight:600;color:#4a4a6a">Desktop</th><th style="padding:8px 14px;text-align:left;font-weight:600;color:#4a4a6a">Bar</th></tr></thead><tbody>';
    
    var maxRow = Math.max.apply(null, recentDays.map(function(d){return d.visits||0;}));
    if(maxRow===0)maxRow=1;
    recentDays.forEach(function(d, i){
      var bg = i%2===0?'white':'rgba(0,0,0,.02)';
      var pct = Math.round((d.visits/maxRow)*100);
      var dateObj = new Date(d.date+'T00:00:00');
      var dayName = dateObj.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
      var isToday = d.date === new Date().toISOString().split('T')[0];
      html += '<tr style="background:'+bg+';border-top:1px solid rgba(0,0,0,.04)">';
      html += '<td style="padding:8px 14px;color:#1a1a2e;font-weight:'+(isToday?'700':'400')+'">'+dayName+(isToday?' <span style="background:#16a34a;color:white;border-radius:4px;padding:1px 5px;font-size:.6rem">TODAY</span>':'')+'</td>';
      html += '<td style="padding:8px 14px;text-align:right;font-weight:700;color:#1a1a2e">'+(d.visits||0)+'</td>';
      html += '<td style="padding:8px 14px;text-align:right;color:#7c3aed">'+(d.mobile||0)+'</td>';
      html += '<td style="padding:8px 14px;text-align:right;color:#0891b2">'+((d.visits||0)-(d.mobile||0))+'</td>';
      html += '<td style="padding:8px 14px"><div style="background:#f0f0f0;border-radius:4px;height:8px;overflow:hidden"><div style="background:linear-gradient(90deg,#C9A96E,#A07840);height:100%;width:'+pct+'%;border-radius:4px;transition:width .3s ease"></div></div></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  } else {
    html += '<div style="text-align:center;padding:40px;color:#9a9ab0">';
    html += '<i class="fas fa-chart-line" style="font-size:3rem;margin-bottom:12px;display:block;opacity:.3"></i>';
    html += '<div style="font-weight:600;margin-bottom:6px">No visitor data yet</div>';
    html += '<div style="font-size:.82rem">Visitors will be tracked automatically when they visit the website</div>';
    html += '</div>';
  }
  
  html += '<div style="text-align:center;font-size:.68rem;color:#9a9ab0;margin-top:12px">Last updated: '+timeStr+' · Auto-refreshes every 30 seconds</div>';
  
  content.innerHTML = html;
}
