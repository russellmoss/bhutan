import React from 'react';
import '../styles/global.css';

const Button = ({ text, onClick, type, disabled, className }) => {
  return (
    <button 
      className={`button ${className || ''}`}
      onClick={onClick} 
      type={type || 'button'}
      disabled={disabled}
      style={{
        color: className === 'direct-export' ? 'white' : 'black',
        fontWeight: 'bold',
        fontSize: '16px'
      }}
    >
      {text}
    </button>
  );
};

export default Button;
