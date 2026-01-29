"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";

interface Set {
  _id: string;
  name: { en: string; hi: string };
  totalQuestions: number;
  setNumber: number;
  isActive: boolean;
}

export default function ExamSetsPage() {
  const params = useParams();
  const examId = params.examId as string;
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;
    const controller = new AbortController();
    fetchSets(controller.signal);
    return () => controller.abort();
  }, [examId]);

  const fetchSets = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/sets?examId=${examId}&quizType=exam`, { signal });
      if (data && Array.isArray(data)) {
        setSets(data);
      } else if (data?.success && Array.isArray(data?.data)) {
        setSets(data.data);
      } else {
        setSets([]);
      }
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Exam sets fetch error:", err);
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <style>{`
        .header h1 { font-size: 28px; font-weight: bold; color: var(--primary-blue); margin: 0 0 8px 0; }
        .sets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; }
        .set-card { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-left: 5px solid #e67e22; text-decoration: none; display: block; }
        .set-card:hover { transform: translateY(-4px); transition: transform .2s; }
      `}</style>

      <div className="header">
        <h1>Exam Sets</h1>
        <p style={{ color: "#666", fontSize: 14, margin: 5 }}>
          {loading ? "Loading..." : `${sets.length} sets available`}
        </p>
      </div>

      {loading ? (
        <div className="loading">Loading sets...</div>
      ) : sets.length === 0 ? (
        <div className="loading">No exam sets available</div>
      ) : (
        <div className="sets-grid">
          {sets.map((set) => (
            <Link
              key={set._id}
              href={`/dashboard/exams/${examId}/sets/${set._id}`}
              className="set-card"
            >
              <div className="stat-title">{set.name?.en || set.name?.hi || `Set ${set.setNumber}`}</div>
              <h3 className="stat-value" style={{ color: "var(--primary-blue)" }}>
                {set.totalQuestions} Questions
              </h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
