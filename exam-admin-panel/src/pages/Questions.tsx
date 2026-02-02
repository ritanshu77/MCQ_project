import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Search, X, Save, ChevronDown, ChevronRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

interface BilingualText {
  en: string;
  hi: string;
}

interface Option {
  text: BilingualText;
  key: string; // 'A', 'B', 'C', 'D', 'E'
}

interface Question {
  _id: string;
  questionText: BilingualText;
  options: Option[];
  correctOptionKey: string;
  explanation?: BilingualText;
  subjectId?: string;
  unitId?: string;
  chapterId?: string;
  subjectName?: string;
  unitName?: string;
  chapterName?: string;
  difficulty: string;
  questionNumber: number;
  status: string;
}

interface Subject {
  subjectId: string;
  nameEn: string;
  nameHi: string;
}

interface Unit {
  unitId: string;
  name: BilingualText;
  chapters: Chapter[];
}

interface Chapter {
  _id: string;
  name: BilingualText;
}

const initialFormState = {
  questionNumber: 1,
  questionText: { en: '', hi: '' },
  options: [
    { text: { en: '', hi: '' }, key: 'A' },
    { text: { en: '', hi: '' }, key: 'B' },
    { text: { en: '', hi: '' }, key: 'C' },
    { text: { en: '', hi: '' }, key: 'D' },
  ],
  correctOptionKey: 'A',
  explanation: { en: '', hi: '' },
  subjectId: '',
  unitId: '',
  chapterId: '',
  difficulty: 'medium',
  status: 'active'
};

