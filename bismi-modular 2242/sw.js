var CACHE='bismi-v4';
var STATIC=['/','/website.html','/css/style.css','/js/data.js','/js/utils.js',
  '/js/navigation.js','/js/catalogue.js','/js/ranking.js','/js/app.js','/manifest.json'];

self.addEventListener('install',function(e){
  self.skipWaiting();
  // Cache each file individually — don't fail if one is missing
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.allSettled(
        STATIC.map(function(url){
          return c.add(url).catch(function(err){
            console.warn('[SW] Failed to cache:',url,err.message);
          });
        })
      );
    })
  );
});

self.addEventListener('activate',function(e){
  self.clients.claim();
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);})
      );
    })
  );
});

self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=e.request.url;
  // Skip non-http requests
  if(!url.startsWith('http'))return;
  // Network first for API calls
  if(url.includes('/api/')||url.includes('/uploads/')){
    e.respondWith(
      fetch(e.request).catch(function(){
        return caches.match(e.request)||new Response('{}',{headers:{'Content-Type':'application/json'}});
      })
    );
    return;
  }
  // Cache first for static assets
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached)return cached;
      return fetch(e.request).then(function(r){
        if(r&&r.status===200&&r.type!=='opaque'){
          var rc=r.clone();
          caches.open(CACHE).then(function(c){c.put(e.request,rc);});
        }
        return r;
      }).catch(function(){
        // Return cached homepage as fallback
        return caches.match('/website.html');
      });
    })
  );
});
