"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserSettings } from "@/lib/types";

const DEFAULTS: Omit<UserSettings, "user_id"> = {
  reminder_interval_minutes: 60,
  notification_style: "normal",
  sleep_start: "00:00",
  sleep_end: "06:00",
  timezone: "Asia/Kolkata",
};

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;

      const { data: existing } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", uid)
        .single();

      if (existing) setSettings(existing);
    })();
  }, []);

  async function save() {
    if (!userId) return;
    await supabase
      .from("user_settings")
      .upsert({ user_id: userId, ...settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Settings</h1>
        <a href="/">Back</a>
      </div>

      <div className="card">
        <label>Reminder interval (minutes)</label>
        <select
          value={settings.reminder_interval_minutes}
          onChange={(e) =>
            setSettings({
              ...settings,
              reminder_interval_minutes: Number(e.target.value),
            })
          }
        >
          <option value={15}>Every 15 minutes</option>
          <option value={30}>Every 30 minutes</option>
          <option value={60}>Every 1 hour</option>
          <option value={120}>Every 2 hours</option>
        </select>

        <label>Notification style</label>
        <select
          value={settings.notification_style}
          onChange={(e) =>
            setSettings({
              ...settings,
              notification_style: e.target.value as "normal" | "silent",
            })
          }
        >
          <option value="normal">
            🔔 Normal (follows phone's ring/vibrate/silent mode)
          </option>
          <option value="silent">🔕 Always silent (panel only)</option>
        </select>

        <label>Sleep start</label>
        <input
          type="time"
          value={settings.sleep_start}
          onChange={(e) =>
            setSettings({ ...settings, sleep_start: e.target.value })
          }
        />

        <label>Sleep end</label>
        <input
          type="time"
          value={settings.sleep_end}
          onChange={(e) =>
            setSettings({ ...settings, sleep_end: e.target.value })
          }
        />

        <button className="primary" onClick={save}>
          {saved ? "Saved ✓" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
