// Money Matter CRM service worker.
// Deliberately does NOT cache app.html or index.html, so agents always
// get the newest version the moment it is uploaded to GitHub. Its only
// jobs are to make the app installable and to show a friendly screen
// when the phone has no signal.
const OFFLINE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>No connection</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
background:#0E0E0E;color:#F2EEE3;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px}
h1{font-size:20px;margin:0 0 8px}p{color:#A39C8A;margin:0 0 20px}
a{display:inline-block;background:#C9A227;color:#0E0E0E;text-decoration:none;font-weight:700;
padding:12px 20px;border-radius:10px}</style></head><body><div>
<h1>No connection</h1><p>Money Matter CRM needs internet to load your clients.</p>
<a href="/app.html">Try again</a></div></body></html>`;

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;          // let everything else go straight to the network
  e.respondWith(
    fetch(e.request).catch(() =>
      new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    )
  );
});

// ---------- Notifications ----------
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  const title = d.title || 'Money Matter';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || 'mm',
    renotify: true,
    data: { url: d.url || 'app.html' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || 'app.html', self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.indexOf('app.html') !== -1 && 'focus' in w) return w.focus();
    }
    return self.clients.openWindow(target);
  })());
});
