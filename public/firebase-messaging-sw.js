// Firebase Messaging Service Worker
// Dynamically initialized using parameters passed during service worker registration

const urlParams = new URL(location.href).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId')
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

  // Initialize the Firebase app in the service worker
  firebase.initializeApp(firebaseConfig);

  // Retrieve an instance of Firebase Cloud Messaging
  const messaging = firebase.messaging();

  // Background message listener
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    if (payload.notification) {
      console.log('Skipping manual display to prevent duplicate notification.');
      return;
    }
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Taskvexa Update';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: '/favicon.svg',
      data: payload.data,
      tag: payload.data?.tag || 'taskvexa-notification',
      renotify: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn('[firebase-messaging-sw.js] Missing Firebase configuration parameters.');
}

// Notification click behavior
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('navigate' in client) {
          try {
            client.navigate('/dashboard/notifications');
          } catch (e) {
            console.error('[SW] Navigation failed:', e);
          }
          return client.focus();
        }
      }
      return clients.openWindow('/dashboard/notifications');
    })
  );
});
