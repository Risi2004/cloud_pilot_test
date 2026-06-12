import React, { useState } from 'react';
import '../styles/forms.css';

const RepositoryForm = ({ onSubmit, isLoading, initialUrl = '' }) => {
  const [mode, setMode] = useState('github'); // 'github' or 'local'
  const [inputValue, setInputValue] = useState(initialUrl);
  const [error, setError] = useState('');

  const validate = (value) => {
    if (!value.trim()) {
      return mode === 'github' ? 'GitHub URL is required' : 'Local folder path is required';
    }
    
    if (mode === 'github') {
      const githubRegex = /github\.com\/([^/]+)\/([^/]+)/;
      if (!githubRegex.test(value)) {
        return 'Please enter a valid public GitHub URL (e.g. https://github.com/user/repo)';
      }
    }
    
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validate(inputValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onSubmit(mode, inputValue.trim());
  };

  return (
    <div className="repo-form-card" style={{ padding: '2rem' }}>
      
      {/* Premium Tabs Selector */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          onClick={() => {
            setMode('github');
            setInputValue('');
            setError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: mode === 'github' ? '#c084fc' : 'var(--text-secondary)',
            fontWeight: '600',
            fontSize: '0.95rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            borderBottom: mode === 'github' ? '2px solid #a855f7' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          GitHub Repository URL
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('local');
            setInputValue('');
            setError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: mode === 'local' ? '#c084fc' : 'var(--text-secondary)',
            fontWeight: '600',
            fontSize: '0.95rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            borderBottom: mode === 'local' ? '2px solid #a855f7' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          Local PC Directory Path
        </button>
      </div>

      <h2 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>
        {mode === 'github' ? 'Analyze Public GitHub Repository' : 'Analyze Local Project Directory'}
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
        {mode === 'github' 
          ? 'CloudPilot will fetch the code configurations, examine the dependencies, and suggest platforms and deployment commands.'
          : 'CloudPilot will inspect the directory on your local machine, scan root config files, and generate recommendations.'}
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="repo-input-wrapper">
          <input
            type="text"
            className="form-input"
            placeholder={mode === 'github' ? 'https://github.com/username/project' : 'C:\\path\\to\\project'}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError('');
            }}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="btn btn-accent" 
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Project'}
          </button>
        </div>
        {error && (
          <p style={{ color: '#f43f5e', fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: '500' }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
};

export default RepositoryForm;
