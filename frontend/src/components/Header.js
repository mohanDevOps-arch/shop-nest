import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const term = search.trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            🛍️ ShopNest
          </Link>

          <form onSubmit={handleSearch} className="header-search">
            <input
              type="search"
              className="form-control"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </form>

          <nav>
            <ul className="nav-links">
              <li><NavLink to="/" end>Home</NavLink></li>
              <li><NavLink to="/products">Products</NavLink></li>
              {user && <li><NavLink to="/orders">Orders</NavLink></li>}
              {user?.role === 'admin' && <li><NavLink to="/admin">Admin</NavLink></li>}
              <li>
                <NavLink to="/cart" style={{ position: 'relative' }}>
                  Cart
                  {getCartItemsCount() > 0 && (
                    <span className="cart-badge">
                      {getCartItemsCount()}
                    </span>
                  )}
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="auth-section">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/profile" className="btn btn-outline btn-sm">
                  👤 {user.firstName}
                </Link>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/login" className="btn btn-outline btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
