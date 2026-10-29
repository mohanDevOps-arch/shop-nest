const express = require('express');
const axios = require('axios');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// Customers may only touch their own orders; admins may touch any
const canAccess = (user, userId) =>
  user.role === 'admin' || user.userId === userId.toString();

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];

// Service URLs
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || 'http://localhost:3003';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Helper function to get cart details
const getCartDetails = async (userId) => {
  try {
    const response = await axios.get(`${CART_SERVICE_URL}/api/cart/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cart details:', error.message);
    return null;
  }
};

// Helper function to update product stock
const updateProductStock = async (productId, quantity, operation = 'subtract') => {
  try {
    await axios.post(`${PRODUCT_SERVICE_URL}/api/products/${productId}/stock`, {
      stock: quantity,
      operation
    });
    return true;
  } catch (error) {
    console.error('Error updating product stock:', error.message);
    return false;
  }
};

// Helper function to clear cart
const clearCart = async (userId) => {
  try {
    await axios.delete(`${CART_SERVICE_URL}/api/cart/${userId}`);
    return true;
  } catch (error) {
    console.error('Error clearing cart:', error.message);
    return false;
  }
};

// @route   GET /api/orders/user/:userId
// @desc    Get user's orders
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    if (!canAccess(req.user, req.params.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { userId: req.params.userId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/orders
// @desc    Get all orders with summary stats
// @access  Admin
router.get('/', auth, auth.adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Order.countDocuments(filter);

    const [summary] = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      { $group: { _id: null, revenue: { $sum: '$pricing.total' }, count: { $sum: 1 } } }
    ]);
    const pending = await Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'processing'] } });

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      stats: {
        revenue: Math.round((summary?.revenue || 0) * 100) / 100,
        activeOrders: summary?.count || 0,
        awaitingFulfilment: pending
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!canAccess(req.user, order.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod = 'standard',
      customerNotes
    } = req.body;
    const userId = req.user.userId;

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Shipping address and payment method are required' });
    }

    // Get cart details
    const cart = await getCartDetails(userId);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate cart items (check stock, prices)
    const validationResponse = await axios.post(`${CART_SERVICE_URL}/api/cart/${userId}/validate`);
    if (!validationResponse.data.isValid) {
      return res.status(400).json({
        message: 'Cart validation failed',
        validationResults: validationResponse.data.validationResults
      });
    }

    // Calculate shipping and tax
    const shipping = calculateShipping(shippingMethod, cart.totalPrice);
    const tax = calculateTax(cart.totalPrice, shippingAddress.state);

    // Create order
    const order = new Order({
      userId,
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        productDetails: item.productDetails
      })),
      pricing: {
        subtotal: cart.totalPrice,
        tax,
        shipping,
        total: cart.totalPrice + tax + shipping
      },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      shipping: {
        method: shippingMethod,
        estimatedDelivery: calculateEstimatedDelivery(shippingMethod)
      },
      customerNotes
    });

    await order.save();

    // Update product stock for each item
    for (const item of cart.items) {
      await updateProductStock(item.productId, item.quantity, 'subtract');
    }

    // Clear the cart
    await clearCart(userId);

    res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Admin
router.put('/:id/status', auth, auth.adminOnly, async (req, res) => {
  try {
    const { status, trackingNumber, carrier, reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({ message: `Order is already ${order.status}` });
    }

    if (status === 'shipped') {
      order.markAsShipped(
        trackingNumber || `TRK${Date.now().toString().slice(-10)}`,
        carrier || 'UPS'
      );
    } else if (status === 'delivered') {
      order.markAsDelivered();
      // Cash on delivery is collected at the door
      if (order.paymentMethod === 'cash_on_delivery' && order.paymentStatus === 'pending') {
        order.paymentStatus = 'paid';
        order.paymentDetails.paidAt = new Date();
      }
    } else if (status === 'cancelled') {
      order.cancelOrder(reason);
      
      // Restore product stock
      for (const item of order.items) {
        await updateProductStock(item.productId, item.quantity, 'add');
      }
    } else {
      order.status = status;
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel order
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { reason = 'Cancelled by customer' } = req.body || {};

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!canAccess(req.user, order.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({
        message: `Cannot cancel an order that is ${order.status}`
      });
    }

    order.cancelOrder(reason);
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await updateProductStock(item.productId, item.quantity, 'add');
    }

    res.json({
      message: 'Order cancelled successfully',
      order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/orders/quote
// @desc    Preview shipping, tax and total for a cart subtotal
// @access  Public
router.post('/quote', (req, res) => {
  const { subtotal = 0, shippingMethod = 'standard', state } = req.body;
  const amount = Number(subtotal) || 0;
  const shipping = calculateShipping(shippingMethod, amount);
  const tax = calculateTax(amount, state);

  res.json({
    subtotal: amount,
    shipping,
    tax,
    total: Math.round((amount + shipping + tax) * 100) / 100
  });
});

// Helper functions
function calculateShipping(method, subtotal) {
  const rates = {
    standard: subtotal > 50 ? 0 : 9.99,
    express: 19.99,
    overnight: 39.99
  };
  return rates[method] ?? rates.standard;
}

function calculateTax(subtotal, state) {
  const taxRates = {
    'CA': 0.0875,
    'NY': 0.08,
    'TX': 0.0625,
    'FL': 0.06
  };
  const rate = taxRates[state] || 0.05; // Default 5%
  return Math.round(subtotal * rate * 100) / 100;
}

function calculateEstimatedDelivery(method) {
  const days = {
    standard: 7,
    express: 3,
    overnight: 1
  };
  const deliveryDays = days[method] || 7;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
  return deliveryDate;
}

module.exports = router;