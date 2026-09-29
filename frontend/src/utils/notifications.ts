export const requestNotificationPermission = async (): Promise<void> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return;
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Desktop notification permission granted.");
    }
  }
};

export const showDesktopNotification = (
  title: string,
  options: NotificationOptions & { url?: string } = {}
): void => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
    };
  }
};