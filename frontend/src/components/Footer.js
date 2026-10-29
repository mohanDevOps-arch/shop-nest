import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div>
          <div className="logo" style={{ color: 'white' }}>E-Commerce</div>
          <p style={{ marginTop: '0.5rem', maxWidth: '280px' }}>
            Quality products across electronics, fashion, home and more, delivered to your door.
          </p>
        </div>
        <div>
          <h4>Shop</h4>
          <ul>
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products?featured=true">Featured</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4>Account</h4>
          <ul>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/orders">Orders</Link></li>
          </ul>
        </div>
        <div>
          <h4>Help</h4>
          <ul>
            <li>Free shipping over $50</li>
            <li>Cancel any order before it ships</li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        © {new Date().getFullYear()} E-Commerce Store. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
