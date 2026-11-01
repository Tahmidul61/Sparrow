const http=require('http');
const zlib=require('zlib');
// ── BUCKET 1: Products (public, SEO-friendly) ────────────────
const PRODUCTS_BUCKET_NAME=process.env.PRODUCTS_BUCKET_NAME||'structured-trunk-hxqzbbcr';
const PRODUCTS_BUCKET_ENDPOINT=process.env.PRODUCTS_BUCKET_ENDPOINT||'https://t3.storageapi.dev';
const PRODUCTS_BUCKET_KEY=process.env.PRODUCTS_BUCKET_KEY||'tid_IdEgbGYgYKNCJTCIhbtHGtjePieRYQSDriKxQGkpQgtMxjcFNm';
const PRODUCTS_BUCKET_SECRET=process.env.PRODUCTS_BUCKET_SECRET||'tsec_VW6goXJsvx_dRoU5oCyEOMV4RBFJ01vvndllLGtvSaROl93+iJbxGMh4PQnPhJLWMxqhxI';
const PRODUCTS_BUCKET_REGION=process.env.PRODUCTS_BUCKET_REGION||'auto';
const PRODUCTS_PUBLIC_URL=process.env.PRODUCTS_PUBLIC_URL||'https://structured-trunk-hxqzbbcr.t3.storageapi.dev';

// ── BUCKET 2: Orders (private, staff only) ────────────────────
const ORDERS_BUCKET_NAME=process.env.ORDERS_BUCKET_NAME||'optimized-briefcase-kz-txs';
const ORDERS_BUCKET_ENDPOINT=process.env.ORDERS_BUCKET_ENDPOINT||'https://t3.storageapi.dev';
const ORDERS_BUCKET_KEY=process.env.ORDERS_BUCKET_KEY||'tid_GmVkefGngYogpHLnbICKgKJVHa_QRLxifYkoTfZNAvYHuqmtXv';
const ORDERS_BUCKET_SECRET=process.env.ORDERS_BUCKET_SECRET||'tsec_BhK1kFe3uve4VWMw28pNoe2GUC4GGCY8zrmeOSGlR1VnHBhtJCThGH-1W_AW1oJ8MRIs7A';
const ORDERS_BUCKET_REGION=process.env.ORDERS_BUCKET_REGION||'auto';

// Legacy aliases (keep for backward compatibility)
const BUCKET_NAME=PRODUCTS_BUCKET_NAME;
const BUCKET_ENDPOINT=PRODUCTS_BUCKET_ENDPOINT;
const BUCKET_KEY=PRODUCTS_BUCKET_KEY;
const BUCKET_SECRET=PRODUCTS_BUCKET_SECRET;
const BUCKET_REGION=PRODUCTS_BUCKET_REGION;
const BUCKET_PUBLIC_URL=PRODUCTS_PUBLIC_URL;

let S3=null;


// Shared photo upload helper
async function handlePhotoUpload(req,folder,bucketName,bucketKey,bucketSecret,bucketEndpoint){
  const chunks=[];
  for await(const chunk of req)chunks.push(chunk);
  const buf=Buffer.concat(chunks);
  const ct=req.headers['content-type']||'';
  const boundary=ct.split('boundary=')[1];
  if(!boundary)return{error:'No boundary'};
  // Parse multipart using Buffer (avoids string encoding issues)
  const boundaryBuf=Buffer.from('--'+boundary);
  const CRLF=Buffer.from([13,10]);
  const CRLFCRLF=Buffer.from([13,10,13,10]);
  let fileData=null,fileName='photo.jpg',fileMime='image/jpeg';
  let pos=0;
  while(pos<buf.length){
    const bPos=buf.indexOf(boundaryBuf,pos);
    if(bPos<0)break;
    pos=bPos+boundaryBuf.length;
    if(buf[pos]===45&&buf[pos+1]===45)break; // --
    if(buf[pos]===13)pos+=2; // skip CRLF
    const headerEnd=buf.indexOf(CRLFCRLF,pos);
    if(headerEnd<0)break;
    const headerStr=buf.slice(pos,headerEnd).toString('utf8');
    pos=headerEnd+4;
    if(headerStr.includes('filename')){
      const fi=headerStr.indexOf('filename="');
      if(fi>=0){const fe=headerStr.indexOf('"',fi+10);if(fe>=0)fileName=headerStr.slice(fi+10,fe);}
      const mi=headerStr.indexOf('Content-Type:');
      if(mi>=0){const me=headerStr.indexOf('\n',mi);if(me>=0)fileMime=headerStr.slice(mi+13,me).trim();}
      const nextBound=buf.indexOf(boundaryBuf,pos);
      const dataEnd=nextBound>0?nextBound-2:buf.length;
      fileData=buf.slice(pos,dataEnd);
      break;
    }
  }
  if(!fileData)return{error:'No file data'};
  const ts=Date.now();
  const safeName=fileName.replace(/[^a-zA-Z0-9._-]/g,'_');
  const key=folder+'/'+ts+'_'+safeName;
  const uploadUrl=bucketEndpoint+'/'+bucketName+'/'+key;
  const crypto=require('crypto');
  const date=new Date().toUTCString();
  const sig=crypto.createHmac('sha1',bucketSecret).update('PUT\n\n'+fileMime+'\n'+date+'\n/'+bucketName+'/'+key).digest('base64');
  const uploadRes=await fetch(uploadUrl,{method:'PUT',headers:{'Content-Type':fileMime,'Date':date,'Authorization':'AWS '+bucketKey+':'+sig,'Content-Length':String(fileData.length)},body:fileData});
  if(!uploadRes.ok)return{error:'Upload failed: '+uploadRes.status};
  return{filename:ts+'_'+safeName,key};
}


