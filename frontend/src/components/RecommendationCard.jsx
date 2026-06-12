import React from 'react';
import '../styles/cards.css';

const RecommendationCard = ({ recommendation, onNextSteps }) => {
  const { frontend, backend, reason, cost } = recommendation;

  return (
    <div className="recommendations-wrapper">
      <div className="recommendations-row">
        {frontend && frontend !== 'None' && (
          <div className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Frontend Hosting
              </span>
              <span className="badge badge-primary">{frontend}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Platform:</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>{frontend} Edge</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Best suited for high-speed CDN static assets.</div>
            </div>
          </div>
        )}

        {backend && backend !== 'None' && (
          <div className="glass-card">
            <div className="glass-card-header">
              <span className="glass-card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                Backend Services
              </span>
              <span className="badge badge-info">{backend}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Platform:</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>{backend} Web Service</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Best suited for Node, Python, or Go APIs.</div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Architecture Reasoning
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          {reason}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Estimated Cost:</span>
            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#34d399' }}>{cost}</span>
          </div>

          {onNextSteps && (
            <button className="btn btn-primary" onClick={onNextSteps}>
              Generate Deployment Plan
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
