import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { productService, handleApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/format';
import StarRating from './StarRating';

const Reviews = ({ product }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reviews = product.reviews || [];
  const hasReviewed = user && reviews.some(review => review.userId === user._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      showToast('Please choose a star rating', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await productService.addReview(product._id, {
        rating,
        comment,
        name: `${user.firstName} ${user.lastName.charAt(0)}.`
      });
      showToast('Thanks for your review!');
      setRating(0);
      setComment('');
      queryClient.invalidateQueries(['product', product._id]);
      queryClient.invalidateQueries('products');
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ marginTop: '4rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Customer Reviews</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
          {product.ratings.count > 0 ? product.ratings.average.toFixed(1) : '–'}
        </span>
        <div>
          <StarRating value={product.ratings.average} size="1.4rem" />
          <div style={{ color: '#6c757d' }}>
            Based on {product.ratings.count} rating{product.ratings.count !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* Review form */}
        <div className="panel">
          <h3 style={{ marginBottom: '1rem' }}>Write a review</h3>
          {!user ? (
            <p>
              <Link to="/login" state={{ from: `/products/${product._id}` }} style={{ color: '#007bff' }}>
                Log in
              </Link>{' '}
              to share your thoughts on this product.
            </p>
          ) : hasReviewed ? (
            <p style={{ color: '#6c757d' }}>You've already reviewed this product. Thank you!</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Your rating</label>
                <StarRating value={rating} onChange={setRating} size="1.75rem" />
              </div>
              <div className="form-group">
                <label htmlFor="review-comment">Your review (optional)</label>
                <textarea
                  id="review-comment"
                  className="form-control"
                  rows="4"
                  maxLength={1000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike?"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {/* Review list */}
        <div>
          {reviews.length === 0 ? (
            <p style={{ color: '#6c757d' }}>No written reviews yet. Be the first to review this product!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(review => (
                <div key={review._id} className="panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{review.name}</strong>
                    <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>{formatDate(review.createdAt)}</span>
                  </div>
                  <StarRating value={review.rating} />
                  {review.comment && <p style={{ marginTop: '0.5rem', color: '#555' }}>{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
