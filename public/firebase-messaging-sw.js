// Firebase Cloud Messaging Service Worker
// dripro - プッシュ通知受信用

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

// バックグラウンド通知の受信
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] バックグラウンドメッセージ受信:', payload);

  const { title, body, icon, badge, data } = payload.notification || {};
  const notifTitle = title || 'ドリプロ通知';
  const notifOptions = {
    body: body || '',
    icon: icon || '/logo192.png',
    badge: badge || '/logo192.png',
    tag: data?.tag || 'dripro-notification',
    data: data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'アプリを開く' },
      { action: 'close', title: '閉じる' }
    ]
  };

  self.registration.showNotification(notifTitle, notifOptions);
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  // アプリを開く（または既存タブにフォーカス）
  const urlToOpen = event.notification.data?.url || 'https://dripro.vercel.app/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('dripro.vercel.app') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Service Worker インストール・アクティベート
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
