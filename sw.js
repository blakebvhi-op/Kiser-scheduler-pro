/* Kiser Schedule Pro — service worker
   App-shell caching so the PWA installs + opens offline.
   Data still needs a connection (it lives in Supabase). */
const CACHE = "kiser-schedule-v1";
const SHELL = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // Never cache Supabase or auth traffic — always go to network.
  if (url.hostname.includes("supabase") || url.hostname.includes("jsdelivr")) return;

  // App shell: cache-first, fall back to network.
  if (e.request.method === "GET" && url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit =>
        hit || fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        }).catch(() => caches.match("./index.html"))
      )
    );
  }
});
