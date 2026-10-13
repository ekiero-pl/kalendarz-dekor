/* Kalendarz Dekor by Ekiero · © 2026 · Wszelkie prawa zastrzeżone
   Ekran startowy działa też bez internetu (program jest w pamięci telefonu). Najpierw sieć, bez sieci – kopia. */
var C = 'kd-start-2.1.101';
var F = ['./', './index.html', './manifest.webmanifest', './ikona-180.png', './ikona-192.png', './ikona-512.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(C).then(function (c) { return c.addAll(F); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== C; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin || u.pathname.indexOf(new URL(self.registration.scope).pathname) !== 0) return;
  e.respondWith(fetch(r).then(function (res) { if (res.ok) { var cp = res.clone(); caches.open(C).then(function (c) { c.put(r, cp); }); } return res; })
    .catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match('./index.html'); }); }));
});
