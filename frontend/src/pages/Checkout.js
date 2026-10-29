import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { orderService, handleApiError } from '../services/api';
import { formatPrice } from '../utils/format';

const STATES = [
  ['AZ', 'Arizona'], ['CA', 'California'], ['CO', 'Colorado'], ['FL', 'Florida'],
  ['GA', 'Georgia'], ['IL', 'Illinois'], ['MA', 'Massachusetts'], ['NJ', 'New Jersey'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['OH', 'Ohio'], ['PA', 'Pennsylvania'],
  ['TX', 'Texas'], ['VA', 'Virginia'], ['WA', 'Washington']
];

const SHIPPING_OPTIONS = [
  { value: 'standard', label: 'Standard (5-7 days)' },
  { value: 'express', label: 'Express (2-3 days)' },
  { value: 'overnight', label: 'Overnight (1 day)' }
];

const CARD_METHODS = ['credit_card', 'debit_card'];

const AddressFields = ({ address, onChange }) => (
  <>
    <div className="grid grid-2" style={{ gap: '1rem' }}>
      <div className="form-group">
        <label>First Name</label>
        <input type="text" className="form-control" value={address.firstName}
          onChange={(e) => onChange('firstName', e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Last Name</label>
        <input type="text" className="form-control" value={address.lastName}
          onChange={(e) => onChange('lastName', e.target.value)} required />
      </div>
    </div>

    <div className="form-group">
      <label>Street Address</label>
      <input type="text" className="form-control" value={address.street}
        onChange={(e) => onChange('street', e.target.value)} required />
    </div>

    <div className="grid grid-2" style={{ gap: '1rem' }}>
      <div className="form-group">
        <label>City</label>
        <input type="text" className="form-control" value={address.city}
          onChange={(e) => onChange('city', e.target.value)} required />
      </div>
      <div className="form-group">
        <label>State</label>
        <select className="form-control" value={address.state}
          onChange={(e) => onChange('state', e.target.value)} required>
          <option value="">Select State</option>
          {STATES.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid grid-2" style={{ gap: '1rem' }}>
      <div className="form-group">
        <label>ZIP Code</label>
        <input type="text" className="form-control" value={address.zipCode} pattern="\d{5}(-\d{4})?"
          title="5-digit ZIP code" onChange={(e) => onChange('zipCode', e.target.value)} required />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input type="tel" className="form-control" value={address.phone}
          onChange={(e) => onChange('phone', e.target.value)} required />
      </div>
    </div>
  </>
);

const Checkout = () => {
  const { user } = useAuth();
  const { cart, loadCart } = useCart();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const emptyAddress = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: 'US',
    phone: user?.phone || ''
  };

  const [formData, setFormData] = useState({
    shippingAddress: emptyAddress,
    billingAddress: emptyAddress,
    paymentMethod: 'credit_card',
    shippingMethod: 'standard',
    customerNotes: '',
    sameAsBilling: true
  });
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cart?.totalPrice || 0;

  // Ask the Order Service for shipping/tax so the summary matches what's charged
  const { data: quote } = useQuery(
    ['quote', subtotal, formData.shippingMethod, formData.shippingAddress.state],
    () => orderService.getQuote({
      subtotal,
      shippingMethod: formData.shippingMethod,
      state: formData.shippingAddress.state
    }),
    {
      select: (response) => response.data,
      enabled: subtotal > 0,
      keepPreviousData: true
    }
  );

  const handleAddressChange = (section) => (field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const formatCardNumber = (value) =>
    value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const isCard = CARD_METHODS.includes(formData.paymentMethod);
    if (isCard && card.number.replace(/\s/g, '').length !== 16) {
      setError('Please enter a valid 16-digit card number.');
      setLoading(false);
      return;
    }

    let order;
    try {
      // Create order (the Order Service also clears the cart and reserves stock)
      const orderResponse = await orderService.createOrder({
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.sameAsBilling ? formData.shippingAddress : formData.billingAddress,
        paymentMethod: formData.paymentMethod,
        shippingMethod: formData.shippingMethod,
        customerNotes: formData.customerNotes
      });
      order = orderResponse.data.order;
    } catch (error) {
      console.error('Checkout error:', error);
      const validation = error.response?.data?.validationResults;
      setError(validation?.length
        ? 'Some items in your cart changed (price or stock). Please review your cart and try again.'
        : handleApiError(error));
      setLoading(false);
      return;
    }

    setPlaced(true);
    await loadCart();
    queryClient.invalidateQueries('orders');
    queryClient.invalidateQueries('products');

    try {
      await orderService.processPayment({
        orderId: order._id,
        paymentMethod: formData.paymentMethod,
        // A real app would tokenise the card with a payment provider instead
        paymentDetails: isCard ? { cardNumber: card.number, expiryDate: card.expiry } : {}
      });
      showToast('Order placed successfully!');
      navigate(`/orders?success=true&orderId=${order._id}`);
    } catch (error) {
      showToast('Your order was placed, but the payment was declined. You can retry payment from your orders.', 'error');
      navigate(`/orders?paymentFailed=true&orderId=${order._id}`);
    }
  };

  if (!placed && (!cart || cart.items.length === 0)) {
    return <Navigate to="/cart" replace />;
  }

  if (placed) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="loading" style={{ flexDirection: 'column', gap: '1rem' }}>
          <div className="spinner"></div>
          <p>Processing your payment...</p>
        </div>
      </div>
    );
  }

  const isCard = CARD_METHODS.includes(formData.paymentMethod);
  const shippingCost = quote?.shipping ?? 0;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>Checkout</h1>

      {error && (
        <div className="error" style={{ marginBottom: '2rem' }}>
          {error} {error.includes('cart') && <Link to="/cart">Go to cart →</Link>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="checkout-layout">
          {/* Checkout Form */}
          <div>
            {/* Shipping Address */}
            <div className="panel" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Shipping Address</h2>
              <AddressFields
                address={formData.shippingAddress}
                onChange={handleAddressChange('shippingAddress')}
              />
            </div>

            {/* Billing Address */}
            <div className="panel" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2>Billing Address</h2>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.sameAsBilling}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sameAsBilling: e.target.checked,
                      billingAddress: e.target.checked ? prev.billingAddress : { ...prev.shippingAddress }
                    }))}
                  />
                  Same as shipping
                </label>
              </div>

              {!formData.sameAsBilling && (
                <AddressFields
                  address={formData.billingAddress}
                  onChange={handleAddressChange('billingAddress')}
                />
              )}
            </div>

            {/* Shipping Method */}
            <div className="panel" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Delivery</h2>
              <div className="option-list">
                {SHIPPING_OPTIONS.map(option => (
                  <label
                    key={option.value}
                    className={`option ${formData.shippingMethod === option.value ? 'option-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={option.value}
                      checked={formData.shippingMethod === option.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, shippingMethod: e.target.value }))}
                    />
                    <span style={{ flex: 1 }}>{option.label}</span>
                    <strong>
                      {option.value === 'standard'
                        ? (subtotal > 50 ? 'FREE' : formatPrice(9.99))
                        : formatPrice(option.value === 'express' ? 19.99 : 39.99)}
                    </strong>
                  </label>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Order Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.customerNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
                  placeholder="Any special instructions for delivery..."
                />
              </div>
            </div>

            {/* Payment */}
            <div className="panel" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Payment</h2>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  className="form-control"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  required
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash_on_delivery">Cash on Delivery</option>
                </select>
              </div>

              {isCard && (
                <>
                  <div className="form-group">
                    <label>Name on Card</label>
                    <input type="text" className="form-control" value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Card Number</label>
                    <input type="text" inputMode="numeric" className="form-control" placeholder="4242 4242 4242 4242"
                      value={card.number} autoComplete="cc-number"
                      onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} required />
                  </div>
                  <div className="grid grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label>Expiry</label>
                      <input type="text" inputMode="numeric" className="form-control" placeholder="MM/YY"
                        value={card.expiry} pattern="(0[1-9]|1[0-2])/\d{2}" title="MM/YY"
                        onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} required />
                    </div>
                    <div className="form-group">
                      <label>CVC</label>
                      <input type="text" inputMode="numeric" className="form-control" placeholder="123"
                        value={card.cvc} pattern="\d{3,4}" title="3 or 4 digits"
                        onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} required />
                    </div>
                  </div>
                  <p className="info-box" style={{ fontSize: '0.875rem' }}>
                    🔒 Demo mode: no real charge is made. Use any card number. <code>4000 0000 0000 0002</code> simulates a decline.
                  </p>
                </>
              )}

              {formData.paymentMethod === 'paypal' && (
                <p className="info-box">You'll be charged via PayPal (simulated) when you place the order.</p>
              )}
              {formData.paymentMethod === 'cash_on_delivery' && (
                <p className="info-box">Pay in cash when your order arrives.</p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="panel" style={{ position: 'sticky', top: '6rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Order Summary</h2>

              {/* Order Items */}
              <div style={{ marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {cart.items.map(item => (
                  <div key={item.productId} className="summary-item">
                    {item.productDetails.image && (
                      <img src={item.productDetails.image} alt="" className="summary-thumb" />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{item.productDetails.name}</div>
                      <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                </div>

                <div className="summary-row">
                  <span>Tax {formData.shippingAddress.state ? `(${formData.shippingAddress.state})` : '(estimated)'}</span>
                  <span>{formatPrice(quote?.tax)}</span>
                </div>

                <div className="summary-row summary-total">
                  <span>Total</span>
                  <span>{formatPrice(quote?.total ?? subtotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', marginTop: '2rem' }}
                disabled={loading}
              >
                {loading ? 'Placing order...' : `Place Order · ${formatPrice(quote?.total ?? subtotal)}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
