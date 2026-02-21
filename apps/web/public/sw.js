self.addEventListener("push", function (event) {
  console.log("push triggred");
  if (event.data) {
    const data = event.data;
    const options = {
      body: data.body,
      icon: data.icon || "/logo.png",
      badge: "/logo.png",
      vibrate: [100, 50, 100],
      data: data.data || {
        dateOfArrival: Date.now(),
        primaryKey: "2",
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();

  const relativeLink = event.notification.data?.link || "/";
  // Convert relative link to absolute URL based on the current service worker scope
  const urlToOpen = new URL(relativeLink, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // If a window tab matching the targeted URL already exists, focus that;
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If no matching tab exists, open a new one to the correct URL
      return clients.openWindow(urlToOpen);
    }),
  );
});
