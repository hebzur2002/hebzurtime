export type Category = {
  id: string;
  label: string;
  emoji: string;
  is_default: boolean;
};

export type Entry = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  category: string;
  note: string | null;
  created_at: string;
};

export type UserSettings = {
  user_id: string;
  reminder_interval_minutes: number;
  notification_style: "normal" | "silent";
  sleep_start: string;
  sleep_end: string;
  timezone: string;
};

export function formatDuration(startISO: string, endISO: string): string {
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "2026-09-12" (local date, not UTC) — used as the value for <input type="date">
// and as a stable key for grouping/navigating by day.
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Local-midnight-to-local-midnight ISO range for a given yyyy-mm-dd string,
// for querying entries that fall on that calendar day.
export function dayRange(key: string): { start: string; end: string } {
  const [y, m, d] = key.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function formatDayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const todayKey = dateKey(new Date());
  const yestKey = dateKey(new Date(Date.now() - 86400000));
  if (key === todayKey) return "Today";
  if (key === yestKey) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
