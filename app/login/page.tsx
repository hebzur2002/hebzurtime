"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendLink() {
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Sign in</h1>
      </div>

      <div className="card">
        {sent ? (
          <p>
            Link bhej diya <strong>{email}</strong> pe. Email check karo aur
            link pe tap karo — sign in ho jaayega.
          </p>
        ) : (
          <>
            <label>Email</label>
            <input
              type="text"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && (
              <p style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</p>
            )}
            <button className="primary" onClick={sendLink}>
              Send magic link
            </button>
          </>
        )}
      </div>
    </div>
  );
}
