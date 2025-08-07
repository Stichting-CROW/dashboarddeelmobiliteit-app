/* eslint-disable no-restricted-globals, no-unused-expressions */
// This service worker is intentionally minimal to prevent reload issues
// while still allowing Workbox to inject the manifest during build

// This is the required reference that Workbox looks for to inject the manifest
self.__WB_MANIFEST;

// Minimal service worker functionality
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
});

// Disable caching to prevent reload issues
self.addEventListener('fetch', (event) => {
  // Skip caching for all requests to prevent reload loops
  event.respondWith(fetch(event.request));
}); 