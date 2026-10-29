import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { productService, orderService, handleApiError } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatPrice, formatDate, capitalize, ORDER_STATUSES, STATUS_COLORS } from '../utils/format';

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  price: '',
  category: '',
  brand: '',
  imageUrl: '',
  stock: '',
  sku: '',
  tags: '',
  featured: false
};

// Statuses an admin can move an order to
const NEXT_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const StatCard = ({ label, value, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const ProductForm = ({ initial, categories, onCancel, onSaved }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial._id);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      brand: form.brand,
      images: form.imageUrl ? [{ url: form.imageUrl, alt: form.name }] : [],
      inventory: {
        stock: Number(form.stock),
        sku: form.sku,
        lowStockThreshold: initial.lowStockThreshold ?? 10
      },
      tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      featured: form.featured
    };

    try {
      if (isEdit) {
        await productService.updateProduct(initial._id, payload);
        showToast('Product updated');
      } else {
        await productService.createProduct(payload);
        showToast('Product created');
      }
      onSaved();
    } catch (error) {
      const message = error.response?.data?.error?.includes('duplicate key')
        ? 'A product with this SKU already exists'
        : handleApiError(error);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel" style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>{isEdit ? `Edit "${initial.name}"` : 'Add New Product'}</h3>
      <div className="grid grid-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label>Name</label>
          <input className="form-control" value={form.name} onChange={set('name')} required />
        </div>
        <div className="form-group">
          <label>Brand</label>
          <input className="form-control" value={form.brand} onChange={set('brand')} required />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select className="form-control" value={form.category} onChange={set('category')} required>
            <option value="">Select category</option>
            {categories?.map(category => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Price (USD)</label>
          <input type="number" min="0" step="0.01" className="form-control" value={form.price} onChange={set('price')} required />
        </div>
        <div className="form-group">
          <label>SKU</label>
          <input className="form-control" value={form.sku} onChange={set('sku')} required />
        </div>
        <div className="form-group">
          <label>Stock</label>
          <input type="number" min="0" step="1" className="form-control" value={form.stock} onChange={set('stock')} required />
        </div>
      </div>
      <div className="form-group">
        <label>Image URL</label>
        <input type="url" className="form-control" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea className="form-control" rows="3" value={form.description} onChange={set('description')} required />
      </div>
      <div className="form-group">
        <label>Tags (comma separated)</label>
        <input className="form-control" value={form.tags} onChange={set('tags')} placeholder="audio, bluetooth" />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <input type="checkbox" checked={form.featured} onChange={set('featured')} />
        Featured on home page
      </label>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const ProductsTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data: products, isLoading } = useQuery(
    ['admin-products'],
    () => productService.getProducts({ limit: 200, sortBy: 'name', sortOrder: 'asc' }),
    { select: (response) => response.data.products }
  );

  const { data: categories } = useQuery(
    'categories',
    () => productService.getCategories(),
    { select: (response) => response.data }
  );

  const refresh = () => {
    queryClient.invalidateQueries('admin-products');
    queryClient.invalidateQueries('products');
    queryClient.invalidateQueries('featured-products');
  };

  const startEdit = (product) => {
    setEditing({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category?._id || '',
      brand: product.brand,
      imageUrl: product.images?.[0]?.url || '',
      stock: product.inventory.stock,
      sku: product.inventory.sku,
      lowStockThreshold: product.inventory.lowStockThreshold,
      tags: (product.tags || []).join(', '),
      featured: product.featured
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Remove "${product.name}" from the store?`)) return;
    try {
      await productService.deleteProduct(product._id);
      showToast('Product removed');
      refresh();
    } catch (error) {
      showToast(handleApiError(error), 'error');
    }
  };

  return (
    <div>
      {editing ? (
        <ProductForm
          key={editing._id || 'new'}
          initial={editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      ) : (
        <button className="btn btn-primary" style={{ marginBottom: '1.5rem' }} onClick={() => setEditing(EMPTY_PRODUCT)}>
          + Add Product
        </button>
      )}

      {isLoading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>SKU</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products?.map(product => {
                const lowStock = product.inventory.stock <= (product.inventory.lowStockThreshold ?? 10);
                return (
                  <tr key={product._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {product.images?.[0]?.url && (
                          <img src={product.images[0].url} alt="" className="summary-thumb" />
                        )}
                        <div>
                          <Link to={`/products/${product._id}`} style={{ color: 'inherit', fontWeight: 600 }}>
                            {product.name}
                          </Link>
                          {product.featured && <span className="tag" style={{ marginLeft: '0.5rem' }}>Featured</span>}
                          <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>{product.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td>{product.category?.name || '—'}</td>
                    <td><code>{product.inventory.sku}</code></td>
                    <td style={{ textAlign: 'right' }}>{formatPrice(product.price)}</td>
                    <td style={{ textAlign: 'right', color: lowStock ? '#dc3545' : 'inherit', fontWeight: lowStock ? 'bold' : 'normal' }}>
                      {product.inventory.stock}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => startEdit(product)}>Edit</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products?.length === 0 && (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              No products yet. Add one above or run <code>npm run seed</code> in backend/product-service.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const OrdersTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['admin-orders', statusFilter],
    () => orderService.getAllOrders({ limit: 100, ...(statusFilter && { status: statusFilter }) }),
    { select: (response) => response.data, keepPreviousData: true }
  );

  const handleStatusChange = async (order, status) => {
    if (status === 'cancelled' && !window.confirm(`Cancel order ${order.orderNumber}? Stock will be restored.`)) {
      return;
    }
    try {
      await orderService.updateOrderStatus(order._id, { status, reason: 'Cancelled by store' });
      showToast(`Order ${order.orderNumber} marked as ${status}`);
      queryClient.invalidateQueries('admin-orders');
      queryClient.invalidateQueries('admin-products');
    } catch (error) {
      showToast(handleApiError(error), 'error');
    }
  };

  const stats = data?.stats;

  return (
    <div>
      <div className="stats-grid">
        <StatCard icon="💰" label="Revenue" value={formatPrice(stats?.revenue)} />
        <StatCard icon="📦" label="Active orders" value={stats?.activeOrders ?? '–'} />
        <StatCard icon="⏳" label="Awaiting fulfilment" value={stats?.awaitingFulfilment ?? '–'} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
        <label htmlFor="status-filter">Filter:</label>
        <select
          id="status-filter"
          className="form-control"
          style={{ maxWidth: '220px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map(status => (
            <option key={status} value={status}>{capitalize(status)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.orders.map(order => {
                const closed = ['cancelled', 'refunded'].includes(order.status);
                return (
                  <tr key={order._id}>
                    <td><code>{order.orderNumber}</code></td>
                    <td>
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                        {order.shippingAddress.city}, {order.shippingAddress.state}
                      </div>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td style={{ textAlign: 'right' }}>{formatPrice(order.pricing.total)}</td>
                    <td>
                      <span className="status-pill" style={{ backgroundColor: STATUS_COLORS[order.paymentStatus] }}>
                        {capitalize(order.paymentStatus)}
                      </span>
                    </td>
                    <td>
                      {closed ? (
                        <span className="status-pill" style={{ backgroundColor: STATUS_COLORS[order.status] }}>
                          {capitalize(order.status)}
                        </span>
                      ) : (
                        <select
                          className="form-control form-control-sm"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          style={{ borderLeft: `4px solid ${STATUS_COLORS[order.status]}` }}
                        >
                          {order.status === 'pending' && <option value="pending">Pending</option>}
                          {NEXT_STATUSES.map(status => (
                            <option key={status} value={status}>{capitalize(status)}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data?.orders.length === 0 && (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>No orders found.</p>
          )}
        </div>
      )}
    </div>
  );
};

const Admin = () => {
  const [tab, setTab] = useState('orders');

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h1>

      <div className="tabs">
        <button className={`tab ${tab === 'orders' ? 'tab-active' : ''}`} onClick={() => setTab('orders')}>
          Orders
        </button>
        <button className={`tab ${tab === 'products' ? 'tab-active' : ''}`} onClick={() => setTab('products')}>
          Products
        </button>
      </div>

      {tab === 'orders' ? <OrdersTab /> : <ProductsTab />}
    </div>
  );
};

export default Admin;
