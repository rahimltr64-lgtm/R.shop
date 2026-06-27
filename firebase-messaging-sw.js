// ============================================================
// firebase-messaging-sw.js
// Service Worker مخصص لـ Firebase Cloud Messaging (Web Push)
// لا تغيّر اسم هذا الملف ولا مكانه - يجب أن يبقى في جذر الموقع
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBcMKcfrJoGSE07YVf2vpwZhc08NQURn80",
  projectId: "phones-market",
  messagingSenderId: "1059312114207",
  appId: "1:1059312114207:android:4ce9bbae2cef6b6a38532a",
});

const messaging = firebase.messaging();

// عرض الإشعار عندما يكون التطبيق مغلقاً أو في الخلفية
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] إشعار في الخلفية:", payload);

  const notificationTitle = payload.notification?.title || "R.Shop";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// عند الضغط على الإشعار - فتح الموقع
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
