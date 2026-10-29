import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatPrice } from '../utils/format';
import ProductCard from '../components/ProductCard';
import Reviews from '../components/Reviews';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  // Reset selections when moving to another product (e.g. via "You may also like")
  useEffect(() => {
    setQuantity(1);
    setSelectedImage(0);
    window.scrollTo(0, 0);
  }, [id]);

  const { data: product, isLoading, error } = useQuery(
    ['product', id],
    () => productService.getProduct(id),
    {
      select: (response) => response.data,
      retry: false
    }
  );

  const { data: related } = useQuery(
    ['related-products', product?.category?._id],
    () => productService.getProducts({ category: product.category._id, limit: 5 }),
    {
      enabled: !!product?.category?._id,
      select: (response) => response.data.products.filter(p => p._id !== id).slice(0, 4)
    }
  );

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please log in to add items to your cart', 'info');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    setAdding(true);
    const result = await addToCart(product._id, quantity);
    setAdding(false);

    if (result.success) {
      showToast(`${quantity} × ${product.name} added to cart`);
    } else {
      showToast(result.error, 'error');
    }
  };

  const handleQuantityChange = (value) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setQuantity(1);
      return;
    }
    setQuantity(Math.min(Math.max(parsed, 1), product.inventory.stock));
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="error">
          Product not found
        </div>
        <Link to="/products" className="btn btn-primary">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <nav className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/products?category=${product.category._id}`}>{product.category.name}</Link>
          </>
        )}
        <span>/</span>
        <span style={{ color: '#333' }}>{product.name}</span>
      </nav>

      <div className="grid grid-2" style={{ gap: '3rem' }}>
        {/* Product Images */}
        <div>
          {product.images && product.images.length > 0 ? (
            <div>
              <img 
                src={product.images[selectedImage]?.url} 
                alt={product.images[selectedImage]?.alt || product.name}
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  objectFit: 'cover',
                  borderRadius: '10px',
                  marginBottom: '1rem'
                }}
              />
              
              {product.images.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', overflow: 'auto' }}>
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        border: selectedImage === index ? '2px solid #007bff' : '2px solid transparent'
                      }}
                      onClick={() => setSelectedImage(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              width: '100%', 
              height: '400px', 
              backgroundColor: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              color: '#6c757d',
              fontSize: '2rem'
            }}>
              No Image Available
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {product.name}
          </h1>
          
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            Brand: {product.brand}
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            {product.ratings.count > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>
                  ⭐ {product.ratings.average.toFixed(1)}
                </span>
                <span style={{ color: '#6c757d' }}>
                  ({product.ratings.count} reviews)
                </span>
              </div>
            ) : (
              <span style={{ color: '#6c757d' }}>No reviews yet</span>
            )}
          </div>

          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff', marginBottom: '1.5rem' }}>
            {formatPrice(product.price)}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Description</h3>
            <p style={{ lineHeight: '1.6', color: '#666' }}>
              {product.description}
            </p>
          </div>

          {/* Product Specifications */}
          {product.specifications && (
            <div style={{ marginBottom: '2rem' }}>
              <h3>Specifications</h3>
              <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '5px' }}>
                {product.specifications.color && (
                  <p><strong>Color:</strong> {product.specifications.color}</p>
                )}
                {product.specifications.material && (
                  <p><strong>Material:</strong> {product.specifications.material}</p>
                )}
                {product.specifications.weight && (
                  <p><strong>Weight:</strong> {product.specifications.weight}g</p>
                )}
                {!!product.specifications.dimensions?.length && (
                  <p>
                    <strong>Dimensions:</strong> {' '}
                    {product.specifications.dimensions.length} × {' '}
                    {product.specifications.dimensions.width} × {' '}
                    {product.specifications.dimensions.height} cm
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stock Info */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ color: product.inventory.stock > 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
              {product.inventory.stock > 0 
                ? `${product.inventory.stock} in stock` 
                : 'Out of stock'
              }
            </p>
            <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              SKU: {product.inventory.sku}
            </p>
          </div>

          {/* Add to Cart */}
          {product.inventory.stock > 0 && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={product.inventory.stock}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="form-control"
                  style={{ width: '80px' }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>&nbsp;</label>
                <button 
                  onClick={handleAddToCart}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '1.1rem', padding: '0.75rem' }}
                  disabled={adding}
                >
                  {adding ? 'Adding...' : `Add to Cart · ${formatPrice(product.price * quantity)}`}
                </button>
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h4>Tags</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {product.tags.map((tag, index) => (
                  <span 
                    key={index}
                    style={{
                      backgroundColor: '#e9ecef',
                      color: '#495057',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '15px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Reviews product={product} />

      {related?.length > 0 && (
        <section style={{ marginTop: '4rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>You may also like</h2>
          <div className="grid grid-4">
            {related.map(item => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;