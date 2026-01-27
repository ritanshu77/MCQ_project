"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "./Toast";

// Global variable to prevent double fetch in React Strict Mode (Development)
let globalIsChecking = false;

export default function ServerStatus() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Prevent double execution using global flag
    if (globalIsChecking) return;
    globalIsChecking = true;

    const checkServer = async () => {
      try {
        // Ping our local proxy
        const res = await fetch('/api/health');
        
        if (!res.ok) {
           throw new Error("Server sleeping");
        }
      } catch (e) {
        startCountdown();
      } finally {
        globalIsChecking = false;
      }
    };

    checkServer();
  }, []);

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setIsSleeping(true);
    setCountdown(40); // Start 25s countdown (changed to 40 in previous edit, reverting to 25 if needed or keeping 40 as per last file content)

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          checkAgain();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkAgain = async () => {
    // Prevent overlapping checks
    if (globalIsChecking) return;
    globalIsChecking = true;

    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setIsSleeping(false);
        toast("Backend Server is Connected! 🚀", "success");
      } else {
        // Still sleeping, restart countdown
        startCountdown();
      }
    } catch (e) {
      startCountdown();
    } finally {
      globalIsChecking = false;
    }
  };

  if (!isSleeping) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      backgroundColor: '#ff9800', // Orange for warning/starting
      color: 'white',
      textAlign: 'center',
      padding: '12px',
      zIndex: 9999,
      fontWeight: 'bold',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    }}>
      <span>⚠️ Server is starting up... Please wait</span>
      <span style={{ 
        background: 'rgba(255,255,255,0.2)', 
        padding: '2px 8px', 
        borderRadius: '4px',
        fontFamily: 'monospace' 
      }}>
        {countdown}s
      </span>
    </div>
  );
}