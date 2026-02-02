import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/admin/register`, { name, email, password });
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f6fa', padding: '15px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Admin Register</h2>
        {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>Register</button>
        </form>
        <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
