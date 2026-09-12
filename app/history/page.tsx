"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Entry,
  dateKey,
  dayRange,
  formatDayLabel,
  formatDuration,
  formatTime,
} from "@/lib/types";

export default function History() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>(
    dateKey(new Date(Date.now() - 86400000)) // default: yesterday
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      if (!uid) {
        window.location.href = "/login";
        return;
      }
      setUserId(uid);
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadDay(userId, selectedKey);
  }, [userId, selectedKey]);

  async function loadDay(uid: string, key: string) {
    setLoading(true);
    const { start, end } = dayRange(key);
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", uid)
      .gte("start_time", start)
      .lt("start_time", end)
      .order("start_time");
    setEntries(data ?? []);
    setLoading(false);
  }

  function shiftDay(delta: number) {
    const [y, m, d] = selectedKey.split("-").map(Number);
    const next = new Date(y, m - 1, d + delta);
    setSelectedKey(dateKey(next));
  }

  const todayKey = dateKey(new Date());
  const isToday = selectedKey === todayKey;

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

  return (
    <div className="container">
      <div className="header">
        <h1>History</h1>
        <a href="/">Today</a>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <button
            className="primary"
            style={{ width: "auto", padding: "8px 14px", background: "#333" }}
            onClick={() => shiftDay(-1)}
          >
            ◀
          </button>
          <input
            type="date"
            value={selectedKey}
            max={todayKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            style={{ flex: 1, marginBottom: 0, textAlign: "center" }}
          />
          <button
            className="primary"
            style={{ width: "auto", padding: "8px 14px", background: "#333" }}
            onClick={() => shiftDay(1)}
            disabled={isToday}
          >
            ▶
          </button>
        </div>
        <p className="muted" style={{ textAlign: "center", margin: "8px 0 0" }}>
          {formatDayLabel(selectedKey)}
        </p>
      </div>

      <div className="card">
        <label>Timeline</label>
        {loading && <p className="muted">Load ho raha hai...</p>}
        {!loading && entries.length === 0 && (
          <p className="muted">Is din ki koi entry nahi mili.</p>
        )}
        {!loading &&
          entries.map((e) => (
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

      {!loading && entries.length > 0 && (
        <div className="card">
          <label>Where did that day go?</label>
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
        </div>
      )}
    </div>
  );
}
