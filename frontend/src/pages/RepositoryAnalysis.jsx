import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { analyzeRepository, analyzeLocalDirectory } from '../services/api';
import RepositoryForm from '../components/RepositoryForm';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/cards.css';

const RepositoryAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Handle automatic analysis (e.g. "View Demo" clicked on Landing)
  useEffect(() => {
    if (location.state?.demoUrl) {
      handleAnalyze('github', location.state.demoUrl);
    }
  }, [location.state]);

  const handleAnalyze = async (mode, value) => {
    try {
      setLoading(true);
      setError('');
      setAnalysis(null);
      let result;
      if (mode === 'local') {
        result = await analyzeLocalDirectory(value);
      } else {
        result = await analyzeRepository(value);
      }
      setAnalysis(result);
    } catch (err) {
      console.error('Repository analysis error:', err);
      setError(
        err.response?.data?.error || 
        'Could not complete repository analysis. Check that the backend is active.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!analysis) return;
    navigate('/recommend', { 
      state: { 
        githubUrl: analysis.githubUrl, 
        analysisId: analysis._id 
      } 
    });
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>Repository Analysis</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
          Identify codebase stacks, library dependencies, databases, and structures.
        </p>
      </div>

      <RepositoryForm 
        onSubmit={handleAnalyze} 
        isLoading={loading} 
        initialUrl={location.state?.demoUrl || ''} 
      />

      {loading && <LoadingSpinner message="Scanning files, cataloging libraries, and running AI model..." />}

      {error && (
        <div style={{ padding: '1.25rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-lg)', color: '#f43f5e', marginBottom: '2rem', fontSize: '0.925rem' }}>
          {error}
        </div>
      )}

      {analysis && analysis.report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem', animation: 'fadeIn 0.4s ease-out' }}>
          
          {/* Section 1: Dashboard Top Summary Meters */}
          <div style={styles.metricsRow}>
            <div className="glass-card" style={{ flex: 1, textAlign: 'center', minWidth: '220px' }}>
              <span className="metadata-label">Deployment Readiness</span>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: '#10b981' }}>
                {analysis.report.deploymentReadinessScore}%
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Start scripts, build configs, and variables detected.
              </p>
            </div>

            <div className="glass-card" style={{ flex: 1, textAlign: 'center', minWidth: '220px' }}>
              <span className="metadata-label">Security Score</span>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: '#3b82f6' }}>
                {analysis.report.securityScore}%
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                CORS, Helmet headers, and validators checked.
              </p>
            </div>

            <div className="glass-card" style={{ flex: 1, textAlign: 'center', minWidth: '220px' }}>
              <span className="metadata-label">Complexity Score</span>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0.5rem 0', color: '#a855f7' }}>
                {analysis.report.complexityScore}%
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Scale rating: <strong>{analysis.report.deploymentDifficulty || 'Medium'}</strong>
              </p>
            </div>
          </div>

          {/* Section 2: Core Metadata & Architecture details */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h2 className="glass-card-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Project Information & Architecture
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Parsed Meta</span>
            </div>

            <div className="metadata-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="metadata-item">
                <span className="metadata-label">App Title</span>
                <span className="metadata-value" style={{ fontSize: '1rem', wordBreak: 'break-all' }}>{analysis.report.projectName}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Application Type</span>
                <span className="metadata-value" style={{ fontSize: '1rem' }}>{analysis.report.projectType}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Architecture</span>
                <span className="metadata-value" style={{ fontSize: '1rem' }}>{analysis.report.architectureType}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Structure</span>
                <span className="metadata-value" style={{ fontSize: '1rem' }}>{analysis.report.containerization === 'None' ? 'Standard Workspace' : 'Dockerized Container'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Technology Stack breakdown */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h2 className="glass-card-title">Technology Specifications Matrix</h2>
            </div>
            
            <div style={styles.specGrid}>
              <div style={styles.specItem}>
                <strong>Frontend:</strong> {analysis.report.frontendStack}
              </div>
              <div style={styles.specItem}>
                <strong>Backend:</strong> {analysis.report.backendStack}
              </div>
              <div style={styles.specItem}>
                <strong>Database:</strong> {analysis.report.databaseStack}
              </div>
              <div style={styles.specItem}>
                <strong>Authentication:</strong> {analysis.report.authentication || 'None'}
              </div>
              <div style={styles.specItem}>
                <strong>Storage Services:</strong> {analysis.report.storage || 'None'}
              </div>
              <div style={styles.specItem}>
                <strong>Payment Gateway:</strong> {analysis.report.payments || 'None'}
              </div>
              <div style={styles.specItem}>
                <strong>AI & Vector DBs:</strong> {analysis.report.aiServices || 'None'}
              </div>
              <div style={styles.specItem}>
                <strong>Third-Party Integrations:</strong> {analysis.report.thirdPartyServices || 'None'}
              </div>
            </div>
          </div>

          {/* Section 4: Operational environment variables auditing */}
          {analysis.report.requiredEnvironmentVariables?.length > 0 && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                Environment Variables Detection Checklist ({analysis.report.requiredEnvironmentVariables.length})
              </h3>
              
              <div className="dependencies-tags" style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.08)' }}>
                {analysis.report.requiredEnvironmentVariables.map((variable, idx) => {
                  const isSensitive = /SECRET|KEY|PASSWORD|TOKEN|AUTH|CREDENTIAL|PRIVATE/i.test(variable);
                  return (
                    <span 
                      key={idx} 
                      className={`badge ${isSensitive ? 'badge-primary' : 'badge-info'}`}
                      style={{ fontFamily: 'var(--font-mono)', border: isSensitive ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)' }}
                      title={isSensitive ? 'Sensitive Variable' : 'Standard Variable'}
                    >
                      {variable} {isSensitive && '🔒'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 5: Scalability analysis and budget cost projections */}
          <div className="recommendations-row">
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Scalability Assessment</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {analysis.report.scalabilityAnalysis}
              </p>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Hosting & Pricing Recommendations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div><strong>Recommended Infrastructure:</strong> {analysis.report.hostingRecommendation}</div>
                <div><strong>Estimated Cost Rate:</strong> <span style={{ color: '#34d399', fontWeight: '700' }}>{analysis.report.estimatedMonthlyCost}</span></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={handleNext}>
              View Recommended Deployment Plan
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

const styles = {
  metricsRow: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    width: '100%'
  },
  specGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
    marginTop: '0.5rem'
  },
  specItem: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.25rem',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5'
  }
};

export default RepositoryAnalysis;
