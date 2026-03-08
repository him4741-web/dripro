importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA6IxElYpr3H3i4to38XxYPK6njapXxZ84",
  authDomain: "dripro-bfc0f.firebaseapp.com",
  projectId: "dripro-bfc0f",
  storageBucket: "dripro-bfc0f.firebasestorage.app",
  messagingSenderId: "510245379594",
  appId: "1:510245379594:web:cf6e18de231e21daae89f3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message:', payload);
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/logo192.png',
    badge: '/logo192.png',
    data: payload.data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
