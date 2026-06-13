import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          CloudPilot
        </NavLink>
        <span className="beta-badge">Beta</span>
      </div>

      <ul className="sidebar-menu">
        <li>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            <span>Dashboard</span>
          </NavLink>
        </li>
        
        <li>
          <NavLink 
            to="/analyze" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>Repository Analysis</span>
          </NavLink>
        </li>

        <li>
          <NavLink 
            to="/editor" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Workspace Editor</span>
          </NavLink>
        </li>

        <li>
          <NavLink 
            to="/recommend" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>Recommendations</span>
          </NavLink>
        </li>

        <li>
          <NavLink 
            to="/plan" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Deployment Plan</span>
          </NavLink>
        </li>

        <li>
          <NavLink 
            to="/chat" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>AI Assistant</span>
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0.0 (Vercel & Render)</span>
      </div>
    </aside>
  );
};

export default Sidebar;
