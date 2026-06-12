import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalAnalyses: 0, vercelCount: 0, renderCount: 0, recentProjects: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Could not retrieve statistics from backend. Make sure your server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleRowClick = (project) => {
    navigate('/recommend', { state: { githubUrl: project.githubUrl, analysisId: project._id } });
  };

  if (loading) return <LoadingSpinner message="Retrieving dashboard metrics..." />;

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>Overview of analyzed repositories and recommended cloud configurations.</p>
        </div>
        <button className="btn btn-accent" onClick={() => navigate('/analyze')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Analysis
        </button>
      </div>

      {error && (
        <div style={{ padding: '1.25rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-lg)', color: '#f43f5e', marginBottom: '2rem', fontSize: '0.925rem' }}>
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-title">Total Repositories Scanned</div>
          <div className="stat-value">{stats.totalAnalyses}</div>
          <div className="stat-sub">Across all developer sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Frontend Deployments</div>
          <div className="stat-value">{stats.vercelCount}</div>
          <div className="stat-sub">Recommended to Vercel CDN</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Web Server Services</div>
          <div className="stat-value">{stats.renderCount}</div>
          <div className="stat-sub">Recommended to Render Containers</div>
        </div>
      </div>

      {/* History log */}
      <div className="section-header">
        <h2 className="section-title">Recently Scanned Repositories</h2>
      </div>

      {stats.recentProjects.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem' }}>No code repositories have been analyzed yet.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/analyze')}>
            Submit your first repository
          </button>
        </div>
      ) : (
        <div className="recent-projects-list">
          {stats.recentProjects.map((project) => (
            <div 
              key={project._id} 
              className="project-item"
              onClick={() => handleRowClick(project)}
            >
              <div className="project-meta">
                <div className="project-url">{project.githubUrl}</div>
                <div className="project-details">
                  <span className="badge badge-primary">{project.framework}</span>
                  {project.database !== 'None' && (
                    <span className="badge badge-info">{project.database}</span>
                  )}
                  {project.dockerized && (
                    <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>Docker</span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Complexity: <strong>{project.complexity}</strong>
                  </span>
                </div>
              </div>

              <div className="project-rec">
                {project.recommendation?.frontend && (
                  <span className="rec-target">
                    Frontend: <strong>{project.recommendation.frontend}</strong>
                  </span>
                )}
                {project.recommendation?.backend && (
                  <span className="rec-target">
                    Backend: <strong>{project.recommendation.backend}</strong>
                  </span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
