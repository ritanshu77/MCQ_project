import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, User as UserIcon, Calendar, Clock, Smartphone, Mail, Globe, Plus, Edit, X, Eye, Activity, Award, BookOpen } from 'lucide-react';

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

interface User {
  _id: string;
  name: string;
  gmail?: string;
  mobile?: string;
  type: 'guest' | 'registered';
  createdAt: string;
  lastActive?: string;
  totalTimeSpent?: number;
  sessions?: any[];
}

interface UserStats {
  totalTests: number;
  avgScore: number;
  lastTestDate: string | null;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    email: '',
    mobile: '',
    password: '',
    type: 'registered'
  });

  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [viewUserStats, setViewUserStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/users`, {
        params: {
          page,
          limit: 10,
          search,
          type: typeFilter,
        }
      });
      setUsers(res.data.users);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search, typeFilter]);

  const handleViewUser = async (user: User) => {
    setIsViewModalOpen(true);
    setViewUser(user);
    setViewUserStats(null);
    setLoadingStats(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/users/${user._id}`);
      setViewUser(res.data.user);
      setViewUserStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching user details:', err);
      toast.error('Failed to load user details');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setIsEditing(true);
      setCurrentUser(user);
      setFormData({
        name: user.name,
        email: user.gmail || '',
        mobile: user.mobile || '',
        password: '', // Don't fill password
        type: user.type as string
      });
    } else {
      setIsEditing(false);
      setCurrentUser(null);
      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: '',
        type: 'registered'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password on edit
      
      if (isEditing && currentUser) {
        await axios.put(`${API_BASE_URL}/admin/users/${currentUser._id}`, payload);
        toast.success('User updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/users`, payload);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="header-actions">
        <div>
          <h2>User Management</h2>
          <div className="stats-badge">
            Total Users: {users.length} (on this page)
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={18} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box" style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input 
            type="text" 
            placeholder="Search by name, email, mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div className="filter-tabs" style={{ display: 'flex', gap: '5px' }}>
          {['all', 'registered', 'guest'].map((type) => (
            <button
              key={type}
              onClick={() => { setTypeFilter(type); setPage(1); }}
              className={`btn ${typeFilter === type ? 'btn-primary' : 'btn-outline'}`}
              style={{ 
                textTransform: 'capitalize',
                background: typeFilter === type ? '#3498db' : 'white',
                color: typeFilter === type ? 'white' : '#333',
                border: '1px solid #ddd'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="card">
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>No users found.</p>
        ) : (
          <>
            <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>User Info</th>
                    <th>Type</th>
                    <th>Contact</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '50%', 
                            background: user.type === 'registered' ? '#e1f5fe' : '#f5f5f5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: user.type === 'registered' ? '#0288d1' : '#757575'
                          }}>
                            <UserIcon size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '500' }}>{user.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>ID: {user._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge`} style={{
                          background: user.type === 'registered' ? '#d4edda' : '#fff3cd',
                          color: user.type === 'registered' ? '#155724' : '#856404',
                          textTransform: 'capitalize'
                        }}>
                          {user.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>
                          {user.gmail && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                              <Mail size={14} color="#666" /> {user.gmail}
                            </div>
                          )}
                          {user.mobile && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Smartphone size={14} color="#666" /> {user.mobile}
                            </div>
                          )}
                          {!user.gmail && !user.mobile && <span style={{ color: '#aaa' }}>-</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                            <Calendar size={14} color="#666" /> {formatDate(user.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            className="btn btn-sm" 
                            style={{ background: '#3498db', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => handleViewUser(user)}
                            title="View Details"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button 
                            className="btn btn-sm" 
                            style={{ background: '#f39c12', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => handleOpenModal(user)}
                          >
                            <Edit size={14} /> Edit
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

      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>{isEditing ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Name *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Mobile</label>
                <input 
                  type="text" 
                  value={formData.mobile}
                  onChange={e => setFormData({...formData, mobile: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Password {isEditing && '(Leave blank to keep current)'}</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder={isEditing ? '********' : 'Required for new users'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Type</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="registered">Registered</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ background: '#eee', color: '#333' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && viewUser && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ 
                  width: '50px', height: '50px', borderRadius: '50%', 
                  background: viewUser.type === 'registered' ? '#e1f5fe' : '#f5f5f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: viewUser.type === 'registered' ? '#0288d1' : '#757575'
                }}>
                  <UserIcon size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{viewUser.name}</h2>
                  <span className={`badge`} style={{
                    background: viewUser.type === 'registered' ? '#d4edda' : '#fff3cd',
                    color: viewUser.type === 'registered' ? '#155724' : '#856404',
                    textTransform: 'capitalize', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px'
                  }}>
                    {viewUser.type}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#666" />
              </button>
            </div>

            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading stats...</div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                  <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                    <Clock size={24} color="#3498db" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Time Spent</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                      {formatDuration(viewUser.totalTimeSpent || 0)}
                    </div>
                  </div>
                  
                  <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                    <Activity size={24} color="#9b59b6" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Tests</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                      {viewUserStats?.totalTests || 0}
                    </div>
                  </div>

                  <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                    <Award size={24} color="#f1c40f" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Avg Score</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                      {viewUserStats?.avgScore || 0}
                    </div>
                  </div>
                </div>

                {/* Contact & Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
                  <div>
                    <h4 style={{ marginBottom: '10px', color: '#444', borderBottom: '2px solid #3498db', display: 'inline-block', paddingBottom: '3px' }}>Contact Info</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Mail size={16} color="#666" />
                        <span>{viewUser.gmail || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Smartphone size={16} color="#666" />
                        <span>{viewUser.mobile || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ marginBottom: '10px', color: '#444', borderBottom: '2px solid #3498db', display: 'inline-block', paddingBottom: '3px' }}>Activity</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={16} color="#666" />
                        <span>Joined: {formatDate(viewUser.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen size={16} color="#666" />
                        <span>Last Active: {viewUserStats?.lastTestDate ? formatDate(viewUserStats.lastTestDate) : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="btn" 
                style={{ background: '#eee', color: '#333', padding: '8px 20px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
