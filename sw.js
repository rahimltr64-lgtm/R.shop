// ============================================================
// R.Shop - Service Worker المتقدم (الإصدار الآمن V2)
// ============================================================

const CACHE_NAME = 'r-shop-v2.0.0';
const OFFLINE_URL = '/offline.html';

// ✅ الملفات المطلوب تخزينها مؤقتاً (تمت إضافة config.js)
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/offline.html',
  '/config.js',             // 🔐 تمت الإضافة لضمان تحديث الإعدادات
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// ✅ URLs الصورية التي سيتم تخزينها مسبقاً
const IMAGE_CACHE_URLS = [
  './icon-192.png',
  './icon-512.png'
];

// ========== تثبيت Service Worker ==========
self.addEventListener('install', (event) => {
  console.log('[SW] تثبيت Service Worker...');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // تخزين الملفات الثابتة
      await cache.addAll(STATIC_CACHE_URLS);
      
      // تخزين الصور الثابتة
      for (const url of IMAGE_CACHE_URLS) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn(`[SW] فشل تخزين: ${url}`, error);
        }
      }
      
      // إنشاء صفحة وضع عدم الاتصال
      const offlineResponse = createOfflinePage();
      await cache.put(OFFLINE_URL, offlineResponse);
      
      console.log('[SW] تم التثبيت بنجاح');
    })()
  );
  
  // تأكيد التنشيط الفوري
  self.skipWaiting();
});

// ========== تنشيط Service Worker ==========
self.addEventListener('activate', (event) => {
  console.log('[SW] تنشيط Service Worker...');
  
  event.waitUntil(
    (async () => {
      // حذف المخابئ القديمة
      const cacheKeys = await caches.keys();
      const deletePromises = cacheKeys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key));
      
      await Promise.all(deletePromises);
      
      // التحكم في جميع الصفحات المفتوحة
      await self.clients.claim();
      
      console.log('[SW] تم التنشيط بنجاح');
    })()
  );
});

// ========== استراتيجية التخزين المؤقت ==========
// استراتيجية: Cache First ثم Network (للملفات الثابتة)
// استراتيجية: Network First ثم Cache (للبيانات الديناميكية)

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // تجاهل طلبات Firebase (API)
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('firebasestorage.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // تجاهل طلبات التحليلات
  if (url.hostname.includes('google-analytics.com') ||
      url.hostname.includes('googletagmanager.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // طلبات الصور - استراتيجية Cache First
  if (event.request.destination === 'image') {
    event.respondWith(imageStrategy(event.request));
    return;
  }
  
  // طلبات CSS و JS - استراتيجية Cache First
  if (event.request.destination === 'style' || 
      event.request.destination === 'script' ||
      event.request.destination === 'font') {
    event.respondWith(staticStrategy(event.request));
    return;
  }
  
  // طلبات HTML والملفات الرئيسية - استراتيجية Network First
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document') {
    event.respondWith(navigationStrategy(event.request));
    return;
  }
  
  // باقي الطلبات - استراتيجية Network First
  event.respondWith(networkFirstStrategy(event.request));
});

// ========== استراتيجيات التخزين المؤقت ==========

// استراتيجية Cache First (للملفات الثابتة)
async function staticStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // إذا كان الطلب لصفحة HTML، عرض صفحة عدم الاتصال
    if (request.destination === 'document') {
      return cache.match(OFFLINE_URL);
    }
    throw error;
  }
}

// استراتيجية Network First (للبيانات الديناميكية)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // إذا كان الطلب لصفحة HTML، عرض صفحة عدم الاتصال
    if (request.mode === 'navigate' || request.destination === 'document') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

// استراتيجية الصور (Cache First مع تحديث الخلفية)
async function imageStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // تحديث الخلفية
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);
  
  // إرجاع النسخة المخبأة أولاً
  if (cachedResponse) {
    // تحديث الخلفية دون انتظار
    fetchPromise.catch(() => {});
    return cachedResponse;
  }
  
  // انتظار الشبكة إذا لم توجد نسخة مخبأة
  return fetchPromise;
}

// استراتيجية التنقل (للصفحات)
async function navigationStrategy(request) {
  try {
    // محاولة الشبكة أولاً
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response failed');
  } catch (error) {
    // إذا فشلت الشبكة، استخدام النسخة المخبأة
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // عرض صفحة عدم الاتصال
    return caches.match(OFFLINE_URL);
  }
}

// ========== إنشاء صفحة وضع عدم الاتصال ==========
function createOfflinePage() {
  const offlineHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>غير متصل - R.Shop</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #0a0e16 0%, #131a2a 100%);
            color: #e2e8f0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .offline-container {
            text-align: center;
            max-width: 500px;
            background: #1a2335;
            border-radius: 32px;
            padding: 48px 32px;
            border: 1px solid #2a3447;
        }
        .offline-icon {
            font-size: 80px;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #f5b041 0%, #d4933a 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p {
            color: #94a3b8;
            margin-bottom: 24px;
            line-height: 1.6;
        }
        button {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 16px;
            font-family: 'Cairo';
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            margin-top: 16px;
        }
        button:hover {
            transform: translateY(-2px);
        }
        .suggestions {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #2a3447;
        }
        .suggestions a {
            color: #3b82f6;
            text-decoration: none;
            margin: 0 8px;
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1>أنت غير متصل بالإنترنت</h1>
        <p>يبدو أن هناك مشكلة في اتصال الشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.</p>
        <button onclick="location.reload()">🔄 إعادة المحاولة</button>
        <div class="suggestions">
            <p style="font-size: 12px;">جرب هذه الروابط:</p>
            <a href="/">الرئيسية</a> | 
            <a href="#" onclick="openTrackDrawer()">تتبع الطلب</a>
        </div>
    </div>
    <script>
        function openTrackDrawer() {
            localStorage.setItem('openTrackDrawer', 'true');
            window.location.href = '/';
        }
    </script>
</body>
</html>`;
  
  return new Response(offlineHTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ========== إشعارات Push ==========
self.addEventListener('push', (event) => {
  console.log('[SW] Push Notification received');
  
  let notificationData = {
    title: 'R.Shop',
    body: 'تحديث جديد في المتجر!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      data: notificationData.data
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ========== مزامنة الخلفية ==========
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  // مزامنة الطلبات المعلقة مع Firebase
  try {
    const cache = await caches.open('pending-orders');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const orderData = await response.json();
        
        // إعادة محاولة إرسال الطلب
        const fetchResponse = await fetch(request.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        
        if (fetchResponse.ok) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}