async function initS3(){
  if(!BUCKET_NAME||!BUCKET_KEY){console.log('No bucket config');return;}
  try{
    const {S3Client}=require('@aws-sdk/client-s3');
    S3=new S3Client({
      endpoint:BUCKET_ENDPOINT,
      region:BUCKET_REGION,
      credentials:{accessKeyId:BUCKET_KEY,secretAccessKey:BUCKET_SECRET},
      forcePathStyle:false
    });
    console.log('S3 bucket connected:',BUCKET_NAME);
  }catch(e){console.log('S3 init failed:',e.message);}
}const fs=require('fs');const path=require('path');
const PORT=process.env.PORT||8000;
const MONGO_URL=process.env.MONGO_URL||process.env.MONGODB_URL||'';
const MIME={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.webp':'image/webp'};
function serveFile(res,fp){fs.readFile(fp,(err,data)=>{if(err){res.writeHead(404);res.end('Not Found');return;}const ext=path.extname(fp);res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream'});res.end(data);});}
function parseBody(req){return new Promise(resolve=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{const d=JSON.parse(b);if(d&&typeof d==='object'&&!Array.isArray(d)){delete d._id;}resolve(d);}catch{resolve({});}});});}

// ── COMPRESSION ──────────────────────────────────────────────
function shouldCompress(contentType){
  return contentType&&(contentType.includes('text')||contentType.includes('javascript')||contentType.includes('json')||contentType.includes('css'));
}

function sendCompressed(res, data, contentType, status){
  status = status || 200;
  var buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  if(shouldCompress(contentType) && buf.length > 1024){
    zlib.gzip(buf, function(err, compressed){
      if(err){
        res.writeHead(status, {'Content-Type':contentType,'Cache-Control':'public,max-age=3600'});
        res.end(buf);
      } else {
        res.writeHead(status, {'Content-Type':contentType,'Content-Encoding':'gzip','Cache-Control':'public,max-age=3600','Vary':'Accept-Encoding'});
        res.end(compressed);
      }
    });
  } else {
    res.writeHead(status, {'Content-Type':contentType,'Cache-Control':'public,max-age=3600'});
    res.end(buf);
  }
}

function jsonRes(res,data,status){status=status||200;res.writeHead(status,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});res.end(JSON.stringify(data));}
var db=null;
async function connectMongo(){if(!MONGO_URL){console.log('No MONGO_URL');return;}try{const{MongoClient}=require('mongodb');const client=new MongoClient(MONGO_URL,{serverSelectionTimeoutMS:8000});await client.connect();db=client.db('bismi_treats');console.log('MongoDB connected');const cat=await db.collection('catalogue').countDocuments();if(cat===0)await db.collection('catalogue').insertOne({key:'main',cakes:[],accessories:[],flavours:[],hero:{},business:{},announcement:{text:'',enabled:false}});}catch(e){console.log('MongoDB failed:',e.message);}}
const DATA_DIR=path.join(__dirname,'data');const ORDERS_FILE=path.join(DATA_DIR,'orders.json');const REQS_FILE=path.join(DATA_DIR,'customer-requests.json');
function ensureDir(){if(!fs.existsSync(DATA_DIR))fs.mkdirSync(DATA_DIR,{recursive:true});}
function loadFile(f){try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return[];}}
function saveFile(f,d){ensureDir();fs.writeFileSync(f,JSON.stringify(d,null,2));}
var io=null;function emit(ev,data){if(io)io.emit(ev,data);}

