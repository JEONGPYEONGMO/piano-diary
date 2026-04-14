const CACHE = 'piano-diary-v2';
const CORE  = [
  './',
  './manifest.json',
  './icon.svg',
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

// 활성화: 구 버전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch: Firebase·외부 CDN은 그냥 통과, 나머지는 캐시 우선
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (
    url.includes('firebase') ||
    url.includes('gstatic.com') ||
    url.includes('googleapis.com') ||
    !url.startsWith(self.location.origin)
  ) return; // 외부 요청은 서비스워커 개입 안 함

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
