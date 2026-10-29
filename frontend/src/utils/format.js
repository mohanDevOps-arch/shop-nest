export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price || 0);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
];

export const STATUS_COLORS = {
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

export const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);
