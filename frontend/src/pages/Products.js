import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';

const DEFAULT_FILTERS = {
  page: '1',
  category: '',
  search: '',
  minPrice: '',
  maxPrice: '',
  featured: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const Products = () => {
  // The URL is the source of truth, so header search, category links and
  // the back button all work
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = Object.fromEntries(
    Object.entries(DEFAULT_FILTERS).map(([key, value]) => [key, searchParams.get(key) || value])
  );
  const page = parseInt(filters.page, 10) || 1;

  const [searchInput, setSearchInput] = useState(filters.search);

  // Keep the input in sync when the search changes elsewhere (e.g. header)
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const setParams = (updates, resetPage = true) => {
    const next = { ...filters, ...updates };
    if (resetPage) next.page = '1';

    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value && value !== DEFAULT_FILTERS[key]) {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  // Debounce typing so we don't query on every keystroke
  useEffect(() => {
    if (searchInput === filters.search) return;
    const timer = setTimeout(() => setParams({ search: searchInput }), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const queryParams = { ...filters, page, limit: 12 };
  Object.keys(queryParams).forEach(key => queryParams[key] === '' && delete queryParams[key]);

  // Fetch products
  const { data: productsData, isLoading, isFetching, error } = useQuery(
    ['products', queryParams],
    () => productService.getProducts(queryParams),
    {
      select: (response) => response.data,
      keepPreviousData: true
    }
  );

  // Fetch categories for filter
  const { data: categories } = useQuery(
    'categories',
    () => productService.getCategories(),
    {
      select: (response) => response.data
    }
  );

  const handlePageChange = (newPage) => {
    setParams({ page: String(newPage) }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const activeCategory = categories?.find(c => c._id === filters.category);
  const hasFilters = searchParams.toString() !== '' && searchParams.toString() !== `page=${page}`;

  if (error) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="error">
          Error loading products: {error.message}. Make sure the Product Service is running on port 3002.
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>
        {filters.featured === 'true' ? 'Featured Products' : activeCategory ? activeCategory.name : 'All Products'}
      </h1>
      {activeCategory && (
        <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>{activeCategory.description}</p>
      )}

      {/* Category chips */}
      <div className="chip-row">
        <button
          className={`chip ${!filters.category ? 'chip-active' : ''}`}
          onClick={() => setParams({ category: '' })}
        >
          All
        </button>
        {categories?.map(category => (
          <button
            key={category._id}
            className={`chip ${filters.category === category._id ? 'chip-active' : ''}`}
            onClick={() => setParams({ category: category._id })}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="panel" style={{ marginBottom: '2rem' }}>
        <div className="filter-grid">
          <div className="form-group">
            <label>Search</label>
            <input
              type="search"
              className="form-control"
              placeholder="Name, brand or keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Min Price</label>
            <input
              type="number"
              className="form-control"
              placeholder="$0"
              min="0"
              value={filters.minPrice}
              onChange={(e) => setParams({ minPrice: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Max Price</label>
            <input
              type="number"
              className="form-control"
              placeholder="Any"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => setParams({ maxPrice: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Sort By</label>
            <select
              className="form-control"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setParams({ sortBy, sortOrder });
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="ratings.average-desc">Highest Rated</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal' }}>
              <input
                type="checkbox"
                checked={filters.featured === 'true'}
                onChange={(e) => setParams({ featured: e.target.checked ? 'true' : '' })}
              />
              Featured only
            </label>
          </div>
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="btn btn-secondary btn-sm">
            Clear Filters
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {/* Results Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            color: '#6c757d'
          }}>
            <span>
              Showing {productsData?.products?.length || 0} of {productsData?.total || 0} products
              {filters.search && <> for "<strong>{filters.search}</strong>"</>}
            </span>
            <span>
              Page {page} of {productsData?.totalPages || 1}
            </span>
          </div>

          {/* Products Grid */}
          {productsData?.products?.length > 0 ? (
            <div className="grid grid-4">
              {productsData.products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: '3rem' }}>🔍</div>
              <h3>No products found</h3>
              <p style={{ marginBottom: '1.5rem' }}>Try adjusting your filters or search terms.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="btn btn-primary">Clear Filters</button>
              )}
            </div>
          )}

          {/* Pagination */}
          {productsData?.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </button>

              {Array.from({ length: productsData.totalPages }, (_, i) => i + 1)
                .filter(p =>
                  p === 1 ||
                  p === productsData.totalPages ||
                  Math.abs(p - page) <= 2
                )
                .map(p => (
                  <button
                    key={p}
                    className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ))}

              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= productsData.totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Products;
