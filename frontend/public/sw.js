/* global self, clients */

self.addEventListener('push', (event) => {
  let payload = { title: 'ENARMX', body: '', data: {} };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = {
        title: typeof parsed.title === 'string' ? parsed.title : payload.title,
        body: typeof parsed.body === 'string' ? parsed.body : payload.body,
        data: parsed.data && typeof parsed.data === 'object' ? parsed.data : {},
      };
    }
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: payload.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rel = event.notification.data && event.notification.data.url;
  const target =
    typeof rel === 'string' && rel.startsWith('/')
      ? new URL(rel, self.location.origin).href
      : new URL('/backoffice', self.location.origin).href;
  event.waitUntil(clients.openWindow(target));
});
