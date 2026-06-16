import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import Analysis from '../models/Analysis.js';
import { runAgentHelper } from '../agents/agentRunner.js';
import { monitoringAgent } from '../agents/monitoring/monitoringAgent.js';
import { autoHealingAgent } from '../agents/auto-healing/autoHealingAgent.js';
import { gitAdd, gitCommit, gitPush } from '../services/gitService.js';
import { runDeploymentWorkflow } from '../workflows/deploymentWorkflow.js';

/**
 * Reads the local git configuration file to retrieve the remote origin URL.
 */
const getLocalGitUrl = () => {
  try {
    const backendDir = process.cwd();
    const configPath = path.join(path.dirname(backendDir), '.git', 'config');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const match = content.match(/url\s*=\s*(.+)/);
      if (match) {
        return match[1].trim();
      }
    }
  } catch (err) {
    console.error('Error reading local git config:', err);
  }
  return null;
};

/**
 * Checks if the target githubUrl matches the local running project's Git URL
 * or if it indicates a local workspace scan.
 */
const isLocalProject = (githubUrl) => {
  if (!githubUrl) return false;

  const normalizeUrl = (url) => {
    return url
      .toLowerCase()
      .replace(/\.git$/, '')
      .replace(/\/$/, '')
      .replace(/^git@github\.com:/, 'https://github.com/')
      .trim();
  };

  const localGitUrl = getLocalGitUrl();
  if (localGitUrl) {
    if (normalizeUrl(githubUrl) === normalizeUrl(localGitUrl)) {
      return true;
    }
  }

  // Also match local directory scan paths (e.g., local://... or editor://...)
  if (githubUrl.startsWith('local://') || githubUrl.startsWith('editor://')) {
    return true;
  }

  return false;
};

/**
 * Safely resolves the directory path for the targeted Git repository.
 * If it matches the local project, returns the parent directory of backend.
 * Otherwise, clones the remote repository to a temp directory and returns that path.
 */
const getRepositoryPath = async (githubUrl) => {
  if (isLocalProject(githubUrl)) {
    return path.dirname(process.cwd());
  }

  const tempDir = path.join(process.cwd(), 'temp-clones');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Extract repo name safely
  const repoName = githubUrl.split('/').pop().replace(/\.git$/, '');
  const clonePath = path.join(tempDir, repoName);

  if (!fs.existsSync(clonePath)) {
    console.log(`[Auto-Fix] Cloned repository path not found. Cloning remote repository "${githubUrl}" to "${clonePath}"...`);
    try {
      execSync(`git clone "${githubUrl}" "${clonePath}"`, { stdio: 'ignore' });
    } catch (cloneErr) {
      console.error(`[Auto-Fix] Failed to clone remote repository:`, cloneErr);
      throw new Error(`Failed to clone target repository ${githubUrl} locally for auto-healing: ${cloneErr.message}`);
    }
  }

  return clonePath;
};

/**
 * Safely extracts a string error message from various API error structures.
 */
const extractErrorMessage = (err) => {
  if (err.response?.data) {
    const data = err.response.data;
    if (data.error) {
      if (typeof data.error === 'object') {
        return data.error.message || JSON.stringify(data.error);
      }
      return data.error;
    }
    if (data.message) {
      return data.message;
    }
  }
  return err.message;
};

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

    if (!analysis || !analysis.report) {
      throw new Error('AnalysisMissingError: No analyzed project report found in the database. Run repository analysis first.');
    }

    const steps = analysis.report.recommendedDeploymentPlan || [];
    if (steps.length === 0) {
      throw new Error('DeploymentPlanGenerationError: The analyzed project does not contain a model-generated deployment plan.');
    }

    // Save to DB
    analysis.deploymentPlan = { steps };
    await analysis.save();

    // Read current values of env variables from local codebase files ONLY if it is the local project
    const localEnvValues = isLocalProject(githubUrl) ? readLocalEnvValues() : {};

    return res.status(200).json({
      steps,
      envVariables: analysis.envVariables || [],
      envValues: localEnvValues,
      framework: analysis.framework,
      database: analysis.database
    });
  } catch (error) {
    console.error(`Deployment Plan Controller Error: ${error.message}`);
    return res.status(500).json({ error: `${error.message}` });
  }
};

export const triggerAutoDeployment = async (req, res) => {
  const { vercelToken, renderApiKey, githubUrl, config } = req.body;
  
  if (!githubUrl) {
    return res.status(400).json({ error: 'githubUrl is required' });
  }
  
  try {
    const result = await runDeploymentWorkflow(githubUrl, vercelToken, renderApiKey, config);
    const cleanProjName = (config?.projectName || 'cloudpilot-app').toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const status = {
      vercel: { 
        success: result.success, 
        url: result.vercelUrl, 
        error: null, 
        id: `mock_deploy_${cleanProjName}` 
      },
      render: { 
        success: result.success, 
        url: result.renderUrl, 
        error: null, 
        serviceId: `mock_render_${cleanProjName}`, 
        deployId: `mock_render_deploy_${cleanProjName}` 
      }
    };

    return res.status(200).json({ logs: result.logs, status });
  } catch (error) {
    console.error(`Auto-deployment Error: ${error.message}`);
    return res.status(500).json({ error: `Auto-deployment pipeline failed: ${error.message}` });
  }
};

