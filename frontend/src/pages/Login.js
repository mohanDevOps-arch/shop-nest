import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, error } = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // On success GuestRoute redirects back to where the user came from
    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => setFormData({ email, password });

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: '400px' }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '3rem', 
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login</h1>

        {location.state?.from && (
          <div className="info-box" style={{ marginBottom: '1rem' }}>
            Please log in to continue.
          </div>
        )}

        {error && (
          <div className="error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#007bff' }}>
              Register here
            </Link>
          </p>
        </div>

        <div className="info-box" style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <strong>Demo accounts</strong> (created by <code>npm run seed</code> in backend/user-service):
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fillDemo('demo@shop.com', 'demo123')}>
              Customer
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fillDemo('admin@shop.com', 'admin123')}>
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;