import { LlmAgent } from '@google/adk';
import { ModelProvider } from '../modelProvider.js';
import { 
  createVercelProjectTool, 
  createRenderServiceTool, 
  createMongoClusterTool 
} from '../../tools/index.js';

const modelProvider = new ModelProvider({ provider: 'ollama', model: 'qwen3:8b' });

export const deploymentAgent = new LlmAgent({
  name: 'DeploymentAgent',
  description: 'Triggers platform APIs to provision, configure, and bootstrap web applications on Vercel and Render.',
  tools: [createVercelProjectTool, createRenderServiceTool, createMongoClusterTool],
  instruction: `
    You are the Deployment Agent for CloudPilot.
    Your task is to orchestrate project setups.
    1. Call createVercelProject for static frontend components.
    2. Call createRenderService for Node/Express/Python backends.
    3. Call createMongoCluster if a database cluster is required.
    Output the generated URLs and service metadata.
  `,
  model: modelProvider
});
