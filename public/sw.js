// Empty service worker to satisfy browser requests and avoid 404s
// during development and migration.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
