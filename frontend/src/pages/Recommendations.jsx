import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRecommendation } from '../services/api';
import RecommendationCard from '../components/RecommendationCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Recommendations = () => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  const githubUrl = location.state?.githubUrl;
  const analysisId = location.state?.analysisId;

  useEffect(() => {
    if (!githubUrl && !analysisId) return;

    const fetchRecommendation = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getRecommendation({ githubUrl, analysisId });
        setRecommendation(data);
      } catch (err) {
        console.error('Error fetching recommendation:', err);
        setError(
          err.response?.data?.error || 
          'Could not retrieve platform recommendation details. Please ensure the repository is analyzed.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [githubUrl, analysisId]);

  const handleNextSteps = () => {
    navigate('/plan', { state: { githubUrl, analysisId } });
  };

  if (!githubUrl && !analysisId) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.75rem' }}>No Active Project Selected</h2>
          <p style={{ fontSize: '0.925rem', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Before viewing platform suggestions, you must first input and analyze a repository URL.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')}>
            Analyze a Repository
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>Architecture Recommendations</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
          Optimal cloud hosting platforms and structural configuration mapped for: <strong style={{ color: 'white' }}>{githubUrl}</strong>
        </p>
      </div>

      {loading && <LoadingSpinner message="Evaluating cloud pricing and platform compatibility models..." />}

      {error && (
        <div style={{ padding: '1.25rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-lg)', color: '#f43f5e', marginBottom: '2rem', fontSize: '0.925rem' }}>
          {error}
        </div>
      )}

      {recommendation && (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <RecommendationCard recommendation={recommendation} onNextSteps={handleNextSteps} />
        </div>
      )}
    </div>
  );
};

export default Recommendations;
