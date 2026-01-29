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
          display: inline-flex; align-items: center; gap: 4px; 
          padding: 6px 12px; background: white; border: 2px solid var(--primary-blue); 
          border-radius: 8px; color: var(--primary-blue); font-weight: 600; cursor: pointer;
          transition: all 0.3s; margin-bottom: 12px; font-size: 12px;
        }
        .back-btn:hover { background: var(--primary-blue); color: white; transform: translateY(-1px); }
        .header h1 { font-size: 24px; font-weight: bold; color: var(--primary-blue); margin: 0 0 4px 0; }
        .units-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; }
        .unit-card { 
          background: white; padding: 4px 7px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
          border-left: 4px solid #10b981; cursor: pointer; transition: all 0.3s;
        }
        .unit-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        .empty-state { text-align: center; padding: 40px 20px; color: #666; }
        .loading { text-align: center; padding: 40px 20px; color: #666; }
      `}</style>

      <button onClick={onBack} className="back-btn">
        ← Back to Dashboard
      </button>

      <div className="header">
        <h1>Units - {subjectName}</h1>
        <p style={{ color: "#666", fontSize: 13, margin: "0 0 10px 0" }}>
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
                fontSize: 16, 
                fontWeight: "bold", 
                marginBottom: 6,
                color: "#1f2937"
              }}>
                {unit.name?.en || unit.name?.hi || 'Unit'}
              </h3>
              
              <p style={{ 
                fontSize: 22, 
                color: "var(--primary-blue)", 
                fontWeight: "bold", 
                margin: "0 0 8px 0" 
              }}>
                {unit.totalQuestions.toLocaleString()} Questions
              </p>
              
              {/* ✅ Difficulty breakdown */}
              {unit.easy !== undefined && (
                <p style={{ fontSize: 12, color: "#10b981", marginBottom: 2 }}>
                  {unit.easy} Easy • {unit.medium} Medium • {unit.hard} Hard
                </p>
              )}
              
              {unit.chapterCount && (
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
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
