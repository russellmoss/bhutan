import React, { useState, useEffect } from 'react';
import '../styles/global.css';

const DiscountDisplay = ({ googleReviewed, instagramFollowed }) => {
  const [displayDiscount, setDisplayDiscount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  // Calculate total discount
  const totalDiscount = 5 + (googleReviewed ? 5 : 0) + (instagramFollowed ? 5 : 0);

  useEffect(() => {
    if (displayDiscount < totalDiscount) {
      setIsAnimating(true);
      const timer = setInterval(() => {
        setDisplayDiscount(prev => {
          const newValue = Math.min(prev + 1, totalDiscount);
          if (newValue === totalDiscount) {
            setIsAnimating(false);
            clearInterval(timer);
            setShowMessage(true);
          }
          return newValue;
        });
      }, 100); // Adjust speed of animation here
    }
  }, [totalDiscount]);

  return (
    <div className="discount-container" style={{
      textAlign: 'center',
      margin: '20px 0',
      padding: '20px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '8px'
    }}>
      <h2 style={{ color: '#FFD700', marginBottom: '10px' }}>
        Your Current Discount: {displayDiscount}%
      </h2>
      {showMessage && totalDiscount < 15 && (
        <p style={{ color: 'white', marginTop: '10px' }}>
          Complete all steps to get the full 15% discount on non-wine merchandise!
        </p>
      )}
      {showMessage && totalDiscount === 15 && (
        <p style={{ color: '#4CAF50', marginTop: '10px', fontWeight: 'bold' }}>
          Congratulations! You've earned the maximum 15% discount!
        </p>
      )}
    </div>
  );
};

export default DiscountDisplay; 