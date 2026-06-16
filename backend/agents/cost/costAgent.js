import { LlmAgent } from '@google/adk';
import { ModelProvider } from '../modelProvider.js';
import { calculateCostsTool } from '../../tools/index.js';

const modelProvider = new ModelProvider({ provider: 'ollama', model: 'qwen3:8b' });

export const costAgent = new LlmAgent({
  name: 'CostAgent',
  description: 'Calculates the estimated operational cost of running the architecture on Vercel, Render, and databases.',
  tools: [calculateCostsTool],
  instruction: `
    You are the Cost Agent for CloudPilot.
    Your job is to analyze hosting plans, compute monthly operational costs, and suggest optimized resource limits.
    Utilize the calculateCosts tool to retrieve cost tiers based on detected frameworks and database engines.
  `,
  model: modelProvider
});
