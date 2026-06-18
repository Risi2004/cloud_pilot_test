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

    CRITICAL INSTRUCTIONS:
    1. Under any circumstances, you MUST return a valid JSON object matching the schema below.
    2. Do not write any conversational text, introductions, questions, clarification requests, or explanations.
    3. Return ONLY the raw JSON object. Do NOT wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\`. Begin and end your response strictly with the JSON curly braces.

    Return a structured JSON description matching the following schema:
    {
      "vercelUrl": "previewUrl from createVercelProject",
      "renderUrl": "serviceUrl from createRenderService",
      "vercelDeploymentId": "deploymentId from createVercelProject",
      "renderServiceId": "serviceId from createRenderService",
      "renderDeployId": "deployId from createRenderService"
    }
  `,
  model: modelProvider
});
