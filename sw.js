/* 분석 PWA 서비스 워커 — 앱 껍데기만 캐시(네트워크 우선), Supabase·CDN은 통과 */
const CACHE = 'analysis-v1';
const SHELL = ['./', 'index.html', 'jalim-base.css', 'engine.browser.js', 'icon.png', 'icon-192.png', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // GET + 같은 오리진만 처리. Supabase·jsdelivr(CDN) 등 외부는 그대로 통과(캐시 안 함).
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      // 브라우저 HTTP 캐시(GitHub Pages max-age=600)를 거치지 않고 서버에 새 버전이 있는지 확인 — 배포 직후에도 옛 화면이 남지 않게
      const net = await fetch(req, { cache: 'no-cache' });
      const cache = await caches.open(CACHE);
      cache.put(req, net.clone());
      return net;
    } catch (err) {
      const cached = await caches.match(req);
      return cached || caches.match('index.html');
    }
  })());
});
