import React, { useState, useEffect } from 'react';
import '../styles/wizard.css';

const DashboardSimulator = ({ visibleLogs = [], projectName = 'my-project', projectScale = 'free', envVars = {} }) => {
  const [simState, setSimState] = useState({
    provider: 'idle', // 'idle', 'render', 'vercel'
    step: 'idle', // 'connecting', 'fields', 'envVars', 'building', 'success', 'error', 'fixing'
    statusText: 'Deployment idle',
    errorText: '',
    address: 'https://cloudpilot.io/deployer'
  });

  const [cursor, setCursor] = useState({ left: '50%', top: '50%', clicked: false, visible: true });
  const [typedName, setTypedName] = useState('');
  const [typedRepo, setTypedRepo] = useState('');
  const [addedEnvs, setAddedEnvs] = useState([]);
  const [activeTab, setActiveTab] = useState('browser');
  const [ripples, setRipples] = useState([]);
  const [vercelBuildProgress, setVercelBuildProgress] = useState(0);

  // Parse logs to drive state changes
  useEffect(() => {
    if (!visibleLogs || visibleLogs.length === 0) {
      setSimState({
        provider: 'idle',
        step: 'idle',
        statusText: 'Awaiting deployment trigger...',
        errorText: '',
        address: 'https://cloudpilot.io/deployer'
      });
      setTypedName('');
      setTypedRepo('');
      setAddedEnvs([]);
      setVercelBuildProgress(0);
      return;
    }

    const logsStr = visibleLogs.join('\n');

    // Detect furthest state based on logs keyword presence
    let provider = 'idle';
    let step = 'idle';
    let statusText = 'Awaiting connection...';
    let errorText = '';
    let address = 'https://cloudpilot.io/deployer';

    // Git Auto-healing detections
    const hasAutoFixGit = logsStr.includes('Staging') || logsStr.includes('Committing') || logsStr.includes('Pushing') || logsStr.includes('Auto-Fix') || logsStr.includes('healing loop') || logsStr.includes('auto-fix') || logsStr.includes('Git commit') || logsStr.includes('Git add') || logsStr.includes('auto-healing');

    // Render detections
    const hasRenderConnect = logsStr.includes('Connecting to Render API') || logsStr.includes('Authenticating with Render');
    const hasRenderVerify = logsStr.includes('Owner profile verified');
    const hasRenderProvision = logsStr.includes('Provisioning Render Web Service');
    const hasRenderEnvs = logsStr.includes('Injecting') && logsStr.includes('Render');
    const hasRenderSuccess = logsStr.includes('Render Web Service created successfully') || logsStr.includes('Live service URL:');
    const hasRenderFail = logsStr.includes('Render Provisioning Failed') || logsStr.includes('Render Deploy Failed');

    // Vercel detections
    const hasVercelConnect = logsStr.includes('Connecting to Vercel API') || logsStr.includes('Authenticating with Vercel');
    const hasVercelProvision = logsStr.includes('Registering Vercel Project');
    const hasVercelEnvs = logsStr.includes('Setting environment variable VITE_API_URL') || logsStr.includes('Injecting: VITE_API_URL');
    const hasVercelBuild = logsStr.includes('Triggering deployment build') || logsStr.includes('Dispatching Vercel build trigger');
    const hasVercelSuccess = logsStr.includes('Vercel Frontend Deployment successfully initialized') || logsStr.includes('Target preview URL:');
    const hasVercelFail = logsStr.includes('Vercel Provisioning Failed');

    if (hasAutoFixGit) {
      provider = logsStr.includes('Render') ? 'render' : 'vercel';
      step = 'fixing';
      statusText = 'Auto-healing code errors...';
      address = 'https://github.com/project-owner/' + projectName + '/git-console';
    } else if (hasVercelConnect || hasVercelProvision || hasVercelEnvs || hasVercelBuild || hasVercelSuccess || hasVercelFail) {
      provider = 'vercel';
      if (hasVercelSuccess) {
        step = 'success';
        statusText = 'Frontend successfully deployed!';
        address = `https://vercel.com/dashboard/projects/${projectName}-frontend`;
      } else if (hasVercelFail) {
        step = 'error';
        statusText = 'Frontend provisioning failed';
        const failLine = visibleLogs.find(l => l.includes('Vercel Provisioning Failed') || l.includes('failed:'));
        errorText = failLine ? failLine.replace('[Agent] Vercel Provisioning Failed:', '').trim() : 'Build Failed: Cannot find module \'react-router-dom\'';
        address = 'https://vercel.com/dashboard';
      } else if (hasVercelBuild) {
        step = 'building';
        statusText = 'Running production build commands...';
        address = `https://vercel.com/${projectName}-frontend/deploying`;
      } else if (hasVercelEnvs) {
        step = 'envVars';
        statusText = 'Injecting VITE_API_URL environment key...';
        address = 'https://vercel.com/import/project';
      } else if (hasVercelProvision) {
        step = 'fields';
        statusText = 'Configuring Vercel frontend project...';
        address = 'https://vercel.com/import/project';
      } else {
        step = 'connecting';
        statusText = 'Connecting to Vercel API Gateway...';
        address = 'https://vercel.com/new';
      }
    } else if (hasRenderConnect || hasRenderVerify || hasRenderProvision || hasRenderEnvs || hasRenderSuccess || hasRenderFail) {
      provider = 'render';
      if (hasRenderSuccess) {
        step = 'success';
        statusText = 'Backend service is online!';
        address = `https://dashboard.render.com/web/${projectName}-backend`;
      } else if (hasRenderFail) {
        step = 'error';
        statusText = 'Render provisioning failed';
        const failLine = visibleLogs.find(l => l.includes('Render Provisioning Failed') || l.includes('Failed with status:'));
        errorText = failLine ? failLine.trim() : 'Invalid API Credentials or Plan Mismatch';
        address = 'https://dashboard.render.com';
      } else if (hasRenderEnvs) {
        step = 'envVars';
        statusText = 'Injecting repository secret keys...';
        address = 'https://dashboard.render.com/web/create';
      } else if (hasRenderProvision) {
        step = 'fields';
        statusText = 'Configuring Render Web Service fields...';
        address = 'https://dashboard.render.com/web/create';
      } else {
        step = 'connecting';
        statusText = 'Connecting to Render developer APIs...';
        address = 'https://dashboard.render.com/select-repo';
      }
    }

    setSimState({ provider, step, statusText, errorText, address });
  }, [visibleLogs, projectName]);

  // Handle Cursor animations & field text typing simulations
  useEffect(() => {
    const triggerClick = (x, y) => {
      setCursor(prev => ({ ...prev, left: x, top: y, clicked: true }));
      setRipples(prev => [...prev, { id: Date.now(), x, y }]);
      setTimeout(() => {
        setCursor(prev => ({ ...prev, clicked: false }));
      }, 300);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== r.id));
      }, 600);
    };

    if (simState.provider === 'render') {
      if (simState.step === 'connecting') {
        setCursor({ left: '78%', top: '28%', clicked: false, visible: true });
        setTimeout(() => triggerClick('78%', '28%'), 800);
      } 
      else if (simState.step === 'fields') {
        setCursor({ left: '30%', top: '33%', clicked: false, visible: true });
        const nameVal = `${projectName}-backend`;
        let i = 0;
        const interval = setInterval(() => {
          if (i <= nameVal.length) {
            setTypedName(nameVal.substring(0, i));
            i++;
          } else {
            clearInterval(interval);
            setCursor({ left: '30%', top: '44%', clicked: false, visible: true });
            setTimeout(() => {
              setTypedRepo('github.com/current-project');
              setCursor({ left: '22%', top: '56%', clicked: false, visible: true });
            }, 800);
          }
        }, 50);
        return () => clearInterval(interval);
      } 
      else if (simState.step === 'envVars') {
        setCursor({ left: '22%', top: '56%', clicked: false, visible: true });
        setTimeout(() => {
          triggerClick('22%', '56%');
          const keys = Object.keys(envVars).length > 0 ? Object.keys(envVars) : ['DATABASE_URL', 'NODE_ENV', 'PORT'];
          const displayKeys = keys.slice(0, 4);
          
          let kIdx = 0;
          const addInterval = setInterval(() => {
            if (kIdx < displayKeys.length) {
              const key = displayKeys[kIdx];
              setAddedEnvs(prev => [...prev, { key, value: '••••••••••••' }]);
              setCursor({ left: '42%', top: `${62 + (kIdx * 6)}%`, clicked: false, visible: true });
              kIdx++;
            } else {
              clearInterval(addInterval);
              setCursor({ left: '80%', top: '88%', clicked: false, visible: true });
              setTimeout(() => triggerClick('80%', '88%'), 700);
            }
          }, 600);
        }, 600);
      } 
      else if (simState.step === 'success') {
        setCursor({ left: '85%', top: '15%', clicked: false, visible: true });
      }
      else if (simState.step === 'error') {
        setCursor({ left: '50%', top: '50%', clicked: false, visible: true });
      }
      else if (simState.step === 'fixing') {
        setCursor({ left: '50%', top: '50%', clicked: false, visible: false });
      }
    } 
    else if (simState.provider === 'vercel') {
      if (simState.step === 'connecting') {
        setCursor({ left: '72%', top: '35%', clicked: false, visible: true });
        setTimeout(() => triggerClick('72%', '35%'), 800);
      }
      else if (simState.step === 'fields') {
        setCursor({ left: '40%', top: '38%', clicked: false, visible: true });
        const nameVal = `${projectName}-frontend`;
        let i = 0;
        const interval = setInterval(() => {
          if (i <= nameVal.length) {
            setTypedName(nameVal.substring(0, i));
            i++;
          } else {
            clearInterval(interval);
            setCursor({ left: '40%', top: '48%', clicked: false, visible: true });
          }
        }, 50);
        return () => clearInterval(interval);
      }
      else if (simState.step === 'envVars') {
        setCursor({ left: '40%', top: '60%', clicked: false, visible: true });
        setTimeout(() => {
          triggerClick('40%', '60%');
          setAddedEnvs([{ key: 'VITE_API_URL', value: `https://${projectName}-backend.onrender.com` }]);
          setCursor({ left: '50%', top: '88%', clicked: false, visible: true });
          setTimeout(() => triggerClick('50%', '88%'), 800);
        }, 600);
      }
      else if (simState.step === 'building') {
        setCursor({ left: '50%', top: '50%', clicked: false, visible: true });
        setVercelBuildProgress(5);
        const progressInt = setInterval(() => {
          setVercelBuildProgress(prev => {
            if (prev >= 95) {
              clearInterval(progressInt);
              return 95;
            }
            return prev + Math.floor(Math.random() * 15) + 5;
          });
        }, 400);
        return () => clearInterval(progressInt);
      }
      else if (simState.step === 'success') {
        setVercelBuildProgress(100);
        setCursor({ left: '80%', top: '22%', clicked: false, visible: true });
      }
      else if (simState.step === 'error') {
        setCursor({ left: '50%', top: '50%', clicked: false, visible: true });
      }
      else if (simState.step === 'fixing') {
        setCursor({ left: '50%', top: '50%', clicked: false, visible: false });
      }
    } else {
      setCursor({ left: '50%', top: '50%', clicked: false, visible: false });
    }
  }, [simState.provider, simState.step, projectName, envVars]);

  const removeRipple = (id) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="simulator-wrapper glass-card">
      <div className="simulator-window-header">
        <div className="simulator-window-dots">
          <div className="sim-dot dot-red" />
          <div className="sim-dot dot-yellow" />
          <div className="sim-dot dot-green" />
        </div>
        <div className="simulator-window-tabs">
          <div 
            className={`sim-window-tab ${simState.provider === 'render' ? 'active' : ''}`}
            onClick={() => simState.provider !== 'idle' && setSimState(prev => ({ ...prev, provider: 'render' }))}
          >
            <span className="sim-tab-icon render">R</span>
            Render Services
          </div>
          <div 
            className={`sim-window-tab ${simState.provider === 'vercel' ? 'active' : ''}`}
            onClick={() => simState.provider !== 'idle' && setSimState(prev => ({ ...prev, provider: 'vercel' }))}
          >
            <span className="sim-tab-icon vercel">▲</span>
            Vercel Project
          </div>
        </div>
        <div className="simulator-address-bar">
          <svg className="sim-lock-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          <span className="sim-address-text">{simState.address}</span>
        </div>
      </div>

      <div className="simulator-workspace-body">
        {/* Virtual Pointer Mouse Cursor */}
        {cursor.visible && (
          <div 
            className={`virtual-cursor ${cursor.clicked ? 'clicked' : ''}`} 
            style={{ left: cursor.left, top: cursor.top }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4.5 3V20.12L10.06 14.56H18.9L4.5 3Z" fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* Click Ripples */}
        {ripples.map(r => (
          <div 
            key={r.id} 
            className="click-ripple" 
            style={{ left: r.x, top: r.y }}
            onAnimationEnd={() => removeRipple(r.id)}
          />
        ))}

        {/* IDLE VIEW */}
        {simState.provider === 'idle' && (
          <div className="sim-view-idle">
            <div className="sim-idle-glowing-logo">
              <div className="logo-ring ring-1" />
              <div className="logo-ring ring-2" />
              <div className="logo-core">🤖</div>
            </div>
            <h3>Cloud Agent Virtual Monitor</h3>
            <p>
              Once deployment is initiated, this screen will display the automated cursor interactions with Cloud Provider consoles in real-time.
            </p>
            <div className="sim-idle-status">
              <span className="sim-pulse-dot warning" />
              Awaiting credentials & deployment trigger
            </div>
          </div>
        )}

        {/* RENDER SIMULATED VIEW */}
        {simState.provider === 'render' && (
          <div className="sim-view-render">
            <div className="sim-render-sidebar">
              <div className="sim-render-logo">
                <span className="logo-circle">R</span>
                <span>render</span>
              </div>
              <div className="sidebar-link active">Web Services</div>
              <div className="sidebar-link">Databases</div>
              <div className="sidebar-link">Cron Jobs</div>
              <div className="sidebar-link">Environment Groups</div>
              <div className="sidebar-link">Billing</div>
            </div>

            <div className="sim-render-content">
              {/* CONNECTING / REPO LIST FRAME */}
              {simState.step === 'connecting' && (
                <div className="sim-render-card">
                  <h4>Create a New Web Service</h4>
                  <p className="subtitle">Select a repository to deploy code automatically.</p>
                  
                  <div className="sim-repo-list">
                    <div className="sim-repo-item">
                      <div className="repo-info">
                        <svg className="repo-git-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
                        <span>{projectName}</span>
                      </div>
                      <button className="sim-btn sim-btn-primary">Connect</button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONFIGURE FORM FIELDS FRAME */}
              {(simState.step === 'fields' || simState.step === 'envVars') && (
                <div className="sim-render-card">
                  <h4>New Web Service Settings</h4>
                  
                  <div className="sim-form-group">
                    <label>Name</label>
                    <input 
                      type="text" 
                      className="sim-input" 
                      value={typedName} 
                      readOnly 
                      placeholder="e.g. backend-api"
                    />
                  </div>

                  <div className="sim-form-group">
                    <label>Repository</label>
                    <input 
                      type="text" 
                      className="sim-input muted" 
                      value={typedRepo || 'https://github.com/project-owner/' + projectName} 
                      readOnly
                    />
                  </div>

                  <div className="sim-form-row">
                    <div className="sim-form-group">
                      <label>Runtime</label>
                      <select className="sim-input" readOnly value="node"><option value="node">Node.js</option></select>
                    </div>
                    <div className="sim-form-group">
                      <label>Instance Tier</label>
                      <select className="sim-input" readOnly value={projectScale}>
                        <option value="free">Free ($0/mo)</option>
                        <option value="staging">Starter ($7/mo)</option>
                        <option value="production">Standard ($25/mo)</option>
                      </select>
                    </div>
                  </div>

                  {/* Environment Secrets */}
                  <div className="sim-env-section">
                    <h5>Environment Variables</h5>
                    <div className="sim-env-subgrid">
                      {addedEnvs.map((env, index) => (
                        <div key={index} className="sim-env-row-item">
                          <input type="text" className="sim-input font-mono" value={env.key} readOnly />
                          <input type="text" className="sim-input" value={env.value} readOnly />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="sim-action-footer">
                    <button className="sim-btn sim-btn-primary pulse-hover">Create Web Service</button>
                  </div>
                </div>
              )}

              {/* GIT AUTO-HEALING TERMINAL */}
              {simState.step === 'fixing' && (
                <div className="sim-render-card git-console-panel w-full" style={{ height: '360px', background: '#05070a', border: '1px solid #141c28' }}>
                  <div className="git-console-header" style={{ display: 'flex', alignItems: 'center', background: '#0e1118', borderBottom: '1px solid #1c2738', padding: '0.4rem 0.8rem', color: '#8c9ba5', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                    <span>git-agent@render-deploy:~</span>
                  </div>
                  <div className="git-console-body" style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.725rem', color: '#a0aec0', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', height: '300px' }}>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>$ git status</div>
                    <div className="git-line text-muted" style={{ color: '#5d6d7a' }}>On branch main. Changes not staged for commit:</div>
                    <div className="git-line error-color" style={{ color: '#ef4444' }}>  modified:   backend/package.json</div>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>$ git add .</div>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>$ git commit -m "fix(deploy): resolve deployment build failure via AI auto-heal"</div>
                    <div className="git-line success-color" style={{ color: '#46e3b4' }}>[main def456a] fix(deploy): resolve deployment build failure via AI auto-heal</div>
                    <div className="git-line success-color" style={{ color: '#46e3b4' }}> 1 file changed, 2 insertions(+), 1 deletion(-)</div>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>$ git push origin main</div>
                    <div className="git-line text-muted" style={{ color: '#5d6d7a' }}>Writing objects: 100% (3/3), done.</div>
                    <div className="git-line success-color" style={{ color: '#46e3b4' }}>To github.com/user/{projectName}.git</div>
                    <div className="git-line success-color" style={{ color: '#46e3b4' }}>   abc123f..def456a  main -&gt; main</div>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>
                      <span className="terminal-cursor" style={{ display: 'inline-block', width: '6px', height: '12px', background: 'white', marginLeft: '4px' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* SUCCESS STATE */}
              {simState.step === 'success' && (
                <div className="sim-render-card status-success-card">
                  <div className="sim-status-banner">
                    <span className="sim-badge badge-green pulsing">Live</span>
                    <h5>{projectName}-backend</h5>
                  </div>
                  <div className="sim-mock-terminal">
                    <div className="mock-term-line">&gt; npm install</div>
                    <div className="mock-term-line">added 342 packages in 4.21s</div>
                    <div className="mock-term-line">&gt; npm run start</div>
                    <div className="mock-term-line">Database connection established.</div>
                    <div className="mock-term-line">Backend listening on port 10000.</div>
                    <div className="mock-term-line success-color">✓ Deploy succeeded! Live URL generated.</div>
                  </div>
                  <div className="sim-details-row">
                    <span>Region: Oregon (US West)</span>
                    <a href={`https://${projectName}-backend.onrender.com`} target="_blank" rel="noreferrer" className="sim-link">
                      {`https://${projectName}-backend.onrender.com`}
                    </a>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {simState.step === 'error' && (
                <div className="sim-render-card status-error-card">
                  <div className="error-icon-circle">✕</div>
                  <h4>Deployment Failed</h4>
                  <p className="error-reason">{simState.errorText}</p>
                  <p className="error-note">Please update your API credentials or billing setup on Render and try again.</p>
                  <button className="sim-btn sim-btn-danger">Dismiss</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VERCEL SIMULATED VIEW */}
        {simState.provider === 'vercel' && (
          <div className="sim-view-vercel">
            <div className="sim-vercel-navbar">
              <div className="navbar-logo">
                <span className="triangle-icon">▲</span>
                <span>Vercel Dashboard</span>
              </div>
              <div className="navbar-links">
                <span className="nav-item">Projects</span>
                <span className="nav-item">Deployments</span>
                <span className="nav-item">Analytics</span>
                <span className="nav-item">Settings</span>
              </div>
            </div>

            <div className="sim-vercel-content">
              {/* CONNECTING / IMPORT REPO FRAME */}
              {simState.step === 'connecting' && (
                <div className="sim-vercel-panel">
                  <h3>Import Git Repository</h3>
                  <p className="panel-desc">Choose a repository to create your Vercel project.</p>
                  
                  <div className="sim-vercel-repo-box">
                    <div className="v-repo-details">
                      <span className="v-git-icon">github</span>
                      <span className="v-repo-name">owner/{projectName}</span>
                    </div>
                    <button className="sim-btn-vercel bg-white">Import</button>
                  </div>
                </div>
              )}

              {/* CONFIGURE PROJECT FRAME */}
              {(simState.step === 'fields' || simState.step === 'envVars') && (
                <div className="sim-vercel-panel">
                  <h3>Configure Project</h3>
                  
                  <div className="v-form-card">
                    <div className="v-input-group">
                      <label>Project Name</label>
                      <input 
                        type="text" 
                        className="v-input" 
                        value={typedName} 
                        readOnly 
                        placeholder="e.g. my-frontend"
                      />
                    </div>
                    
                    <div className="v-input-group">
                      <label>Framework Preset</label>
                      <select className="v-input" readOnly value="vite"><option value="vite">Vite</option></select>
                    </div>

                    <div className="v-accordion">
                      <div className="v-accordion-header">
                        <span>Environment Variables</span>
                        <span>▼</span>
                      </div>
                      <div className="v-accordion-content">
                        {addedEnvs.map((env, index) => (
                          <div key={index} className="v-env-row">
                            <span className="v-env-key">{env.key}</span>
                            <span className="v-env-val">{env.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className="sim-btn-vercel bg-white w-full pulse-hover">
                      Deploy
                    </button>
                  </div>
                </div>
              )}

              {/* GIT AUTO-HEALING TERMINAL */}
              {simState.step === 'fixing' && (
                <div className="sim-vercel-panel git-console-panel w-full" style={{ maxWidth: '100%', background: '#050505', border: '1px solid #1f1f1f', height: '360px' }}>
                  <div className="git-console-header" style={{ display: 'flex', alignItems: 'center', background: '#0a0a0a', borderBottom: '1px solid #1f1f1f', padding: '0.4rem 0.8rem', color: '#666', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                    <span>git-agent@vercel-deploy:~</span>
                  </div>
                  <div className="git-console-body" style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.725rem', color: '#999', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', height: '300px' }}>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>$ git status</div>
                    <div className="git-line text-muted" style={{ color: '#444' }}>On branch main. Changes not staged for commit:</div>
                    <div className="git-line error-color" style={{ color: '#ef4444' }}>  modified:   frontend/package.json</div>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>$ git add .</div>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>$ git commit -m "fix(deploy): add missing react-router-dom dependency"</div>
                    <div className="git-line success-color" style={{ color: 'white' }}>[main d6f882a] fix(deploy): add missing react-router-dom dependency</div>
                    <div className="git-line success-color" style={{ color: 'white' }}> 1 file changed, 1 insertion(+)</div>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>$ git push origin main</div>
                    <div className="git-line text-muted" style={{ color: '#444' }}>Writing objects: 100% (3/3), done.</div>
                    <div className="git-line success-color" style={{ color: 'white' }}>To github.com/user/{projectName}.git</div>
                    <div className="git-line success-color" style={{ color: 'white' }}>   abc123f..d6f882a  main -&gt; main</div>
                    <div className="git-line cmd-line" style={{ color: 'white' }}>
                      <span className="terminal-cursor" style={{ display: 'inline-block', width: '6px', height: '12px', background: 'white', marginLeft: '4px' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* BUILDING FRAME */}
              {simState.step === 'building' && (
                <div className="sim-vercel-panel center-panel">
                  <div className="v-build-spinner-box">
                    <svg className="v-progress-ring" width="80" height="80">
                      <circle 
                        className="v-progress-ring-circle-bg" 
                        stroke="#222" 
                        strokeWidth="6" 
                        fill="transparent" 
                        r="34" 
                        cx="40" 
                        cy="40"
                      />
                      <circle 
                        className="v-progress-ring-circle" 
                        stroke="white" 
                        strokeWidth="6" 
                        fill="transparent" 
                        r="34" 
                        cx="40" 
                        cy="40"
                        style={{ strokeDasharray: `${2 * Math.PI * 34}`, strokeDashoffset: `${2 * Math.PI * 34 * (1 - vercelBuildProgress / 100)}` }}
                      />
                    </svg>
                    <span className="v-progress-percent">{vercelBuildProgress}%</span>
                  </div>
                  <h4>Building Frontend Assets</h4>
                  <p className="v-build-logs-sub">Running production build configuration presets...</p>
                  <div className="v-mini-build-logs">
                    <div>vite v5.2.11 building for production...</div>
                    {vercelBuildProgress > 30 && <div>✓ transform code chunks successfully</div>}
                    {vercelBuildProgress > 60 && <div>✓ render page chunks optimized</div>}
                    {vercelBuildProgress > 80 && <div>✓ upload build outputs package to Vercel CDN</div>}
                  </div>
                </div>
              )}

              {/* SUCCESS FRAME */}
              {simState.step === 'success' && (
                <div className="sim-vercel-panel status-success-card">
                  <div className="congrats-circle">🎉</div>
                  <h3>Congratulations!</h3>
                  <p className="panel-desc">Your project is online with production SSL configurations.</p>
                  
                  <div className="v-success-preview-window">
                    <div className="v-preview-top">
                      <span className="v-url-tag">https://{projectName}-frontend.vercel.app</span>
                    </div>
                    <div className="v-preview-page-mock">
                      <div className="mock-nav">
                        <span className="mock-logo">☁️ CloudPilot</span>
                        <div className="mock-nav-links"><span /><span /></div>
                      </div>
                      <div className="mock-hero">
                        <h2>Build Secure Apps</h2>
                        <p>Fully configured and ready to scale.</p>
                        <div className="mock-btn-group"><span className="btn-m" /><span className="btn-m sub" /></div>
                      </div>
                    </div>
                  </div>

                  <div className="v-btn-actions">
                    <a href={`https://${projectName}-frontend.vercel.app`} target="_blank" rel="noreferrer" className="sim-btn-vercel bg-white">
                      Visit Live App
                    </a>
                  </div>
                </div>
              )}

              {/* ERROR FRAME */}
              {simState.step === 'error' && (
                <div className="sim-vercel-panel status-error-card">
                  <div className="error-icon-circle">✕</div>
                  <h4>Vercel Build Blocked</h4>
                  <p className="error-reason">{simState.errorText}</p>
                  <p className="error-note">Verify that your Vercel auth token has scopes for projects:write and deployments:write.</p>
                  <button className="sim-btn-vercel bg-red">Dismiss</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSimulator;
