import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPushToUser } from "@/lib/send-push";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const result = await sendPushToUser(user.id, {
    title: "Time check-in",
    body: "Test notification — agar ye dikha to sab sahi kaam kar raha hai.",
  });

  if (result.sent === 0) {
    return NextResponse.json(
      { error: "Koi push subscription nahi mili is account ke liye." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
