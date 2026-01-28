"use client";

import { useEffect, useState } from "react";
import { toast } from "./Toast";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function LoginForm() {
  const [input, setInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visitorId, setVisitorId] = useState<string>("");

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const { visitorId } = await fp.get();
        setVisitorId(visitorId);
      } catch (error) {
        console.error("Fingerprint error:", error);
        // Fallback to random ID if fingerprint fails
        const fallbackId = `fallback_${Math.random().toString(36).slice(2)}`;
        setVisitorId(fallbackId);
      }
    };
    initFingerprint();
  }, []);

  useEffect(() => {
    const val = input.trim();
    if (val.length === 0) { setNameError(null); return; }
    if (val.length < 3) { setNameError("Name must be at least 3 characters"); return; }
    if (val.length > 15) { setNameError("Name must be at most 15 characters"); return; }
    if (!/^[A-Za-z ]+$/.test(val)) { setNameError("Use letters and spaces only"); return; }
    setNameError(null);
  }, [input]);

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: input.trim(),
        deviceId: visitorId || `unknown_${Date.now()}`,
        browserId: visitorId || "web",
        systemInfo: navigator.platform || "",
        userAgent: navigator.userAgent,
        email: null,
        mobile: null,
      };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        window.location.href = "/dashboard"; // LOOP FIX!
        return;
      } else {
        toast(data?.message || data?.error || "Login failed", "error");
      }
    } catch (err) {
      toast("Login error: " + String(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <style>{`
        .temp-light {
    color: #f4a6a6; /* very light red */
  }
        :root {
          --primary-blue: #008ecc;
          --warning-orange: #ff9800;
          --bg-gradient:  linear-gradient(135deg, #a1a39a 0%, #6aa24b 100%);
        }

        * { box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-gradient);
          padding: 20px;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 32px 24px;
          border-radius: 10px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 400px;
          text-align: center;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo { font-size: 22px; font-weight: bold; color: var(--primary-blue); margin-bottom: 8px; display: block; }
        h2 { margin-bottom: 20px; color: #333; font-size: 20px; }
        .input-group { margin-bottom: 20px; text-align: left; }
        .input-group label { display: block; margin-bottom: 8px; font-size: 14px; color: #555; font-weight: 600; }
        .input-group input { width: 100%; padding: 12px 14px; border: 2px solid #eee; border-radius: 10px; outline: none; transition: 0.3s; font-size: 16px; }
        .input-group input:focus { border-color: var(--primary-blue); }
        .warning-note { background: #fff3e0; border-left: 4px solid var(--warning-orange); padding: 12px; margin-bottom: 25px; text-align: left; border-radius: 6px; }
        .warning-note p { margin: 0; font-size: 13px; color: #e65100; line-height: 1.5; }
        .btn-login { width: 100%; padding: 14px; background: var(--primary-blue); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; box-shadow: 0 5px 15px rgba(0, 142, 204, 0.3); }
        .btn-login:hover:not(:disabled) { background: #007bb3; transform: translateY(-2px); }
        .btn-login:disabled { opacity: 0.7; cursor: not-allowed; }
        .footer-text { margin-top: 20px; font-size: 13px; color: #777; }
        @media (max-width: 480px) { .login-card { padding: 30px 20px; } }
      `}</style>

      <div className="login-card">
        <span className="logo">Exam Bank</span>
        <h2>Welcome Back!</h2>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>
              Login with Name (<span className="temp">Temporary</span>)
            </label>
            <input
              type="text"
              placeholder="Enter details..."
              required
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={15}
            />
          </div>

          {nameError && (
            <div className="warning-note">
              <p>⚠️ <strong>Note:</strong> {nameError}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn-login"
            disabled={loading || !!nameError}
          >
            {loading ? 'Logging in...' : 'Login Now'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
          <button
            type="button"
            className="btn-login"
            style={{ background: '#db4437', width: 'auto', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => toast('Google Sign-In coming soon', 'info')}
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.9 0 7.4 1.5 10.1 3.9l6-6C35.9 3.2 30.3 1 24 1 14.7 1 6.5 6.4 2.7 14.5l7.5 5.8C12.1 14 17.6 9.5 24 9.5z" /><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.5 2.6-2.1 4.8-4.4 6.3l6.8 5.3c4-3.7 6.1-9.1 6.1-16.1z" /><path fill="#FBBC05" d="M10.2 28.2c-1-3-1-6.2 0-9.2l-7.5-5.8C.8 16.8 0 20.3 0 24s.8 7.2 2.7 10.8l7.5-6.6z" /><path fill="#34A853" d="M24 47c6.3 0 11.9-2.1 16.1-5.7l-6.8-5.3c-2.1 1.3-4.8 2-7.3 2-6.4 0-11.9-4.3-13.8-10.3l-7.5 6.6C6.5 41.6 14.7 47 24 47z" /></svg>
            Google
          </button>
          <button
            type="button"
            className="btn-login"
            style={{ background: '#25D366', width: 'auto', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => toast('WhatsApp Login coming soon', 'info')}
          >
            <svg width="18" height="18" viewBox="0 0 32 32"><path fill="#fff" d="M16 3C9.9 3 5 7.9 5 14c0 2.3.7 4.4 1.9 6.1L6 29l9-2.4c.9.3 1.9.4 3 .4 6.1 0 11-4.9 11-11S22.1 3 16 3zm0 20.3c-.9 0-1.8-.2-2.6-.5l-.4-.2-5.3 1.4 1.4-5.1-.3-.4C7.2 17.5 7 16.8 7 16c0-5 4-9 9-9s9 4 9 9-4 9-9 9z" /><path fill="#fff" d="M21.7 18.6c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1-.2.3-.6.7-.8.8-.1.1-.3.1-.5 0-.2-.1-.9-.3-1.7-1.1-.6-.6-1.1-1.3-1.2-1.5-.1-.2 0-.4.1-.5.1-.1.2-.3.3-.4.1-.1.1-.3 0-.5-.1-.1-.5-1.1-.7-1.5-.2-.5-.4-.5-.5-.5h-.4c-.1 0-.5.1-.8.4s-1.1 1.1-1.1 2.6 1.1 3 1.3 3.3c.2.3 2.2 3.3 5.4 4.6.8.3 1.5.3 2 .2.6-.1 2-.9 2.2-1.8.2-.9.2-1.7.1-1.9-.1-.2-.3-.2-.5-.3z" /></svg>
            WhatsApp
          </button>
        </div>

      </div>
    </div>
  );
}
