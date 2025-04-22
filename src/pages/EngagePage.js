import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/Header';
import Button from '../components/Button';
import DiscountDisplay from '../components/DiscountDisplay';
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
    <div className="page-container">
      <Header />
      <div className="content-container">
        <h1 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '20px' }}>Engage and Save</h1>
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Step 2 - Complete these actions to increase your discount on non-wine merchandise:
        </h2>
        
        <DiscountDisplay 
          googleReviewed={googleReviewed}
          instagramFollowed={instagramFollowed}
        />
        
        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="engagement-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '600px',
            margin: '0 auto',
            width: '100%'
          }}>
            <div className="button-container" style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              width: '100%',
              maxWidth: '300px',
              gap: '10px'
            }}>
              <img 
                src="/images/google-logo.svg" 
                alt="Google Logo" 
                className="social-icon"
                style={{ width: '24px', height: '24px' }}
              />
              <Button 
                text={googleReviewed ? "Reviewed on Google ✓" : "Review us on Google"} 
                onClick={handleGoogleReview}
                style={{ width: '100%', maxWidth: '250px' }}
              />
            </div>
            
            <div className="button-container" style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              width: '100%',
              maxWidth: '300px',
              gap: '10px'
            }}>
              <img 
                src="/images/instagram-logo.svg" 
                alt="Instagram Logo" 
                className="social-icon"
                style={{ width: '24px', height: '24px' }}
              />
              <Button 
                text={instagramFollowed ? "Following on Instagram ✓" : "Follow us on Instagram"} 
                onClick={handleInstagramFollow}
                style={{ width: '100%', maxWidth: '250px' }}
              />
            </div>
            
            {showConfetti && (
              <div className="thank-you-message">
                <h2>Thank you for being the best part of the Bhutan Wine Company</h2>
                <canvas id="confetti-canvas" ref={confettiRef}></canvas>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EngagePage;
