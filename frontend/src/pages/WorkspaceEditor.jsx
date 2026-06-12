import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeEditorCode, importLocalWorkspace } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/editor.css';
import '../styles/cards.css';

// Predefined Workspace Templates
const TEMPLATES = {
  reactVite: {
    name: 'React SPA (Vite)',
    files: {
      'package.json': JSON.stringify({
        name: 'cloudpilot-react-spa',
        version: '1.0.0',
        dependencies: {
          'react': '^19.0.0',
          'react-dom': '^19.0.0',
          'react-router-dom': '^7.1.0',
          'tailwindcss': '^3.4.15'
        },
        devDependencies: {
          'vite': '^6.0.0'
        },
        scripts: {
          'dev': 'vite',
          'build': 'vite build',
          'preview': 'vite preview'
        }
      }, null, 2),
      'vite.config.js': 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    port: 3000\n  }\n});',
      '.env.example': 'VITE_API_URL=http://localhost:5000/api\nVITE_ANALYTICS_ID=UA-XXXXXX-X',
      'README.md': '# React Vite SPA Template\n\nA lightweight frontend application optimized for static hosting platforms like Vercel.',
      'src/App.jsx': 'import React from "react";\n\nfunction App() {\n  return (\n    <div className="p-8">\n      <h1 className="text-2xl font-bold">Hello CloudPilot!</h1>\n    </div>\n  );\n}\n\nexport default App;'
    }
  },
  expressApi: {
    name: 'Express Node API',
    files: {
      'package.json': JSON.stringify({
        name: 'cloudpilot-express-api',
        version: '1.0.0',
        dependencies: {
          'express': '^5.2.1',
          'cors': '^2.8.6',
          'mongoose': '^9.7.0',
          'helmet': '^8.0.0',
          'dotenv': '^17.4.2'
        },
        devDependencies: {
          'nodemon': '^3.1.14'
        },
        scripts: {
          'start': 'node server.js',
          'dev': 'nodemon server.js'
        }
      }, null, 2),
      'server.js': 'import express from "express";\nimport cors from "cors";\nimport helmet from "helmet";\nimport dotenv from "dotenv";\nimport mongoose from "mongoose";\n\ndotenv.config();\nconst app = express();\n\napp.use(cors());\napp.use(helmet());\napp.use(express.json());\n\napp.get("/api/health", (req, res) => {\n  res.json({ status: "OK" });\n});\n\nconst PORT = process.env.PORT || 5000;\nmongoose.connect(process.env.MONGODB_URI)\n  .then(() => {\n    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));\n  })\n  .catch(err => console.error(err));',
      '.env.example': 'PORT=5000\nMONGODB_URI=mongodb://localhost:27017/my-api-db\nJWT_SECRET=super_secret_key',
      'README.md': '# Express Node API Template\n\nA secure REST API backend optimized for server web services like Render.'
    }
  },
  nextjsFullstack: {
    name: 'Next.js MongoDB Fullstack',
    files: {
      'package.json': JSON.stringify({
        name: 'cloudpilot-nextjs-app',
        version: '1.0.0',
        dependencies: {
          'next': '^15.1.0',
          'react': '^19.0.0',
          'react-dom': '^19.0.0',
          'mongoose': '^9.7.0',
          'clerk': '^5.0.0',
          'stripe': '^17.0.0'
        },
        scripts: {
          'dev': 'next dev',
          'build': 'next build',
          'start': 'next start'
        }
      }, null, 2),
      'next.config.js': '/** @type {import("next").NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n  images: {\n    domains: ["images.unsplash.com"]\n  }\n};\n\nmodule.exports = nextConfig;',
      '.env.example': 'MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db\nNEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...\nCLERK_SECRET_KEY=sk_test_...\nSTRIPE_SECRET_KEY=sk_test_...',
      'README.md': '# Next.js MongoDB Fullstack Template\n\nA fullstack application featuring server-side rendering, integrated API routes, database collections, and payments.'
    }
  }
};

