"use client";

import { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/utils/auth";

interface Unit {
  unitId: string;
  name: { en: string; hi: string };  // ✅ Object type
  totalQuestions: number;
  easy?: number;
  medium?: number;
  hard?: number;
  description?: { en: string; hi: string };
  chapterCount?: number;
}

interface UnitsViewProps {
  subjectId: string;
  subjectName: string;
  subjectNameHi: string;
  onBack: () => void;
  titleId?: string;
}

export default function UnitsView({ 
  subjectId, 
  subjectName, 
  subjectNameHi,
  onBack,
  titleId
}: UnitsViewProps) {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const didFetchUnitsRef = useRef(false);
  useEffect(() => {
    if (didFetchUnitsRef.current) return;
    didFetchUnitsRef.current = true;
    fetchUnits();
  }, [subjectId]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        `/api/units`,
        {
          subjectId,
          titleId,
          quizType: titleId ? 'title-chapter' : 'chapter' // Pass quizType explicitly
        },
        { 
            withCredentials: true,
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        }
      );
      setUnits(data.units || []);
    } catch (error) {
      console.error('Units fetch error:', error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <style jsx>{`
        .back-btn { 
          display: inline-flex; align-items: center; gap: 8px; 
          padding: 12px 24px; background: white; border: 2px solid var(--primary-blue); 
          border-radius: 10px; color: var(--primary-blue); font-weight: 600; cursor: pointer;
          transition: all 0.3s; margin-bottom: 30px; font-size: 14px;
        }
        .back-btn:hover { background: var(--primary-blue); color: white; transform: translateY(-1px); }
        .header h1 { font-size: 28px; font-weight: bold; color: var(--primary-blue); margin: 0 0 8px 0; }
        .units-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .unit-card { 
          background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
          border-left: 5px solid #10b981; cursor: pointer; transition: all 0.3s;
        }
        .unit-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.15); }
        .empty-state { text-align: center; padding: 80px 40px; color: #666; }
        .loading { text-align: center; padding: 60px 20px; color: #666; }
      `}</style>

      <button onClick={onBack} className="back-btn">
        ← Back to Dashboard
      </button>

      <div className="header">
        <h1>Units - {subjectName}</h1>
        <p style={{ color: "#666", fontSize: 14, margin: 5 }}>
          {loading ? "Loading..." : `${units.length} units available`}
        </p>
      </div>

      {loading ? (
        <div className="loading">
          <div style={{ fontSize: 16 }}>Loading units...</div>
        </div>
      ) : units.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 20 }}>📭</div>
          <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>
            No Units Available
          </h2>
          <p style={{ fontSize: 16 }}>
            Is subject mein abhi koi units nahi hain.
          </p>
        </div>
      ) : (
        <div className="units-grid">
          {units.map((unit) => (
            <div 
              key={unit.unitId} 
              className="unit-card"
              onClick={() => {
                const url = titleId 
                  ? `/dashboard/units/${unit.unitId}/sets?titleId=${titleId}`
                  : `/dashboard/units/${unit.unitId}/sets`;
                router.push(url);
              }}
            >
              {/* ✅ FIXED: Object name handling */}
              <h3 style={{ 
                fontSize: 20, 
                fontWeight: "bold", 
                marginBottom: 12,
                color: "#1f2937"
              }}>
                {unit.name?.en || unit.name?.hi || 'Unit'}
              </h3>
              
              <p style={{ 
                fontSize: 28, 
                color: "var(--primary-blue)", 
                fontWeight: "bold", 
                margin: "0 0 12px 0" 
              }}>
                {unit.totalQuestions.toLocaleString()} Questions
              </p>
              
              {/* ✅ Difficulty breakdown */}
              {unit.easy !== undefined && (
                <p style={{ fontSize: 14, color: "#10b981", marginBottom: 4 }}>
                  {unit.easy} Easy • {unit.medium} Medium • {unit.hard} Hard
                </p>
              )}
              
              {unit.chapterCount && (
                <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                  {unit.chapterCount} Chapters
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
