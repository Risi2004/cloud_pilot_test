import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const getLocalRepoPath = (githubUrl) => {
  if (!githubUrl) return process.cwd();
  if (githubUrl.startsWith('local://') || githubUrl.startsWith('editor://') || githubUrl.includes('CloudPilot')) {
    return path.dirname(process.cwd());
  }
  const tempDir = path.join(process.cwd(), 'temp-clones');
  const repoName = githubUrl.split('/').pop().replace(/\.git$/, '');
  return path.join(tempDir, repoName);
};


// Helper to extract clean error string
const extractErr = (err) => {
  if (err.response?.data) {
    const data = err.response.data;
    if (data.error) {
      if (typeof data.error === 'object') {
        return data.error.message || JSON.stringify(data.error);
      }
      return data.error;
    }
    if (data.message) return data.message;
  }
  return err.message;
};

export const createVercelProjectTool = new FunctionTool({
  name: 'createVercelProject',
  description: 'Registers a new project on Vercel and triggers its initial build.',
  parameters: z.object({
    vercelToken: z.string().describe('Vercel API Token'),
    projectName: z.string().describe('Desired Vercel project name'),
    githubUrl: z.string().describe('Target GitHub Repository URL'),
    envVars: z.any().optional().describe('Key-Value dictionary of environment variables to inject')
  }),
  execute: async ({ vercelToken, projectName, githubUrl, envVars = {} }) => {
    const isMock = !vercelToken || vercelToken.startsWith('mock') || vercelToken === 'demo';
    const cleanName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const repoPath = githubUrl.replace('https://github.com/', '');

    if (isMock) {
      return {
        success: true,
        projectId: `mock_vercel_${cleanName}`,
        previewUrl: `https://${cleanName}-frontend.vercel.app`,
        deploymentId: `mock_deploy_${cleanName}`,
        logs: [
          '[Agent] [Simulation] Registered Vercel Project.',
          `[Agent] [Simulation] Injected: VITE_API_URL=${envVars.VITE_API_URL || 'http://localhost:5000'}`
        ]
      };
    }

    try {
      let projectData;
      let projectId;

      try {
        const projectRes = await axios.post('https://api.vercel.com/v9/projects', {
          name: `${cleanName}-frontend`,
          framework: 'vite',
          gitRepository: {
            type: 'github',
            repo: repoPath
          }
        }, {
          headers: { Authorization: `Bearer ${vercelToken}` }
        });
        projectData = projectRes.data;
        projectId = projectData.id;
      } catch (postErr) {
        const errCode = postErr.response?.data?.error?.code;
        if (postErr.response?.status === 409 || errCode === 'conflict' || errCode === 'project_already_exists') {
          const getRes = await axios.get(`https://api.vercel.com/v9/projects/${cleanName}-frontend`, {
            headers: { Authorization: `Bearer ${vercelToken}` }
          });
          projectData = getRes.data;
          projectId = projectData.id;
        } else {
          throw postErr;
        }
      }

      const repoId = projectData?.link?.repoId;
      if (!repoId) {
        throw new Error('Repository is not linked. Ensure your Vercel account is connected to GitHub.');
      }

      // Inject VITE_API_URL environment variable if present
      if (envVars.VITE_API_URL) {
        try {
          await axios.post(`https://api.vercel.com/v9/projects/${projectId}/env`, {
            key: 'VITE_API_URL',
            value: envVars.VITE_API_URL,
            type: 'plain',
            target: ['production', 'preview', 'development']
          }, {
            headers: { Authorization: `Bearer ${vercelToken}` }
          });
        } catch (envErr) {
          // If key exists, proceed
        }
      }

      // Trigger deployment build
      const deployRes = await axios.post('https://api.vercel.com/v13/deployments', {
        name: `${cleanName}-frontend`,
        project: `${cleanName}-frontend`,
        gitSource: {
          type: 'github',
          ref: 'main',
          repoId: repoId
        }
      }, {
        headers: { Authorization: `Bearer ${vercelToken}` }
      });

      return {
        success: true,
        projectId,
        previewUrl: `https://${deployRes.data.url}`,
        deploymentId: deployRes.data.id,
        logs: ['[Agent] Vercel project created and initial build triggered successfully.']
      };
    } catch (err) {
      return { success: false, error: extractErr(err) };
    }
  }
});

