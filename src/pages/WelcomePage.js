import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import '../styles/global.css';

const WelcomePage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email) {
      alert('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add customer to Firestore
      const docRef = await addDoc(collection(db, 'customers'), {
        name,
        email,
        timestamp: new Date()
      });
      
      console.log('Customer added with ID: ', docRef.id);
      
      // Create engagement document for this customer
      await setDoc(doc(db, 'engagement', docRef.id), {
        googleReviewed: false,
        instagramFollowed: false,
        createdAt: new Date()
      });
      
      // Navigate to engagement page with customer ID
      navigate(`/engage/${docRef.id}`);
    } catch (error) {
      console.error('Error adding customer: ', error);
      alert('There was an error submitting your information. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <Header />
      <div className="content-container">
        <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Step 1 - Enter your name and email for 5% off non-wine merchandise
        </h2>
        <form onSubmit={handleSubmit} className="form-container" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          maxWidth: '400px',
          margin: '0 auto',
          width: '100%'
        }}>
          <InputField 
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
          <InputField 
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
          />
          <Button 
            text={isSubmitting ? "Submitting..." : "Submit"}
            type="submit"
            disabled={isSubmitting}
          />
        </form>
        
        {isSubmitting && (
          <div className="submitting-container">
            <div className="submitting-spinner"></div>
            <div className="submitting-text">Submitting...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomePage;
