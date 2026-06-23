const CACHE = "fellowship-v1"
const PRECACHE = ["/", "/manifest.json"]

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) { return cache.addAll(PRECACHE) })
  )
  self.skipWaiting()
})

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE }).map(function(k) { return caches.delete(k) }))
    })
  )
  self.clients.claim()
})

self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return
  if (e.request.url.includes("supabase")) return
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone()
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone) })
        }
        return response
      }).catch(function() { return cached })
    })
  )
})
