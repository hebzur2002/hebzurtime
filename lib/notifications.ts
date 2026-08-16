// V1: works while the tab/app is open. Uses browser Notification API.
// Background push (works when app is closed) is a V1.5 upgrade using
// a service worker + VAPID keys + a Supabase Edge Function on a cron schedule.

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showReminderNotification(
  intervalMinutes: number,
  silent: boolean
) {
  if (Notification.permission !== "granted") return;

  new Notification("Time check-in", {
    body: `Last ${intervalMinutes} minutes mein aapne kya kiya?`,
    silent: silent, // true = no sound/vibration, panel only
    tag: "time-checkin", // replaces previous reminder instead of stacking
    requireInteraction: true,
  });
}

// Call this once on app load (e.g. in a top-level layout effect) to start
// the recurring reminder loop based on the user's saved interval.
export function startReminderLoop(
  intervalMinutes: number,
  silent: boolean,
  onFire?: () => void
): () => void {
  const ms = intervalMinutes * 60 * 1000;
  const id = setInterval(() => {
    showReminderNotification(intervalMinutes, silent);
    onFire?.();
  }, ms);

  // returns a cleanup function to clear the interval
  return () => clearInterval(id);
}
