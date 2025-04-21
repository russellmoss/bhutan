import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/Header';
import Button from '../components/Button';
import '../styles/global.css';

// Import confetti for celebration effect
import ConfettiGenerator from 'confetti-js';

const EngagePage = () => {
  const { customerId } = useParams();
  const [googleReviewed, setGoogleReviewed] = useState(false);
  const [instagramFollowed, setInstagramFollowed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const confettiRef = useRef(null);
  const confettiInstanceRef = useRef(null);

  useEffect(() => {
    // Initialize the engagement document if it doesn't exist
    const initializeEngagementDoc = async () => {
      try {
        const docRef = doc(db, 'engagement', customerId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          // Create the document if it doesn't exist
          await setDoc(docRef, {
            googleReviewed: false,
            instagramFollowed: false,
            createdAt: new Date()
          });
        } else {
          // Set state based on existing document
          const data = docSnap.data();
          setGoogleReviewed(data.googleReviewed || false);
          setInstagramFollowed(data.instagramFollowed || false);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing engagement document:', error);
        setIsLoading(false);
      }
    };
    
    initializeEngagementDoc();
  }, [customerId]);

  useEffect(() => {
    // Check if both actions were completed, show confetti
    if (googleReviewed && instagramFollowed && !showConfetti) {
      setShowConfetti(true);
    }
  }, [googleReviewed, instagramFollowed, showConfetti]);

  // Separate effect for confetti to ensure canvas exists
  useEffect(() => {
    if (showConfetti && confettiRef.current) {
      const confettiSettings = { 
        target: 'confetti-canvas', 
        max: 150,
        animate: true,
        duration: 0, // 0 means infinite
        colors: [
          [165, 104, 246],
          [230, 61, 135],
          [0, 199, 228],
          [253, 214, 126],
          [255, 215, 0] // Gold color
        ]
      };
      
      // Create new confetti instance
      confettiInstanceRef.current = new ConfettiGenerator(confettiSettings);
      confettiInstanceRef.current.render();
      
      // No timeout to clear confetti - it will continue indefinitely
    }
    
    // Cleanup function to clear confetti when component unmounts
    return () => {
      if (confettiInstanceRef.current) {
        confettiInstanceRef.current.clear();
      }
    };
  }, [showConfetti]);

  const handleGoogleReview = async () => {
    // Open Google review link in new tab
    window.open('https://g.page/r/CboEJIhRzjcDEBM/review', '_blank');
    
    // Update Firestore
    try {
      await updateDoc(doc(db, 'engagement', customerId), {
        googleReviewed: true,
        googleReviewTimestamp: new Date()
      });
      setGoogleReviewed(true);
    } catch (error) {
      console.error('Error updating Google review status: ', error);
    }
  };

  const handleInstagramFollow = async () => {
    // Open Instagram link in new tab
    window.open('https://www.instagram.com/bhutanwine/', '_blank');
    
    // Update Firestore
    try {
      await updateDoc(doc(db, 'engagement', customerId), {
        instagramFollowed: true,
        instagramFollowTimestamp: new Date()
      });
      setInstagramFollowed(true);
    } catch (error) {
      console.error('Error updating Instagram follow status: ', error);
    }
  };

  return (
    <div className="container">
      <Header />
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h1>Engage and Save</h1>
          <p style={{ textAlign: 'center' }}>Leave us a review and/or follow us on Instagram and stay in touch. Receive 5% off non-wine merchandise per activity you perform.</p>
          
          <div className="button-container">
            <img 
              src="/images/google-logo.svg" 
              alt="Google Logo" 
              className="social-icon"
            />
            <Button 
              text="Review us on Google" 
              onClick={handleGoogleReview} 
            />
            {googleReviewed && <span className="checkmark">✓</span>}
          </div>
          
          <div className="button-container">
            <img 
              src="/images/instagram-logo.svg" 
              alt="Instagram Logo" 
              className="social-icon"
            />
            <Button 
              text="Follow us on Instagram" 
              onClick={handleInstagramFollow} 
            />
            {instagramFollowed && <span className="checkmark">✓</span>}
          </div>
          
          {showConfetti && (
            <div className="thank-you-message">
              <h2>Thank you for being the best part of the Bhutan Wine Company</h2>
              <canvas id="confetti-canvas" ref={confettiRef}></canvas>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EngagePage;
