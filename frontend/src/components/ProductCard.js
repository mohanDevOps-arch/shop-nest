import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../utils/format';
import StarRating from './StarRating';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const { stock, lowStockThreshold = 10 } = product.inventory;
  const imageUrl = product.images?.[0]?.url;

  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent navigation when clicking the button

    if (!user) {
      showToast('Please log in to add items to your cart', 'info');
      navigate('/login', { state: { from: `/products/${product._id}` } });
      return;
    }

    setAdding(true);
    const result = await addToCart(product._id, 1);
    setAdding(false);

    if (result.success) {
      showToast(`${product.name} added to cart`);
    } else {
      showToast(result.error, 'error');
    }
  };

  return (
    <div className="card product-card">
      <Link to={`/products/${product._id}`} className="card-img-wrapper">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={product.images[0].alt || product.name}
            className="card-img"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="card-img card-img-placeholder">No Image</div>
        )}
        {product.featured && <span className="badge badge-featured">Featured</span>}
        {stock > 0 && stock <= lowStockThreshold && (
          <span className="badge badge-low-stock">Only {stock} left</span>
        )}
        {stock === 0 && <span className="badge badge-sold-out">Sold out</span>}
      </Link>

      <div className="card-body">
        {product.category?.name && (
          <div className="card-category">{product.category.name}</div>
        )}
        <Link to={`/products/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="card-title">{product.name}</h3>
        </Link>

        {product.ratings?.count > 0 && (
          <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
            <StarRating value={product.ratings.average} /> {product.ratings.average.toFixed(1)} ({product.ratings.count})
          </div>
        )}

        <p className="card-text">
          {product.description.length > 90
            ? product.description.substring(0, 90) + '...'
            : product.description
          }
        </p>

        <div className="card-footer">
          <span className="card-price">{formatPrice(product.price)}</span>

          {stock > 0 ? (
            <button
              onClick={handleAddToCart}
              className="btn btn-primary btn-sm"
              disabled={adding}
            >
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          ) : (
            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
