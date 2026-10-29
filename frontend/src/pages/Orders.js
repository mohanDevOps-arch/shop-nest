import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { orderService, handleApiError } from '../services/api';
import { capitalize } from '../utils/format';

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];

const Orders = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const paymentFailed = searchParams.get('paymentFailed');
  const orderId = searchParams.get('orderId');
  const [busyOrder, setBusyOrder] = useState(null);

  const refreshOrders = () => {
    queryClient.invalidateQueries('orders');
    queryClient.invalidateQueries('products');
  };

  const handleCancel = async (order) => {
    if (!window.confirm(`Cancel order ${order.orderNumber}?`)) return;

    setBusyOrder(order._id);
    try {
      await orderService.cancelOrder(order._id, { reason: 'Cancelled by customer' });
      showToast(order.paymentStatus === 'paid'
        ? 'Order cancelled. Your payment will be refunded.'
        : 'Order cancelled.');
      refreshOrders();
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setBusyOrder(null);
    }
  };

  const handleRetryPayment = async (order) => {
    setBusyOrder(order._id);
    try {
      await orderService.processPayment({ orderId: order._id, paymentMethod: order.paymentMethod });
      showToast('Payment successful!');
      refreshOrders();
    } catch (error) {
      showToast(error.response?.data?.error || handleApiError(error), 'error');
    } finally {
      setBusyOrder(null);
    }
  };

  const handleReorder = async (order) => {
    setBusyOrder(order._id);
    // Sequential on purpose: parallel writes to the same cart document conflict
    const results = [];
    for (const item of order.items) {
      results.push(await addToCart(item.productId, item.quantity));
    }
    setBusyOrder(null);

    const failed = results.filter(result => !result.success).length;
    if (failed === order.items.length) {
      showToast('Sorry, none of these items are available right now.', 'error');
      return;
    }
    if (failed > 0) {
      showToast(`${failed} item(s) are no longer available and were skipped.`, 'info');
    } else {
      showToast('Items added to your cart');
    }
    navigate('/cart');
  };

  const { data: ordersData, isLoading, error } = useQuery(
    ['orders', user?._id],
    () => orderService.getUserOrders(user._id),
    {
      select: (response) => response.data,
      enabled: !!user
    }
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#007bff',
      processing: '#6f42c1',
      shipped: '#fd7e14',
      delivered: '#28a745',
      cancelled: '#dc3545',
      refunded: '#6c757d',
      paid: '#28a745',
      failed: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    return texts[status] || status;
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <h1>Your Orders</h1>
        <p>Please log in to view your orders.</p>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="error">
          Error loading orders: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>Your Orders</h1>

      {success && orderId && (
        <div className="success" style={{ marginBottom: '2rem' }}>
          <h3>Order Placed Successfully! 🎉</h3>
          <p>Thank you for shopping with us. We'll get your order to you soon.</p>
        </div>
      )}

      {paymentFailed && orderId && (
        <div className="error" style={{ marginBottom: '2rem' }}>
          <h3>Payment declined</h3>
          <p>Your order was created but the payment didn't go through. Use "Retry Payment" below, or cancel the order.</p>
        </div>
      )}

      {!ordersData?.orders || ordersData.orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <h3>No Orders Found</h3>
          <p style={{ marginBottom: '2rem' }}>You haven't placed any orders yet.</p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {ordersData.orders.map(order => (
            <div 
              key={order._id}
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '10px', 
                padding: '2rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
            >
              {/* Order Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    Order #{order.orderNumber}
                  </h3>
                  <p style={{ color: '#6c757d', marginBottom: '0.5rem' }}>
                    Placed on {formatDate(order.createdAt)}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span 
                      style={{ 
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '15px',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {getStatusText(order.status)}
                    </span>
                    <span 
                      style={{ 
                        backgroundColor: getStatusColor(order.paymentStatus),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '15px',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {{
                        paid: 'Paid',
                        failed: 'Payment Failed',
                        refunded: 'Refunded'
                      }[order.paymentStatus] || (order.paymentMethod === 'cash_on_delivery' ? 'Pay on Delivery' : 'Payment Pending')}
                    </span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                    {formatPrice(order.pricing.total)}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div style={{ 
                borderTop: '1px solid #e9ecef', 
                borderBottom: '1px solid #e9ecef',
                padding: '1rem 0',
                marginBottom: '1rem'
              }}>
                <h4 style={{ marginBottom: '1rem' }}>Items Ordered</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {order.items.map(item => (
                    <div 
                      key={item.productId}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {item.productDetails.name}
                        </div>
                        <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                          SKU: {item.productDetails.sku} • Qty: {item.quantity}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold' }}>
                          {formatPrice(item.total)}
                        </div>
                        <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                          {formatPrice(item.price)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Tracking */}
              <div className="grid grid-2" style={{ gap: '2rem' }}>
                <div>
                  <h4 style={{ marginBottom: '1rem' }}>Shipping Address</h4>
                  <div style={{ color: '#6c757d' }}>
                    <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ marginBottom: '1rem' }}>Delivery Info</h4>
                  <div style={{ color: '#6c757d' }}>
                    <p><strong>Method:</strong> {capitalize(order.shipping.method)}</p>
                    <p><strong>Payment:</strong> {order.paymentMethod.split('_').map(capitalize).join(' ')}</p>
                    {order.shipping.trackingNumber && (
                      <p><strong>Tracking:</strong> {order.shipping.trackingNumber}</p>
                    )}
                    {order.shipping.carrier && (
                      <p><strong>Carrier:</strong> {order.shipping.carrier}</p>
                    )}
                    {order.shipping.estimatedDelivery && (
                      <p><strong>Estimated Delivery:</strong> {formatDate(order.shipping.estimatedDelivery)}</p>
                    )}
                    {order.shipping.deliveredAt && (
                      <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                        <strong>Delivered:</strong> {formatDate(order.shipping.deliveredAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Actions */}
              <div style={{ 
                marginTop: '1.5rem', 
                paddingTop: '1rem', 
                borderTop: '1px solid #e9ecef',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                {['pending', 'failed'].includes(order.paymentStatus) &&
                  order.paymentMethod !== 'cash_on_delivery' &&
                  order.status !== 'cancelled' && (
                  <button
                    className="btn btn-primary"
                    disabled={busyOrder === order._id}
                    onClick={() => handleRetryPayment(order)}
                  >
                    Retry Payment
                  </button>
                )}

                {CANCELLABLE_STATUSES.includes(order.status) && (
                  <button
                    className="btn btn-secondary"
                    disabled={busyOrder === order._id}
                    onClick={() => handleCancel(order)}
                  >
                    Cancel Order
                  </button>
                )}

                {['delivered', 'cancelled', 'refunded'].includes(order.status) && (
                  <button
                    className="btn btn-outline"
                    disabled={busyOrder === order._id}
                    onClick={() => handleReorder(order)}
                  >
                    Buy Again
                  </button>
                )}

                {order.notes && (
                  <span style={{ color: '#6c757d', alignSelf: 'center', fontSize: '0.9rem' }}>
                    Note: {order.notes}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;