export const createRenderServiceTool = new FunctionTool({
  name: 'createRenderService',
  description: 'Registers a web service on Render pointing to a Node/Express backend path.',
  parameters: z.object({
    renderApiKey: z.string().describe('Render developer API key'),
    projectName: z.string().describe('Service name identifier'),
    githubUrl: z.string().describe('GitHub repository repository clone URL'),
    envVars: z.any().optional().describe('Environmental key-value records'),
    plan: z.string().default('free').describe('Render service plan tier')
  }),
  execute: async ({ renderApiKey, projectName, githubUrl, envVars = {}, plan = 'free' }) => {
    const isMock = !renderApiKey || renderApiKey.startsWith('mock') || renderApiKey === 'demo';
    const cleanName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (isMock) {
      return {
        success: true,
        serviceId: `mock_render_${cleanName}`,
        serviceUrl: `https://${cleanName}-backend.onrender.com`,
        deployId: `mock_render_deploy_${cleanName}`,
        logs: [
          '[Agent] [Simulation] Owner ID verified (owner_mock_12345)',
          `[Agent] [Simulation] Configured Render Service '${cleanName}-backend' on free plan.`
        ]
      };
    }

    try {
      const ownersRes = await axios.get('https://api.render.com/v1/owners', {
        headers: { Authorization: `Bearer ${renderApiKey}` }
      });
      const ownerId = ownersRes.data?.[0]?.owner?.id;
      if (!ownerId) throw new Error('No owners found in Render dashboard credentials.');

      const envArray = Object.entries(envVars).map(([key, value]) => ({ key, value }));

      const renderRes = await axios.post('https://api.render.com/v1/services', {
        type: 'web_service',
        name: `${cleanName}-backend`,
        ownerId,
        repo: githubUrl,
        branch: 'main',
        rootDir: 'backend',
        plan,
        envVars: envArray,
        serviceDetails: {
          env: 'node',
          envSpecificDetails: {
            buildCommand: 'npm install',
            startCommand: 'npm start'
          }
        }
      }, {
        headers: {
          Authorization: `Bearer ${renderApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const serviceId = renderRes.data?.id || renderRes.data?.service?.id;
      const serviceUrl = renderRes.data?.url || renderRes.data?.service?.url;

      let deployId = null;
      try {
        const deploysRes = await axios.get(`https://api.render.com/v1/services/${serviceId}/deploys?limit=1`, {
          headers: { Authorization: `Bearer ${renderApiKey}` }
        });
        deployId = deploysRes.data?.[0]?.deploy?.id || deploysRes.data?.[0]?.id;
      } catch (e) {}

      return {
        success: true,
        serviceId,
        serviceUrl,
        deployId,
        logs: [`[Agent] Render service '${cleanName}-backend' configured successfully.`]
      };
    } catch (err) {
      return { success: false, error: extractErr(err) };
    }
  }
});

export const createMongoClusterTool = new FunctionTool({
  name: 'createMongoCluster',
  description: 'Provisions a managed MongoDB cluster resource (simulated).',
  parameters: z.object({
    clusterName: z.string().describe('Atlas cluster name identifier'),
    provider: z.string().default('AWS').describe('Cloud host provider, e.g. AWS or GCP'),
    region: z.string().default('US_EAST_1').describe('Hosting cloud datacenter region')
  }),
  execute: async ({ clusterName, provider, region }) => {
    // MongoDB Atlas API provisioning is mocked to simulate developer database onboarding
    return {
      success: true,
      clusterId: `mock_atlas_${clusterName}`,
      connectionString: `mongodb+srv://admin:healedPassword@${clusterName}.mongodb.net/prod-db`,
      logs: [
        `[Agent] [Simulation] Creating cluster '${clusterName}' on ${provider} (${region})...`,
        `[Agent] [Simulation] Cluster provisioning initialized. Live in 3 minutes.`
      ]
    };
  }
});

