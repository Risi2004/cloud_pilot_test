import React from 'react';

const LoadingSpinner = ({ message = 'Processing request...' }) => {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.message}>{message}</p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    gap: '1.25rem',
    width: '100%'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(255, 255, 255, 0.05)',
    borderTop: '4px solid #a855f7',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  message: {
    fontSize: '0.95rem',
    color: '#a0a0ab',
    fontWeight: '500',
    letterSpacing: '0.02em',
    textAlign: 'center'
  }
};

// Add raw CSS for the rotation animation directly to document head if not loaded
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default LoadingSpinner;
