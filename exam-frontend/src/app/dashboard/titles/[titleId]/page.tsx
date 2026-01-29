"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";

interface Subject {
  subjectId: string;
  code: string;
  nameEn: string;
  nameHi: string;
  totalQuestions: number;
  unitCount?: number;
  chapterCount?: number;
}

export default function TitleSubjectsPage() {
  const params = useParams();
  const titleId = params.titleId as string;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!titleId) return;
    const controller = new AbortController();
    fetchSubjects(controller.signal);
    return () => controller.abort();
  }, [titleId]);

  const fetchSubjects = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/subjects/list/${titleId}`, { signal });
      if (data?.subjects && Array.isArray(data.subjects)) {
        setSubjects(data.subjects);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Title subjects fetch error:", err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <style>{`
        .header h1 { font-size: 28px; font-weight: bold; color: var(--primary-blue); margin: 0 0 8px 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
        .card { background: white; padding: 18px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-left: 5px solid #8e44ad; text-decoration: none; display: block; }
        .card:hover { transform: translateY(-3px); transition: transform .2s; }
        .code { position: absolute; top: 10px; right: 10px; font-size: 10px; background: #eee; padding: 2px 6px; border-radius: 4px; color: #555; }
        .value { font-size: 22px; font-weight: bold; color: var(--primary-blue); margin: 6px 0; }
        .desc { font-size: 12px; color: #888; }
      `}</style>

      <div className="header">
        <h1>Subjects by Source</h1>
        <p style={{ color: "#666", fontSize: 14, margin: 5 }}>
          {loading ? "Loading..." : `${subjects.length} subjects available`}
        </p>
      </div>

      {loading ? (
        <div className="loading">Loading subjects...</div>
      ) : subjects.length === 0 ? (
        <div className="loading">No subjects found for this source</div>
      ) : (
        <div className="grid">
          {subjects.map((s) => (
            <Link
              key={s.subjectId}
              href={`/dashboard/titles/${titleId}/subjects/${s.subjectId}`}
              className="card"
            >
              <div style={{ position: 'relative' }}>
                <div className="code">{s.code}</div>
                <div className="stat-title">{s.nameEn}</div>
                <div className="desc">{s.nameHi}</div>
                <div className="value">{s.totalQuestions.toLocaleString()} Questions</div>
                <div className="desc">{s.chapterCount} Chapters • {s.unitCount} Units</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
