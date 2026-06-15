import axios from 'axios';
import fs from 'fs';
import path from 'path';
import Analysis from '../models/Analysis.js';
import { aiDeploymentPlan } from '../services/ollamaService.js';

/**
 * Reads and returns key-value mapping of all environment variables from local codebase .env files.
 */
const readLocalEnvValues = () => {
  const envValues = {};
  try {
    const backendDir = process.cwd();
    const workspaceRoot = path.dirname(backendDir);
    
    const backendEnvPath = path.join(backendDir, '.env');
    const frontendEnvPath = path.join(workspaceRoot, 'frontend', '.env');
    const frontendSrcEnvPath = path.join(workspaceRoot, 'frontend', 'src', '.env');

    const parseEnvFile = (envPath) => {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const equalsIdx = trimmed.indexOf('=');
            if (equalsIdx !== -1) {
              const k = trimmed.substring(0, equalsIdx).trim();
              const v = trimmed.substring(equalsIdx + 1).trim();
              envValues[k] = v;
            }
          }
        });
      }
    };

    parseEnvFile(backendEnvPath);
    parseEnvFile(frontendEnvPath);
    parseEnvFile(frontendSrcEnvPath);
  } catch (err) {
    console.error('Error reading local env values:', err);
  }
  return envValues;
};

/**
 * Writes or merges key-value env variables into local codebase .env files.
 */
const updateLocalEnvFiles = (envVars) => {
  if (!envVars || typeof envVars !== 'object' || Object.keys(envVars).length === 0) {
    return { success: true };
  }

  try {
    const backendDir = process.cwd();
    const workspaceRoot = path.dirname(backendDir);
    
    const frontendDir = path.join(workspaceRoot, 'frontend');
    const frontendSrcDir = path.join(frontendDir, 'src');

    const backendEnvPath = path.join(backendDir, '.env');
    const frontendEnvPath = path.join(frontendDir, '.env');
    const frontendSrcEnvPath = path.join(frontendSrcDir, '.env');

    const backendEnvLines = [];
    const frontendEnvLines = [];

    // Separate backend and frontend variables
    Object.entries(envVars).forEach(([key, value]) => {
      const line = `${key}=${value}`;
      if (key.startsWith('VITE_') || key.startsWith('REACT_APP_') || key.startsWith('NEXT_PUBLIC_')) {
        frontendEnvLines.push(line);
      } else {
        backendEnvLines.push(line);
      }
    });

    const mergeEnvFile = (envPath, newLines) => {
      let existingContent = '';
      if (fs.existsSync(envPath)) {
        existingContent = fs.readFileSync(envPath, 'utf8');
      }
      
      const lines = existingContent.split(/\r?\n/);
      const envObj = {};
      
      // Parse existing lines
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const equalsIdx = trimmed.indexOf('=');
          if (equalsIdx !== -1) {
            const k = trimmed.substring(0, equalsIdx).trim();
            const v = trimmed.substring(equalsIdx + 1).trim();
            envObj[k] = v;
          }
        }
      });
      
      // Merge/overwrite with new values
      newLines.forEach(line => {
        const equalsIdx = line.indexOf('=');
        if (equalsIdx !== -1) {
          const k = line.substring(0, equalsIdx).trim();
          const v = line.substring(equalsIdx + 1).trim();
          envObj[k] = v;
        }
      });
      
      // Re-compile file content
      const mergedContent = Object.entries(envObj)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n') + '\n';
        
      fs.writeFileSync(envPath, mergedContent, 'utf8');
    };

    if (backendEnvLines.length > 0) {
      mergeEnvFile(backendEnvPath, backendEnvLines);
    }
    
    if (frontendEnvLines.length > 0) {
      if (fs.existsSync(frontendDir)) {
        mergeEnvFile(frontendEnvPath, frontendEnvLines);
      }
      if (fs.existsSync(frontendSrcDir)) {
        mergeEnvFile(frontendSrcEnvPath, frontendEnvLines);
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error('Failed to update local env files:', err);
    return { success: false, error: err.message };
  }
};

