// Service worker: this is what makes notifications work when the tab/app
// is closed. It just sits registered in the background and wakes up
// whenever the browser gets a push message from our server.

self.addEventListener("push", (event) => {
  let data = { title: "Time check-in", body: "Kya kar rahe the?", silent: false };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    // ignore malformed payloads
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      silent: data.silent,
      tag: "time-checkin", // replaces previous reminder instead of stacking
      requireInteraction: true,
      icon: "/icon.png",
      data: { url: "/" },
    })
  );
});

// Tapping the notification focuses/opens the app instead of just dismissing.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Some browsers occasionally drop a subscription and issue a new one.
// We just re-subscribe here; the new subscription gets saved to Supabase
// next time the app is opened (enablePushNotifications runs on every load).
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(
      event.oldSubscription ? event.oldSubscription.options : undefined
    )
  );
});