// Global simulation counters to support mock healing in browser simulator
export const getDeploymentStatus = async (req, res) => {
  const { vercelDeploymentId, renderServiceId, renderDeployId, vercelToken, renderApiKey, githubUrl } = req.body;

  try {
    const prompt = `Check deployment status for vercel deployment '${vercelDeploymentId || 'none'}' and render service '${renderServiceId || 'none'}' and deploy ID '${renderDeployId || 'none'}'. 
    Vercel Token: '${vercelToken || ''}', Render API Key: '${renderApiKey || ''}', GitHub URL: '${githubUrl || ''}'.
    Call monitorDeployment to check the status.
    Return JSON format:
    {
      "vercel": { "status": "READY/ERROR/BUILDING", "error": "detailed message or null", "logs": ["array of logs if error"] },
      "render": { "status": "live/failed/created/build_in_progress", "error": "detailed message or null", "logs": ["array of logs if failed"] }
    }`;

    const response = await runAgentHelper(monitoringAgent, prompt, `monitor-${Date.now()}`);
    let parsed;
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsed = JSON.parse(response.substring(jsonStart, jsonEnd + 1));
      } else {
        throw new Error('No JSON object in response');
      }
    } catch (e) {
      throw new Error(`MonitoringStatusError: Failed to parse monitoring status from agent. Error: ${e.message}. Response: ${response}`);
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('[DeploymentStatus] Fetch error:', error);
    return res.status(500).json({ error: `${error.message}` });
  }
};

export const autoFixAndRedeploy = async (req, res) => {
  const { githubUrl, errorLogs, provider, vercelToken, renderApiKey, config, dryRun } = req.body;

  console.log(`[Auto-Fix] Initiating healing loop for ${provider} on ${githubUrl} (dryRun: ${!!dryRun})...`);

  try {
    const workspaceRoot = await getRepositoryPath(githubUrl);
    const filesContext = {};

    const readSafe = (relPath) => {
      const fullPath = path.join(workspaceRoot, relPath);
      if (fs.existsSync(fullPath)) {
        filesContext[relPath] = fs.readFileSync(fullPath, 'utf8').substring(0, 8000);
      }
    };

    readSafe('frontend/package.json');
    readSafe('backend/package.json');
    readSafe('package.json');

    let explanation = "";
    let solution = "";
    let filesChanged = [];

    if (dryRun) {
      const prompt = `We are running in DRY-RUN mode. DO NOT CALL ANY TOOLS (patchFile, gitCommitAndPush).
Analyze the build error logs:
${errorLogs}

Here are the file contexts:
${JSON.stringify(filesContext)}

Explain the issue and provide the solution and the file paths/contents you would change in a valid JSON:
{
  "explanation": "why it failed",
  "solution": "how to fix",
  "filesToChange": [
    {
      "path": "relative file path",
      "content": "proposed file content"
    }
  ]
}`;
      const response = await runAgentHelper(autoHealingAgent, prompt, `dryrun-${Date.now()}`);
      
      let parsed;
      try {
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          parsed = JSON.parse(response.substring(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("No JSON object in response");
        }
      } catch (err) {
        throw new Error(`SelfHealingError: Failed to parse dry-run solution from agent: ${err.message}. Response: ${response}`);
      }

      explanation = parsed.explanation;
      solution = parsed.solution;
      filesChanged = (parsed.filesToChange || []).map(f => f.path);
    } else {
      const prompt = `The build failed. Use your tools to read files, fix the files using patchFile tool, and commit/push using gitCommitAndPush tool.
Error logs:
${errorLogs}

Here are the local file contexts for reference:
${JSON.stringify(filesContext)}

After successful patching and pushing, return a JSON object:
{
  "explanation": "explanation of build failure",
  "solution": "fix applied",
  "filesChanged": ["array of paths changed"]
}`;
      const response = await runAgentHelper(autoHealingAgent, prompt, `liveheal-${Date.now()}`);
      
      let parsed;
      try {
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          parsed = JSON.parse(response.substring(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("No JSON object in response");
        }
      } catch (err) {
        throw new Error(`SelfHealingError: Failed to parse execution report from agent: ${err.message}. Response: ${response}`);
      }

      explanation = parsed.explanation;
      solution = parsed.solution;
      filesChanged = parsed.filesChanged || [];
    }

    return res.status(200).json({
      success: true,
      explanation,
      solution,
      filesChanged
    });
  } catch (error) {
    console.error('[Auto-Fix] Error:', error);
    return res.status(500).json({ error: `${error.message}` });
  }
};
