import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, BookOpen, Settings, LogOut, Menu, X, Users as UsersIcon } from 'lucide-react'
import axios from 'axios'
import { Toaster, toast } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Questions from './pages/Questions'
import Users from './pages/Users'

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin

// Axios Interceptor for Auth Token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Components
const Sidebar = ({ isOpen, onClose, isMobile }: { isOpen: boolean; onClose: () => void; isMobile: boolean }) => {
  const location = useLocation()
  
  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/admin/login'
  }

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/users', icon: <UsersIcon size={20} />, label: 'Users' },
    { path: '/feedback', icon: <MessageSquare size={20} />, label: 'Feedback' },
    { path: '/questions', icon: <BookOpen size={20} />, label: 'Questions' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ]

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">Exam Admin</div>
        {isMobile && (
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        )}
      </div>
      <nav>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => isMobile && onClose()}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', marginTop: 'auto' }}>
          <LogOut size={20} />
          Logout
        </button>
      </nav>
    </div>
  )
}

// Protected Route Component
const ProtectedRoute = () => {
  const token = localStorage.getItem('admin_token')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="admin-layout">
      {isMobile && (
        <div className="mobile-header">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span className="mobile-title">Exam Admin</span>
        </div>
      )}
      
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isMobile={isMobile} 
      />
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    pendingFeedback: 0,
    activeUsers: 0,
    totalSubjects: 0,
    totalUnits: 0,
    totalChapters: 0,
    registeredUsers: 0,
    guestUsers: 0,
    totalTestsTaken: 0,
    averageGlobalScore: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/admin/stats`)
        setStats(res.data)
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }
    fetchStats()
  }, [])

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Dashboard Overview</h2>
      
      {/* Content Stats */}
      <h3 style={{ color: '#555', marginBottom: '15px' }}>Content Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h3>Total Subjects</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#8e44ad' }}>{stats.totalSubjects}</p>
        </div>
        <div className="card">
          <h3>Total Units</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#2980b9' }}>{stats.totalUnits}</p>
        </div>
        <div className="card">
          <h3>Total Chapters</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#d35400' }}>{stats.totalChapters}</p>
        </div>
        <div className="card">
          <h3>Total Questions</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#34495e' }}>{stats.totalQuestions}</p>
        </div>
      </div>

      {/* User Stats */}
      <h3 style={{ color: '#555', marginBottom: '15px' }}>User Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h3>Total Users</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#27ae60' }}>{stats.activeUsers}</p>
        </div>
        <div className="card">
          <h3>Registered Users</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#16a085' }}>{stats.registeredUsers}</p>
        </div>
        <div className="card">
          <h3>Guest Users</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#f39c12' }}>{stats.guestUsers}</p>
        </div>
      </div>

      {/* Exam Stats */}
      <h3 style={{ color: '#555', marginBottom: '15px' }}>Exam Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card">
          <h3>Total Tests Taken</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#9b59b6' }}>{stats.totalTestsTaken || 0}</p>
        </div>
        <div className="card">
          <h3>Avg Global Score</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#3498db' }}>{stats.averageGlobalScore || 0}%</p>
        </div>
      </div>

      {/* Operational Stats */}
      <h3 style={{ color: '#555', marginBottom: '15px' }}>System Stats</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h3>Pending Feedback</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#e67e22' }}>{stats.pendingFeedback}</p>
        </div>
      </div>
    </div>
  )
}

interface Feedback {
  _id: string;
  userId: any;
  questionId: any;
  feedback: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'ignored';
  createdAt: string;
}

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE_URL}/feedback`)
      setFeedbacks(res.data)
    } catch (err) {
      console.error('Error fetching feedback:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/feedback/${id}/status`, { status })
      setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, status: status as any } : f))
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Failed to update status')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>User Feedback</h2>
        <button className="btn btn-primary" onClick={() => { fetchFeedback(); toast.success('Refreshed!'); }}>Refresh</button>
      </div>
      
      <div className="card">
        {loading ? (
          <p>Loading feedback...</p>
        ) : feedbacks.length === 0 ? (
          <p>No feedback found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Question</th>
                <th>Feedback</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb) => (
                <tr key={fb._id}>
                  <td>
                    {fb.userId?.name || fb.userId?.gmail || (typeof fb.userId === 'string' ? fb.userId : 'Unknown')}
                  </td>
                  <td>
                    <code style={{fontSize: '0.8rem'}}>
                      {fb.questionId?.questionText?.en?.substring(0, 30) || fb.questionId?._id || fb.questionId || 'N/A'}...
                    </code>
                  </td>
                  <td>{fb.feedback}</td>
                  <td>
                    <span className={`badge badge-${fb.status}`}>
                      {fb.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(fb.createdAt).toLocaleDateString()}</td>
                  <td>
                    {fb.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          className="btn btn-sm" 
                          style={{ backgroundColor: '#27ae60', color: 'white' }}
                          onClick={() => updateStatus(fb._id, 'resolved')}
                        >
                          Resolve
                        </button>
                        <button 
                          className="btn btn-sm" 
                          style={{ backgroundColor: '#e74c3c', color: 'white' }}
                          onClick={() => updateStatus(fb._id, 'ignored')}
                        >
                          Ignore
                        </button>
                      </div>
                    )}
                    {fb.status !== 'pending' && <span>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const App = () => {
  return (
    <BrowserRouter basename="/admin">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/feedback" element={<FeedbackList />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/settings" element={<div><h2>Admin Settings</h2><p>Coming Soon...</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
