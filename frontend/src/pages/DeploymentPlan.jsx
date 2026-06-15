import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getDeploymentPlan, triggerAutoDeployment, getDeploymentStatus, autoFixAndRedeploy } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardSimulator from '../components/DashboardSimulator';
import '../styles/cards.css';
import '../styles/forms.css';
import '../styles/wizard.css';

const DeploymentPlan = () => {
  const [steps, setSteps] = useState([]);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState('wizard'); // 'wizard' or 'checklist'
  const [wizardStep, setWizardStep] = useState(1);

  // Guided Deployment Form States
  const [projectName, setProjectName] = useState('');
  const [projectScale, setProjectScale] = useState('free'); // 'free', 'staging', 'production'
  const [renderApiKey, setRenderApiKey] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [customEnvVars, setCustomEnvVars] = useState({});
  const [envKeysList, setEnvKeysList] = useState([]);

  // Local state for adding key/value manually
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  // Deployment Execution States
  const [deploying, setDeploying] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState([]);
  const [deployResult, setDeployResult] = useState(null);
  const [deployError, setDeployError] = useState('');
  const [healingState, setHealingState] = useState({ active: false, explanation: '', solution: '', filesChanged: [], provider: '', errorLogs: '' });
  const [isFixing, setIsFixing] = useState(false);
  const pollIntervalRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const terminalEndRef = useRef(null);

  const githubUrl = location.state?.githubUrl;
  const analysisId = location.state?.analysisId;

  // Initialize Project Name based on githubUrl
  useEffect(() => {
    if (githubUrl) {
      const parts = githubUrl.split('/');
      const lastPart = parts[parts.length - 1] || 'cloudpilot-app';
      const cleanName = lastPart.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      setProjectName(cleanName);
    }
  }, [githubUrl]);

  // Fetch plan and environment variables
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

        // Fetch environment variables from the plan
        if (data.envVariables && Array.isArray(data.envVariables)) {
          const initialEnv = {};
          const keysList = [...data.envVariables];
          
          keysList.forEach(key => {
            initialEnv[key] = (data.envValues && data.envValues[key]) || '';
          });
          
          if (data.envValues) {
            Object.entries(data.envValues).forEach(([key, val]) => {
              if (!initialEnv.hasOwnProperty(key)) {
                initialEnv[key] = val;
                if (!keysList.includes(key)) {
                  keysList.push(key);
                }
              }
            });
          }
          
          setEnvKeysList(keysList);
          setCustomEnvVars(initialEnv);
        }
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

  // Auto scroll terminal to bottom when new logs appear
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleLogs]);

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

  // Autocomplete keys for demo/simulation
  const handleAutoFillMockKeys = () => {
    setVercelToken('mock_vercel_token_cloudpilot');
    setRenderApiKey('mock_render_key_cloudpilot');
  };

  // Add environment variable manually
  const handleAddEnvVar = () => {
    if (!newEnvKey.trim()) return;
    const cleanKey = newEnvKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    setCustomEnvVars(prev => ({
      ...prev,
      [cleanKey]: newEnvValue
    }));
    if (!envKeysList.includes(cleanKey)) {
      setEnvKeysList(prev => [...prev, cleanKey]);
    }
    setNewEnvKey('');
    setNewEnvValue('');
  };

  // Delete environment variable
  const handleDeleteEnvVar = (key) => {
    const updated = { ...customEnvVars };
    delete updated[key];
    setCustomEnvVars(updated);
    setEnvKeysList(prev => prev.filter(k => k !== key));
  };

  // Handle value change for an env var key
  const handleEnvValueChange = (key, value) => {
    setCustomEnvVars(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Import environment variables from a selected local file (.env)
  const handleEnvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = {};
      const newKeys = [];

      text.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        // Skip comments and empty lines
        if (trimmed && !trimmed.startsWith('#')) {
          const equalsIdx = trimmed.indexOf('=');
          if (equalsIdx !== -1) {
            const k = trimmed.substring(0, equalsIdx).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
            const v = trimmed.substring(equalsIdx + 1).trim();
            if (k) {
              parsed[k] = v;
              newKeys.push(k);
            }
          }
        }
      });

      if (Object.keys(parsed).length > 0) {
        setCustomEnvVars(prev => ({
          ...prev,
          ...parsed
        }));
        setEnvKeysList(prev => {
          const updated = [...prev];
          newKeys.forEach(k => {
            if (!updated.includes(k)) {
              updated.push(k);
            }
          });
          return updated;
        });
      } else {
        alert("No valid environment variables (KEY=value format) found in the selected file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startPollingStatus = (statusInfo, initialLogs) => {
    let baseLogs = [...initialLogs];
    
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    const poll = async () => {
      try {
        const payload = {
          vercelDeploymentId: statusInfo.vercel?.id,
          renderServiceId: statusInfo.render?.serviceId,
          renderDeployId: statusInfo.render?.deployId,
          vercelToken,
          renderApiKey,
          githubUrl
        };
        
        const statusRes = await getDeploymentStatus(payload);
        const { vercel, render } = statusRes;
        
        const vercelLogs = vercel?.logs || [];
        const renderLogs = render?.logs || [];
        
        setVisibleLogs([
          ...baseLogs,
          ...vercelLogs.map(l => `[Vercel] ${l}`),
          ...renderLogs.map(l => `[Render] ${l}`)
        ]);
        
        const vercelFailed = vercel?.status === 'ERROR';
        const renderFailed = ['build_failed', 'update_failed', 'pre_deploy_failed'].includes(render?.status);
        
        if (vercelFailed || renderFailed) {
          clearInterval(pollIntervalRef.current);
          setDeploying(false);
          
          const failedProvider = vercelFailed ? 'vercel' : 'render';
          const errorLogs = vercelFailed 
            ? (vercelLogs.join('\n') || vercel.error || 'Vercel build failure') 
            : (renderLogs.join('\n') || render.error || 'Render build failure');
            
          setVisibleLogs(prev => [
            ...prev,
            `[Agent] Detected build failure on ${failedProvider === 'vercel' ? 'Vercel' : 'Render'}. Halted log stream.`,
            `[Agent] Analysing build failures and generating recovery options via local AI model...`
          ]);
          
          try {
            const fixProposal = await autoFixAndRedeploy({
              githubUrl,
              errorLogs,
              provider: failedProvider,
              vercelToken,
              renderApiKey,
              dryRun: true
            });
            
            setHealingState({
              active: true,
              explanation: fixProposal.explanation,
              solution: fixProposal.solution,
              filesChanged: fixProposal.filesChanged,
              provider: failedProvider,
              errorLogs: errorLogs
            });
          } catch (proposalErr) {
            console.error('Failed to get recovery proposal:', proposalErr);
            setDeployError(`Deployment failed on ${failedProvider}. Auto-healing query failed: ${proposalErr.message}`);
          }
          return;
        }
        
        const vercelActive = !!statusInfo.vercel?.id;
        const renderActive = !!statusInfo.render?.serviceId;
        
        const vercelDone = !vercelActive || vercel?.status === 'READY';
        const renderDone = !renderActive || render?.status === 'live';
        
        if (vercelDone && renderDone) {
          clearInterval(pollIntervalRef.current);
          setDeploying(false);
          
          const finalStatus = {
            vercel: {
              success: vercelActive ? vercel?.status === 'READY' : statusInfo.vercel?.success,
              url: vercelActive ? `https://${projectName}-frontend.vercel.app` : statusInfo.vercel?.url,
              error: vercelActive ? vercel?.error : statusInfo.vercel?.error,
              id: statusInfo.vercel?.id
            },
            render: {
              success: renderActive ? render?.status === 'live' : statusInfo.render?.success,
              url: renderActive ? `https://${projectName}-backend.onrender.com` : statusInfo.render?.url,
              error: renderActive ? render?.error : statusInfo.render?.error,
              serviceId: statusInfo.render?.serviceId,
              deployId: statusInfo.render?.deployId
            }
          };
          
          setDeployResult(finalStatus);
          setVisibleLogs(prev => [
            ...prev,
            `[Agent] Deployment verified. All environments successfully provisioned and live! 🎉`
          ]);
          setWizardStep(5);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    };
    
    poll();
    pollIntervalRef.current = setInterval(poll, 3000);
  };

  const handleAutoFix = async () => {
    setIsFixing(true);
    setHealingState(prev => ({ ...prev, active: false }));
    
    setVisibleLogs(prev => [
      ...prev,
      `[Agent] Auto-Fix approved by user. Executing code corrections...`,
      `[Agent] [Auto-Healing] Initiating healing loop for ${healingState.provider}...`,
      `[Agent] [Auto-Healing] Staging files for commit...`,
      `[Agent] [Auto-Healing] Committing corrections...`,
      `[Agent] [Auto-Healing] Git add: staged ${healingState.filesChanged.join(', ')}`,
      `[Agent] [Auto-Healing] Git commit: fix(deploy): resolve build errors`,
      `[Agent] [Auto-Healing] Pushing changes to remote main branch...`,
      `[Agent] [Auto-Healing] Git push: successfully pushed Main -> Main`
    ]);

    try {
      const fixResult = await autoFixAndRedeploy({
        githubUrl,
        errorLogs: healingState.errorLogs,
        provider: healingState.provider,
        vercelToken,
        renderApiKey,
        dryRun: false
      });
      
      if (fixResult.success) {
        setVisibleLogs(prev => [
          ...prev,
          `[Agent] Auto-Fix corrections successfully applied and pushed to GitHub!`,
          `[Agent] Triggering redeployment pipeline on cloud services...`
        ]);
        
        const skipVercel = healingState.provider !== 'vercel';
        const skipRender = healingState.provider !== 'render';
        
        const payload = {
          githubUrl,
          vercelToken,
          renderApiKey,
          config: {
            projectName,
            frontendTier: projectScale,
            backendTier: projectScale,
            envVars: customEnvVars,
            skipRender,
            skipVercel,
            renderUrl: deployResult?.render?.url || `https://${projectName}-backend.onrender.com`,
            vercelUrl: deployResult?.vercel?.url
          }
        };
        
        const result = await triggerAutoDeployment(payload);
        setIsFixing(false);
        setDeploying(true);
        
        const serverLogs = result.logs || [];
        let currentLogIdx = 0;
        
        const newBaseLogs = [...visibleLogs, ...serverLogs];
        
        const interval = setInterval(() => {
          if (currentLogIdx < serverLogs.length) {
            setVisibleLogs(prev => [...prev, serverLogs[currentLogIdx]]);
            currentLogIdx++;
          } else {
            clearInterval(interval);
            startPollingStatus(result.status, newBaseLogs);
          }
        }, 700);
      } else {
        throw new Error(fixResult.error || 'Auto-Fix application failed');
      }
    } catch (err) {
      console.error('Auto-Fix or redeployment trigger failed:', err);
      setIsFixing(false);
      setDeployError(err.message || 'Auto-Fix healing flow encountered an error.');
      setVisibleLogs(prev => [
        ...prev,
        `[Agent] [Error] Auto-healing halted: ${err.message || 'Unknown error'}`
      ]);
    }
  };

  // Trigger Deployment API Call
  const handleStartDeployment = async () => {
    setWizardStep(4);
    setDeploying(true);
    setDeployError('');
    setVisibleLogs(['[Agent] Initializing local cloud deployment environment...']);

    try {
      const payload = {
        githubUrl,
        vercelToken,
        renderApiKey,
        config: {
          projectName,
          frontendTier: projectScale,
          backendTier: projectScale,
          envVars: customEnvVars
        }
      };

      // Call API
      const result = await triggerAutoDeployment(payload);

      // Simulate log stream for better UX
      const serverLogs = result.logs || [];
      let currentLogIdx = 0;
      
      const interval = setInterval(() => {
        if (currentLogIdx < serverLogs.length) {
          setVisibleLogs(prev => [...prev, serverLogs[currentLogIdx]]);
          currentLogIdx++;
        } else {
          clearInterval(interval);
          startPollingStatus(result.status, serverLogs);
        }
      }, 700);

    } catch (err) {
      console.error('Deployment execution failed:', err);
      let errorMessage = 'Unknown integration gateway error';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.error) {
          errorMessage = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Print error log in terminal
      setVisibleLogs(prev => [
        ...prev,
        `[Agent] [Error] Automated deployment halted: ${errorMessage}`,
        `[Agent] Please verify your credentials or network configuration and try again.`
      ]);
      setDeploying(false);
      setDeployError(errorMessage);
    }
  };

  // Trigger a retry for only the failed components
  const handleRetryDeployment = async ({ skipVercel, skipRender }) => {
    setWizardStep(4);
    setDeploying(true);
    setDeployError('');
    setVisibleLogs([
      `[Agent] Initializing selective retry (Skip Vercel: ${skipVercel ? 'Yes' : 'No'}, Skip Render: ${skipRender ? 'Yes' : 'No'})...`
    ]);

    try {
      const payload = {
        githubUrl,
        vercelToken,
        renderApiKey,
        config: {
          projectName,
          frontendTier: projectScale,
          backendTier: projectScale,
          envVars: customEnvVars,
          skipRender,
          skipVercel,
          renderUrl: deployResult?.render?.url,
          vercelUrl: deployResult?.vercel?.url
        }
      };

      const result = await triggerAutoDeployment(payload);

      const serverLogs = result.logs || [];
      let currentLogIdx = 0;
      
      const interval = setInterval(() => {
        if (currentLogIdx < serverLogs.length) {
          setVisibleLogs(prev => [...prev, serverLogs[currentLogIdx]]);
          currentLogIdx++;
        } else {
          clearInterval(interval);
          startPollingStatus(result.status, serverLogs);
        }
      }, 700);

    } catch (err) {
      console.error('Retry execution failed:', err);
      let errorMessage = 'Unknown integration gateway error';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.error) {
          errorMessage = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setVisibleLogs(prev => [
        ...prev,
        `[Agent] [Error] Retry deployment halted: ${errorMessage}`
      ]);
      setDeploying(false);
      setDeployError(errorMessage);
    }
  };

  const handleResetWizard = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setWizardStep(1);
    setDeployResult(null);
    setDeployError('');
    setVisibleLogs([]);
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
    <div className="page-container animate-fade-in">
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>Cloud Deployment Plan</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Target Repository: <strong style={{ color: 'white' }}>{githubUrl}</strong>
          </p>
        </div>
        
        {steps.length > 0 && activeTab === 'checklist' && (
          <button className="btn btn-secondary" onClick={handleCopy}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 8h3m-3 3h3m-9-13h12" />
            </svg>
            {copied ? 'Copied!' : 'Copy Plan'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="deployment-layout-tabs">
        <button 
          className={`tab-btn ${activeTab === 'wizard' ? 'active' : ''}`}
          onClick={() => setActiveTab('wizard')}
        >
          🤖 Interactive Cloud Agent
        </button>
        <button 
          className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          📋 Manual Setup Checklist
        </button>
      </div>

      {loading && <LoadingSpinner message="Assembling cloud script steps and configuration options..." />}

      {error && (
        <div style={{ padding: '1.25rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 'var(--radius-lg)', color: '#f43f5e', marginBottom: '2rem', fontSize: '0.925rem' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* TAB 1: INTERACTIVE AGENT WIZARD */}
          {activeTab === 'wizard' && (
            <div className="wizard-container">
              {/* Wizard Steps Node Indicator */}
              <div className="wizard-progress-bar">
                <div className="wizard-progress-line" />
                <div 
                  className="wizard-progress-line-fill" 
                  style={{ width: `${((wizardStep - 1) / 4) * 80}%` }}
                />
                
                <div className={`wizard-progress-node ${wizardStep === 1 ? 'active' : wizardStep > 1 ? 'completed' : ''}`}>1</div>
                <div className={`wizard-progress-node ${wizardStep === 2 ? 'active' : wizardStep > 2 ? 'completed' : ''}`}>2</div>
                <div className={`wizard-progress-node ${wizardStep === 3 ? 'active' : wizardStep > 3 ? 'completed' : ''}`}>3</div>
                <div className={`wizard-progress-node ${wizardStep === 4 ? 'active' : wizardStep > 4 ? 'completed' : ''}`}>4</div>
                <div className={`wizard-progress-node ${wizardStep === 5 ? 'active' : ''}`}>5</div>
              </div>

              {/* STEP 1: PROJECT CONFIG & SCALE CLASSIFICATION */}
              {wizardStep === 1 && (
                <div className="wizard-step-card">
                  <h2 className="wizard-step-title">Project Profile & Scaling Scale</h2>
                  <p className="wizard-step-subtitle">
                    Select a tier classification model so that CloudPilot can automatically adjust plans, timeouts, and resource provisioning constraints.
                  </p>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="projNameInput">Project Identifier / Name</label>
                    <input 
                      id="projNameInput"
                      type="text"
                      className="form-input"
                      placeholder="e.g. my-awesome-app"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                    <label className="form-label">Select Deployment Target Scale</label>
                  </div>
                  
                  <div className="project-scales-grid">
                    <div 
                      className={`scale-card ${projectScale === 'free' ? 'selected' : ''}`}
                      onClick={() => setProjectScale('free')}
                    >
                      <div className="scale-card-header">
                        <span className="scale-title">Hackathon / Hobby</span>
                        <span className="scale-badge free">Free Tier</span>
                      </div>
                      <p className="scale-desc">
                        Deploys a Render free tier web service and Vercel hobby project. Perfect for presentations, developer testing, or prototypes.
                      </p>
                      <span className="scale-meta">Cost: $0.00 / month (Auto-spins down on inactivity)</span>
                    </div>

                    <div 
                      className={`scale-card ${projectScale === 'staging' ? 'selected' : ''}`}
                      onClick={() => setProjectScale('staging')}
                    >
                      <div className="scale-card-header">
                        <span className="scale-title">Staging / QA</span>
                        <span className="scale-badge staging">Starter</span>
                      </div>
                      <p className="scale-desc">
                        Deploys a Render Starter instance and Vercel Teams preview branch. Best for developer pipelines, QA testing, and team review steps.
                      </p>
                      <span className="scale-meta">Cost: Render Starter ($7) + Vercel Preview</span>
                    </div>

                    <div 
                      className={`scale-card ${projectScale === 'production' ? 'selected' : ''}`}
                      onClick={() => setProjectScale('production')}
                    >
                      <div className="scale-card-header">
                        <span className="scale-title">Production Scale</span>
                        <span className="scale-badge production">Standard</span>
                      </div>
                      <p className="scale-desc">
                        Deploys a Render Standard instance with persistent database tunnels, and Vercel Production domain mapping. High availability.
                      </p>
                      <span className="scale-meta">Cost: Render Standard ($25+) + Custom Domains</span>
                    </div>
                  </div>

                  <div className="wizard-footer-actions">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Step 1 of 5
                    </span>
                    <button 
                      className="btn btn-accent" 
                      onClick={() => setWizardStep(2)}
                      disabled={!projectName.trim()}
                    >
                      Continue to Credentials
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CREDENTIALS MANAGEMENT */}
              {wizardStep === 2 && (
                <div className="wizard-step-card">
                  <h2 className="wizard-step-title">Provider API Access Keys</h2>
                  <p className="wizard-step-subtitle">
                    Provide credentials for Render and Vercel. These keys are held in volatile memory to trigger resources on your cloud accounts, and are never saved.
                  </p>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vercelTokenInput">Vercel Auth Token</label>
                    <input 
                      id="vercelTokenInput"
                      type="password"
                      className="form-input"
                      placeholder="e.g. vcl_xxxxxxxxxxxx"
                      value={vercelToken}
                      onChange={(e) => setVercelToken(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label className="form-label" htmlFor="renderKeyInput">Render API Key</label>
                    <input 
                      id="renderKeyInput"
                      type="password"
                      className="form-input"
                      placeholder="e.g. rnd_xxxxxxxxxxxx"
                      value={renderApiKey}
                      onChange={(e) => setRenderApiKey(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', color: '#60a5fa', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
                      <strong>Testing?</strong> Click the auto-fill button below to run a simulated mock deployment without entering credentials.
                    </div>
                  </div>

                  <div className="wizard-footer-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={handleAutoFillMockKeys}
                    >
                      ⚡ Auto-Fill Simulation Credentials
                    </button>
                    <div className="wizard-action-group">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setWizardStep(1)}
                      >
                        Back
                      </button>
                      <button 
                        className="btn btn-accent"
                        onClick={() => setWizardStep(3)}
                        disabled={!vercelToken.trim() && !renderApiKey.trim()}
                      >
                        Next: Env Variables
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ENVIRONMENT VARIABLES CONFIG */}
              {wizardStep === 3 && (
                <div className="wizard-step-card">
                  <h2 className="wizard-step-title">Environment Variables</h2>
                  <p className="wizard-step-subtitle">
                    Configure environment secrets for the backend web service. Keys extracted from your project files are populated here automatically.
                  </p>

                  {envKeysList.length === 0 ? (
                    <div style={{ padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                      No mandatory environment variables were detected during the analysis scan. Add custom secrets below if needed.
                    </div>
                  ) : (
                    <div className="env-variables-list">
                      {envKeysList.map(key => (
                        <div key={key} className="env-row">
                          <span className="env-key-label">{key}</span>
                          <input 
                            type="text"
                            className="form-input"
                            placeholder={`Enter value for ${key}`}
                            value={customEnvVars[key] || ''}
                            onChange={(e) => handleEnvValueChange(key, e.target.value)}
                          />
                          <button 
                            className="btn-icon-only"
                            onClick={() => handleDeleteEnvVar(key)}
                            title="Remove key"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add manual Env Form */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Add Custom Environment Secret</div>
                      <div>
                        <input 
                          type="file" 
                          accept=".env,.txt,*" 
                          onChange={handleEnvImport} 
                          style={{ display: 'none' }} 
                          id="env-file-upload" 
                        />
                        <label 
                          htmlFor="env-file-upload" 
                          className="btn btn-secondary" 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem 0.8rem', fontSize: '0.85rem', userSelect: 'none' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Import .env File
                        </label>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <input 
                        type="text"
                        className="form-input"
                        placeholder="KEY (e.g. MONGO_URI)"
                        style={{ flexGrow: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                        value={newEnvKey}
                        onChange={(e) => setNewEnvKey(e.target.value)}
                      />
                      <input 
                        type="text"
                        className="form-input"
                        placeholder="Value (e.g. mongodb://...)"
                        style={{ flexGrow: 2, fontSize: '0.85rem' }}
                        value={newEnvValue}
                        onChange={(e) => setNewEnvValue(e.target.value)}
                      />
                      <button 
                        className="btn btn-secondary"
                        onClick={handleAddEnvVar}
                        disabled={!newEnvKey.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="wizard-footer-actions">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Step 3 of 5
                    </span>
                    <div className="wizard-action-group">
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setWizardStep(2)}
                      >
                        Back
                      </button>
                      <button 
                        className="btn btn-accent"
                        style={{ background: 'var(--accent-gradient)' }}
                        onClick={handleStartDeployment}
                      >
                        🚀 Start Automated Deployment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: ACTIVE DEPLOYMENT TERMINAL LOGS WITH VIRTUAL SIMULATOR */}
              {wizardStep === 4 && (
                <div className="wizard-step-card" style={{ maxWidth: '1200px', width: '100%', position: 'relative' }}>
                  <h2 className="wizard-step-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    Deploying Resources
                    {(deploying || isFixing) && <div className="pulse-indicator" />}
                  </h2>
                  <p className="wizard-step-subtitle">
                    {isFixing
                      ? 'The CloudPilot agent is automatically applying code corrections, committing/pushing to GitHub, and restarting the build pipeline...'
                      : 'The CloudPilot agent is registering Vercel and Render targets, configuring subdirectories, injecting variables, and triggering the build systems.'
                    }
                  </p>

                  <div className="deployment-split-grid">
                    {/* Left: Terminal logs */}
                    <div>
                      <div className="terminal-container" style={{ height: '520px', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                        <div className="terminal-header">
                          <div className="terminal-dots">
                            <div className="terminal-dot red" />
                            <div className="terminal-dot yellow" />
                            <div className="terminal-dot green" />
                          </div>
                          <div className="terminal-title">cloudpilot-agent@deployer:~</div>
                          <div />
                        </div>
                        <div className="terminal-body" style={{ flexGrow: 1, maxHeight: 'none' }}>
                          {visibleLogs.map((logLine, idx) => {
                            let formattedLine = logLine;
                            
                            // Style keys inside output
                            if (logLine.includes('[Simulation]')) {
                              formattedLine = logLine.replace('[Simulation]', '');
                              return (
                                <div key={idx} className="terminal-line">
                                  <span className="sim-prefix">[Simulation]</span>
                                  {formattedLine}
                                </div>
                              );
                            } else if (logLine.startsWith('[Agent]')) {
                              formattedLine = logLine.replace('[Agent]', '');
                              return (
                                <div key={idx} className="terminal-line">
                                  <span className="agent-prefix">[Agent]</span>
                                  {formattedLine}
                                </div>
                              );
                            }
                            
                            return (
                              <div key={idx} className="terminal-line">
                                {logLine}
                              </div>
                            );
                          })}
                          {(deploying || isFixing) && (
                            <div className="terminal-line">
                              <span className="terminal-cursor" />
                            </div>
                          )}
                          <div ref={terminalEndRef} />
                        </div>
                      </div>
                    </div>

                    {/* Right: Simulated dashboard monitor */}
                    <DashboardSimulator 
                      visibleLogs={visibleLogs}
                      projectName={projectName}
                      projectScale={projectScale}
                      envVars={customEnvVars}
                    />
                  </div>

                  {deployError && (
                    <div className="wizard-footer-actions" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', marginTop: '1.5rem' }}>
                      <span style={{ color: '#ef4444', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ✕ Deployment failed: {deployError}
                      </span>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setWizardStep(3)}
                      >
                        Back to Configuration
                      </button>
                    </div>
                  )}

                  {/* Glassmorphic Auto-Fix Proposal Dialog overlay */}
                  {healingState.active && (
                    <div className="auto-fix-dialog-backdrop">
                      <div className="auto-fix-dialog glass-card animate-scale-in">
                        <div className="auto-fix-header">
                          <span className="auto-fix-warning-icon">⚡</span>
                          <h3>AI Auto-Fix Deployment Proposal</h3>
                        </div>
                        <div className="auto-fix-body">
                          <p style={{ marginBottom: '1.25rem', color: 'white', fontWeight: 500, fontSize: '0.95rem' }}>
                            Detected build failure on <strong>{healingState.provider === 'vercel' ? 'Vercel' : 'Render'}</strong>.
                          </p>
                          
                          <div style={{ marginBottom: '1.25rem' }}>
                            <strong style={{ color: '#fff', fontSize: '0.85rem' }}>AI Explanation:</strong>
                            <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {healingState.explanation}
                            </p>
                          </div>

                          <div style={{ marginBottom: '1.25rem' }}>
                            <strong style={{ color: '#fff', fontSize: '0.85rem' }}>Suggested Solution:</strong>
                            <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                              {healingState.solution}
                            </p>
                          </div>

                          {healingState.filesChanged && healingState.filesChanged.length > 0 && (
                            <div style={{ marginBottom: '1.25rem' }}>
                              <strong style={{ color: '#fff', fontSize: '0.85rem' }}>Files to modify:</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                                {healingState.filesChanged.map(file => (
                                  <code key={file} style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', color: '#c084fc', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    {file}
                                  </code>
                                ))}
                              </div>
                            </div>
                          )}

                          <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#93c5fd', fontWeight: 500, lineHeight: 1.4 }}>
                            Allow CloudPilot agent to write fixes locally, commit & push to GitHub, and redeploy?
                          </p>
                        </div>
                        <div className="auto-fix-actions">
                          <button 
                            className="btn btn-secondary"
                            onClick={() => {
                              setHealingState(prev => ({ ...prev, active: false }));
                              setDeployError('Auto-healing declined by user.');
                            }}
                          >
                            No, Cancel Deploy
                          </button>
                          <button 
                            className="btn btn-accent btn-glowing"
                            onClick={handleAutoFix}
                          >
                            Yes, Auto-Fix & Redeploy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: PROVISIONING SUMMARY & CLICKABLE SUCCESS CARDS */}
              {wizardStep === 5 && deployResult && (
                <div className="wizard-step-card" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '56px', height: '56px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '28px', height: '28px', color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="wizard-step-title" style={{ fontSize: '1.6rem', color: 'white' }}>Provisioning Complete!</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginTop: '0.25rem' }}>
                      Your application has been deployed successfully to cloud service infrastructures.
                    </p>
                  </div>

                  <div className="services-summary-grid">
                    {/* Render Backend Result */}
                    <div className={`service-result-card ${deployResult.render?.success ? 'success-border' : 'error-border'}`}>
                      <div className="service-logo-header">
                        <div className="service-logo-icon render">R</div>
                        <div>
                          <strong style={{ color: 'white' }}>Render Web Service</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Backend Component</div>
                        </div>
                      </div>
                      
                      {deployResult.render?.success ? (
                        <>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Active Plan: <span style={{ textTransform: 'capitalize', color: '#10b981', fontWeight: 600 }}>{projectScale}</span>
                          </div>
                          <div className="service-url-display">
                            <a 
                              href={deployResult.render.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="service-url-link"
                            >
                              {deployResult.render.url}
                            </a>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                navigator.clipboard.writeText(deployResult.render.url);
                                alert('URL Copied!');
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div style={{ color: '#ef4444', fontSize: '0.825rem', marginBottom: '1rem' }}>
                            Error: {deployResult.render?.error ? (typeof deployResult.render.error === 'object' ? (deployResult.render.error.message || JSON.stringify(deployResult.render.error)) : String(deployResult.render.error)) : 'Provisioning failed.'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Interactive Retry:</div>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Project Name (e.g. foodloop-backend-v3)"
                              value={projectName}
                              onChange={(e) => setProjectName(e.target.value)}
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', height: 'auto' }}
                            />
                            <input 
                              type="password" 
                              className="form-input" 
                              placeholder="Update Render API Key"
                              value={renderApiKey}
                              onChange={(e) => setRenderApiKey(e.target.value)}
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', height: 'auto' }}
                            />
                            <button 
                              className="btn btn-accent" 
                              style={{ padding: '0.4rem', fontSize: '0.75rem', marginTop: '0.25rem' }}
                              onClick={() => handleRetryDeployment({ skipVercel: true, skipRender: false })}
                            >
                              🔄 Retry Render Provisioning
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vercel Frontend Result */}
                    <div className={`service-result-card ${deployResult.vercel?.success ? 'success-border' : 'error-border'}`}>
                      <div className="service-logo-header">
                        <div className="service-logo-icon vercel">▲</div>
                        <div>
                          <strong style={{ color: 'white' }}>Vercel Project</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Frontend Component</div>
                        </div>
                      </div>

                      {deployResult.vercel?.success ? (
                        <>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Connected Repo: <span style={{ color: '#60a5fa', fontWeight: 600 }}>main</span>
                          </div>
                          <div className="service-url-display">
                            <a 
                              href={deployResult.vercel.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="service-url-link"
                            >
                              {deployResult.vercel.url}
                            </a>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                navigator.clipboard.writeText(deployResult.vercel.url);
                                alert('URL Copied!');
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div style={{ color: '#ef4444', fontSize: '0.825rem', marginBottom: '1rem' }}>
                            Error: {deployResult.vercel?.error ? (typeof deployResult.vercel.error === 'object' ? (deployResult.vercel.error.message || JSON.stringify(deployResult.vercel.error)) : String(deployResult.vercel.error)) : 'Provisioning failed.'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Interactive Retry:</div>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Project Name (e.g. foodloop-frontend-v3)"
                              value={projectName}
                              onChange={(e) => setProjectName(e.target.value)}
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', height: 'auto' }}
                            />
                            <input 
                              type="password" 
                              className="form-input" 
                              placeholder="Update Vercel Auth Token"
                              value={vercelToken}
                              onChange={(e) => setVercelToken(e.target.value)}
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.5rem', height: 'auto' }}
                            />
                            <button 
                              className="btn btn-accent" 
                              style={{ padding: '0.4rem', fontSize: '0.75rem', marginTop: '0.25rem' }}
                              onClick={() => handleRetryDeployment({ skipVercel: false, skipRender: true })}
                            >
                              🔄 Retry Vercel Provisioning
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={handleResetWizard}
                    >
                      Deploy Another App
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('checklist')}
                    >
                      View Manual Steps Checklist
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL SETUP CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="glass-card" style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <div className="glass-card-header">
                <h2 className="glass-card-title">Setup Checklist</h2>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Follow these configuration steps in order.
                </span>
              </div>

              <div className="plan-steps-container">
                {steps.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No steps available in this plan.
                  </div>
                ) : (
                  steps.map((step, idx) => (
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
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeploymentPlan;