const Questions = () => {
  // Data States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formLoading, setFormLoading] = useState(false);

  // Fetch Questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/questions/questions`, {
        params: {
          page,
          limit: 10,
          search,
          difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        }
      });
      setQuestions(res.data.questions);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Subjects (for Form)
  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/questions/subjects/list`);
      setSubjects(res.data.subjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchQuestions();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search, difficultyFilter]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Fetch Units when Subject changes
  useEffect(() => {
    if (formData.subjectId) {
      fetchUnits(formData.subjectId);
    } else {
      setUnits([]);
    }
  }, [formData.subjectId]);

  const fetchUnits = async (subjectId: string) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/questions/subjects/units`, { subjectId });
      setUnits(res.data.units || []);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  // Handlers
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/questions/${id}`);
      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (err: any) {
      console.error('Error deleting question:', err);
      toast.error(err.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleEdit = (q: Question) => {
    setEditingId(q._id);
    setFormData({
      questionNumber: q.questionNumber || 1,
      questionText: q.questionText || { en: '', hi: '' },
      options: q.options || initialFormState.options,
      correctOptionKey: q.correctOptionKey || 'A',
      explanation: q.explanation || { en: '', hi: '' },
      subjectId: q.subjectId || '',
      unitId: q.unitId || '',
      chapterId: q.chapterId || '',
      difficulty: q.difficulty || 'medium',
      status: q.status || 'active'
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setFormLoading(true);
      // Basic Validation
      if (!formData.questionText.en && !formData.questionText.hi) {
        toast.error('Question text is required (English or Hindi)');
        setFormLoading(false);
        return;
      }
      if (!formData.subjectId) {
        toast.error('Subject is required');
        setFormLoading(false);
        return;
      }

      // Clean payload: remove empty strings for IDs
      const payload: any = { ...formData };
      if (!payload.unitId) delete payload.unitId;
      if (!payload.chapterId) delete payload.chapterId;
      
      // Ensure options key match
      // (The form UI forces A-D/E so this is likely safe, but good to be aware)

      if (editingId) {
        await axios.patch(`${API_BASE_URL}/questions/${editingId}`, payload);
        toast.success('Question updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/questions`, payload);
        toast.success('Question created successfully');
      }
      
      setShowModal(false);
      fetchQuestions();
    } catch (err: any) {
      console.error('Error saving question:', err);
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setFormLoading(false);
    }
  };

  // Helper to get available chapters based on selected unit
  const getAvailableChapters = () => {
    const selectedUnit = units.find(u => u.unitId === formData.unitId);
    return selectedUnit ? selectedUnit.chapters : [];
  };

  return (
    <div className="questions-page">
      {/* Header & Actions */}
      <div className="header-actions">
        <h2>Questions Management</h2>
        <button className="btn btn-primary" onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={16} /> Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box" style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input 
            type="text" 
            placeholder="Search questions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <select 
          value={difficultyFilter} 
          onChange={(e) => setDifficultyFilter(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading questions...</p>
        ) : questions.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>No questions found.</p>
        ) : (
          <>
            <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Context</th>
                    <th>Diff</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q._id}>
                      <td>{q.questionNumber}</td>
                      <td style={{ maxWidth: '400px' }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{q.questionText?.en?.substring(0, 80)}...</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{q.questionText?.hi?.substring(0, 80)}...</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div><strong>Sub:</strong> {q.subjectName}</div>
                          <div style={{ color: '#666' }}>{q.unitName} &gt; {q.chapterName}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" onClick={() => handleEdit(q)} title="Edit">
                            <Edit size={18} color="#3498db" />
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(q._id)} title="Delete">
                            <Trash2 size={18} color="#e74c3c" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn btn-sm">Prev</button>
              <span style={{ display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-sm">Next</button>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white', width: '90%', maxWidth: '800px', maxHeight: '90vh',
            borderRadius: '8px', display: 'flex', flexDirection: 'column'
          }}>
            <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Question' : 'Add New Question'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Question Number</label>
                <input
                  type="number"
                  min="1"
                  value={formData.questionNumber}
                  onChange={e => setFormData({ ...formData, questionNumber: parseInt(e.target.value) || 1 })}
                  style={{ width: '100px' }}
                />
              </div>

              {/* Question Text */}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Question Text</label>
                <div className="grid-2-cols">
                  <textarea 
                    placeholder="English" 
                    value={formData.questionText.en} 
                    onChange={e => setFormData({...formData, questionText: {...formData.questionText, en: e.target.value}})}
                    rows={3}
                  />
                  <textarea 
                    placeholder="Hindi" 
                    value={formData.questionText.hi} 
                    onChange={e => setFormData({...formData, questionText: {...formData.questionText, hi: e.target.value}})}
                    rows={3}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Options</label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex-row-responsive" style={{ marginBottom: '10px' }}>
                    <div style={{ width: '30px', fontWeight: 'bold' }}>{opt.key}</div>
                    <input 
                      type="text" placeholder="Option (En)" 
                      value={opt.text.en}
                      onChange={e => {
                        const newOpts = [...formData.options];
                        newOpts[idx].text.en = e.target.value;
                        setFormData({...formData, options: newOpts});
                      }}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="text" placeholder="Option (Hi)" 
                      value={opt.text.hi}
                      onChange={e => {
                        const newOpts = [...formData.options];
                        newOpts[idx].text.hi = e.target.value;
                        setFormData({...formData, options: newOpts});
                      }}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="radio" 
                      name="correctOption"
                      checked={formData.correctOptionKey === opt.key}
                      onChange={() => setFormData({...formData, correctOptionKey: opt.key})}
                    />
                  </div>
                ))}
              </div>

              {/* Classification */}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Classification</label>
                <div className="grid-3-cols">
                  <select 
                    value={formData.subjectId} 
                    onChange={e => setFormData({...formData, subjectId: e.target.value, unitId: '', chapterId: ''})}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.nameEn}</option>)}
                  </select>
                  
                  <select 
                    value={formData.unitId} 
                    onChange={e => setFormData({...formData, unitId: e.target.value, chapterId: ''})}
                    disabled={!formData.subjectId}
                  >
                    <option value="">Select Unit</option>
                    {units.map(u => <option key={u.unitId} value={u.unitId}>{u.name?.en || 'Unit'}</option>)}
                  </select>

                  <select 
                    value={formData.chapterId} 
                    onChange={e => setFormData({...formData, chapterId: e.target.value})}
                    disabled={!formData.unitId}
                  >
                    <option value="">Select Chapter</option>
                    {getAvailableChapters().map(c => <option key={c._id} value={c._id}>{c.name?.en || 'Chapter'}</option>)}
                  </select>
                </div>
              </div>

              {/* Explanation & Difficulty */}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label>Explanation</label>
                    <textarea 
                      placeholder="Explanation (English)" 
                      value={formData.explanation.en}
                      onChange={e => setFormData({...formData, explanation: {...formData.explanation, en: e.target.value}})}
                      rows={2}
                      style={{ width: '100%', marginBottom: '5px' }}
                    />
                    <textarea 
                      placeholder="Explanation (Hindi)" 
                      value={formData.explanation.hi}
                      onChange={e => setFormData({...formData, explanation: {...formData.explanation, hi: e.target.value}})}
                      rows={2}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label>Difficulty</label>
                    <select 
                      value={formData.difficulty} 
                      onChange={e => setFormData({...formData, difficulty: e.target.value})}
                      style={{ width: '100%', padding: '8px' }}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    
                    <label style={{ marginTop: '10px', display: 'block' }}>Status</label>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      style={{ width: '100%', padding: '8px' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn" onClick={() => setShowModal(false)} disabled={formLoading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .btn-icon { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 4px; transition: background 0.2s; }
        .btn-icon:hover { background: #f0f0f0; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
        .badge-easy { background: #e8f5e9; color: #2ecc71; }
        .badge-medium { background: #fff3e0; color: #f39c12; }
        .badge-hard { background: #ffebee; color: #e74c3c; }
        textarea, input[type="text"], select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; font-size: 0.9rem; }
      `}</style>
    </div>
  );
};

export default Questions;
