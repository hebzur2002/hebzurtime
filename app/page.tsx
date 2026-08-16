"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Category, Entry, formatDuration, formatTime } from "@/lib/types";
import {
  requestNotificationPermission,
  startReminderLoop,
} from "@/lib/notifications";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [note, setNote] = useState("");
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);

    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    setCategories(cats ?? []);

    if (uid) {
      await loadTodayEntries(uid);
      const { data: settings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", uid)
        .single();

      if (settings) {
        const granted = await requestNotificationPermission();
        if (granted) {
          startReminderLoop(
            settings.reminder_interval_minutes,
            settings.notification_style === "silent"
          );
        }
      }
    }
  }

  async function loadTodayEntries(uid: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", uid)
      .gte("start_time", startOfDay.toISOString())
      .order("start_time");

    setEntries(data ?? []);
  }

  function lastEndTime(): Date {
    if (entries.length === 0) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return start;
    }
    return new Date(entries[entries.length - 1].end_time);
  }

  async function logEntry(categoryLabel: string) {
    if (!userId) return;
    const start = lastEndTime();
    const end = new Date();

    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: userId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        category: categoryLabel,
        note: note || null,
      })
      .select()
      .single();

    if (!error && data) {
      setEntries([...entries, data]);
      setNote("");
      setPendingCategory(null);
    }
  }

  const totalsByCategory = entries.reduce<Record<string, number>>(
    (acc, e) => {
      const mins =
        (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) /
        60000;
      acc[e.category] = (acc[e.category] || 0) + mins;
      return acc;
    },
    {}
  );

  const totalTrackedMinutes = Object.values(totalsByCategory).reduce(
    (a, b) => a + b,
    0
  );
  const untrackedMinutes = Math.max(
    0,
    (Date.now() - new Date().setHours(0, 0, 0, 0)) / 60000 -
      totalTrackedMinutes
  );

  return (
    <div className="container">
      <div className="header">
        <h1>Today</h1>
        <a href="/settings">Settings</a>
      </div>

      {!userId && (
        <div className="card">
          <p className="muted">
            Sign in required to log entries. Wire up Supabase auth in
            lib/supabase.ts usage — see README for the quickest path (magic
            link or GitHub OAuth).
          </p>
        </div>
      )}

      <div className="card">
        <label>Kya kar rahe the? (last entry se ab tak)</label>
        <div className="category-grid">
          {categories.map((c) => (
            <button
              key={c.id}
              className="category-btn"
              onClick={() => logEntry(c.label)}
            >
              <span className="emoji">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Optional note (e.g. Pathology - inflammation)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="card">
        <label>Timeline</label>
        {entries.length === 0 && (
          <p className="muted">Koi entry nahi hai abhi. Upar se log karo.</p>
        )}
        {entries.map((e) => (
          <div className="timeline-row" key={e.id}>
            <span className="timeline-time">
              {formatTime(e.start_time)}–{formatTime(e.end_time)}
            </span>
            <span>{e.category}</span>
            <span className="muted">
              {formatDuration(e.start_time, e.end_time)}
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <label>Where did my day go?</label>
        {Object.entries(totalsByCategory).map(([cat, mins]) => (
          <div className="breakdown-row" key={cat}>
            <span style={{ minWidth: 90, fontSize: 13 }}>{cat}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min(100, (mins / 1440) * 100 * 4)}%`,
                }}
              />
            </div>
            <span className="muted">{Math.round(mins)}m</span>
          </div>
        ))}
        <div className="breakdown-row">
          <span style={{ minWidth: 90, fontSize: 13 }}>❓ Untracked</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.min(
                  100,
                  (untrackedMinutes / 1440) * 100 * 4
                )}%`,
                background: "#555",
              }}
            />
          </div>
          <span className="muted">{Math.round(untrackedMinutes)}m</span>
        </div>
      </div>
    </div>
  );
}