export const getDeploymentPlan = async (req, res) => {
  const { githubUrl, analysisId } = req.body;

  if (!githubUrl && !analysisId) {
    return res.status(400).json({ error: 'Either githubUrl or analysisId is required' });
  }

  try {
    const query = analysisId ? { _id: analysisId } : { githubUrl };
    const analysis = await Analysis.findOne(query);

    if (!analysis) {
      return res.status(404).json({ error: 'No analysis found for this repository. Analyze it first.' });
    }

    // Ensure recommendation exists
    const recommendation = analysis.recommendation;
    if (!recommendation || !recommendation.frontend || recommendation.frontend === 'None') {
      throw new Error('No deployment recommendation found for this repository. Please run get recommendation first.');
    }

    // Generate plan steps
    const steps = await aiDeploymentPlan(analysis, recommendation);

    // Save to DB
    analysis.deploymentPlan = { steps };
    await analysis.save();

    // Read current values of env variables from local codebase files
    const localEnvValues = readLocalEnvValues();

    return res.status(200).json({
      steps,
      envVariables: analysis.envVariables || [],
      envValues: localEnvValues,
      framework: analysis.framework,
      database: analysis.database
    });
  } catch (error) {
    console.error(`Deployment Plan Controller Error: ${error.message}`);
    return res.status(500).json({ error: `Deployment plan generation failed: ${error.message}` });
  }
};

