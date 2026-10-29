import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
  // Fetch featured products
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery(
    'featured-products',
    () => productService.getProducts({ featured: true, limit: 8 }),
    {
      select: (response) => response.data.products
    }
  );

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery(
    'categories',
    () => productService.getCategories(),
    {
      select: (response) => response.data
    }
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Everything you love, in one place
          </h1>
          <p className="hero-subtitle">
            Shop electronics, fashion, home essentials, books and more, with free shipping on orders over $50.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/products" className="btn btn-light btn-lg">
              Shop Now
            </Link>
            <Link to="/products?featured=true" className="btn btn-outline-light btn-lg">
              View Featured
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section style={{ padding: '4rem 0', backgroundColor: 'white' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>
            Shop by Category
          </h2>
          
          {categoriesLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="grid grid-3">
              {categories?.length === 0 && (
                <p style={{ textAlign: 'center', color: '#6c757d', gridColumn: '1 / -1' }}>
                  No categories yet. Run <code>npm run seed</code> in backend/product-service to load sample data.
                </p>
              )}
              {categories?.map((category) => (
                <Link 
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {category.image?.url ? (
                    <img 
                      src={category.image.url} 
                      alt={category.image.alt || category.name}
                      className="card-img"
                    />
                  ) : (
                    <div 
                      className="card-img" 
                      style={{ 
                        backgroundColor: '#f8f9fa', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#6c757d',
                        fontSize: '3rem'
                      }}
                    >
                      📦
                    </div>
                  )}
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3 className="card-title">{category.name}</h3>
                    <p className="card-text">{category.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section style={{ padding: '4rem 0', backgroundColor: '#f8f9fa' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>
            Featured Products
          </h2>
          
          {featuredLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-4">
                {featuredProducts?.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <Link to="/products" className="btn btn-primary" style={{ fontSize: '1.1rem' }}>
                  View All Products
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 0', backgroundColor: 'white' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>
            Why Choose Us?
          </h2>
          
          <div className="grid grid-3">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚚</div>
              <h3>Fast Delivery</h3>
              <p>Free shipping on orders over $50. Express delivery available.</p>
            </div>
            
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
              <h3>Secure Payment</h3>
              <p>Your payment information is encrypted and secure.</p>
            </div>
            
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📞</div>
              <h3>24/7 Support</h3>
              <p>Our customer service team is always here to help.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;