// ── URL HELPERS ───────────────────────────────────────────────
function slugify(str){
  return (str||'').toLowerCase()
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
    .replace(/[ùúûü]/g,'u').replace(/[ç]/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function productUrl(p){
  const cat=p.category==='accessories'?'accessories':'cakes';
  const slug=slugify(p.nameEn||p.name||'')+(p.code?'-'+p.code.toLowerCase():'');
  return '/products/'+cat+'/'+slug;
}

function getProductImage(p){
  if(p.photos&&p.photos.length>0){
    const ph=p.photos[0];
    // Already a full URL (old bucket or external)
    if(ph.startsWith('http')){
      // Convert old bucket URLs to proxy
      if(ph.includes('storageapi')||ph.includes('t3.storage')){
        const m=ph.match(/\.dev\/(.+)/);
        if(m)return 'https://bismitreats.com/uploads/'+m[1];
      }
      return ph;
    }
    if(ph.startsWith('/uploads/'))return 'https://bismitreats.com'+ph;
    if(ph.startsWith('/'))return 'https://bismitreats.com'+ph;
    return 'https://bismitreats.com/uploads/photos/'+ph;
  }
  return 'https://bismitreats.com/icon-512.png';
}

// ── PAGE GENERATORS ───────────────────────────────────────────
function pageShell(title,desc,image,canonical,schemaJson,bodyHtml){
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${title}</title>
<meta name="description" content="${desc}"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:image" content="${image}"/>
<meta property="og:type" content="website"/>
<link rel="canonical" href="https://bismitreats.com${canonical}"/>
<script type="application/ld+json">${schemaJson}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:#FAFAFA;color:#111;-webkit-font-smoothing:antialiased}
.container{max-width:640px;margin:0 auto;padding:20px 16px}
.back-btn{display:inline-flex;align-items:center;gap:6px;color:#9CA3AF;font-size:.82rem;text-decoration:none;margin-bottom:16px}
.back-btn:hover{color:#111}
.product-img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:20px;margin-bottom:16px}
.product-name{font-size:1.4rem;font-weight:800;color:#111;margin-bottom:6px;letter-spacing:-.02em}
.product-code{font-size:.72rem;color:#9CA3AF;margin-bottom:8px}
.product-price{font-size:1rem;font-weight:700;color:#A07840;margin-bottom:12px}
.product-desc{font-size:.88rem;color:#6B7280;line-height:1.7;margin-bottom:20px}
.order-btn{display:block;width:100%;padding:14px;background:#111;color:white;text-align:center;border-radius:14px;font-size:.95rem;font-weight:700;text-decoration:none;margin-bottom:10px}
.wa-btn{display:block;width:100%;padding:14px;background:#25d366;color:white;text-align:center;border-radius:14px;font-size:.95rem;font-weight:700;text-decoration:none}
.section-title{font-size:1.1rem;font-weight:800;color:#111;margin-bottom:12px}
.flavour-grid{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.flavour-chip{background:white;border:1px solid rgba(0,0,0,.08);border-radius:9999px;padding:6px 14px;font-size:.78rem;font-weight:500}
.info-card{background:white;border:1px solid rgba(0,0,0,.06);border-radius:16px;padding:16px;margin-bottom:12px}
.info-title{font-size:.82rem;font-weight:700;color:#111;margin-bottom:4px}
.info-text{font-size:.78rem;color:#6B7280;line-height:1.6}
.header{background:white;border-bottom:1px solid rgba(0,0,0,.06);padding:14px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:10}
.header-logo{width:32px;height:32px;border-radius:50%;overflow:hidden}
.header-logo img{width:100%;height:100%;object-fit:cover}
.header-name{font-size:.9rem;font-weight:700;color:#111}
</style>
</head>
<body>
<div class="header">
  <div class="header-logo"><img src="/icon-192.png" alt="Bismi Treats"/></div>
  <div class="header-name">Bismi Treats</div>
</div>
${bodyHtml}
</body>
</html>`;
}

function generateProductPage(p,category,biz){
  const name=p.nameEn||p.name||'Artisan Cake';
  const desc=(p.descEn||p.desc||'Beautiful artisan cake made with love by Bismi Treats in Coimbra & Dublin.');
  const image=getProductImage(p);
  const canonical=productUrl(p);
  const price=(p.price||19.99).toFixed(2);
  const orderUrl='https://bismitreats.com/customer-form.html'+(p.code?'?product='+p.code:'');
  const waText=encodeURIComponent('Hi! I would like to order: '+name+(p.code?' ('+p.code+')':''));
  const waUrl='https://wa.me/351934453710?text='+waText;
  const isAcc=category==='accessories';

  const schema=JSON.stringify({
    '@context':'https://schema.org',
    '@type':'Product',
    'name':name,
    'description':desc,
    'image':image,
    'brand':{'@type':'Brand','name':'Bismi Treats'},
    'offers':{
      '@type':'Offer',
      'price':price,
      'priceCurrency':'EUR',
      'availability':'https://schema.org/InStock',
      'seller':{'@type':'Organization','name':'Bismi Treats'}
    },
    ...(p.code?{'sku':p.code}:{})
  });

  const body=`
<div class="container">
  <a href="/" class="back-btn">← Back to Bismi Treats</a>
  ${image!=='https://bismitreats.com/icon-512.png'?`<img src="${image}" alt="${name}" class="product-img" loading="eager"/>`:''}
  <div class="product-name">${name}</div>
  ${p.code?`<div class="product-code">Product Code: ${p.code}</div>`:''}
  <div class="product-price">${isAcc?'€'+price:'From €'+price+'/kg'}</div>
  <div class="product-desc">${desc}</div>
  <a href="${orderUrl}" class="order-btn">🎂 Order This Cake</a>
  <a href="${waUrl}" class="wa-btn">💬 Ask on WhatsApp</a>
</div>`;

  return pageShell(name+' — Bismi Treats',desc,image,canonical,schema,body);
}

function generateAboutPage(biz){
  const schema=JSON.stringify({
    '@context':'https://schema.org',
    '@type':'Bakery',
    'name':'Bismi Treats',
    'description':'Best halal cake shop in Coimbra & Dublin. Custom artisan cakes from €19.99/kg.',
    'url':'https://bismitreats.com',
    'telephone':'+351934453710',
    'email':'bismitreats.pt@gmail.com',
    'address':{'@type':'PostalAddress','addressLocality':'Coimbra','addressCountry':'PT'},
    'aggregateRating':{'@type':'AggregateRating','ratingValue':'5','reviewCount':'90'}
  });
  const body=`
<div class="container">
  <a href="/" class="back-btn">← Back to Bismi Treats</a>
  <div class="section-title">About Bismi Treats</div>
  <div class="info-card"><div class="info-title">Who We Are</div><div class="info-text">Bismi Treats is a premium artisan cake shop based in Coimbra, Portugal and Dublin, Ireland. We specialise in custom-made cakes for birthdays, weddings and special occasions.</div></div>
  <div class="info-card"><div class="info-title">📍 Location</div><div class="info-text">Praça Mestre Pero, Coimbra, Portugal</div></div>
  <div class="info-card"><div class="info-title">⏰ Hours</div><div class="info-text">Monday – Sunday: 8:00 – 20:00<br>Free delivery: Mon–Fri 18:00–22:00 | Sat–Sun 8:00–22:00</div></div>
  <div class="info-card"><div class="info-title">📞 Contact</div><div class="info-text">WhatsApp: +351 934 453 710<br>Email: bismitreats.pt@gmail.com</div></div>
  <div class="info-card"><div class="info-title">💰 Pricing</div><div class="info-text">From €19.99/kg · Extra filling +€1.99 · Minimum 24h notice</div></div>
  <a href="https://wa.me/351934453710" class="wa-btn">💬 Contact Us on WhatsApp</a>
</div>`;
  return pageShell('About Bismi Treats — Halal Cake Shop Coimbra','Best halal cake shop in Coimbra & Dublin. Custom artisan cakes from €19.99/kg. 5 Stars on Google.','https://bismitreats.com/icon-512.png','/about',schema,body);
}

function generateHowToOrderPage(){
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'HowTo','name':'How to Order from Bismi Treats','step':[{'@type':'HowToStep','name':'Browse Cakes','text':'Visit bismitreats.com and browse our cake designs'},{'@type':'HowToStep','name':'Fill Order Form','text':'Click any cake and fill our interactive order form at bismitreats.com/customer-form.html'},{'@type':'HowToStep','name':'See Price & Send','text':'Review your estimated price and send your order summary on WhatsApp'},{'@type':'HowToStep','name':'We Confirm','text':'We confirm your order within 2 hours and deliver fresh to your door'}]});
  const body=`
<div class="container">
  <a href="/" class="back-btn">← Back to Bismi Treats</a>
  <div class="section-title">How to Order</div>
  <div class="info-card"><div class="info-title">1. Browse Our Cakes</div><div class="info-text">Visit <a href="/">bismitreats.com</a> and explore our cake designs.</div></div>
  <div class="info-card"><div class="info-title">2. Fill Our Interactive Form</div><div class="info-text">Click any cake and fill our order form. Choose cake type, filling, size and message. See your live price estimate.</div></div>
  <div class="info-card"><div class="info-title">3. See Your Price & Send</div><div class="info-text">Review your estimated price, copy your order summary and send it to us on WhatsApp.</div></div>
  <div class="info-card"><div class="info-title">4. We Confirm & Deliver</div><div class="info-text">We confirm within 2 hours and deliver fresh to your door. Free delivery after 18:00 daily.</div></div>
  <a href="/customer-form.html" class="order-btn">🎂 Start Your Order</a>
  <a href="https://wa.me/351934453710" class="wa-btn">💬 Ask on WhatsApp</a>
</div>`;
  return pageShell('How to Order — Bismi Treats','How to order a custom cake from Bismi Treats. Fill our form, see your price, send on WhatsApp. We confirm in 2 hours.','https://bismitreats.com/icon-512.png','/how-to-order',schema,body);
}

function generateFillingsPage(flavours){
  const defaultFlavours=[{name:'Strawberry',emoji:'🍓'},{name:'Chocolate',emoji:'🍫'},{name:'White Chocolate',emoji:'🤍'},{name:'Lemon',emoji:'🍋'},{name:'Lime',emoji:'🍋'},{name:'Orange',emoji:'🍊'},{name:'Kiwi',emoji:'🥝'},{name:'Coconut',emoji:'🥥'},{name:'Pineapple',emoji:'🍍'},{name:'Cherry',emoji:'🍒'},{name:'Mango',emoji:'🥭'},{name:'Raspberry',emoji:'🍓'},{name:'Caramel',emoji:'🍯'},{name:'Red Fruits',emoji:'🍓'}];
  const list=flavours&&flavours.length>0?flavours:defaultFlavours;
  const schema=JSON.stringify({'@context':'https://schema.org','@type':'ItemList','name':'Bismi Treats Available Fillings','numberOfItems':list.length,'itemListElement':list.map((f,i)=>({'@type':'ListItem','position':i+1,'name':f.name}))});
  const chipsHtml=list.map(f=>`<div class="flavour-chip">${f.emoji||''} ${f.name}</div>`).join('');
  const body=`
<div class="container">
  <a href="/" class="back-btn">← Back to Bismi Treats</a>
  <div class="section-title">Available Fillings</div>
  <p style="font-size:.85rem;color:#6B7280;margin-bottom:16px">Over 2,580 flavour combinations. Choose chocolate or white chocolate first to unlock fruit combinations.</p>
  <div class="flavour-grid">${chipsHtml}</div>
  <div class="info-card"><div class="info-title">💡 Tip</div><div class="info-text">Want Chocolate + Fruit? Select Chocolate or White Chocolate first, then choose a fruit to combine with. Extra filling +€1.99.</div></div>
  <a href="/customer-form.html" class="order-btn">🎂 Order Your Cake</a>
</div>`;
  return pageShell('Available Fillings — Bismi Treats','2,580+ flavour combinations at Bismi Treats. Strawberry, Chocolate, Mango, Coconut and more. Custom artisan cakes Coimbra.','https://bismitreats.com/icon-512.png','/fillings',schema,body);
}

const server=http.createServer(async(req,res)=>{
  // ── HOSTNAME HANDLING ─────────────────────────────────────
  // Accept both bismitreats.com and www.bismitreats.com
  // Redirect .online and www to canonical domain
  const host = (req.headers.host || '').toLowerCase().split(':')[0];
  const VALID_HOSTS = [
    'bismitreats.com',
    'www.bismitreats.com',
    'bismitreats.online',
    'www.bismitreats.online',
    'bismitreats-production.up.railway.app',
    'localhost',
    '127.0.0.1'
  ];

  // Parse URL safely
  let parsedUrl;
  try { parsedUrl = new URL(req.url, 'http://localhost'); }
  catch(e) { parsedUrl = new URL('/', 'http://localhost'); }
  const pathname = parsedUrl.pathname;
  const search = parsedUrl.search || '';

  // Defensive: unknown host — still serve, don't crash
  const isKnownHost = VALID_HOSTS.some(h => host === h || host.endsWith('.' + h));

  // Redirect .online → .com (301 permanent)
  if(host.includes('bismitreats.online')){
    res.writeHead(301, {
      'Location': 'https://bismitreats.com' + pathname + search,
      'Cache-Control': 'no-cache'
    });
    res.end();
    return;
  }

  // Redirect www → non-www (301 permanent)
  if(host === 'www.bismitreats.com'){
    res.writeHead(301, {
      'Location': 'https://bismitreats.com' + pathname + search,
      'Cache-Control': 'no-cache'
    });
    res.end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  const url=req.url.split('?')[0];
  // ── ANALYTICS ──────────────────────────────────────────────
function trackVisit(req){
  if(!db)return;
  setImmediate(function(){
    try{
      const now=new Date();
      const dateKey=now.toISOString().split('T')[0];
      const hour=now.getHours();
      const ua=(req.headers&&req.headers['user-agent'])||'';
      const isMobile=/mobile|android|iphone|ipad/i.test(ua);
      const inc={visits:1,mobile:isMobile?1:0,desktop:isMobile?0:1};
      inc['hours.h'+hour]=1;
      db.collection('analytics').updateOne(
        {date:dateKey},
        {$inc:inc,$set:{date:dateKey,month:dateKey.slice(0,7)}},
        {upsert:true}
      ).catch(function(){});
    }catch(e){}
  });
}

  if(url==='/api/analytics'&&req.method==='GET'){
    if(!db)return jsonRes(res,{error:'no db'});
    try{
      const qdays=url.includes('?')?parseInt(url.split('days=')[1]||'30'):30;
      const days=isNaN(qdays)?30:qdays;
      const since=new Date();since.setDate(since.getDate()-days);
      const sinceKey=since.toISOString().split('T')[0];
      const data=await db.collection('analytics').find({date:{$gte:sinceKey}}).sort({date:1}).toArray();
      const today=new Date().toISOString().split('T')[0];
      const todayDoc=data.find(d=>d.date===today)||{visits:0,mobile:0,desktop:0};
      const total=data.reduce((s,d)=>s+(d.visits||0),0);
      const totalMobile=data.reduce((s,d)=>s+(d.mobile||0),0);
      const currentHour=new Date().getHours();
      const liveDoc=await db.collection('analytics').findOne({date:today});
      const liveVisits=liveDoc&&liveDoc.hours?liveDoc.hours['h'+currentHour]||0:0;
      const monthly=Object.values(data.reduce((acc,d)=>{
        const m=d.month||d.date.slice(0,7);
        if(!acc[m])acc[m]={month:m,visits:0};
        acc[m].visits+=(d.visits||0);
        return acc;
      },{})).sort((a,b)=>a.month.localeCompare(b.month));
      return jsonRes(res,{total,totalMobile,totalDesktop:total-totalMobile,
        today:todayDoc.visits||0,liveVisits,
        daily:data.map(d=>({date:d.date,visits:d.visits||0,mobile:d.mobile||0})),monthly});
    }catch(e){return jsonRes(res,{error:e.message});}
  }

  // Serve llms.txt for AI search engines
  if(url==='/llms.txt'||url==='/ai'||url==='/ai.txt'){
    const llmsPath=path.join(__dirname,'llms.txt');
    if(fs.existsSync(llmsPath)){
      res.writeHead(200,{'Content-Type':'text/plain;charset=utf-8','Cache-Control':'public,max-age=3600'});
      res.end(fs.readFileSync(llmsPath,'utf8'));
      return;
    }
  }
  if(url==='/api/health')return jsonRes(res,{ok:true,db:db?'mongodb':'file',s3:!!S3,bucket:BUCKET_NAME||'not set',time:new Date()});

  if(url==='/api/likes'&&req.method==='GET'){
    try{if(db){const doc=await db.collection('catalogue').findOne({key:'main'});return jsonRes(res,(doc&&doc.likes)||{});}return jsonRes(res,{});}catch(e){return jsonRes(res,{});}
  }
  if(url==='/api/likes'&&req.method==='POST'){
    try{const body=await parseBody(req);if(db){await db.collection('catalogue').updateOne({key:'main'},{$set:{likes:body}},{upsert:true});return jsonRes(res,{ok:true});}return jsonRes(res,{ok:false});}catch(e){return jsonRes(res,{error:e.message},500);}
  }
  if(url==='/api/form-config'){
    if(req.method==='GET'){
      try{
        if(db){
          const doc=await db.collection('form_config').findOne({_id:'main'});
          return jsonRes(res,doc||{});
        }
        return jsonRes(res,{});
      }catch(e){return jsonRes(res,{});}
    }
    if(req.method==='POST'){
      try{
        const data=await parseBody(req);
        const parsed=typeof data==='string'?JSON.parse(data):data;
        if(db){
          await db.collection('form_config').updateOne(
            {_id:'main'},
            {$set:{...parsed,_id:'main',updatedAt:new Date()}},
            {upsert:true}
          );
        }
        return jsonRes(res,{ok:true});
      }catch(e){return jsonRes(res,{error:e.message},500);}
    }
  }
  if(url==='/api/debug-catalogue'){
    if(db){
      const cat=await db.collection('catalogue').findOne({key:'main'});
      return jsonRes(res,{
        hasCatalogue:!!cat,
        cakeCount:cat&&cat.cakes?cat.cakes.length:0,
        cakes:cat&&cat.cakes?cat.cakes.map(c=>({id:c.id,name:c.nameEn||c.name,photos:c.photos?c.photos.length:0,code:c.code})):[],
        updatedAt:cat&&cat.updatedAt
      });
    }
    return jsonRes(res,{error:'no db'});
  }
  if(url==='/api/debug-hero'){
    if(db){
      const cat=await db.collection('catalogue').findOne({key:'main'});
      const heroImg=cat&&cat.business?cat.business.heroImg:null;
      return jsonRes(res,{ok:true,heroImg:heroImg,s3:!!S3,bucket:BUCKET_NAME||'not set'});
    }
    return jsonRes(res,{ok:false,error:'no db'});
  }
  // Show stored photo URLs from MongoDB
  if(url==='/api/debug-urls'){
    if(db){
      const cat=await db.collection('catalogue').findOne({key:'main'});
      const urls=(cat&&cat.cakes)?cat.cakes.map(c=>({name:c.nameEn||c.name,photos:c.photos||[]})):[];
      return jsonRes(res,{ok:true,cakes:urls});
    }
    return jsonRes(res,{ok:false,error:'no db'});
  }
  // Debug: test S3 key listing
  if(url==='/api/debug-photos'){
    if(S3&&BUCKET_NAME){
      try{
        const {ListObjectsV2Command}=require('@aws-sdk/client-s3');
        const list=await S3.send(new ListObjectsV2Command({Bucket:BUCKET_NAME,Prefix:'photos/',MaxKeys:5}));
        return jsonRes(res,{ok:true,files:(list.Contents||[]).map(f=>f.Key)});
      }catch(e){return jsonRes(res,{ok:false,error:e.message});}
    }
    return jsonRes(res,{ok:false,error:'S3 not configured',S3:!!S3,BUCKET:BUCKET_NAME});
  }
  if(url==='/api/orders'&&req.method==='GET'){if(db)return jsonRes(res,await db.collection('orders').find({}).sort({createdAt:-1}).toArray());return jsonRes(res,loadFile(ORDERS_FILE));}
  if(url==='/api/orders'&&req.method==='POST'){const body=await parseBody(req);if(db){if(Array.isArray(body)){for(const o of body){const {_id,...safeO}=o;await db.collection('orders').updateOne({id:o.id},{$set:{...safeO,updatedAt:new Date()}},{upsert:true});}emit('orders-updated',{});return jsonRes(res,{ok:true});}const {_id,...safeBody}=body;const o={...safeBody,createdAt:body.createdAt||new Date(),updatedAt:new Date()};await db.collection('orders').updateOne({id:o.id},{$set:o},{upsert:true});emit('new-order',o);return jsonRes(res,o,201);}if(Array.isArray(body)){saveFile(ORDERS_FILE,body);return jsonRes(res,{ok:true});}const orders=loadFile(ORDERS_FILE);const i=orders.findIndex(o=>o.id===body.id);if(i>=0)orders[i]=body;else orders.push(body);saveFile(ORDERS_FILE,orders);return jsonRes(res,body,201);}
  if(url.startsWith('/api/orders/')&&req.method==='PUT'){const id=parseInt(url.split('/').pop());const body=await parseBody(req);if(db){const r=await db.collection('orders').findOneAndUpdate({id},{$set:{...body,updatedAt:new Date()}},{returnDocument:'after'});if(r){emit('order-updated',r);return jsonRes(res,r);}return jsonRes(res,{error:'Not found'},404);}const orders=loadFile(ORDERS_FILE);const i=orders.findIndex(o=>o.id===id);if(i>=0){orders[i]={...orders[i],...body};saveFile(ORDERS_FILE,orders);return jsonRes(res,orders[i]);}return jsonRes(res,{error:'Not found'},404);}
  if(url.startsWith('/api/orders/')&&req.method==='DELETE'){const id=parseInt(url.split('/').pop());if(db){await db.collection('orders').deleteOne({id});emit('order-deleted',{id});return jsonRes(res,{ok:true});}saveFile(ORDERS_FILE,loadFile(ORDERS_FILE).filter(o=>o.id!==id));return jsonRes(res,{ok:true});}
  if(url==='/api/customer-requests'&&req.method==='GET'){if(db)return jsonRes(res,await db.collection('customer_requests').find({}).sort({submittedAt:-1}).toArray());return jsonRes(res,loadFile(REQS_FILE));}
  if(url==='/api/customer-requests'&&req.method==='POST'){const body=await parseBody(req);if(db){const {_id,...safeReq}=body;const doc={...safeReq,submittedAt:body.submittedAt||new Date(),updatedAt:new Date()};await db.collection('customer_requests').updateOne({id:body.id},{$set:doc},{upsert:true});emit('new-request',doc);return jsonRes(res,doc,201);}const reqs=loadFile(REQS_FILE);const i=reqs.findIndex(r=>r.id===body.id);if(i>=0)reqs[i]=body;else reqs.push(body);saveFile(REQS_FILE,reqs);return jsonRes(res,body,201);}
  if(url.startsWith('/api/customer-requests/')&&req.method==='DELETE'){const id=parseInt(url.split('/').pop());if(db){await db.collection('customer_requests').deleteOne({id});return jsonRes(res,{ok:true});}saveFile(REQS_FILE,loadFile(REQS_FILE).filter(r=>r.id!==id));return jsonRes(res,{ok:true});}
  if(url==='/api/catalogue'&&req.method==='GET'){if(db)return jsonRes(res,await db.collection('catalogue').findOne({key:'main'})||{});return jsonRes(res,{});}
  if(url==='/api/catalogue'&&req.method==='POST'){const body=await parseBody(req);if(db){try{const {_id,...bodyNoId}=body;await db.collection('catalogue').updateOne({key:'main'},{$set:{...bodyNoId,updatedAt:new Date()}},{upsert:true});emit('catalogue-updated',{});return jsonRes(res,{ok:true});}catch(e){console.error('Catalogue save error:',e.message);return jsonRes(res,{ok:false,error:e.message});}}return jsonRes(res,{ok:false,error:'No database connection'});}
  if(url==='/api/customers'&&req.method==='GET'){if(db)return jsonRes(res,await db.collection('customers').find({}).toArray());return jsonRes(res,[]);}
  if(url==='/api/customers'&&req.method==='POST'){const body=await parseBody(req);if(db){const {_id:_cid,...safeCust}=body;await db.collection('customers').updateOne({email:body.email},{$set:{...safeCust,updatedAt:new Date()}},{upsert:true});return jsonRes(res,{ok:true},201);}return jsonRes(res,{ok:true});}
  if(url==='/api/stats'){if(db){const[oc,rc,cc]=await Promise.all([db.collection('orders').countDocuments(),db.collection('customer_requests').countDocuments(),db.collection('customers').countDocuments()]);return jsonRes(res,{orders:oc,requests:rc,customers:cc,db:'mongodb'});}return jsonRes(res,{orders:loadFile(ORDERS_FILE).length,requests:loadFile(REQS_FILE).length,customers:0,db:'file'});}
  if(url==='/api/backup'&&req.method==='POST'){if(db){const[orders,requests,customers]=await Promise.all([db.collection('orders').find({}).toArray(),db.collection('customer_requests').find({}).toArray(),db.collection('customers').find({}).toArray()]);ensureDir();const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);const file=path.join(DATA_DIR,'backup-'+ts+'.json');fs.writeFileSync(file,JSON.stringify({orders,requests,customers,at:new Date()},null,2));return jsonRes(res,{ok:true,counts:{orders:orders.length,requests:requests.length,customers:customers.length}});}return jsonRes(res,{ok:false});}

  // Admin login - sets session cookie
  if(url==='/api/admin-login'&&req.method==='POST'){
    const body=await parseBody(req);
    const validUsers=[{user:'Tahmidul',pass:'78674233'},{user:'admin',pass:'admin'}];
    const valid=validUsers.some(u=>u.user===body.username&&u.pass===body.password);
    if(valid){
      const sessionId='bismi_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      res.setHeader('Set-Cookie','bismiSession='+sessionId+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400');
      return jsonRes(res,{ok:true});
    }
    return jsonRes(res,{ok:false,error:'Invalid credentials'},{status:401});
  }
  // Admin logout - clears cookie
  if(url==='/api/admin-logout'&&req.method==='POST'){
    res.setHeader('Set-Cookie','bismiSession=; Path=/; HttpOnly; Max-Age=0');
    return jsonRes(res,{ok:true});
  }
  
  // Photos API - store order photos in MongoDB
  if(url.startsWith('/uploads/orders/')&&req.method==='GET'){
    // Serve order photos from orders bucket (staff only — add auth check if needed)
    try{
      const key='orders/'+url.replace('/uploads/orders/','');
      const photoUrl=ORDERS_BUCKET_ENDPOINT+'/'+ORDERS_BUCKET_NAME+'/'+key;
      const proxyRes=await fetch(photoUrl);
      if(!proxyRes.ok)return jsonRes(res,{error:'Not found'},404);
      const buf=await proxyRes.arrayBuffer();
      const ct=proxyRes.headers.get('content-type')||'image/jpeg';
      res.writeHead(200,{'Content-Type':ct,'Cache-Control':'private,max-age=3600'});
      res.end(Buffer.from(buf));
      return;
    }catch(e){return jsonRes(res,{error:'Photo error'},500);}
  }
  if(url.startsWith('/api/photos/')&&req.method==='GET'){
    const orderId=url.split('/')[3];
    if(db){const doc=await db.collection('photos').findOne({orderId});return jsonRes(res,doc?doc.photos:[]);}
    return jsonRes(res,[]);
  }
  if(url.startsWith('/api/photos/')&&req.method==='POST'){
    const orderId=url.split('/')[3];
    const body=await parseBody(req);
    if(db){await db.collection('photos').updateOne({orderId},{$set:{orderId,photos:body,updatedAt:new Date()}},{upsert:true});}
    return jsonRes(res,{ok:true});
  }
  // Calendar access API
  if(url==='/api/calendar-access'&&req.method==='GET'){
    if(db){const doc=await db.collection('settings').findOne({key:'calendarAccess'});return jsonRes(res,doc?doc.data:{});}
    return jsonRes(res,{});
  }
  if(url==='/api/calendar-access'&&req.method==='POST'){
    const body=await parseBody(req);
    if(db){await db.collection('settings').updateOne({key:'calendarAccess'},{$set:{key:'calendarAccess',data:body,updatedAt:new Date()}},{upsert:true});}
    return jsonRes(res,{ok:true});
  }
  
  // Photo upload endpoint - saves to Railway Bucket (S3)
  if(url==='/api/upload-order-photo'&&req.method==='POST'){
    // Upload to ORDERS bucket - reuse same multipart logic as upload-photo
    // but target the orders bucket
    try{
      const result=await handlePhotoUpload(req,'orders',ORDERS_BUCKET_NAME,ORDERS_BUCKET_KEY,ORDERS_BUCKET_SECRET,ORDERS_BUCKET_ENDPOINT);
      if(result.error)return jsonRes(res,{error:result.error},500);
      return jsonRes(res,{url:'/uploads/orders/'+result.filename,key:result.key});
    }catch(e){return jsonRes(res,{error:e.message},500);}
  }
  if(url==='/api/upload-photo'&&req.method==='POST'){
    // Upload to PRODUCTS bucket
    try{
      const result=await handlePhotoUpload(req,'photos',PRODUCTS_BUCKET_NAME,PRODUCTS_BUCKET_KEY,PRODUCTS_BUCKET_SECRET,PRODUCTS_BUCKET_ENDPOINT);
      if(result.error)return jsonRes(res,{error:result.error},500);
      const proxyUrl='/uploads/photos/'+result.filename;
      return jsonRes(res,{url:proxyUrl,key:result.key});
    }catch(e){console.error('Photo upload error:',e.message);return jsonRes(res,{error:e.message},500);}
  }
  if(url==='/api/notifications'&&req.method==='GET'){
    if(db){const doc=await db.collection('settings').findOne({key:'notifications'});return jsonRes(res,doc?doc.data:[]);}
    return jsonRes(res,[]);
  }
  if(url==='/api/notifications'&&req.method==='POST'){
    const body=await parseBody(req);
    if(db){await db.collection('settings').updateOne({key:'notifications'},{$set:{key:'notifications',data:body,updatedAt:new Date()}},{upsert:true});}
    return jsonRes(res,{ok:true});
  }
  
  // Profiles API
  if(url==='/api/profiles'&&req.method==='GET'){
    if(db){const doc=await db.collection('settings').findOne({key:'profiles'});return jsonRes(res,doc?doc.data:[]);}
    return jsonRes(res,[]);
  }
  if(url==='/api/profiles'&&req.method==='POST'){
    const body=await parseBody(req);
    if(db){await db.collection('settings').updateOne({key:'profiles'},{$set:{key:'profiles',data:Array.isArray(body)?body:(body.data||body),updatedAt:new Date()}},{upsert:true});}
    return jsonRes(res,{ok:true});
  }
  // Activity Log API
  if(url==='/api/activity-log'&&req.method==='GET'){
    if(db){const doc=await db.collection('settings').findOne({key:'activityLog'});return jsonRes(res,doc?doc.data:[]);}
    return jsonRes(res,[]);
  }
  if(url==='/api/activity-log'&&req.method==='POST'){
    const body=await parseBody(req);
    if(db){await db.collection('settings').updateOne({key:'activityLog'},{$set:{key:'activityLog',data:body,updatedAt:new Date()}},{upsert:true});}
    return jsonRes(res,{ok:true});
  }
  // Login History API
  if(url==='/api/login-history'&&req.method==='GET'){
    if(db){const doc=await db.collection('settings').findOne({key:'loginHistory'});return jsonRes(res,doc?doc.data:[]);}
    return jsonRes(res,[]);
  }
  if(url==='/api/login-history'&&req.method==='POST'){
    const body=await parseBody(req);
    if(db){await db.collection('settings').updateOne({key:'loginHistory'},{$set:{key:'loginHistory',data:body,updatedAt:new Date()}},{upsert:true});}
    return jsonRes(res,{ok:true});
  }
  // Recycle Bin API
  if(url==='/api/recycle-bin'&&req.method==='GET'){
    if(db){const doc=await db.collection('settings').findOne({key:'recycleBin'});return jsonRes(res,doc?doc.data:[]);}
    return jsonRes(res,[]);
  }
  if(url==='/api/recycle-bin'&&req.method==='POST'){
    const body=await parseBody(req);
    if(db){await db.collection('settings').updateOne({key:'recycleBin'},{$set:{key:'recycleBin',data:body,updatedAt:new Date()}},{upsert:true});}
    return jsonRes(res,{ok:true});
  }

  // ── RESERVED DAYS API ──────────────────────────────────────
  if(url==='/api/reserved-days'&&req.method==='GET'){
    if(db){
      const days=await db.collection('reserved_days').find({}).toArray();
      return jsonRes(res,{reserved:days.map(d=>d.date)});
    }
    return jsonRes(res,{reserved:[]});
  }
  if(url==='/api/reserved-days'&&req.method==='POST'){
    const body=await parseBody(req);
    if(!body.date)return jsonRes(res,{ok:false,error:'date required'},400);
    if(db){
      await db.collection('reserved_days').updateOne({date:body.date},{$set:{date:body.date,reason:body.reason||'',createdAt:new Date()}},{upsert:true});
      return jsonRes(res,{ok:true});
    }
    return jsonRes(res,{ok:false,error:'no db'});
  }
  if(url==='/api/reserved-days'&&req.method==='DELETE'){
    const body=await parseBody(req);
    if(!body.date)return jsonRes(res,{ok:false,error:'date required'},400);
    if(db){
      await db.collection('reserved_days').deleteOne({date:body.date});
      return jsonRes(res,{ok:true});
    }
    return jsonRes(res,{ok:false,error:'no db'});
  }


  // ── PAGE ROUTES ───────────────────────────────────────────────

  // /gallery

  if(url==='/sitemap.xml'){
    try{
      let items=[];
      if(db){const doc=await db.collection('catalogue').findOne({key:'main'});if(doc)items=[...(doc.cakes||[]),...(doc.accessories||[])];}
      const base='https://bismitreats.com';
      const today=new Date().toISOString().split('T')[0];
      let xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';
      const statics=[{loc:'/',p:'1.0'},{loc:'/customer-form.html',p:'0.9'},{loc:'/gallery',p:'0.9'},{loc:'/about',p:'0.8'},{loc:'/how-to-order',p:'0.8'},{loc:'/fillings',p:'0.7'}];
      for(const s of statics)xml+=`<url><loc>${base}${s.loc}</loc><lastmod>${today}</lastmod><priority>${s.p}</priority></url>`;
      for(const p of items){
        const cat=p.category==='accessories'?'accessories':'cakes';
        const sl=slugify(p.nameEn||p.name||'')+(p.code?'-'+p.code.toLowerCase():'');
        const img=p.photos&&p.photos.length>0?getProductImage(p):'';
        xml+=`<url><loc>${base}/products/${cat}/${sl}</loc><lastmod>${today}</lastmod><priority>0.8</priority>${img?`<image:image><image:loc>${img}</image:loc><image:title>${(p.nameEn||p.name||'').replace(/&/g,'&amp;')}</image:title></image:image>`:''}</url>`;
      }
      xml+='</urlset>';
      res.writeHead(200,{'Content-Type':'application/xml','Cache-Control':'public,max-age=3600'});
      res.end(xml);return;
    }catch(e){console.error('Sitemap error:',e.message);}
  }
  if(url==='/gallery'||url==='/gallery/'){
    try{
      let cakes=[];
      if(db){const doc=await db.collection('catalogue').findOne({key:'main'});if(doc&&doc.cakes)cakes=doc.cakes.filter(c=>c.photos&&c.photos.length>0&&c.category!=='accessories');}
      const schema=JSON.stringify({'@context':'https://schema.org','@type':'ImageGallery','name':'Bismi Treats Cake Gallery','description':'Browse our full gallery of artisan cakes. Custom birthday cakes, floral cakes, drip cakes and more.','url':'https://bismitreats.com/gallery'});
      const imagesHtml=cakes.map(c=>{
        const name=c.nameEn||c.name||'Artisan Cake';
        const img=getProductImage(c);
        const cat=c.category==='accessories'?'accessories':'cakes';
        const sl=slugify(name)+(c.code?'-'+c.code.toLowerCase():'');
        return '<a href="/products/'+cat+'/'+sl+'" class="gi"><img src="'+img+'" alt="'+name+' Bismi Treats" loading="lazy"/><div class="gin">'+name+'</div></a>';
      }).join('');
      const html='<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Cake Gallery — Bismi Treats Coimbra &amp; Dublin</title><meta name="description" content="Browse '+cakes.length+'+ artisan cake designs. Custom birthday cakes, floral cakes, chocolate drip cakes. Order any design. Bismi Treats Coimbra &amp; Dublin."/><meta property="og:title" content="Cake Gallery — Bismi Treats"/><meta property="og:image" content="'+(cakes.length>0?getProductImage(cakes[0]):'https://bismitreats.com/icon-512.png')+'"/><link rel="canonical" href="https://bismitreats.com/gallery"/><script type="application/ld+json">'+schema+'</script><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#FAFAFA}.hdr{background:white;border-bottom:1px solid rgba(0,0,0,.06);padding:14px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:10}.hdr img{width:32px;height:32px;border-radius:50%;object-fit:cover}.hdr-name{font-size:.9rem;font-weight:700;color:#111}.hero{background:linear-gradient(135deg,#111,#333);color:white;padding:28px 16px;text-align:center}.hero h1{font-size:1.5rem;font-weight:800;margin-bottom:8px}.hero p{font-size:.85rem;opacity:.8;margin-bottom:16px}.tip{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:12px;font-size:.8rem;margin-bottom:16px;line-height:1.6}.tip strong{color:#f59e0b}.btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.btn-o{background:white;color:#111;padding:10px 20px;border-radius:9999px;font-size:.85rem;font-weight:700;text-decoration:none}.btn-w{background:#25d366;color:white;padding:10px 20px;border-radius:9999px;font-size:.85rem;font-weight:700;text-decoration:none}.cnt{text-align:center;padding:12px;font-size:.78rem;color:#9CA3AF}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:3px;padding:3px;max-width:800px;margin:0 auto}@media(min-width:600px){.grid{grid-template-columns:repeat(3,1fr)}}@media(min-width:900px){.grid{grid-template-columns:repeat(4,1fr)}}.gi{position:relative;aspect-ratio:1;overflow:hidden;background:#f0f0f0;text-decoration:none;display:block}.gi img{width:100%;height:100%;object-fit:cover;transition:transform .3s}.gi:hover img{transform:scale(1.05)}.gin{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,.7),transparent);color:white;font-size:.68rem;font-weight:600;padding:16px 6px 6px;opacity:0;transition:opacity .2s}.gi:hover .gin{opacity:1}.ftr{text-align:center;padding:20px;color:#9CA3AF;font-size:.72rem;border-top:1px solid rgba(0,0,0,.06);margin-top:12px}</style></head><body><div class="hdr"><img src="/icon-192.png" alt="Bismi Treats"/><div class="hdr-name">Bismi Treats</div></div><div class="hero"><h1>Our Cake Gallery</h1><p>Browse '+cakes.length+'+ artisan cake designs. Every cake is custom-made fresh for you.</p><div class="tip"><strong>💡 Tip:</strong> Browsing the gallery is the best way to choose your cake design. Find one you love, tap it to order that exact design with your choice of filling and size.</div><div class="btns"><a href="/customer-form.html" class="btn-o">🎂 Order a Cake</a><a href="https://wa.me/351934453710" class="btn-w">💬 WhatsApp Us</a></div></div><div class="cnt">'+cakes.length+' cake designs · Tap any cake to order it</div><div class="grid">'+imagesHtml+'</div><div class="ftr">❤️ Made with love by <strong>Bismi Treats</strong> · <a href="https://bismitreats.com" style="color:#A07840">bismitreats.com</a><br/>+351 934 453 710 · bismitreats.pt@gmail.com · Coimbra, Portugal</div></body></html>';
      res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'public,max-age=300'});
      res.end(html);return;
    }catch(e){console.error('Gallery error:',e.message);}
  }



  // ── UPLOADS PROXY ─────────────────────────────────────────────
  if(url.startsWith('/uploads/')){
    try{
      const parts=url.replace('/uploads/','').split('/');
      const folder=parts[0];
      const filename=parts.slice(1).join('/');
      if(!filename)return jsonRes(res,{error:'No filename'},400);
      let bucketName,bucketEndpoint;
      if(folder==='orders'){
        bucketName=ORDERS_BUCKET_NAME;bucketEndpoint=ORDERS_BUCKET_ENDPOINT;
      }else{
        bucketName=PRODUCTS_BUCKET_NAME;bucketEndpoint=PRODUCTS_BUCKET_ENDPOINT;
      }
      const key=folder+'/'+filename;
      // Try public URL first (fastest, no auth needed if bucket is public)
      const publicUrl=bucketEndpoint+'/'+bucketName+'/'+key;
      try{
        const pubRes=await fetch(publicUrl,{signal:AbortSignal.timeout(8000)});
        if(pubRes.ok){
          const buf=await pubRes.arrayBuffer();
          const ct=pubRes.headers.get('content-type')||'image/jpeg';
          res.writeHead(200,{'Content-Type':ct,'Cache-Control':'public,max-age=86400','Access-Control-Allow-Origin':'*'});
          res.end(Buffer.from(buf));return;
        }
      }catch(e2){}
      // Fallback: try with auth
      const crypto=require('crypto');
      const date=new Date().toUTCString();
      const bKey=folder==='orders'?ORDERS_BUCKET_KEY:PRODUCTS_BUCKET_KEY;
      const bSecret=folder==='orders'?ORDERS_BUCKET_SECRET:PRODUCTS_BUCKET_SECRET;
      const sig=crypto.createHmac('sha1',bSecret).update('GET\n\n\n'+date+'\n/'+bucketName+'/'+key).digest('base64');
      const authRes=await fetch(publicUrl,{headers:{'Date':date,'Authorization':'AWS '+bKey+':'+sig},signal:AbortSignal.timeout(8000)});
      if(!authRes.ok){console.warn('Photo not found:',key);return jsonRes(res,{error:'Not found'},404);}
      const buf2=await authRes.arrayBuffer();
      const ct2=authRes.headers.get('content-type')||'image/jpeg';
      res.writeHead(200,{'Content-Type':ct2,'Cache-Control':'public,max-age=86400','Access-Control-Allow-Origin':'*'});
      res.end(Buffer.from(buf2));return;
    }catch(e){console.error('Upload proxy error:',e.message);return jsonRes(res,{error:'Photo error'},500);}
  }

    // ── GALLERY — redirect to main site with gallery mode ──────────
  if(url==='/gallery'||url==='/gallery/'){
    // Redirect to main site — gallery mode is handled by JS
    res.writeHead(302,{'Location':'/?view=gallery'});
    res.end();
    return;
  }

    // /about
  if(url==='/about'||url==='/about/'){
    const html=generateAboutPage({});
    res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'public,max-age=300'});
    res.end(html);return;
  }

  // /how-to-order
  if(url==='/how-to-order'||url==='/how-to-order/'){
    const html=generateHowToOrderPage();
    res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'public,max-age=300'});
    res.end(html);return;
  }

  // /fillings
  if(url==='/fillings'||url==='/fillings/'){
    try{
      let flavours=[];
      if(db){const doc=await db.collection('catalogue').findOne({key:'main'});if(doc&&doc.flavours)flavours=doc.flavours;}
      const html=generateFillingsPage(flavours);
      res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'public,max-age=300'});
      res.end(html);return;
    }catch(e){const html=generateFillingsPage([]);res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(html);return;}
  }

  // /products/cakes/slug or /products/accessories/slug
  if(url.startsWith('/products/')){
    try{
      const parts=url.split('/').filter(Boolean);
      const category=parts[1]||'cakes';
      const slug=parts[2]||'';
      let catalogue={};
      if(db){const doc=await db.collection('catalogue').findOne({key:'main'});if(doc)catalogue=doc;}
      const allItems=[...(catalogue.cakes||[]),...(catalogue.accessories||[])];
      const product=allItems.find(function(p){
        const pName=p.nameEn||p.name||'';
        const pSlug=slugify(pName)+(p.code?'-'+p.code.toLowerCase():'');
        const pSlug2=slugify(pName);
        const pCode=(p.code||'').toLowerCase();
        return slug===pSlug||slug===pSlug2||slug===pCode||slug.endsWith('-'+(p.code||'').toLowerCase());
      });
      if(!product){
        res.writeHead(302,{'Location':'/'});res.end();return;
      }
      const html=generateProductPage(product,category,catalogue.business||{});
      res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'public,max-age=300'});
      res.end(html);return;
    }catch(e){console.error('Product page error:',e.message);res.writeHead(302,{'Location':'/'});res.end();return;}
  }

    let fp=path.join(__dirname,url==='/'?'website.html':url);
  if(url==='/'||url==='/website.html')trackVisit(req);if(!path.extname(fp))fp+='.html';
  // Protect admin pages - require session cookie
  const protectedPages=['admin.html','kitchen.html','delivery.html','counter.html']; // catalogue-admin.html has its own login
  const reqFile=path.basename(fp);
  if(protectedPages.includes(reqFile)){
    const cookies=req.headers.cookie||'';
    const hasSession=cookies.includes('bismiSession=') || cookies.includes('bismiAuth=');
    // Also allow if referer is from our site (basic check)
    const referer=req.headers.referer||'';
    const hasReferer=referer.includes('bismitreats') || referer.includes('localhost') || referer.includes('railway.app');
    if(!hasSession && !hasReferer){
      res.writeHead(302,{'Location':'/login.html'});res.end();return;
    }
  }
  if(fs.existsSync(fp))return serveFile(res,fp);serveFile(res,path.join(__dirname,'catalogue.html'));
});
async function start(){ensureDir();await connectMongo();await initS3();try{const{Server}=require('socket.io');io=new Server(server,{cors:{origin:'*'}});io.on('connection',s=>{console.log('Client:',s.id);s.on('disconnect',()=>console.log('Left:',s.id));});console.log('Socket.io ready');}catch(e){console.log('Socket.io skip:',e.message);}server.on('error', (err) => { console.error('[Server Error]', err.message); });
server.listen(PORT,'0.0.0.0',()=>{console.log('Bismi Treats on port '+PORT+' | DB: '+(db?'MongoDB':'File'));});}
start()
;