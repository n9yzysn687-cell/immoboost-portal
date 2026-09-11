const CACHE="her12-v5";
const CORE=[
  "./","./index.html","./styles-v2.css","./program-v2.js","./runtime-v2.js","./manifest.webmanifest","./icon.svg","./apple-touch-icon.png",
  "./assets/hero.jpg","./assets/hip_thrust.jpg","./assets/rdl.jpg","./assets/bulgarian.jpg","./assets/hip_abduction.jpg",
  "./assets/lat_pulldown.jpg","./assets/seated_row.jpg","./assets/chest_press.jpg","./assets/triceps_pushdown.jpg","./assets/lateral_raise.jpg",
  "./assets/overhead_triceps.jpg","./assets/pallof_press.jpg","./assets/leg_press.jpg","./assets/step_up.jpg","./assets/cable_kickback.jpg","./assets/reverse_crunch.jpg"
];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;const url=new URL(event.request.url),isLocal=url.origin===self.location.origin;if(isLocal){event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{})}return response}).catch(()=>caches.match("./index.html"))));return}event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)))})
