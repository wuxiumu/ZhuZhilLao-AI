/* 竹知了 Service Worker —— 让安卓 Chrome 满足 PWA 安装条件，顺带离线可玩。
   策略：导航请求网络优先（部署后必拿新版，断网回退缓存）；
   静态资源 stale-while-revalidate（先出缓存秒开，后台自动更新，无需手动版本号）；
   /api/* 一律直连不缓存。 */
const CACHE = 'zzl-v2';
const CORE = [
  './', './manifest.webmanifest',
  '../assets/icons/apple-touch-icon.png',
  '../assets/icons/icon-192.png', '../assets/icons/icon-512.png',
  '../assets/3d/boot3d.js', '../assets/3d/model.js',
  '../assets/3d/vendor/three.module.min.js', '../assets/3d/vendor/OrbitControls.js',
];

self.addEventListener('install', e => {
  // 单个可选资源临时失败时不让整个 Service Worker 安装失败。
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(CORE.map(async path => {
        try {
          const response = await fetch(path, { cache: 'reload' });
          if (response.ok) await c.put(path, response);
        } catch (_) {}
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return;   // 计数走实时接口，永不缓存

  if (e.request.mode === 'navigate') {
    // 页面本体：网络优先，离线回退缓存
    e.respondWith(
      fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(CACHE).then(c => c.put('./', cp));
        return r;
      }).catch(() => caches.match('./'))
    );
    return;
  }

  // 静态资源：先出缓存，后台刷新
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => {
        if (r.ok) {
          const cp = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
        }
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
