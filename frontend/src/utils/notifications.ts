export const requestNotificationPermission = async (): Promise<NotificationPermission | null> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return null;
  }

  if (Notification.permission === "default") {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Desktop notification permission granted.");
      }
      return permission;
    } catch {
      return new Promise((resolve) => {
        try {
          Notification.requestPermission((permission) => {
            if (permission === "granted") {
              console.log("Desktop notification permission granted.");
            }
            resolve(permission);
          });
        } catch {
          resolve(null);
        }
      });
    }
  }

  return Notification.permission;
};

/**
 * Automatically requests desktop notification permission if not yet decided,
 * with fallbacks on the user's first interaction if unprompted requests are blocked by the browser.
 */
export const autoRequestNotificationPermission = (): void => {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "default") {
    // Try requesting permission automatically right away
    requestNotificationPermission().catch(() => {});

    // Browser policy may require a user gesture before showing permission dialog
    const handleFirstInteraction = () => {
      if (Notification.permission === "default") {
        requestNotificationPermission().catch(() => {});
      }
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction, { once: true, passive: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true, passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true, passive: true });
  }
};

/**
 * Plays a subtle, non-intrusive notification chime using the Web Audio API.
 * Requires no external audio files and works across all modern browsers.
 */
export const playNotificationChime = (): void => {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Silently continue if audio context is blocked
  }
};

export const showDesktopNotification = (
  title: string,
  options: NotificationOptions & { url?: string } = {}
): void => {
  // Always trigger audio chime
  playNotificationChime();

  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
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
    } catch (e) {
      console.warn("Error displaying notification:", e);
    }
  } else if (Notification.permission === "default") {
    requestNotificationPermission().then((perm) => {
      if (perm === "granted") {
        try {
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
        } catch (e) {
          console.warn("Error displaying notification after permission grant:", e);
        }
      }
    });
  }
};