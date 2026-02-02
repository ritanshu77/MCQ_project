import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, BookOpen, Settings, CheckCircle, Clock } from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = window.location.origin // Adjust based on your backend port

// Components
const Sidebar = () => {
  const location = useLocation()
  
  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/feedback', icon: <MessageSquare size={20} />, label: 'Feedback' },
    { path: '/questions', icon: <BookOpen size={20} />, label: 'Questions' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-title">Exam Admin</div>
      <nav>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

const Dashboard = () => (
  <div>
    <h2>Dashboard Overview</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
      <div className="card">
        <h3>Total Questions</h3>
        <p style={{ fontSize: '2rem', margin: 0 }}>1,250</p>
      </div>
      <div className="card">
        <h3>Pending Feedback</h3>
        <p style={{ fontSize: '2rem', margin: 0, color: '#e67e22' }}>12</p>
      </div>
      <div className="card">
        <h3>Active Users</h3>
        <p style={{ fontSize: '2rem', margin: 0, color: '#27ae60' }}>45</p>
      </div>
    </div>
  </div>
)

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

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/feedback`)
        setFeedbacks(res.data)
      } catch (err) {
        console.error('Error fetching feedback:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFeedback()
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>User Feedback</h2>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh</button>
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
                <th>Question ID</th>
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
                    <button className="btn btn-sm btn-primary">Review</button>
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
      <div className="admin-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/feedback" element={<FeedbackList />} />
            <Route path="/questions" element={<div><h2>Questions Management</h2><p>Coming Soon...</p></div>} />
            <Route path="/settings" element={<div><h2>Admin Settings</h2><p>Coming Soon...</p></div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
