import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import '../styles/forms.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleDemoStart = () => {
    navigate('/analyze', { state: { demoUrl: 'https://github.com/expressjs/express' } });
  };

  return (
    <div className="page-container" style={{ maxWidth: '1200px', padding: '1rem 2rem' }}>
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-glow"></div>
        <h1 className="landing-title">
          Autonomous <span>Cloud Engineer</span>
        </h1>
        <h2 className="landing-subtitle">CloudPilot</h2>
        <p className="landing-desc">
          Upload any public GitHub repository URL. Our AI analyzes your stack configuration, recommends the best hosting platforms (Vercel & Render), calculates running costs, and builds step-by-step deployment blueprints automatically.
        </p>
        <div className="landing-actions">
          <button className="btn btn-accent" onClick={() => navigate('/dashboard')}>
            Get Started
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
          <button className="btn btn-secondary" onClick={handleDemoStart}>
            View Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section">
        <div className="section-head-centered">
          <h2 className="section-title-large">Engineered for Modern Applications</h2>
          <p className="section-desc-large">Analyze static frontends and dynamic backend services using our autonomous parsing engine.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="feature-title">Repository Analysis</h3>
            <p className="feature-desc">Scans configuration files, scripts, and dependencies in package.json to identify frameworks and libraries.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="feature-title">Platform Recommendations</h3>
            <p className="feature-desc">Matches your frontend to Vercel CDN edges and maps Node/Express/Python backends to Render environments.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="feature-title">Cost Estimation</h3>
            <p className="feature-desc">Calculates expected monthly operational costs, ensuring you stay within budget constraints.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="feature-title">Deployment Planning</h3>
            <p className="feature-desc">Generates clear step-by-step instructions on setting environment keys, running compilations, and validating hooks.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-section" style={{ borderBottom: 'none' }}>
        <div className="section-head-centered">
          <h2 className="section-title-large">How It Works</h2>
          <p className="section-desc-large">Get from repository to deployed production cloud hosting in minutes.</p>
        </div>

        <div className="steps-timeline">
          <div className="timeline-step">
            <div className="step-num">1</div>
            <h4 className="step-title">Submit URL</h4>
            <p className="step-desc">Input a public GitHub URL of your codebase.</p>
          </div>

          <div className="timeline-step">
            <div className="step-num">2</div>
            <h4 className="step-title">Analyze Project</h4>
            <p className="step-desc">AI scans structural logs and packages to catalog libraries.</p>
          </div>

          <div className="timeline-step">
            <div className="step-num">3</div>
            <h4 className="step-title">Generate Recommendations</h4>
            <p className="step-desc">Recieve tailored host configs for Vercel & Render, plus cost estimates.</p>
          </div>

          <div className="timeline-step">
            <div className="step-num">4</div>
            <h4 className="step-title">Deploy Code</h4>
            <p className="step-desc">Follow step-by-step instructions and deploy to production.</p>
          </div>
        </div>
      </section>
      
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        &copy; 2026 CloudPilot. All rights reserved. Built for modern cloud configurations.
      </footer>
    </div>
  );
};

export default LandingPage;
