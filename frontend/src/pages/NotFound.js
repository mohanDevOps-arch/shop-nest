import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧭</div>
      <h1 style={{ marginBottom: '1rem' }}>Page not found</h1>
      <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/products" className="btn btn-primary">Browse Products</Link>
    </div>
  );
};

export default NotFound;
