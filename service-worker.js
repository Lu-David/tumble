self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  self.registration.showNotification(
    data.title || "Goss LENS",
    {
      body: data.body || "Laundry update",
      icon: "/icon.png",
    }
  );
});