export const monitorDeploymentTool = new FunctionTool({
  name: 'monitorDeployment',
  description: 'Polls build completion status logs from Render and Vercel services.',
  parameters: z.object({
    vercelDeploymentId: z.string().optional().describe('Vercel deployment resource uuid'),
    renderServiceId: z.string().optional().describe('Render service configuration ID'),
    renderDeployId: z.string().optional().describe('Render deploy process ID'),
    vercelToken: z.string().optional().describe('Vercel Auth Token'),
    renderApiKey: z.string().optional().describe('Render API Key'),
    githubUrl: z.string().describe('Target repository URL, used to handle simulation retry state')
  }),
  execute: async ({ vercelDeploymentId, renderServiceId, renderDeployId, vercelToken, renderApiKey, githubUrl }) => {
    const isMockVercel = !vercelToken || vercelToken.startsWith('mock') || vercelToken === 'demo';
    const isMockRender = !renderApiKey || renderApiKey.startsWith('mock') || renderApiKey === 'demo';

    const result = {
      vercel: { status: 'READY', error: null, logs: [] },
      render: { status: 'live', error: null, logs: [] }
    };

    if (vercelDeploymentId) {
      if (isMockVercel) {
        let hasReactRouter = false;
        try {
          const workspaceRoot = getLocalRepoPath(githubUrl);
          const pkgPath = path.join(workspaceRoot, 'frontend', 'package.json');
          if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (pkg.dependencies && pkg.dependencies['react-router-dom']) {
              hasReactRouter = true;
            }
          }
        } catch (e) {
          // Ignore read error
        }

        if (!hasReactRouter) {
          const failLogs = [
            "vite v5.2.11 building for production...",
            "transforming... [12/98]",
            "Error: Cannot find module 'react-router-dom' or its corresponding type declarations.",
            "Error: Vercel build execution failed with exit code 1."
          ];
          result.vercel = {
            status: 'ERROR',
            error: "Build Failed: Cannot find module 'react-router-dom'",
            logs: failLogs
          };
        } else {
          result.vercel = {
            status: 'READY',
            error: null,
            logs: [
              "vite v5.2.11 building for production...",
              "✓ transform code chunks successfully",
              "✓ render page chunks optimized",
              "✓ upload build outputs package to Vercel CDN",
              "✓ Deploy succeeded! Live URL generated."
            ]
          };
        }
      } else {
        try {
          const res = await axios.get(`https://api.vercel.com/v13/deployments/${vercelDeploymentId}`, {
            headers: { Authorization: `Bearer ${vercelToken}` }
          });
          const status = res.data?.status;
          result.vercel.status = status;
          if (status === 'ERROR') {
            const logsRes = await axios.get(`https://api.vercel.com/v3/deployments/${vercelDeploymentId}/events?limit=40`, {
              headers: { Authorization: `Bearer ${vercelToken}` }
            });
            result.vercel.error = res.data.error?.message || 'Vercel build failed';
            result.vercel.logs = logsRes.data.map(evt => evt.text || evt.message).filter(Boolean);
          }
        } catch (e) {
          result.vercel = { status: 'ERROR', error: e.message, logs: [] };
        }
      }
    }

    // Render check
    if (renderServiceId) {
      if (isMockRender) {
        result.render = {
          status: 'live',
          error: null,
          logs: ['Server running in production mode on port 10000', '✓ Live.']
        };
      } else {
        try {
          let activeDeployId = renderDeployId;
          if (!activeDeployId) {
            const deploysRes = await axios.get(`https://api.render.com/v1/services/${renderServiceId}/deploys?limit=1`, {
              headers: { Authorization: `Bearer ${renderApiKey}` }
            });
            activeDeployId = deploysRes.data?.[0]?.deploy?.id || deploysRes.data?.[0]?.id;
          }
          if (activeDeployId) {
            const deployRes = await axios.get(`https://api.render.com/v1/services/${renderServiceId}/deploys/${activeDeployId}`, {
              headers: { Authorization: `Bearer ${renderApiKey}` }
            });
            const status = deployRes.data?.status;
            result.render.status = status;
            if (['build_failed', 'update_failed', 'pre_deploy_failed'].includes(status)) {
              result.render.error = `Render Deploy Failed with status: ${status}`;
              try {
                const logsRes = await axios.get(`https://api.render.com/v1/services/${renderServiceId}/logs?limit=40`, {
                  headers: { Authorization: `Bearer ${renderApiKey}` }
                });
                result.render.logs = logsRes.data.map(l => l.text || l.message || JSON.stringify(l));
              } catch (logErr) {
                result.render.logs = ["Build failed. Check Render Dashboard for detailed output logs."];
              }
            }
          }
        } catch (e) {
          result.render = { status: 'failed', error: e.message, logs: [] };
        }
      }
    }

    return result;
  }
});
