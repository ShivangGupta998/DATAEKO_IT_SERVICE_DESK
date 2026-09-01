// Operates in background when tab is closed
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New update available',
    icon: data.icon || '/logo.png',
    badge: '/badge.png'
  };

  // Triggers Native OS Desktop Toast (Windows Action Center / Mac Notification Center)
  event.waitUntil(
    self.registration.showNotification(data.title || 'ServiceDesk Alert', options)
  );
});