export const triggerAutoDeployment = async (req, res) => {
  const { vercelToken, renderApiKey, githubUrl, config } = req.body;
  
  if (!githubUrl) {
    return res.status(400).json({ error: 'githubUrl is required' });
  }
  
  const { projectName, frontendTier, backendTier, envVars } = config || {};
  const cleanProjName = (projectName || 'cloudpilot-app').toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const logs = [];
  const status = {
    vercel: { success: false, url: null, error: null },
    render: { success: false, url: null, error: null }
  };

  try {
    logs.push('[Agent] Starting automated provisioning workflow...');

    // Automatically sync environment variable changes back to local codebase files (.env)
    if (envVars && Object.keys(envVars).length > 0) {
      logs.push('[Agent] Syncing environment variable updates to local codebase .env files...');
      const updateResult = updateLocalEnvFiles(envVars);
      if (updateResult && updateResult.success) {
        logs.push('[Agent] Local .env files updated and synced successfully!');
      } else {
        logs.push(`[Agent] [Warning] Local .env sync finished with note: ${updateResult?.error || 'unspecified write error'}`);
      }
    }
    
    const isMockRender = !renderApiKey || renderApiKey.startsWith('mock') || renderApiKey === 'demo';
    const isMockVercel = !vercelToken || vercelToken.startsWith('mock') || vercelToken === 'demo';

    // Render Web Service Provisioning
    if (isMockRender) {
      logs.push('[Agent] [Simulation] Authenticating with Render Developer Portal...');
      logs.push('[Agent] [Simulation] Owner profile verified (Owner ID: owner_mock_12345)');
      logs.push(`[Agent] [Simulation] Provisioning Render Web Service '${cleanProjName}-backend'...`);
      logs.push(`[Agent] [Simulation] Configuration: Plan=${backendTier || 'free'}, Runtime=Node.js, RootDir=backend`);
      
      if (envVars && Object.keys(envVars).length > 0) {
        logs.push(`[Agent] [Simulation] Injecting ${Object.keys(envVars).length} environment variables into Render service...`);
        Object.keys(envVars).forEach(key => {
          logs.push(`  -> Injected secret: ${key}=********`);
        });
      }
      
      logs.push('[Agent] [Simulation] Render Web Service created successfully!');
      status.render.success = true;
      status.render.url = `https://${cleanProjName}-backend.onrender.com`;
      logs.push(`[Agent] [Simulation] Live service URL: https://${cleanProjName}-backend.onrender.com`);
    } else {
      logs.push('[Agent] Connecting to Render API...');
      try {
        const ownersRes = await axios.get('https://api.render.com/v1/owners', {
          headers: { Authorization: `Bearer ${renderApiKey}` }
        });
        
        const ownerId = ownersRes.data?.[0]?.owner?.id;
        if (!ownerId) throw new Error('No owner accounts identified in Render dashboard.');
        
        logs.push(`[Agent] Owner profile verified (Owner ID: ${ownerId})`);
        logs.push(`[Agent] Provisioning Render Web Service '${cleanProjName}-backend'...`);
        
        const renderEnvVarsArray = Object.entries(envVars || {}).map(([key, value]) => ({ key, value }));
        
        const renderRes = await axios.post('https://api.render.com/v1/services', {
          type: 'web_service',
          name: `${cleanProjName}-backend`,
          ownerId: ownerId,
          repo: githubUrl,
          branch: 'main',
          rootDir: 'backend',
          env: 'node',
          plan: backendTier || 'free',
          envVars: renderEnvVarsArray,
          buildCommand: 'npm install',
          startCommand: 'npm start'
        }, {
          headers: {
            Authorization: `Bearer ${renderApiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        const serviceUrl = renderRes.data?.service?.url;
        logs.push('[Agent] Render Web Service created successfully!');
        status.render.success = true;
        status.render.url = serviceUrl;
        logs.push(`[Agent] Live service URL: ${serviceUrl}`);
      } catch (err) {
        const errMsg = err.response?.data?.error || err.message;
        logs.push(`[Agent] Render Provisioning Failed: ${errMsg}`);
        status.render.error = errMsg;
      }
    }

    // Vercel Frontend Project Provisioning
    if (isMockVercel) {
      logs.push('[Agent] [Simulation] Authenticating with Vercel API Gateway...');
      logs.push(`[Agent] [Simulation] Registering Vercel Project '${cleanProjName}-frontend'...`);
      logs.push(`[Agent] [Simulation] Setting framework preset: Vite/React SPA`);
      
      const backendUrl = status.render.url || `https://${cleanProjName}-backend.onrender.com`;
      logs.push(`[Agent] [Simulation] Injecting: VITE_API_URL=${backendUrl}`);
      logs.push('[Agent] [Simulation] Dispatching Vercel build trigger...');
      logs.push('[Agent] [Simulation] Vercel Frontend Deployment successfully initialized!');
      
      status.vercel.success = true;
      status.vercel.url = `https://${cleanProjName}-frontend.vercel.app`;
      logs.push(`[Agent] [Simulation] Target preview URL: https://${cleanProjName}-frontend.vercel.app`);
    } else {
      logs.push('[Agent] Connecting to Vercel API...');
      try {
        const projectRes = await axios.post('https://api.vercel.com/v9/projects', {
          name: `${cleanProjName}-frontend`,
          framework: 'vite',
          gitRepository: {
            type: 'github',
            repo: githubUrl.replace('https://github.com/', '')
          }
        }, {
          headers: { Authorization: `Bearer ${vercelToken}` }
        });
        
        const projectId = projectRes.data?.id;
        logs.push(`[Agent] Vercel Project created successfully (ID: ${projectId})`);

        const backendUrl = status.render.url || `https://${cleanProjName}-backend.onrender.com`;
        logs.push(`[Agent] Setting environment variable VITE_API_URL=${backendUrl} on Vercel...`);
        
        await axios.post(`https://api.vercel.com/v9/projects/${projectId}/env`, {
          key: 'VITE_API_URL',
          value: backendUrl,
          type: 'plain',
          target: ['production', 'preview', 'development']
        }, {
          headers: { Authorization: `Bearer ${vercelToken}` }
        });

        logs.push('[Agent] Triggering deployment build on Vercel...');
        const deployRes = await axios.post('https://api.vercel.com/v13/deployments', {
          name: `${cleanProjName}-frontend`,
          project: `${cleanProjName}-frontend`,
          gitSource: {
            type: 'github',
            ref: 'main',
            repo: githubUrl.replace('https://github.com/', '')
          }
        }, {
          headers: { Authorization: `Bearer ${vercelToken}` }
        });
        
        const previewUrl = deployRes.data?.url;
        logs.push('[Agent] Vercel Frontend Deployment successfully initialized!');
        status.vercel.success = true;
        status.vercel.url = `https://${previewUrl}`;
        logs.push(`[Agent] Target preview URL: https://${previewUrl}`);
      } catch (err) {
        const errMsg = err.response?.data?.error || err.message;
        logs.push(`[Agent] Vercel Provisioning Failed: ${errMsg}`);
        status.vercel.error = errMsg;
      }
    }

    logs.push('[Agent] Auto-deployment provisioning workflow finished! 🎉');
    return res.status(200).json({ logs, status });
  } catch (error) {
    console.error(`Auto-deployment Error: ${error.message}`);
    return res.status(500).json({ error: `Auto-deployment pipeline failed: ${error.message}` });
  }
};
