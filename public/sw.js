// Simple service worker for PWA functionality
const CACHE_NAME = 'campus-deal-v1';

// Install event - cache important resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll([
          '/logo.png',
          '/manifest.json'
        ]);
      })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip caching for HTML and JS files to avoid loading issues
  if (event.request.url.includes('.html') || 
      event.request.url.includes('.js') || 
      event.request.url.includes('.css')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 