import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDeploymentPlan } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/cards.css';

const DeploymentPlan = () => {
  const [steps, setSteps] = useState([]);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const githubUrl = location.state?.githubUrl;
  const analysisId = location.state?.analysisId;

  useEffect(() => {
    if (!githubUrl && !analysisId) return;

    const fetchPlan = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getDeploymentPlan({ githubUrl, analysisId });
        setSteps(data.steps || []);
        
        // Initialize checked steps
        const initialChecked = {};
        (data.steps || []).forEach((_, idx) => {
          initialChecked[idx] = false;
        });
        setCheckedSteps(initialChecked);
      } catch (err) {
        console.error('Error fetching plan:', err);
        setError(
          err.response?.data?.error || 
          'Could not retrieve deployment plan. Make sure the repository is analyzed.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [githubUrl, analysisId]);

  const handleCheckboxToggle = (index) => {
    setCheckedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCopy = () => {
    const textToCopy = steps.map((step, idx) => `${idx + 1}. ${step}`).join('\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  if (!githubUrl && !analysisId) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.75rem' }}>No Active Project Selected</h2>
          <p style={{ fontSize: '0.925rem', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Analyze a repository first to compile a customized deployment plan checklist.
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
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>Deployment Plan</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Interactive checklist configuration instructions for: <strong style={{ color: 'white' }}>{githubUrl}</strong>
          </p>
        </div>
        
        {steps.length > 0 && (
          <button className="btn btn-secondary" onClick={handleCopy}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 8h3m-3 3h3m-9-13h12" />
            </svg>
            {copied ? 'Copied!' : 'Copy Plan'}
          </button>
        )}
      </div>

      {loading && <LoadingSpinner message="Assembling cloud script steps and configuration steps..." />}

      {error && (
        <div style={{ padding: '1.25rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-lg)', color: '#f43f5e', marginBottom: '2rem', fontSize: '0.925rem' }}>
          {error}
        </div>
      )}

      {steps.length > 0 && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="glass-card-header">
            <h2 className="glass-card-title">Setup Checklist</h2>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Follow these configuration steps in order.
            </span>
          </div>

          <div className="plan-steps-container">
            {steps.map((step, idx) => (
              <div key={idx} className="plan-step-item">
                <button 
                  className={`step-checkbox ${checkedSteps[idx] ? 'checked' : ''}`}
                  onClick={() => handleCheckboxToggle(idx)}
                >
                  ✓
                </button>
                <div className={`plan-step-text ${checkedSteps[idx] ? 'completed' : ''}`}>
                  {step.split(/(`[^`]+`)/).map((part, partIdx) => {
                    if (part.startsWith('`') && part.endsWith('`')) {
                      return <code key={partIdx} className="code-font">{part.slice(1, -1)}</code>;
                    }
                    return part;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentPlan;
