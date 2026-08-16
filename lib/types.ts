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
