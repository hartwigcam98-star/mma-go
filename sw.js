/* Skill Spin MMA offline cache. The page is checked online first (so updates show straight away) and falls back to
   the copy on this phone when there's no signal (or after 4 s on a weak one). */
const V = "6833720a23", CORE = "mma-core-" + V, FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CORE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k.startsWith("mma-core-") && k !== CORE) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (req.mode === "navigate" || (u.origin === location.origin && /\/(index\.html)?$/.test(u.pathname))) {
    e.respondWith((async () => {
      const c = await caches.open(CORE), cached = (await c.match(req)) || (await c.match("index.html"));
      const net = fetch(req, { cache: "no-cache" }).then(r => { if (r && r.ok) c.put("index.html", r.clone()); return r; });
      if (!cached) return net;
      return Promise.race([net.catch(() => cached), new Promise(res => setTimeout(() => res(cached), 4000))]);
    })());
    return;
  }
  if (u.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(CORE).then(async c => { const hit = await c.match(req); const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => hit); return hit || net; }));
  }
});
