"use client";

import { useEffect, useRef } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function TimeTracker() {
  const userIdRef = useRef<string | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize
    const init = async () => {
        // Get Device ID
        let dId = localStorage.getItem('deviceId');
        if (!dId) {
            try {
                const fp = await FingerprintJS.load();
                const { visitorId } = await fp.get();
                dId = visitorId;
                localStorage.setItem('deviceId', visitorId);
            } catch (e) {
                console.error("TimeTracker: FP error", e);
                dId = 'unknown_' + Math.random();
            }
        }
        deviceIdRef.current = dId;

        // Get User ID
        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'include' // Ensure cookies are sent
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user) {
                    // Support different user object structures
                    userIdRef.current = data.user.id || data.user._id || data.user.userId;
                }
            }
        } catch (err) {
            console.error("TimeTracker: Failed to fetch user", err);
        }
    };

    init();

    const intervalId = setInterval(async () => {
        if (!userIdRef.current || !deviceIdRef.current) return;
        
        try {
            await fetch('/api/auth/session-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userIdRef.current,
                    deviceId: deviceIdRef.current,
                    time: 60 // 60 seconds
                })
            });
        } catch (err) {
            // silent fail
        }
    }, 60000); 

    return () => clearInterval(intervalId);
  }, []);

  return null;
}
