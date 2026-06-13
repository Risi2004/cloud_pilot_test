import React from 'react';
import '../styles/navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <a href="/" className="navbar-brand">
        <div className="navbar-logo-icon">C</div>
        <span>CloudPilot</span>
        <span className="beta-badge">Beta</span>
      </a>
      
      <div className="navbar-actions">
        <button className="theme-toggle-btn" title="Simulate Theme Switch">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </button>
        
        <div className="user-profile">
          <div className="avatar">D</div>
          <div className="user-info">
            <span className="user-name">Developer Mode</span>
            <span className="user-role">Cloud Admin</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
