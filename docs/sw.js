/* Kalendarz Dekor by Ekiero · © 2026 · Wszelkie prawa zastrzeżone
   Ekran startowy działa też bez internetu (program jest w pamięci telefonu). Najpierw sieć, bez sieci – kopia. */
var C = 'kd-start-2.1.152';
var F = ['./', './index.html', './manifest.webmanifest', './ikona-180.png', './ikona-192.png', './ikona-512.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(C).then(function (c) { return c.addAll(F); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.filter(function (x) { return x !== C && x !== 'kd-push'; }).map(function (x) { return caches.delete(x); })); }).then(function () { return self.clients.claim(); })); });
/* (od 2.1.149) powiadomienia na telefon: treść od serwera {title, body, path, typ}; bez treści z wiadomości (tylko „Nowa wiadomość od: …” i nazwisko klienta) */
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'Kalendarz Dekor', body: e.data ? e.data.text() : '' }; }
  // (C149-18) tylko powiadomienia osoby zalogowanej na tym telefonie: program zapisuje ją w pamięci 'kd-push' (wylogowanie – pusty zapis = żadnych); brak zapisu – jak dotąd
  // (D6) dźwięk / wibracja wg przełączników osoby (snd / vib z serwera; brak – wł.); (decyzja A) rozmowa otwarta na ekranie – powiadomienie od razu zamknięte
  //   (iPhone wymaga pokazania powiadomienia przy każdym push – inaczej może wyłączyć powiadomienia programu)
  var cz = function (k) { return caches.open('kd-push').then(function (c) { return c.match(k); }).then(function (r) { return r ? r.text() : null; }).catch(function () { return null; }); };
  e.waitUntil(Promise.all([cz('/kd-push-uid'), cz('/kd-push-otw'), self.clients.matchAll({ type: 'window', includeUncontrolled: true }).catch(function () { return []; })]).then(function (w) {
    var kto = w[0], otw = w[1], L = w[2] || [];
    if (d.uid && kto !== null && kto !== d.uid) return;
    var naEkranie = L.some(function (c) { return c.focused || c.visibilityState === 'visible'; });
    var otwarta = d.typ === 'msg' && naEkranie && otw && d.path && d.path.id === otw;
    var o = { body: d.body || '', icon: './ikona-192.png', badge: './ikona-192.png', data: { path: d.path || null }, tag: d.tag || undefined, silent: otwarta || d.snd === false };
    if ((d.vib === false || otwarta) && !o.silent) o.vibrate = [];   // (przegląd U1) silent + vibrate razem = błąd showNotification – przy ciszy bez „vibrate”
    return self.registration.showNotification(d.title || 'Kalendarz Dekor', o).then(function () {
      if (!otwarta) return;
      return self.registration.getNotifications(d.tag ? { tag: d.tag } : undefined).then(function (N) { N.forEach(function (n) { n.close(); }); });
    });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close(); var P = (e.notification.data || {}).path || null;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (L) {
    for (var i = 0; i < L.length; i++) { var c = L[i]; if (new URL(c.url).origin === location.origin) { if (P) c.postMessage({ kdPush: P }); return c.focus(); } }   // program otwarty – przejście w nim
    return self.clients.openWindow('./' + (P ? '?push=' + encodeURIComponent(JSON.stringify(P)) : ''));                                                     // zamknięty – start z miejscem do otwarcia
  }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin || u.pathname.indexOf(new URL(self.registration.scope).pathname) !== 0) return;
  e.respondWith(fetch(r).then(function (res) { if (res.ok) { var cp = res.clone(); caches.open(C).then(function (c) { c.put(r, cp); }); } return res; })
    .catch(function () { return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match('./index.html'); }); }));
});
