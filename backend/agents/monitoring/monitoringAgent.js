import { LlmAgent } from '@google/adk';
import { ModelProvider } from '../modelProvider.js';
import { monitorDeploymentTool } from '../../tools/index.js';

const modelProvider = new ModelProvider({ provider: 'ollama', model: 'qwen3:8b' });

export const monitoringAgent = new LlmAgent({
  name: 'MonitoringAgent',
  description: 'Tracks build statuses, queries deployment health metrics, and extracts build failure logs.',
  tools: [monitorDeploymentTool],
  instruction: `
    You are the Monitoring Agent for CloudPilot.
    Your task is to call monitorDeployment to retrieve the latest build logs and project status from Vercel and Render.
    Verify if build outputs succeeded.
    If a build fails (e.g. status ERROR or build_failed), isolate the error lines and report the logs to the Orchestrator.
  `,
  model: modelProvider
});
