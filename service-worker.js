const CACHE_NAME = 'electronic-kitchen-kawaii-v15'
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/app-icon-192.png',
  './assets/app-icon-512.png',
  './assets/kawaii-bg.png',
  './assets/home-badge.png',
  './assets/rabbit-spatula.png',
  './assets/tiger-chef.png',
  './assets/dinner-badge.png',
  './assets/menu-tab.png',
  './assets/fridge-tab.png',
  './assets/image 提醒.png',
  './assets/reminder-badge.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
