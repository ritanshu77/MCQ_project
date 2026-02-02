"use client";

import { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthToken } from "@/utils/auth";
import { toast, confirmToast } from "@/components/Toast";

interface Set {
  _id: string;
  name: { en: string; hi: string };
  totalQuestions: number;
  setNumber: number;
  isActive: boolean;
  score?: number;
  progress?: number;
  status?: string;
  totalAttempted?: number;
  testResult?: {
    _id: string;
    score: number;
    status: string;
    correctAnswers: number;
    totalQuestions: number;
    isReset: boolean;
  };
}

interface Chapter {
  _id: string;
  name: { hi: string; en: string };
  code: string;
  sets: Set[];
}

interface UnitSetsViewProps {
  unitId: string;
}

export default function UnitSetsView({ unitId }: UnitSetsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  const didFetchUserRef = useRef(false);

  useEffect(() => {
    // Prevent double fetch in Strict Mode
    if (didFetchUserRef.current) return;
    didFetchUserRef.current = true;

    // Fetch user details
    const fetchUser = async () => {
      try {
        const { data } = await axios.get('/api/auth/me');
        if (data?.success && data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSets(controller.signal);
    return () => controller.abort();
  }, [unitId, user]); // Refetch when user loads to get progress

  const fetchSets = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Need to get titleId from somewhere if we want to support title-chapter
      // Currently UnitSetsView only has unitId prop.
      // Assuming parent passes titleId or we extract it from URL if possible.
      // But for now, let's look at URL parameters since this component is likely on a page with params
      const currentUrl = new URL(window.location.href);
      let titleId: string | undefined = currentUrl.pathname.split('/titles/')[1]?.split('/')[0];

      // Fallback to query params if not found in path
      if (!titleId && searchParams) {
         titleId = searchParams.get('titleId') || undefined;
      }

      const quizType = titleId ? 'title-chapter' : 'chapter';

      const { data } = await axios.post(
        `/api/units/${unitId}/sets`,
        {
           titleId,
           quizType
        },
        { 
            withCredentials: true,
            headers,
            signal // Pass signal to axios
        }
      );
      
      if (data?.success && data?.data?.chapters) {
        setChapters(data.data.chapters);
      }
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('Request canceled', error.message);
        return;
      }
      console.error('Sets fetch error:', error);
      setChapters([]);
    } finally {
        // Only turn off loading if not cancelled (to avoid flickering if a new request is pending? 
        // actually if cancelled, the new request will handle loading state)
        // But we need to be careful. If request A is cancelled by B, B is already running. 
        // B set loading=true. A finishes (cancelled). A sets loading=false? NO.
        // We should check signal before setting loading false? 
        // Or better: rely on the fact that if cancelled, we return early? 
        // Wait, 'finally' runs even if cancelled/returned? Yes.
        // So we need to check cancellation in finally or avoid finally if possible for loading state?
        // Actually, if we use a ref to track "current request", we can check it.
        // But simply:
        if (!signal?.aborted) {
             setLoading(false);
        }
    }
  };

  const handleReset = async (e: React.MouseEvent, setId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    confirmToast('Are you sure you want to reset your progress?', async () => {
        try {
            const token = getAuthToken();
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            await axios.post('/api/attempts/reset', 
                { userId: user.id, questionSetId: setId },
                { headers }
            );
            fetchSets(); // Refresh to update UI
            toast('Progress reset successfully', 'success');
        } catch (err) {
            console.error('Reset error:', err);
            toast('Failed to reset', 'error');
        }
    });
  };

  return (
    <div>
      <style jsx>{`
      .main-content {
        margin: 0px;
        padding: 0px;
      }
        .back-btn { 
          display: inline-flex; align-items: center; gap: 4px; 
          padding: 6px 12px; background: white; border: 2px solid var(--primary-blue); 
          border-radius: 8px; color: var(--primary-blue); font-weight: 600; cursor: pointer;
          transition: all 0.3s; margin-bottom: 8px; font-size: 12px;
        }
        .back-btn:hover { background: var(--primary-blue); color: white; transform: translateY(-1px); }
        .header h1 { font-size: 24px; font-weight: bold; color: var(--primary-blue); margin: 0 0 4px 0; }
        .sets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .set-card { 
          background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); 
          border-left: 4px solid #ff9800; cursor: pointer; transition: all 0.3s;
          position: relative; overflow: hidden;
        }
        .set-card:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.12); }
        .empty-state { text-align: center; padding: 40px 20px; color: #666; }
        .loading { text-align: center; padding: 40px 20px; color: #666; }
        .progress-badge {
            position: absolute; top: 10px; right: 10px; 
            background: #e0f2f1; color: #00695c; padding: 2px 6px; 
            border-radius: 20px; font-size: 10px; font-weight: bold;
        }
        .reset-btn {
            padding: 2px 6px;
            font-size: 10px;
            background: #ef5350;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
            margin-left: 8px;
        }
        .reset-btn:hover { background: #d32f2f; }
        
        /* Loader Styles */
        .loader-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            width: 100%;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid var(--primary-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
      `}</style>

      <button onClick={() => router.back()} className="back-btn">
         Back
      </button>

      <div className="header">
        <h1>{chapters.length > 0 ? 'Chapters & Sets' : 'Unit Sets'}</h1>
        <p style={{ color: "#666", fontSize: 13, margin: "0 0 10px 0" }}>
          {loading ? "Loading..." : `${chapters.length} chapters available`}
        </p>
      </div>

      {loading ? (
        <div className="loader-container">
            <div className="spinner"></div>
        </div>
      ) : chapters.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 10 }}></div>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
            No Sets Available
          </h2>
          <p style={{ fontSize: 14 }}>
            Is unit mein abhi koi sets nahi hain.
          </p>
        </div>
      ) : (
        <div className="chapters-container">
          {chapters.map((chapter) => (
            <div key={chapter._id} className="chapter-section" style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4, borderBottom: '2px solid #eee', paddingBottom: 5 }}>
                {chapter.name.en} <span style={{ fontSize: 14, color: '#666', fontWeight: 'normal' }}>({chapter.name.hi})</span>
              </h2>
              
              <div className="sets-grid">
                {chapter.sets.map((set) => (
                  <div 
                    key={set._id} 
                    className="set-card"
                    onClick={() => {
                      try { localStorage.removeItem(`quiz_exited_${set._id}`); } catch {}
                      
                      // Check for titleId in current URL or search params
                      const currentUrl = new URL(window.location.href);
                      let currentTitleId: string | undefined = currentUrl.pathname.split('/titles/')[1]?.split('/')[0];
                      if (!currentTitleId && searchParams) {
                         currentTitleId = searchParams.get('titleId') || undefined;
                      }

                      const targetUrl = currentTitleId 
                        ? `/dashboard/units/${unitId}/sets/${set._id}?titleId=${currentTitleId}`
                        : `/dashboard/units/${unitId}/sets/${set._id}`;

                      router.push(targetUrl);
                    }}
                  >
                    {!set.isActive && (
                      <span className="progress-badge" style={{ background: '#ffebee', color: '#c62828' }}>
                         Inactive
                      </span>
                    )}
                    
                    <h3 style={{ 
                      fontSize: 16, 
                      fontWeight: "bold", 
                      marginBottom: 4,
                      color: "#1f2937",
                      paddingRight: '50px'
                    }}>
                      {set.name?.en || set.name?.hi || `Set ${set.setNumber}`}
                    </h3>
                    
                    <p style={{ 
                      fontSize: 20, 
                      color: "var(--primary-blue)", 
                      fontWeight: "bold", 
                      margin: "0 0 4px 0" 
                    }}>
                      {set.totalQuestions} Questions
                    </p>
                    
                    {/* Progress & Score */}
                    <div style={{ marginTop: '4px' }}>
                        {(set.progress !== undefined && set.progress > 0) && (
                           <div style={{ 
                               display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' 
                           }}>
                               <span>Score: </span>
                               <span style={{ color: (set.score || 0) >= 0 ? 'var(--primary-blue)' : 'red' }}>
                                   {(set.score || 0).toFixed(2)}
                               </span>
                           </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                           <div style={{ flex: 1, height: '4px', background: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                              {(set.score || 0) !== 0 && (
                                <div style={{ 
                                    width: `${Math.min((Math.abs(set.score || 0) / (set.totalQuestions || 1)) * 100, 100)}%`, 
                                    height: '100%', 
                                    background: (set.score || 0) >= 0 ? 'var(--primary-blue)' : 'red' 
                                }}></div>
                              )}
                           </div>
                           {/* Reset Button - Show if testResult exists and status is NOT 'not_started' */}
                           {set.testResult && set.testResult.status !== 'not_started' && (
                               <button 
                                  className="reset-btn"
                                  onClick={(e) => handleReset(e, set._id)}
                                  title="Reset Quiz"
                               >
                                  Reset
                               </button>
                           )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
