import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPushToUser } from "@/lib/send-push";

function timeStringToMinutes(t: string): number {
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function isWithinSleepWindow(
  nowMinutes: number,
  sleepStart: string,
  sleepEnd: string
): boolean {
  const start = timeStringToMinutes(sleepStart);
  const end = timeStringToMinutes(sleepEnd);
  if (start === end) return false; // no sleep window configured
  if (start < end) return nowMinutes >= start && nowMinutes < end;
  return nowMinutes >= start || nowMinutes < end; // wraps past midnight
}

function nowMinutesInTimezone(timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

// This route is meant to be hit on a schedule (every 5-15 min) by Vercel
// Cron or an external cron service (e.g. cron-job.org). It's idempotent and
// cheap to call often — it only actually sends a push when a user's
// reminder is genuinely due.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: allSettings, error } = await supabaseAdmin
    .from("user_settings")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  let checked = 0;
  let sent = 0;
  let skipped = 0;

  for (const settings of allSettings ?? []) {
    checked++;
    const nowMinutes = nowMinutesInTimezone(settings.timezone || "Asia/Kolkata");

    if (isWithinSleepWindow(nowMinutes, settings.sleep_start, settings.sleep_end)) {
      skipped++;
      continue;
    }

    const intervalMs = (settings.reminder_interval_minutes ?? 60) * 60 * 1000;
    const lastSent = settings.last_notified_at
      ? new Date(settings.last_notified_at).getTime()
      : 0;

    if (now - lastSent < intervalMs) {
      skipped++;
      continue;
    }

    const result = await sendPushToUser(settings.user_id, {
      title: "Time check-in",
      body: `Last ${settings.reminder_interval_minutes} minutes mein aapne kya kiya?`,
      silent: settings.notification_style === "silent",
    });

    if (result.sent > 0) {
      sent++;
      await supabaseAdmin
        .from("user_settings")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("user_id", settings.user_id);
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ checked, sent, skipped });
}
