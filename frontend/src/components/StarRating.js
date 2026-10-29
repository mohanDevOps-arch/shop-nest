import React from 'react';

// Read-only stars, or a picker when onChange is provided
const StarRating = ({ value = 0, onChange, size = '1rem' }) => {
  const rounded = Math.round(value);

  return (
    <span className="star-rating" style={{ fontSize: size }} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => (
        onChange ? (
          <button
            key={star}
            type="button"
            className={`star ${star <= rounded ? 'star-filled' : ''}`}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ) : (
          <span key={star} className={`star ${star <= rounded ? 'star-filled' : ''}`}>★</span>
        )
      ))}
    </span>
  );
};

export default StarRating;
