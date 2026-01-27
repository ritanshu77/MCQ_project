"use client";

import { useEffect, useState } from "react";
import axios from 'axios';
import Link from 'next/link';
// import { toast } from "./Toast";

import { getAuthToken } from "@/utils/auth";

interface Subject {
  totalQuestions: number;
  easy: number;
  medium: number;
  hard: number;
  subjectId: string;
  code: string;
  nameEn: string;
  nameHi: string;
  descriptionEn: string;
  descriptionHi: string;
  unitCount: number;
  chapterCount: number;
}

interface User {
  id?: string | number;
  name?: { en?: string; hi?: string };
}

export default function DashboardShell({ user }: { user: User }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
    
    // sidebar logic (tera existing code)
    try {
      console.log("document.cookie:", document.cookie);
    } catch (e) {
      console.log("Could not read document.cookie", e);
    }
    
    function handleClick(event: MouseEvent) {
      const sidebar = document.getElementById("sidebar");
      const btn = document.querySelector(".toggle-btn");
      if (!sidebar || !btn) return;
      const target = event.target as Node | null;

      // Close if clicking outside in mobile view
      if (
        window.innerWidth <= 768 &&
        sidebar.classList.contains("active") &&
        target &&
        !sidebar.contains(target) &&
        target !== btn
      ) {
        sidebar.classList.remove("active");
      }

      // Close if clicking on a link inside the sidebar in mobile view
      if (
        window.innerWidth <= 768 &&
        sidebar.classList.contains("active") &&
        target &&
        sidebar.contains(target)
      ) {
         // Check if the clicked element or its parent is an anchor tag (link)
         const link = (target as HTMLElement).closest('a');
         if (link) {
            sidebar.classList.remove("active");
         }
      }
    }

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const fetchSubjects = async () => {
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const { data } = await axios.get(`/api/subjects/list`, {
        withCredentials: true, // HttpOnly cookies ke liye
        headers,
      });

      if (data?.subjects && Array.isArray(data.subjects)) {
        setSubjects(data.subjects);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Axios error:", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <style>{`
        .welcome-msg { margin-bottom: 25px; }
        .welcome-msg h1 { margin: 0; color: var(--primary-blue); font-size: 1.6rem; }
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 15px; 
          margin-bottom: 25px; 
          width: 100%; 
        }
        .stat-card { 
          background: white; 
          padding: 20px; 
          border-radius: 10px; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.05); 
          border-left: 5px solid var(--primary-blue);
          transition: transform 0.2s;
          text-decoration: none;
          display: block;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-title { font-size: 14px; color: #666; margin-bottom: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: var(--primary-blue); margin: 0 0 4px 0; }
        .stat-desc { font-size: 12px; color: #888; }
        .loading { text-align: center; padding: 40px; color: #666; }
      `}</style>

      <div className="welcome-msg">
        <h1>Welcome, {user?.name?.en ?? user?.name?.hi ?? "Guest"}! 👋</h1>
        <p style={{ fontSize: 14, margin: "5px 0", color: "#666" }}>
          Ready for today&rsquo;s challenge?
        </p>
      </div>

      {loading ? (
        <div className="loading">Loading subjects...</div>
      ) : subjects.length === 0 ? (
        <div className="loading">No subjects available</div>
      ) : (
        <div className="stats-grid">
          {subjects.map((subject) => (
            <Link 
              key={subject.subjectId} 
              href={`/dashboard/subjects/${subject.subjectId}`}
              className="stat-card"
            >
              <div className="stat-title">{subject.nameEn}</div>
              <h3 className="stat-value">{subject.totalQuestions.toLocaleString()}</h3>
              <p className="stat-desc">
                {subject.easy} Easy • {subject.medium} Medium • {subject.hard} Hard
              </p>
              <p className="stat-desc" style={{ fontSize: 11 }}>
                {subject.chapterCount} Chapters • {subject.unitCount} Units
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