const WorkspaceEditor = () => {
  const [templateKey, setTemplateKey] = useState('reactVite');
  const [files, setFiles] = useState({ ...TEMPLATES.reactVite.files });
  const [selectedFile, setSelectedFile] = useState('package.json');
  const [openTabs, setOpenTabs] = useState(['package.json']);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [projectName, setProjectName] = useState('My Custom Workspace');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [lineCount, setLineCount] = useState(1);
  const [localImportPath, setLocalImportPath] = useState('');
  const [importing, setImporting] = useState(false);

  const textareaRef = useRef(null);
  const navigate = useNavigate();

  // Load template files when selector changes
  useEffect(() => {
    const template = TEMPLATES[templateKey];
    if (template) {
      setFiles({ ...template.files });
      const firstFile = Object.keys(template.files)[0];
      setSelectedFile(firstFile);
      setOpenTabs([firstFile]);
      setAnalysis(null);
      setError('');
    }
  }, [templateKey]);

  // Recalculate line numbers when active file or content changes
  useEffect(() => {
    const content = files[selectedFile] || '';
    const lines = content.split('\n').length;
    setLineCount(Math.max(1, lines));
  }, [selectedFile, files]);

  const handleFileContentChange = (e) => {
    const content = e.target.value;
    setFiles(prev => ({
      ...prev,
      [selectedFile]: content
    }));
  };

  const handleSelectFile = (filename) => {
    setSelectedFile(filename);
    if (!openTabs.includes(filename)) {
      setOpenTabs(prev => [...prev, filename]);
    }
  };

  const handleCloseTab = (e, filename) => {
    e.stopPropagation();
    const updatedTabs = openTabs.filter(t => t !== filename);
    setOpenTabs(updatedTabs);
    
    if (selectedFile === filename) {
      if (updatedTabs.length > 0) {
        setSelectedFile(updatedTabs[updatedTabs.length - 1]);
      } else {
        setSelectedFile('');
      }
    }
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    if (files[name] !== undefined) {
      setError('File already exists.');
      return;
    }

    setFiles(prev => ({
      ...prev,
      [name]: ''
    }));
    setNewFileName('');
    setIsCreatingFile(false);
    handleSelectFile(name);
    setError('');
  };

  const handleDeleteFile = (e, filename) => {
    e.stopPropagation();
    if (Object.keys(files).length <= 1) {
      setError('A workspace must contain at least one file.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${filename}?`);
    if (!confirmed) return;

    const updatedFiles = { ...files };
    delete updatedFiles[filename];
    setFiles(updatedFiles);

    const updatedTabs = openTabs.filter(t => t !== filename);
    setOpenTabs(updatedTabs);

    if (selectedFile === filename) {
      const remainingFiles = Object.keys(updatedFiles);
      if (updatedTabs.length > 0) {
        setSelectedFile(updatedTabs[updatedTabs.length - 1]);
      } else {
        setSelectedFile(remainingFiles[0]);
      }
    }
  };

  const handleKeyDown = (e) => {
    // Enable Tab indentation inside textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const content = files[selectedFile];
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      
      setFiles(prev => ({
        ...prev,
        [selectedFile]: newContent
      }));

      // Reset cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleAnalyzeWorkspace = async () => {
    try {
      setLoading(true);
      setError('');
      setAnalysis(null);
      const result = await analyzeEditorCode(files, projectName);
      setAnalysis(result);
    } catch (err) {
      console.error('Workspace analysis error:', err);
      setError(
        err.response?.data?.error || 
        'Could not complete workspace analysis. Check that the backend is active.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImportLocalFolder = async () => {
    if (!localImportPath.trim()) {
      setError('Please provide a valid local directory path.');
      return;
    }
    
    try {
      setImporting(true);
      setError('');
      setAnalysis(null);
      const result = await importLocalWorkspace(localImportPath.trim());
      
      if (!result.files || Object.keys(result.files).length === 0) {
        setError('No compatible files found in the specified directory. Make sure it contains text-based project files.');
        return;
      }
      
      setFiles(result.files);
      
      // Extract project name from folder path
      let baseName = '';
      try {
        const parts = localImportPath.split(/[/\\]/);
        baseName = parts.filter(Boolean).pop() || 'Imported Project';
      } catch (err) {
        baseName = 'Imported Project';
      }
      setProjectName(baseName);
      
      const firstFile = Object.keys(result.files)[0];
      setSelectedFile(firstFile);
      setOpenTabs([firstFile]);
    } catch (err) {
      console.error('Import folder error:', err);
      setError(
        err.response?.data?.error || 
        'Could not import local directory. Check that the folder path is correct and the backend is running.'
      );
    } finally {
      setImporting(false);
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
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>Workspace Editor</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
          Open project templates, edit package details or docker files, and run AI analysis local tests.
        </p>
      </div>

      {/* Editor Top Control Bar */}
      <div className="editor-controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Template Workspace</span>
            <select 
              className="editor-template-select"
              value={templateKey} 
              onChange={(e) => setTemplateKey(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              {Object.entries(TEMPLATES).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Workspace Name</span>
            <input 
              type="text"
              className="editor-template-select"
              style={{ width: '200px', background: 'rgba(255, 255, 255, 0.02)' }}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Workspace Name"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '1rem', marginLeft: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Import Local Folder</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text"
                  className="editor-template-select"
                  style={{ width: '280px', background: 'rgba(255, 255, 255, 0.02)' }}
                  value={localImportPath}
                  onChange={(e) => setLocalImportPath(e.target.value)}
                  placeholder="Local folder path (e.g. C:\projects\app)"
                />
                <button 
                  className="btn btn-secondary"
                  onClick={handleImportLocalFolder}
                  disabled={importing}
                  style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {importing ? 'Importing...' : 'Import Folder'}
                  {!importing && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button 
            className="btn btn-primary"
            onClick={handleAnalyzeWorkspace}
            disabled={loading}
            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px' }}
          >
            {loading ? 'Analyzing...' : 'Analyze Workspace'}
            {!loading && (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1.25rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-lg)', color: '#f43f5e', marginBottom: '1rem', fontSize: '0.925rem' }}>
          {error}
        </div>
      )}

      {/* VS-Code Style Workspace Editor Layout */}
      <div className="workspace-editor-layout">
        
        {/* Workspace File Explorer Sidebar */}
        <div className="editor-sidebar">
          <div className="editor-sidebar-header">
            <span>Files Explorer</span>
            <button 
              className="editor-action-btn"
              onClick={() => setIsCreatingFile(!isCreatingFile)}
              title="New File"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {isCreatingFile && (
            <div>
              <input 
                type="text" 
                className="editor-new-file-input"
                placeholder="filename.ext" 
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                autoFocus
              />
            </div>
          )}

          <ul className="file-list">
            {Object.keys(files).map((filename) => (
              <li 
                key={filename} 
                className={`file-item ${selectedFile === filename ? 'active' : ''}`}
                onClick={() => handleSelectFile(filename)}
              >
                <div className="file-name-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{filename}</span>
                </div>
                
                <button 
                  className="editor-action-btn file-delete-icon"
                  onClick={(e) => handleDeleteFile(e, filename)}
                  title="Delete File"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Editor Central Content Panel */}
        <div className="editor-main">
          {/* Tabs Bar */}
          <div className="editor-tabs-bar">
            {openTabs.map((tab) => (
              <div 
                key={tab} 
                className={`editor-tab ${selectedFile === tab ? 'active' : ''}`}
                onClick={() => setSelectedFile(tab)}
              >
                <span>{tab}</span>
                <span 
                  className="editor-tab-close"
                  onClick={(e) => handleCloseTab(e, tab)}
                >
                  &times;
                </span>
              </div>
            ))}
          </div>

          {/* Text Editor Area */}
          {selectedFile ? (
            <div className="editor-textarea-container">
              {/* Row Numbers */}
              <div className="editor-line-numbers">
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Input Area */}
              <textarea 
                ref={textareaRef}
                className="editor-textarea"
                value={files[selectedFile] || ''}
                onChange={handleFileContentChange}
                onKeyDown={handleKeyDown}
                spellCheck="false"
              />
            </div>
          ) : (
            <div className="editor-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No active file. Select a file from the explorer sidebar to begin editing.</p>
            </div>
          )}

          {/* Status Bar */}
          <div className="editor-status-bar">
            <div>
              <span>Ln {files[selectedFile]?.split('\n').length || 0}, Col {files[selectedFile]?.length || 0}</span>
            </div>
            <div>
              <span style={{ textTransform: 'uppercase' }}>
                {selectedFile ? selectedFile.split('.').pop() : 'none'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {loading && <LoadingSpinner message="Scanning files, cataloging libraries, and running AI models..." />}

      {/* Embedded Live Analysis Dashboard Results */}
      {analysis && analysis.report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem', animation: 'fadeIn 0.4s ease-out' }}>
          
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#c084fc', marginBottom: '0.25rem' }}>Analysis Results</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Check local parameters extracted from the custom workspace workspace.</p>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', width: '100%' }}>
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

          {/* Project Spec Metadata */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h2 className="glass-card-title">Project Specifications Matrix</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
              <div style={styles.specItem}><strong>Frontend:</strong> {analysis.report.frontendStack}</div>
              <div style={styles.specItem}><strong>Backend:</strong> {analysis.report.backendStack}</div>
              <div style={styles.specItem}><strong>Database:</strong> {analysis.report.databaseStack}</div>
              <div style={styles.specItem}><strong>Authentication:</strong> {analysis.report.authentication || 'None'}</div>
              <div style={styles.specItem}><strong>Storage Services:</strong> {analysis.report.storage || 'None'}</div>
              <div style={styles.specItem}><strong>Payment Gateway:</strong> {analysis.report.payments || 'None'}</div>
              <div style={styles.specItem}><strong>AI & Vector DBs:</strong> {analysis.report.aiServices || 'None'}</div>
              <div style={styles.specItem}><strong>Third-Party Integrations:</strong> {analysis.report.thirdPartyServices || 'None'}</div>
            </div>
          </div>

          {/* Env Variables Checklist */}
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
                    >
                      {variable} {isSensitive && '🔒'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scalability and Costs */}
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

          {/* View Plan Next Navigation Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
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

export default WorkspaceEditor;
